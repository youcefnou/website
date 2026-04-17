import { Suspense } from 'react';
import { getProducts, getCategories } from '@/app/actions/products';
import { ProductsClient } from './products-client';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import type { CustomSettings } from '@/lib/types/custom-settings';

export default async function ProductsPage() {
  const supabase = await createClient();

  // Fetch data on the server
  const [products, categories, storeSettings] = await Promise.all([
    getProducts(),
    getCategories(),
    supabase.from('store_settings').select('custom_settings').single(),
  ]);

  const customSettings = (storeSettings?.data?.custom_settings as CustomSettings) || {
    carousel_slides: [],
    carousel_settings: {
      auto_play: true,
      interval: 5000,
      show_arrows: true,
      show_dots: true,
    },
    category_cards: [],
  };

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">جاري التحميل...</div>}>
      <ProductsClient 
        initialProducts={products} 
        categories={categories}
        categoryCards={customSettings.category_cards}
      />
    </Suspense>
  );
}
