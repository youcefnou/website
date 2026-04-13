'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageGallery } from '@/components/product/image-gallery';
import { ProductCardCompact } from '@/components/product/product-card-compact';
import { MultiVariantSelector } from '@/components/products/multi-variant-selector';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { trackProductView, trackAddToCart } from '@/lib/analytics';
import { addToCart as addToSupabaseCart } from '@/lib/cartSync';
import { validateAddToCart } from '@/lib/validations/product';
import { formatCurrency } from '@/lib/formatCurrency';
import { Truck, Shield, ChevronRight } from 'lucide-react';

interface SellableItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  sku: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  has_variants: boolean;
  category?: {
    id: string;
    name: string;
  };
  sellable_items: SellableItem[];
  product_variants?: ProductVariant[];
}

interface RelatedProduct {
  id: string;
  name: string;
  sellable_items: Array<{
    id: string;
    price: number;
    stock: number;
    image_url: string | null;
  }>;
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations('productPage');
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    async function loadData() {
      try {
        // Load product
        const productRes = await fetch(`/api/products/${params.id}`);
        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);
          
          // Track product view
          if (productData) {
            trackProductView(productData.id, productData.name);
          }

          // Set initial selected variant for products with variants
          if (productData.has_variants && productData.sellable_items.length > 0) {
            setSelectedVariant(productData.sellable_items[0].id);
          }

          // Load related products
          if (productData.category?.id) {
            const relatedRes = await fetch(
              `/api/products?category=${productData.category.id}&limit=4&exclude=${params.id}`
            );
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              setRelatedProducts(relatedData.slice(0, 4));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!product) return;

    // Determine which sellable item to add
    let sellableItemId: string;
    if (product.has_variants) {
      if (!selectedVariant) {
        alert(t('alerts.selectVariant'));
        return;
      }
      sellableItemId = selectedVariant;
    } else {
      if (product.sellable_items.length === 0) return;
      sellableItemId = product.sellable_items[0].id;
    }

    const sellableItem = product.sellable_items.find(
      (si) => si.id === sellableItemId
    );

    if (!sellableItem) return;

    // Get variant name (sub-product name)
    const variant = product.product_variants?.find(
      (v) => v.id === sellableItem.variant_id
    );
    const subProductName = variant?.name || '';

    setAddingToCart(true);
    try {
      // Validate before adding to cart
      validateAddToCart({
        sellableItemId,
        quantity,
        stock: sellableItem.stock,
      });

      if (user) {
        // Add to Supabase for logged-in users
        await addToSupabaseCart(sellableItemId, quantity);
      } else {
        // Add to localStorage for guests with new cart structure
        addItem({
          productId: product.id,
          productName: product.name,
          subProductName: subProductName,
          phoneModel: sellableItem.description || sellableItem.sku,
          quantity,
          unitPrice: sellableItem.price,
          sellableItemId,
          image_url: sellableItem.image_url,
          sku: sellableItem.sku,
          stock: sellableItem.stock,
        });
      }

      // Track add to cart
      trackAddToCart(product.id, quantity, sellableItem.price);

      // Success message
      alert(t('alerts.itemsAdded', { count: quantity }));
      router.push('/cart');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(t('alerts.addToCartError'));
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleMultiVariantAddToCart = async (
    selections: Array<{ variantId: string; quantity: number }>
  ) => {
    if (!product) return;

    try {
      let totalItems = 0;
      
      for (const selection of selections) {
        const sellableItem = product.sellable_items.find(
          (si) => si.id === selection.variantId
        );

        if (!sellableItem) continue;

        // Get variant name (sub-product name)
        const variant = product.product_variants?.find(
          (v) => v.id === sellableItem.variant_id
        );
        const subProductName = variant?.name || '';

        // Validate each selection
        validateAddToCart({
          sellableItemId: selection.variantId,
          quantity: selection.quantity,
          stock: sellableItem.stock,
        });

        if (user) {
          // Add to Supabase for logged-in users
          await addToSupabaseCart(selection.variantId, selection.quantity);
        } else {
          // Add to localStorage for guests with new cart structure
          addItem({
            productId: product.id,
            productName: product.name,
            subProductName: subProductName,
            phoneModel: sellableItem.description || sellableItem.sku,
            quantity: selection.quantity,
            unitPrice: sellableItem.price,
            sellableItemId: selection.variantId,
            image_url: sellableItem.image_url,
            sku: sellableItem.sku,
            stock: sellableItem.stock,
          });
        }

        // Track add to cart
        trackAddToCart(product.id, selection.quantity, sellableItem.price);
        totalItems += selection.quantity;
      }

      // Success message
      alert(t('alerts.itemsAdded', { count: totalItems }));
      router.push('/cart');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(t('alerts.addToCartError'));
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t('loading')}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t('notFound')}</div>
      </div>
    );
  }

