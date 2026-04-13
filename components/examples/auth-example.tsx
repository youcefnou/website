'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getCurrentUser } from '@/lib/auth';

/**
 * Example component demonstrating Zustand store usage with Supabase auth
 * This component fetches the current user and stores it in Zustand
 */
export function AuthExample() {
  const { user, isLoading, setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [setUser, setIsLoading]);

  if (isLoading) {
    return <div className="p-4">Loading user...</div>;
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 text-lg font-semibold">Auth Example (Zustand)</h3>
      {user ? (
        <div>
          <p className="text-sm text-muted-foreground">
            Logged in as: {user.email}
          </p>
          <p className="text-xs text-muted-foreground">ID: {user.id}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No user logged in</p>
      )}
    </div>
  );
}
