"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, Trash2, Plus, Save } from "lucide-react";
import type { CategoryCard } from "@/lib/types/custom-settings";
import { IconPicker, getIconComponent, getIconName, DEFAULT_ICON_NAME } from "@/components/admin/icon-picker";
import { ColorPickerSimple } from "@/components/admin/color-picker-simple";
import { useToast } from "@/hooks/use-toast";

interface CategoryCardsManagerProps {
  initialCards: CategoryCard[];
  categories: Array<{ id: string; name: string }>;
}

export function CategoryCardsManager({
  initialCards,
  categories,
}: CategoryCardsManagerProps) {
  const [cards, setCards] = useState<CategoryCard[]>(initialCards);
  const [editingId, setEditingId] = useState<CategoryCard['id'] | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addCard = () => {
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${cards.length + 1}`;
    const newCard: CategoryCard = {
      id: newId,
      name: "Nouvelle catégorie",
      icon: DEFAULT_ICON_NAME,
      color: "bg-blue-500",
      category_id: null,
      enabled: true,
      order: cards.length + 1,
    };
    setCards([...cards, newCard]);
    setEditingId(newId);
  };

  const updateCard = (id: CategoryCard["id"], updates: Partial<CategoryCard>) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCard = (id: CategoryCard["id"]) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) {
      setCards(cards.filter((c) => c.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const moveCard = (id: CategoryCard["id"], direction: "up" | "down") => {
    const index = cards.findIndex((c) => c.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === cards.length - 1)
    ) {
      return;
    }

    const newCards = [...cards];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];

    // Update order property
    newCards.forEach((card, idx) => {
      card.order = idx + 1;
    });

    setCards(newCards);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/category-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });

      if (!response.ok) {
        throw new Error("Failed to save category cards");
      }

      toast({
        title: "Succès",
        description: "Les cartes de catégorie ont été sauvegardées",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les cartes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cartes de catégories ({cards.length})</h3>
          <Button onClick={addCard} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une carte
          </Button>
        </div>

        {cards.map((card, index) => {
          // Handle both string icon names and direct component references
          const IconComponent = typeof card.icon === 'string' 
            ? getIconComponent(card.icon)
            : card.icon;

          return (
            <Card key={card.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={card.enabled}
                      onCheckedChange={(checked) =>
                        updateCard(card.id, { enabled: checked as boolean })
                      }
                    />
                    <div className="flex items-center gap-2">
                      {IconComponent && (
                        <div className={`${card.color} w-8 h-8 rounded-full flex items-center justify-center`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <CardTitle className="text-base">{card.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCard(card.id, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCard(card.id, "down")}
                      disabled={index === cards.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(editingId === card.id ? null : card.id)}
                    >
                      {editingId === card.id ? "Fermer" : "Modifier"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCard(card.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingId === card.id && (
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${card.id}`}>Nom</Label>
                    <Input
                      id={`name-${card.id}`}
                      value={card.name}
                      onChange={(e) => updateCard(card.id, { name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`category-${card.id}`}>Catégorie liée</Label>
                    <select
                      id={`category-${card.id}`}
                      value={card.category_id || ""}
                      onChange={(e) =>
                        updateCard(card.id, { category_id: e.target.value || null })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">-- Aucune catégorie --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Icône</Label>
                    <IconPicker
                      value={typeof card.icon === 'string' ? card.icon : (getIconName(card.icon) || DEFAULT_ICON_NAME)}
                      onChange={(icon) => updateCard(card.id, { icon })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur</Label>
                    <ColorPickerSimple
                      value={card.color}
                      onChange={(color) => updateCard(card.id, { color })}
                    />
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Aperçu</Label>
                    <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                      <div
                        className={`${card.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3`}
                      >
                        {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
                      </div>
                      <h3 className="font-semibold text-gray-900">{card.name}</h3>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {cards.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Aucune carte configurée</p>
            <Button onClick={addCard}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la première carte
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
