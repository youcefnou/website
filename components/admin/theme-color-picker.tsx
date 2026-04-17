'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateStoreSettings } from '@/app/actions/admin';

interface ThemeColorPickerProps {
  initialColors: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  };
}

export function ThemeColorPicker({ initialColors }: ThemeColorPickerProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [primaryColor, setPrimaryColor] = useState(
    initialColors.primary_color || '#000000'
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialColors.secondary_color || '#666666'
  );
  const [accentColor, setAccentColor] = useState(
    initialColors.accent_color || '#0066cc'
  );

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await updateStoreSettings({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
      });
      setMessage('Couleurs enregistrées avec succès');
      router.refresh();
    } catch (error) {
      console.error('Failed to save colors:', error);
      setMessage('Échec de l\'enregistrement des couleurs');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Couleurs du thème</h3>
      <p className="text-sm text-gray-600 mb-6">
        Personnalisez les couleurs de votre boutique. Les modifications seront
        appliquées immédiatement sur le site.
      </p>

      <div className="space-y-6">
        {/* Primary Color */}
        <div>
          <Label htmlFor="primary-color">Couleur principale</Label>
          <p className="text-xs text-gray-500 mb-2">
            Utilisée pour les en-têtes, les boutons principaux et les éléments
            importants
          </p>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <input
                type="color"
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
              />
            </div>
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '#' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                  setPrimaryColor(value);
                } else if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  // Allow intermediate typing
                  setPrimaryColor(value);
                }
              }}
              placeholder="#000000"
              className="flex-1 font-mono"
              maxLength={7}
            />
            <div
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: primaryColor }}
              title="Aperçu"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <Label htmlFor="secondary-color">Couleur secondaire</Label>
          <p className="text-xs text-gray-500 mb-2">
            Utilisée pour les textes secondaires et les arrière-plans
          </p>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <input
                type="color"
                id="secondary-color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
              />
            </div>
            <Input
              type="text"
              value={secondaryColor}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '#' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                  setSecondaryColor(value);
                } else if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  // Allow intermediate typing
                  setSecondaryColor(value);
                }
              }}
              placeholder="#666666"
              className="flex-1 font-mono"
              maxLength={7}
            />
            <div
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: secondaryColor }}
              title="Aperçu"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <Label htmlFor="accent-color">Couleur d&apos;accent</Label>
          <p className="text-xs text-gray-500 mb-2">
            Utilisée pour les liens, les appels à l&apos;action et les
            éléments interactifs
          </p>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <input
                type="color"
                id="accent-color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
              />
            </div>
            <Input
              type="text"
              value={accentColor}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '#' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                  setAccentColor(value);
                } else if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  // Allow intermediate typing
                  setAccentColor(value);
                }
              }}
              placeholder="#0066cc"
              className="flex-1 font-mono"
              maxLength={7}
            />
            <div
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: accentColor }}
              title="Aperçu"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4 pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les couleurs'}
          </Button>
          {message && (
            <p
              className={`text-sm ${
                message.includes('succès')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
