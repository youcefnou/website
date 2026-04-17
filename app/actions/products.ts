'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

export async function getProducts(categoryId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(
      `
      *,
      category:category_id(*),
      sellable_items(*)
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Filter by category if provided
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('Failed to fetch products');
  }

  // Filter out ghost products: those with no sellable items,
  // or where ALL items have 0 price and 0 stock (created by faulty CSV imports)
  const validProducts = (data || []).filter((product) => {
    if (!product.sellable_items || product.sellable_items.length === 0) return false;
    // Keep the product if at least one sellable item has a price > 0 or stock > 0
    return product.sellable_items.some(
      (item: { price: number; stock: number }) => item.price > 0 || item.stock > 0
    );
  });

  return validProducts;
}

export async function getProductById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:category_id(*),
      sellable_items(*),
      product_variants(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error('Failed to fetch product');
  }

  return data;
}

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch categories');
  }

  return data;
}

export async function getRelatedProducts(categoryId: string | null, currentProductId: string, limit: number = 4) {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      sellable_items(id, price, stock, image_url)
    `
    )
    .is('deleted_at', null)
    .neq('id', currentProductId)
    .limit(limit);

  // Filter by category if provided
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('Failed to fetch related products');
  }

  return data;
}

/**
 * Generate a unique SKU
 */
async function generateSKU(): Promise<string> {
  const supabase = await createClient();
  
  // Get the count of existing sellable items
  const { count } = await supabase
    .from('sellable_items')
    .select('*', { count: 'exact', head: true });
  
  const nextNumber = (count || 0) + 1;
  return `PROD-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Create a new product with sellable items
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  category_id?: string;
  has_variants: boolean;
  sellable_items: Array<{
    sku?: string;
    price: number;
    stock: number;
    description?: string;
    image_url?: string;
    variant_name?: string;
  }>;
}) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  try {
    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        has_variants: data.has_variants,
      })
      .select()
      .single();

    if (productError) {
      console.error('Product creation error:', productError);
      return { success: false, error: 'Failed to create product' };
    }

    // Create product variants if needed
    const variantMap = new Map<string, string>();
    if (data.has_variants) {
      for (const item of data.sellable_items) {
        if (item.variant_name && !variantMap.has(item.variant_name)) {
          const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: product.id,
              name: item.variant_name,
            })
            .select()
            .single();

          if (variantError) {
            console.error('Variant creation error:', variantError);
            continue;
          }

          variantMap.set(item.variant_name, variant.id);
        }
      }
    }

    // Create sellable items
    const sellableItemsToInsert = await Promise.all(
      data.sellable_items.map(async (item) => {
        const sku = item.sku || await generateSKU();
        return {
          product_id: product.id,
          variant_id: item.variant_name ? variantMap.get(item.variant_name) || null : null,
          sku,
          price: item.price,
          stock: item.stock,
          description: item.description,
          image_url: item.image_url,
        };
      })
    );

    const { error: sellableItemsError } = await supabase
      .from('sellable_items')
      .insert(sellableItemsToInsert);

    if (sellableItemsError) {
      console.error('Sellable items creation error:', sellableItemsError);
      // Try to clean up the product
      await supabase.from('products').delete().eq('id', product.id);
      return { success: false, error: 'Failed to create product items' };
    }

    revalidatePath('/admin/products');
    return { success: true, product };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update an existing product with sellable items
 */
export async function updateProduct(
  productId: string,
  data: {
    name: string;
    description?: string;
    category_id?: string;
    has_variants: boolean;
    sellable_items: Array<{
      id?: string; // existing item ID if updating
      sku?: string;
      price: number;
      stock: number;
      description?: string;
      image_url?: string;
      variant_name?: string;
    }>;
  }
) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  try {
    // Update product
    const { error: productError } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        has_variants: data.has_variants,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (productError) {
      console.error('Product update error:', productError);
      return { success: false, error: 'Failed to update product' };
    }

    // Handle variants if needed
    const variantMap = new Map<string, string>();
    if (data.has_variants) {
      // Get existing variants
      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id, name')
        .eq('product_id', productId);

      const existingVariantMap = new Map(
        existingVariants?.map((v) => [v.name, v.id]) || []
      );

      for (const item of data.sellable_items) {
        if (item.variant_name) {
          if (existingVariantMap.has(item.variant_name)) {
            // Use existing variant
            const existingId = existingVariantMap.get(item.variant_name);
            if (existingId) {
              variantMap.set(item.variant_name, existingId);
            }
          } else if (!variantMap.has(item.variant_name)) {
            // Create new variant
            const { data: variant, error: variantError } = await supabase
              .from('product_variants')
              .insert({
                product_id: productId,
                name: item.variant_name,
              })
              .select()
              .single();

            if (variantError) {
              console.error('Variant creation error:', variantError);
              continue;
            }

            variantMap.set(item.variant_name, variant.id);
          }
        }
      }
    }

    // Update or insert sellable items
    for (const item of data.sellable_items) {
      const sku = item.sku || await generateSKU();
      const sellableItemData = {
        product_id: productId,
        variant_id: item.variant_name && variantMap.has(item.variant_name) 
          ? variantMap.get(item.variant_name) || null 
          : null,
        sku,
        price: item.price,
        stock: item.stock,
        description: item.description,
        image_url: item.image_url,
      };

      if (item.id) {
        // Update existing item
        const { error } = await supabase
          .from('sellable_items')
          .update(sellableItemData)
          .eq('id', item.id);

        if (error) {
          console.error('Sellable item update error:', error);
        }
      } else {
        // Insert new item
        const { error } = await supabase
          .from('sellable_items')
          .insert(sellableItemData);

        if (error) {
          console.error('Sellable item insert error:', error);
        }
      }
    }

    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Soft delete a product
 */
export async function deleteProduct(productId: string) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) {
    console.error('Product delete error:', error);
    return { success: false, error: 'Failed to delete product' };
  }

  revalidatePath('/admin/products');
  return { success: true };
}

/**
 * Create a new category
 */
export async function createCategory(data: {
  name: string;
  description?: string;
  image_url?: string;
  display_order?: number;
}) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      name: data.name,
      description: data.description,
      image_url: data.image_url,
      display_order: data.display_order || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Category creation error:', error);
    return { success: false, error: 'Failed to create category' };
  }

  revalidatePath('/admin/products');
  return { success: true, category };
}
