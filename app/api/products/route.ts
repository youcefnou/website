import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getRelatedProducts } from '@/app/actions/products';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('category') || searchParams.get('categoryId');
    const excludeId = searchParams.get('exclude');
    const limit = searchParams.get('limit');

    // If exclude param is provided, fetch related products
    if (excludeId && categoryId) {
      const relatedProducts = await getRelatedProducts(
        categoryId,
        excludeId,
        limit ? parseInt(limit) : 4
      );
      return NextResponse.json(relatedProducts);
    }

    const products = await getProducts(categoryId || undefined);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
