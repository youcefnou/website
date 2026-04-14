'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUserInfo, updateUserProfile } from '@/app/actions/account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('accountSettings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const loadUserInfo = useCallback(async () => {
    try {
      const userInfo = await getCurrentUserInfo();
      if (userInfo) {
        setName(userInfo.name || '');
        setPhone(userInfo.phone || '');
        setEmail(userInfo.email || '');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateUserProfile({
        name,
        phone,
      });

      toast({
        title: t('toast.successTitle'),
        description: t('toast.updateSuccess'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.updateError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
          <CardDescription>
            {t('profile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.fullName')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.fullNamePlaceholder')}
                required
                className="w-full text-base sm:text-sm h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted cursor-not-allowed w-full text-base sm:text-sm h-11"
              />
              <p className="text-xs text-muted-foreground">
                {t('profile.emailReadonly')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('profile.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('profile.phonePlaceholder')}
                className="w-full text-base sm:text-sm h-11"
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[44px]">
              {saving ? t('profile.saving') : t('profile.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('password.title')}</CardTitle>
          <CardDescription>
            {t('password.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild className="w-full sm:w-auto min-h-[44px]">
            <a href="/login">{t('password.action')}</a>
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">{t('danger.title')}</CardTitle>
          <CardDescription>
            {t('danger.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('danger.contact')}
          </p>
          <Button variant="destructive" disabled className="w-full sm:w-auto min-h-[44px]">
            {t('danger.delete')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
