import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { getAllPages } from '@/app/actions/pages';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PagesManagementPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const pages = await getAllPages();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des pages</h2>
        <p className="text-muted-foreground">
          Gérer le contenu des pages FAQ et À Propos
        </p>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className="bg-white p-6 rounded-lg border flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">{page.title}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {page.id} • {page.is_published ? 'Publié' : 'Non publié'}
                </p>
              </div>
            </div>
            <Link href={`/admin/settings/pages/${page.id}`}>
              <Button>Modifier</Button>
            </Link>
          </div>
        ))}
      </div>

      {pages.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucune page trouvée</p>
        </div>
      )}
    </div>
  );
}
