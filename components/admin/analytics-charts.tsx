'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { formatCurrency } from '@/lib/formatCurrency';

interface AnalyticsChartsProps {
  revenuePerCategory: Array<{
    category_id: string;
    category_name: string;
    total_revenue: string;
    order_count: number;
  }>;
  ordersPerWilaya: Array<{
    wilaya_id: number;
    wilaya_name: string;
    total_orders: number;
    total_revenue: string;
  }>;
  deliveryPerformance: {
    pending_orders: number;
    delivered_orders: number;
    total_orders: number;
  };
  funnelView: {
    unique_page_views: number;
    unique_cart_additions: number;
    unique_checkout_starts: number;
    unique_orders_placed: number;
    total_page_views: number;
    total_cart_additions: number;
    total_checkout_starts: number;
    total_orders_placed: number;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsCharts({
  revenuePerCategory,
  ordersPerWilaya,
  deliveryPerformance,
  funnelView,
}: AnalyticsChartsProps) {
  // Prepare data for charts
  const categoryData = revenuePerCategory.map((item) => ({
    name: item.category_name,
    revenue: Number(item.total_revenue),
  }));

  const wilayaData = ordersPerWilaya.map((item) => ({
    name: item.wilaya_name,
    orders: item.total_orders,
  }));

  const deliveryData = [
    { name: 'En attente', value: deliveryPerformance.pending_orders },
    { name: 'Livré', value: deliveryPerformance.delivered_orders },
  ];

  const funnelData = [
    { name: 'Vues de page', value: funnelView.total_page_views },
    { name: 'Ajout au panier', value: funnelView.total_cart_additions },
    { name: 'Paiements', value: funnelView.total_checkout_starts },
    { name: 'Commandes', value: funnelView.total_orders_placed },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Revenue per Category */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Revenus par catégorie</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="revenue" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Orders per Wilaya */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Commandes par wilaya (top 10)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={wilayaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delivery Performance */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Performance de livraison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={deliveryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: { name?: string; percent?: number }) =>
                `${entry.name || ''}: ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {deliveryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">
              {deliveryPerformance.pending_orders}
            </p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {deliveryPerformance.delivered_orders}
            </p>
            <p className="text-sm text-muted-foreground">Livré</p>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Entonnoir de conversion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList
                position="right"
                fill="#000"
                stroke="none"
                dataKey="name"
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Taux de conversion (page → panier):</span>
            <span className="font-semibold">
              {funnelView.total_page_views > 0
                ? ((funnelView.total_cart_additions / funnelView.total_page_views) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
          <div className="flex justify-between">
            <span>Taux de conversion (panier → commande):</span>
            <span className="font-semibold">
              {funnelView.total_cart_additions > 0
                ? ((funnelView.total_orders_placed / funnelView.total_cart_additions) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
