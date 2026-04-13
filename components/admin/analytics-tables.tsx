'use client';

import { formatCurrency } from '@/lib/formatCurrency';

interface AnalyticsTablesProps {
  bestSelling: Array<{
    product_id: string;
    product_name: string;
    total_quantity_sold: number;
    total_revenue: string;
  }>;
  revenuePerProduct: Array<{
    product_id: string;
    product_name: string;
    total_quantity_sold: number;
    total_revenue: string;
  }>;
}

export function AnalyticsTables({
  bestSelling,
  revenuePerProduct,
}: AnalyticsTablesProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Best Selling Products */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Produits les plus vendus (par quantité)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-right font-medium">Produit</th>
                <th className="pb-2 text-right font-medium">Quantité</th>
                <th className="pb-2 text-right font-medium">Revenu</th>
              </tr>
            </thead>
            <tbody>
              {bestSelling.map((product) => (
                <tr key={product.product_id} className="border-b">
                  <td className="py-2">{product.product_name}</td>
                  <td className="py-2">{product.total_quantity_sold}</td>
                  <td className="py-2">
                    {formatCurrency(Number(product.total_revenue))}
                  </td>
                </tr>
              ))}
              {bestSelling.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground">
                    Aucune donnée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue per Product */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Produits les plus rentables (top 10)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-right font-medium">Produit</th>
                <th className="pb-2 text-right font-medium">Quantité</th>
                <th className="pb-2 text-right font-medium">Revenu</th>
              </tr>
            </thead>
            <tbody>
              {revenuePerProduct.map((product) => (
                <tr key={product.product_id} className="border-b">
                  <td className="py-2">{product.product_name}</td>
                  <td className="py-2">{product.total_quantity_sold}</td>
                  <td className="py-2 font-semibold">
                    {formatCurrency(Number(product.total_revenue))}
                  </td>
                </tr>
              ))}
              {revenuePerProduct.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground">
                    Aucune donnée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
