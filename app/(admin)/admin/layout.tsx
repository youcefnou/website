import { redirect } from 'next/navigation';
import { isAdminServer } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { AdminLayoutClient } from './admin-layout-client';

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

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
