import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { getAllDeliveryWilayas } from '@/app/actions/admin';
import { DeliveryPricesManager } from '@/components/admin/delivery-prices-manager';

export const dynamic = 'force-dynamic';

export default async function DeliveryPricesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const wilayas = await getAllDeliveryWilayas();

  return (
    <div className="space-y-6" dir="ltr">
      <div>
        <h2 className="text-2xl font-bold">Prix de livraison</h2>
        <p className="text-muted-foreground">
          Gérer les prix de livraison pour les 58 wilayas d&apos;Algérie
        </p>
      </div>

      <DeliveryPricesManager wilayas={wilayas} />
    </div>
  );
}
