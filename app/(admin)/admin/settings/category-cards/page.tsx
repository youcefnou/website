import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { CategoryCardsManager } from '@/components/admin/category-cards-manager';
import type { CustomSettings } from '@/lib/types/custom-settings';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function CategoryCardsSettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const supabase = await createClient();

  // Fetch store settings
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('custom_settings')
    .eq('id', 1)
    .single();

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux paramètres
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Gestion des cartes de catégories</h2>
          <p className="text-muted-foreground">
            Configurez les cartes de catégories affichées sur la page d&apos;accueil
          </p>
        </div>
      </div>

      <CategoryCardsManager
        initialCards={customSettings.category_cards}
        categories={categories || []}
      />
    </div>
  );
}
