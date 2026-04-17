'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { deleteProduct } from '@/app/actions/products';

interface ProductActionsProps {
  productId: string;
  productName: string;
}

export function ProductActions({ productId, productName }: ProductActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${productName}" ? Cette action ne peut pas être annulée.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteProduct(productId);
      
      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Produit supprimé avec succès',
        });
        router.refresh();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Échec de la suppression du produit',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Link href={`/admin/products/${productId}/edit`}>
        <Button variant="ghost" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}
