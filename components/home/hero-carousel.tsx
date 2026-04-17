"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { CarouselSlide, CarouselSettings } from "@/lib/types/custom-settings";

interface HeroCarouselProps {
  slides?: CarouselSlide[];
  settings?: CarouselSettings;
}

/**
 * Get the localized value for a carousel slide field.
 * Falls back to the French (default) value if no translation exists.
 */
function getLocalizedField(
  slide: CarouselSlide,
  field: "title" | "subtitle" | "cta_text",
  locale: string
): string {
  if (locale === "en") {
    const key = `${field}_en` as keyof CarouselSlide;
    const val = slide[key] as string | undefined;
    if (val?.trim()) return val;
  }
  if (locale === "ar") {
    const key = `${field}_ar` as keyof CarouselSlide;
    const val = slide[key] as string | undefined;
    if (val?.trim()) return val;
  }
  // Default: French
  return slide[field] || "";
}

export function HeroCarousel({ slides: propSlides, settings: propSettings }: HeroCarouselProps) {
  const locale = useLocale();

  // Filter only enabled slides and sort by order
  const slides = (propSlides || [])
    .filter(slide => slide.enabled)
    .sort((a, b) => a.order - b.order);

  const settings = propSettings || {
    auto_play: true,
    interval: 5000,
    show_arrows: true,
    show_dots: true,
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!settings.auto_play || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, settings.interval);

    return () => clearInterval(timer);
  }, [settings.auto_play, settings.interval, slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Show message if no slides are available
  if (slides.length === 0) {
    return (
      <div className="relative h-[280px] md:h-[500px] overflow-hidden rounded-lg bg-gradient-to-r from-gray-400 to-gray-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Bienvenue</h1>
            <p className="text-xl md:text-2xl">Aucun slide configuré</p>
          </div>
        </div>
      </div>
    );
  }

  const isRtl = locale === "ar";

  return (
    <div className="relative h-[280px] md:h-[500px] overflow-hidden rounded-lg" dir={isRtl ? "rtl" : "ltr"}>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg_color}`}>
            {slide.image_url && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${slide.image_url})` }}
              />
            )}
            <div className="container mx-auto h-full flex items-center px-4 relative z-10">
              <div className="max-w-2xl text-white space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  {getLocalizedField(slide, "title", locale)}
                </h1>
                <p className="text-xl md:text-2xl opacity-90">
                  {getLocalizedField(slide, "subtitle", locale)}
                </p>
                {slide.cta_link && (
                  <Link href={slide.cta_link}>
                    <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                      {getLocalizedField(slide, "cta_text", locale)}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      {settings.show_arrows && slides.length > 1 && (
        <>
          <button
            onClick={isRtl ? nextSlide : prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={isRtl ? prevSlide : nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {settings.show_dots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentSlide ? "bg-white w-8" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
