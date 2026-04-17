'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn, signInWithOTP, verifyOTP } from '@/lib/auth';
import { isAdminClient } from '@/lib/auth/admin-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthMode = 'password' | 'otp' | 'verify-otp';

function LoginForm() {
  const router = useRouter();
  const t = useTranslations('auth.login');
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || null;
  
  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getPostLoginRoute = async () => {
    if (redirect) return redirect;
    const admin = await isAdminClient();
    return admin ? '/admin' : '/account';
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await signIn({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const nextRoute = await getPostLoginRoute();
      router.push(nextRoute);
      router.refresh();
    } catch {
      setError(t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: otpError } = await signInWithOTP(email);
      if (otpError) {
        setError(otpError.message);
      } else {
        setMode('verify-otp');
        setError('');
      }
    } catch {
      setError(t('errors.sendOtpFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: verifyError } = await verifyOTP(email, otpCode);
      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      const nextRoute = await getPostLoginRoute();
      router.push(nextRoute);
      router.refresh();
    } catch {
      setError(t('errors.invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {mode === 'verify-otp'
              ? t('verifyOtpDescription')
              : t('description')}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('fields.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('fields.emailPlaceholder')}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">{t('fields.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('actions.loggingIn') : t('actions.login')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setMode('otp')}
              disabled={loading}
            >
              {t('actions.useOtp')}
            </Button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleOTPRequest} className="space-y-4">
            <div>
              <Label htmlFor="email-otp">{t('fields.email')}</Label>
              <Input
                id="email-otp"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('fields.emailPlaceholder')}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('actions.sendingCode') : t('actions.sendCode')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setMode('password')}
              disabled={loading}
            >
              {t('actions.usePassword')}
            </Button>
          </form>
        )}

        {mode === 'verify-otp' && (
          <form onSubmit={handleOTPVerify} className="space-y-4">
            <div>
              <Label htmlFor="otp">{t('fields.otpCode')}</Label>
              <Input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                required
                disabled={loading}
                maxLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('actions.verifying') : t('actions.verify')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setMode('otp')}
              disabled={loading}
            >
              {t('actions.resendCode')}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t('signupPrompt')}{' '}
          <Link href="/signup" className="font-medium text-primary">
            {t('signupLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Loading</h1>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
