'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProduct } from '@/app/actions/products';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
}

interface SellableItem {
  id: string;
  sku: string;
  price: string;
  stock: string;
  description: string;
  image_url: string;
  variant_name: string;
}

export function ProductForm({ categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Product fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  
  // Variant pricing options
  const [samePriceForAll, setSamePriceForAll] = useState(false);
  const [basePrice, setBasePrice] = useState('');

  // Sellable items
  const [sellableItems, setSellableItems] = useState<SellableItem[]>([
    {
      id: '1',
      sku: '',
      price: '',
      stock: '0',
      description: '',
      image_url: '',
      variant_name: '',
    },
  ]);

  const addSellableItem = () => {
    setSellableItems([
      ...sellableItems,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sku: '',
        price: samePriceForAll ? basePrice : '',
        stock: '0',
        description: '',
        image_url: '',
        variant_name: '',
      },
    ]);
  };

  const removeSellableItem = (id: string) => {
    if (sellableItems.length > 1) {
      setSellableItems(sellableItems.filter((item) => item.id !== id));
    }
  };

  const updateSellableItem = (id: string, field: keyof SellableItem, value: string) => {
    setSellableItems(
      sellableItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  // Update base price and sync to all items when samePriceForAll is enabled
  const handleBasePriceChange = (newPrice: string) => {
    setBasePrice(newPrice);
    if (samePriceForAll) {
      setSellableItems(
        sellableItems.map((item) => ({ ...item, price: newPrice }))
      );
    }
  };
  
  // Toggle samePriceForAll and sync prices
  const handleSamePriceToggle = (checked: boolean) => {
    setSamePriceForAll(checked);
    if (checked && basePrice) {
      // Apply base price to all items
      setSellableItems(
        sellableItems.map((item) => ({ ...item, price: basePrice }))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!name.trim()) {
        setError('Le nom du produit est requis');
        setLoading(false);
        return;
      }

      // Validate sellable items
      for (const item of sellableItems) {
        if (!item.price || parseFloat(item.price) <= 0) {
          setError('Tous les articles doivent avoir un prix valide');
          setLoading(false);
          return;
        }
        
        if (hasVariants && !item.variant_name.trim()) {
          setError('Le nom de la variante est requis pour les produits avec variantes');
          setLoading(false);
          return;
        }
      }

      const result = await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        has_variants: hasVariants,
        sellable_items: sellableItems.map((item) => ({
          sku: item.sku.trim() || undefined,
          price: parseFloat(item.price),
          stock: parseInt(item.stock) || 0,
          description: item.description.trim() || undefined,
          image_url: item.image_url.trim() || undefined,
          variant_name: hasVariants ? item.variant_name.trim() : undefined,
        })),
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        setError(result.error || 'Échec de la création du produit');
      }
    } catch (err) {
      setError('Une erreur inattendue s&apos;est produite');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          Produit créé avec succès! Redirection...
        </div>
      )}

      {/* Product Information */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="text-lg font-semibold">Informations sur le produit</h3>

        <div>
          <Label htmlFor="name">Nom du produit *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: T-shirt en coton"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[100px] px-3 py-2 border rounded-md"
            placeholder="Description du produit..."
          />
        </div>

        <div>
          <Label htmlFor="category">Catégorie</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasVariants"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="hasVariants">Ce produit a des variantes</Label>
        </div>
        
        {hasVariants && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="samePriceForAll"
                checked={samePriceForAll}
                onChange={(e) => handleSamePriceToggle(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="samePriceForAll">
                Même prix pour toutes les variantes
              </Label>
            </div>
            
            {samePriceForAll && (
              <div>
                <Label htmlFor="basePrice">Prix de base (DZD) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={basePrice}
                  onChange={(e) => handleBasePriceChange(e.target.value)}
                  required={samePriceForAll}
                  placeholder="0.00"
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ce prix sera appliqué à toutes les variantes
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sellable Items */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {hasVariants ? 'Variantes' : 'Article vendable'}
          </h3>
          {(hasVariants || sellableItems.length === 0) && (
            <Button type="button" onClick={addSellableItem} variant="outline">
              + Ajouter {hasVariants ? 'une variante' : 'un article'}
            </Button>
          )}
        </div>

        {sellableItems.map((item, index) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">
                {hasVariants ? `Variante ${index + 1}` : 'Article'}
              </h4>
              {sellableItems.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeSellableItem(item.id)}
                  variant="destructive"
                  size="sm"
                >
                  Supprimer
                </Button>
              )}
            </div>

            {hasVariants && (
              <div>
                <Label htmlFor={`variant-name-${item.id}`}>Nom de la variante *</Label>
                <Input
                  id={`variant-name-${item.id}`}
                  value={item.variant_name}
                  onChange={(e) =>
                    updateSellableItem(item.id, 'variant_name', e.target.value)
                  }
                  required={hasVariants}
                  placeholder="Ex: Petit, Rouge, XL"
                />
              </div>
            )}

            <div>
              <Label htmlFor={`description-${item.id}`}>Description</Label>
              <Input
                id={`description-${item.id}`}
                value={item.description}
                onChange={(e) =>
                  updateSellableItem(item.id, 'description', e.target.value)
                }
                placeholder="Description de l'article"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`sku-${item.id}`}>SKU</Label>
                <Input
                  id={`sku-${item.id}`}
                  value={item.sku}
                  onChange={(e) =>
                    updateSellableItem(item.id, 'sku', e.target.value)
                  }
                  placeholder="Auto-généré si vide"
                />
              </div>

              <div>
                <Label htmlFor={`price-${item.id}`}>
                  Prix (DZD) *
                  {samePriceForAll && (
                    <span className="text-xs text-gray-500 ml-2">
                      (Prix de base appliqué)
                    </span>
                  )}
                </Label>
                <Input
                  id={`price-${item.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={(e) =>
                    updateSellableItem(item.id, 'price', e.target.value)
                  }
                  required
                  placeholder="0.00"
                  disabled={samePriceForAll}
                  className={samePriceForAll ? 'bg-gray-100' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`stock-${item.id}`}>Stock *</Label>
                <Input
                  id={`stock-${item.id}`}
                  type="number"
                  min="0"
                  value={item.stock}
                  onChange={(e) =>
                    updateSellableItem(item.id, 'stock', e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer le produit'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
          disabled={loading}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
