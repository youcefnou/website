"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const totalStock = product.sellable_items?.reduce((sum, item) => sum + item.stock, 0) || 0;
  const inStock = totalStock > 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      {/* Image */}
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <Image
            src={product.image_url || "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Stock Badge - Hidden for out of stock items per requirements */}
          
          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {product.category.name}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 transition group-hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-2xl font-bold text-blue-700">{product.price} DZD</p>
            {inStock && totalStock < 10 && (
              <p className="text-xs text-gray-500">Plus que {totalStock} en stock</p>
            )}
          </div>

          <Link href={`/product/${product.id}`}>
            <Button size="sm" disabled={!inStock}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              Acheter
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
