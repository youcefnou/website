import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/services/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      console.error('❌ No file provided in request');
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'bytes');
      return NextResponse.json(
        { error: `La taille du fichier doit être inférieure à 10 Mo` },
        { status: 400 }
      );
    }

    console.log('📤 Uploading image:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      uploadType: type,
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer back to File for centralized storage service
    const uploadFile = new File([buffer], file.name, { type: file.type });
    const url = await uploadImageToStorage(uploadFile, {
      bucket: process.env.SUPABASE_STORAGE_BUCKET || 'products',
      folder: `store/${type || 'general'}`,
    });

    return NextResponse.json({
      url,
      success: true,
    });

  } catch (error: unknown) {
    console.error('❌ Upload API error:', error);
    
    let errorMessage = 'Échec du téléchargement';
    let details = '';

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      errorMessage = 'Une erreur s\'est produite lors du téléchargement';
      details = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    storage: {
      provider: 'supabase',
    },
    timestamp: new Date().toISOString(),
  });
}
