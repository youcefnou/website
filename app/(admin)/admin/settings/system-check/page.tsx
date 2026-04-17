import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

function checkStorageConfig() {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = hasSupabaseUrl && hasSupabaseAnonKey;

  return {
    status: isConfigured ? 'ok' : 'error',
    storage: {
      provider: 'supabase',
      bucket,
      config: {
        supabaseUrl: hasSupabaseUrl ? '✓ configured' : '✗ missing',
        supabaseAnonKey: hasSupabaseAnonKey ? '✓ configured' : '✗ missing',
      },
      missingVars: [
        !hasSupabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
        !hasSupabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
      ].filter(Boolean),
    },
  };
}

async function refreshPage() {
  'use server';
  revalidatePath('/admin/settings/system-check');
  redirect('/admin/settings/system-check');
}

export default async function SystemCheckPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const storageStatus = checkStorageConfig();
  const isConfigured = storageStatus.status === 'ok';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Vérification du Système</h2>
          <p className="text-muted-foreground">
            État de la configuration du téléchargement d&apos;images
          </p>
        </div>
        <form action={refreshPage}>
          <Button variant="outline" type="submit">
            <RefreshCw className="w-4 h-4 mr-2" />
            Rafraîchir
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configuration du stockage</span>
            {isConfigured ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-normal">Configuré</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-normal">Non configuré</span>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Vérification des variables d&apos;environnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <ConfigItem
              label="Provider"
              value={storageStatus.storage?.provider}
              isValid={storageStatus.storage?.provider === 'supabase'}
            />
            <ConfigItem
              label="Bucket"
              value={storageStatus.storage?.bucket}
              isValid={!!storageStatus.storage?.bucket}
            />
            <ConfigItem
              label="Supabase URL"
              value={storageStatus.storage?.config?.supabaseUrl}
              isValid={storageStatus.storage?.config?.supabaseUrl?.startsWith('✓') || false}
            />
          </div>

          {!isConfigured && storageStatus.storage?.missingVars && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="font-medium text-orange-900">
                      Variables manquantes
                    </p>
                    <p className="text-sm text-orange-800 mt-1">
                      {storageStatus.storage.missingVars.join(', ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-orange-900 mb-2">
                      Ajoutez ces variables dans votre fichier .env :
                    </p>
                    <pre className="bg-orange-100 p-3 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_anon_key
SUPABASE_STORAGE_BUCKET=products`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">
                    Configuration valide
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    Le téléchargement d&apos;images devrait fonctionner correctement.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment configurer le stockage Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside text-sm">
            <li>
              Créez un projet sur{' '}
              <a 
                href="https://supabase.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                supabase.com
              </a>
            </li>
            <li>
              Configurez vos variables <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> et <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              Créez/validez un bucket public pour les images (par défaut <code className="bg-gray-100 px-1 py-0.5 rounded">products</code>)
              <ul className="ml-6 mt-1 space-y-1">
                <li>• Bucket public pour logos et images produit</li>
                <li>• Optionnel: définir <code className="bg-gray-100 px-1 py-0.5 rounded">SUPABASE_STORAGE_BUCKET</code></li>
              </ul>
            </li>
            <li>
              Ajoutez ces valeurs dans votre fichier <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code>
            </li>
            <li>
              Redémarrez votre serveur de développement :
              <pre className="bg-gray-100 p-2 rounded mt-1">npm run dev</pre>
            </li>
            <li>
              Revenez sur cette page et cliquez sur &quot;Rafraîchir&quot;
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations de débogage</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
            {JSON.stringify(storageStatus, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigItem({ 
  label, 
  value, 
  isValid 
}: { 
  label: string; 
  value?: string; 
  isValid: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{value || 'Non défini'}</p>
      </div>
      {isValid ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )}
    </div>
  );
}
