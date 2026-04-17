import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { getAllOrders } from '@/app/actions/admin';
import { OrderDetails } from '@/components/admin/order-details';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const { id } = await params;
  const orders = await getAllOrders();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <OrderDetails order={order} />
    </div>
  );
}
