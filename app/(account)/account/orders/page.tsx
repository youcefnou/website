'use client';

import { useState, useEffect } from 'react';
import { getUserOrders } from '@/app/actions/account';
import { OrderCard } from '@/components/account/order-card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'canceled';

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  order_items?: Array<{ quantity: number }>;
}

export default function OrdersPage() {
  const t = useTranslations('ordersPage');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === filter));
    }
  }, [filter, orders]);

  const loadOrders = async () => {
    try {
      const data = await getUserOrders();
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterButtons = [
    { value: 'all' as const, label: t('filters.all') },
    { value: 'pending' as const, label: t('status.pending') },
    { value: 'confirmed' as const, label: t('status.confirmed') },
    { value: 'delivered' as const, label: t('status.delivered') },
    { value: 'canceled' as const, label: t('status.canceled') },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('productCount', { count: orders.length })}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filter === btn.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-background rounded-lg border">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {filter === 'all'
              ? t('empty')
              : t('emptyForStatus', { status: filterButtons.find((b) => b.value === filter)?.label.toLowerCase() ?? '' })}
          </h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? t('emptyDescription')
              : t('emptyDescriptionForStatus')}
          </p>
          {filter === 'all' && (
            <Link href="/products">
              <Button>{t('browseProducts')}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
