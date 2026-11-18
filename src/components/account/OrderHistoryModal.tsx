import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { Order, OrderStatus } from '../../types';
import { X, Clock, CheckCircle2, RotateCcw, Package, ChevronRight, User, Phone, MapPin, LogOut } from 'lucide-react';
import { formatCurrency, formatOrderDate } from '../../lib/utils';
import confetti from 'canvas-confetti';

export const OrderHistoryModal: React.FC = () => {
  const { isOrderHistoryOpen, setIsOrderHistoryOpen, currentUser, logout } = useAuth();
  const { orders } = useStore();
  const { addToCart, openCart } = useCart();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  if (!isOrderHistoryOpen) return null;

  // Filter orders for the logged-in customer (by phone or name) or show recent orders
  const myOrders = currentUser
    ? orders.filter(
        (o) =>
          o.customer.phone === currentUser.phone ||
          o.customer.name.toLowerCase() === currentUser.name.toLowerCase()
      )
    : orders.slice(0, 3);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Confirmed':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Preparing':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'Ready for Pickup':
      case 'Out for Delivery':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return t.statusPending;
      case 'Confirmed':
        return t.statusConfirmed;
      case 'Preparing':
        return t.statusPreparing;
      case 'Ready for Pickup':
        return t.statusReadyPickup;
      case 'Out for Delivery':
        return t.statusOutDelivery;
      case 'Completed':
        return t.statusCompleted;
      case 'Cancelled':
        return t.statusCancelled;
      default:
        return status;
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(item.product, item.quantity, item.customization);
    });
    setIsOrderHistoryOpen(false);
    openCart();
    try {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#E5A93C', '#FFFFFF'],
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        onClick={() => setIsOrderHistoryOpen(false)}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-2xl bg-[#141210] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                {t.ordersTitle}
              </h2>
              {currentUser && (
                <p className="text-xs text-stone-400">
                  {currentUser.name} • {currentUser.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => {
                  logout();
                  setIsOrderHistoryOpen(false);
                }}
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-xl transition-colors"
                title={t.navSignOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOrderHistoryOpen(false)}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-900 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Orders List Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {myOrders.length > 0 ? (
            myOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-amber-500/30 transition-all space-y-4"
              >
                {/* Header: Order #, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-400">
                        {formatOrderDate(order.createdAt, lang)}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {order.orderType === 'pickup'
                        ? isAr
                          ? 'استلام من الفرع'
                          : 'In-Store Pickup'
                        : isAr
                        ? 'توصيل للمنزل'
                        : 'Doorstep Delivery'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Ordered Items summary */}
                <div className="space-y-2 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-stone-300">
                      <span className="line-clamp-1">
                        {item.quantity}x {isAr ? item.product.nameAr : item.product.nameEn}
                        {item.customization.selectedSize && (
                          <span className="text-amber-300 text-[11px]">
                            {' '}
                            ({isAr ? item.customization.selectedSize.nameAr : item.customization.selectedSize.nameEn})
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-white whitespace-nowrap">
                        {formatCurrency(item.subtotal, lang)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Total & Reorder Button */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-400 block">{t.orderTotal}:</span>
                    <span className="font-serif text-lg font-bold text-amber-400">
                      {formatCurrency(order.total, lang)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleReorder(order)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-gold-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.orderReorderBtn}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center space-y-3">
              <Package className="w-12 h-12 text-stone-600 mx-auto" />
              <p className="text-sm text-stone-300 font-medium">{t.ordersEmpty}</p>
              <button
                onClick={() => setIsOrderHistoryOpen(false)}
                className="px-5 py-2 rounded-full bg-amber-500 text-black text-xs font-bold"
              >
                {t.ordersEmptyAction}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
