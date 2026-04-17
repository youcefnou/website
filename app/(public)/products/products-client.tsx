'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getIconComponent } from '@/lib/utils/icon-utils';
import { formatCurrency } from '@/lib/formatCurrency';
import { Package } from 'lucide-react';
import type { CategoryCard } from '@/lib/types/custom-settings';

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface SellableItem {
  id: string;
  price: number;
  stock: number;
  image_url: string | null;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  has_variants: boolean;
  category_id: string | null;
  sellable_items: SellableItem[];
}

interface ProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  categoryCards?: CategoryCard[];
}

export function ProductsClient({
  initialProducts,
  categories,
  categoryCards = [],
}: ProductsClientProps) {
  const t = useTranslations('productsPage');
  const locale = useLocale();
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Create a map of category_id to icon data
  const categoryIconMap = new Map<string, { icon: string; color: string }>();
  categoryCards.forEach((card) => {
    if (card.category_id && card.enabled) {
      const iconName = typeof card.icon === 'string' ? card.icon : 'Package';
      categoryIconMap.set(card.category_id, {
        icon: iconName,
        color: card.color,
      });
    }
  });

  // Filter by category on mount if URL has categoryId
  useState(() => {
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      setSelectedCategory(categoryId);
      const filtered = initialProducts.filter((p) => p.category_id === categoryId);
      setFilteredProducts(filtered);
    }
  });

  const filterByCategory = (categoryId: string | null) => {
    if (!categoryId) {
      setFilteredProducts(initialProducts);
      setSelectedCategory(null);
      router.push('/products');
    } else {
      const filtered = initialProducts.filter((p) => p.category_id === categoryId);
      setFilteredProducts(filtered);
      setSelectedCategory(categoryId);
      router.push(`/products?categoryId=${categoryId}`);
    }
  };

  const getMinPrice = (sellableItems: SellableItem[]) => {
    if (!sellableItems || sellableItems.length === 0) return 0;
    return Math.min(...sellableItems.map((item) => item.price));
  };

  const getCategoryIcon = (categoryId: string) => {
    const iconData = categoryIconMap.get(categoryId);
    if (iconData && iconData.icon) {
      const IconComponent = getIconComponent(iconData.icon);
      if (IconComponent) {
        return <IconComponent className="w-4 h-4 mr-2" />;
      }
    }
    // Default fallback icon
    return <Package className="w-4 h-4 mr-2" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar - Categories */}
        <aside className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-4 text-xl font-bold">{t('categoriesTitle')}</h2>
              <div className="space-y-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => filterByCategory(null)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  {t('allProducts')}
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? 'default' : 'ghost'
                    }
                    className="w-full justify-start"
                    onClick={() => filterByCategory(category.id)}
                  >
                    {getCategoryIcon(category.id)}
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Grid - Products */}
        <main className="lg:col-span-3">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">
              {selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name ||
                  t('productsFallback')
                : t('allProducts')}
            </h1>
            <p className="text-muted-foreground">
              {t('productsCount', { count: filteredProducts.length })}
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('emptyCategory')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const minPrice = getMinPrice(product.sellable_items);
                const firstImage =
                  product.sellable_items.find((item) => item.image_url)
                    ?.image_url || null;

                return (
                  <Link key={product.id} href={`/product/${product.id}`}>
                    <Card className="h-full transition-shadow hover:shadow-lg">
                      <CardContent className="p-4">
                        {/* Product Image */}
                        <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-muted">
                          {firstImage ? (
                            <Image
                              src={firstImage}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              {t('noImage')}
                            </div>
                          )}
                          {/* Wholesale Badge */}
                          <div className="absolute left-2 top-2">
                            <span className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                              {t('wholesaleBadge')}
                            </span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <h3 className="mb-2 text-lg font-semibold line-clamp-2">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold">
                              {formatCurrency(minPrice, true, locale)}
                            </span>
                            {product.sellable_items.length > 1 && (
                              <span className="text-sm text-muted-foreground">
                                {' '}
                                {t('startingFrom')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock Indicator */}
                        <div className="mt-2">
                          {product.sellable_items.some(
                            (item) => item.stock > 0
                          ) ? (
                            <span className="text-sm text-green-600">
                              {t('inStock')}
                            </span>
                          ) : (
                            // Text hidden per requirements
                            null
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
