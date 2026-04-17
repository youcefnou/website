import { createClient } from '@/lib/supabase/supabaseServerClient';

export async function getHomeAllProducts(limit = 20) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, description, has_variants,
      category:category_id(name),
      sellable_items(price, stock, image_url)
    `)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Filter out ghost products: no sellable items, or all items have 0 price and 0 stock
  return (data ?? []).filter((product) => {
    if (!product.sellable_items || product.sellable_items.length === 0) return false;
    return product.sellable_items.some(
      (item: { price: number; stock: number }) => item.price > 0 || item.stock > 0
    );
  });
}

export async function getFeaturedProducts(limit = 8) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:category_id(name),
      sellable_items(stock, price, image_url)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getActiveCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
