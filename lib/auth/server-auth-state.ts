import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { isRecoverableAuthError } from '@/lib/auth/safe-auth';
import type { AuthRole } from '@/store/auth-store';

export interface ServerAuthState {
  user: User | null;
  role: AuthRole;
}

export async function getServerAuthState(): Promise<ServerAuthState> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (isRecoverableAuthError(error.message)) {
        return { user: null, role: 'guest' };
      }
      throw error;
    }

    const user = data.user;
    if (!user) {
      return { user: null, role: 'guest' };
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (adminError) {
      return { user, role: 'user' };
    }

    return { user, role: admin ? 'admin' : 'user' };
  } catch {
    return { user: null, role: 'guest' };
  }
}
