'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/store/cart-store';
import { getUserCart } from '@/app/actions/cart';
import { getDeliveryWilayas } from '@/app/actions/orders';
import { getStoreSettings } from '@/app/actions/settings';
import { createClient } from '@/lib/supabase/supabaseBrowserClient';
import { validateCheckoutForm } from '@/lib/validations/checkout';
import { ZodError } from 'zod';
import { formatCurrency } from '@/lib/formatCurrency';
import type { UserCartItem, ProductGroup } from '@/lib/types/cart';
import {
  groupGuestCartItems,
  groupUserCartItems,
  type UserProductGroup,
} from '@/lib/utils/cart-grouping';
import { logger } from '@/lib/logger';

interface DeliveryWilaya {
  id: number;
  name: string;
  delivery_price: number;
}

interface StoreSettings {
  id: number;
  store_name: string;
  logo_url: string | null;
}

// Default phone model fallback for orders without specific model information
const DEFAULT_PHONE_MODEL = 'Standard';

export default function CheckoutPage() {
  const t = useTranslations('checkoutPage');
  const router = useRouter();
  const guestCartItems = useCartStore((state) => state.items);
  const guestSubtotal = useCartStore((state) => state.getSubtotal());
  const clearGuestCart = useCartStore((state) => state.clearCart);

  const [userCartItems, setUserCartItems] = useState<UserCartItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCartLoading, setUserCartLoading] = useState(false); // Track if user cart is still loading
  const [wilayas, setWilayas] = useState<DeliveryWilaya[]>([]);
  const [selectedWilayaId, setSelectedWilayaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    commune: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load cart and wilaya data
  useEffect(() => {
    async function loadData() {
      try {
        // Check auth status
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        const isAuthenticated = !!user;
        
        // CRITICAL: Set userCartLoading BEFORE isLoggedIn to prevent race condition
        // where the empty cart redirect triggers before cart data is loaded
        if (user) {
          setUserCartLoading(true); // Mark that we're loading user cart FIRST
        }
        setIsLoggedIn(isAuthenticated);

        // Load user cart if logged in
        if (user) {
          try {
            const cart = await getUserCart();
            setUserCartItems(cart);
          } finally {
            setUserCartLoading(false); // Done loading user cart
          }
        }

        // Load wilayas and store settings
        const [wilayasData, settings] = await Promise.all([
          getDeliveryWilayas(),
          getStoreSettings(),
        ]);
        setWilayas(wilayasData);
        setStoreSettings(settings);
      } catch (error) {
        logger.error('Error loading checkout data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Determine which cart to use:
  // If logged in AND has items in user cart, use user cart.
  // Otherwise, fall back to guest cart (this handles the case where a logged-in
  // user has items in their guest cart from before proper cart sync occurred).
  const useUserCart = isLoggedIn && userCartItems.length > 0;

  // Calculate cart values
  const cartItems = useUserCart ? userCartItems : guestCartItems;
  const hasItems = cartItems.length > 0;

  const subtotal = useUserCart
    ? userCartItems.reduce(
        (sum, item) => sum + item.sellable_item.price * item.quantity,
        0
      )
    : guestSubtotal;

  const selectedWilaya = wilayas.find((w) => w.id === selectedWilayaId);
  const deliveryPrice = selectedWilaya?.delivery_price || 0;
  const total = subtotal + deliveryPrice;

  // Group cart items by product → sub-product → phone model
  // Use centralized grouping logic for both guest and user carts
  const groupedItems: ProductGroup[] | UserProductGroup[] = React.useMemo(() => {
    if (useUserCart) {
      return groupUserCartItems(userCartItems);
    } else {
      return groupGuestCartItems(guestCartItems);
    }
  }, [useUserCart, userCartItems, guestCartItems]);

  // Redirect if cart is empty
  useEffect(() => {
    // Don't redirect while initial loading
    if (loading) {
      return;
    }
    
    // CRITICAL FIX: Don't redirect while user cart is still loading
    // This prevents the race condition where authenticated users get redirected
    // before their cart data has loaded
    if (isLoggedIn && userCartLoading) {
      return;
    }
    
    // FIX: Check BOTH carts - allow checkout if either has items
    // This ensures logged-in users with guest cart items can proceed
    if (userCartItems.length === 0 && guestCartItems.length === 0) {
      router.push('/cart');
    }
  }, [loading, userCartItems, guestCartItems, isLoggedIn, userCartLoading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      validateCheckoutForm({
        fullName: formData.fullName,
        phone: formData.phone,
        wilayaId: selectedWilayaId || 0,
        commune: formData.commune,
        address: formData.address,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            newErrors[issue.path[0].toString()] = issue.message;
          }
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Guard against null/undefined wilayaId
    if (!selectedWilayaId) {
      setErrors({
        ...errors,
        wilaya: t('errors.selectWilaya'),
        submit: t('errors.requiredFields'),
      });
      return;
    }

    setSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      // Prepare cart items for order with all required fields
      // Use the same logic as cart selection: prefer user cart if logged in AND has items
      const orderItems = useUserCart
        ? userCartItems.map((item) => ({
            sellableItemId: item.sellable_item.id,
            quantity: item.quantity,
            priceAtOrder: item.sellable_item.price,
            unitPrice: item.sellable_item.price,
            productName: item.sellable_item.product?.name || t('fallbackUnknownProduct'),
            subProductName: item.sellable_item.variant?.name || null,
            phoneModel: item.sellable_item.description || item.sellable_item.sku || DEFAULT_PHONE_MODEL,
          }))
        : guestCartItems.map((item) => ({
            sellableItemId: item.sellableItemId,
            quantity: item.quantity,
            priceAtOrder: item.unitPrice,
            unitPrice: item.unitPrice,
            productName: item.productName,
            subProductName: item.subProductName || null,
            phoneModel: item.phoneModel || DEFAULT_PHONE_MODEL,
          }));

      // Validate we have items
      if (orderItems.length === 0) {
        throw new Error(t('errors.emptyCartBeforeOrder'));
      }

      // Get session ID for guest users or logged-in users using guest cart
      const sessionId = !useUserCart ? localStorage.getItem('cart_session_id') || undefined : undefined;

      logger.debug('Creating order with:', {
        isLoggedIn,
        itemCount: orderItems.length,
        wilayaId: selectedWilayaId,
        total,
        sessionId,
      });

      // Create order via API route (not server action)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          wilayaId: selectedWilayaId,
          commune: formData.commune.trim(),
          address: formData.address.trim(),
          deliveryPrice,
          subtotal,
          total,
          items: orderItems,
          sessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t('errors.orderCreateFailed'));
      }

      // Clear the cart that was used for the order
      // If using guest cart (either as guest or logged-in user with empty DB cart), clear it
      if (!useUserCart) {
        clearGuestCart();
      }

      logger.info('Order created successfully, redirecting...');

      // Redirect to orders page or confirmation
      // Logged-in users go to orders page; others go to home with success message
      if (isLoggedIn) {
        router.push('/orders');
      } else {
        // For guest users, redirect to home with a success message
        router.push('/?order=success');
      }
    } catch (error) {
      logger.error('Error creating order:', error);
      logger.debug('Order data:', {
        wilayaId: selectedWilayaId,
        deliveryPrice,
        subtotal,
        total,
        itemCount: useUserCart ? userCartItems.length : guestCartItems.length,
        isLoggedIn,
      });
      
      // Extract error message
      let errorMessage = t('errors.generic');
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific patterns in error message
        if (errorMessage.includes('stock') || errorMessage.includes('insufficient')) {
          errorMessage = 
            t('errors.stockIssue');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorMessage = t('errors.networkIssue');
        }
      }
      
      setErrors({
        submit: errorMessage,
      });

      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (isLoggedIn && userCartLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t('loading')}</div>
      </div>
    );
  }

  if (!hasItems) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>

      {/* Global Error Message */}
      {errors.submit && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {t('errorCardTitle')}
              </h3>
              <p className="mt-1 text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('deliveryInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">{t('fullName')} *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">{t('phone')} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0555123456"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Wilaya Dropdown */}
                <div>
                  <Label htmlFor="wilaya">{t('wilaya')} *</Label>
                  <select
                    id="wilaya"
                    value={selectedWilayaId || ''}
                    onChange={(e) =>
                      setSelectedWilayaId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      errors.wilaya ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">{t('chooseWilaya')}</option>
                    {wilayas.map((wilaya) => (
                      <option key={wilaya.id} value={wilaya.id}>
                        {wilaya.id} - {wilaya.name}
                      </option>
                    ))}
                  </select>
                  {errors.wilaya && (
                    <p className="mt-1 text-sm text-red-500">{errors.wilaya}</p>
                  )}
                </div>

                {/* Commune */}
                <div>
                  <Label htmlFor="commune">{t('commune')} *</Label>
                  <Input
                    id="commune"
                    value={formData.commune}
                    onChange={(e) =>
                      setFormData({ ...formData, commune: e.target.value })
                    }
                    className={errors.commune ? 'border-red-500' : ''}
                  />
                  {errors.commune && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.commune}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">{t('address')} *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* COD Notice */}
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>{t('paymentMethod')}:</strong> {t('cashOnDeliveryOnly')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Receipt Style */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="font-mono text-sm whitespace-pre-wrap break-words">
                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>
                  
                  {/* Header */}
                  <div className="text-center font-bold py-2">{t('receipt.checkout')}</div>
                  
                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>
                  
                  {/* Store and Order Info */}
                  <div className="py-2 space-y-0.5">
                    <div>{t('receipt.store')}: {storeSettings?.store_name || t('receipt.myStore')}</div>
                    <div>{t('receipt.order')}: {String(Date.now() % 10000).padStart(4, '0')}</div>
                  </div>
                  
                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>
                  
                  {/* Table Header */}
                  <div className="py-2">
                    <div className="flex font-bold">
                      <span className="flex-1 min-w-0">{t('receipt.mainProducts')}</span>
                      <span className="w-16 text-center">{t('receipt.qty')}</span>
                      <span className="w-24 text-right">{t('receipt.price')}</span>
                    </div>
                  </div>
                  
                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>
                  
                  {/* Main products with quantity and prices */}
                  <div className="py-2 space-y-1">
                    {groupedItems.map((productGroup) => {
                      return (
                        <div
                          key={productGroup.productId}
                          className="flex"
                        >
                          <span className="flex-1 min-w-0 truncate pr-2">
                            {productGroup.productName}
                          </span>
                          <span className="w-16 text-center">
                            {productGroup.totalQuantity}
                          </span>
                          <span className="w-24 text-right">
                            {formatCurrency(productGroup.totalPrice)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>
                  
                  {/* Total */}
                  <div className="py-2 font-bold flex">
                    <span className="flex-1 min-w-0">{t('receipt.totalAmount')}</span>
                    <span className="w-16"></span>
                    <span className="w-24 text-right">{formatCurrency(total)}</span>
                  </div>
                  
                  {/* Border line */}
                  <div className="border-t-2 border-gray-900 mb-4"></div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? t('creatingOrder') : t('confirmOrder')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
