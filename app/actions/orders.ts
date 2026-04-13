'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';

export async function getUserOrders() {
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch orders');
  }

  return data;
}

export async function getDeliveryWilayas() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('delivery_wilayas')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch wilayas');
  }

  return data;
}
