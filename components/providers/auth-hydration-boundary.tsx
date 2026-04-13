'use client';

import { useEffect } from 'react';
import { onAuthStateChange } from '@/lib/auth';
import { useAuthStore, type AuthRole } from '@/store/auth-store';
import type { User } from '@supabase/supabase-js';

export function AuthHydrationBoundary({
  initialUser,
  initialRole,
  children,
}: {
  initialUser: User | null;
  initialRole: AuthRole;
  children: React.ReactNode;
}) {
  const { setAuthState } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    // Deterministic source of truth comes from server-derived auth state.
    setAuthState({
      user: initialUser,
      role: initialRole,
      isLoading: false,
      isHydrated: true,
    });

    const subscription = onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const user = session?.user ?? null;
      const currentRole = useAuthStore.getState().role;
      const role: AuthRole = user
        ? currentRole === 'admin'
          ? 'admin'
          : 'user'
        : 'guest';
      setAuthState({
        user,
        role,
        isLoading: false,
        isHydrated: true,
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialRole, initialUser, setAuthState]);

  return <>{children}</>;
}
