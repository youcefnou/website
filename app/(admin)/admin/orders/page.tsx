import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { getAllOrders } from '@/app/actions/admin';
import { OrdersTable } from '@/components/admin/orders-table';
import { ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const orders = await getAllOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-lg">
          <ShoppingBag className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Gestion des Commandes</h2>
          <p className="text-muted-foreground mt-1">
            Gérer toutes les commandes clients
          </p>
        </div>
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}
