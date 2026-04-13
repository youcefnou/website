'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';
import {
  AdminOrderStatus,
  DbOrderStatus,
  isAllowedAdminStatus,
  normalizeStatus,
  toDbStatus,
} from '@/lib/orders/status';

/**
 * Get all orders (admin only)
 */
export async function getAllOrders() {
  await requireAdmin();
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        *,
        sellable_items(
          *,
          products(*)
        )
      ),
      delivery_wilayas(*)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch orders');
  }

  return data;
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: AdminOrderStatus | DbOrderStatus
) {
  await requireAdmin();
  
  const normalizedStatus = normalizeStatus(status);
  if (!isAllowedAdminStatus(normalizedStatus)) {
    throw new Error('Invalid order status');
  }

  const dbStatus = toDbStatus(normalizedStatus);
  const supabase = await createClient();
  
  // First verify the order exists and we can read it
  const { data: existingOrder, error: readError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();
  
  if (readError) {
    console.error('[updateOrderStatus] Read error:', readError);
    if (readError.code === 'PGRST116') {
      throw new Error('Order not found');
    }
    throw new Error('Failed to read order');
  }
  
  if (!existingOrder) {
    throw new Error('Order not found');
  }
  
  // Now perform the update
  const { data, error } = await supabase
    .from('orders')
    .update({ status: dbStatus })
    .eq('id', orderId)
    .select('status')
    .single();

  if (error) {
    console.error('[updateOrderStatus] Update error:', error);
    if (error.code === 'PGRST116') {
      // The order exists (we read it above) but update returned no rows
      // This likely means RLS is blocking the update
      throw new Error('Permission denied: Unable to update order status');
    }
    throw new Error('Failed to update order status');
  }

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, status: normalizeStatus(data.status) };
}

/**
 * Delete an order (admin only)
 */
export async function deleteOrder(orderId: string) {
  await requireAdmin();
  
  const supabase = await createClient();
  
  // First verify the order exists
  const { data: existingOrder, error: readError } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .single();
  
  if (readError) {
    console.error('[deleteOrder] Read error:', readError);
    if (readError.code === 'PGRST116') {
      throw new Error('Order not found');
    }
    throw new Error('Failed to read order');
  }
  
  if (!existingOrder) {
    throw new Error('Order not found');
  }
  
  // Perform the delete
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('[deleteOrder] Delete error:', error);
    if (error.code === '42501' || error.message?.includes('permission')) {
      throw new Error('Permission denied: Unable to delete order');
    }
    throw new Error('Failed to delete order');
  }

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  return { success: true };
}

/**
 * Get all delivery wilayas (admin only)
 */
export async function getAllDeliveryWilayas() {
  await requireAdmin();
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('delivery_wilayas')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch delivery wilayas');
  }

  return data;
}

/**
 * Update delivery price for a wilaya (admin only)
 */
export async function updateDeliveryPrice(
  wilayaId: number,
  deliveryPrice: number
) {
  await requireAdmin();
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('delivery_wilayas')
    .update({ delivery_price: deliveryPrice })
    .eq('id', wilayaId);

  if (error) {
    throw new Error('Failed to update delivery price');
  }

  revalidatePath('/admin/settings/delivery');
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Get analytics data (admin only)
 */
export async function getAnalytics() {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    
    // Get counts and metrics
    const [ordersResult, productsResult, revenueResult] =
      await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total'),
      ]);

    const totalRevenue =
      revenueResult.data?.reduce((sum, order) => sum + Number(order.total), 0) ||
      0;

    // Count unique authenticated users from orders
    const { data: uniqueUsers } = await supabase
      .from('orders')
      .select('user_id')
      .not('user_id', 'is', null);
    
    const uniqueUserIds = new Set(uniqueUsers?.map(o => o.user_id) || []);

    return {
      totalOrders: ordersResult.count || 0,
      totalProducts: productsResult.count || 0,
      totalRevenue,
      totalUsers: uniqueUserIds.size,
    };
  } catch (error) {
    console.error('getAnalytics error:', error);
    // Return safe defaults
    return {
      totalOrders: 0,
      totalProducts: 0,
      totalRevenue: 0,
      totalUsers: 0,
    };
  }
}

