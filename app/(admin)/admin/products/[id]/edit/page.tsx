import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { ProductEditForm } from '@/components/admin/product-edit-form';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const supabase = await createClient();

  // Fetch product data with all related information
  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      sellable_items(
        *,
        product_variants(name)
      ),
      product_variants(*)
    `
    )
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (error || !product) {
    redirect('/admin/products?error=product-not-found');
  }

  // Fetch categories for dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Modifier le Produit</h2>
        <p className="text-muted-foreground">
          Modifier les informations du produit et ses variantes
        </p>
      </div>

      <ProductEditForm product={product} categories={categories || []} />
    </div>
  );
}
