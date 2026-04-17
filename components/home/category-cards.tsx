import Link from "next/link";
import type { CategoryCard } from "@/lib/types/custom-settings";
import { getIconComponent } from "@/lib/utils/icon-utils";

interface CategoryCardsProps {
  cards?: CategoryCard[];
}

export function CategoryCards({ cards: propCards }: CategoryCardsProps) {
  const cards = (propCards || [])
    .filter(card => card.enabled)
    .sort((a, b) => a.order - b.order);

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune catégorie configurée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => {
        const IconComponent = typeof card.icon === 'string' 
          ? getIconComponent(card.icon)
          : card.icon;
        
        const href = card.category_id 
          ? `/products?category=${card.category_id}` 
          : "/products";

        return (
          <Link
            key={`${card.id}`}
            href={href}
            className="group"
          >
            <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-5 border border-[#2a2a2a] hover:border-[#E8642C]/50 transition-all duration-300 hover:bg-[#1e1e1e] hover:shadow-lg hover:shadow-[#E8642C]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#E8642C]/10 flex items-center justify-center group-hover:bg-[#E8642C]/20 transition-colors flex-shrink-0">
                  {IconComponent && <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-[#E8642C]" />}
                </div>
                <h3 className="font-medium text-sm md:text-base text-gray-200 group-hover:text-white transition-colors leading-tight">
                  {card.name}
                </h3>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
