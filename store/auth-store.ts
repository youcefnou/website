import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

export type AuthRole = 'guest' | 'user' | 'admin';

interface AuthState {
  user: User | null;
  role: AuthRole;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: AuthRole) => void;
  setIsLoading: (isLoading: boolean) => void;
  setHydrated: (isHydrated: boolean) => void;
  setAuthState: (payload: {
    user: User | null;
    role: AuthRole;
    isLoading?: boolean;
    isHydrated?: boolean;
  }) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: 'guest',
  isLoading: true,
  isHydrated: false,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  setAuthState: ({ user, role, isLoading = false, isHydrated = true }) =>
    set({ user, role, isLoading, isHydrated }),
  reset: () => set({ user: null, role: 'guest', isLoading: false, isHydrated: true }),
}));
