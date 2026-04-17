// Types for custom_settings stored in store_settings table
import { LucideIcon } from 'lucide-react';

export interface CarouselSlide {
  id: number;
  title: string;
  title_en?: string;
  title_ar?: string;
  subtitle: string;
  subtitle_en?: string;
  subtitle_ar?: string;
  cta_text: string;
  cta_text_en?: string;
  cta_text_ar?: string;
  cta_link: string;
  bg_color: string;
  image_url: string;
  enabled: boolean;
  order: number;
}

export interface CarouselSettings {
  auto_play: boolean;
  interval: number;
  show_arrows: boolean;
  show_dots: boolean;
}

export interface CategoryCard {
  id: number | string;
  name: string;
  icon: string | LucideIcon; // Icon name from lucide-react or actual component
  color: string; // Tailwind color class
  category_id: string | null; // UUID from categories table
  enabled: boolean;
  order: number;
}

export interface CustomSettings {
  carousel_slides: CarouselSlide[];
  carousel_settings: CarouselSettings;
  category_cards: CategoryCard[];
}
