import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'fr',
  localePrefix: 'never',
});

export type AppLocale = (typeof routing.locales)[number];

export const RTL_LOCALES: AppLocale[] = ['ar'];
