import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { CartItemRow } from './CartItemRow';
import { X, ShoppingBag, ArrowRight, Trash2, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const CartDrawer: React.FC<{ onOpenCheckout: () => void }> = ({ onOpenCheckout }) => {
  const { isCartOpen, closeCart, items, itemCount, subtotal, clearCart } = useCart();
  const { lang, t, dir } = useLanguage();
  const { settings } = useStore();
  const isAr = lang === 'ar';

  if (!isCartOpen) return null;

  const isFreeDeliveryEligible = subtotal >= settings.freeDeliveryThreshold;
  const remainingForFree = Math.max(0, settings.freeDeliveryThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 rtl:pl-0 rtl:pr-10">
        <div className="w-screen max-w-md bg-[#121110] border-l border-stone-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">{t.cartTitle}</h3>
                <span className="text-xs text-stone-400">
                  {itemCount} {t.cartItemsCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-2 text-stone-500 hover:text-rose-400 rounded-lg hover:bg-stone-900 transition-colors"
                  title={t.cartClear}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={closeCart}
                className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Delivery Goal Bar */}
          {items.length > 0 && (
            <div className="bg-stone-900/80 px-5 py-3 border-b border-stone-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-stone-300 font-medium">
                  {isFreeDeliveryEligible
                    ? t.cartFreeDeliveryEligible
                    : isAr
                    ? `أضف ${formatCurrency(remainingForFree, lang)} للتوصيل المجاني`
                    : `Add ${formatCurrency(remainingForFree, lang)} for FREE delivery`}
                </span>
                <span className="text-amber-400 font-bold">
                  {settings.freeDeliveryThreshold} {t.sar}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (subtotal / settings.freeDeliveryThreshold) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length > 0 ? (
              items.map((item) => <CartItemRow key={item.id} item={item} />)
            ) : (
              <div className="py-24 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600 mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h4 className="font-serif text-lg font-bold text-white">
                  {t.cartEmptyTitle}
                </h4>
                <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                  {t.cartEmptyDesc}
                </p>
                <button
                  onClick={closeCart}
                  className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-gold-sm"
                >
                  {t.cartContinueShopping}
                </button>
              </div>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-5 bg-[#171514] border-t border-stone-800 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>{t.cartSubtotal}</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal, lang)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>{t.cartDeliveryFee}</span>
                  <span className="font-bold text-amber-400">
                    {isFreeDeliveryEligible
                      ? isAr
                        ? 'مجاني'
                        : 'FREE'
                      : formatCurrency(settings.deliveryFee, lang)}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex justify-between text-base font-bold text-white">
                  <span>{t.cartTotal}</span>
                  <span className="font-sans font-black text-amber-400 text-lg">
                    {formatCurrency(subtotal + (isFreeDeliveryEligible ? 0 : settings.deliveryFee), lang)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  closeCart();
                  onOpenCheckout();
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-95 group"
              >
                <span>{t.cartCheckoutBtn}</span>
                <ArrowRight
                  className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                    dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
