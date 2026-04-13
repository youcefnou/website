'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { validateAddToCart } from '@/lib/validations/product';
import { revalidatePath } from 'next/cache';

export interface GuestCartItem {
  sellableItemId: string;
  quantity: number;
}

/**
 * Merge guest cart items into user's Supabase cart with stock validation
 * Called when user logs in
 */
export async function mergeGuestCart(
  guestCartItems: GuestCartItem[]
): Promise<void> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to merge cart');
  }

  // Find or create user cart
  let { data: userCart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!userCart) {
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ user_id: user.id })
      .select('id')
      .single();

    if (error) {
      throw new Error('Failed to create user cart');
    }

    userCart = newCart;
  }

  // Merge each guest cart item with stock validation
  for (const guestItem of guestCartItems) {
    // Get stock information for validation
    const { data: sellableItem } = await supabase
      .from('sellable_items')
      .select('stock')
      .eq('id', guestItem.sellableItemId)
      .single();

    if (!sellableItem) {
      console.warn(`Sellable item ${guestItem.sellableItemId} not found`);
      continue;
    }

    // Check if item already exists in user cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', userCart.id)
      .eq('sellable_item_id', guestItem.sellableItemId)
      .single();

    if (existingItem) {
      // Calculate new quantity (don't exceed stock)
      const newQuantity = Math.min(
        existingItem.quantity + guestItem.quantity,
        sellableItem.stock
      );
      
      // Validate the new quantity doesn't exceed stock
      try {
        validateAddToCart({
          sellableItemId: guestItem.sellableItemId,
          quantity: newQuantity,
          stock: sellableItem.stock,
        });

        // Update quantity (add guest quantity to existing, capped at stock)
        await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);
      } catch (error) {
        // Skip this item if validation fails
        console.warn(`Stock validation failed for item ${guestItem.sellableItemId}:`, error);
        continue;
      }
    } else {
      // Validate quantity doesn't exceed stock for new item
      try {
        const quantityToAdd = Math.min(guestItem.quantity, sellableItem.stock);
        
        validateAddToCart({
          sellableItemId: guestItem.sellableItemId,
          quantity: quantityToAdd,
          stock: sellableItem.stock,
        });

        // Insert new cart item
        await supabase.from('cart_items').insert({
          cart_id: userCart.id,
          sellable_item_id: guestItem.sellableItemId,
          quantity: quantityToAdd,
        });
      } catch (error) {
        // Skip this item if validation fails
        console.warn(`Stock validation failed for item ${guestItem.sellableItemId}:`, error);
        continue;
      }
    }
  }

  // Revalidate cart page to reflect changes
  revalidatePath('/cart');
}

/**
 * Get user cart items from Supabase
 */
export async function getUserCart(): Promise<
  Array<{
    id: string;
    quantity: number;
    sellable_item: {
      id: string;
      sku: string;
      price: number;
      stock: number;
      image_url: string | null;
      description: string | null;
      product: {
        id: string;
        name: string;
      };
      variant: {
        id: string;
        name: string | null;
      } | null;
    };
  }>
> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Find user cart
  const { data: userCart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!userCart) {
    return [];
  }

  // Get cart items with product details and variant information
  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(
      `
      id,
      quantity,
      sellable_item:sellable_item_id (
        id,
        sku,
        price,
        stock,
        image_url,
        description,
        product:product_id (
          id,
          name
        ),
        variant:variant_id (
          id,
          name
        )
      )
    `
    )
    .eq('cart_id', userCart.id)
    .returns<
      Array<{
        id: string;
        quantity: number;
        sellable_item: {
          id: string;
          sku: string;
          price: number;
          stock: number;
          image_url: string | null;
          description: string | null;
          product: {
            id: string;
            name: string;
          };
          variant: {
            id: string;
            name: string | null;
          } | null;
        };
      }>
    >();

  if (error) {
    throw new Error('Failed to fetch cart items');
  }

  return cartItems || [];
}

/**
 * Update cart item quantity in Supabase with stock validation
 */
export async function updateUserCartItem(
  cartItemId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the cart item with stock information
  const { data: cartItem, error: fetchError } = await supabase
    .from('cart_items')
    .select(`
      sellable_item_id,
      sellable_item:sellable_item_id (
        stock
      )
    `)
    .eq('id', cartItemId)
    .single();

  if (fetchError || !cartItem) {
    return { success: false, error: 'عنصر السلة غير موجود' };
  }

  // Delete if quantity is 0 or less
  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    return { success: true };
  }

  // Validate quantity doesn't exceed stock
  try {
    const sellableItemData = Array.isArray(cartItem.sellable_item)
      ? cartItem.sellable_item[0]
      : cartItem.sellable_item;

    if (!sellableItemData || typeof sellableItemData.stock !== 'number') {
      return { success: false, error: 'معلومات المنتج غير متوفرة' };
    }

    validateAddToCart({
      sellableItemId: cartItem.sellable_item_id,
      quantity,
      stock: sellableItemData.stock,
    });

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);

    if (updateError) {
      return { success: false, error: 'فشل تحديث الكمية' };
    }

    // Revalidate cart page
    revalidatePath('/cart');

    return { success: true };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ message: string }> };
      return {
        success: false,
        error: zodError.issues[0]?.message || 'الكمية المطلوبة تتجاوز المخزون المتوفر',
      };
    }
    return {
      success: false,
      error: 'الكمية المطلوبة تتجاوز المخزون المتوفر',
    };
  }
}

/**
 * Remove cart item from Supabase
 */
export async function removeUserCartItem(cartItemId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('cart_items').delete().eq('id', cartItemId);
  
  // Revalidate cart page
  revalidatePath('/cart');
}

/**
 * Clear user cart in Supabase
 */
export async function clearUserCart(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: userCart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (userCart) {
    await supabase.from('cart_items').delete().eq('cart_id', userCart.id);
  }

  // Revalidate cart and checkout pages
  revalidatePath('/cart');
  revalidatePath('/checkout');
}
