import { createClient as createBrowserClient } from '@/lib/supabase/supabaseBrowserClient';

/**
 * Check if the current user is an admin (client-side)
 */
export async function isAdminClient(): Promise<boolean> {
  const supabase = createBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('[isAdminClient] Error getting user:', userError);
    return false;
  }

  if (!user) {
    console.log('[isAdminClient] No authenticated user');
    return false;
  }

  console.log('[isAdminClient] Checking admin status for user:', user.id);

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (adminError) {
    console.error('[isAdminClient] Error querying admins table:', adminError);
    return false;
  }

  const isAdmin = !!admin;
  console.log('[isAdminClient] Admin status:', isAdmin);
  return isAdmin;
}
