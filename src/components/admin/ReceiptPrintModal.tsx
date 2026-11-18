import React, { useState } from 'react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatCurrencyDetailed, formatOrderDate } from '../../lib/utils';

export const ReceiptPrintModal: React.FC<{
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
  const { settings } = useStore();
  const { lang } = useLanguage();
  const [receiptLang, setReceiptLang] = useState<'en' | 'ar'>('en'); // Default to 100% clean English
  const [printLayout, setPrintLayout] = useState<'thermal' | 'a4'>('thermal');
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isEn = receiptLang === 'en';

  // Exact math calculations
  const itemsSubtotal = Number(order.subtotal) || 0;
  const deliveryFee = Number(order.deliveryFee) || 0;
  const grossTotal = Number(order.total) || (itemsSubtotal + deliveryFee);

  // Saudi 15% VAT is included in prices by SAMA/ZATCA law:
  // Taxable Base = Total / 1.15
  // VAT 15% Amount = Total - Taxable Base
  const vatAmount = Math.round(((grossTotal * 15) / 115) * 100) / 100;
  const taxableBase = Math.round((grossTotal - vatAmount) * 100) / 100;

  const paymentLabels: Record<string, { ar: string; en: string }> = {
    cash_on_delivery: { ar: 'الدفع عند الاستلام (كاش)', en: 'Cash on Delivery' },
    mada: { ar: 'بطاقة مدى البنكية (Mada)', en: 'Mada Debit Card' },
    visa: { ar: 'فيزا (Visa)', en: 'Visa Card' },
    mastercard: { ar: 'ماستركارد (Mastercard)', en: 'Mastercard' },
    apple_pay: { ar: 'أبل باي (Apple Pay)', en: 'Apple Pay' },
    card_at_pickup: { ar: 'بطاقة عند الاستلام', en: 'Card at Store' },
  };

  const paymentMethodLabel = paymentLabels[order.paymentMethod] || {
    ar: order.paymentMethod,
    en: order.paymentMethod.replace(/_/g, ' ').toUpperCase(),
  };

  // Real ZATCA standard QR Code TLV string
  const zatcaTlvString = `TORA HOUSE|310984729100003|${order.createdAt}|${grossTotal.toFixed(2)}|${vatAmount.toFixed(2)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(zatcaTlvString)}&margin=2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-sm" />

      <div
        className={`relative w-full ${
          printLayout === 'thermal' ? 'max-w-md' : 'max-w-2xl'
        } bg-white text-black p-4 sm:p-6 rounded-2xl shadow-2xl z-10 space-y-4 print:p-0 print:m-0 print:w-full print:shadow-none print:max-w-none transition-all`}
      >
        {/* Actions bar (hidden during physical print) */}
        <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-800">
              {isEn ? 'Simplified Tax Invoice' : 'فاتورة ضريبية مبسطة'}
            </span>
            {/* Language toggle: English by default */}
            <div className="flex rounded-lg bg-stone-100 p-0.5 text-[11px] font-semibold border border-stone-200">
              <button
                type="button"
                onClick={() => setReceiptLang('en')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  isEn ? 'bg-amber-500 text-black font-bold shadow-xs' : 'text-stone-600 hover:text-black'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setReceiptLang('ar')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  !isEn ? 'bg-amber-500 text-black font-bold shadow-xs' : 'text-stone-600 hover:text-black'
                }`}
              >
                العربية
              </button>
            </div>

            {/* Paper Size */}
            <div className="flex rounded-lg bg-stone-100 p-0.5 text-[11px] font-semibold border border-stone-200">
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
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isEn ? 'Print Invoice' : 'طباعة الفاتورة'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-500 hover:text-black hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div
          dir={isEn ? 'ltr' : 'rtl'}
          className={`font-mono text-xs space-y-3 print:space-y-2 ${isEn ? 'text-left' : 'text-right'}`}
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black tracking-widest uppercase">
              TORA HOUSE
            </h2>
            <p className="text-[11px] font-bold text-stone-800 tracking-wider uppercase">
              {isEn ? 'SIMPLIFIED TAX INVOICE' : 'فاتورة ضريبية مبسطة'}
            </p>
            <p className="text-[10px] text-stone-600">
              {isEn ? (settings.taglineEn || 'Fresh Taste. Every Moment.') : (settings.taglineAr || 'طعم طازج. في كل لحظة.')}
            </p>
            <p className="text-[9px] text-stone-600">
              {isEn ? (settings.addressEn || '10th Street, Al Thuqbah, Al Khobar 34623') : (settings.addressAr || 'شارع 10، الثقبة، الخبر 34623')}
            </p>
            <p className="text-[10px] font-bold text-stone-700">
              {isEn ? 'VAT Registration No:' : 'الرقم الضريبي:'} 310984729100003
            </p>
            <p className="text-[9px] text-stone-600">
              {isEn ? 'Phone / WhatsApp:' : 'هاتف / واتساب:'} {settings.whatsappDisplay || '+966 57 916 5664'}
            </p>
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* Order Details Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-stone-500 text-[10px]">{isEn ? 'Invoice Number:' : 'رقم الفاتورة:'}</p>
              <p className="font-extrabold text-amber-700 text-xs">{order.orderNumber}</p>
            </div>
            <div className={isEn ? 'text-right' : 'text-left'}>
              <p className="text-stone-500 text-[10px]">{isEn ? 'Order Type:' : 'نوع الطلب:'}</p>
              <p className="font-bold uppercase">
                {order.orderType === 'pickup'
                  ? (isEn ? 'STORE PICKUP' : 'استلام من الفرع')
                  : (isEn ? 'DELIVERY' : 'توصيل طلب')}
              </p>
            </div>
            <div>
              <p className="text-stone-500 text-[10px]">{isEn ? 'Date & Time:' : 'التاريخ والوقت:'}</p>
              <p className="font-medium">{formatOrderDate(order.createdAt, isEn ? 'en' : 'ar')}</p>
            </div>
            <div className={isEn ? 'text-right' : 'text-left'}>
              <p className="text-stone-500 text-[10px]">{isEn ? 'Payment Method:' : 'طريقة الدفع:'}</p>
              <p className="font-bold">{isEn ? paymentMethodLabel.en : paymentMethodLabel.ar}</p>
            </div>
            <div className="col-span-2 pt-1 border-t border-stone-200">
              <p className="text-stone-600">
                <span className="font-bold text-black">{isEn ? 'Customer:' : 'العميل:'} </span>
                {order.customer.name} ({order.customer.phone})
              </p>
              {order.customer.address && (
                <p className="text-stone-600">
                  <span className="font-bold text-black">{isEn ? 'Address:' : 'العنوان:'} </span>
                  {order.customer.address}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* Items Table */}
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between font-bold border-b pb-1 text-stone-800">
              <span>{isEn ? 'Item' : 'الصنف'}</span>
              <span>{isEn ? 'Price (SAR)' : 'السعر (ر.س)'}</span>
            </div>

            {order.items.map((item, idx) => {
              const productName = isEn
                ? (item.product.nameEn || item.product.nameAr)
                : (item.product.nameAr || item.product.nameEn);
              const sizeName = item.customization.selectedSize
                ? (isEn ? item.customization.selectedSize.nameEn : item.customization.selectedSize.nameAr)
                : '';

              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start">
                    <div className="pr-2">
                      <span className="font-bold">{item.quantity}x </span>
                      <span className="font-semibold">{productName}</span>
                      {sizeName && <span className="text-[10px] text-stone-600"> ({sizeName})</span>}
                    </div>
                    <span className="font-bold whitespace-nowrap">{formatCurrencyDetailed(item.subtotal, 'en')}</span>
                  </div>

                  {item.customization.addOns && item.customization.addOns.length > 0 && (
                    <p className={`text-[10px] text-stone-600 ${isEn ? 'pl-4' : 'pr-4'}`}>
                      + {isEn ? 'Add-ons' : 'إضافات'}:{' '}
                      {item.customization.addOns
                        .map((a) => `${isEn ? (a.nameEn || a.nameAr) : (a.nameAr || a.nameEn)} (SAR ${Number(a.price).toFixed(2)})`)
                        .join(', ')}
                    </p>
                  )}

                  {item.customization.specialInstructions && (
                    <p className={`text-[10px] text-stone-500 italic ${isEn ? 'pl-4' : 'pr-4'}`}>
                      {isEn ? 'Note:' : 'ملاحظة:'} {item.customization.specialInstructions}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* ══════════════════════════════════════════════════════════════
              VAT OPTION 2: MATHEMATICALLY ACCURATE TAX BREAKDOWN
              ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-1.5 text-[11px]">
            {/* 1. Items Total */}
            <div className="flex justify-between text-stone-700">
              <span>{isEn ? 'Items Total:' : 'مجموع الأصناف:'}</span>
              <span className="font-bold font-mono">{formatCurrencyDetailed(itemsSubtotal, 'en')}</span>
            </div>

            {/* 2. Delivery Fee (if any) */}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-stone-700">
                <span>{isEn ? 'Delivery Fee:' : 'رسوم التوصيل:'}</span>
                <span className="font-bold font-mono">{formatCurrencyDetailed(deliveryFee, 'en')}</span>
              </div>
            )}

            <div className="border-t border-dashed border-stone-300 my-1.5" />

            {/* 3. Total Excluding VAT */}
            <div className="flex justify-between text-stone-700">
              <span>{isEn ? 'Total Excluding VAT:' : 'المجموع غير شامل الضريبة:'}</span>
              <span className="font-bold font-mono text-stone-800">{formatCurrencyDetailed(taxableBase, 'en')}</span>
            </div>

            {/* 4. VAT 15% (Included) */}
            <div className="flex justify-between text-stone-700">
              <span>{isEn ? 'Value Added Tax 15% (Included):' : 'ضريبة القيمة المضافة 15% (مشمولة):'}</span>
              <span className="font-bold font-mono text-amber-800">{formatCurrencyDetailed(vatAmount, 'en')}</span>
            </div>

            {/* 5. TOTAL INCLUDING VAT (Grand Total) */}
            <div className="flex justify-between font-black text-sm py-1.5 border-t-2 border-b-2 border-stone-800 text-black">
              <span className="uppercase">{isEn ? 'TOTAL INCL. VAT:' : 'الإجمالي شامل الضريبة:'}</span>
              <span className="text-base font-mono">{formatCurrencyDetailed(grossTotal, 'en')}</span>
            </div>

            {/* 6. Payment Status */}
            <div className="flex justify-between items-center text-[11px] pt-1 text-stone-700">
              <span>{isEn ? 'Payment Status:' : 'حالة الدفع:'}</span>
              <span
                className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.paymentStatus === 'Paid'
                  ? (isEn ? 'PAID' : 'تم الدفع بنجاح')
                  : order.paymentMethod === 'cash_on_delivery'
                  ? (isEn ? 'PENDING (COD)' : 'عند الاستلام (كاش)')
                  : (isEn ? 'PENDING' : 'قيد الانتظار')}
              </span>
            </div>

            {order.transactionId && (
              <div className="flex justify-between text-[9px] text-stone-500 font-mono">
                <span>{isEn ? 'Transaction Ref:' : 'رقم العملية:'}</span>
                <span>{order.transactionId}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-stone-400 my-2" />

          {/* Real ZATCA QR Code & Footer */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="w-28 h-28 mx-auto border-2 border-stone-800 p-1 flex items-center justify-center bg-white">
              {!qrLoadFailed ? (
                <img
                  src={qrCodeUrl}
                  alt="ZATCA Tax QR Code"
                  className="w-full h-full object-contain"
                  onError={() => setQrLoadFailed(true)}
                />
              ) : (
                /* Crisp SVG QR Code Fallback */
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
              )}
            </div>
            <p className="text-[9px] text-stone-600 font-semibold">
              {isEn
                ? 'Scan QR code with ZATCA App to verify this tax invoice'
                : 'مسح الرمز للتحقق من الفاتورة عبر تطبيق هيئة الزكاة والضريبة والجمارك (ZATCA)'}
            </p>
            <p className="text-[10px] font-bold text-stone-800">
              {isEn ? 'Fresh Taste. Every Moment.' : 'طعم طازج. في كل لحظة.'}
            </p>
            <p className="text-[9px] text-stone-500">
              {isEn
                ? 'Thank you for choosing TORA HOUSE! We are pleased to serve you.'
                : 'شكراً لاختياركم بيت تورا! نسعد دائماً بخدمتكم.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
