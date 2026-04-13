'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateFooterTagline } from '@/app/actions/settings';

interface FooterTaglineEditorProps {
  currentTagline: string;
}

export function FooterTaglineEditor({ currentTagline }: FooterTaglineEditorProps) {
  const [tagline, setTagline] = useState(currentTagline);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const maxLength = 200;
  const remainingChars = maxLength - tagline.length;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await updateFooterTagline(tagline);
      setMessage({ type: 'success', text: 'Texte du pied de page mis à jour avec succès' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="footer-tagline" className="block text-sm font-medium mb-2">
          Texte du pied de page
        </label>
        <Input
          id="footer-tagline"
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={maxLength}
          placeholder="Votre destination pour les meilleurs accessoires..."
          className="w-full"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            Ce texte apparaît dans le pied de page de votre boutique
          </p>
          <p className={`text-sm ${remainingChars < 20 ? 'text-orange-600' : 'text-muted-foreground'}`}>
            {remainingChars} caractères restants
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || tagline.trim().length === 0 || tagline.length > maxLength}
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setTagline(currentTagline)}
          disabled={isSaving}
        >
          Annuler
        </Button>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md border">
        <p className="text-sm font-semibold mb-2">Aperçu:</p>
        <p className="text-sm text-muted-foreground italic">
          {tagline || 'Votre texte apparaîtra ici...'}
        </p>
      </div>
    </div>
  );
}
