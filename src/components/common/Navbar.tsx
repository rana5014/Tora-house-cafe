import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Globe, User, Menu, X, Coffee } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface NavbarProps {
  onNavigateMenu: () => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateMenu, onNavigateHome }) => {
  const { lang, t, toggleLang } = useLanguage();
  const { itemCount, subtotal, openCart } = useCart();
  const { currentUser, isLoggedIn, isAdmin, setIsAuthModalOpen, setIsOrderHistoryOpen, setIsAdminModalOpen } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0f0e0d]/90 backdrop-blur-md border-b border-stone-800/80 shadow-luxury py-3'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-3 group text-left transition-transform duration-200 active:scale-95"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] shadow-gold-sm">
                <div className="w-full h-full bg-[#181716] rounded-[10px] flex items-center justify-center">
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-2xl font-black tracking-wider text-white">
                  TORA <span className="text-amber-400">HOUSE</span>
                </span>
                <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-stone-400 uppercase">
                  {lang === 'ar' ? 'قهوة • شاي • عصائر' : 'COFFEE • TEA • JUICES'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
              <button
                onClick={onNavigateHome}
                className="hover:text-amber-400 transition-colors py-1 relative group"
              >
                {t.navHome}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full" />
              </button>
              <button
                onClick={onNavigateMenu}
                className="hover:text-amber-400 transition-colors py-1 relative group text-amber-400 font-semibold"
              >
                {t.navMenu}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-400" />
              </button>
              <button
                onClick={() => scrollTo('about')}
                className="hover:text-amber-400 transition-colors py-1 relative group"
              >
                {t.navAbout}
              </button>
              <button
                onClick={() => scrollTo('why-us')}
                className="hover:text-amber-400 transition-colors py-1 relative group"
              >
                {t.navWhyUs}
              </button>
              <button
                onClick={() => scrollTo('reviews')}
                className="hover:text-amber-400 transition-colors py-1 relative group"
              >
                {t.navReviews}
              </button>
              <button
                onClick={() => scrollTo('contact')}
                className="hover:text-amber-400 transition-colors py-1 relative group"
              >
                {t.navContact}
              </button>
            </nav>

            {/* Action Buttons: Language, Account, Admin, Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLang}
                title="Switch Language / تغيير اللغة"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-800 bg-stone-900/80 hover:border-amber-500/50 hover:bg-stone-800/80 text-xs font-semibold text-stone-200 transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'en' ? 'العربية' : 'English'}</span>
              </button>

              {/* Account / My Orders Button */}
              {isLoggedIn ? (
                <button
                  onClick={() => setIsOrderHistoryOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-800 bg-stone-900/80 hover:border-amber-500/40 text-xs font-medium text-stone-200 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="max-w-[90px] truncate">{currentUser?.name.split(' ')[0]}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-800 bg-stone-900/80 hover:border-amber-500/40 text-xs font-medium text-stone-300 hover:text-white transition-all"
                >
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.navSignIn}</span>
                </button>
              )}


              {/* Shopping Cart Button */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs sm:text-sm shadow-gold-sm active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-black" />
                <span className="hidden xs:inline">{formatCurrency(subtotal, lang)}</span>
                {itemCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-black text-amber-400 text-[11px] font-black flex items-center justify-center animate-bounce">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#141210]/95 backdrop-blur-xl border-b border-stone-800 px-6 py-6 space-y-4">
            <nav className="flex flex-col space-y-3 text-base font-medium text-stone-200">
              <button
                onClick={() => {
                  onNavigateHome();
                  setMobileMenuOpen(false);
                }}
                className="text-start py-2 hover:text-amber-400 transition-colors border-b border-stone-800/60"
              >
                {t.navHome}
              </button>
              <button
                onClick={() => {
                  onNavigateMenu();
                  setMobileMenuOpen(false);
                }}
                className="text-start py-2 text-amber-400 font-bold border-b border-stone-800/60"
              >
                {t.navMenu}
              </button>
              <button
                onClick={() => scrollTo('about')}
                className="text-start py-2 hover:text-amber-400 transition-colors border-b border-stone-800/60"
              >
                {t.navAbout}
              </button>
              <button
                onClick={() => scrollTo('why-us')}
                className="text-start py-2 hover:text-amber-400 transition-colors border-b border-stone-800/60"
              >
                {t.navWhyUs}
              </button>
              <button
                onClick={() => scrollTo('reviews')}
                className="text-start py-2 hover:text-amber-400 transition-colors border-b border-stone-800/60"
              >
                {t.navReviews}
              </button>
              <button
                onClick={() => scrollTo('contact')}
                className="text-start py-2 hover:text-amber-400 transition-colors"
              >
                {t.navContact}
              </button>
            </nav>

            <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-3">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsOrderHistoryOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-stone-200 text-sm font-medium"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>{t.navOrders}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-stone-200 text-sm font-medium"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>{t.navSignIn}</span>
                </button>
              )}

            </div>
          </div>
        )}
      </header>
    </>
  );
};
