'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { getUserOrders } from '@/app/actions/orders';
import { formatCurrency } from '@/lib/formatCurrency';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  sellable_items: {
    id: string;
    sku: string;
    description: string | null;
    image_url: string | null;
    products: {
      id: string;
      name: string;
    };
  };
}

interface Order {
  id: string;
  full_name: string;
  phone: string;
  commune: string;
  address: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'canceled';
  delivery_price: number;
  subtotal: number;
  total: number;
  cod_only: boolean;
  created_at: string;
  order_items: OrderItem[];
  delivery_wilayas: {
    id: number;
    name: string;
  };
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const router = useRouter();
  const t = useTranslations('ordersPage');
  const locale = useLocale();
  const { user, isLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (isLoading) {
        return;
      }

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const data = await getUserOrders();
        setOrders(data as Order[]);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [isLoading, user, router]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p className="text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (selectedOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => setSelectedOrder(null)}
          variant="outline"
          className="mb-6"
        >
          ← {t('backToOrders')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('orderNumber')}: {selectedOrder.id.slice(0, 8)}</span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  STATUS_COLORS[selectedOrder.status]
                }`}
              >
                {t(`status.${selectedOrder.status}`)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Items */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">{t('products')}</h3>
              <div className="space-y-4">
                {selectedOrder.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {item.sellable_items.image_url ? (
                        <Image
                          src={item.sellable_items.image_url}
                          alt={item.sellable_items.products.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          {t('noImage')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {item.sellable_items.products.name}
                      </h4>
                      {item.sellable_items.description && (
                        <p className="text-sm text-gray-600">
                          {item.sellable_items.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {t('productCode')}: {item.sellable_items.sku}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {t('quantity')}: {item.quantity}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(item.price_at_order)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">{t('deliveryInfo')}</h3>
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('fullName')}:</span>
                  <span className="font-medium">{selectedOrder.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('phone')}:</span>
                  <span className="font-medium">{selectedOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('wilaya')}:</span>
                  <span className="font-medium">
                    {selectedOrder.delivery_wilayas.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('commune')}:</span>
                  <span className="font-medium">{selectedOrder.commune}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('address')}:</span>
                  <span className="font-medium text-left">
                    {selectedOrder.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">{t('orderSummary')}</h3>
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('subtotal')}:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('deliveryFee')}:</span>
                  <span>{formatCurrency(selectedOrder.delivery_price)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>{t('total')}:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {t('paymentMethod')}: {t('cashOnDelivery')}
                </div>
                <div className="text-sm text-gray-500">
                  {t('orderDate')}: {new Date(selectedOrder.created_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-lg text-gray-600">{t('empty')}</p>
            <Link href="/products">
              <Button>{t('browseProducts')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedOrder(order)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {t('order')} #{order.id.slice(0, 8)}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          STATUS_COLORS[order.status]
                        }`}
                      >
                        {t(`status.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('productCount', { count: order.order_items.length })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatCurrency(order.total)}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      {t('viewDetails')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
