import { Header } from '@/components/layout/header';
import { getStoreSettings } from '@/app/actions/settings';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeSettings = await getStoreSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        storeName={storeSettings?.store_name || 'Mon Magasin'}
        logoUrl={storeSettings?.logo_url}
        primaryColor={storeSettings?.primary_color || '#000000'}
        accentColor={storeSettings?.accent_color || '#0066cc'}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
