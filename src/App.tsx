import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { WhatsAppFloating } from './components/common/WhatsAppFloating';
import { HeroSection } from './components/home/HeroSection';
import { FeaturedSection } from './components/home/FeaturedSection';
import { CategoriesGrid } from './components/home/CategoriesGrid';
import { SpecialOffers } from './components/home/SpecialOffers';
import { AboutSection } from './components/home/AboutSection';
import { WhyChooseUs } from './components/home/WhyChooseUs';
import { ReviewsSection } from './components/home/ReviewsSection';
import { LocationContact } from './components/home/LocationContact';
import { MenuSection } from './components/menu/MenuSection';
import { ProductCustomizerModal } from './components/menu/ProductCustomizerModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderConfirmationModal } from './components/checkout/OrderConfirmationModal';
import { AuthModal } from './components/account/AuthModal';
import { OrderHistoryModal } from './components/account/OrderHistoryModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ReceiptPrintModal } from './components/admin/ReceiptPrintModal';
import { Product, ProductSizeOption, ProductCategory, Order } from './types';
import { ShoppingBag } from 'lucide-react';
import { formatCurrency } from './lib/utils';
import { verifyMoyasarPayment, getPendingCheckoutOrder, clearPendingCheckoutOrder } from './lib/moyasarService';

const AppContent: React.FC = () => {
  const { lang } = useLanguage();
  const { itemCount, subtotal, openCart, clearCart } = useCart();
  const { settings, createOrder } = useStore();

  const [activeView, setActiveView] = useState<'home' | 'menu'>('home');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<ProductCategory | 'all'>('all');

  // Customizer state
  const [customizerProduct, setCustomizerProduct] = useState<Product | null>(null);
  const [customizerSize, setCustomizerSize] = useState<ProductSizeOption | undefined>(undefined);

  // Checkout & WhatsApp confirmation states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [customerReceiptOrder, setCustomerReceiptOrder] = useState<Order | null>(null);

  // Handle return from Saudi Bank 3D Secure OTP authentication
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('id');
    const paymentStatus = params.get('status');
    const paymentMsg = params.get('message');

    if (paymentId && paymentStatus) {
      // Clean query params so user doesn't re-trigger on refresh
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      if (paymentStatus === 'paid' || paymentStatus === 'captured') {
        const pending = getPendingCheckoutOrder();
        if (pending) {
          (async () => {
            try {
              const verified = await verifyMoyasarPayment(paymentId, settings.moyasarPublishableKey);
              if (verified.status === 'paid' || verified.status === 'captured') {
                const created = await createOrder({
                  customer: pending.customer,
                  items: pending.items,
                  subtotal: pending.subtotal,
                  subtotalExclVat: pending.subtotalExclVat,
                  tax: pending.tax,
                  deliveryFee: pending.deliveryFee,
                  total: pending.total,
                  orderType: pending.orderType,
                  paymentMethod: (verified.source?.company as any) || pending.paymentMethod || 'mada',
                  paymentStatus: 'Paid',
                  transactionId: paymentId,
                  pickupTime: pending.orderType === 'pickup' ? '15–20 mins' : undefined,
                });
                clearCart();
                clearPendingCheckoutOrder();
                setCompletedOrder(created);
              }
            } catch (err) {
              console.error('Error confirming Moyasar payment order:', err);
            }
          })();
        }
      } else if (paymentStatus === 'failed') {
        clearPendingCheckoutOrder();
        alert(
          lang === 'ar'
            ? `❌ تم رفض عملية الدفع من البنك: ${paymentMsg || 'يرجى التحقق من بيانات ورصيد البطاقة'}`
            : `❌ Bank payment declined: ${paymentMsg || 'Please verify card balance or try Cash on Delivery'}`
        );
      }
    }
  }, [settings.moyasarPublishableKey]);

  const handleOpenCustomizer = (product: Product, defaultSize?: ProductSizeOption) => {
    setCustomizerProduct(product);
    setCustomizerSize(defaultSize);
  };

  const handleSelectCategoryFromHome = (cat: ProductCategory) => {
    setSelectedMenuCategory(cat);
    setActiveView('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateMenu = () => {
    setActiveView('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCompleted = (order: Order) => {
    setIsCheckoutOpen(false);
    setCompletedOrder(order);
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Navigation */}
      <Navbar
        onNavigateHome={handleNavigateHome}
        onNavigateMenu={handleNavigateMenu}
      />

      {/* Main Body */}
      <main className="flex-1">
        {activeView === 'home' ? (
          <>
            <HeroSection
              onOrderNow={handleNavigateMenu}
              onExploreMenu={handleNavigateMenu}
            />
            <FeaturedSection
              onOpenCustomizer={handleOpenCustomizer}
              onViewAllMenu={handleNavigateMenu}
            />
            <CategoriesGrid onSelectCategory={handleSelectCategoryFromHome} />
            <SpecialOffers onNavigateMenu={handleNavigateMenu} />
            <AboutSection />
            <WhyChooseUs />
            <ReviewsSection />
            <LocationContact />
          </>
        ) : (
          <MenuSection
            initialCategory={selectedMenuCategory}
            onOpenCustomizer={handleOpenCustomizer}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateHome={handleNavigateHome}
        onNavigateMenu={handleNavigateMenu}
      />

      {/* Floating Official WhatsApp Chat button */}
      <WhatsAppFloating />

      {/* Floating Mobile Cart Bar (when items in cart) */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={openCart}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-xs shadow-gold-glow hover:scale-105 active:scale-95 transition-all"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-black" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-black text-amber-400 text-[10px] flex items-center justify-center font-bold">
                {itemCount}
              </span>
            </div>
            <span>{formatCurrency(subtotal, lang)}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <ProductCustomizerModal
        product={customizerProduct}
        initialSize={customizerSize}
        isOpen={Boolean(customizerProduct)}
        onClose={() => setCustomizerProduct(null)}
      />

      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderCompleted={handleOrderCompleted}
      />

      <OrderConfirmationModal
        order={completedOrder}
        isOpen={Boolean(completedOrder)}
        onClose={() => setCompletedOrder(null)}
        onPrintReceipt={(ord) => setCustomerReceiptOrder(ord)}
      />

      <ReceiptPrintModal
        order={customerReceiptOrder}
        isOpen={Boolean(customerReceiptOrder)}
        onClose={() => setCustomerReceiptOrder(null)}
      />

      <AuthModal />
      <OrderHistoryModal />
      <AdminDashboard />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <CartProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </CartProvider>
      </StoreProvider>
    </LanguageProvider>
  );
}

export default App;
