'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Checkout page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">
            Erreur lors du paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-700">
            Une erreur inattendue s&apos;est produite lors du traitement de votre commande.
            Veuillez réessayer ou contacter le support si le problème persiste.
          </p>
          
          {error.message && (
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer font-medium">
                Détails de l&apos;erreur
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              Réessayer
            </Button>
            <Button onClick={() => window.location.href = '/cart'} variant="outline">
              Retour au panier
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Retour à l&apos;accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
