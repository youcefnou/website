'use client';

import Link from 'next/link';
import { Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  storeName: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export function Footer({
  storeName,
  primaryColor = '#000000',
  secondaryColor = '#666666',
  accentColor = '#0066cc',
  socialLinks = {},
  contactInfo = {},
}: FooterProps) {
  const quickLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/products', label: 'Produits' },
    { href: '#contact', label: 'Contact' },
    { href: '/cart', label: 'Panier' },
  ];

  return (
    <footer 
      className="border-t mt-auto"
      style={{
        borderTopColor: `${primaryColor}20`,
        backgroundColor: '#fafafa',
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Branding Block */}
          <div className="space-y-4">
            <h3 
              className="text-lg font-bold"
              style={{ color: primaryColor }}
            >
              {storeName}
            </h3>
            <div 
              className="inline-block px-3 py-1 text-sm font-semibold text-white rounded"
              style={{ backgroundColor: accentColor }}
            >
              Vente en gros
            </div>
            <p className="text-sm text-muted-foreground">
              Produits de qualité à prix compétitifs
            </p>
          </div>

          {/* Contact Block */}
          <div className="space-y-4">
            <h4 
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: secondaryColor }}
            >
              Contact
            </h4>
            <div className="space-y-3">
              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>{contactInfo.phone}</span>
                </a>
              )}
              {contactInfo.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>{contactInfo.email}</span>
                </a>
              )}
              {contactInfo.address && (
                <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{contactInfo.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links Block */}
          <div className="space-y-4">
            <h4 
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: secondaryColor }}
            >
              Liens Rapides
            </h4>
            <nav className="flex flex-col space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social Links Block */}
          <div className="space-y-4">
            <h4 
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: secondaryColor }}
            >
              Suivez-nous
            </h4>
            <div className="flex space-x-4">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="TikTok"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {storeName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
