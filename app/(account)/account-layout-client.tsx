'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Package, Settings, LogOut, Home, Menu, X } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';

export function AccountLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Menu Button */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="h-11 w-11"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Backdrop Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
          )}

          {/* Sidebar Navigation */}
          <aside
            className={`
              fixed lg:static inset-y-0 left-0 z-50
              w-64 lg:w-64 flex-shrink-0
              transform transition-transform duration-300 ease-in-out
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="bg-background rounded-lg border p-6 lg:sticky lg:top-8 h-full lg:h-auto">
              {/* Mobile Close Button */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h2 className="font-semibold text-lg">Mon Compte</h2>
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

              {/* Desktop Title */}
              <h2 className="hidden lg:block font-semibold text-lg mb-4">Mon Compte</h2>

              <nav className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
                  onClick={closeMobileMenu}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-sm">Accueil</span>
                </Link>
                <Link
                  href="/account"
                  className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
                  onClick={closeMobileMenu}
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">Vue d&apos;ensemble</span>
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
                  onClick={closeMobileMenu}
                >
                  <Package className="h-5 w-5" />
                  <span className="text-sm">Mes Commandes</span>
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted transition-colors min-h-[44px]"
                  onClick={closeMobileMenu}
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-sm">Paramètres</span>
                </Link>
                <div className="pt-4 border-t">
                  <form action={logout}>
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px]"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="text-sm">Déconnexion</span>
                    </Button>
                  </form>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