/**
 * Get revenue per product view (admin only)
 */
export async function getRevenuePerProduct() {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('revenue_per_product')
      .select('*')
      .order('total_revenue', { ascending: false })
      .limit(10);

    if (error) {
      console.error('getRevenuePerProduct error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getRevenuePerProduct error:', error);
    return [];
  }
}

/**
 * Get revenue per category view (admin only)
 */
export async function getRevenuePerCategory() {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('revenue_per_category')
      .select('*')
      .order('total_revenue', { ascending: false });

    if (error) {
      console.error('getRevenuePerCategory error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getRevenuePerCategory error:', error);
    return [];
  }
}

/**
 * Get orders per wilaya view (admin only)
 */
export async function getOrdersPerWilaya() {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('orders_per_wilaya')
      .select('*')
      .order('total_orders', { ascending: false })
      .limit(10);

    if (error) {
      console.error('getOrdersPerWilaya error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getOrdersPerWilaya error:', error);
    return [];
  }
}

/**
 * Get delivery performance view (admin only)
 */
export async function getDeliveryPerformance() {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('delivery_performance')
      .select('*')
      .single();

    if (error) {
      console.error('getDeliveryPerformance error:', error);
      return { pending_orders: 0, delivered_orders: 0, total_orders: 0 };
    }

    return data || { pending_orders: 0, delivered_orders: 0, total_orders: 0 };
  } catch (error) {
    console.error('getDeliveryPerformance error:', error);
    return { pending_orders: 0, delivered_orders: 0, total_orders: 0 };
  }
}

/**
 * Get funnel view (admin only)
 */
export async function getFunnelView() {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('funnel_view')
      .select('*')
      .single();

    if (error) {
      console.error('getFunnelView error:', error);
      return { 
        unique_page_views: 0, 
        unique_cart_additions: 0, 
        unique_checkout_starts: 0, 
        unique_orders_placed: 0,
        total_page_views: 0,
        total_cart_additions: 0,
        total_checkout_starts: 0,
        total_orders_placed: 0
      };
    }

    return data || { 
      unique_page_views: 0, 
      unique_cart_additions: 0, 
      unique_checkout_starts: 0, 
      unique_orders_placed: 0,
      total_page_views: 0,
      total_cart_additions: 0,
      total_checkout_starts: 0,
      total_orders_placed: 0
    };
  } catch (error) {
    console.error('getFunnelView error:', error);
    return { 
      unique_page_views: 0, 
      unique_cart_additions: 0, 
      unique_checkout_starts: 0, 
      unique_orders_placed: 0,
      total_page_views: 0,
      total_cart_additions: 0,
      total_checkout_starts: 0,
      total_orders_placed: 0
    };
  }
}

/**
 * Get best selling products (admin only)
 */
export async function getBestSellingProducts() {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('best_selling_products')
      .select('*')
      .limit(10);

    if (error) {
      console.error('getBestSellingProducts error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getBestSellingProducts error:', error);
    return [];
  }
}

/**
 * Update store settings (admin only)
 */
export async function updateStoreSettings(settings: {
  store_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}) {
  await requireAdmin();
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('store_settings')
    .update(settings)
    .eq('id', 1);

  if (error) {
    console.error('Update store settings error:', error);
    throw new Error('Failed to update store settings');
  }

  // Revalidate all pages to apply theme changes
  revalidatePath('/', 'layout');
  revalidatePath('/admin/settings');
  revalidatePath('/admin');
  revalidatePath('/products');
  
  return { success: true };
}

/**
 * Update home content (admin only)
 */
export async function updateHomeContent(content: {
  hero_title?: string;
  sub_title?: string;
  description?: string;
  cta_text?: string;
  section_visibility?: Record<string, boolean>;
}) {
  await requireAdmin();
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('home_content')
    .update(content)
    .eq('id', 1);

  if (error) {
    throw new Error('Failed to update home content');
  }

  revalidatePath('/');
  return { success: true };
}
