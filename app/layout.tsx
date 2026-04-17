import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { getServerAuthState } from '@/lib/auth/server-auth-state';
import { AuthHydrationBoundary } from '@/components/providers/auth-hydration-boundary';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { getStoreSettings } from '@/app/actions/settings';
import { RTL_LOCALES } from '@/i18n/routing';
import { hexToHSL } from '@/lib/utils';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings();

  return {
    title: storeSettings?.store_name || 'Online Store',
    description: 'Shop quality products at great prices',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const authState = await getServerAuthState();
  const isRtl = RTL_LOCALES.includes(locale as (typeof RTL_LOCALES)[number]);
  const storeSettings = await getStoreSettings();
  
  // Convert hex colors to HSL format for CSS variables
  const primaryHSL = hexToHSL(storeSettings?.primary_color || '#000000');
  const secondaryHSL = hexToHSL(storeSettings?.secondary_color || '#666666');
  const accentHSL = hexToHSL(storeSettings?.accent_color || '#0066cc');

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={
          {
            '--store-primary': storeSettings?.primary_color || '#000000',
            '--store-secondary': storeSettings?.secondary_color || '#666666',
            '--store-accent': storeSettings?.accent_color || '#0066cc',
            '--primary': primaryHSL,
            '--secondary': secondaryHSL,
            '--accent': accentHSL,
            fontFamily: 'var(--font-geist-sans), sans-serif',
          } as React.CSSProperties
        }
      >
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthHydrationBoundary initialUser={authState.user} initialRole={authState.role}>
              {children}
            </AuthHydrationBoundary>
          </QueryProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
