'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { updateProduct } from '@/app/actions/products';

interface Category {
  id: string;
  name: string;
}

interface SellableItem {
  id: string;
  sku: string;
  price: number;
  stock: number;
  description: string | null;
  image_url: string | null;
  variant_id: string | null;
  product_variants?: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  has_variants: boolean;
  sellable_items: SellableItem[];
  product_variants?: Array<{ id: string; name: string }>;
}

interface Variant {
  id: string; // temporary ID for React key
  itemId?: string; // sellable item ID if updating
  name: string;
  stock: number;
  price: number;
  sku: string;
  description: string;
  imageUrl: string;
}

interface ProductEditFormProps {
  product: Product;
  categories: Category[];
}

export function ProductEditForm({ product, categories }: ProductEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Product fields
  const [productName, setProductName] = useState(product.name);
  const [categoryId, setCategoryId] = useState(product.category_id || '');
  const [description, setDescription] = useState(product.description || '');
  const [hasVariants, setHasVariants] = useState(product.has_variants);

  // Initialize variants from sellable items
  const initializeVariants = (): Variant[] => {
    if (!product.sellable_items || product.sellable_items.length === 0) {
      return [
        {
          id: '1',
          name: '',
          stock: 0,
          price: 0,
          sku: '',
          description: '',
          imageUrl: '',
        },
      ];
    }

    return product.sellable_items.map((item, index) => ({
      id: item.id || `${index}`,
      itemId: item.id,
      name: item.product_variants?.name || '',
      stock: item.stock,
      price: item.price,
      sku: item.sku,
      description: item.description || '',
      imageUrl: item.image_url || '',
    }));
  };

  const [variants, setVariants] = useState<Variant[]>(initializeVariants());

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: '',
        stock: 0,
        price: 0,
        sku: '',
        description: '',
        imageUrl: '',
      },
    ]);
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter((v) => v.id !== id));
    }
  };

  const updateVariant = (
    id: string,
    field: keyof Variant,
    value: string | number
  ) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!productName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du produit est requis',
        variant: 'destructive',
      });
      return;
    }
    if (!categoryId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une catégorie',
        variant: 'destructive',
      });
      return;
    }

    // Validate variants
    const validVariants = variants.filter((v) => {
      if (hasVariants) {
        return v.name.trim() && v.price > 0;
      }
      return v.price > 0;
    });

    if (validVariants.length === 0) {
      toast({
        title: 'Erreur',
        description: hasVariants
          ? 'Ajoutez au moins un modèle avec un nom et un prix'
          : 'Ajoutez au moins un article avec un prix',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await updateProduct(product.id, {
        name: productName,
        description,
        category_id: categoryId,
        has_variants: hasVariants,
        sellable_items: validVariants.map((v) => ({
          id: v.itemId,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          description: v.description,
          image_url: v.imageUrl,
          variant_name: hasVariants ? v.name : undefined,
        })),
      });

      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Produit mis à jour avec succès',
        });

        router.push('/admin/products');
        router.refresh();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Échec de la mise à jour',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Update product error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Basic Info Section */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="text-lg font-semibold">Informations de base</h3>

        <div>
          <Label htmlFor="name">Nom du produit *</Label>
          <Input
            id="name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ex: Antichoc Transparent"
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Catégorie *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du produit..."
            rows={3}
          />
        </div>
      </div>

      {/* Product Type Section */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="text-lg font-semibold">Type de produit</h3>

        <div className="flex items-center gap-2">
          <Checkbox
            id="hasVariants"
            checked={hasVariants}
            onCheckedChange={(checked) => setHasVariants(checked === true)}
          />
          <Label htmlFor="hasVariants">
            Ce produit a des variantes (différents modèles)
          </Label>
        </div>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            {hasVariants
              ? 'Modèles de téléphone compatibles'
              : 'Articles vendables'}
          </p>

          <div className="space-y-2">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    {hasVariants ? (
                      <>
                        <Label className="text-sm">Nom du modèle</Label>
                        <Input
                          value={variant.name}
                          onChange={(e) =>
                            updateVariant(variant.id, 'name', e.target.value)
                          }
                          placeholder="Ex: Oppo A16"
                        />
                      </>
                    ) : (
                      <>
                        <Label className="text-sm">Nom de l'article</Label>
                        <Input value={productName} disabled />
                      </>
                    )}
                  </div>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variant.id)}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">SKU</Label>
                    <Input
                      value={variant.sku}
                      onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                      placeholder="Référence SKU"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Prix (DZD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          'price',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Stock</Label>
                    <Input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          'stock',
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label className="text-sm">Description</Label>
                  <Input
                    value={variant.description}
                    onChange={(e) => updateVariant(variant.id, 'description', e.target.value)}
                    placeholder="Description de la variante"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addVariant}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter {hasVariants ? 'un modèle' : 'un article'}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Mise à jour...' : 'Mettre à jour le produit'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
