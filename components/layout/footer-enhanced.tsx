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
}: FooterEnhancedProps) {
  const t = useTranslations('footer');
  const defaultTagline = t('defaultTagline');
  const displayTagline =
    footerTagline && footerTagline.trim() ? footerTagline : defaultTagline;

  const defaultStoreName = 'Sultanacc';
  const displayStoreName =
    storeName && storeName.trim() ? storeName : defaultStoreName;

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] mt-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">{displayStoreName}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {displayTagline}
            </p>
            <div className="flex gap-3 mt-5">
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-[#E8642C] hover:border-[#E8642C]/30 transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-[#E8642C] hover:border-[#E8642C]/30 transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">{t('quickLinks.title')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/products" className="text-gray-400 hover:text-[#E8642C] transition-colors">{t('quickLinks.products')}</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-[#E8642C] transition-colors">{t('quickLinks.about')}</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-[#E8642C] transition-colors">{t('quickLinks.contact')}</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-[#E8642C] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">{t('contact.title')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-gray-400">
                <Phone className="w-4 h-4 text-[#E8642C]" />
                +213 XX XXX XXXX
              </li>
              <li className="flex items-center gap-2.5 text-gray-400">
                <Mail className="w-4 h-4 text-[#E8642C]" />
                contact@sultanacc.com
              </li>
              <li className="flex items-center gap-2.5 text-gray-400">
                <MapPin className="w-4 h-4 text-[#E8642C]" />
                {t('contact.city')}
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">{t('newsletter.title')}</h4>
            <p className="text-sm mb-4 text-gray-400 leading-relaxed">
              {t('newsletter.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder={t('newsletter.emailPlaceholder')}
                className="flex-1 bg-[#141414] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#E8642C]/50"
              />
              <Button className="w-full sm:w-auto bg-[#E8642C] hover:bg-[#d45a25] text-white">
                {t('newsletter.action')}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 text-center text-sm border-t border-[#1a1a1a] text-gray-500">
          <p>{t('copyright', { year: 2025, storeName: displayStoreName })}</p>
        </div>
      </div>
    </footer>
  );
}
