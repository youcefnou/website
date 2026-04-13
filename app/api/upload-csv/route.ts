import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';

const csvProductRowSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().uuid(),
  price: z.coerce.number().positive(),
  image_url: z.string().url(),
  stock: z.coerce.number().int().nonnegative().default(0),
  description: z.string().optional().default(''),
  sku: z.string().optional(),
  is_active: z
    .union([z.boolean(), z.string()])
    .transform((value) => (typeof value === 'boolean' ? value : value.toLowerCase() !== 'false'))
    .default(true),
  is_featured: z
    .union([z.boolean(), z.string()])
    .transform((value) => (typeof value === 'boolean' ? value : value.toLowerCase() === 'true'))
    .default(false),
});

type CsvProductRow = z.infer<typeof csvProductRowSchema>;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const csvFile = formData.get('file');

    if (!(csvFile instanceof File)) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
    }

    const csvText = await csvFile.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid CSV format', details: parsed.errors.map((error) => error.message) },
        { status: 400 }
      );
    }

    const rows = parsed.data;
    if (!rows.length) {
      return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
    }

    const supabase = await createClient();
    const createdProductIds: string[] = [];
    const validationErrors: string[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const parsedRow = csvProductRowSchema.safeParse(row);

      if (!parsedRow.success) {
        validationErrors.push(`Row ${index + 2}: ${parsedRow.error.issues[0]?.message ?? 'Invalid row'}`);
        continue;
      }

      const data: CsvProductRow = parsedRow.data;

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description || null,
          category_id: data.category_id,
          is_active: data.is_active,
          is_featured: data.is_featured,
          has_variants: false,
        })
        .select('id')
        .single();

      if (productError || !product) {
        validationErrors.push(`Row ${index + 2}: failed to create product`);
        continue;
      }

      const { error: itemError } = await supabase.from('sellable_items').insert({
        product_id: product.id,
        variant_id: null,
        sku: data.sku?.trim() ? data.sku.trim() : `CSV-${product.id}`,
        price: data.price,
        stock: data.stock,
        description: data.name,
        image_url: data.image_url,
      });

      if (itemError) {
        await supabase.from('products').delete().eq('id', product.id);
        validationErrors.push(`Row ${index + 2}: failed to create sellable item`);
        continue;
      }

      createdProductIds.push(product.id);
    }

    return NextResponse.json({
      success: validationErrors.length === 0,
      inserted: createdProductIds.length,
      failed: validationErrors.length,
      errors: validationErrors,
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ error: 'Failed to process CSV upload' }, { status: 500 });
  }
}
