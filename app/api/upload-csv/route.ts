import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { uploadImageToStorage } from '@/lib/services/storage';

const csvVariantRowSchema = z.object({
  model_name: z.string().optional(),
  name: z.string().optional(), // Alias for model_name
  price: z.coerce.number().positive().optional(),
  image_url: z.string().url().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
});

type CsvVariantRow = z.infer<typeof csvVariantRowSchema>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function parseDelimitedText(text: string) {
  const parsedWithHeader = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const headerRows = parsedWithHeader.data ?? [];
  const hasModelHeader = headerRows.some((row) => row.model_name || row.name);
  if (hasModelHeader) {
    return {
      rows: headerRows,
      errors: [] as string[],
    };
  }

  // Fallback: treat each line as a model name when headers are missing/unknown.
  const parsedNoHeader = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
  });
  const rows = (parsedNoHeader.data ?? [])
    .map((cols) => ({
      model_name: String(cols?.[0] ?? '').trim(),
      price: String(cols?.[1] ?? '').trim(),
      stock: String(cols?.[2] ?? '').trim(),
      sku: String(cols?.[3] ?? '').trim(),
      description: String(cols?.[4] ?? '').trim(),
      image_url: String(cols?.[5] ?? '').trim(),
    }))
    .filter((row) => row.model_name.length > 0);

  return {
    rows,
    errors: [] as string[],
  };
}

