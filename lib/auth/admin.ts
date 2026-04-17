import { createClient as createServerClient } from '@/lib/supabase/supabaseServerClient';
import { isRecoverableAuthError } from '@/lib/auth/safe-auth';

/**
 * Check if the current user is an admin (server-side)
 */
export async function isAdminServer(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError) {
      if (isRecoverableAuthError(userError.message)) {
        return false;
      }
      console.error('[isAdminServer] Error getting user:', userError);
      return false;
    }

    const user = data.user;

    if (!user) {
      console.log('[isAdminServer] No authenticated user');
      return false;
    }

    console.log('[isAdminServer] Checking admin status for user:', user.id);

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminError) {
      console.error('[isAdminServer] Error querying admins table:', adminError);
      return false;
    }

    const isAdmin = !!admin;
    console.log('[isAdminServer] Admin status:', isAdmin, admin);
    return isAdmin;
  } catch (error) {
    console.error('[isAdminServer] Exception:', error);
    return false;
  }
}

/**
 * Require admin access (server-side)
 * Throws error if user is not an admin
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await isAdminServer();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Get admin role for current user (server-side)
 */
export async function getAdminRole(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (isRecoverableAuthError(error.message)) return null;
    throw error;
  }
  const user = data.user;

  if (!user) {
    return null;
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return admin?.role || null;
}
