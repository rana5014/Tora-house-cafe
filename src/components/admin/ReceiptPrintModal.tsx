import React, { useState } from 'react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Printer, X, Coffee, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatCurrencyDetailed, formatOrderDate, calculateSaudiVat } from '../../lib/utils';

export const ReceiptPrintModal: React.FC<{
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const { settings } = useStore();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';
  const [printLayout, setPrintLayout] = useState<'thermal' | 'a4'>('thermal');

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const vat = calculateSaudiVat(order.subtotal, order.deliveryFee || 0);
  const subtotalExclVat = order.subtotalExclVat ?? vat.subtotalExclVat;
  const vatAmount = order.tax > 0 ? order.tax : vat.vatAmount;

  const paymentLabels: Record<string, { ar: string; en: string }> = {
    cash_on_delivery: { ar: 'نقد عند الاستلام', en: 'Cash on Delivery' },
    mada: { ar: 'بطاقة مدى', en: 'Mada Debit Card' },
    visa: { ar: 'فيزا', en: 'Visa' },
    mastercard: { ar: 'ماستركارد', en: 'Mastercard' },
    apple_pay: { ar: 'أبل باي', en: 'Apple Pay' },
    card_at_pickup: { ar: 'بطاقة بالفرع', en: 'Card at Store' },
  };

  const paymentMethodLabel = paymentLabels[order.paymentMethod] || {
    ar: order.paymentMethod,
    en: order.paymentMethod,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-sm" />

      <div
        className={`relative w-full ${
          printLayout === 'thermal' ? 'max-w-md' : 'max-w-2xl'
        } bg-white text-black p-4 sm:p-6 rounded-2xl shadow-2xl z-10 space-y-4 print:p-0 print:m-0 print:w-full print:shadow-none print:max-w-none transition-all`}
      >
        {/* Actions bar (hidden during print) */}
        <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700">
              {isAr ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}
            </span>
            <div className="flex rounded-lg bg-stone-100 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPrintLayout('thermal')}
                className={`px-2 py-0.5 rounded-md ${
                  printLayout === 'thermal' ? 'bg-black text-white' : 'text-stone-600'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('a4')}
                className={`px-2 py-0.5 rounded-md ${
                  printLayout === 'a4' ? 'bg-black text-white' : 'text-stone-600'
                }`}
              >
                A4
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-stone-500 hover:text-black hover:bg-stone-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className="font-mono text-xs space-y-3 print:space-y-2">
          {/* Header & ZATCA Header */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black tracking-widest uppercase">
              TORA HOUSE • بيت تورا
            </h2>
            <p className="text-[10px] font-bold text-stone-700 uppercase">
              فاتورة ضريبية مبسطة • SIMPLIFIED TAX INVOICE
            </p>
            <p className="text-[9px] text-stone-600">
              {settings.cafeNameAr} • {settings.taglineAr}
            </p>
            <p className="text-[9px] text-stone-500">
              {settings.addressAr}
            </p>
            <p className="text-[9px] text-stone-500">
              الرقم الضريبي (VAT ID): 310984729100003
            </p>
            <p className="text-[9px] text-stone-500">
              هاتف / واتساب: {settings.whatsappDisplay}
            </p>
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* Order Details Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="font-bold">رقم الفاتورة / Invoice:</p>
              <p className="font-bold text-amber-600 text-xs">{order.orderNumber}</p>
            </div>
            <div className="text-end">
              <p className="font-bold">نوع الطلب / Type:</p>
              <p className="font-bold uppercase">
                {order.orderType === 'pickup' ? 'استلام من الفرع (Pickup)' : 'توصيل طلب (Delivery)'}
              </p>
            </div>
            <div>
              <p className="text-stone-600">التاريخ / Date:</p>
              <p>{formatOrderDate(order.createdAt, 'en')}</p>
            </div>
            <div className="text-end">
              <p className="text-stone-600">طريقة الدفع / Payment:</p>
              <p className="font-semibold">{paymentMethodLabel.ar} ({paymentMethodLabel.en})</p>
            </div>
            <div className="col-span-2 pt-1 border-t border-stone-200">
              <p className="text-stone-600">العميل / Customer: <span className="text-black font-semibold">{order.customer.name}</span> ({order.customer.phone})</p>
              {order.customer.address && (
                <p className="text-stone-600">العنوان / Address: <span className="text-black font-medium">{order.customer.address}</span></p>
              )}
            </div>
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* Items Table */}
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between font-bold border-b pb-1 text-stone-800">
              <span>الصنف / Item</span>
              <span>السعر (ر.س) / Price</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold">{item.quantity}x </span>
                    <span className="font-semibold">{item.product.nameAr} - {item.product.nameEn}</span>
                    {item.customization.selectedSize && (
                      <span className="text-[10px] text-stone-600"> ({item.customization.selectedSize.nameAr})</span>
                    )}
                  </div>
                  <span className="font-bold whitespace-nowrap">{formatCurrencyDetailed(item.subtotal, 'en')}</span>
                </div>
                {item.customization.addOns && item.customization.addOns.length > 0 && (
                  <p className="text-[10px] text-stone-600 pl-4 rtl:pr-4">
                    + إضافات: {item.customization.addOns.map((a) => `${a.nameAr} (${a.price} ر.س)`).join('، ')}
                  </p>
                )}
                {item.customization.specialInstructions && (
                  <p className="text-[10px] text-stone-500 pl-4 rtl:pr-4 italic">
                    ملاحظة: {item.customization.specialInstructions}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* Saudi VAT Calculation Breakdown (15% Included) */}
          <div className="space-y-1 text-end text-[11px]">
            <div className="flex justify-between text-stone-700">
              <span>المجموع غير شامل الضريبة / Subtotal Excl. VAT:</span>
              <span className="font-bold">{formatCurrencyDetailed(subtotalExclVat, 'en')}</span>
            </div>

            <div className="flex justify-between text-stone-700">
              <span>ضريبة القيمة المضافة 15% (مشمولة) / VAT 15% (Included):</span>
              <span className="font-bold text-amber-700">{formatCurrencyDetailed(vatAmount, 'en')}</span>
            </div>

            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-stone-700">
                <span>رسوم التوصيل / Delivery Fee:</span>
                <span className="font-bold">{formatCurrencyDetailed(order.deliveryFee, 'en')}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm pt-1.5 border-t-2 border-stone-800 text-black">
              <span>الإجمالي شامل الضريبة / TOTAL INCL. VAT:</span>
              <span className="text-base">{formatCurrencyDetailed(order.total, 'en')}</span>
            </div>

            <div className="flex justify-between text-[10px] pt-1 text-stone-600">
              <span>حالة الدفع / Payment Status:</span>
              <span className="font-bold uppercase text-emerald-700">
                {order.paymentStatus || (order.paymentMethod === 'cash_on_delivery' ? 'Pending (COD)' : 'Paid')}
              </span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between text-[9px] text-stone-500 font-mono">
                <span>رقم العملية / Ref:</span>
                <span>{order.transactionId}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* ZATCA QR Code Representation & Footer */}
          <div className="text-center space-y-1 pt-1">
            <div className="w-24 h-24 mx-auto border-2 border-stone-800 p-1 flex flex-col items-center justify-center bg-white">
              {/* Crisp SVG QR Code Placeholder with ZATCA spec pattern */}
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                <rect x="5" y="5" width="25" height="25" fill="#000" />
                <rect x="9" y="9" width="17" height="17" fill="#fff" />
                <rect x="13" y="13" width="9" height="9" fill="#000" />

                <rect x="70" y="5" width="25" height="25" fill="#000" />
                <rect x="74" y="9" width="17" height="17" fill="#fff" />
                <rect x="78" y="13" width="9" height="9" fill="#000" />

                <rect x="5" y="70" width="25" height="25" fill="#000" />
                <rect x="9" y="74" width="17" height="17" fill="#fff" />
                <rect x="13" y="78" width="9" height="9" fill="#000" />

                <rect x="35" y="10" width="5" height="20" fill="#000" />
                <rect x="45" y="5" width="15" height="5" fill="#000" />
                <rect x="45" y="15" width="5" height="15" fill="#000" />
                <rect x="55" y="15" width="8" height="8" fill="#000" />

                <rect x="35" y="35" width="30" height="30" fill="#000" />
                <rect x="40" y="40" width="20" height="20" fill="#fff" />
                <rect x="46" y="46" width="8" height="8" fill="#000" />

                <rect x="10" y="35" width="20" height="5" fill="#000" />
                <rect x="25" y="45" width="5" height="20" fill="#000" />

                <rect x="70" y="35" width="20" height="5" fill="#000" />
                <rect x="75" y="45" width="5" height="15" fill="#000" />
                <rect x="85" y="50" width="10" height="15" fill="#000" />

                <rect x="35" y="70" width="15" height="5" fill="#000" />
                <rect x="40" y="80" width="20" height="5" fill="#000" />
                <rect x="55" y="70" width="5" height="25" fill="#000" />
                <rect x="70" y="75" width="25" height="20" fill="#000" />
              </svg>
            </div>
            <p className="text-[9px] text-stone-600 font-semibold">
              مسح الرمز للتحقق من الفاتورة عبر تطبيق هيئة الزكاة والضريبة والجمارك (ZATCA)
            </p>
            <p className="text-[10px] font-bold text-stone-700">
              طعم طازج. في كل لحظة. • Fresh Taste. Every Moment.
            </p>
            <p className="text-[9px] text-stone-500">
              شكراً لاختياركم بيت تورا! نسعد دائماً بخدمتكم.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
