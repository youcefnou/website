'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/admin/image-upload';
import { updateCategory } from '@/app/actions/categories';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/supabaseBrowserClient';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetchingCategory, setFetchingCategory] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            image_url: data.image_url || '',
            display_order: data.display_order || 0,
            is_active: data.is_active ?? true,
            is_featured: data.is_featured ?? false,
          });
        }
      } catch (error) {
        console.error('Fetch category error:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la catégorie',
          variant: 'destructive',
        });
      } finally {
        setFetchingCategory(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la catégorie est requis',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await updateCategory(categoryId, formData);
      toast({
        title: 'Succès',
        description: 'Catégorie mise à jour avec succès',
      });
      router.push('/admin/categories');
      router.refresh();
    } catch (error) {
      console.error('Update category error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCategory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Modifier la Catégorie</h2>
        <p className="text-muted-foreground">
          Mettre à jour les informations de la catégorie
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border">
        <div>
          <Label htmlFor="name">Nom de la catégorie *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Coques de téléphone"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de la catégorie"
            rows={3}
          />
        </div>

        <ImageUpload
          currentImageUrl={formData.image_url}
          type="category"
          label="Image de la catégorie"
          required={false}
          onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
        />

        <div>
          <Label htmlFor="display_order">Ordre d&apos;affichage</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
            min={0}
          />
          <p className="text-sm text-gray-500 mt-1">
            Les catégories avec un ordre inférieur apparaissent en premier
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked as boolean })}
            />
            <Label htmlFor="is_featured">En vedette</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
