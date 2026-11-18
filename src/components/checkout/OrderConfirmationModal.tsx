import React from 'react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, Clock, MapPin, Store, Truck, Coffee, ArrowRight, X, Printer } from 'lucide-react';
import { formatCurrency, formatOrderDate } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface OrderConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOrder?: () => void;
  onPrintReceipt?: (order: Order) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewOrder,
  onPrintReceipt,
}) => {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  React.useEffect(() => {
    if (isOpen && order) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E5A93C', '#F3ECE0', '#FFFFFF'],
        });
      } catch {}
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-lg bg-[#141210] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header with Close */}
        <div className="p-6 text-center border-b border-stone-800/80 relative bg-gradient-to-b from-[#181614] to-[#141210]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-900 text-stone-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-gold-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
            {isAr ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!'}
          </h2>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm">
            <span>{isAr ? 'رقم الطلب:' : 'Order #'}</span>
            <span>{order.orderNumber}</span>
          </div>

          <p className="text-xs text-stone-300 mt-3 max-w-sm mx-auto leading-relaxed">
            {isAr
              ? `شكراً لك يا ${order.customer.name}! تم إرسال تفاصيل طلبك تلقائياً إلى باريستا كافيه بيت تورا للبدء في التجهيز الفوري.`
              : `Thank you, ${order.customer.name}! Your order has been transmitted directly to our barista station for immediate preparation.`}
          </p>
        </div>

        {/* Scrollable Order Summary */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Preparation Status Banner */}
          <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {isAr ? 'وقت التحضير المقدر: 15–20 دقيقة' : 'Estimated Preparation: 15–20 mins'}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {order.orderType === 'pickup'
                  ? isAr
                    ? 'الاستلام من الفرع — طريق الملك عبدالعزيز، حي الملقا، الرياض'
                    : 'In-Store Pickup at King Abdulaziz Rd, Al Malqa, Riyadh'
                  : isAr
                  ? `التوصيل إلى: ${order.customer.address || ''} (${order.customer.city || 'الرياض'})`
                  : `Delivery to: ${order.customer.address || ''} (${order.customer.city || 'Riyadh'})`}
              </p>
            </div>
          </div>

          {/* Ordered Items Breakdown */}
          <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800/80 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {isAr ? 'ملخص الأصناف المطلوبة' : 'Ordered Items'}
            </h4>

            <div className="space-y-2 divide-y divide-stone-800/60 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2 flex justify-between items-start text-stone-300">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">
                      {item.quantity}x {isAr ? item.product.nameAr : item.product.nameEn}
                      {item.customization.selectedSize && (
                        <span className="text-amber-300 text-[11px]">
                          {' '}
                          ({isAr ? item.customization.selectedSize.nameAr : item.customization.selectedSize.nameEn})
                        </span>
                      )}
                    </p>
                    {item.customization.addOns && item.customization.addOns.length > 0 && (
                      <p className="text-[10px] text-stone-400">
                        + {item.customization.addOns.map((a) => (isAr ? a.nameAr : a.nameEn)).join(', ')}
                      </p>
                    )}
                    {item.customization.specialInstructions && (
                      <p className="text-[10px] text-stone-400 italic">
                        "{item.customization.specialInstructions}"
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-white whitespace-nowrap">
                    {formatCurrency(item.subtotal, lang)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-stone-800 flex justify-between items-center text-sm font-bold text-white">
              <span>{isAr ? 'إجمالي الطلب:' : 'Total Amount:'}</span>
              <span className="font-serif text-lg font-black text-amber-400">
                {formatCurrency(order.total, lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 sm:p-6 bg-[#161514] border-t border-stone-800 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => {
              onClose();
              onViewOrder?.();
            }}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all"
          >
            <span>{isAr ? 'متابعة الطلب في سجل طلباتي' : 'Track in My Orders'}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>

          {onPrintReceipt && (
            <button
              onClick={() => onPrintReceipt(order)}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold"
          >
            {isAr ? 'متابعة التصفح' : 'Continue Browsing'}
          </button>
        </div>
      </div>
    </div>
  );
};
