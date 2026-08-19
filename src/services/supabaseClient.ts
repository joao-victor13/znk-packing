import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  PurchaseOrder, 
  OrderItem, 
  Supplier, 
  OrderStatus, 
  StoreSettings, 
  CategoryItem,
  SystemUser,
  UserRole
} from '../types';
import { DEFAULT_USERS } from '../data/initialCustomization';

// Read Vite environment variables safely with rock-solid fallback
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hwtgofjeglrmbykegsru.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGdvZmplZ2xybWJ5a2Vnc3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODUyMTcsImV4cCI6MjEwMjU2MTIxN30.49X4mObYjmK3XCOOQbLnCNEapbunANeCf3AWhO7GA3A';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Default admin UUID in PostgreSQL seed
export const DEFAULT_USER_UUID = 'a0000000-0000-0000-0000-000000000001';
export const DEFAULT_SUPPLIER_UUID = 'b0000000-0000-0000-0000-000000000001';

// Helper to check if string is a valid UUID
export function isUuid(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// Helper to convert frontend OrderStatus to DB OrderStatus
function toDbStatus(status: OrderStatus): string {
  switch (status) {
    case 'draft': return 'DRAFT';
    case 'pending': return 'PENDING';
    case 'approved': return 'APPROVED';
    case 'in_transit': return 'IN_TRANSIT';
    case 'delivered': return 'DELIVERED';
    case 'cancelled': return 'CANCELLED';
    default: return 'PENDING';
  }
}

function fromDbStatus(status: string): OrderStatus {
  switch (status?.toUpperCase()) {
    case 'DRAFT': return 'draft';
    case 'PENDING': return 'pending';
    case 'APPROVED': return 'approved';
    case 'IN_TRANSIT': return 'in_transit';
    case 'DELIVERED': return 'delivered';
    case 'CANCELLED': return 'cancelled';
    default: return 'pending';
  }
}

// Role conversions (Admin, Vendedor(a), Estoquista)
export function toDbRole(role?: UserRole): string {
  switch (role) {
    case 'admin': return 'ADMIN';
    case 'seller': return 'BUYER';
    case 'stockist': return 'VIEWER';
    default: return 'BUYER';
  }
}

export function fromDbRole(role?: string): UserRole {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'admin';
    case 'SELLER':
    case 'BUYER': return 'seller';
    case 'STOCKIST':
    case 'VIEWER':
    case 'PRODUCTION_MANAGER':
    case 'FINANCE': return 'stockist';
    default: return 'seller';
  }
}

// -----------------------------------------------------------------------------
// USERS SERVICE (MULTI-DEVICE AUTH & USER MANAGEMENT)
// -----------------------------------------------------------------------------

export async function fetchUsersFromSupabase(): Promise<SystemUser[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] Failed to fetch users:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      const defaultMatch = DEFAULT_USERS.find(
        du => du.id === row.id || du.email.toLowerCase() === row.email.toLowerCase()
      );

      const parsedRole = fromDbRole(row.role);
      return {
        id: row.id,
        name: row.name || 'Colaborador',
        email: row.email,
        password: row.password_hash || defaultMatch?.password || '123456',
        avatarBg: defaultMatch?.avatarBg || 'bg-brand-600',
        role: parsedRole,
        themePreference: defaultMatch?.themePreference || 'system',
        customPermissions: defaultMatch?.customPermissions,
      };
    });
  } catch (err) {
    console.error('[Supabase] Exception fetching users:', err);
    return null;
  }
}

