import Link from "next/link";
import type { CategoryCard } from "@/lib/types/custom-settings";
import { getIconComponent } from "@/lib/utils/icon-utils";

interface CategoryCardsProps {
  cards?: CategoryCard[];
}

export function CategoryCards({ cards: propCards }: CategoryCardsProps) {
  // Filter only enabled cards and sort by order
  const cards = (propCards || [])
    .filter(card => card.enabled)
    .sort((a, b) => a.order - b.order);

  // Show message if no cards are available
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucune catégorie configurée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        // Handle both string icon names and direct component references
        const IconComponent = typeof card.icon === 'string' 
          ? getIconComponent(card.icon)
          : card.icon;
        
        // Build link: if category_id exists, use it; otherwise fallback to /products
        const href = card.category_id 
          ? `/products?category=${card.category_id}` 
          : "/products";

        return (
          <Link
            key={`${card.id}`}
            href={href}
            className="group"
          >
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition duration-300 border border-gray-200 hover:border-gray-300">
              <div className={`${card.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition`}>
                {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
              </div>
              <h3 className="font-semibold text-gray-900">{card.name}</h3>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
