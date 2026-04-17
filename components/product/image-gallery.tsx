"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // If no images, use placeholder
  const displayImages = images.length > 0 ? images : ["/placeholder.png"];
  const selectedImage = displayImages[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="aspect-square relative rounded-lg overflow-hidden border bg-muted max-w-xs sm:max-w-sm md:max-w-md mx-auto lg:max-w-none">
        <Image
          src={selectedImage}
          alt={productName}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-20 h-20 flex-shrink-0 snap-start rounded-md overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-muted hover:border-gray-400"
              )}
            >
              <Image
                src={img}
                alt={`${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
