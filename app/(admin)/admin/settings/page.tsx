import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { ImageUpload } from '@/components/admin/image-upload';
import { SettingsForm } from '@/components/admin/settings-form';
import { ThemeColorPicker } from '@/components/admin/theme-color-picker';
import { StoreNameEditor } from '@/components/admin/store-name-editor';
import { FooterTaglineEditor } from '@/components/admin/footer-tagline-editor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const supabase = await createClient();

  // Fetch store settings
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single();

  return (
    <div className="space-y-6" dir="ltr">
      <div>
        <h2 className="text-2xl font-bold">Paramètres de la boutique</h2>
        <p className="text-muted-foreground">
          Gérer le logo et les paramètres généraux
        </p>
      </div>

      {/* Homepage Management Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Gestion de la page d&apos;accueil</h3>
        <div className="space-y-3">
          <Link href="/admin/settings/carousel">
            <Button variant="outline" className="w-full justify-between">
              <span>Gestion du carrousel</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/admin/settings/category-cards">
            <Button variant="outline" className="w-full justify-between">
              <span>Gestion des cartes de catégories</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Pages Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Contenu des pages</h3>
        <div className="space-y-3">
          <Link href="/admin/settings/pages">
            <Button variant="outline" className="w-full justify-between">
              <span>Gestion des pages (FAQ, À Propos)</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Delivery Prices Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Livraison</h3>
        <div className="space-y-3">
          <Link href="/admin/settings/delivery">
            <Button variant="outline" className="w-full justify-between">
              <span>Prix de livraison</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Logo de la boutique</h3>
        <ImageUpload
          currentImageUrl={storeSettings?.logo_url || ''}
          type="logo"
          label="Télécharger un nouveau logo"
        />
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Nom de la boutique</h3>
        <StoreNameEditor currentName={storeSettings?.store_name || ''} />
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Texte du pied de page</h3>
        <FooterTaglineEditor 
          currentTagline={storeSettings?.footer_tagline || 'Votre destination pour les meilleurs accessoires de téléphone en Algérie'} 
        />
      </div>

      <ThemeColorPicker
        initialColors={{
          primary_color: storeSettings?.primary_color || '#000000',
          secondary_color: storeSettings?.secondary_color || '#666666',
          accent_color: storeSettings?.accent_color || '#0066cc',
        }}
      />

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Informations de la boutique</h3>
        <p className="text-sm text-gray-600 mb-4">
          Le nom de la boutique peut être modifié dans la section ci-dessus.
        </p>
      </div>

      <SettingsForm
        initialSettings={{
          social_links: storeSettings?.social_links as {
            facebook?: string;
            instagram?: string;
            tiktok?: string;
          } | undefined,
          contact_info: storeSettings?.contact_info as {
            phone?: string;
            email?: string;
            address?: string;
          } | undefined,
        }}
      />
    </div>
  );
}
