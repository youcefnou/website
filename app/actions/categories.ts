'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

export async function createCategory(data: {
  name: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}) {
  await requireAdmin();
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('categories')
    .insert({
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      display_order: data.display_order || 0,
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
    });

  if (error) {
    console.error('Create category error:', error);
    throw new Error('Failed to create category');
  }

  revalidatePath('/admin/categories');
  return { success: true };
}

export async function updateCategory(
  categoryId: string,
  data: Partial<{
    name: string;
    description: string;
    image_url: string;
    display_order: number;
    is_active: boolean;
    is_featured: boolean;
  }>
) {
  await requireAdmin();
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', categoryId);

  if (error) {
    throw new Error('Failed to update category');
  }

  revalidatePath('/admin/categories');
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  
  const supabase = await createClient();
  
  // Soft delete
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', categoryId);

  if (error) {
    throw new Error('Failed to delete category');
  }

  revalidatePath('/admin/categories');
  return { success: true };
}
