'use client';

import { useState, useEffect } from 'react';
import { getUserOrders } from '@/app/actions/account';
import { OrderCard } from '@/components/account/order-card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import Link from 'next/link';

type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'canceled';

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  order_items?: Array<{ quantity: number }>;
}

export default function OrdersPage() {
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
    { value: 'all' as const, label: 'Tous' },
    { value: 'pending' as const, label: 'En attente' },
    { value: 'confirmed' as const, label: 'Confirmé' },
    { value: 'delivered' as const, label: 'Livré' },
    { value: 'canceled' as const, label: 'Annulé' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Mes Commandes</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mes Commandes</h1>
        <p className="text-muted-foreground mt-1">
          {orders.length} commande{orders.length > 1 ? 's' : ''} au total
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
              ? 'Aucune commande'
              : `Aucune commande ${filterButtons.find((b) => b.value === filter)?.label.toLowerCase()}`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? "Vous n'avez pas encore passé de commande."
              : "Vous n'avez pas de commandes avec ce statut."}
          </p>
          {filter === 'all' && (
            <Link href="/products">
              <Button>Découvrir nos produits</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
