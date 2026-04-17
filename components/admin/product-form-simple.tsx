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
import { ImageUpload } from '@/components/admin/image-upload';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string; // temporary ID for React key
  name: string;
  stock: number;
  sku?: string; // Optional manual SKU
}

interface ProductFormSimpleProps {
  categories: Category[];
}

export function ProductFormSimple({ categories }: ProductFormSimpleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Product fields
  const [productName, setProductName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // NEW: Toggle for variants
  const [hasVariants, setHasVariants] = useState(true);
  
  // NEW: Simple product fields (when no variants)
  const [simpleStock, setSimpleStock] = useState(0);
  const [simpleSku, setSimpleSku] = useState(''); // Manual SKU for simple products

  // Variants list
  const [variants, setVariants] = useState<Variant[]>([
    { id: '1', name: '', stock: 0, sku: '' },
    { id: '2', name: '', stock: 0, sku: '' },
    { id: '3', name: '', stock: 0, sku: '' },
  ]);

  const addVariant = () => {
    setVariants([
      ...variants,
      { id: crypto.randomUUID(), name: '', stock: 0, sku: '' },
    ]);
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter((v) => v.id !== id));
    }
  };

  const updateVariant = (
    id: string,
    field: 'name' | 'stock' | 'sku',
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
    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast({
        title: 'Erreur',
        description: 'Le prix doit être supérieur à 0',
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
    if (!imageUrl) {
      toast({
        title: 'Erreur',
        description: "L'image du produit est requise",
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (hasVariants) {
        // Create product with variants
        const validVariants = variants.filter((v) => v.name.trim());

        if (validVariants.length === 0) {
          toast({
            title: 'Erreur',
            description: 'Ajoutez au moins un modèle',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const response = await fetch('/api/products/create-with-variants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: productName,
            price: parseFloat(basePrice),
            category_id: categoryId,
            image_url: imageUrl,
            description,
            is_active: isActive,
            is_featured: isFeatured,
            variants: validVariants,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create product');
        }
      } else {
        // Create simple product without variants
        const response = await fetch('/api/products/create-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: productName,
            price: parseFloat(basePrice),
            category_id: categoryId,
            image_url: imageUrl,
            description,
            stock: simpleStock,
            sku: simpleSku.trim() || undefined, // Send manual SKU if provided
            is_active: isActive,
            is_featured: isFeatured,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create product');
        }
      }

      toast({
        title: 'Succès',
        description: 'Produit créé avec succès',
      });

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Create product error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création',
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
          <Label htmlFor="price">Prix de base (DZD) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Ce prix s&apos;applique à tous les modèles
          </p>
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

        <ImageUpload
          currentImageUrl={imageUrl}
          type="product"
          label="Image principale *"
          required={true}
          onUploadComplete={(url) => setImageUrl(url)}
        />

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

      {/* Product Type Section - NEW */}
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

        {hasVariants ? (
          // Variants Section (existing code)
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Listez tous les modèles de téléphone compatibles
            </p>

            <div className="space-y-2">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  {/* Radio button (visual only) */}
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0 mt-2" />

                  <div className="flex-1 space-y-2">
                    {/* Model name */}
                    <Input
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(variant.id, 'name', e.target.value)
                      }
                      placeholder="Ex: Oppo A16"
                    />

                    {/* SKU and Stock in a row */}
                    <div className="flex gap-2">
                      {/* SKU */}
                      <div className="flex-1">
                        <Input
                          value={variant.sku || ''}
                          onChange={(e) =>
                            updateVariant(variant.id, 'sku', e.target.value)
                          }
                          placeholder="SKU (optionnel, auto-généré si vide)"
                          className="text-sm"
                        />
                      </div>

                      {/* Stock */}
                      <div className="flex items-center gap-2 w-32">
                        <Label className="text-sm whitespace-nowrap">Stock:</Label>
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariant(
                              variant.id,
                              'stock',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-20"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remove button */}
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variant.id)}
                      className="flex-shrink-0 mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
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
              Ajouter un modèle
            </Button>
          </div>
        ) : (
          // Simple Product Stock
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Produit simple sans variantes
            </p>
            <div>
              <Label htmlFor="sku">SKU (Référence)</Label>
              <Input
                id="sku"
                value={simpleSku}
                onChange={(e) => setSimpleSku(e.target.value)}
                placeholder="Ex: PROD-001 (optionnel, auto-généré si vide)"
                className="max-w-md"
              />
              <p className="text-sm text-gray-500 mt-1">
                Le SKU sera auto-généré si non renseigné
              </p>
            </div>
            <div>
              <Label htmlFor="stock">Quantité en stock</Label>
              <Input
                id="stock"
                type="number"
                value={simpleStock}
                onChange={(e) => setSimpleStock(parseInt(e.target.value) || 0)}
                placeholder="0"
                min={0}
                className="max-w-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="text-lg font-semibold">Paramètres</h3>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="active">Produit actif</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
            />
            <Label htmlFor="featured">Produit en vedette</Label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Création...' : 'Créer le produit'}
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
