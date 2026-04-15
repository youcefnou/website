import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/supabaseServerClient';
import { requireAdmin } from '@/lib/auth/admin';
import { uploadImageToStorage } from '@/lib/services/storage';

const csvVariantRowSchema = z.object({
  model_name: z.string().optional(),
  name: z.string().optional(), // Alias for model_name
  model: z.string().optional(), // Common spreadsheet header
  price: z.coerce.number().optional(),
  image_url: z.string().optional(),
  stock: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(), // Alias for stock
  description: z.string().optional(),
  sku: z.string().optional(),
});

type CsvVariantRow = z.infer<typeof csvVariantRowSchema>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function normalizeParsedRows(rows: Record<string, string>[]) {
  return rows
    .map((row) => {
      const modelName = String(row.model_name || row.name || row.model || '').trim();
      const price = String(row.price || '').trim();
      const stock = String(row.stock || row.quantity || '').trim();
      const sku = String(row.sku || row.no || '').trim();
      const description = String(row.description || '').trim();
      const image_url = String(row.image_url || '').trim();
      return {
        model_name: modelName,
        price,
        stock,
        sku,
        description,
        image_url,
      };
    })
    .filter((row) => row.model_name.length > 0);
}

function parseDelimitedText(text: string) {
  const parsedWithHeader = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const headerRows = parsedWithHeader.data ?? [];
  const hasModelHeader = headerRows.some((row) => row.model_name || row.name || row.model);
  if (hasModelHeader) {
    return {
      rows: normalizeParsedRows(headerRows),
      errors: [] as string[],
    };
  }

  // Fallback: map generic column positions.
  // Supported common shapes:
  // - [model_name, price, stock, sku, description, image_url]
  // - [design, no, model, quantity]
  const parsedNoHeader = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
  });
  const rows = (parsedNoHeader.data ?? [])
    .map((cols) => {
      const c0 = String(cols?.[0] ?? '').trim();
      const c1 = String(cols?.[1] ?? '').trim();
      const c2 = String(cols?.[2] ?? '').trim();
      const c3 = String(cols?.[3] ?? '').trim();
      const c4 = String(cols?.[4] ?? '').trim();
      const c5 = String(cols?.[5] ?? '').trim();

      const looksLikeDesignNoModelQty =
        c2.length > 0 && c3.length > 0 && /^[\d.]+$/.test(c3);

      if (looksLikeDesignNoModelQty) {
        return {
          model_name: c2,
          price: '',
          stock: c3,
          sku: c1,
          description: '',
          image_url: '',
        };
      }

      return {
        model_name: c0,
        price: c1,
        stock: c2,
        sku: c3,
        description: c4,
        image_url: c5,
      };
    })
    .filter((row) => {
      if (!row.model_name) return false;
      const normalized = row.model_name.toLowerCase();
      return (
        normalized !== 'model' &&
        normalized !== 'modele' &&
        normalized !== 'model_name' &&
        !normalized.startsWith('customer')
      );
    });

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
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount === 0) {
      return { rows: [] as Record<string, string>[], errors: ['No worksheet found in file'] };
    }

    // Read all rows as string arrays
    const allRows: string[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Pad with empty strings for skipped columns
        while (values.length < colNumber - 1) values.push('');
        values.push(String(cell.value ?? '').trim());
      });
      allRows.push(values);
    });

    if (allRows.length === 0) {
      return { rows: [] as Record<string, string>[], errors: [] as string[] };
    }

    // Scan first 10 rows for a header row containing known column names
    const knownHeaders = ['model_name', 'name', 'model', 'design', 'no.', 'no', 'quantity', 'price', 'stock', 'sku'];
    let headerRowIndex = -1;
    let detectedHeaders: string[] = [];
    const scanLimit = Math.min(allRows.length, 10);
    for (let i = 0; i < scanLimit; i++) {
      const candidates = allRows[i].map((h) => normalizeHeader(h));
      const matchCount = candidates.filter((h) => knownHeaders.includes(h)).length;
      if (matchCount >= 2) {
        headerRowIndex = i;
        detectedHeaders = candidates;
        break;
      }
    }

    let normalizedRows: Record<string, string>[];

    if (headerRowIndex >= 0) {
      // Use detected header row
      const dataRows = allRows.slice(headerRowIndex + 1);
      const hasModelCol = detectedHeaders.some(
        (h) => h === 'model_name' || h === 'name' || h === 'model'
      );

      if (hasModelCol) {
        // Standard header mapping
        normalizedRows = dataRows.map((cols) => {
          const row: Record<string, string> = {};
          detectedHeaders.forEach((header, idx) => {
            row[header] = String(cols[idx] ?? '').trim();
          });
          return row;
        });
      } else {
        // Packing list format: design, NO., model, quantity
        normalizedRows = dataRows.map((cols) => {
          const designIdx = detectedHeaders.indexOf('design');
          const noIdx = detectedHeaders.findIndex((h) => h === 'no.' || h === 'no');
          const modelIdx = detectedHeaders.indexOf('model');
          const qtyIdx = detectedHeaders.indexOf('quantity');

          return {
            model_name: String(cols[modelIdx >= 0 ? modelIdx : 2] ?? '').trim(),
            price: '',
            stock: String(cols[qtyIdx >= 0 ? qtyIdx : 3] ?? '').trim(),
            sku: String(cols[noIdx >= 0 ? noIdx : 1] ?? '').trim(),
            description: designIdx >= 0 ? String(cols[designIdx] ?? '').trim() : '',
            image_url: '',
          };
        });
      }
    } else {
      // No header row found — map by column position
      normalizedRows = allRows.map((cols) => {
        const c0 = String(cols[0] ?? '').trim();
        const c1 = String(cols[1] ?? '').trim();
        const c2 = String(cols[2] ?? '').trim();
        const c3 = String(cols[3] ?? '').trim();
        const c4 = String(cols[4] ?? '').trim();
        const c5 = String(cols[5] ?? '').trim();
        const looksLikeDesignNoModelQty =
          c2.length > 0 && c3.length > 0 && /^[\d.]+$/.test(c3);

        if (looksLikeDesignNoModelQty) {
          return {
            model_name: c2,
            price: '',
            stock: c3,
            sku: c1,
            description: '',
            image_url: '',
          };
        }

        return {
          model_name: c0,
          price: c1,
          stock: c2,
          sku: c3,
          description: c4,
          image_url: c5,
        };
      });
    }

    return { rows: normalizeParsedRows(normalizedRows), errors: [] as string[] };
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

    // Merge duplicate models so they are imported once.
    const dedupedRowsMap = new Map<string, Record<string, string>>();
    for (const row of rows) {
      const key = String(row.model_name || '')
        .trim()
        .toLowerCase();
      if (!key) continue;

      const existing = dedupedRowsMap.get(key);
      if (!existing) {
        dedupedRowsMap.set(key, { ...row });
        continue;
      }

      const incomingStock = Number(row.stock || 0);
      const existingStock = Number(existing.stock || 0);
      const mergedStock = Number.isFinite(incomingStock) && Number.isFinite(existingStock)
        ? incomingStock + existingStock
        : existingStock || incomingStock;

      dedupedRowsMap.set(key, {
        ...existing,
        stock: String(mergedStock || 0),
        sku: existing.sku || row.sku || '',
        price: existing.price || row.price || '',
        image_url: existing.image_url || row.image_url || '',
        description: existing.description || row.description || '',
      });
    }
    const dedupedRows = Array.from(dedupedRowsMap.values());

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

    for (let index = 0; index < dedupedRows.length; index += 1) {
      const row = dedupedRows[index];

      // Strip empty strings to undefined so Zod .optional() handles them
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        cleaned[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
      }

      const parsedRow = csvVariantRowSchema.safeParse(cleaned);

      if (!parsedRow.success) {
        validationErrors.push(`Row ${index + 2}: ${parsedRow.error.issues[0]?.message ?? 'Invalid row'}`);
        continue;
      }

      const data: CsvVariantRow = parsedRow.data;
      const modelName = (data.model_name ?? data.name ?? data.model ?? '').trim();
      if (!modelName) {
        validationErrors.push(`Row ${index + 2}: model_name (or name) is required`);
        continue;
      }

      const variantDescription = data.description?.trim() || modelName;
      const rawPrice = data.price;
      const variantPrice = (typeof rawPrice === 'number' && !Number.isNaN(rawPrice) && rawPrice > 0)
        ? rawPrice
        : fallbackPrice;
      if (typeof variantPrice !== 'number' || Number.isNaN(variantPrice) || variantPrice <= 0) {
        validationErrors.push(`Row ${index + 2}: price is required — set a default price or include a price column`);
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
        stock: data.stock ?? data.quantity ?? 0,
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
      deduplicated: rows.length - dedupedRows.length,
      productId: targetProduct.id,
      mode: importMode,
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ error: 'Failed to process CSV upload' }, { status: 500 });
  }
}
