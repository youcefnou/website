'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updatePage } from '@/app/actions/pages';
import { useToast } from '@/hooks/use-toast';

interface PageEditorProps {
  pageId: string;
  initialData: {
    title: string;
    content: string;
    meta_description?: string | null;
    is_published: boolean;
  };
}

export function PageEditor({ pageId, initialData }: PageEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);
  const [metaDescription, setMetaDescription] = useState(
    initialData.meta_description || ''
  );
  const [isPublished, setIsPublished] = useState(initialData.is_published);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updatePage(pageId, {
        title,
        content,
        meta_description: metaDescription,
        is_published: isPublished,
      });

      toast({
        title: 'Succès',
        description: 'La page a été mise à jour avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Échec de la mise à jour',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta_description">Description Meta (SEO)</Label>
        <Input
          id="meta_description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="Description pour les moteurs de recherche"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenu</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={20}
          placeholder="Contenu de la page (Markdown supporté)"
        />
        <p className="text-sm text-muted-foreground">
          Vous pouvez utiliser la syntaxe Markdown pour formater le contenu.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_published"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="is_published" className="cursor-pointer">
          Publier cette page
        </Label>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </form>
  );
}
