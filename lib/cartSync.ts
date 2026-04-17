import { createClient } from '@/lib/supabase/supabaseBrowserClient';

/**
 * Cart synchronization utilities
 * Handles syncing cart between session storage and database
 */

export interface CartItem {
  sellable_item_id: string;
  quantity: number;
}

/**
 * Get or create cart for current user/session
 */
export async function getOrCreateCart(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get session ID from localStorage
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }

  // Try to find existing cart
  const { data: existingCart } = await supabase
    .from('carts')
    .select('id')
    .or(
      user
        ? `user_id.eq.${user.id},session_id.eq.${sessionId}`
        : `session_id.eq.${sessionId}`
    )
    .single();

  if (existingCart) {
    return existingCart.id;
  }

  // Create new cart
  const { data: newCart, error } = await supabase
    .from('carts')
    .insert({
      user_id: user?.id || null,
      session_id: sessionId,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to create cart');
  }

  return newCart.id;
}

/**
 * Add item to cart
 */
export async function addToCart(
  sellableItemId: string,
  quantity: number = 1
): Promise<void> {
  const supabase = createClient();
  const cartId = await getOrCreateCart();

  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .eq('sellable_item_id', sellableItemId)
    .single();

  if (existingItem) {
    // Update quantity
    await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);
  } else {
    // Insert new item
    await supabase.from('cart_items').insert({
      cart_id: cartId,
      sellable_item_id: sellableItemId,
      quantity,
    });
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<void> {
  const supabase = createClient();

  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', cartItemId);
  } else {
    await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('cart_items').delete().eq('id', cartItemId);
}

/**
 * Get cart items
 */
export async function getCartItems() {
  const supabase = createClient();
  const cartId = await getOrCreateCart();

  const { data, error } = await supabase
    .from('cart_items')
    .select(
      `
      id,
      quantity,
      sellable_item_id,
      sellable_items:sellable_item_id (
        id,
        sku,
        price,
        stock,
        image_url,
        description,
        products:product_id (
          id,
          name
        )
      )
    `
    )
    .eq('cart_id', cartId);

  if (error) {
    throw new Error('Failed to fetch cart items');
  }

  return data;
}

/**
 * Clear cart
 */
export async function clearCart(): Promise<void> {
  const supabase = createClient();
  const cartId = await getOrCreateCart();

  await supabase.from('cart_items').delete().eq('cart_id', cartId);
}

/**
 * Sync anonymous cart to user cart on login
 */
export async function syncCartOnLogin(userId: string): Promise<void> {
  const supabase = createClient();
  const sessionId = localStorage.getItem('cart_session_id');

  if (!sessionId) return;

  // Find session cart
  const { data: sessionCart } = await supabase
    .from('carts')
    .select('id')
    .eq('session_id', sessionId)
    .is('user_id', null)
    .single();

  if (!sessionCart) return;

  // Update cart to user
  await supabase
    .from('carts')
    .update({ user_id: userId })
    .eq('id', sessionCart.id);
}
