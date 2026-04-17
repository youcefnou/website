'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import {
  getUserCart,
  updateUserCartItem,
  removeUserCartItem,
  mergeGuestCart,
} from '@/app/actions/cart';
import { formatCurrency } from '@/lib/formatCurrency';
import { pluralizeArticles, pluralizeModels } from '@/lib/utils/pluralization';
import {
  groupGuestCartItems,
  groupUserCartItems,
  type UserProductGroup,
} from '@/lib/utils/cart-grouping';
import type { UserCartItem, ProductGroup } from '@/lib/types/cart';
import { logger } from '@/lib/logger';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const t = useTranslations('cartPage');
  const locale = useLocale();
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, isHydrated } =
    useCartStore();
  const { user } = useAuthStore();
  const [userCartItems, setUserCartItems] = useState<UserCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Load user cart for logged-in users
  useEffect(() => {
    async function loadUserCart() {
      if (!isHydrated) return;

      if (user) {
        try {
          const cartData = await getUserCart();
          setUserCartItems(cartData as UserCartItem[]);

          // If there are guest items, merge them
          if (items.length > 0) {
            const guestItems = items.map((item) => ({
              sellableItemId: item.sellableItemId,
              quantity: item.quantity,
            }));

            await mergeGuestCart(guestItems);
            clearCart(); // Clear guest cart after merge

            // Reload user cart
            const updatedCart = await getUserCart();
            setUserCartItems(updatedCart as UserCartItem[]);
          }
        } catch (error) {
          logger.error('Failed to load user cart:', error);
        }
      }
      setLoading(false);
    }

    loadUserCart();
  }, [user, isHydrated, items, clearCart]);

  const handleUpdateQuantity = async (
    itemId: string,
    sellableItemId: string,
    quantity: number,
    isUserItem: boolean
  ) => {
    setUpdating(itemId);
    try {
      if (isUserItem) {
        await updateUserCartItem(itemId, quantity);
        setUserCartItems((prev) =>
          quantity <= 0
            ? prev.filter((item) => item.id !== itemId)
            : prev.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
              )
        );
      } else {
        updateQuantity(sellableItemId, quantity);
      }
    } catch (error) {
      logger.error('Failed to update quantity:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (
    itemId: string,
    sellableItemId: string,
    isUserItem: boolean
  ) => {
    setUpdating(itemId);
    try {
      if (isUserItem) {
        await removeUserCartItem(itemId);
        setUserCartItems((prev) => prev.filter((item) => item.id !== itemId));
      } else {
        removeItem(sellableItemId);
      }
    } catch (error) {
      logger.error('Failed to remove item:', error);
    } finally {
      setUpdating(null);
    }
  };

  const groupedCartItems: ProductGroup[] | UserProductGroup[] = React.useMemo(() => {
    if (user) {
      return groupUserCartItems(userCartItems);
    } else {
      return groupGuestCartItems(items);
    }
  }, [user, userCartItems, items]);

  if (!isHydrated || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-[#E8642C] border-t-transparent rounded-full animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  const displayItems = user ? userCartItems : items;
  const isEmpty = displayItems.length === 0;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#E8642C]/10 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-[#E8642C]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{t('title')}</h1>
      </div>

      {isEmpty ? (
        <div className="text-center py-16 md:py-24">
          <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-gray-600" />
          </div>
          <p className="mb-6 text-lg text-gray-400">
            {t('empty')}
          </p>
          <Button asChild className="bg-[#E8642C] hover:bg-[#d45a25] text-white px-8 rounded-full">
            <Link href="/products">{t('browseProducts')}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {groupedCartItems.map((productGroup) => (
              <div key={productGroup.productId} className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
                <div className="p-4 md:p-5">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative h-20 w-20 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
                      {productGroup.imageUrl ? (
                        <Image
                          src={productGroup.imageUrl}
                          alt={productGroup.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-600">
                          {t('noImage')}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col gap-3 min-w-0">
                      {/* Product Header */}
                      <div className="flex justify-between items-start border-b border-[#2a2a2a] pb-3">
                        <div>
                          <h3 className="font-semibold text-base md:text-lg text-white">
                            {productGroup.productName}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {productGroup.totalQuantity}{' '}
                            {pluralizeArticles(productGroup.totalQuantity)}
                          </p>
                        </div>
                        <p className="font-bold text-base md:text-lg text-[#E8642C] ml-4 flex-shrink-0">
                          {formatCurrency(productGroup.totalPrice, true, locale)}
                        </p>
                      </div>

                      {/* Sub-Products */}
                      <div className="space-y-4">
                        {productGroup.subProducts.map((subProduct) => (
                          <div
                            key={subProduct.subProductName}
                            className="space-y-2"
                          >
                            {subProduct.subProductName !== 'Standard' && (
                              <div className="flex items-center justify-between border-l-2 border-[#E8642C] pl-3 py-1 bg-[#E8642C]/5 rounded-r-lg">
                                <h4 className="font-medium text-sm text-gray-200">
                                  {subProduct.subProductName}:
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {subProduct.totalQuantity}{' '}
                                  {pluralizeArticles(subProduct.totalQuantity)} •{' '}
                                  {subProduct.phoneModels.length}{' '}
                                  {pluralizeModels(subProduct.phoneModels.length)}
                                </p>
                              </div>
                            )}

                            {/* Phone Models */}
                            <div className="space-y-2 pl-2 md:pl-4">
                              {subProduct.phoneModels.map((phoneModel) => {
                                const itemId = user
                                  ? (phoneModel as { cartItemId?: string })
                                      .cartItemId || phoneModel.sellableItemId
                                  : phoneModel.sellableItemId;

                                return (
                                  <div
                                    key={phoneModel.sellableItemId}
                                    className="flex items-center justify-between py-2.5 border-t border-[#1e1e1e] first:border-0"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-300 mb-2">
                                        • {phoneModel.phoneModel}
                                      </p>

                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7 bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 hover:bg-[#222] hover:text-white"
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              itemId,
                                              phoneModel.sellableItemId,
                                              phoneModel.quantity - 1,
                                              !!user
                                            )
                                          }
                                          disabled={updating === itemId}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm text-white font-medium">
                                          {phoneModel.quantity}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7 bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 hover:bg-[#222] hover:text-white"
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              itemId,
                                              phoneModel.sellableItemId,
                                              phoneModel.quantity + 1,
                                              !!user
                                            )
                                          }
                                          disabled={
                                            updating === itemId ||
                                            phoneModel.quantity >=
                                              phoneModel.stock
                                          }
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="text-right ml-3 flex-shrink-0">
                                      <p className="font-semibold text-sm text-white">
                                        {formatCurrency(
                                          phoneModel.unitPrice *
                                            phoneModel.quantity
                                        , true, locale)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatCurrency(phoneModel.unitPrice, true, locale)} /
                                        {t('unit')}
                                      </p>
                                      <button
                                        onClick={() =>
                                          handleRemoveItem(
                                            itemId,
                                            phoneModel.sellableItemId,
                                            !!user
                                          )
                                        }
                                        disabled={updating === itemId}
                                        className="text-red-400 hover:text-red-300 text-xs mt-1 flex items-center gap-1 ml-auto transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        {t('remove')}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] sticky top-24 overflow-hidden">
              {/* Summary header */}
              <div className="px-5 py-4 border-b border-[#2a2a2a]">
                <h3 className="font-bold text-white text-lg">Résumé</h3>
              </div>
              
              <div className="p-5 space-y-4">
                {/* Items summary */}
                <div className="space-y-2">
                  {groupedCartItems.map((productGroup) => (
                    <React.Fragment key={productGroup.productId}>
                      {productGroup.subProducts.map((subProduct) =>
                        subProduct.phoneModels.map((phoneModel) => (
                          <div
                            key={phoneModel.sellableItemId}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-400 truncate pr-2 flex-1">
                              {phoneModel.phoneModel}
                              <span className="text-gray-600 ml-1">×{phoneModel.quantity}</span>
                            </span>
                            <span className="text-gray-200 flex-shrink-0">
                              {formatCurrency(
                                phoneModel.unitPrice * phoneModel.quantity
                              , true, locale)}
                            </span>
                          </div>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="border-t border-[#2a2a2a] pt-3">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>{t('variants')}</span>
                    <span>
                      {groupedCartItems.reduce(
                        (sum, g) =>
                          sum +
                          g.subProducts.reduce(
                            (s, sp) => s + sp.phoneModels.length,
                            0
                          ),
                        0
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-3">
                  <Button
                    className="w-full bg-[#E8642C] hover:bg-[#d45a25] text-white font-semibold py-5 rounded-xl shadow-lg shadow-[#E8642C]/10 transition-all hover:shadow-[#E8642C]/20"
                    size="lg"
                    onClick={() => router.push('/checkout')}
                  >
                    {t('checkout')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-xl"
                    onClick={() => router.push('/products')}
                  >
                    {t('continueShopping')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
