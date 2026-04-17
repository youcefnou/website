import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { ProductActions } from '@/components/admin/product-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Package, Upload, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const supabase = await createClient();

  // Fetch products with sellable items (no need for full variant details on list)
  const { data: products } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      has_variants,
      created_at,
      categories(name),
      sellable_items(
        id,
        price,
        stock,
        image_url
      )
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Gestion des produits</h2>
          <p className="text-muted-foreground mt-1">
            {products?.length || 0} produit{(products?.length || 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/upload-csv">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload CSV
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="gap-2">
              <Package className="w-4 h-4" />
              Nouveau Produit
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher des produits..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product List — Compact cards */}
      <div className="space-y-3">
        {products?.map((product) => {
          const totalStock = product.sellable_items?.reduce((sum: number, item: { stock: number }) => sum + item.stock, 0) || 0;
          const inStock = totalStock > 0;
          const mainImageUrl = product.sellable_items?.[0]?.image_url || '';
          const hasVariants = product.has_variants;
          const variantCount = product.sellable_items?.length || 0;
          const minPrice = product.sellable_items?.length
            ? Math.min(...product.sellable_items.map((item: { price: number }) => item.price))
            : 0;

          return (
            <div key={product.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border">
                  {mainImageUrl && mainImageUrl.startsWith('http') ? (
                    <Image
                      src={mainImageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold truncate">{product.name}</h3>
                    {inStock ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex-shrink-0 text-xs">
                        {totalStock}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{(product.categories as any)?.[0]?.name || 'Non catégorisé'}</span>
                    {hasVariants && (
                      <span>&bull; {variantCount} variante{variantCount > 1 ? 's' : ''}</span>
                    )}
                    {minPrice > 0 && (
                      <span>&bull; {minPrice} DA</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <ProductActions productId={product.id} productName={product.name} />
              </div>
            </div>
          );
        })}

        {(!products || products.length === 0) && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Aucun produit</p>
            <p className="text-sm text-muted-foreground mb-6">Commencez par créer votre premier produit</p>
            <Link href="/admin/products/new">
              <Button>
                <Package className="w-4 h-4 mr-2" />
                Créer un produit
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