  // Get first image only from sellable items
  const firstImage = product.sellable_items?.find(item => item.image_url)?.image_url;
  const displayImages = firstImage ? [firstImage] : [];

  // Get current sellable item for pricing and stock
  const currentSellableItem = product.has_variants
    ? product.sellable_items.find((si) => si.id === selectedVariant)
    : product.sellable_items[0];

  const currentPrice = currentSellableItem?.price || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition">
          {t('home')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        {product.category ? (
          <>
            <Link 
              href={`/products?category=${product.category.id}`}
              className="hover:text-foreground transition"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        ) : null}
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery - Left Side */}
        <div>
          <ImageGallery images={displayImages} productName={product.name} />
        </div>

        {/* Product Info - Right Side */}
        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.name}</h1>
          </div>

          {/* Conditional Rendering: Multi-Variant or Traditional Selector */}
          {product.has_variants && product.sellable_items.length >= 5 ? (
            // Multi-Variant Selector for 5+ variants
            <MultiVariantSelector
              variants={product.sellable_items.map((item) => ({
                id: item.id,
                description: item.description,
                stock: item.stock,
                price: item.price,
              }))}
              sharedPrice={currentPrice}
              onAddToCart={handleMultiVariantAddToCart}
            />
          ) : (
            <>
              {/* Price */}
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {formatCurrency(currentPrice)}
                </p>
              </div>

              {/* Product Description - Placed under price */}
              {product.description && (
                <div className="py-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Variant Selector */}
              {product.has_variants && product.sellable_items.length > 0 && (
                <div>
                  <label className="block text-base font-semibold mb-3">
                    {t('chooseVariant')}:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {product.sellable_items.map((item) => {
                      const variant = product.product_variants?.find(
                        (v) => v.id === item.variant_id
                      );
                      const variantName = variant?.name || item.description || t('standard');
                      const isSelected = selectedVariant === item.id;

                      return (
                        <Button
                          key={item.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="h-auto py-4 text-base sm:text-lg min-h-[44px]"
                          onClick={() => setSelectedVariant(item.id)}
                        >
                          <div className="text-center w-full">
                            <div className="font-medium">{variantName}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector and Add to Cart */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center border-2 rounded-md w-full sm:w-auto justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 text-xl"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="px-8 font-medium text-2xl">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 text-xl"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    size="lg"
                    className="flex-1 w-full h-12"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? t('adding') : t('addToCart')}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Trust Badges */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-5 h-5 text-primary" />
              <span>{t('deliveryAvailable')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-5 h-5 text-primary" />
              <span>{t('warranty')}</span>
            </div>
          </div>

          {/* SKU */}
          {currentSellableItem && (
            <div className="text-sm text-muted-foreground pt-4 border-t">
              {t('reference')}: {currentSellableItem.sku}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-12">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="description">{t('tabs.description')}</TabsTrigger>
            <TabsTrigger value="specifications">{t('tabs.specifications')}</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="prose prose-sm max-w-none">
              {product.description ? (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  {t('noDescription')}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">{t('category')}:</span>
                <span className="text-muted-foreground">
                  {product.category?.name || t('uncategorized')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">SKU:</span>
                <span className="text-muted-foreground">
                  {currentSellableItem?.sku || 'N/A'}
                </span>
              </div>
              {product.has_variants && (
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">{t('variants')}:</span>
                  <span className="text-muted-foreground">
                    {t('optionsCount', { count: product.sellable_items.length })}
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">{t('youMayAlsoLike')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((relatedProduct) => {
              const firstItem = relatedProduct.sellable_items[0];
              const totalStock = relatedProduct.sellable_items.reduce(
                (sum, item) => sum + item.stock,
                0
              );
              
              return (
                <ProductCardCompact
                  key={relatedProduct.id}
                  product={{
                    id: relatedProduct.id,
                    name: relatedProduct.name,
                    image_url: firstItem?.image_url || undefined,
                    price: firstItem?.price || 0,
                    inStock: totalStock > 0,
                  }}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
