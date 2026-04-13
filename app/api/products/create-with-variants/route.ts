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
      is_active,
      is_featured,
      variants,
    } = body;

    // Validate required fields
    if (!name || !price || !category_id || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json(
        { error: 'At least one variant is required' },
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
        has_variants: variants.length > 0,
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

    // 2. Create product variants
    const variantInserts = variants.map((variant: { name: string }) => ({
      product_id: product.id,
      name: variant.name,
    }));

    const { data: createdVariants, error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantInserts)
      .select();

    if (variantsError) {
      console.error('Variants creation error:', variantsError);
      // Clean up product if variants fail
      try {
        await supabase.from('products').delete().eq('id', product.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup product:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Failed to create variants' },
        { status: 500 }
      );
    }

    // 3. Create sellable items for each variant
    const sellableItems = createdVariants.map(
      (variant: { id: string; name: string }, index: number) => {
        const variantData = variants[index];
        // Use manual SKU if provided, otherwise auto-generate
        const trimmedSku = variantData.sku?.trim();
        const sku = trimmedSku 
          ? trimmedSku 
          : `${product.id}-${variant.id}`;
        
        return {
          product_id: product.id,
          variant_id: variant.id,
          sku: sku,
          price: parseFloat(price), // Same price for all
          stock: variantData.stock || 0,
          description: variant.name,
          image_url: image_url, // Use same image for all variants
        };
      }
    );

    const { error: itemsError } = await supabase
      .from('sellable_items')
      .insert(sellableItems);

    if (itemsError) {
      console.error('Sellable items creation error:', itemsError);
      // Clean up product and variants if items fail
      try {
        await supabase.from('products').delete().eq('id', product.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup product:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Failed to create sellable items' },
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
