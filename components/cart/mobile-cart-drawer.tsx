'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/store/cart-store';
import { formatCurrency } from '@/lib/formatCurrency';
import { pluralizeArticles } from '@/lib/utils/pluralization';
import {
  groupGuestCartItems,
  groupUserCartItems,
  type UserProductGroup,
} from '@/lib/utils/cart-grouping';
import type { UserCartItem, ProductGroup } from '@/lib/types/cart';
import { useLocale } from 'next-intl';

interface MobileCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  userCartItems?: UserCartItem[];
  isAuthenticated?: boolean;
  onUpdateQuantity: (sellableItemId: string, quantity: number) => void;
  onRemoveItem: (sellableItemId: string) => void;
  onUpdateUserQuantity?: (itemId: string, sellableItemId: string, quantity: number) => void;
  onRemoveUserItem?: (itemId: string, sellableItemId: string) => void;
}

export function MobileCartDrawer({
  isOpen,
  onClose,
  items,
  userCartItems = [],
  isAuthenticated = false,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateUserQuantity,
  onRemoveUserItem: _onRemoveUserItem,
}: MobileCartDrawerProps) {
  const locale = useLocale();
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Group cart items by product → sub-product → phone model
  // Use centralized grouping logic for both guest and user carts
  const groupedCartItems: ProductGroup[] | UserProductGroup[] = useMemo(() => {
    if (isAuthenticated) {
      return groupUserCartItems(userCartItems);
    } else {
      return groupGuestCartItems(items);
    }
  }, [isAuthenticated, userCartItems, items]);

  // Calculate subtotal
  const subtotal = isAuthenticated
    ? userCartItems.reduce((total, item) => total + item.sellable_item.price * item.quantity, 0)
    : items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  const itemCount = isAuthenticated
    ? userCartItems.reduce((total, item) => total + item.quantity, 0)
    : items.reduce((total, item) => total + item.quantity, 0);

  const isEmpty = isAuthenticated ? userCartItems.length === 0 : items.length === 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out md:hidden"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Panier ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items - unified grouping for both guest and authenticated users */}
        <div className="flex-1 overflow-y-auto p-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm mb-2">Votre panier est vide</p>
              <Button onClick={onClose} variant="outline" size="sm">
                Continuer mes achats
              </Button>
            </div>
          ) : (
            // Grouped display for all users
            <div className="space-y-3">
              {groupedCartItems.map((productGroup) => (
                <div
                  key={productGroup.productId}
                  className="bg-gray-50 rounded-lg border p-3"
                >
                  {/* Product Header with Image and Total */}
                  <div className="flex gap-3 mb-3">
                    <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded-md overflow-hidden border">
                      {productGroup.imageUrl ? (
                        <Image
                          src={productGroup.imageUrl}
                          alt={productGroup.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold line-clamp-2 mb-1">
                        {productGroup.productName}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">
                        {productGroup.totalQuantity}{' '}
                        {pluralizeArticles(productGroup.totalQuantity)}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(productGroup.totalPrice, true, locale)}
                      </p>
                    </div>
                  </div>

                  {/* Sub-Products and Phone Models */}
                  <div className="space-y-3 ml-2">
                    {productGroup.subProducts.map((subProduct) => (
                      <div key={subProduct.subProductName}>
                        {/* Sub-Product Header */}
                        {subProduct.subProductName !== 'Standard' && (
                          <div className="border-l-4 border-primary pl-2 py-1 mb-2 bg-muted/20">
                            <p className="text-xs font-semibold">
                              {subProduct.subProductName}:
                            </p>
                          </div>
                        )}

                        {/* Phone Models */}
                        <div className="space-y-2 pl-2 border-l-2 border-gray-300">
                          {subProduct.phoneModels.map((phoneModel) => {
                            const itemId = isAuthenticated
                              ? (phoneModel as { cartItemId?: string })
                                  .cartItemId || phoneModel.sellableItemId
                              : phoneModel.sellableItemId;

                            return (
                              <div
                                key={phoneModel.sellableItemId}
                                className="pl-2"
                              >
                                <p className="text-xs text-muted-foreground mb-1">
                                  • {phoneModel.phoneModel}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (isAuthenticated && onUpdateUserQuantity) {
                                          onUpdateUserQuantity(
                                            itemId,
                                            phoneModel.sellableItemId,
                                            phoneModel.quantity - 1
                                          );
                                        } else {
                                          if (phoneModel.quantity > 1) {
                                            onUpdateQuantity(
                                              phoneModel.sellableItemId,
                                              phoneModel.quantity - 1
                                            );
                                          } else {
                                            onRemoveItem(phoneModel.sellableItemId);
                                          }
                                        }
                                      }}
                                      className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100 transition-colors text-xs"
                                      aria-label="Diminuer la quantité"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-medium min-w-[1.5rem] text-center">
                                      {phoneModel.quantity}
                                    </span>
                                    <button
                                      onClick={() => {
                                        if (isAuthenticated && onUpdateUserQuantity) {
                                          onUpdateUserQuantity(
                                            itemId,
                                            phoneModel.sellableItemId,
                                            phoneModel.quantity + 1
                                          );
                                        } else {
                                          if (phoneModel.quantity < phoneModel.stock) {
                                            onUpdateQuantity(
                                              phoneModel.sellableItemId,
                                              phoneModel.quantity + 1
                                            );
                                          }
                                        }
                                      }}
                                      disabled={
                                        phoneModel.quantity >= phoneModel.stock
                                      }
                                      className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                      aria-label="Augmenter la quantité"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <p className="text-xs font-semibold">
                                    {formatCurrency(
                                      phoneModel.unitPrice * phoneModel.quantity
                                    , true, locale)}
                                  </p>
                                </div>
                                {phoneModel.quantity >= phoneModel.stock && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    Stock maximum
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t p-4 space-y-3 bg-white">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Sous-total:</span>
              <span>{formatCurrency(subtotal, true, locale)}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link href="/cart" className="block" onClick={onClose}>
                <Button variant="outline" className="w-full" size="lg">
                  Voir le panier
                </Button>
              </Link>
              <Link href="/checkout" className="block" onClick={onClose}>
                <Button className="w-full" size="lg">
                  Commander
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
