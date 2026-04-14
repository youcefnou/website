'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CsvUploadFormProps {
  products: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function CsvUploadForm({ products, categories }: CsvUploadFormProps) {
  const [importMode, setImportMode] = useState<'existing' | 'new'>('existing');
  const [file, setFile] = useState<File | null>(null);
  const [productId, setProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [defaultImageUrl, setDefaultImageUrl] = useState('');
  const [defaultImageFile, setDefaultImageFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<
    Array<{ model_name: string; price?: string; stock?: string; sku?: string; description?: string; image_url?: string }>
  >([]);
  const [previewError, setPreviewError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const normalizeHeader = (header: string) => header.trim().toLowerCase();

  const parseTextRows = (text: string) => {
    const headerParsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
    });
    const rowsWithHeaders = (headerParsed.data || []).map((row) => ({
      model_name: (row.model_name || row.name || '').trim(),
      price: (row.price || '').trim(),
      stock: (row.stock || '').trim(),
      sku: (row.sku || '').trim(),
      description: (row.description || '').trim(),
      image_url: (row.image_url || '').trim(),
    }));
    const hasHeaderModels = rowsWithHeaders.some((row) => row.model_name);
    if (hasHeaderModels) return rowsWithHeaders.filter((row) => row.model_name);

    const rawParsed = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
    });
    return (rawParsed.data || [])
      .map((cols) => ({
        model_name: String(cols?.[0] ?? '').trim(),
        price: String(cols?.[1] ?? '').trim(),
        stock: String(cols?.[2] ?? '').trim(),
        sku: String(cols?.[3] ?? '').trim(),
        description: String(cols?.[4] ?? '').trim(),
        image_url: String(cols?.[5] ?? '').trim(),
      }))
      .filter((row) => row.model_name);
  };

  const handlePreview = async (selectedFile: File | null) => {
    setPreviewError('');
    setPreviewRows([]);
    if (!selectedFile) return;

    try {
      const fileName = selectedFile.name.toLowerCase();
      const extension = fileName.includes('.') ? fileName.split('.').pop() ?? '' : '';
      let rows: Array<{ model_name: string; price?: string; stock?: string; sku?: string; description?: string; image_url?: string }> =
        [];

      if (['xlsx', 'xls', 'xlsm', 'ods'].includes(extension)) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setPreviewError('Aucune feuille detectee dans ce fichier.');
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false,
        });
        rows = jsonRows
          .map((row) => {
            const normalized: Record<string, string> = {};
            Object.entries(row).forEach(([key, value]) => {
              normalized[normalizeHeader(key)] = String(value ?? '').trim();
            });
            return {
              model_name: normalized.model_name || normalized.name || '',
              price: normalized.price || '',
              stock: normalized.stock || '',
              sku: normalized.sku || '',
              description: normalized.description || '',
              image_url: normalized.image_url || '',
            };
          })
          .filter((row) => row.model_name);

        if (rows.length === 0) {
          const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
            header: 1,
            blankrows: false,
            raw: false,
          });
          rows = rawRows
            .map((cols) => ({
              model_name: String(cols?.[0] ?? '').trim(),
              price: String(cols?.[1] ?? '').trim(),
              stock: String(cols?.[2] ?? '').trim(),
              sku: String(cols?.[3] ?? '').trim(),
              description: String(cols?.[4] ?? '').trim(),
              image_url: String(cols?.[5] ?? '').trim(),
            }))
            .filter((row) => row.model_name);
        }
      } else {
        const text = await selectedFile.text();
        rows = parseTextRows(text);
      }

      if (rows.length === 0) {
        setPreviewError('Aucun modele detecte. Ajoutez au moins une colonne model_name (ou une liste de noms en premiere colonne).');
        return;
      }

      setPreviewRows(rows.slice(0, 50));
      toast({
        title: 'Apercu pret',
        description: `${rows.length} lignes detectees (50 affichees max).`,
      });
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Impossible de parser le fichier.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier CSV',
        variant: 'destructive',
      });
      return;
    }
    if (importMode === 'existing' && !productId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un produit existant',
        variant: 'destructive',
      });
      return;
    }
    if (importMode === 'new' && !newProductName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez renseigner le nom du nouveau produit',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('import_mode', importMode);
    if (productId) formData.append('product_id', productId);
    if (newProductName.trim()) formData.append('new_product_name', newProductName.trim());
    if (newCategoryId) formData.append('new_category_id', newCategoryId);
    if (defaultPrice.trim()) formData.append('default_price', defaultPrice.trim());
    if (defaultImageUrl.trim()) formData.append('default_image_url', defaultImageUrl.trim());
    if (defaultImageFile) formData.append('default_image_file', defaultImageFile);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Échec de l’import CSV');
      }

      setResult({
        inserted: data.inserted ?? 0,
        failed: data.failed ?? 0,
        errors: data.errors ?? [],
      });

      toast({
        title: 'Import terminé',
        description:
          importMode === 'new'
            ? `${data.inserted ?? 0} variantes ajoutées au nouveau produit.`
            : `${data.inserted ?? 0} variantes ajoutées au produit.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de l’import CSV',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 rounded-lg border bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Format CSV attendu (minimal)</h3>
        <p className="text-sm text-muted-foreground">
          Colonne obligatoire: <code>model_name</code> (ou <code>name</code>)
        </p>
        <p className="text-sm text-muted-foreground">
          Colonnes optionnelles: <code>price, stock, image_url, description, sku</code>
        </p>
        <p className="text-sm text-muted-foreground">
          Vous pouvez ajouter des variantes a un produit existant ou creer un nouveau produit depuis le fichier.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Mode d&apos;import</Label>
          <Select
            value={importMode}
            onValueChange={(value: 'existing' | 'new') => setImportMode(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="existing">Ajouter a un produit existant</SelectItem>
              <SelectItem value="new">Creer un nouveau produit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {importMode === 'existing' ? (
        <div className="space-y-2">
          <Label>Produit existant</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un produit" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        ) : (
          <div className="space-y-3 rounded-md border p-3">
            <div className="space-y-2">
              <Label htmlFor="new-product-name">Nom du nouveau produit</Label>
              <input
                id="new-product-name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Ex: Coques Samsung S24"
              />
            </div>
            <div className="space-y-2">
              <Label>Categorie (optionnel)</Label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une categorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="csv-file">Fichier (txt, csv, xls, xlsx, etc.)</Label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,.txt,.tsv,.xls,.xlsx,.xlsm,.ods,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              void handlePreview(selected);
            }}
            className="w-full rounded-md border p-2 text-sm"
          />
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <Label className="text-sm font-semibold">Valeurs par defaut (optionnelles)</Label>
          <p className="text-xs text-muted-foreground">
            Utilisees si les colonnes correspondantes sont absentes dans le fichier.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(e.target.value)}
              placeholder="Prix par defaut (DZD)"
              className="w-full rounded-md border p-2 text-sm"
              type="number"
              min={0}
              step="0.01"
            />
            <input
              value={defaultImageUrl}
              onChange={(e) => setDefaultImageUrl(e.target.value)}
              placeholder="Image URL par defaut"
              className="w-full rounded-md border p-2 text-sm"
              type="url"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setDefaultImageFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border p-2 text-sm md:col-span-2"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Import en cours...' : 'Importer le CSV'}
        </Button>
      </form>

      <div className="space-y-2 rounded-md border bg-muted/10 p-4">
        <p className="text-sm font-semibold">Apercu des modeles detectes</p>
        {previewError ? <p className="text-sm text-red-600">{previewError}</p> : null}
        {previewRows.length > 0 ? (
          <div className="max-h-64 overflow-auto rounded border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="px-2 py-1 text-left">Modele</th>
                  <th className="px-2 py-1 text-left">Prix</th>
                  <th className="px-2 py-1 text-left">Stock</th>
                  <th className="px-2 py-1 text-left">SKU</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={`${row.model_name}-${idx}`} className="border-b last:border-b-0">
                    <td className="px-2 py-1">{row.model_name}</td>
                    <td className="px-2 py-1">{row.price || '-'}</td>
                    <td className="px-2 py-1">{row.stock || '-'}</td>
                    <td className="px-2 py-1">{row.sku || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Selectionnez un fichier pour voir un apercu avant import.</p>
        )}
      </div>

      {result && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-4">
          <p className="text-sm">
            <span className="font-semibold">Variantes ajoutées:</span> {result.inserted}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Échecs:</span> {result.failed}
          </p>
          {result.errors.length > 0 && (
            <div className="pt-2">
              <p className="text-sm font-semibold">Erreurs:</p>
              <ul className="list-disc pl-5 text-sm text-red-600">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
