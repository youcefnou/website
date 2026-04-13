import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { AccountLayoutClient } from './account-layout-client';

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

  return <AccountLayoutClient>{children}</AccountLayoutClient>;
}
