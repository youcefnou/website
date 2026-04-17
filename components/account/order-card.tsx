'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { OrderStatusBadge } from './order-status-badge';
import { useLocale, useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr, arDZ } from 'date-fns/locale';
import { Package, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface OrderCardProps {
  order: {
    id: string;
    created_at: string;
    status: 'pending' | 'confirmed' | 'delivered' | 'canceled';
    total: number;
    order_items?: Array<{ quantity: number }>;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const t = useTranslations('ordersPage');
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? arDZ : locale === 'en' ? enUS : fr;
  const itemCount = order.order_items?.reduce(
    (sum, item) => sum + item.quantity,
    0
  ) || 0;

  return (
    <Link href={`/account/orders/${order.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(order.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatCurrency(order.total, true, locale)}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('productCount', { count: itemCount })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
