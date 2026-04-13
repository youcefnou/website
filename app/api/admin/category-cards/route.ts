import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { isAdminServer } from '@/lib/auth/admin';
import type { CategoryCard } from '@/lib/types/custom-settings';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const isAdmin = await isAdminServer();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cards } = body as { cards: CategoryCard[] };

    // Validate input
    if (!Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch current custom_settings
    const { data: storeSettings, error: fetchError } = await supabase
      .from('store_settings')
      .select('custom_settings')
      .eq('id', 1)
      .single();

    if (fetchError) {
      console.error('Failed to fetch store settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch store settings' },
        { status: 500 }
      );
    }

    // Update custom_settings with new category cards data
    const customSettings = (storeSettings?.custom_settings || {}) as Record<string, unknown>;
    customSettings.category_cards = cards;

    const { error: updateError } = await supabase
      .from('store_settings')
      .update({ custom_settings: customSettings })
      .eq('id', 1);

    if (updateError) {
      console.error('Failed to update category cards:', updateError);
      return NextResponse.json(
        { error: 'Failed to update category cards' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category cards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
