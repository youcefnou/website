"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductCardCompactProps {
  product: {
    id: string;
    name: string;
    image_url?: string;
    price: number;
    inStock: boolean;
  };
}

export function ProductCardCompact({ product }: ProductCardCompactProps) {
  return (
    <div className="group bg-white rounded-lg overflow-hidden border hover:shadow-lg transition-all">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.image_url || "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Out of stock overlay removed per requirements - no visual indication shown */}
          {/* Overlay previously shown here but removed as "rupture" text needs to be completely hidden */}
        </div>
      </Link>

      <div className="p-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-medium text-sm hover:text-primary transition line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold">{product.price} DA</p>
          <Link href={`/product/${product.id}`}>
            <Button size="sm" variant="outline" disabled={!product.inStock}>
              <ShoppingCart className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
