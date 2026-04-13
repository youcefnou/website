'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { Button } from '@/components/ui/button';
import { updateOrderStatus, deleteOrder } from '@/app/actions/admin';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { ArrowLeft, User, UserX, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdminOrderStatus, normalizeStatus } from '@/lib/orders/status';

type OrderStatus = AdminOrderStatus | 'delivered' | 'canceled';

const statusLabels: Record<AdminOrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  shipped: 'Expédiée',
  cancelled: 'Annulée',
};

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  unit_price: number;
  product_name: string;
  sub_product_name: string | null;
  phone_model: string;
  sellable_items: {
    sku: string;
    products: {
      name: string;
    };
  } | null;
}

interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total: number;
  delivery_price: number;
  created_at: string;
  address: string;
  commune: string;
  full_name: string;
  phone: string;
  users?: { name: string; phone: string } | null;
  delivery_wilayas?: { name: string } | null;
  order_items: OrderItem[];
}

interface OrderDetailsProps {
  order: Order;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<AdminOrderStatus>(
    normalizeStatus(order.status)
  );
  const [selectedStatus, setSelectedStatus] = useState<AdminOrderStatus>(
    normalizeStatus(order.status)
  );
  const [error, setError] = useState('');

  // Sync state when order prop changes (e.g., after router.refresh())
  useEffect(() => {
    const normalized = normalizeStatus(order.status);
    setCurrentStatus(normalized);
    setSelectedStatus(normalized);
  }, [order.status]);

  // Memoize currency formatter
  const formatPrice = useMemo(
    () =>
      new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        minimumFractionDigits: 0,
      }).format,
    []
  );

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la commande #${order.id.substring(0, 8)} ?\n\nCette action est irréversible.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    setError('');

    try {
      await deleteOrder(order.id);
      toast({
        title: 'Commande supprimée',
        description: `La commande #${order.id.substring(0, 8)} a été supprimée.`,
      });
      router.push('/admin/orders');
    } catch (err) {
      console.error('Failed to delete order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de la suppression de la commande';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) return;

    setIsUpdating(true);
    setError('');

    try {
      const result = await updateOrderStatus(order.id, selectedStatus);
      if (!result?.status) {
        throw new Error('Aucun statut retourné');
      }
      const nextStatus = normalizeStatus(result.status);
      setCurrentStatus(nextStatus);
      toast({
        title: 'Statut mis à jour',
        description: `Nouveau statut : ${statusLabels[nextStatus] ?? nextStatus}`,
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to update status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de la mise à jour du statut';
      setError(errorMessage);
      setSelectedStatus(currentStatus);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate subtotal
  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.price_at_order * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">
              Commande #{order.id.substring(0, 8)}
            </h2>
            <p className="text-sm text-gray-600">
              Créée le{' '}
              {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', {
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={currentStatus} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white rounded-lg border">
            <div className="border-b px-6 py-4">
              <h3 className="font-semibold">Articles commandés</h3>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left pb-3 text-sm font-medium text-gray-700">
                      Produit
                    </th>
                    <th className="text-left pb-3 text-sm font-medium text-gray-700">
                      Variante
                    </th>
                    <th className="text-left pb-3 text-sm font-medium text-gray-700">
                      Modèle
                    </th>
                    <th className="text-center pb-3 text-sm font-medium text-gray-700">
                      Qté
                    </th>
                    <th className="text-right pb-3 text-sm font-medium text-gray-700">
                      Prix unitaire
                    </th>
                    <th className="text-right pb-3 text-sm font-medium text-gray-700">
                      Sous-total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-sm">
                        <div>
                          <p className="font-medium">
                            {item.product_name || item.sellable_items?.products?.name || 'Produit'}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {item.sellable_items?.sku || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        <span className="text-gray-700">
                          {item.sub_product_name || '-'}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        <span className="text-gray-700">
                          {item.phone_model || '-'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-center">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-sm text-right">
                        {formatPrice(item.price_at_order)}
                      </td>
                      <td className="py-3 text-sm text-right font-medium">
                        {formatPrice(item.price_at_order * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Résumé de la commande</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Livraison</span>
                <span>{formatPrice(order.delivery_price)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status update */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Mettre à jour le statut</h3>
            <div className="space-y-4">
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as AdminOrderStatus)
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="shipped">Expédiée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdating || selectedStatus === currentStatus}
                className="w-full"
              >
                {isUpdating ? 'Mise à jour...' : 'Mettre à jour le statut'}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Suppression...' : 'Supprimer la commande'}
              </Button>
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Informations client</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Type</p>
                <div className="flex items-center gap-2 font-medium">
                  {order.user_id ? (
                    <>
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">Utilisateur</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Invité</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-600">Nom</p>
                <p className="font-medium">{order.full_name || order.users?.name || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-gray-600">Téléphone</p>
                <p className="font-medium">{order.phone || order.users?.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Informations de livraison</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Wilaya</p>
                <p className="font-medium">
                  {order.delivery_wilayas?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Commune</p>
                <p className="font-medium">{order.commune || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Adresse</p>
                <p className="font-medium">{order.address || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
