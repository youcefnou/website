'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Variant {
  id: string;
  description: string | null;
  stock: number;
  price: number;
}

interface MultiVariantSelectorProps {
  variants: Variant[];
  sharedPrice: number;
  onAddToCart: (selections: Array<{ variantId: string; quantity: number }>) => Promise<void>;
}

export function MultiVariantSelector({
  variants,
  sharedPrice,
  onAddToCart,
}: MultiVariantSelectorProps) {
  const t = useTranslations('productPage.multiVariant');
  const locale = useLocale();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);

  const increment = (variantId: string) => {
    setQuantities((prev) => {
      const current = prev[variantId] || 0;
      return { ...prev, [variantId]: current + 1 };
    });
  };

  const decrement = (variantId: string) => {
    setQuantities((prev) => {
      const current = prev[variantId] || 0;
      if (current > 0) {
        return { ...prev, [variantId]: current - 1 };
      }
      return prev;
    });
  };

  const handleAddToCart = async () => {
    // Get all variants with quantity > 0
    const selections = variants
      .filter((v) => (quantities[v.id] || 0) > 0)
      .map((v) => ({
        variantId: v.id,
        quantity: quantities[v.id],
      }));

    if (selections.length === 0) {
      alert(t('selectAtLeastOne'));
      return;
    }

    setIsAdding(true);
    try {
      await onAddToCart(selections);
    } finally {
      setIsAdding(false);
    }
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="space-y-6">
      {/* Shared Price */}
      <div>
        <p className="text-3xl lg:text-4xl font-bold text-primary mb-2">
          {formatCurrency(sharedPrice, true, locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('sharedPriceNote')}
        </p>
      </div>

      {/* Variants Section */}
      <div>
        <label className="block text-base font-semibold mb-3">
          {t('selectVariantsAndQuantities')}
        </label>

        {/* Scrollable variant list */}
        <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
          {variants.map((variant) => {
            const quantity = quantities[variant.id] || 0;
            const variantName = variant.description || t('standard');

            return (
              <div
                key={variant.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  quantity > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white'
                }`}
              >
                {/* Variant Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base truncate">
                      {variantName}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => decrement(variant.id)}
                    disabled={quantity === 0}
                    className="w-12 h-12 flex items-center justify-center border-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation text-xl"
                    aria-label={t('decreaseQuantity')}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <span className="text-xl font-bold min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  
                  <button
                    onClick={() => increment(variant.id)}
                    className="w-12 h-12 flex items-center justify-center border-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation text-xl"
                    aria-label={t('increaseQuantity')}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {totalItems > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{t('selectedItems')}</span>
            <span className="font-bold">{totalItems}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{t('total')}</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(totalItems * sharedPrice, true, locale)}
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={totalItems === 0 || isAdding}
      >
        {isAdding
          ? t('adding')
          : totalItems > 0
          ? t('addItemsToCart', { count: totalItems })
          : t('selectVariants')}
      </Button>
    </div>
  );
}
