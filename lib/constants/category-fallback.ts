import { Smartphone, Headphones, Plug, Watch, Battery, Speaker } from 'lucide-react';

export const CATEGORY_FALLBACK_ICONS = [
  Smartphone,
  Headphones,
  Plug,
  Watch,
  Battery,
  Speaker,
] as const;

export const CATEGORY_FALLBACK_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
] as const;
