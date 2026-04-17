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
  return slide[field] || "";
}

export function HeroCarousel({ slides: propSlides, settings: propSettings }: HeroCarouselProps) {
  const locale = useLocale();

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

  const isRtl = locale === "ar";

  if (slides.length === 0) {
    return (
      <div className="relative h-[320px] md:h-[520px] overflow-hidden rounded-2xl bg-[#141414]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-white">Bienvenue</h1>
            <p className="text-lg md:text-xl text-gray-400">Aucun slide configuré</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[320px] md:h-[520px] overflow-hidden rounded-2xl" dir={isRtl ? "rtl" : "ltr"}>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ${
            index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-[#111111]">
            {slide.image_url && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image_url})` }}
              />
            )}
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0aee] via-[#0a0a0acc] to-[#0a0a0a66]" />
          </div>

          {/* Content */}
          <div className="relative h-full container mx-auto flex items-center px-6 md:px-8">
            <div className="max-w-2xl space-y-5 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight">
                <span className="text-[#E8642C]">
                  {getLocalizedField(slide, "title", locale).split(" ").slice(0, 2).join(" ")}
                </span>
                <br />
                <span className="text-white">
                  {getLocalizedField(slide, "title", locale).split(" ").slice(2).join(" ")}
                </span>
              </h1>
              <p className="text-base md:text-xl text-gray-300 max-w-lg leading-relaxed">
                {getLocalizedField(slide, "subtitle", locale)}
              </p>
              {slide.cta_link && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href={slide.cta_link}>
                    <Button 
                      size="lg" 
                      className="bg-[#E8642C] hover:bg-[#d45a25] text-white font-semibold px-8 rounded-full shadow-lg shadow-[#E8642C]/20 transition-all hover:shadow-[#E8642C]/40"
                    >
                      {getLocalizedField(slide, "cta_text", locale)}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {settings.show_arrows && slides.length > 1 && (
        <>
          <button
            onClick={isRtl ? nextSlide : prevSlide}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2.5 transition-all border border-white/10"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={isRtl ? prevSlide : nextSlide}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2.5 transition-all border border-white/10"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {settings.show_dots && slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-[#E8642C] w-8" : "bg-white/30 w-2 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
