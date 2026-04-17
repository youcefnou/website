'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateDeliveryPrice } from '@/app/actions/admin';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';

interface Wilaya {
  id: number;
  name: string;
  delivery_price: number;
  created_at: string;
  updated_at: string;
}

interface DeliveryPricesManagerProps {
  wilayas: Wilaya[];
}

export function DeliveryPricesManager({ wilayas }: DeliveryPricesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [prices, setPrices] = useState<Record<number, string>>(
    wilayas.reduce((acc, wilaya) => {
      acc[wilaya.id] = wilaya.delivery_price.toString();
      return acc;
    }, {} as Record<number, string>)
  );
  const [savingId, setSavingId] = useState<number | null>(null);

  // Filter wilayas based on search query
  const filteredWilayas = wilayas.filter(
    (wilaya) =>
      wilaya.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wilaya.id.toString().includes(searchQuery)
  );

  const handlePriceChange = (wilayaId: number, value: string) => {
    // Allow only numbers and decimal point (but not starting with decimal)
    if (value === '' || /^(\d+(\.\d{0,2})?|)$/.test(value)) {
      setPrices((prev) => ({ ...prev, [wilayaId]: value }));
    }
  };

  const handleSave = async (wilayaId: number) => {
    const priceString = prices[wilayaId];
    const price = parseFloat(priceString);

    // Validate price
    if (priceString === '' || isNaN(price) || price < 0) {
      toast({
        title: 'Erreur',
        description: 'Le prix doit être un nombre positif ou nul',
        variant: 'destructive',
      });
      return;
    }

    setSavingId(wilayaId);

    try {
      await updateDeliveryPrice(wilayaId, price);
      toast({
        title: 'Succès',
        description: 'Prix de livraison mis à jour avec succès',
      });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update delivery price:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour du prix de livraison',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = (wilayaId: number) => {
    const wilaya = wilayas.find((w) => w.id === wilayaId);
    if (wilaya) {
      setPrices((prev) => ({
        ...prev,
        [wilayaId]: wilaya.delivery_price.toString(),
      }));
    }
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Search Box */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Rechercher par nom ou numéro de wilaya..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-semibold">Wilaya</th>
              <th className="text-left p-4 font-semibold">Nom</th>
              <th className="text-left p-4 font-semibold">Prix de livraison</th>
              <th className="text-left p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWilayas.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-8 text-muted-foreground">
                  Aucune wilaya trouvée
                </td>
              </tr>
            ) : (
              filteredWilayas.map((wilaya) => {
                const isEditing = editingId === wilaya.id;
                const isSaving = savingId === wilaya.id;

                return (
                  <tr key={wilaya.id} className="border-t hover:bg-muted/30">
                    <td className="p-4 font-medium">
                      {wilaya.id.toString().padStart(2, '0')}
                    </td>
                    <td className="p-4">{wilaya.name}</td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={prices[wilaya.id]}
                            onChange={(e) =>
                              handlePriceChange(wilaya.id, e.target.value)
                            }
                            className="w-32"
                            disabled={isSaving}
                            autoFocus
                          />
                          <span className="text-sm text-muted-foreground">DA</span>
                        </div>
                      ) : (
                        <span>
                          {prices[wilaya.id] && !isNaN(parseFloat(prices[wilaya.id]))
                            ? parseFloat(prices[wilaya.id]).toLocaleString('fr-DZ', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '0.00'}{' '}
                          DA
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(wilaya.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enregistrement...
                              </>
                            ) : (
                              'Sauvegarder'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(wilaya.id)}
                            disabled={isSaving}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(wilaya.id)}
                          disabled={savingId !== null}
                        >
                          Modifier
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="p-4 border-t text-sm text-muted-foreground">
          {filteredWilayas.length} wilaya(s) trouvée(s)
        </div>
      )}
    </div>
  );
}
