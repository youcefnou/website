import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { ProductFormSimple } from '@/components/admin/product-form-simple';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const supabase = await createClient();

  // Fetch categories for dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Créer un Produit</h2>
        <p className="text-muted-foreground">
          Ajouter un nouveau produit avec ses variantes
        </p>
      </div>

      <ProductFormSimple categories={categories || []} />
    </div>
  );
}
