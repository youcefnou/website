import { createClient } from '@/lib/supabase/supabaseBrowserClient';
import { isRecoverableAuthError } from '@/lib/auth/safe-auth';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  phone?: string;
  name?: string;
  options?: {
    data?: Record<string, unknown>;
    emailRedirectTo?: string;
  };
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const supabase = createClient();
  
  const metadata: Record<string, unknown> = {};
  if (data.phone) metadata.phone = data.phone;
  if (data.name) metadata.name = data.name;
  
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      ...data.options,
      data: {
        ...metadata,
        ...data.options?.data,
      },
    },
  });

  return {
    user: authData.user,
    session: authData.session,
    error,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  const supabase = createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  return {
    user: authData.user,
    session: authData.session,
    error,
  };
}

/**
 * Sign in with OTP sent to email
 */
export async function signInWithOTP(email: string): Promise<{ error: AuthError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  return { error };
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  email: string,
  token: string
): Promise<AuthResponse> {
  const supabase = createClient();
  const { data: authData, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  return {
    user: authData.user,
    session: authData.session,
    error,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  return { error };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      if (isRecoverableAuthError(error.message)) return null;
      throw error;
    }
    return user;
  } catch (error) {
    if (isRecoverableAuthError(error)) return null;
    throw error;
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createClient();
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      if (isRecoverableAuthError(error.message)) return null;
      throw error;
    }
    return session;
  } catch (error) {
    if (isRecoverableAuthError(error)) return null;
    throw error;
  }
}

/**
 * Reset password for email
 */
export async function resetPasswordForEmail(
  email: string,
  redirectTo: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return { error };
}

/**
 * Update user password
 */
export async function updatePassword(
  newPassword: string
): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return {
    user: data.user,
    error,
  };
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(
  metadata: Record<string, unknown>
): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  return {
    user: data.user,
    error,
  };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return subscription;
}
