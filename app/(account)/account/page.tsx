import { getCurrentUserInfo, getAccountStats, getUserOrders } from '@/app/actions/account';
import { StatsCard } from '@/components/account/stats-card';
import { OrderCard } from '@/components/account/order-card';
import { ShoppingBag, Package, Clock, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatCurrency';

export default async function AccountPage() {
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
        <h1 className="text-3xl font-bold">Bienvenue, {userInfo?.name || 'Utilisateur'}</h1>
        <p className="text-muted-foreground mt-1">
          Membre depuis{' '}
          {userInfo?.created_at
            ? formatDistanceToNow(new Date(userInfo.created_at), {
                addSuffix: true,
                locale: fr,
              })
            : 'récemment'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total des commandes"
          value={stats.totalOrders}
          icon={ShoppingBag}
          iconClassName="text-blue-500"
        />
        <StatsCard
          title="Total dépensé"
          value={formatCurrency(stats.totalSpent)}
          icon={Package}
          iconClassName="text-green-500"
        />
        <StatsCard
          title="En attente"
          value={stats.pendingOrders}
          description="Commandes en cours"
          icon={Clock}
          iconClassName="text-yellow-500"
        />
        <StatsCard
          title="Livrées"
          value={stats.deliveredOrders}
          description="Commandes terminées"
          icon={CheckCircle}
          iconClassName="text-emerald-500"
        />
      </div>

      {/* Recent Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Commandes récentes</h2>
          {orders && orders.length > 5 && (
            <Link href="/account/orders">
              <Button variant="outline">Voir toutes les commandes</Button>
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
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground mb-4">
              Vous n&apos;avez pas encore passé de commande.
            </p>
            <Link href="/products">
              <Button>Découvrir nos produits</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="block">
          <div className="bg-background rounded-lg border p-6 hover:border-primary transition-colors cursor-pointer">
            <Package className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Voir toutes les commandes</h3>
            <p className="text-sm text-muted-foreground">
              Consultez l&apos;historique complet de vos commandes
            </p>
          </div>
        </Link>
        <Link href="/account/settings" className="block">
          <div className="bg-background rounded-lg border p-6 hover:border-primary transition-colors cursor-pointer">
            <Settings className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Modifier mon profil</h3>
            <p className="text-sm text-muted-foreground">
              Mettez à jour vos informations personnelles
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
