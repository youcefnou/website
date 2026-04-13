'use client';

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FooterEnhancedProps {
  footerTagline?: string;
  storeName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export function FooterEnhanced({
  footerTagline,
  storeName,
  primaryColor = '#000000',
  secondaryColor = '#666666',
  accentColor = '#0066cc',
}: FooterEnhancedProps) {
  const t = useTranslations('footer');
  const defaultTagline = t('defaultTagline');
  const displayTagline =
    footerTagline && footerTagline.trim() ? footerTagline : defaultTagline;

  const defaultStoreName = 'Sultanacc';
  const displayStoreName =
    storeName && storeName.trim() ? storeName : defaultStoreName;

  // Helper function to validate hex color format
  const isValidHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  // Safe color values with validation
  const safePrimaryColor = isValidHexColor(primaryColor) ? primaryColor : '#000000';
  const safeSecondaryColor = isValidHexColor(secondaryColor) ? secondaryColor : '#666666';
  const safeAccentColor = isValidHexColor(accentColor) ? accentColor : '#0066cc';

  // Calculate lighter text color from primary color (increase lightness)
  const getTextColor = (hexColor: string): string => {
    // For dark backgrounds, use light gray text
    // For light backgrounds, use darker text
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5 ? '#d1d5db' : '#4b5563';
  };

  const textColor = getTextColor(safePrimaryColor);

  return (
    <footer 
      className="text-white mt-20"
      style={{ backgroundColor: safePrimaryColor }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">{displayStoreName}</h3>
            <p className="text-sm" style={{ color: textColor }}>
              {displayTagline}
            </p>
            <div className="flex gap-4 mt-4">
              <a 
                href="#" 
                className="transition"
                style={{ color: safeSecondaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.color = safeAccentColor}
                onMouseLeave={(e) => e.currentTarget.style.color = safeSecondaryColor}
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="transition"
                style={{ color: safeSecondaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.color = safeAccentColor}
                onMouseLeave={(e) => e.currentTarget.style.color = safeSecondaryColor}
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: textColor }}>{t('quickLinks.title')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="transition" style={{ color: textColor }} onMouseEnter={(e) => e.currentTarget.style.color = safeAccentColor} onMouseLeave={(e) => e.currentTarget.style.color = textColor}>{t('quickLinks.products')}</Link></li>
              <li><Link href="/about" className="transition" style={{ color: textColor }} onMouseEnter={(e) => e.currentTarget.style.color = safeAccentColor} onMouseLeave={(e) => e.currentTarget.style.color = textColor}>{t('quickLinks.about')}</Link></li>
              <li><Link href="/contact" className="transition" style={{ color: textColor }} onMouseEnter={(e) => e.currentTarget.style.color = safeAccentColor} onMouseLeave={(e) => e.currentTarget.style.color = textColor}>{t('quickLinks.contact')}</Link></li>
              <li><Link href="/faq" className="transition" style={{ color: textColor }} onMouseEnter={(e) => e.currentTarget.style.color = safeAccentColor} onMouseLeave={(e) => e.currentTarget.style.color = textColor}>FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: textColor }}>{t('contact.title')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2" style={{ color: textColor }}>
                <Phone className="w-4 h-4" />
                +213 XX XXX XXXX
              </li>
              <li className="flex items-center gap-2" style={{ color: textColor }}>
                <Mail className="w-4 h-4" />
                contact@sultanacc.com
              </li>
              <li className="flex items-center gap-2" style={{ color: textColor }}>
                <MapPin className="w-4 h-4" />
                {t('contact.city')}
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: textColor }}>{t('newsletter.title')}</h4>
            <p className="text-sm mb-4" style={{ color: textColor }}>
              {t('newsletter.subtitle')}
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t('newsletter.emailPlaceholder')}
                className="text-white"
                style={{ 
                  // Semi-transparent background based on primary color (87% opacity)
                  backgroundColor: `${safePrimaryColor}dd`,
                  // More transparent border (40% opacity)
                  borderColor: `${safePrimaryColor}66`
                }}
              />
              <Button 
                style={{ 
                  backgroundColor: safeAccentColor,
                  color: 'white'
                }}
              >
                {t('newsletter.action')}
              </Button>
            </div>
          </div>
        </div>

        <div 
          className="mt-8 pt-8 text-center text-sm"
          style={{ 
            borderTop: `1px solid ${safePrimaryColor}66`,
            color: textColor
          }}
        >
          <p>{t('copyright', { year: 2025, storeName: displayStoreName })}</p>
        </div>
      </div>
    </footer>
  );
}
