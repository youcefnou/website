import { requireAdmin } from '@/lib/auth/admin';
import { redirect, notFound } from 'next/navigation';
import { getPage } from '@/app/actions/pages';
import { PageEditor } from '@/components/admin/page-editor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EditPagePage({
  params,
}: {
  params: { pageId: string };
}) {
  try {
    await requireAdmin();
  } catch {
    redirect('/?error=unauthorized');
  }

  const page = await getPage(params.pageId);

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/settings/pages">
          <Button variant="ghost" size="sm" className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour aux pages
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Modifier {page.title}</h2>
        <p className="text-muted-foreground">
          Page: {page.id}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <PageEditor pageId={page.id} initialData={page} />
      </div>
    </div>
  );
}
