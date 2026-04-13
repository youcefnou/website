'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteCategory } from '@/app/actions/categories';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
}

interface CategoriesListProps {
  categories: Category[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) {
      return;
    }

    setDeletingId(categoryId);

    try {
      await deleteCategory(categoryId);
      toast({
        title: 'Succès',
        description: 'Catégorie supprimée avec succès',
      });
      router.refresh();
    } catch (error) {
      console.error('Delete category error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-white"
        >
          <div className="flex items-center gap-4">
            {category.image_url && (
              <div className="relative w-16 h-16 rounded overflow-hidden">
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
              <div className="flex gap-2 mt-1">
                {category.is_active && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Actif
                  </span>
                )}
                {category.is_featured && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    En vedette
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/admin/categories/${category.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleDelete(category.id, category.name)}
              disabled={deletingId === category.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {(!categories || categories.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          Aucune catégorie. Créez-en une pour commencer.
        </div>
      )}
    </>
  );
}
