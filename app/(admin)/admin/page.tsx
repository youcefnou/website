import {
  getAnalytics,
  getBestSellingProducts,
  getRevenuePerProduct,
  getRevenuePerCategory,
  getOrdersPerWilaya,
  getDeliveryPerformance,
  getFunnelView,
} from '@/app/actions/admin';
import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';
import { AnalyticsTables } from '@/components/admin/analytics-tables';
import { formatCurrency } from '@/lib/formatCurrency';
import { Package, ShoppingCart, DollarSign, Users, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  // Fetch all analytics data with error handling
  let analytics = { totalOrders: 0, totalProducts: 0, totalRevenue: 0, totalUsers: 0 };
  let bestSelling: Array<{
    product_id: string;
    product_name: string;
    total_quantity_sold: number;
    total_revenue: string;
  }> = [];
  let revenuePerProduct: Array<{
    product_id: string;
    product_name: string;
    total_quantity_sold: number;
    total_revenue: string;
  }> = [];
  let revenuePerCategory: Array<{
    category_id: string;
    category_name: string;
    total_revenue: string;
    order_count: number;
  }> = [];
  let ordersPerWilaya: Array<{
    wilaya_id: number;
    wilaya_name: string;
    total_orders: number;
    total_revenue: string;
  }> = [];
  let deliveryPerformance = { pending_orders: 0, delivered_orders: 0, total_orders: 0 };
  let funnelView = { 
    unique_page_views: 0, 
    unique_cart_additions: 0, 
    unique_checkout_starts: 0, 
    unique_orders_placed: 0,
    total_page_views: 0,
    total_cart_additions: 0,
    total_checkout_starts: 0,
    total_orders_placed: 0
  };

  try {
    [
      analytics,
      bestSelling,
      revenuePerProduct,
      revenuePerCategory,
      ordersPerWilaya,
      deliveryPerformance,
      funnelView,
    ] = await Promise.all([
      getAnalytics(),
      getBestSellingProducts(),
      getRevenuePerProduct(),
      getRevenuePerCategory(),
      getOrdersPerWilaya(),
      getDeliveryPerformance(),
      getFunnelView(),
    ]);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Continue with default values
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Tableau de bord</h2>
        <p className="text-muted-foreground mt-1">
          Bienvenue sur le panneau d&apos;administration
        </p>
      </div>

      {/* Key Metrics - Enhanced */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total des commandes
            </h3>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{analytics.totalOrders}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>Actif</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total des produits
            </h3>
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{analytics.totalProducts}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>En stock</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Revenu total
            </h3>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(analytics.totalRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+12% ce mois</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Utilisateurs actifs
            </h3>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">{analytics.totalUsers}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+5% ce mois</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts
        revenuePerCategory={revenuePerCategory}
        ordersPerWilaya={ordersPerWilaya}
        deliveryPerformance={deliveryPerformance}
        funnelView={funnelView}
      />

      {/* Tables */}
      <AnalyticsTables
        bestSelling={bestSelling}
        revenuePerProduct={revenuePerProduct}
      />
    </div>
  );
}
