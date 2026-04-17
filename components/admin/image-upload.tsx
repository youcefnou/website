'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadAndUpdateProductImage, updateStoreLogo } from '@/app/actions/upload';
import { AlertCircle, Upload, Loader2, Save, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  currentImageUrl?: string;
  onSuccess?: (url: string) => void;
  onUploadComplete?: (url: string) => void;
  type: 'product' | 'logo' | 'category';
  itemId?: string; // Required for product images when using old upload method
  label?: string;
  required?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  onSuccess,
  onUploadComplete,
  type,
  itemId,
  label = 'Télécharger une image',
  required = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New state for two-step logo upload
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Check if current image is a placeholder
  const isPlaceholder = previewUrl && previewUrl.includes('placeholder');
  const needsImage = !previewUrl || isPlaceholder;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image');
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier image',
        variant: 'destructive',
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La taille de l\'image doit être inférieure à 5 Mo');
      toast({
        title: 'Erreur',
        description: 'La taille de l\'image doit être inférieure à 5 Mo',
        variant: 'destructive',
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError('');
    
    // For logo type: store file and create local preview (two-step process)
    if (type === 'logo') {
      setSelectedFile(file);
      setSaveSuccess(false);
      
      // Create local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string);
        }
      };
      reader.onerror = () => {
        setError('Échec de la création de l\'aperçu');
        toast({
          title: 'Erreur',
          description: 'Échec de la création de l\'aperçu de l\'image',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
      return;
    }
    
    // For product and category: immediate upload (existing behavior)
    setIsUploading(true);

    try {
      // For category type or when used without itemId, use new upload API
      if (type === 'category' || !itemId) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (itemId) formData.append('itemId', itemId);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const { url } = await response.json();
        setPreviewUrl(url);
        
        if (onUploadComplete) {
          onUploadComplete(url);
        }
        if (onSuccess) {
          onSuccess(url);
        }

        toast({
          title: 'Succès',
          description: 'Image téléchargée avec succès',
        });
      } else {
        // Legacy upload for existing product images only
        // Note: Logo uses two-step API upload (select, then save button)
        // Category and new products use direct API route upload
        if (type !== 'product' || !itemId) {
          throw new Error('Invalid configuration for legacy upload');
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
          const base64 = reader.result as string;
          const result = await uploadAndUpdateProductImage(itemId, base64);

          if (result.success && result.url) {
            setPreviewUrl(result.url);
            if (onSuccess) {
              onSuccess(result.url);
            }
            if (onUploadComplete) {
              onUploadComplete(result.url);
            }
          } else {
            setError(result.error || 'Échec du téléchargement de l\'image');
          }
        };

        reader.onerror = () => {
          setError('Échec de la lecture du fichier');
          setIsUploading(false);
        };
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Une erreur s\'est produite lors du téléchargement de l\'image');
      toast({
        title: 'Erreur',
        description: 'Une erreur s\'est produite lors du téléchargement de l\'image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!selectedFile || type !== 'logo') return;

    setIsSaving(true);
    setError('');

    try {
      // Step 1: Upload to Cloudinary via API route
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'logo');

      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Échec du téléchargement');
      }

      const { url } = await uploadResponse.json();

      // Step 2: Update database with new logo URL
      const updateResult = await updateStoreLogo(url);

      if (!updateResult.success) {
        console.error('Database update failed: Logo uploaded to Cloudinary but could not be saved to settings');
        throw new Error('Échec de l\'enregistrement du logo');
      }

      setPreviewUrl(url);
      setSelectedFile(null);
      setSaveSuccess(true);
      
      if (onSuccess) {
        onSuccess(url);
      }
      if (onUploadComplete) {
        onUploadComplete(url);
      }

      toast({
        title: 'Succès',
        description: 'Logo enregistré avec succès',
      });

      // Hide success banner after 3 seconds
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Save logo error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur s\'est produite lors de l\'enregistrement du logo';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    setSaveSuccess(false);
    setError('');
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onUploadComplete) {
      onUploadComplete('');
    }
    if (onSuccess) {
      onSuccess('');
    }
  };

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}
      
      {/* Success banner for logo save */}
      {saveSuccess && type === 'logo' && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              Logo enregistré avec succès
            </p>
            <p className="text-sm text-green-700 mt-1">
              Le logo a été téléchargé et mis à jour dans la base de données
            </p>
          </div>
        </div>
      )}
      
      {/* Warning if no image or placeholder */}
      {needsImage && required && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              Image requise
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Veuillez télécharger une image réelle du produit. Les images par défaut ne sont pas acceptées.
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        required={required && needsImage ? true : undefined}
      />

      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Téléchargement...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? 'Remplacer l\'image' : label}
          </>
        )}
      </Button>

      {/* Save button for logo type */}
      {selectedFile && type === 'logo' && (
        <Button
          type="button"
          onClick={handleSaveLogo}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer le logo
            </>
          )}
        </Button>
      )}

      {previewUrl && (
        <div className="relative w-full max-w-xs h-64">
          <Image
            src={previewUrl}
            alt="Aperçu"
            fill
            className="object-contain rounded-lg border border-gray-300"
          />
          {isPlaceholder && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <p className="text-white text-sm font-medium">Image temporaire</p>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            Supprimer
          </Button>
        </div>
      )}

      {!previewUrl && (
        <div className="w-full max-w-xs h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 text-sm">Aucune image</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Taille de fichier maximale : 5 Mo. Formats supportés : JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}
