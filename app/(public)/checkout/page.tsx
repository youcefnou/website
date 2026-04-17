'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
import { Package, MapPin, CreditCard, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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

const DEFAULT_PHONE_MODEL = 'Standard';

export default function CheckoutPage() {
  const t = useTranslations('checkoutPage');
  const locale = useLocale();
  const router = useRouter();
  const guestCartItems = useCartStore((state) => state.items);
  const guestSubtotal = useCartStore((state) => state.getSubtotal());
  const clearGuestCart = useCartStore((state) => state.clearCart);

  const [userCartItems, setUserCartItems] = useState<UserCartItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCartLoading, setUserCartLoading] = useState(false);
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

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        const isAuthenticated = !!user;
        
        if (user) {
          setUserCartLoading(true);
        }
        setIsLoggedIn(isAuthenticated);

        if (user) {
          try {
            const cart = await getUserCart();
            setUserCartItems(cart);
          } finally {
            setUserCartLoading(false);
          }
        }

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

  const useUserCart = isLoggedIn && userCartItems.length > 0;
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

  const groupedItems: ProductGroup[] | UserProductGroup[] = React.useMemo(() => {
    if (useUserCart) {
      return groupUserCartItems(userCartItems);
    } else {
      return groupGuestCartItems(guestCartItems);
    }
  }, [useUserCart, userCartItems, guestCartItems]);

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn && userCartLoading) return;
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

    if (!validateForm()) return;

    if (!selectedWilayaId) {
      setErrors({
        ...errors,
        wilaya: t('errors.selectWilaya'),
        submit: t('errors.requiredFields'),
      });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
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

      if (orderItems.length === 0) {
        throw new Error(t('errors.emptyCartBeforeOrder'));
      }

      const sessionId = !useUserCart ? localStorage.getItem('cart_session_id') || undefined : undefined;

      logger.debug('Creating order with:', {
        isLoggedIn,
        itemCount: orderItems.length,
        wilayaId: selectedWilayaId,
        total,
        sessionId,
      });

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

      if (!useUserCart) {
        clearGuestCart();
      }

      logger.info('Order created successfully, redirecting...');

      if (isLoggedIn) {
        router.push('/orders');
      } else {
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
      
      let errorMessage = t('errors.generic');
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes('stock') || errorMessage.includes('insufficient')) {
          errorMessage = t('errors.stockIssue');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorMessage = t('errors.networkIssue');
        }
      }
      
      setErrors({
        submit: errorMessage,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (isLoggedIn && userCartLoading)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-[#E8642C] border-t-transparent rounded-full animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (!hasItems) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#E8642C]/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-[#E8642C]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{t('title')}</h1>
      </div>

      {/* Global Error Message */}
      {errors.submit && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-300">
                {t('errorCardTitle')}
              </h3>
              <p className="mt-1 text-sm text-red-400">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E8642C]" />
                <h2 className="font-semibold text-white">{t('deliveryInfo')}</h2>
              </div>
              
              <div className="p-5 space-y-5">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName" className="text-gray-300 text-sm">{t('fullName')} *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className={`mt-1.5 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-[#E8642C]/50 ${errors.fullName ? 'border-red-500/50' : ''}`}
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-gray-300 text-sm">{t('phone')} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0555123456"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={`mt-1.5 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-[#E8642C]/50 ${errors.phone ? 'border-red-500/50' : ''}`}
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.phone}</p>
                  )}
                </div>

                {/* Wilaya Dropdown */}
                <div>
                  <Label htmlFor="wilaya" className="text-gray-300 text-sm">{t('wilaya')} *</Label>
                  <select
                    id="wilaya"
                    value={selectedWilayaId || ''}
                    onChange={(e) =>
                      setSelectedWilayaId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className={`mt-1.5 flex h-10 w-full rounded-lg border bg-[#1a1a1a] border-[#2a2a2a] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#E8642C]/50 focus:ring-1 focus:ring-[#E8642C]/20 ${
                      errors.wilaya ? 'border-red-500/50' : ''
                    }`}
                  >
                    <option value="" className="bg-[#1a1a1a]">{t('chooseWilaya')}</option>
                    {wilayas.map((wilaya) => (
                      <option key={wilaya.id} value={wilaya.id} className="bg-[#1a1a1a]">
                        {wilaya.id} - {wilaya.name}
                      </option>
                    ))}
                  </select>
                  {errors.wilaya && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.wilaya}</p>
                  )}
                </div>

                {/* Commune */}
                <div>
                  <Label htmlFor="commune" className="text-gray-300 text-sm">{t('commune')} *</Label>
                  <Input
                    id="commune"
                    value={formData.commune}
                    onChange={(e) =>
                      setFormData({ ...formData, commune: e.target.value })
                    }
                    className={`mt-1.5 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-[#E8642C]/50 ${errors.commune ? 'border-red-500/50' : ''}`}
                  />
                  {errors.commune && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.commune}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address" className="text-gray-300 text-sm">{t('address')} *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className={`mt-1.5 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-[#E8642C]/50 ${errors.address ? 'border-red-500/50' : ''}`}
                  />
                  {errors.address && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* COD Notice */}
                <div className="flex items-center gap-3 rounded-xl bg-[#E8642C]/5 border border-[#E8642C]/20 p-4">
                  <CreditCard className="w-5 h-5 text-[#E8642C] flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-200">
                      <strong>{t('paymentMethod')}:</strong>{' '}
                      <span className="text-gray-400">{t('cashOnDeliveryOnly')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] sticky top-24 overflow-hidden">
              {/* Summary header */}
              <div className="px-5 py-4 border-b border-[#2a2a2a]">
                <h3 className="font-bold text-white text-lg">Résumé de commande</h3>
              </div>
              
              <div className="p-5 space-y-4">
                {/* Products */}
                <div className="space-y-2">
                  {groupedItems.map((productGroup) => (
                    <div
                      key={productGroup.productId}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-400 flex-1 truncate pr-2">
                        {productGroup.productName}
                        <span className="text-gray-600 ml-1">×{productGroup.totalQuantity}</span>
                      </span>
                      <span className="text-gray-200 flex-shrink-0">
                        {formatCurrency(productGroup.totalPrice, true, locale)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2a2a2a] pt-3 space-y-2">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sous-total</span>
                    <span className="text-gray-200">{formatCurrency(subtotal, true, locale)}</span>
                  </div>

                  {/* Delivery */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Livraison</span>
                    <span className="text-gray-200">
                      {selectedWilaya ? formatCurrency(deliveryPrice, true, locale) : '—'}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-[#2a2a2a] pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-white text-lg">{t('receipt.totalAmount')}</span>
                    <span className="font-bold text-[#E8642C] text-lg">
                      {formatCurrency(total, true, locale)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#E8642C] hover:bg-[#d45a25] text-white font-semibold py-5 rounded-xl shadow-lg shadow-[#E8642C]/10 transition-all hover:shadow-[#E8642C]/20 disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('creatingOrder')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {t('confirmOrder')}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
