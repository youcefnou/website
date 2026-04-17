import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { CsvUploadForm } from '@/components/admin/csv-upload-form';
import { createClient } from '@/lib/supabase/supabaseServerClient';

export default async function UploadCsvPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload CSV Variantes</h2>
        <p className="text-muted-foreground">
          Ajoutez des variantes a un produit existant via CSV.
        </p>
      </div>
      <CsvUploadForm products={products || []} categories={categories || []} />
    </div>
  );
}
