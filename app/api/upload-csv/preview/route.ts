import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { requireAdmin } from '@/lib/auth/admin';

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
      return { model_name: modelName, price, stock, sku, description, image_url };
    })
    .filter((row) => row.model_name.length > 0);
}

async function parseFileForPreview(file: File) {
  const filename = file.name.toLowerCase();
  const extension = filename.includes('.') ? filename.split('.').pop() ?? '' : '';

  if (['xlsx', 'xls', 'xlsm', 'ods'].includes(extension)) {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount === 0) {
      return { rows: [] as Record<string, string>[], error: null };
    }

    const allRows: string[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        while (values.length < colNumber - 1) values.push('');
        values.push(String(cell.value ?? '').trim());
      });
      allRows.push(values);
    });

    if (allRows.length === 0) {
      return { rows: [] as Record<string, string>[], error: null };
    }

    // Scan first 10 rows for headers
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
      const dataRows = allRows.slice(headerRowIndex + 1);
      const hasModelCol = detectedHeaders.some(
        (h) => h === 'model_name' || h === 'name' || h === 'model'
      );

      if (hasModelCol) {
        normalizedRows = dataRows.map((cols) => {
          const row: Record<string, string> = {};
          detectedHeaders.forEach((header, idx) => {
            row[header] = String(cols[idx] ?? '').trim();
          });
          return row;
        });
      } else {
        // Packing list: design, NO., model, quantity
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
            model_name: c2, price: '', stock: c3, sku: c1,
            description: '', image_url: '',
          };
        }
        return {
          model_name: c0, price: c1, stock: c2, sku: c3,
          description: c4, image_url: c5,
        };
      });
    }

    return { rows: normalizeParsedRows(normalizedRows), error: null };
  }

  // CSV / text
  const text = await file.text();
  const parsedWithHeader = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const headerRows = parsedWithHeader.data ?? [];
  const hasModelHeader = headerRows.some((row) => row.model_name || row.name || row.model);

  if (hasModelHeader) {
    return { rows: normalizeParsedRows(headerRows), error: null };
  }

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
          model_name: c2, price: '', stock: c3, sku: c1,
          description: '', image_url: '',
        };
      }
      return {
        model_name: c0, price: c1, stock: c2, sku: c3,
        description: c4, image_url: c5,
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

  return { rows: normalizeParsedRows(rows), error: null };
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const { rows, error } = await parseFileForPreview(file);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Deduplicate
    const dedupedMap = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = row.model_name.trim().toLowerCase();
      if (!key) continue;
      const existing = dedupedMap.get(key);
      if (!existing) {
        dedupedMap.set(key, row);
        continue;
      }
      const existingStock = Number(existing.stock || 0);
      const rowStock = Number(row.stock || 0);
      dedupedMap.set(key, {
        ...existing,
        stock:
          Number.isFinite(existingStock) && Number.isFinite(rowStock)
            ? String(existingStock + rowStock)
            : existing.stock || row.stock || '',
        sku: existing.sku || row.sku || '',
        price: existing.price || row.price || '',
        image_url: existing.image_url || row.image_url || '',
        description: existing.description || row.description || '',
      });
    }

    const dedupedRows = Array.from(dedupedMap.values());
    const duplicatesRemoved = rows.length - dedupedRows.length;

    return NextResponse.json({
      rows: dedupedRows.slice(0, 50),
      total: dedupedRows.length,
      duplicatesRemoved: Math.max(duplicatesRemoved, 0),
    });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse file' },
      { status: 500 }
    );
  }
}
