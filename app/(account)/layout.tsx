import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { AccountLayoutClient } from './account-layout-client';
import { Header } from '@/components/layout/header';
import { getStoreSettings } from '@/app/actions/settings';

async function checkAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account');
  }

  return user;
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();
  const storeSettings = await getStoreSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        storeName={storeSettings?.store_name || 'Mon Magasin'}
        logoUrl={storeSettings?.logo_url}
        primaryColor={storeSettings?.primary_color || '#000000'}
        accentColor={storeSettings?.accent_color || '#0066cc'}
      />
      <main className="flex-1">
        <AccountLayoutClient>{children}</AccountLayoutClient>
      </main>
    </div>
  );
}
