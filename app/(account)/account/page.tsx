import { getCurrentUserInfo, getAccountStats, getUserOrders } from '@/app/actions/account';
import { StatsCard } from '@/components/account/stats-card';
import { OrderCard } from '@/components/account/order-card';
import { ShoppingBag, Package, Clock, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr, arDZ } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatCurrency';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function AccountPage() {
  const t = await getTranslations('accountDashboard');
  const locale = await getLocale();
  const dateLocale = locale === 'ar' ? arDZ : locale === 'en' ? enUS : fr;
  const [userInfo, stats, orders] = await Promise.all([
    getCurrentUserInfo(),
    getAccountStats(),
    getUserOrders(),
  ]);

  // Get recent orders (last 5)
  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">{t('welcome', { name: userInfo?.name || t('userFallback') })}</h1>
        <p className="text-muted-foreground mt-1">
          {t('memberSince')}{' '}
          {userInfo?.created_at
            ? formatDistanceToNow(new Date(userInfo.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })
            : t('recently')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('stats.totalOrders')}
          value={stats.totalOrders}
          icon={ShoppingBag}
          iconClassName="text-blue-500"
        />
        <StatsCard
          title={t('stats.totalSpent')}
          value={formatCurrency(stats.totalSpent, true, locale)}
          icon={Package}
          iconClassName="text-green-500"
        />
        <StatsCard
          title={t('stats.pending')}
          value={stats.pendingOrders}
          description={t('stats.pendingDescription')}
          icon={Clock}
          iconClassName="text-yellow-500"
        />
        <StatsCard
          title={t('stats.delivered')}
          value={stats.deliveredOrders}
          description={t('stats.deliveredDescription')}
          icon={CheckCircle}
          iconClassName="text-emerald-500"
        />
      </div>

      {/* Recent Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{t('recentOrders')}</h2>
          {orders && orders.length > 5 && (
            <Link href="/account/orders">
              <Button variant="outline">{t('viewAllOrders')}</Button>
            </Link>
          )}
        </div>

        {recentOrders.length > 0 ? (
          <div className="grid gap-4">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-background rounded-lg border">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('empty.description')}
            </p>
            <Link href="/products">
              <Button>{t('empty.cta')}</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="block">
          <div className="bg-background rounded-lg border p-6 hover:border-primary transition-colors cursor-pointer">
            <Package className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">{t('quickActions.orders.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('quickActions.orders.description')}
            </p>
          </div>
        </Link>
        <Link href="/account/settings" className="block">
          <div className="bg-background rounded-lg border p-6 hover:border-primary transition-colors cursor-pointer">
            <Settings className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">{t('quickActions.profile.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('quickActions.profile.description')}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