async function parseUploadedRows(file: File) {
  const filename = file.name.toLowerCase();
  const extension = filename.includes('.') ? filename.split('.').pop() ?? '' : '';

  if (['xlsx', 'xls', 'xlsm', 'ods'].includes(extension)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { rows: [] as Record<string, string>[], errors: ['No worksheet found in file'] };
    }
    const sheet = workbook.Sheets[firstSheetName];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });
    let normalizedRows = jsonRows.map((row) => {
      const normalized: Record<string, string> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[normalizeHeader(key)] = String(value ?? '').trim();
      });
      return normalized;
    });

    const hasModelHeader = normalizedRows.some((row) => row.model_name || row.name);
    if (!hasModelHeader) {
      const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
        header: 1,
        blankrows: false,
        raw: false,
      });
      normalizedRows = rawRows
        .map((cols) => ({
          model_name: String(cols?.[0] ?? '').trim(),
          price: String(cols?.[1] ?? '').trim(),
          stock: String(cols?.[2] ?? '').trim(),
          sku: String(cols?.[3] ?? '').trim(),
          description: String(cols?.[4] ?? '').trim(),
          image_url: String(cols?.[5] ?? '').trim(),
        }))
        .filter((row) => row.model_name.length > 0);
    }

    return { rows: normalizedRows, errors: [] as string[] };
  }

  const text = await file.text();
  return parseDelimitedText(text);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const csvFile = formData.get('file');
    const importModeRaw = formData.get('import_mode');
    const importMode = importModeRaw === 'new' ? 'new' : 'existing';
    const productIdRaw = formData.get('product_id');
    const productId = typeof productIdRaw === 'string' ? productIdRaw : '';
    const newProductNameRaw = formData.get('new_product_name');
    const newProductName = typeof newProductNameRaw === 'string' ? newProductNameRaw.trim() : '';
    const newCategoryIdRaw = formData.get('new_category_id');
    const newCategoryId =
      typeof newCategoryIdRaw === 'string' && newCategoryIdRaw.trim().length > 0
        ? newCategoryIdRaw
        : null;
    const defaultPriceRaw = formData.get('default_price');
    const defaultPrice =
      typeof defaultPriceRaw === 'string' && defaultPriceRaw.trim().length > 0
        ? Number(defaultPriceRaw)
        : null;
    const defaultImageUrlRaw = formData.get('default_image_url');
    const defaultImageUrl =
      typeof defaultImageUrlRaw === 'string' && defaultImageUrlRaw.trim().length > 0
        ? defaultImageUrlRaw.trim()
        : null;
    const defaultImageFile = formData.get('default_image_file');

    if (!(csvFile instanceof File)) {
      return NextResponse.json({ error: 'Import file is required' }, { status: 400 });
    }
    if (importMode === 'existing' && !productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }
    if (importMode === 'new' && !newProductName) {
      return NextResponse.json({ error: 'new_product_name is required' }, { status: 400 });
    }

    const parsed = await parseUploadedRows(csvFile);

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid file format', details: parsed.errors },
        { status: 400 }
      );
    }

    const rows = parsed.rows;
    if (!rows.length) {
      return NextResponse.json({ error: 'File has no data rows' }, { status: 400 });
    }

    const supabase = await createClient();
    const createdVariantIds: string[] = [];
    const validationErrors: string[] = [];

    let uploadedDefaultImageUrl: string | null = null;
    if (defaultImageFile instanceof File && defaultImageFile.size > 0) {
      try {
        uploadedDefaultImageUrl = await uploadImageToStorage(defaultImageFile, {
          bucket: process.env.SUPABASE_STORAGE_BUCKET || 'products',
          folder: 'products',
        });
      } catch (uploadError) {
        return NextResponse.json(
          {
            error: `Failed to upload default image file: ${
              uploadError instanceof Error ? uploadError.message : 'unknown error'
            }`,
          },
          { status: 400 }
        );
      }
    }

    let targetProduct:
      | {
          id: string;
          name: string;
          has_variants: boolean;
          sellable_items: Array<{ price: number | null; image_url: string | null }> | null;
        }
      | null = null;

    if (importMode === 'existing') {
      const { data: existingProduct, error: productError } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          has_variants,
          sellable_items(price, image_url)
        `
        )
        .eq('id', productId)
        .single();

      if (productError || !existingProduct) {
        return NextResponse.json({ error: 'Selected product not found' }, { status: 404 });
      }

      targetProduct = existingProduct;
    } else {
      const { data: createdProduct, error: createError } = await supabase
        .from('products')
        .insert({
          name: newProductName,
          category_id: newCategoryId,
          has_variants: true,
          description: null,
        })
        .select('id, name, has_variants')
        .single();

      if (createError || !createdProduct) {
        return NextResponse.json({ error: 'Failed to create new product' }, { status: 500 });
      }

      targetProduct = {
        ...createdProduct,
        sellable_items: [],
      };
    }

    const baseSellableItem = targetProduct.sellable_items?.[0] ?? null;
    const fallbackPrice = defaultPrice ?? baseSellableItem?.price ?? null;
    const fallbackImage =
      uploadedDefaultImageUrl ?? defaultImageUrl ?? baseSellableItem?.image_url ?? null;

    if (!targetProduct.has_variants) {
      await supabase.from('products').update({ has_variants: true }).eq('id', targetProduct.id);
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const parsedRow = csvVariantRowSchema.safeParse(row);

      if (!parsedRow.success) {
        validationErrors.push(`Row ${index + 2}: ${parsedRow.error.issues[0]?.message ?? 'Invalid row'}`);
        continue;
      }

      const data: CsvVariantRow = parsedRow.data;
      const modelName = (data.model_name ?? data.name ?? '').trim();
      if (!modelName) {
        validationErrors.push(`Row ${index + 2}: model_name (or name) is required`);
        continue;
      }

      const variantDescription = data.description?.trim() || modelName;
      const variantPrice = data.price ?? fallbackPrice;
      if (typeof variantPrice !== 'number' || Number.isNaN(variantPrice) || variantPrice <= 0) {
        validationErrors.push(`Row ${index + 2}: price is required because no default price exists on product`);
        continue;
      }

      const { data: createdVariant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: targetProduct.id,
          name: modelName,
        })
        .select('id')
        .single();

      if (variantError || !createdVariant) {
        validationErrors.push(`Row ${index + 2}: failed to create variant`);
        continue;
      }

      const generatedSku = data.sku?.trim() ? data.sku.trim() : `CSV-${targetProduct.id}-${createdVariant.id}`;
      const { error: itemError } = await supabase.from('sellable_items').insert({
        product_id: targetProduct.id,
        variant_id: createdVariant.id,
        sku: generatedSku,
        price: variantPrice,
        stock: data.stock ?? 0,
        description: variantDescription,
        image_url: data.image_url ?? fallbackImage,
      });

      if (itemError) {
        await supabase.from('product_variants').delete().eq('id', createdVariant.id);
        validationErrors.push(`Row ${index + 2}: failed to create sellable item (${itemError.message})`);
        continue;
      }

      createdVariantIds.push(createdVariant.id);
    }

    return NextResponse.json({
      success: validationErrors.length === 0,
      inserted: createdVariantIds.length,
      failed: validationErrors.length,
      errors: validationErrors,
      productId: targetProduct.id,
      mode: importMode,
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ error: 'Failed to process CSV upload' }, { status: 500 });
  }
}
