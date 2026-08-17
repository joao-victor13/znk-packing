import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PurchaseOrder, OrderItem, Supplier, OrderStatus } from '../types';

// Read Vite environment variables safely
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hwtgofjeglrmbykegsru.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

export async function saveSupplierToSupabase(supplier: Supplier): Promise<boolean> {
  if (!supabase) return false;

  try {
    const payload = {
      id: supplier.id.includes('-') && supplier.id.length === 36 ? supplier.id : undefined,
      trade_name: supplier.tradeName,
      corporate_name: supplier.corporateName || supplier.tradeName,
      cnpj_cpf: supplier.cnpj,
      contact_name: supplier.contactName,
      phone: supplier.phone,
      whatsapp: supplier.phone,
      email: supplier.email,
      city: supplier.city || 'São Paulo',
      state: supplier.state || 'SP',
      category_specialty: supplier.category || supplier.categorySpecialty || 'Geral',
      default_payment_terms: supplier.paymentTerms || supplier.defaultPaymentTerms || '30 DDL',
      average_lead_days: supplier.averageLeadDays || 15,
      rating: supplier.rating || 5.0,
      notes: supplier.notes || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('suppliers')
      .upsert(payload, { onConflict: 'cnpj_cpf' });

    if (error) {
      console.error('[Supabase] Error saving supplier:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception saving supplier:', err);
    return false;
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

export async function saveOrderToSupabase(order: PurchaseOrder): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Upsert order header
    const orderPayload = {
      id: order.id.includes('-') && order.id.length === 36 ? order.id : undefined,
      order_number: order.orderNumber,
      supplier_id: order.supplierId,
      status: toDbStatus(order.status),
      collection: order.collection,
      issue_date: order.issueDate,
      expected_delivery_date: order.expectedDeliveryDate,
      actual_delivery_date: order.actualDeliveryDate || null,
      payment_terms: order.paymentTerms,
      shipping_carrier: order.shippingCarrier || null,
      shipping_cost: order.shippingCost || 0,
      discount: order.discount || 0,
      total_pieces: order.totalPieces,
      total_amount: order.totalAmount,
      notes: order.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data: savedOrder, error: orderError } = await supabase
      .from('purchase_orders')
      .upsert(orderPayload, { onConflict: 'order_number' })
      .select('id')
      .single();

    if (orderError) {
      console.error('[Supabase] Error saving order header:', orderError.message);
      return false;
    }

    const orderDbId = savedOrder?.id || order.id;

    // 2. Delete existing items for clean replacement
    await supabase
      .from('purchase_order_items')
      .delete()
      .eq('purchase_order_id', orderDbId);

    // 3. Insert items
    if (order.items && order.items.length > 0) {
      const itemsPayload = order.items.map(item => ({
        purchase_order_id: orderDbId,
        sku: item.sku,
        description: item.description,
        size_grid_type: item.sizeGridType || 'letter',
        size: item.size,
        color: item.color,
        color_hex: item.colorHex || null,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        suggested_price: item.suggestedPrice || null,
        subtotal: item.subtotal,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsPayload);

      if (itemsError) {
        console.error('[Supabase] Error saving order items:', itemsError.message);
      }
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Exception saving order:', err);
    return false;
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