export async function saveUserToSupabase(user: SystemUser): Promise<SystemUser | null> {
  if (!supabase) return null;

  try {
    const payload: any = {
      name: user.name,
      email: user.email.toLowerCase().trim(),
      password_hash: user.password || '123456',
      role: toDbRole(user.role),
      role_title: user.role === 'admin' ? 'Administrador' : user.role === 'seller' ? 'Vendedor (a)' : 'Estoquista',
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (isUuid(user.id)) {
      payload.id = user.id;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'email' })
      .select('*')
      .single();

    if (error) {
      console.error('[Supabase] Error saving user:', error.message);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password_hash || user.password,
      avatarBg: user.avatarBg || 'bg-brand-600',
      role: fromDbRole(data.role),
      themePreference: user.themePreference || 'system',
      customPermissions: user.customPermissions,
    };
  } catch (err) {
    console.error('[Supabase] Exception saving user:', err);
    return null;
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Try hard delete first
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (!error) {
      return true;
    }

    // 2. If restricted by foreign keys (e.g. user created orders), soft delete
    console.warn('[Supabase] Hard delete restricted by foreign key, applying soft delete (is_active = false):', error.message);
    const { error: softErr } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (softErr) {
      console.error('[Supabase] Error soft deleting user:', softErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Exception deleting user:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// SUPPLIERS SERVICE
// -----------------------------------------------------------------------------

export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Failed to fetch suppliers:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.corporate_name || row.trade_name,
      tradeName: row.trade_name,
      corporateName: row.corporate_name || row.trade_name,
      cnpj: row.cnpj_cpf,
      contactName: row.contact_name,
      phone: row.phone || row.whatsapp || '',
      email: row.email,
      city: row.city,
      state: row.state,
      category: row.category_specialty,
      categorySpecialty: row.category_specialty,
      paymentTerms: row.default_payment_terms,
      defaultPaymentTerms: row.default_payment_terms,
      averageLeadDays: row.average_lead_days || 15,
      rating: Number(row.rating) || 5.0,
      notes: row.notes || '',
    }));
  } catch (err) {
    console.error('[Supabase] Exception fetching suppliers:', err);
    return null;
  }
}

