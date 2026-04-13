'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';

export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'cart_abandon'
  | 'checkout_start'
  | 'order_placed'
  | 'order_delivered';

interface AnalyticsMetadata {
  [key: string]: unknown;
}

/**
 * Log analytics event to Supabase (server action)
 */
export async function logAnalyticsEvent(
  eventType: AnalyticsEventType,
  sessionId: string,
  metadata: AnalyticsMetadata = {}
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    
    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert analytics event
    const { error } = await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      session_id: sessionId,
      event_type: eventType,
      metadata,
    });

    if (error) {
      console.error('Failed to log analytics event:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to log analytics event:', error);
    return { success: false };
  }
}
