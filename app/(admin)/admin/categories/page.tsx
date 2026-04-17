import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoriesList } from '@/components/admin/categories-list';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Catégories</h2>
          <p className="text-muted-foreground">
            Créer et gérer les catégories de produits
          </p>
        </div>
        
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Catégorie
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        <CategoriesList categories={categories || []} />
      </div>
    </div>
  );
}
