import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isRecoverableAuthError } from '@/lib/auth/safe-auth';

interface OrderItemInput {
  sellableItemId: string;
  quantity: number;
  priceAtOrder: number;
  unitPrice: number;
  productName: string;
  subProductName?: string | null;
  phoneModel: string;
}

interface CreateOrderInput {
  fullName?: string | null;
  phone: string;
  wilayaId: number;
  commune: string;
  address: string;
  deliveryPrice: number;
  subtotal: number;
  total: number;
  items: OrderItemInput[];
  sessionId?: string;
}

async function createRouteHandlerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderInput = await request.json();

    const supabase = await createRouteHandlerClient();

    // Get current user (if logged in) - auth is OPTIONAL
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (isRecoverableAuthError(error.message)) {
          user = null;
        } else {
          throw error;
        }
      } else {
        user = data.user;
      }
    } catch (error) {
      if (!isRecoverableAuthError(error)) {
        throw error;
      }
      user = null;
    }

    // Derive full_name based on authentication state
    let fullName: string | null = null;

    // Trim the provided fullName if it exists
    const providedFullName = body.fullName?.trim();

    if (user) {
      // For authenticated users: use provided name, or derive from user metadata/email
      if (providedFullName && providedFullName.length > 0) {
        fullName = providedFullName;
      } else {
        // Try to get from user metadata
        const metadataFullName = user.user_metadata?.full_name;
        if (
          typeof metadataFullName === 'string' &&
          metadataFullName.trim().length > 0
        ) {
          fullName = metadataFullName.trim();
        } else if (user.email && user.email.trim().length > 0) {
          // Fallback to email
          fullName = user.email.trim();
        }
      }
    } else {
      // For guests: full_name MUST come from checkout form input
      if (providedFullName && providedFullName.length > 0) {
        fullName = providedFullName;
      }
    }

    // Validate full_name is a non-empty string
    if (!fullName || fullName.length === 0) {
      const errorMessage = user
        ? 'Le nom complet est requis. Veuillez le fournir dans le formulaire ou mettre à jour votre profil.'
        : 'Le nom complet est requis pour les commandes invité.';

      logger.error('Order creation failed - missing full_name:', {
        isAuthenticated: !!user,
        userId: user?.id || null,
        providedFullName: body.fullName,
      });

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Trim and validate other required string fields
    const phone = body.phone?.trim();
    const commune = body.commune?.trim();
    const address = body.address?.trim();

    if (
      !phone ||
      phone.length === 0 ||
      !body.wilayaId ||
      !commune ||
      commune.length === 0 ||
      !address ||
      address.length === 0 ||
      !body.items ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log authentication state for debugging
    logger.debug('Order creation API - Auth state:', {
      isAuthenticated: !!user,
      userId: user?.id || null,
      userEmail: user?.email || 'guest',
      sessionId: body.sessionId || null,
      derivedFullName: fullName,
    });

    // Prepare FINAL order payload for insert
    const orderPayload = {
      user_id: user?.id || null,
      session_id: !user ? body.sessionId || null : null,
      full_name: fullName,
      phone: phone,
      wilaya_id: body.wilayaId,
      commune: commune,
      address: address,
      delivery_price: body.deliveryPrice,
      subtotal: body.subtotal,
      total: body.total,
      status: 'pending',
      cod_only: true,
    };

    // TEMP: Log FINAL payload before insert (as required by TASK 3.2)
    console.log('[ORDER API] FINAL ORDER PAYLOAD:', JSON.stringify(orderPayload, null, 2));

    // Create order with user_id = auth.uid() for logged-in, NULL for guests
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError || !order) {
      logger.error('Order creation failed:', {
        error: orderError,
        details: orderError?.details,
        hint: orderError?.hint,
        message: orderError?.message,
        code: orderError?.code,
        isAuthenticated: !!user,
        userId: user?.id || null,
      });

      return NextResponse.json(
        {
          error:
            orderError?.message ||
            'Une erreur s\'est produite lors de la création de la commande.',
          code: orderError?.code,
        },
        { status: 500 }
      );
    }

    // Create order items with all required fields
    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      sellable_item_id: item.sellableItemId,
      quantity: item.quantity,
      price_at_order: item.priceAtOrder,
      unit_price: item.unitPrice,
      product_name: item.productName,
      sub_product_name: item.subProductName || null,
      phone_model: item.phoneModel,
      session_id: !user ? body.sessionId || null : null,
    }));

    // TEMP: Log order items payload
    console.log('[ORDER API] ORDER ITEMS PAYLOAD:', JSON.stringify(orderItems, null, 2));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      logger.error('Order items creation failed:', {
        error: itemsError,
        details: itemsError?.details,
        hint: itemsError?.hint,
        message: itemsError?.message,
        code: itemsError?.code,
        orderItems,
        isAuthenticated: !!user,
        userId: user?.id || null,
      });

      // Rollback: Delete the order if items fail
      try {
        await supabase.from('orders').delete().eq('id', order.id);
      } catch (rollbackError) {
        logger.error('Failed to rollback order creation:', {
          rollbackError,
          orderId: order.id,
          originalError: itemsError?.code,
        });
      }

      return NextResponse.json(
        {
          error:
            itemsError?.message ||
            'Une erreur s\'est produite lors de la création des articles de commande.',
          code: itemsError?.code,
        },
        { status: 500 }
      );
    }

    // Clear user cart if logged in
    if (user) {
      try {
        await Promise.all([
          supabase.from('cart_items').delete().eq('user_id', user.id),
          supabase.from('carts').delete().eq('user_id', user.id),
        ]);
      } catch (cartError) {
        logger.error('Failed to clear user cart:', cartError);
        // Don't fail the order if cart cleanup fails
      }
    }

    // Log successful order creation
    logger.info('Order created successfully:', {
      orderId: order.id,
      isAuthenticated: !!user,
      userId: user?.id || null,
      itemCount: body.items.length,
      total: body.total,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in order creation API:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Une erreur inattendue s\'est produite.',
      },
      { status: 500 }
    );
  }
}
