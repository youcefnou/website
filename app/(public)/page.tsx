import { CATEGORY_FALLBACK_COLORS, CATEGORY_FALLBACK_ICONS } from '@/lib/constants/category-fallback';
import { getStoreSettings } from '@/app/actions/settings';
import { getActiveCategories, getFeaturedProducts, getHomeAllProducts } from '@/lib/data/home';
import { HeroCarousel } from '@/components/home/hero-carousel';
import { CategoryCards } from '@/components/home/category-cards';
import { FeaturesSection } from '@/components/home/features-section';
import { ProductCardEnhanced } from '@/components/products/product-card-enhanced';
import { getLocale, getTranslations } from 'next-intl/server';
import { RTL_LOCALES } from '@/i18n/routing';
import type { CustomSettings } from '@/lib/types/custom-settings';

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations('home');
  const isRTL = RTL_LOCALES.includes(locale as (typeof RTL_LOCALES)[number]);
  const storeSettings = await getStoreSettings();

  // Extract custom settings for carousel and category cards
  const customSettings = (storeSettings?.custom_settings as CustomSettings) || {
    carousel_slides: [],
    carousel_settings: {
      auto_play: true,
      interval: 5000,
      show_arrows: true,
      show_dots: true,
    },
    category_cards: [],
  };

  let allProducts = null;
  let products = null;
  let categories = null;

  // Fetch data only if Supabase is configured
  try {
    allProducts = await getHomeAllProducts();
    products = await getFeaturedProducts();
    categories = await getActiveCategories();
  } catch {
    // Supabase is not configured, continue with empty data
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase not configured, displaying page without product data');
    }
  }

  // Prefer configured cards, otherwise fallback to categories list
  const categoryCards =
    (customSettings.category_cards || []).filter((card) => card.enabled);

  const fallbackCards =
    categories?.map((category, index) => ({
      id: category.id,
      name: category.name,
      icon: CATEGORY_FALLBACK_ICONS[index % CATEGORY_FALLBACK_ICONS.length],
      color: CATEGORY_FALLBACK_COLORS[index % CATEGORY_FALLBACK_COLORS.length],
      category_id: category.id,
      enabled: true,
      order: category.display_order ?? index + 1,
    })) || [];

  // Type for sellable items used in product cards
  type SellableItem = { price: number; stock: number; image_url: string | null };

  // Helper function to get minimum price from sellable items
  const getMinPrice = (items: SellableItem[] | undefined): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((min, item) => (item.price < min ? item.price : min), items[0].price);
  };

  // Helper function to get first available image
  const getFirstImage = (items: SellableItem[] | undefined): string => {
    return items?.find((item) => item.image_url)?.image_url || '';
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={
        {
          '--primary-color': storeSettings?.primary_color || '#000000',
          '--secondary-color': storeSettings?.secondary_color || '#666666',
          '--accent-color': storeSettings?.accent_color || '#0066cc',
        } as React.CSSProperties
      }
    >
      {/* Hero Carousel Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-12">
        <HeroCarousel 
          slides={customSettings.carousel_slides}
          settings={customSettings.carousel_settings}
        />
      </section>

      {/* Categories Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t('shopByCategory')}
        </h2>
        <CategoryCards cards={categoryCards.length > 0 ? categoryCards : fallbackCards} />
        
        {/* All Products Grid */}
        {allProducts && allProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-6">{t('allProducts')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allProducts.map((product) => {
                const minPrice = getMinPrice(product.sellable_items as SellableItem[] | undefined);
                const firstImage = getFirstImage(product.sellable_items as SellableItem[] | undefined);
                
                // Handle category - Supabase may return array for foreign key relations
                const category = Array.isArray(product.category) 
                  ? (product.category[0] as { name: string } | undefined) 
                  : (product.category as { name: string } | null | undefined);
                
                return (
                  <ProductCardEnhanced 
                    key={product.id} 
                    product={{
                      id: product.id,
                      name: product.name,
                      image_url: firstImage,
                      price: minPrice,
                      category: category || undefined,
                      has_variants: product.has_variants,
                      sellable_items: product.sellable_items || [],
                    }} 
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      {products && products.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-6 py-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('featuredProducts')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const minPrice = getMinPrice(product.sellable_items as SellableItem[] | undefined);
              const firstImage = getFirstImage(product.sellable_items as SellableItem[] | undefined);
              
              return (
                <ProductCardEnhanced 
                  key={product.id} 
                  product={{
                    id: product.id,
                    name: product.name,
                    image_url: firstImage,
                    price: minPrice,
                    category: product.category,
                    has_variants: product.has_variants,
                    sellable_items: product.sellable_items || [],
                  }} 
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Features/Trust Badges Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-12">
        <FeaturesSection />
      </section>
    </div>
  );
}
