'use client';

/**
 * Analytics tracking utilities - Client-side event logging
 * Track user behavior and conversions by sending events to server action
 */

export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'cart_abandon'
  | 'checkout_start'
  | 'order_placed'
  | 'order_delivered';

interface AnalyticsMetadata {
  product_id?: string;
  product_name?: string;
  category_id?: string;
  order_id?: string;
  quantity?: number;
  price?: number;
  cart_total?: number;
  item_count?: number;
  order_total?: number;
  time_on_page?: number;
  page?: string;
  [key: string]: unknown;
}

/**
 * Get or create analytics session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track an analytics event via server action
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  metadata: AnalyticsMetadata = {}
): Promise<void> {
  try {
    const sessionId = getSessionId();
    
    // Import server action dynamically to avoid bundling server code in client
    const { logAnalyticsEvent } = await import('@/app/actions/analytics');
    
    await logAnalyticsEvent(eventType, sessionId, metadata);
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(pagePath: string): void {
  trackEvent('page_view', { page: pagePath });
}

/**
 * Track product view
 */
export function trackProductView(productId: string, productName: string): void {
  trackEvent('product_view', {
    product_id: productId,
    product_name: productName,
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(
  productId: string,
  quantity: number,
  price: number
): void {
  trackEvent('add_to_cart', {
    product_id: productId,
    quantity,
    price,
  });
}

/**
 * Track checkout start
 */
export function trackCheckoutStart(cartTotal: number, itemCount: number): void {
  trackEvent('checkout_start', {
    cart_total: cartTotal,
    item_count: itemCount,
  });
}

/**
 * Track order placed
 */
export function trackOrderPlaced(
  orderId: string,
  orderTotal: number,
  itemCount: number
): void {
  trackEvent('order_placed', {
    order_id: orderId,
    order_total: orderTotal,
    item_count: itemCount,
  });
}

/**
 * Track cart abandon
 */
export function trackCartAbandon(
  cartTotal: number,
  itemCount: number,
  timeOnPage: number
): void {
  trackEvent('cart_abandon', {
    cart_total: cartTotal,
    item_count: itemCount,
    time_on_page: timeOnPage,
  });
}
