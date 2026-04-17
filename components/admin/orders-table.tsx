'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Download, User, UserX } from 'lucide-react';
import ExcelJS from 'exceljs';
import { AdminOrderStatus, normalizeStatus } from '@/lib/orders/status';

type OrderStatus = AdminOrderStatus | 'delivered' | 'canceled';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  shipped: 'Expédiée',
  cancelled: 'Annulée',
  delivered: 'Livrée',
  canceled: 'Annulée',
};

type ExportRow = {
  orderId: string;
  date: string;
  status: string;
  client: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  produit: string;
  variante: string;
  modele: string;
  quantity: number;
  unitPrice: number;
  itemSubtotal: number;
  deliveryPrice: number;
  orderTotal: number;
};

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  unit_price: number;
  product_name: string;
  sub_product_name: string | null;
  phone_model: string;
}

interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total: number;
  subtotal: number;
  delivery_price: number;
  created_at: string;
  address: string;
  commune: string;
  full_name: string;
  phone: string;
  users?: { name: string; phone: string } | null;
  delivery_wilayas?: { name: string } | null;
  order_items?: OrderItem[];
}

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [filterStatus, setFilterStatus] = useState<AdminOrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const itemsPerPage = 20;

  // Filter orders by status
  const filteredOrders = useMemo(
    () =>
      filterStatus === 'all'
        ? orders
        : orders.filter((order) => normalizeStatus(order.status) === filterStatus),
    [orders, filterStatus]
  );

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

  // Toggle order selection
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  // Select all orders (filtered)
  const toggleSelectAll = useCallback(() => {
    const filteredIds = filteredOrders.map((o) => o.id);
    const allSelected = filteredIds.every((id) => selectedOrders.has(id));
    
    if (allSelected) {
      setSelectedOrders((prev) => {
        const newSet = new Set(prev);
        filteredIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedOrders((prev) => {
        const newSet = new Set(prev);
        filteredIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  }, [filteredOrders, selectedOrders]);

  const buildExportRows = useCallback((ordersToExport: Order[]): ExportRow[] => {
    const rows: ExportRow[] = [];

    for (const order of ordersToExport) {
      const clientName = order.full_name || order.users?.name || '';
      const clientPhone = order.phone || order.users?.phone || '';
      const wilaya = order.delivery_wilayas?.name || '';
      const commune = order.commune || '';
      const address = order.address || '';
      const orderDate = format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr });
      const status = STATUS_LABELS[normalizeStatus(order.status)] || order.status;
      const orderId = order.id.substring(0, 8).toUpperCase();

      if (!order.order_items?.length) {
        // Include order even without items so we don't lose it in export
        rows.push({
          orderId,
          date: orderDate,
          status,
          client: clientName,
          phone: clientPhone,
          wilaya,
          commune,
          address,
          produit: '(aucun article)',
          variante: '',
          modele: '',
          quantity: 0,
          unitPrice: 0,
          itemSubtotal: 0,
          deliveryPrice: Number(order.delivery_price ?? 0),
          orderTotal: Number(order.total ?? 0),
        });
        continue;
      }

      for (const item of order.order_items) {
        const rawUnitPrice = item.unit_price ?? item.price_at_order;
        const unitPrice =
          rawUnitPrice !== undefined && rawUnitPrice !== null
            ? Number(rawUnitPrice)
            : 0;
        const quantity = Number(item.quantity ?? 0);

        rows.push({
          orderId,
          date: orderDate,
          status,
          client: clientName,
          phone: clientPhone,
          wilaya,
          commune,
          address,
          produit: item.product_name || 'Produit',
          variante: item.sub_product_name || '',
          modele: item.phone_model || '',
          quantity,
          unitPrice,
          itemSubtotal: quantity * unitPrice,
          deliveryPrice: Number(order.delivery_price ?? 0),
          orderTotal: Number(order.total ?? 0),
        });
      }
    }

    return rows;
  }, []);

  const HEADERS = [
    'N° Commande',
    'Date',
    'Statut',
    'Client',
    'Téléphone',
    'Wilaya',
    'Commune',
    'Adresse',
    'Produit',
    'Variante',
    'Modèle',
    'Qté',
    'Prix unitaire',
    'Sous-total article',
    'Livraison',
    'Total commande',
  ];

  const escapeForCSV = useCallback((value: string | number): string => {
    const str = String(value ?? '');
    const needsQuotes =
      str.includes(';') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r') ||
      /^\s|\s$/.test(str);

    if (needsQuotes) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }, []);

  const downloadCSV = useCallback((rows: ExportRow[]) => {
    const csvContent = [
      HEADERS.join(';'),
      ...rows.map((row) =>
        [
          escapeForCSV(row.orderId),
          escapeForCSV(row.date),
          escapeForCSV(row.status),
          escapeForCSV(row.client),
          escapeForCSV(row.phone),
          escapeForCSV(row.wilaya),
          escapeForCSV(row.commune),
          escapeForCSV(row.address),
          escapeForCSV(row.produit),
          escapeForCSV(row.variante),
          escapeForCSV(row.modele),
          escapeForCSV(row.quantity),
          escapeForCSV(row.unitPrice),
          escapeForCSV(row.itemSubtotal),
          escapeForCSV(row.deliveryPrice),
          escapeForCSV(row.orderTotal),
        ].join(';')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `commandes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [escapeForCSV]);

  const downloadXLSX = useCallback(async (rows: ExportRow[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Commandes');

    // Add headers with styling
    const headerRow = worksheet.addRow(HEADERS);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    // Add data rows
    rows.forEach((row) => {
      worksheet.addRow([
        row.orderId,
        row.date,
        row.status,
        row.client,
        row.phone,
        row.wilaya,
        row.commune,
        row.address,
        row.produit,
        row.variante,
        row.modele,
        row.quantity,
        row.unitPrice,
        row.itemSubtotal,
        row.deliveryPrice,
        row.orderTotal,
      ]);
    });

    // Set column widths
    const colWidths = [14, 18, 14, 22, 16, 16, 16, 30, 24, 18, 18, 6, 14, 16, 14, 16];
    colWidths.forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });

    // Format number columns
    [12, 13, 14, 15, 16].forEach((col) => {
      worksheet.getColumn(col).numFmt = '#,##0';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `commandes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportOrders = useCallback(
    async (fmt: 'csv' | 'xlsx') => {
      const ordersToExport =
        selectedOrders.size > 0
          ? orders.filter((o) => selectedOrders.has(o.id))
          : filteredOrders;

      if (ordersToExport.length === 0) {
        toast({
          title: 'Aucune commande à exporter',
          description: 'Sélectionnez des commandes ou vérifiez les filtres appliqués.',
          variant: 'destructive',
        });
        return;
      }

      const rows = buildExportRows(ordersToExport);

      if (rows.length === 0) {
        toast({
          title: 'Aucune ligne à exporter',
          description: "Les commandes sélectionnées ne contiennent pas d'articles.",
          variant: 'destructive',
        });
        return;
      }

      if (fmt === 'csv') {
        downloadCSV(rows);
        return;
      }

      await downloadXLSX(rows);
    },
    [buildExportRows, downloadCSV, downloadXLSX, filteredOrders, orders, selectedOrders]
  );

  // Paginate orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Filter and Export buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => {
              setFilterStatus('all');
              setCurrentPage(1);
            }}
            size="sm"
          >
            Tous ({orders.length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => {
              setFilterStatus('pending');
              setCurrentPage(1);
            }}
            size="sm"
          >
            En attente ({orders.filter((o) => normalizeStatus(o.status) === 'pending').length})
          </Button>
          <Button
            variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
            onClick={() => {
              setFilterStatus('confirmed');
              setCurrentPage(1);
            }}
            size="sm"
          >
            Confirmé ({orders.filter((o) => normalizeStatus(o.status) === 'confirmed').length})
          </Button>
          <Button
            variant={filterStatus === 'shipped' ? 'default' : 'outline'}
            onClick={() => {
              setFilterStatus('shipped');
              setCurrentPage(1);
            }}
            size="sm"
          >
            Expédiée ({orders.filter((o) => normalizeStatus(o.status) === 'shipped').length})
          </Button>
          <Button
            variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
            onClick={() => {
              setFilterStatus('cancelled');
              setCurrentPage(1);
            }}
            size="sm"
          >
            Annulée ({orders.filter((o) => normalizeStatus(o.status) === 'cancelled').length})
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportOrders('csv')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV ({selectedOrders.size > 0 ? selectedOrders.size : 'Tous'})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportOrders('xlsx')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel ({selectedOrders.size > 0 ? selectedOrders.size : 'Tous'})
          </Button>
        </div>
      </div>

      {/* Selection info */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
          {selectedOrders.size} commande(s) sélectionnée(s)
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedOrders(new Set())}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            Tout désélectionner
          </Button>
        </div>
      )}

      {/* Orders table */}
      {paginatedOrders.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <p className="text-gray-500">Aucune commande</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 w-12">
                    <Checkbox
                      checked={
                        filteredOrders.length > 0 &&
                        filteredOrders.every((o) => selectedOrders.has(o.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Sélectionner toutes les commandes"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Commande
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Téléphone
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Wilaya
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Date
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedOrders.has(order.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                        aria-label={`Sélectionner commande ${order.id.substring(0, 8)}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {order.id.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {order.user_id ? (
                          <User className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <UserX className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span>{order.full_name || order.users?.name || 'Non renseigné'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.phone || order.users?.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.delivery_wilayas?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(order.created_at), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages} ({filteredOrders.length}{' '}
            commande(s))
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
