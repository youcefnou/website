'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateStoreSettings } from '@/app/actions/settings';

interface SettingsFormProps {
  initialSettings: {
    social_links?: {
      facebook?: string;
      instagram?: string;
      tiktok?: string;
    };
    contact_info?: {
      phone?: string;
      email?: string;
      address?: string;
    };
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [socialLinks, setSocialLinks] = useState({
    facebook: initialSettings.social_links?.facebook || '',
    instagram: initialSettings.social_links?.instagram || '',
    tiktok: initialSettings.social_links?.tiktok || '',
  });

  const [contactInfo, setContactInfo] = useState({
    phone: initialSettings.contact_info?.phone || '',
    email: initialSettings.contact_info?.email || '',
    address: initialSettings.contact_info?.address || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      await updateStoreSettings({
        social_links: socialLinks,
        contact_info: contactInfo,
      });
      setMessage('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Échec de l\'enregistrement des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Social Links Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Liens de réseaux sociaux</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              type="url"
              value={socialLinks.facebook}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, facebook: e.target.value })
              }
              placeholder="https://facebook.com/your-page"
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              type="url"
              value={socialLinks.instagram}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, instagram: e.target.value })
              }
              placeholder="https://instagram.com/your-account"
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              type="url"
              value={socialLinks.tiktok}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, tiktok: e.target.value })
              }
              placeholder="https://tiktok.com/@your-account"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Informations de contact</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={contactInfo.phone}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, phone: e.target.value })
              }
              placeholder="+213 555 123 456"
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={contactInfo.email}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, email: e.target.value })
              }
              placeholder="contact@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              type="text"
              value={contactInfo.address}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, address: e.target.value })
              }
              placeholder="123 Rue Exemple, Alger"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.includes('succès') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
