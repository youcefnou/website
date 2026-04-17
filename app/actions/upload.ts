'use server';

import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { uploadImageToStorage } from '@/lib/services/storage';
import { revalidatePath } from 'next/cache';

interface UploadOptions {
  folder?: string;
}

function parseBase64ToFile(dataUrl: string, fallbackName: string): File {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid base64 image data');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const bytes = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1] || 'jpg';
  const fileName = `${fallbackName}.${extension}`;
  return new File([bytes], fileName, { type: mimeType });
}

/**
 * Generate upload parameters used by client/admin forms.
 * Kept for compatibility with existing callers.
 */
export async function getSignedUploadParams(folder?: string) {
  await requireAdmin();
  return {
    provider: 'supabase',
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'products',
    folder: folder || 'uploads',
  };
}

/**
 * Upload image to Supabase Storage (admin only)
 * @param file - Base64 data URL
 * @param options - Upload options
 */
export async function uploadImage(
  file: string,
  options: UploadOptions = {}
) {
  await requireAdmin();

  try {
    const uploadFile = parseBase64ToFile(file, `upload-${Date.now()}`);
    const url = await uploadImageToStorage(uploadFile, {
      bucket: process.env.SUPABASE_STORAGE_BUCKET || 'products',
      folder: options.folder || 'products',
    });

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image',
    };
  }
}

/**
 * Update sellable item image URL (admin only)
 */
export async function updateSellableItemImage(
  sellableItemId: string,
  imageUrl: string
) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from('sellable_items')
    .update({ image_url: imageUrl })
    .eq('id', sellableItemId);

  if (error) {
    throw new Error('Failed to update sellable item image');
  }

  return { success: true };
}

/**
 * Update store logo URL (admin only)
 */
export async function updateStoreLogo(logoUrl: string) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from('store_settings')
    .update({ logo_url: logoUrl })
    .eq('id', 1);

  if (error) {
    console.error('Update store logo error:', error);
    throw new Error('Failed to update store logo');
  }

  // Revalidate all pages to show new logo
  revalidatePath('/', 'layout');
  revalidatePath('/admin/settings');

  return { success: true };
}

/**
 * Delete image from Supabase Storage by public URL (admin only)
 */
export async function deleteImage(publicUrl: string) {
  await requireAdmin();

  try {
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';
    const marker = `/storage/v1/object/public/${bucket}/`;

    if (!supabaseUrl || !publicUrl.includes(marker)) {
      throw new Error('Invalid storage URL');
    }

    const filePath = publicUrl.split(marker)[1];
    if (!filePath) {
      throw new Error('Could not parse storage path');
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: 'Failed to delete image',
    };
  }
}

/**
 * Upload and update product image in one action (admin only)
 */
export async function uploadAndUpdateProductImage(
  sellableItemId: string,
  file: string
) {
  await requireAdmin();

  try {
    // Upload to Supabase Storage
    const uploadResult = await uploadImage(file, {
      folder: 'products',
    });

    if (!uploadResult.success || !uploadResult.url) {
      throw new Error('Upload failed');
    }

    // Update database
    await updateSellableItemImage(sellableItemId, uploadResult.url);

    return {
      success: true,
      url: uploadResult.url,
    };
  } catch (error) {
    console.error('Upload and update error:', error);
    return {
      success: false,
      error: 'Failed to upload and update product image',
    };
  }
}

/**
 * Upload and update store logo in one action (admin only)
 */
export async function uploadAndUpdateStoreLogo(file: string) {
  await requireAdmin();

  try {
    // Upload to Supabase Storage
    const uploadResult = await uploadImage(file, {
      folder: 'store',
    });

    if (!uploadResult.success || !uploadResult.url) {
      console.error('Storage upload failed:', uploadResult.error);
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Update database
    await updateStoreLogo(uploadResult.url);

    return {
      success: true,
      url: uploadResult.url,
    };
  } catch (error) {
    console.error('Upload and update logo error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload and update store logo',
    };
  }
}
