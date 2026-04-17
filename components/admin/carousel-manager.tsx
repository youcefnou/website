"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, Trash2, Plus, Save } from "lucide-react";
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

export function CarouselManager({ initialSlides, initialSettings }: CarouselManagerProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides);
  const [settings, setSettings] = useState<CarouselSettings>(initialSettings);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addSlide = () => {
    const newId = Math.max(0, ...slides.map((s) => s.id)) + 1;
    const newSlide: CarouselSlide = {
      id: newId,
      title: "Nouveau slide",
      subtitle: "Description du slide",
      cta_text: "En savoir plus",
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
                <div className="space-y-2">
                  <Label htmlFor={`title-${slide.id}`}>Titre</Label>
                  <Input
                    id={`title-${slide.id}`}
                    value={slide.title}
                    onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`subtitle-${slide.id}`}>Sous-titre</Label>
                  <Input
                    id={`subtitle-${slide.id}`}
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(slide.id, { subtitle: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`cta-${slide.id}`}>Texte du bouton</Label>
                    <Input
                      id={`cta-${slide.id}`}
                      value={slide.cta_text}
                      onChange={(e) => updateSlide(slide.id, { cta_text: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`link-${slide.id}`}>Lien du bouton</Label>
                    <Input
                      id={`link-${slide.id}`}
                      value={slide.cta_link}
                      onChange={(e) => updateSlide(slide.id, { cta_link: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`image-${slide.id}`}>URL de l&apos;image</Label>
                  <Input
                    id={`image-${slide.id}`}
                    value={slide.image_url}
                    onChange={(e) => updateSlide(slide.id, { image_url: e.target.value })}
                    placeholder="https://..."
                  />
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
