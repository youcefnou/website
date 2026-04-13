'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

export async function getStoreSettings() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Failed to fetch store settings:', error);
      return null;
    }

    return data;
  } catch {
    // Supabase is not configured, return default settings
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase not configured, using default store settings');
    }
    return {
      id: 1,
      store_name: 'My Store',
      logo_url: null,
      social_links: {},
      contact_info: {},
      footer_tagline: 'Welcome to our store',
    };
  }
}

export async function getHomeContent() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('home_content')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Failed to fetch home content:', error);
      return null;
    }

    return data;
  } catch {
    // Supabase is not configured, return default content
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase not configured, using default home content');
    }
    return null;
  }
}

export async function updateStoreSettings(settings: {
  social_links?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from('store_settings')
    .update(settings)
    .eq('id', 1);

  if (error) {
    console.error('Failed to update store settings:', error);
    throw new Error('Failed to update store settings');
  }

  revalidatePath('/');
  revalidatePath('/admin/settings');
  
  return { success: true };
}

export async function updateStoreName(storeName: string) {
  await requireAdmin();
  
  if (!storeName.trim()) {
    throw new Error('Store name cannot be empty');
  }

  const supabase = await createClient();
  
  const { error } = await supabase
    .from('store_settings')
    .update({ store_name: storeName.trim() })
    .eq('id', 1);

  if (error) {
    console.error('Update store name error:', error);
    throw new Error('Failed to update store name');
  }

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout'); // Revalidate entire site to show new name
  
  return { success: true };
}

export async function updateFooterTagline(tagline: string) {
  await requireAdmin();
  
  if (!tagline.trim()) {
    throw new Error('Le slogan ne peut pas être vide');
  }
  
  if (tagline.length > 200) {
    throw new Error('Le slogan doit contenir 200 caractères ou moins');
  }

  const supabase = await createClient();
  
  const { error } = await supabase
    .from('store_settings')
    .update({ footer_tagline: tagline.trim() })
    .eq('id', 1);

  if (error) {
    console.error('Update footer tagline error:', error);
    throw new Error('Échec de la mise à jour du slogan du pied de page');
  }

  revalidatePath('/');
  revalidatePath('/admin/settings');
  
  return { success: true };
}
