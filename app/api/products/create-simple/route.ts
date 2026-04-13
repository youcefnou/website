import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      name,
      price,
      category_id,
      image_url,
      description,
      stock,
      sku,
      is_active,
      is_featured,
    } = body;

    // Validate required fields
    if (!name || !price || !category_id || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Create the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description: description || null,
        category_id,
        is_active: is_active ?? true,
        is_featured: is_featured ?? false,
        has_variants: false, // No variants for simple products
      })
      .select()
      .single();

    if (productError) {
      console.error('Product creation error:', productError);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // 2. Create a single sellable item (no variant)
    const { error: itemError } = await supabase
      .from('sellable_items')
      .insert({
        product_id: product.id,
        variant_id: null, // No variant
        sku: sku && sku.trim() ? sku.trim() : `SIMPLE-${product.id}`, // Use manual SKU or auto-generate
        price: parseFloat(price),
        stock: stock || 0,
        description: name,
        image_url: image_url,
      });

    if (itemError) {
      console.error('Sellable item creation error:', itemError);
      // Clean up product if item fails
      try {
        await supabase.from('products').delete().eq('id', product.id);
      } catch (cleanupError) {
        console.error('Critical: Failed to cleanup product after item creation error:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Failed to create product item' },
        { status: 500 }
      );
    }

    revalidatePath('/admin/products');

    return NextResponse.json({
      success: true,
      productId: product.id,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
