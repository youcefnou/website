import { Truck, Shield, CreditCard, Headset } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Livraison rapide",
    description: "Livraison en 24-48h partout en Algérie",
  },
  {
    icon: Shield,
    title: "Garantie qualité",
    description: "Produits authentiques garantis",
  },
  {
    icon: CreditCard,
    title: "Paiement sécurisé",
    description: "Paiement à la livraison disponible",
  },
  {
    icon: Headset,
    title: "Support 24/7",
    description: "Notre équipe est toujours là pour vous",
  },
];

export function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.title}
            className="bg-white rounded-lg p-6 text-center border border-gray-200 hover:border-blue-500 transition"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
}
