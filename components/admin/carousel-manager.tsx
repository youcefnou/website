"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, Trash2, Plus, Save, Upload, ImageIcon, Loader2 } from "lucide-react";
import type { CarouselSlide, CarouselSettings } from "@/lib/types/custom-settings";
import { useToast } from "@/hooks/use-toast";

interface CarouselManagerProps {
  initialSlides: CarouselSlide[];
  initialSettings: CarouselSettings;
}

const GRADIENT_OPTIONS = [
  { label: "Blue → Purple", value: "from-blue-600 to-purple-600" },
  { label: "Green → Teal", value: "from-green-600 to-teal-600" },
  { label: "Orange → Red", value: "from-orange-600 to-red-600" },
  { label: "Pink → Rose", value: "from-pink-600 to-rose-600" },
  { label: "Indigo → Blue", value: "from-indigo-600 to-blue-600" },
  { label: "Purple → Pink", value: "from-purple-600 to-pink-600" },
];

type LangTab = "fr" | "en" | "ar";

export function CarouselManager({ initialSlides, initialSettings }: CarouselManagerProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides);
  const [settings, setSettings] = useState<CarouselSettings>(initialSettings);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<Record<number, LangTab>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const { toast } = useToast();

  const getLang = (slideId: number): LangTab => activeLang[slideId] || "fr";
  const setLang = (slideId: number, lang: LangTab) =>
    setActiveLang((prev) => ({ ...prev, [slideId]: lang }));

  const addSlide = () => {
    const newId = Math.max(0, ...slides.map((s) => s.id)) + 1;
    const newSlide: CarouselSlide = {
      id: newId,
      title: "Nouveau slide",
      title_en: "",
      title_ar: "",
      subtitle: "Description du slide",
      subtitle_en: "",
      subtitle_ar: "",
      cta_text: "En savoir plus",
      cta_text_en: "",
      cta_text_ar: "",
      cta_link: "/products",
      bg_color: "from-blue-600 to-purple-600",
      image_url: "",
      enabled: true,
      order: slides.length + 1,
    };
    setSlides([...slides, newSlide]);
    setEditingId(newId);
  };

  const updateSlide = (id: number, updates: Partial<CarouselSlide>) => {
    setSlides(slides.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSlide = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce slide ?")) {
      setSlides(slides.filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const moveSlide = (id: number, direction: "up" | "down") => {
    const index = slides.findIndex((s) => s.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === slides.length - 1)
    ) {
      return;
    }

    const newSlides = [...slides];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];

    // Update order property
    newSlides.forEach((slide, idx) => {
      slide.order = idx + 1;
    });

    setSlides(newSlides);
  };

  const handleImageUpload = async (slideId: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être une image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "La taille du fichier doit être inférieure à 10 Mo",
        variant: "destructive",
      });
      return;
    }

    setUploadingSlideId(slideId);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "carousel");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Échec du téléchargement");
      }

      const data = await response.json();
      updateSlide(slideId, { image_url: data.url });

      toast({
        title: "Succès",
        description: "Image téléchargée avec succès",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec du téléchargement",
        variant: "destructive",
      });
    } finally {
      setUploadingSlideId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save carousel");
      }

      toast({
        title: "Succès",
        description: "Les paramètres du carrousel ont été sauvegardés",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const LANG_TABS: { key: LangTab; label: string }[] = [
    { key: "fr", label: "🇫🇷 Français" },
    { key: "en", label: "🇬🇧 English" },
    { key: "ar", label: "🇩🇿 العربية" },
  ];

  const getTranslatedField = (
    slide: CarouselSlide,
    field: "title" | "subtitle" | "cta_text",
    lang: LangTab
  ): string => {
    if (lang === "fr") return slide[field] || "";
    const key = `${field}_${lang}` as keyof CarouselSlide;
    return (slide[key] as string) || "";
  };

  const setTranslatedField = (
    slideId: number,
    field: "title" | "subtitle" | "cta_text",
    lang: LangTab,
    value: string
  ) => {
    if (lang === "fr") {
      updateSlide(slideId, { [field]: value });
    } else {
      const key = `${field}_${lang}`;
      updateSlide(slideId, { [key]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du carrousel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_play"
              checked={settings.auto_play}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_play: checked as boolean })
              }
            />
            <Label htmlFor="auto_play">Lecture automatique</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Intervalle (ms)</Label>
            <Input
              id="interval"
              type="number"
              value={settings.interval}
              onChange={(e) =>
                setSettings({ ...settings, interval: parseInt(e.target.value) || 5000 })
              }
              min={1000}
              step={1000}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_arrows"
              checked={settings.show_arrows}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_arrows: checked as boolean })
              }
            />
            <Label htmlFor="show_arrows">Afficher les flèches</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_dots"
              checked={settings.show_dots}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_dots: checked as boolean })
              }
            />
            <Label htmlFor="show_dots">Afficher les points</Label>
          </div>
        </CardContent>
      </Card>

      {/* Slides List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Slides ({slides.length})</h3>
          <Button onClick={addSlide} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un slide
          </Button>
        </div>

        {slides.map((slide, index) => (
          <Card key={slide.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={slide.enabled}
                    onCheckedChange={(checked) =>
                      updateSlide(slide.id, { enabled: checked as boolean })
                    }
                  />
                  <CardTitle className="text-base">
                    Slide {index + 1}: {slide.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(slide.id, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(slide.id, "down")}
                    disabled={index === slides.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === slide.id ? null : slide.id)}
                  >
                    {editingId === slide.id ? "Fermer" : "Modifier"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSlide(slide.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {editingId === slide.id && (
              <CardContent className="space-y-4 pt-0">
                {/* Language Tabs */}
                <div className="border-b">
                  <div className="flex gap-1">
                    {LANG_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setLang(slide.id, tab.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                          getLang(slide.id) === tab.key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Translated Fields */}
                <div className="space-y-4" dir={getLang(slide.id) === "ar" ? "rtl" : "ltr"}>
                  <div className="space-y-2">
                    <Label htmlFor={`title-${slide.id}-${getLang(slide.id)}`}>
                      {getLang(slide.id) === "fr" ? "Titre" : getLang(slide.id) === "en" ? "Title" : "العنوان"}
                    </Label>
                    <Input
                      id={`title-${slide.id}-${getLang(slide.id)}`}
                      value={getTranslatedField(slide, "title", getLang(slide.id))}
                      onChange={(e) =>
                        setTranslatedField(slide.id, "title", getLang(slide.id), e.target.value)
                      }
                      placeholder={
                        getLang(slide.id) !== "fr"
                          ? `Traduction (FR: ${slide.title || "..."})`
                          : ""
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`subtitle-${slide.id}-${getLang(slide.id)}`}>
                      {getLang(slide.id) === "fr" ? "Sous-titre" : getLang(slide.id) === "en" ? "Subtitle" : "العنوان الفرعي"}
                    </Label>
                    <Input
                      id={`subtitle-${slide.id}-${getLang(slide.id)}`}
                      value={getTranslatedField(slide, "subtitle", getLang(slide.id))}
                      onChange={(e) =>
                        setTranslatedField(slide.id, "subtitle", getLang(slide.id), e.target.value)
                      }
                      placeholder={
                        getLang(slide.id) !== "fr"
                          ? `Traduction (FR: ${slide.subtitle || "..."})`
                          : ""
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cta-${slide.id}-${getLang(slide.id)}`}>
                      {getLang(slide.id) === "fr" ? "Texte du bouton" : getLang(slide.id) === "en" ? "Button text" : "نص الزر"}
                    </Label>
                    <Input
                      id={`cta-${slide.id}-${getLang(slide.id)}`}
                      value={getTranslatedField(slide, "cta_text", getLang(slide.id))}
                      onChange={(e) =>
                        setTranslatedField(slide.id, "cta_text", getLang(slide.id), e.target.value)
                      }
                      placeholder={
                        getLang(slide.id) !== "fr"
                          ? `Traduction (FR: ${slide.cta_text || "..."})`
                          : ""
                      }
                    />
                  </div>
                </div>

                {/* Non-translated fields */}
                <div className="space-y-2">
                  <Label htmlFor={`link-${slide.id}`}>Lien du bouton</Label>
                  <Input
                    id={`link-${slide.id}`}
                    value={slide.cta_link}
                    onChange={(e) => updateSlide(slide.id, { cta_link: e.target.value })}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <Label>Image du slide</Label>
                  <div className="flex flex-col gap-3">
                    {/* File upload */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        uploadingSlideId === slide.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-300 hover:border-primary/50"
                      }`}
                    >
                      <input
                        ref={(el) => {
                          fileInputRefs.current[slide.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(slide.id, file);
                          e.target.value = "";
                        }}
                      />
                      {uploadingSlideId === slide.id ? (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Téléchargement...</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[slide.id]?.click()}
                          className="flex flex-col items-center gap-2 w-full py-2"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Cliquez pour télécharger une image
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PNG, JPG, WebP (max 10 Mo)
                          </span>
                        </button>
                      )}
                    </div>

                    {/* OR divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t" />
                      <span className="text-xs text-muted-foreground uppercase">ou</span>
                      <div className="flex-1 border-t" />
                    </div>

                    {/* URL input */}
                    <div className="space-y-1">
                      <Label htmlFor={`image-url-${slide.id}`} className="text-xs text-muted-foreground">
                        URL directe de l&apos;image
                      </Label>
                      <Input
                        id={`image-url-${slide.id}`}
                        value={slide.image_url}
                        onChange={(e) => updateSlide(slide.id, { image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    {/* Image preview */}
                    {slide.image_url && (
                      <div className="relative rounded-lg overflow-hidden border bg-gray-50">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {slide.image_url}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-6 px-2 text-xs text-red-500 hover:text-red-700"
                            onClick={() => updateSlide(slide.id, { image_url: "" })}
                          >
                            Supprimer
                          </Button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.image_url}
                          alt="Aperçu du slide"
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`gradient-${slide.id}`}>Gradient de fond</Label>
                  <select
                    id={`gradient-${slide.id}`}
                    value={slide.bg_color}
                    onChange={(e) => updateSlide(slide.id, { bg_color: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {GRADIENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Aperçu</Label>
                  <div
                    className={`relative h-32 rounded-lg overflow-hidden bg-gradient-to-r ${slide.bg_color}`}
                  >
                    {slide.image_url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `url(${slide.image_url})` }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="text-white text-center">
                        <h4 className="font-bold mb-1">{slide.title}</h4>
                        <p className="text-sm opacity-90 mb-2">{slide.subtitle}</p>
                        <div className="inline-block bg-white text-gray-900 px-3 py-1 rounded text-xs">
                          {slide.cta_text}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Translation summary */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Traductions:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      🇫🇷 {slide.title ? "✓" : "✗"} Titre
                    </div>
                    <div>
                      🇬🇧 {slide.title_en ? "✓" : "✗"} Title
                    </div>
                    <div>
                      🇩🇿 {slide.title_ar ? "✓" : "✗"} العنوان
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Aucun slide configuré</p>
            <Button onClick={addSlide}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le premier slide
            </Button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
}
