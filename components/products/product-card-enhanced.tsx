"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatCurrency";

interface ProductCardEnhancedProps {
  product: {
    id: string;
    name: string;
    image_url: string;
    price: number;
    category?: { name: string };
    has_variants: boolean;
    sellable_items?: Array<{ stock: number }>;
  };
}

export function ProductCardEnhanced({ product }: ProductCardEnhancedProps) {
  const locale = useLocale();
  const totalStock = product.sellable_items?.reduce((sum, item) => sum + item.stock, 0) || 0;
  const inStock = totalStock > 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#141414] transition-all duration-300 hover:border-[#E8642C]/40 hover:shadow-lg hover:shadow-[#E8642C]/5 hover:-translate-y-0.5">
      {/* Image */}
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-[#1a1a1a]">
          <Image
            src={product.image_url || "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 bg-[#E8642C] text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
              {product.category.name}
            </div>
          )}

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-sm font-medium bg-red-600/80 px-3 py-1 rounded-md">
                Rupture de stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="mb-1.5 sm:mb-2 line-clamp-2 text-sm sm:text-base font-semibold text-gray-100 transition group-hover:text-[#E8642C]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <div>
            <p className="text-base sm:text-xl font-bold text-[#E8642C]">{formatCurrency(product.price, true, locale)}</p>
            {inStock && totalStock < 10 && (
              <p className="text-[10px] sm:text-xs text-gray-500">Plus que {totalStock} en stock</p>
            )}
          </div>

          <Link href={`/product/${product.id}`}>
            <Button 
              size="sm" 
              disabled={!inStock} 
              className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-[#E8642C] hover:bg-[#d45a25] text-white border-0"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Acheter</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
