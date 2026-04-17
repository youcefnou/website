'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { 
  Home, Menu, X, LayoutDashboard, ShoppingCart, Package, 
  FolderOpen, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/categories', label: 'Catégories', icon: FolderOpen },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/30 admin-light-theme" dir="ltr">
      <div className="border-b bg-background">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-base md:text-xl font-semibold truncate">Admin</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            <div className="w-px h-6 bg-border mx-2" />
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Déconnexion</span>
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
          fixed top-0 right-0 bottom-0 w-72 bg-background z-50
          transform transition-transform duration-300 ease-in-out md:hidden
          shadow-xl
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold">Admin</h2>
          </div>
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

        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col p-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all min-h-[48px] ${
                    active 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-primary/50" />}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-3 border-t mt-2">
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[48px] rounded-xl px-3"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="text-sm">Déconnexion</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-3 md:p-4">{children}</div>
    </div>
  );
}
