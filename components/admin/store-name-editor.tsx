"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface StoreNameEditorProps {
  currentName: string;
}

export function StoreNameEditor({ currentName }: StoreNameEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la boutique ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }

    if (name === currentName) {
      toast({
        title: "Information",
        description: "Aucun changement détecté",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/store/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storeName: name.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update store name");
      }

      toast({
        title: "Succès",
        description: "Nom de la boutique mis à jour avec succès",
      });
      router.refresh();
    } catch {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="storeName">Nom de la boutique</Label>
        <Input
          id="storeName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Entrez le nom de la boutique"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading || name === currentName}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </form>
  );
}
