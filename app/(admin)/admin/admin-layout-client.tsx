'use client';

import { useState } from 'react';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import { Home, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-muted/30" dir="ltr">
      <div className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Panneau d&apos;administration</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-sm hover:underline flex items-center gap-1">
              <Home className="w-4 h-4" />
              Accueil
            </Link>
            <Link href="/admin" className="text-sm hover:underline">
              Tableau de bord
            </Link>
            <Link href="/admin/orders" className="text-sm hover:underline">
              Commandes
            </Link>
            <Link href="/admin/products" className="text-sm hover:underline">
              Produits
            </Link>
            <Link href="/admin/categories" className="text-sm hover:underline">
              Catégories
            </Link>
            <Link href="/admin/settings" className="text-sm hover:underline">
              Paramètres
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Déconnexion
              </button>
            </form>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden h-10 w-10"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-64 bg-background z-50
          transform transition-transform duration-300 ease-in-out md:hidden
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="h-9 w-9"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col p-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <Home className="w-5 h-5" />
            <span className="text-sm">Accueil</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <span className="text-sm">Tableau de bord</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <span className="text-sm">Commandes</span>
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <span className="text-sm">Produits</span>
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <span className="text-sm">Catégories</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <span className="text-sm">Paramètres</span>
          </Link>
          <div className="pt-4 border-t mt-4">
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px]"
              >
                <span className="text-sm">Déconnexion</span>
              </Button>
            </form>
          </div>
        </nav>
      </div>

      <div className="container mx-auto p-4">{children}</div>
    </div>
  );
}
