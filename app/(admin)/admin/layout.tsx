import { redirect } from 'next/navigation';
import { isAdminServer } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { AdminLayoutClient } from './admin-layout-client';
import { Header } from '@/components/layout/header';
import { getStoreSettings } from '@/app/actions/settings';

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[AdminLayout] User:', user?.id);

  const isAdmin = await isAdminServer();
  
  console.log('[AdminLayout] Is admin:', isAdmin);
  
  if (!isAdmin) {
    redirect('/?error=unauthorized');
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAdmin();
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
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </main>
    </div>
  );
}
