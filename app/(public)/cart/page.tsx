'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

export default function CartPage() {
  const t = useTranslations('cartPage');
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
        // Update local state
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

  // Group cart items by product → sub-product → phone model
  // Use centralized grouping logic for both guest and user carts
  const groupedCartItems: ProductGroup[] | UserProductGroup[] = React.useMemo(() => {
    if (user) {
      return groupUserCartItems(userCartItems);
    } else {
      return groupGuestCartItems(items);
    }
  }, [user, userCartItems, items]);

  if (!isHydrated || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t('loading')}</div>
      </div>
    );
  }

  // Determine which cart to display
  const displayItems = user ? userCartItems : items;
  const isEmpty = displayItems.length === 0;

  // Calculate subtotal - not used in receipt-style display but kept for future reference
  // const subtotal = user
  //   ? userCartItems.reduce(
  //       (total, item) => total + item.sellable_item.price * item.quantity,
  //       0
  //     )
  //   : getSubtotal();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>

      {isEmpty ? (
        <div className="text-center py-12">
          <p className="mb-4 text-lg text-muted-foreground">
            {t('empty')}
          </p>
          <Button asChild>
            <Link href="/products">{t('browseProducts')}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Items - Grouped by Product → Sub-Product → Phone Model */}
          <div className="space-y-4 lg:col-span-2">
            {groupedCartItems.map((productGroup) => (
              <Card key={productGroup.productId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image (shared for all variants) */}
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {productGroup.imageUrl ? (
                        <Image
                          src={productGroup.imageUrl}
                          alt={productGroup.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          {t('noImage')}
                        </div>
                      )}
                    </div>

                    {/* Product Details with Sub-Products */}
                    <div className="flex flex-1 flex-col gap-3">
                      {/* Product Header - appears ONCE */}
                      <div className="flex justify-between items-start border-b pb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {productGroup.productName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {productGroup.totalQuantity}{' '}
                            {pluralizeArticles(productGroup.totalQuantity)}
                          </p>
                        </div>
                        <p className="font-bold text-lg ml-4">
                          {formatCurrency(productGroup.totalPrice)}
                        </p>
                      </div>

                      {/* Sub-Products List - each appears ONCE */}
                      <div className="space-y-4">
                        {productGroup.subProducts.map((subProduct) => (
                          <div
                            key={subProduct.subProductName}
                            className="space-y-2"
                          >
                            {/* Sub-Product Header (if not "Standard") */}
                            {subProduct.subProductName !== 'Standard' && (
                              <div className="flex items-center justify-between border-l-4 border-primary pl-3 py-1 bg-muted/30">
                                <h4 className="font-medium text-sm">
                                  {subProduct.subProductName}:
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {subProduct.totalQuantity}{' '}
                                  {pluralizeArticles(subProduct.totalQuantity)} •{' '}
                                  {subProduct.phoneModels.length}{' '}
                                  {pluralizeModels(subProduct.phoneModels.length)}
                                </p>
                              </div>
                            )}

                            {/* Phone Models - listed under sub-product */}
                            <div className="space-y-2 pl-4">
                              {subProduct.phoneModels.map((phoneModel) => {
                                const itemId = user
                                  ? (phoneModel as { cartItemId?: string })
                                      .cartItemId || phoneModel.sellableItemId
                                  : phoneModel.sellableItemId;

                                return (
                                  <div
                                    key={phoneModel.sellableItemId}
                                    className="flex items-center justify-between py-2 border-t first:border-0"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm mb-2">
                                        • {phoneModel.phoneModel}
                                      </p>

                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
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
                                          -
                                        </Button>
                                        <span className="w-8 text-center">
                                          {phoneModel.quantity}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
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
                                          +
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="text-right ml-4">
                                      <p className="font-bold">
                                        {formatCurrency(
                                          phoneModel.unitPrice *
                                            phoneModel.quantity
                                        )}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatCurrency(phoneModel.unitPrice)} /
                                        {t('unit')}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveItem(
                                            itemId,
                                            phoneModel.sellableItemId,
                                            !!user
                                          )
                                        }
                                        disabled={updating === itemId}
                                        className="text-destructive mt-1"
                                      >
                                        {t('remove')}
                                      </Button>
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary - Receipt Style */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="font-mono text-sm whitespace-pre-wrap break-words">
                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>

                  {/* Header */}
                  <div className="text-center font-bold py-2">{t('title')}</div>

                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>

                  {/* Product Info */}
                  <div className="py-2">
                    {groupedCartItems.length > 0 && (
                      <div className="font-bold">
                        PRODUCT: {groupedCartItems[0].productName}
                      </div>
                    )}
                  </div>

                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>

                  {/* Table Header */}
                  <div className="py-2">
                    <div className="flex justify-between font-bold">
                      <span className="flex-[2]">{t('receipt.item')}</span>
                      <span className="w-16 text-center">{t('receipt.qty')}</span>
                      <span className="w-24 text-right">{t('receipt.price')}</span>
                    </div>
                  </div>

                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>

                  {/* Items */}
                  <div className="py-2 space-y-1">
                    {groupedCartItems.map((productGroup) => (
                      <React.Fragment key={productGroup.productId}>
                        {productGroup.subProducts.map((subProduct) =>
                          subProduct.phoneModels.map((phoneModel) => (
                            <div
                              key={phoneModel.sellableItemId}
                              className="flex justify-between"
                            >
                              <span className="flex-[2] truncate pr-2">
                                {phoneModel.phoneModel}
                              </span>
                              <span className="w-16 text-center">
                                {phoneModel.quantity}
                              </span>
                              <span className="w-24 text-right">
                                {formatCurrency(
                                  phoneModel.unitPrice * phoneModel.quantity
                                )}
                              </span>
                            </div>
                          ))
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Border line */}
                  <div className="border-t-2 border-gray-900"></div>

                  {/* Variants Count */}
                  <div className="py-2 font-bold">
                    {t('variants')}:{' '}
                    {groupedCartItems.reduce(
                      (sum, g) =>
                        sum +
                        g.subProducts.reduce(
                          (s, sp) => s + sp.phoneModels.length,
                          0
                        ),
                      0
                    )}
                  </div>

                  {/* Border line */}
                  <div className="border-t-2 border-gray-900 mb-4"></div>
                </div>

                {/* Action Buttons */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push('/checkout')}
                >
                  {t('checkout')}
                </Button>

                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => router.push('/products')}
                >
                  {t('continueShopping')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
