import { NextRequest, NextResponse } from 'next/server';
import { updateStoreName } from '@/app/actions/settings';

export async function POST(request: NextRequest) {
  try {
    const { storeName } = await request.json();

    if (!storeName || typeof storeName !== 'string') {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      );
    }

    await updateStoreName(storeName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API update store name error:', error);
    return NextResponse.json(
      { error: 'Failed to update store name' },
      { status: 500 }
    );
  }
}
