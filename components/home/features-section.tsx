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
    title: "Paiement à la livraison",
    description: "Paiement sécurisé à la réception",
  },
  {
    icon: Headset,
    title: "Support 24/7",
    description: "Notre équipe est toujours là pour vous",
  },
];

const badges = [
  { icon: Shield, text: "Produits authentiques" },
  { icon: Truck, text: "Livraison partout en Algérie" },
  { icon: CreditCard, text: "Paiement à la livraison" },
];

export function FeaturesSection() {
  return (
    <div className="space-y-8">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-[#1a1a1a] rounded-xl p-5 md:p-6 border border-[#2a2a2a] hover:border-[#E8642C]/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#E8642C]/10 flex items-center justify-center mb-4 group-hover:bg-[#E8642C]/20 transition-colors">
                <Icon className="w-6 h-6 text-[#E8642C]" />
              </div>
              <h3 className="font-semibold text-white mb-1.5">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.text}
              className="flex items-center gap-3 bg-[#141414] rounded-lg px-4 py-3 border border-[#222]"
            >
              <Icon className="w-4 h-4 text-[#E8642C] flex-shrink-0" />
              <span className="text-sm text-gray-300">{badge.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