export async function saveSupplierToSupabase(supplier: Supplier): Promise<Supplier | null> {
  if (!supabase) return null;

  try {
    const idToUse = isUuid(supplier.id) ? supplier.id : undefined;

    const payload: any = {
      trade_name: supplier.tradeName,
      corporate_name: supplier.corporateName || supplier.name || supplier.tradeName,
      cnpj_cpf: supplier.cnpj,
      contact_name: supplier.contactName,
      phone: supplier.phone,
      whatsapp: supplier.phone,
      email: supplier.email,
      city: supplier.city || 'São Paulo',
      state: supplier.state || 'SP',
      category_specialty: supplier.categorySpecialty || supplier.category || 'Confecção Geral',
      default_payment_terms: supplier.defaultPaymentTerms || supplier.paymentTerms || '30 DDL',
      average_lead_days: Number(supplier.averageLeadDays) || 15,
      rating: Number(supplier.rating) || 5.0,
      is_active: true,
      notes: supplier.notes || '',
      updated_at: new Date().toISOString(),
    };

    if (idToUse) {
      payload.id = idToUse;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .upsert(payload, { onConflict: 'cnpj_cpf' })
      .select('*')
      .single();

    if (error) {
      console.error('[Supabase] Error saving supplier:', error.message);
      return null;
    }

    return {
      id: data.id,
      name: data.corporate_name || data.trade_name,
      tradeName: data.trade_name,
      corporateName: data.corporate_name || data.trade_name,
      cnpj: data.cnpj_cpf,
      contactName: data.contact_name,
      phone: data.phone || data.whatsapp || '',
      email: data.email,
      city: data.city,
      state: data.state,
      category: data.category_specialty,
      categorySpecialty: data.category_specialty,
      paymentTerms: data.default_payment_terms,
      defaultPaymentTerms: data.default_payment_terms,
      averageLeadDays: data.average_lead_days || 15,
      rating: Number(data.rating) || 5.0,
      notes: data.notes || '',
    };
  } catch (err) {
    console.error('[Supabase] Exception saving supplier:', err);
    return null;
  }
}

export async function deleteSupplierFromSupabase(supplierId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Try hard delete first
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);

    if (!error) {
      return true;
    }

    // 2. If restricted by foreign keys (supplier has purchase orders), perform soft delete (is_active = false)
    console.warn('[Supabase] Hard delete supplier restricted by foreign keys, applying soft delete (is_active = false):', error.message);
    const { error: softErr } = await supabase
      .from('suppliers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplierId);

    if (softErr) {
      console.error('[Supabase] Error soft deleting supplier:', softErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Exception deleting supplier:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// PURCHASE ORDERS SERVICE
// -----------------------------------------------------------------------------

export async function fetchOrdersFromSupabase(): Promise<PurchaseOrder[] | null> {
  if (!supabase) return null;

  try {
    const { data: orderRows, error: orderError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers:supplier_id (
          id,
          trade_name,
          corporate_name,
          cnpj_cpf,
          contact_name,
          phone,
          email
        ),
        items:purchase_order_items (
          id,
          sku,
          description,
          category_id,
          size_grid_type,
          size,
          color,
          color_hex,
          quantity,
          unit_cost,
          suggested_price,
          subtotal,
          notes
        )
      `)
      .order('issue_date', { ascending: false });

    if (orderError) {
      console.warn('[Supabase] Failed to fetch orders:', orderError.message);
      return null;
    }

    if (!orderRows) return [];

    return orderRows.map((row: any) => {
      const sup = row.suppliers || {};
      const itemsList: OrderItem[] = (row.items || []).map((item: any) => {
        const uCost = Number(item.unit_cost) || 0;
        const sPrice = item.suggested_price ? Number(item.suggested_price) : undefined;
        const dPercent = item.discount_percent !== undefined && item.discount_percent !== null 
          ? Number(item.discount_percent) 
          : (item.discountPercent ? Number(item.discountPercent) : 0);
        const mk = item.markup !== undefined && item.markup !== null
          ? Number(item.markup)
          : (uCost > 0 && sPrice ? Math.round((sPrice / uCost) * 100) / 100 : 2.2);

        return {
          id: item.id,
          sku: item.sku,
          description: item.description,
          category: 'Vestidos', // Standard fallback category
          sizeGridType: item.size_grid_type || 'letter',
          size: item.size,
          color: item.color,
          colorHex: item.color_hex || undefined,
          quantity: item.quantity,
          unitCost: uCost,
          discountPercent: dPercent,
          markup: mk,
          suggestedPrice: sPrice,
          subtotal: Number(item.subtotal) || 0,
          notes: item.notes || undefined,
        };
      });

      return {
        id: row.id,
        orderNumber: row.order_number,
        supplierId: row.supplier_id,
        supplierName: sup.corporate_name || sup.trade_name || 'Fornecedor',
        supplierTradeName: sup.trade_name || sup.corporate_name,
        supplierCnpj: sup.cnpj_cpf,
        supplierContact: sup.contact_name,
        supplierPhone: sup.phone,
        supplierEmail: sup.email,
        status: fromDbStatus(row.status),
        collection: row.collection,
        issueDate: row.issue_date,
        expectedDeliveryDate: row.expected_delivery_date,
        actualDeliveryDate: row.actual_delivery_date || undefined,
        paymentTerms: row.payment_terms,
        shippingCarrier: row.shipping_carrier || undefined,
        shippingCost: Number(row.shipping_cost) || 0,
        discount: Number(row.discount) || 0,
        discountPercentage: Number(row.discount_percentage) || 0,
        defaultMarkup: Number(row.default_markup) || 2.2,
        totalPieces: row.total_pieces,
        totalAmount: Number(row.total_amount) || 0,
        notes: row.notes || undefined,
        items: itemsList,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  } catch (err) {
    console.error('[Supabase] Exception fetching orders:', err);
    return null;
  }
}

export async function saveOrderToSupabase(order: PurchaseOrder, userId?: string): Promise<PurchaseOrder | null> {
  if (!supabase) return null;

  try {
    // 1. Ensure user_id exists in Supabase users table to prevent Foreign Key Violation (Error 23503)
    let validUserId = DEFAULT_USER_UUID;
    if (isUuid(userId)) {
      const { data: userCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .limit(1);

      if (userCheck && userCheck.length > 0) {
        validUserId = userCheck[0].id;
      }
    }

    const orderDbId = isUuid(order.id) ? order.id : undefined;

    // 2. Validate supplier_id exists in Supabase
    let validSupplierId = DEFAULT_SUPPLIER_UUID;
    if (isUuid(order.supplierId)) {
      const { data: supCheck } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', order.supplierId)
        .limit(1);

      if (supCheck && supCheck.length > 0) {
        validSupplierId = supCheck[0].id;
      }
    } else {
      // Look up supplier by CNPJ or name if possible
      const { data: foundSup } = await supabase
        .from('suppliers')
        .select('id')
        .or(`cnpj_cpf.eq.${order.supplierCnpj || ''},trade_name.ilike.%${order.supplierTradeName || order.supplierName}%`)
        .limit(1);

      if (foundSup && foundSup.length > 0) {
        validSupplierId = foundSup[0].id;
      } else {
        const { data: firstSup } = await supabase.from('suppliers').select('id').limit(1);
        validSupplierId = firstSup?.[0]?.id || DEFAULT_SUPPLIER_UUID;
      }
    }

    // 3. Upsert order header
    const orderPayload: any = {
      order_number: order.orderNumber,
      supplier_id: validSupplierId,
      user_id: validUserId,
      status: toDbStatus(order.status),
      collection: order.collection,
      issue_date: order.issueDate,
      expected_delivery_date: order.expectedDeliveryDate,
      actual_delivery_date: order.actualDeliveryDate || null,
      payment_terms: order.paymentTerms,
      shipping_carrier: order.shippingCarrier || null,
      shipping_cost: Number(order.shippingCost) || 0,
      discount: Number(order.discount) || 0,
      discount_percentage: Number(order.discountPercentage) || 0,
      default_markup: Number(order.defaultMarkup) || 2.2,
      total_pieces: Number(order.totalPieces) || 0,
      total_amount: Number(order.totalAmount) || 0,
      notes: order.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (orderDbId) {
      orderPayload.id = orderDbId;
    }

    let savedOrder: any = null;
    const { data: upsertData, error: orderError } = await supabase
      .from('purchase_orders')
      .upsert(orderPayload, { onConflict: 'order_number' })
      .select(`
        *,
        suppliers:supplier_id (
          id,
          trade_name,
          corporate_name,
          cnpj_cpf,
          contact_name,
          phone,
          email
        )
      `)
      .single();

    if (orderError) {
      // Fallback in case columns do not exist in DB yet
      console.warn('[Supabase] Retrying order header save without optional columns:', orderError.message);
      delete orderPayload.discount_percentage;
      delete orderPayload.default_markup;

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('purchase_orders')
        .upsert(orderPayload, { onConflict: 'order_number' })
        .select(`
          *,
          suppliers:supplier_id (
            id,
            trade_name,
            corporate_name,
            cnpj_cpf,
            contact_name,
            phone,
            email
          )
        `)
        .single();

      if (fallbackError) {
        console.error('[Supabase] Error saving order header:', fallbackError.message);
        return null;
      }
      savedOrder = fallbackData;
    } else {
      savedOrder = upsertData;
    }

    const finalOrderId = savedOrder.id;

    // 4. Clean replace items
    await supabase
      .from('purchase_order_items')
      .delete()
      .eq('purchase_order_id', finalOrderId);

    let savedItems: OrderItem[] = [];
    if (order.items && order.items.length > 0) {
      const itemsPayload = order.items.map(item => ({
        purchase_order_id: finalOrderId,
        sku: item.sku || 'REF-GEN',
        description: item.description || 'Peça de Vestuário',
        size_grid_type: item.sizeGridType || 'letter',
        size: item.size || 'Único',
        color: item.color || 'Padrão',
        color_hex: item.colorHex || null,
        quantity: Number(item.quantity) || 1,
        unit_cost: Number(item.unitCost) || 0,
        discount_percent: Number(item.discountPercent) || 0,
        markup: Number(item.markup) || 2.2,
        suggested_price: item.suggestedPrice ? Number(item.suggestedPrice) : null,
        subtotal: Number(item.subtotal) || 0,
        notes: item.notes || null,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsPayload)
        .select('*');

      if (itemsError) {
        console.warn('[Supabase] Retrying items save with standard columns:', itemsError.message);
        const fallbackItemsPayload = itemsPayload.map(({ discount_percent, markup, ...rest }: any) => rest);
        const { data: fallbackInserted, error: fallbackItemsErr } = await supabase
          .from('purchase_order_items')
          .insert(fallbackItemsPayload)
          .select('*');

        if (fallbackItemsErr) {
          console.error('[Supabase] Error saving order items fallback:', fallbackItemsErr.message);
        } else if (fallbackInserted) {
          savedItems = fallbackInserted.map((item: any, idx: number) => ({
            id: item.id,
            sku: item.sku,
            description: item.description,
            category: item.description || 'Vestidos',
            sizeGridType: item.size_grid_type || 'letter',
            size: item.size,
            color: item.color,
            colorHex: item.color_hex || undefined,
            quantity: item.quantity,
            unitCost: Number(item.unit_cost) || 0,
            discountPercent: order.items[idx]?.discountPercent || 0,
            markup: order.items[idx]?.markup || 2.2,
            suggestedPrice: item.suggested_price ? Number(item.suggested_price) : undefined,
            subtotal: Number(item.subtotal) || 0,
            notes: item.notes || undefined,
          }));
        }
      } else if (insertedItems) {
        savedItems = insertedItems.map((item: any, idx: number) => ({
          id: item.id,
          sku: item.sku,
          description: item.description,
          category: item.description || 'Vestidos',
          sizeGridType: item.size_grid_type || 'letter',
          size: item.size,
          color: item.color,
          colorHex: item.color_hex || undefined,
          quantity: item.quantity,
          unitCost: Number(item.unit_cost) || 0,
          discountPercent: item.discount_percent !== undefined ? Number(item.discount_percent) : (order.items[idx]?.discountPercent || 0),
          markup: item.markup !== undefined ? Number(item.markup) : (order.items[idx]?.markup || 2.2),
          suggestedPrice: item.suggested_price ? Number(item.suggested_price) : undefined,
          subtotal: Number(item.subtotal) || 0,
          notes: item.notes || undefined,
        }));
      }
    }

    const sup = savedOrder.suppliers || {};
    return {
      id: savedOrder.id,
      orderNumber: savedOrder.order_number,
      supplierId: savedOrder.supplier_id,
      supplierName: sup.corporate_name || sup.trade_name || order.supplierName,
      supplierTradeName: sup.trade_name || sup.corporate_name || order.supplierTradeName,
      supplierCnpj: sup.cnpj_cpf || order.supplierCnpj,
      supplierContact: sup.contact_name || order.supplierContact,
      supplierPhone: sup.phone || order.supplierPhone,
      supplierEmail: sup.email || order.supplierEmail,
      status: fromDbStatus(savedOrder.status),
      collection: savedOrder.collection,
      issueDate: savedOrder.issue_date,
      expectedDeliveryDate: savedOrder.expected_delivery_date,
      actualDeliveryDate: savedOrder.actual_delivery_date || undefined,
      paymentTerms: savedOrder.payment_terms,
      shippingCarrier: savedOrder.shipping_carrier || undefined,
      shippingCost: Number(savedOrder.shipping_cost) || 0,
      discount: Number(savedOrder.discount) || 0,
      discountPercentage: Number(savedOrder.discount_percentage) || order.discountPercentage || 0,
      defaultMarkup: Number(savedOrder.default_markup) || order.defaultMarkup || 2.2,
      totalPieces: Number(savedOrder.total_pieces) || 0,
      totalAmount: Number(savedOrder.total_amount) || 0,
      notes: savedOrder.notes || undefined,
      items: savedItems.length > 0 ? savedItems : order.items,
      createdAt: savedOrder.created_at,
      updatedAt: savedOrder.updated_at,
    };
  } catch (err) {
    console.error('[Supabase] Exception saving order:', err);
    return null;
  }
}

export async function updateOrderStatusInSupabase(orderId: string, status: OrderStatus): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: toDbStatus(status),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('[Supabase] Error updating order status:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception updating status:', err);
    return false;
  }
}

export async function deleteOrderFromSupabase(orderId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Delete associated items first
    await supabase
      .from('purchase_order_items')
      .delete()
      .eq('purchase_order_id', orderId);

    // 2. Delete order header
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('[Supabase] Error deleting order:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception deleting order:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// STORE SETTINGS SERVICE
// -----------------------------------------------------------------------------

export async function fetchStoreSettingsFromSupabase(): Promise<StoreSettings | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      storeName: data.brand_name || 'ZNK Packing',
      tagline: data.brand_slogan || 'Gestão de Pedidos de Compra & Confecção Feminina',
      legalName: data.legal_name || 'ZNK Packing Comércio & Confecção de Roupas Femininas Ltda',
      cnpj: data.cnpj || '42.190.876/0001-33',
      email: data.purchasing_email || 'compras@znkpacking.com.br',
      phone: data.whatsapp_business || '(11) 97654-3210',
      address: data.showroom_address || 'Rua Oscar Freire, 1420 - Jardins',
      city: data.city || 'São Paulo',
      state: data.state || 'SP',
      currencySymbol: data.currency_symbol || 'R$',
      footerNote: data.legal_footer_notes || 'Ordem de Compra oficial ZNK Packing - Sujeita aos termos e controle de qualidade.',
      logoIcon: 'Package',
    };
  } catch (err) {
    console.error('[Supabase] Exception fetching store settings:', err);
    return null;
  }
}

export async function saveStoreSettingsToSupabase(settings: StoreSettings): Promise<boolean> {
  if (!supabase) return false;

  try {
    const payload = {
      brand_name: settings.storeName,
      brand_slogan: settings.tagline,
      legal_name: settings.legalName,
      cnpj: settings.cnpj,
      purchasing_email: settings.email,
      whatsapp_business: settings.phone,
      showroom_address: settings.address,
      city: settings.city,
      state: settings.state,
      currency_symbol: settings.currencySymbol || 'R$',
      legal_footer_notes: settings.footerNote,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('store_settings')
      .upsert(payload, { onConflict: 'cnpj' });

    if (error) {
      console.error('[Supabase] Error saving store settings:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception saving store settings:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// CATEGORIES SERVICE
// -----------------------------------------------------------------------------

// Clean badge styling to ensure length < 30 chars for PostgreSQL VARCHAR(30)
function cleanBadgeStyle(str?: string, defaultVal: string = ''): string {
  if (!str) return defaultVal;
  // Take first clean class name before dark mode or truncate safely to 28 chars
  const first = str.split(' ')[0];
  return first.length <= 30 ? first : str.substring(0, 30);
}

export async function fetchCategoriesFromSupabase(): Promise<CategoryItem[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      badgeBg: row.badge_bg || 'bg-stone-100',
      badgeText: row.badge_text || 'text-stone-800',
      badgeBorder: row.badge_border || 'border-stone-200',
    }));
  } catch (err) {
    console.error('[Supabase] Exception fetching categories:', err);
    return null;
  }
}

export async function saveCategoryToSupabase(cat: CategoryItem): Promise<CategoryItem | null> {
  if (!supabase) return null;

  try {
    const slug = cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const payload: any = {
      name: cat.name,
      slug: slug || `cat-${Date.now()}`,
      badge_bg: cleanBadgeStyle(cat.badgeBg, 'bg-stone-100'),
      badge_text: cleanBadgeStyle(cat.badgeText, 'text-stone-800'),
      badge_border: cleanBadgeStyle(cat.badgeBorder, 'border-stone-200'),
      is_active: true,
    };
    if (isUuid(cat.id)) {
      payload.id = cat.id;
    }

    const { data, error } = await supabase
      .from('categories')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .single();

    if (error) {
      console.error('[Supabase] Error saving category:', error.message);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      badgeBg: data.badge_bg,
      badgeText: data.badge_text,
      badgeBorder: data.badge_border,
    };
  } catch (err) {
    console.error('[Supabase] Exception saving category:', err);
    return null;
  }
}

export async function deleteCategoryFromSupabase(categoryId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Try hard delete first
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (!error) {
      return true;
    }

    // 2. If restricted by foreign keys, soft delete
    console.warn('[Supabase] Hard delete category restricted by relations, applying soft delete (is_active = false):', error.message);
    const { error: softErr } = await supabase
      .from('categories')
      .update({
        is_active: false
      })
      .eq('id', categoryId);

    if (softErr) {
      console.error('[Supabase] Error soft deleting category:', softErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Exception deleting category:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// REALTIME SUBSCRIPTIONS (MULTI-USER / MULTI-DEVICE INSTANT SYNC)
// -----------------------------------------------------------------------------

export function subscribeToOrders(callback: () => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime_orders_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => {
      callback();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_order_items' }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToSuppliers(callback: () => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime_suppliers_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToUsers(callback: () => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime_users_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToStoreSettings(callback: () => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime_store_settings_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToCategories(callback: () => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime_categories_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
