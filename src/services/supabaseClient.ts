import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  PurchaseOrder, 
  OrderItem, 
  Supplier, 
  OrderStatus, 
  StoreSettings, 
  CategoryItem 
} from '../types';

// Read Vite environment variables safely
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hwtgofjeglrmbykegsru.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGdvZmplZ2xybWJ5a2Vnc3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODUyMTcsImV4cCI6MjEwMjU2MTIxN30.49X4mObYjmK3XCOOQbLnCNEapbunANeCf3AWhO7GA3A';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Default admin UUID in PostgreSQL seed
export const DEFAULT_USER_UUID = 'a0000000-0000-0000-0000-000000000001';

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

// -----------------------------------------------------------------------------
// SUPPLIERS SERVICE
// -----------------------------------------------------------------------------

export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
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
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);

    if (error) {
      console.error('[Supabase] Error deleting supplier:', error.message);
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
      const itemsList: OrderItem[] = (row.items || []).map((item: any) => ({
        id: item.id,
        sku: item.sku,
        description: item.description,
        category: 'Confecção',
        sizeGridType: item.size_grid_type || 'letter',
        size: item.size,
        color: item.color,
        colorHex: item.color_hex || undefined,
        quantity: item.quantity,
        unitCost: Number(item.unit_cost) || 0,
        suggestedPrice: item.suggested_price ? Number(item.suggested_price) : undefined,
        subtotal: Number(item.subtotal) || 0,
        notes: item.notes || undefined,
      }));

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
    const validUserId = isUuid(userId) ? userId : DEFAULT_USER_UUID;
    const orderDbId = isUuid(order.id) ? order.id : undefined;

    // Validate supplier_id
    let validSupplierId = order.supplierId;
    if (!isUuid(validSupplierId)) {
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
        validSupplierId = firstSup?.[0]?.id || 'b0000000-0000-0000-0000-000000000001';
      }
    }

    // 1. Upsert order header with user_id
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
      total_pieces: Number(order.totalPieces) || 0,
      total_amount: Number(order.totalAmount) || 0,
      notes: order.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (orderDbId) {
      orderPayload.id = orderDbId;
    }

    const { data: savedOrder, error: orderError } = await supabase
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
      console.error('[Supabase] Error saving order header:', orderError.message);
      return null;
    }

    const finalOrderId = savedOrder.id;

    // 2. Delete existing items for clean replacement
    await supabase
      .from('purchase_order_items')
      .delete()
      .eq('purchase_order_id', finalOrderId);

    // 3. Insert items
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
        suggested_price: item.suggestedPrice ? Number(item.suggestedPrice) : null,
        subtotal: Number(item.subtotal) || 0,
        notes: item.notes || null,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsPayload)
        .select('*');

      if (itemsError) {
        console.error('[Supabase] Error saving order items:', itemsError.message);
      } else if (insertedItems) {
        savedItems = insertedItems.map((item: any) => ({
          id: item.id,
          sku: item.sku,
          description: item.description,
          category: 'Confecção',
          sizeGridType: item.size_grid_type || 'letter',
          size: item.size,
          color: item.color,
          colorHex: item.color_hex || undefined,
          quantity: item.quantity,
          unitCost: Number(item.unit_cost) || 0,
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
      totalPieces: savedOrder.total_pieces,
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
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      storeName: data.brand_name || 'ZNK Packing',
      tagline: data.brand_slogan || 'Moda Feminina & Alta Confecção',
      legalName: data.legal_name || 'ZNK Comercio de Vestuario LTDA',
      cnpj: data.cnpj || '48.912.345/0001-89',
      email: data.purchasing_email || 'compras@znkpacking.com.br',
      phone: data.whatsapp_business || '(11) 98765-4321',
      address: data.showroom_address || 'Rua Oscar Freire, 1420 - Jardins',
      city: data.city || 'São Paulo',
      state: data.state || 'SP',
      currencySymbol: data.currency_symbol || 'R$',
      footerNote: data.legal_footer_notes || 'Ordem de compra sujeita aos termos de controle de qualidade e prazos acordados.',
      logoIcon: 'Sparkles',
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
      badgeBg: row.badge_bg || 'bg-stone-100 dark:bg-stone-800/40',
      badgeText: row.badge_text || 'text-stone-800 dark:text-stone-300',
      badgeBorder: row.badge_border || 'border-stone-200 dark:border-stone-700/40',
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
      badge_bg: cat.badgeBg,
      badge_text: cat.badgeText,
      badge_border: cat.badgeBorder,
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
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('[Supabase] Error deleting category:', error.message);
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

