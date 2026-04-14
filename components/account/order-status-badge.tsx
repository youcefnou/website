'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { AdminOrderStatus, normalizeStatus } from '@/lib/orders/status';

type OrderStatus = AdminOrderStatus | 'delivered' | 'canceled';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<
  AdminOrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  pending: {
    label: 'En attente',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-700 bg-yellow-50',
  },
  confirmed: {
    label: 'Confirmé',
    variant: 'default',
    className: 'bg-blue-500 text-white',
  },
  shipped: {
    label: 'Expédiée',
    variant: 'default',
    className: 'bg-green-500 text-white',
  },
  cancelled: {
    label: 'Annulée',
    variant: 'destructive',
    className: 'bg-red-500 text-white',
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const t = useTranslations('ordersPage.status');
  const normalized = normalizeStatus(status);
  const config = statusConfig[normalized];
  const label = t(
    normalized === 'cancelled' ? 'canceled' : normalized === 'shipped' ? 'delivered' : normalized
  );

  return (
    <Badge variant={config.variant} className={config.className}>
      {label}
    </Badge>
  );
}
