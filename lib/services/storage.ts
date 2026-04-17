import { createClient } from '@/lib/supabase/supabaseServerClient';

interface UploadStorageImageOptions {
  bucket?: string;
  folder?: string;
}

export async function uploadImageToStorage(
  file: File,
  options: UploadStorageImageOptions = {}
) {
  const supabase = await createClient();
  const bucket = options.bucket || 'products';
  const folder = options.folder || '';
  const sanitizedFileName = file.name.replace(/\s+/g, '-');
  const filePath = `${folder}${folder ? '/' : ''}${Date.now()}-${sanitizedFileName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
