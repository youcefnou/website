'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { revalidatePath } from 'next/cache';
import { getUserOrders } from './orders';

/**
 * Get current user's orders (reusing from orders.ts)
 */
export { getUserOrders };

/**
 * Get order details by ID
 * Verifies that the order belongs to the logged-in user
 */
export async function getOrderDetails(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

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
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching order details:', error);
    throw new Error('Failed to fetch order details');
  }

  if (!data) {
    throw new Error('Order not found or access denied');
  }

  return data;
}

/**
 * Update user profile
 * Updates metadata in auth.users
 */
export async function updateUserProfile(data: {
  name?: string;
  phone?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Merge with existing metadata to avoid overwriting other fields
  const updatedMetadata: Record<string, string> = {
    ...user.user_metadata,
  };

  // Only update fields that are provided
  if (data.name !== undefined) {
    updatedMetadata.name = data.name;
  }
  if (data.phone !== undefined) {
    updatedMetadata.phone = data.phone;
  }

  // Update user metadata in auth.users
  const { error } = await supabase.auth.updateUser({
    data: updatedMetadata,
  });

  if (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }

  revalidatePath('/account');
  revalidatePath('/account/settings');

  return { success: true };
}

/**
 * Get account statistics
 */
export async function getAccountStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get all orders for the user
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total, status, created_at')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching account stats:', error);
    throw new Error('Failed to fetch account stats');
  }

  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const pendingOrders =
    orders?.filter((o) => o.status === 'pending').length || 0;
  const deliveredOrders =
    orders?.filter((o) => o.status === 'delivered').length || 0;

  return {
    totalOrders,
    totalSpent,
    pendingOrders,
    deliveredOrders,
  };
}

/**
 * Get current user info from auth.users
 */
export async function getCurrentUserInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Return user data from auth.users metadata
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || null,
    phone: user.user_metadata?.phone || null,
    created_at: user.created_at,
  };
}
