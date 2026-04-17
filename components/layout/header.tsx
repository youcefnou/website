'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ShoppingCart, Menu, X, User, Package, Settings, LogOut, Search, Globe, Truck, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cart-store';
import { MobileCartDrawer } from '@/components/cart/mobile-cart-drawer';
import { getCurrentUser } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { getUserCart, updateUserCartItem, removeUserCartItem } from '@/app/actions/cart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserCartItem } from '@/lib/types/cart';

interface HeaderProps {
  storeName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
}

export function Header({ storeName, logoUrl, primaryColor = '#000000', accentColor = '#0066cc' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userCartItems, setUserCartItems] = useState<UserCartItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('header');
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const { items, updateQuantity, removeItem } = useCartStore();

  useEffect(() => {
    setMounted(true);
    checkUser();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load user cart when user changes
  useEffect(() => {
    if (user) {
      loadUserCart();
    } else {
      setUserCartItems([]);
    }
  }, [user]);

  // Reset logo error when logoUrl changes
  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadUserCart = async () => {
    try {
      const cart = await getUserCart();
      setUserCartItems(cart as UserCartItem[]);
    } catch (error) {
      console.error('Failed to load user cart:', error);
    }
  };

  const handleUpdateUserQuantity = async (
    itemId: string,
    _sellableItemId: string,
    quantity: number
  ) => {
    try {
      await updateUserCartItem(itemId, quantity);
      // Update local state
      setUserCartItems((prev) =>
        quantity <= 0
          ? prev.filter((item) => item.id !== itemId)
          : prev.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            )
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveUserItem = async (
    itemId: string,
    _sellableItemId: string
  ) => {
    try {
      await removeUserCartItem(itemId);
      setUserCartItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/products', label: t('nav.products') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    // On mobile, open the drawer instead of navigating
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      e.preventDefault();
      setMobileCartOpen(true);
    }
  };

  const changeLanguage = (nextLocale: 'en' | 'fr' | 'ar') => {
    if (nextLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
    window.location.reload();
  };

  return (
    <>
      <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#0a0a0a] shadow-lg shadow-black/30 py-0"
          : "bg-[#0a0a0a]/95 backdrop-blur-md py-1"
      }`}
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Store Name */}
          <Link href="/" className="flex items-center space-x-3">
            {logoUrl && !logoError ? (
              <>
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={120}
                  height={48}
                  className="h-10 w-auto object-contain"
                  priority
                  onError={() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Failed to load logo image:', logoUrl);
                    }
                    setLogoError(true);
                  }}
                />
                <span className="text-lg font-bold hidden sm:inline text-white">
                  {storeName}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-white uppercase tracking-wider">
                {storeName}
              </span>
            )}
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="search"
                placeholder={t('searchDesktopPlaceholder')}
                className="pl-10 w-full bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#E8642C]/50 focus:ring-[#E8642C]/20"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href) ? 'text-[#E8642C]' : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Change language" className="text-gray-300 hover:text-white hover:bg-white/10">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => changeLanguage('fr')}>
                  {t('languages.french')} {locale === 'fr' ? '✓' : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  {t('languages.english')} {locale === 'en' ? '✓' : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ar')}>
                  {t('languages.arabic')} {locale === 'ar' ? '✓' : ''}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart Link */}
            <Link href="/cart" className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                className="relative text-gray-300 hover:text-white hover:bg-white/10"
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white bg-[#E8642C]">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Account Dropdown or Login Link */}
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t('account.myAccount')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="flex items-center cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      {t('account.myOrders')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('account.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('account.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm" className="bg-[#E8642C] hover:bg-[#d45a25] text-white">
                  {t('account.login')}
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button & Cart */}
          <div className="flex md:hidden items-center space-x-2">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                className="relative text-gray-300 hover:text-white hover:bg-white/10"
                onClick={handleCartClick}
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white bg-[#E8642C]">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#222] py-4 bg-[#0e0e0e]">
            {/* Mobile Search Bar */}
            <div className="mb-4 px-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder={t('searchMobilePlaceholder')}
                  className="pl-10 w-full bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors rounded-lg min-h-[44px] flex items-center ${
                    isActive(link.href) ? 'text-[#E8642C] bg-[#E8642C]/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="px-2 py-2 flex items-center gap-2">
                <Button
                  variant={locale === 'fr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeLanguage('fr')}
                >
                  FR
                </Button>
                <Button
                  variant={locale === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeLanguage('en')}
                >
                  EN
                </Button>
                <Button
                  variant={locale === 'ar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeLanguage('ar')}
                >
                  AR
                </Button>
              </div>
              
              {mounted && user ? (
                <>
                  <Link
                    href="/account"
                    className="px-2 py-2 text-sm font-medium text-muted-foreground transition-colors flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('account.myAccount')}
                  </Link>
                  <Link
                    href="/account/orders"
                    className="px-2 py-2 text-sm font-medium text-muted-foreground transition-colors flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {t('account.myOrders')}
                  </Link>
                  <Link
                    href="/account/settings"
                    className="px-2 py-2 text-sm font-medium text-muted-foreground transition-colors flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t('account.settings')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-2 py-2 text-sm font-medium text-red-600 transition-colors flex items-center text-left"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('account.logout')}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-2 py-2 text-sm font-medium text-muted-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('account.login')}
                </Link>
              )}
              
              <Link
                href="/cart"
                className="px-2 py-2 text-sm font-medium text-muted-foreground transition-colors flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{t('cart')}</span>
                {mounted && cartItemCount > 0 && (
                  <span 
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>

    {/* Benefits Bar */}
    <div className="w-full bg-[#111111] border-b border-[#1a1a1a] hidden sm:block">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-8 md:gap-16 py-2.5 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-3.5 h-3.5 text-[#E8642C]" />
            <span>Qualité garantie</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Truck className="w-3.5 h-3.5 text-[#E8642C]" />
            <span>Livraison rapide</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <CreditCard className="w-3.5 h-3.5 text-[#E8642C]" />
            <span>Paiement à la livraison</span>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Cart Drawer */}
    {mounted && (
      <MobileCartDrawer
        isOpen={mobileCartOpen}
        onClose={() => setMobileCartOpen(false)}
        items={items}
        userCartItems={userCartItems}
        isAuthenticated={!!user}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onUpdateUserQuantity={handleUpdateUserQuantity}
        onRemoveUserItem={handleRemoveUserItem}
      />
    )}
  </>
  );
}
