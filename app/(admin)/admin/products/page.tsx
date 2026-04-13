import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { ImageUpload } from '@/components/admin/image-upload';
import { ProductActions } from '@/components/admin/product-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Package } from 'lucide-react';
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

  // Fetch products with sellable items
  const { data: products } = await supabase
    .from('products')
    .select(
      `
      *,
      categories(name),
      sellable_items(
        *,
        product_variants(name)
      )
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Gestion des produits</h2>
          <p className="text-muted-foreground mt-1">
            Gérer les images des produits et articles vendables
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Package className="w-4 h-4" />
            Nouveau Produit
          </Button>
        </Link>
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

      <div className="grid gap-6">
        {products?.map((product) => {
          const totalStock = product.sellable_items?.reduce((sum: number, item: { stock: number }) => sum + item.stock, 0) || 0;
          const inStock = totalStock > 0;
          // Get the main product image from the first sellable item
          const mainImageUrl = product.sellable_items?.[0]?.image_url || '';
          const hasVariants = product.has_variants;
          const variantCount = product.sellable_items?.length || 0;

          return (
            <div key={product.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    {inStock ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        En stock ({totalStock})
                      </Badge>
                    ) : (
                      // Badge hidden per requirements - text removed
                      null
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Catégorie: {product.categories?.name || 'Non spécifié'}
                  </p>
                  {hasVariants && (
                    <p className="text-sm text-muted-foreground">
                      {variantCount} variante{variantCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <ProductActions productId={product.id} productName={product.name} />
              </div>

              {/* Main Product Image Section */}
              {product.sellable_items && product.sellable_items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase mb-3">Image du produit</h4>
                  <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border-2">
                      {mainImageUrl && mainImageUrl.startsWith('http') ? (
                        <Image
                          src={mainImageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Image Upload - Only for the first sellable item (main product image) */}
                    <div className="flex-1">
                      <ImageUpload
                        currentImageUrl={mainImageUrl}
                        type="product"
                        itemId={product.sellable_items[0].id}
                        label="Télécharger l'image principale du produit"
                        required={true}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Cette image sera utilisée pour toutes les variantes du produit
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Variants List */}
              {hasVariants && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase">
                    Variantes ({variantCount})
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {product.sellable_items?.map((item: { 
                        id: string; 
                        description: string; 
                        sku: string; 
                        price: number; 
                        stock: number; 
                        image_url: string | null; 
                        product_variants?: { name: string } | null;
                      }) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-medium">•</span>
                              <p className="font-medium">
                                {item.product_variants?.name || item.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm ml-4">
                              <span className="text-muted-foreground">
                                SKU: <span className="font-mono text-xs">{item.sku}</span>
                              </span>
                              <span className="text-blue-600 font-semibold">
                                {item.price} DA
                              </span>
                              <span className={item.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                Stock: {item.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Non-variant products (simple products) */}
              {!hasVariants && product.sellable_items && product.sellable_items.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase">Détails de l&apos;article</h4>
                  {product.sellable_items.map((item: { 
                    id: string; 
                    description: string; 
                    sku: string; 
                    price: number; 
                    stock: number; 
                    image_url: string | null; 
                    product_variants?: { name: string } | null;
                  }) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          SKU: <span className="font-mono">{item.sku}</span>
                        </span>
                        <span className="text-blue-600 font-semibold">
                          {item.price} DA
                        </span>
                        <span className={item.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                          Stock: {item.stock}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
