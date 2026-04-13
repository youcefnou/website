import { getOrderDetails } from '@/app/actions/account';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Phone, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/formatCurrency';

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  sellable_items?: {
    image_url?: string;
    description?: string;
    products?: {
      name?: string;
    };
  };
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  
  let order;
  try {
    order = await getOrderDetails(id);
  } catch (error) {
    console.error('Error loading order:', error);
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Commande #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">
            Passée le {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articles commandés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items?.map((item: OrderItem) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-lg border overflow-hidden bg-muted">
                    {item.sellable_items?.image_url ? (
                      <Image
                        src={item.sellable_items.image_url}
                        alt={item.sellable_items.products?.name || 'Product'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {item.sellable_items?.products?.name || 'Produit'}
                    </h4>
                    {item.sellable_items?.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.sellable_items.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        Quantité: {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(item.price_at_order)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{formatCurrency(order.delivery_price)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="pt-2 text-sm text-muted-foreground">
                Paiement à la livraison (COD)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Delivery Info */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">{order.full_name}</p>
              <p>{order.address}</p>
              <p>{order.commune}</p>
              <p>{order.delivery_wilayas?.name || `Wilaya ${order.wilaya_id}`}</p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.phone}</p>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">N° de commande:</span>
                <p className="font-mono">{order.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date de commande:</span>
                <p>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Statut:</span>
                <div className="mt-1">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
