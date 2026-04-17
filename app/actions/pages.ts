'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

export async function getPage(pageId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - page not found
      return null;
    }
    console.error(`Failed to fetch page ${pageId}:`, error);
    throw new Error(`Failed to fetch page: ${error.message}`);
  }

  return data;
}

export async function getAllPages() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('id');

  if (error) {
    console.error('Failed to fetch pages:', error);
    return [];
  }

  return data;
}

export async function updatePage(pageId: string, pageData: {
  title: string;
  content: string;
  meta_description?: string;
  is_published?: boolean;
}) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from('pages')
    .update(pageData)
    .eq('id', pageId);

  if (error) {
    console.error(`Failed to update page ${pageId}:`, error);
    throw new Error(`Failed to update page: ${error.message}`);
  }

  revalidatePath(`/${pageId}`);
  revalidatePath('/admin/settings/pages');
  
  return { success: true };
}
