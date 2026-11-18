import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderType, PaymentMethod } from '../../types';
import { X, Store, Truck, ArrowRight, ShieldCheck, CheckCircle2, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency, formatCurrencyDetailed, calculateSaudiVat } from '../../lib/utils';
import { MadaLogo, VisaLogo, MastercardLogo, ApplePayLogo, CashLogo } from './PaymentLogos';
import {
  getMoyasarKey,
  isMoyasarSandbox,
  loadMoyasarSDK,
  savePendingCheckoutOrder,
} from '../../lib/moyasarService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCompleted,
}) => {
  const { items, subtotal, clearCart } = useCart();
  const { lang, t, dir } = useLanguage();
  const { settings, createOrder } = useStore();
  const { currentUser, updateProfile } = useAuth();
  const isAr = lang === 'ar';

  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.defaultAddress || '');
  const [city, setCity] = useState('Riyadh');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mada');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMoyasarLoading, setIsMoyasarLoading] = useState(false);
  const [moyasarInitError, setMoyasarInitError] = useState('');

  const moyasarContainerRef = useRef<HTMLDivElement>(null);
  const isCard = ['mada', 'visa', 'mastercard'].includes(paymentMethod);

  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = orderType === 'delivery' ? (isFreeDelivery ? 0 : settings.deliveryFee) : 0;
  const total = subtotal + deliveryFee;
  const vat = calculateSaudiVat(subtotal, deliveryFee);
  const activeMoyasarKey = getMoyasarKey(settings.moyasarPublishableKey);
  const isSandbox = isMoyasarSandbox(activeMoyasarKey);

  // Keep pending order in localStorage updated so if 3DS redirects, order is ready
  useEffect(() => {
    if (isOpen && items.length > 0) {
      savePendingCheckoutOrder({
        customer: {
          name: name.trim() || 'Customer',
          phone: phone.trim() || '966500000000',
          address: orderType === 'delivery' ? address.trim() : undefined,
          city: orderType === 'delivery' ? city.trim() : undefined,
          notes: notes.trim() || undefined,
        },
        items,
        orderType,
        subtotal,
        subtotalExclVat: vat.subtotalExclVat,
        tax: vat.vatAmount,
        deliveryFee,
        total,
        paymentMethod,
      });
    }
  }, [isOpen, items, name, phone, address, city, notes, orderType, subtotal, vat, deliveryFee, total, paymentMethod]);

  // Mount official Moyasar Form when card payment is selected
  useEffect(() => {
    if (!isOpen || !isCard) return;

    let isMounted = true;
    setIsMoyasarLoading(true);
    setMoyasarInitError('');

    const initForm = async () => {
      try {
        await loadMoyasarSDK();
        if (!isMounted) return;

        const Moyasar = (window as any).Moyasar;
        if (!Moyasar || !Moyasar.init) {
          throw new Error('Moyasar Payment SDK could not be loaded');
        }

        // Clean existing container contents before re-init
        const container = document.getElementById('tora-moyasar-form');
        if (container) {
          container.innerHTML = '';
        }

        const halalas = Math.round(total * 100);
        const callbackUrl = window.location.origin + window.location.pathname;

        Moyasar.init({
          element: '#tora-moyasar-form',
          amount: halalas,
          currency: 'SAR',
          description: `TORA HOUSE - ${name || 'Order'} (${items.length} items)`,
          publishable_api_key: activeMoyasarKey,
          callback_url: callbackUrl,
          methods: ['creditcard'],
          on_completed: async (payment: any) => {
            if (payment && (payment.status === 'paid' || payment.status === 'captured')) {
              try {
                const created = await createOrder({
                  customer: {
                    name: name.trim() || 'Customer',
                    phone: phone.trim() || '966500000000',
                    address: orderType === 'delivery' ? address.trim() : undefined,
                    city: orderType === 'delivery' ? city.trim() : undefined,
                    notes: notes.trim() || undefined,
                  },
                  items,
                  subtotal,
                  subtotalExclVat: vat.subtotalExclVat,
                  tax: vat.vatAmount,
                  deliveryFee,
                  total,
                  orderType,
                  paymentMethod: payment.source?.company || paymentMethod,
                  paymentStatus: 'Paid',
                  transactionId: payment.id,
                  pickupTime: orderType === 'pickup' ? '15–20 mins' : undefined,
                });
                clearCart();
                onOrderCompleted(created);
              } catch (e: any) {
                console.error('Order creation error:', e);
              }
            }
          },
          on_failed: (error: any) => {
            console.error('[Moyasar] Payment failure:', error);
            setErrorMsg(error?.message || (isAr ? 'فشلت عملية الدفع. يرجى التحقق من البطاقة.' : 'Payment failed. Please check card balance or 3DS.'));
          },
        });

        // Intercept form submit inside container to ensure latest details are saved to localStorage before 3DS redirect
        setTimeout(() => {
          if (!container) return;
          const formEl = container.querySelector('form');
          if (formEl) {
            formEl.addEventListener('submit', () => {
              savePendingCheckoutOrder({
                customer: {
                  name: name.trim() || 'Customer',
                  phone: phone.trim() || '966500000000',
                  address: orderType === 'delivery' ? address.trim() : undefined,
                  city: orderType === 'delivery' ? city.trim() : undefined,
                  notes: notes.trim() || undefined,
                },
                items,
                orderType,
                subtotal,
                subtotalExclVat: vat.subtotalExclVat,
                tax: vat.vatAmount,
                deliveryFee,
                total,
                paymentMethod,
              });
            });
          }
        }, 500);

        setIsMoyasarLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Moyasar Init Error:', err);
        setIsMoyasarLoading(false);
        setMoyasarInitError(err.message || 'Failed to initialize payment gateway');
      }
    };

    initForm();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isCard, total, activeMoyasarKey, name, phone, address, city, notes, orderType, paymentMethod]);

  if (!isOpen) return null;

  const paymentOptions: { id: PaymentMethod; label: string; logo: React.ReactNode }[] = [
    {
      id: 'mada',
      label: isAr ? 'بطاقة مدى البنكية (Mada)' : 'Mada Debit Card',
      logo: <MadaLogo className="h-4 w-auto inline" />,
    },
    {
      id: 'visa',
      label: 'Visa Card',
      logo: <VisaLogo className="h-3.5 w-auto inline" />,
    },
    {
      id: 'mastercard',
      label: 'Mastercard',
      logo: <MastercardLogo className="h-4 w-auto inline" />,
    },
    {
      id: 'apple_pay',
      label: 'Apple Pay',
      logo: <ApplePayLogo className="h-4 w-auto inline" />,
    },
    {
      id: 'cash_on_delivery',
      label: isAr ? 'الدفع عند الاستلام (كاش)' : 'Cash on Delivery',
      logo: <CashLogo className="h-4 w-auto inline" />,
    },
  ];

  // Submission handler for Cash on Delivery & Apple Pay
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال اسم العميل' : 'Please provide your name');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم الجوال' : 'Please provide your phone number');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال عنوان التوصيل' : 'Please provide delivery address');
      return;
    }

    try {
      setIsSubmitting(true);

      if (currentUser) {
        updateProfile({ defaultAddress: address, name, phone });
      }

      let paymentStatus: 'Pending' | 'Paid' | 'Failed' = 'Pending';
      let transactionId: string | undefined = undefined;

      if (paymentMethod === 'apple_pay') {
        paymentStatus = 'Paid';
        transactionId = `apple_pay_${Date.now()}`;
      } else {
        paymentStatus = 'Pending';
      }

      const created = await createOrder({
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: orderType === 'delivery' ? address.trim() : undefined,
          city: orderType === 'delivery' ? city.trim() : undefined,
          notes: notes.trim() || undefined,
        },
        items,
        subtotal,
        subtotalExclVat: vat.subtotalExclVat,
        tax: vat.vatAmount,
        deliveryFee,
        total,
        orderType,
        paymentMethod,
        paymentStatus,
        transactionId,
        pickupTime: orderType === 'pickup' ? '15–20 mins' : undefined,
      });

      clearCart();
      setIsSubmitting(false);
      onOrderCompleted(created);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || (isAr ? 'فشل إتمام الطلب' : 'Failed to submit order'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-xl bg-[#141210] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">{t.checkoutTitle}</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {isAr ? 'تأكيد وحفظ الطلب والدفع الإلكتروني الآمن' : 'Confirm your details and proceed to secure payment'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Order Type Tabs: Pickup vs Delivery */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              {t.checkoutOrderType}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`p-3.5 rounded-2xl border text-start transition-all flex items-center gap-3 ${
                  orderType === 'pickup'
                    ? 'border-amber-400 bg-amber-500/15 text-white shadow-gold-sm'
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700'
                }`}
              >
                <Store className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">{t.typePickup}</p>
                  <p className="text-[10px] text-amber-300/80 mt-0.5">{t.pickupTimeEst}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-3.5 rounded-2xl border text-start transition-all flex items-center gap-3 ${
                  orderType === 'delivery'
                    ? 'border-amber-400 bg-amber-500/15 text-white shadow-gold-sm'
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700'
                }`}
              >
                <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">{t.typeDelivery}</p>
                  <p className="text-[10px] text-amber-300/80 mt-0.5">
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee, lang)}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              {isAr ? 'بيانات العميل والتوصيل' : 'Customer & Delivery Information'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.custName} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'الاسم الكريم' : 'Full Name'}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.custPhone} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {orderType === 'delivery' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    {t.custAddress} *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isAr ? 'الرياض، حي الملقا، شارع...' : 'District, Street, Villa/Apartment'}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    {t.custCity}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {t.custNotes}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? 'أي ملاحظات للباريستا أو سائق التوصيل...' : 'Any extra instructions for prep or arrival...'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* 3. Saudi Arabia Payment Methods */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                {isAr ? 'طرق الدفع المعتمدة في المملكة' : 'Payment Methods (Saudi Arabia)'}
              </label>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${
                  !isSandbox
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${!isSandbox ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{!isSandbox ? 'Moyasar Live' : 'Moyasar Sandbox'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {paymentOptions.map((p) => {
                const isSelected = paymentMethod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id)}
                    className={`p-3 rounded-2xl border text-start transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 text-white shadow-gold-sm ring-1 ring-amber-400/50'
                        : 'border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0">{p.logo}</div>
                      <span className="font-semibold text-xs truncate">{p.label}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Official Moyasar Embedded Form for Mada, Visa, Mastercard */}
            {isCard && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-amber-500/30 space-y-3 mt-2">
                <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold border-b border-stone-800 pb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isAr ? 'بوابة ميسر للمدفوعات — التحقق البنكي 3D Secure' : 'Moyasar Payment Gateway — 3D Secure Bank Verification'}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>PCI-DSS Verified</span>
                  </span>
                </div>

                {isMoyasarLoading && (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                    <span>{isAr ? 'جاري الاتصال الآمن ببوابة ميسر...' : 'Connecting to secure Moyasar gateway...'}</span>
                  </div>
                )}

                {moyasarInitError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                    ⚠️ {moyasarInitError}
                  </div>
                )}

                {/* Moyasar SDK mounts its official payment form here */}
                <div id="tora-moyasar-form" ref={moyasarContainerRef} className="mysr-form min-h-[140px]" />

                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 text-[10px] text-stone-400 flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {isAr
                      ? 'عند النقر على إتمام الدفع، سيتم توجيهك إلى صفحة التحقق الآمنة لبنكك الخاص لإدخال رمز التحقق OTP عبر رسالة نصية.'
                      : 'When you proceed, you will be redirected to your Saudi bank 3D Secure page to enter the SMS verification OTP code.'}
                  </p>
                </div>
              </div>
            )}

            {/* Apple Pay helper */}
            {paymentMethod === 'apple_pay' && (
              <div className="p-3.5 rounded-2xl bg-black border border-stone-700 text-center space-y-2 mt-2">
                <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <ApplePayLogo className="h-4 w-auto inline" />
                  <span>{isAr ? 'الدفع السريع بلمسة واحدة عبر أبل باي' : 'One-Touch Instant Payment with Apple Pay'}</span>
                </p>
                <p className="text-[10px] text-stone-400">
                  {isAr ? 'سيتم تأكيد الدفع الفوري والمصادقة البيومترية عبر جهازك' : 'Instant biometric authentication on your Apple device'}
                </p>
                <button
                  type="button"
                  onClick={handleDirectSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-white hover:bg-stone-200 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <ApplePayLogo className="h-4 w-auto inline" />
                  <span>{isAr ? `ادفع الآن (${formatCurrency(total, lang)})` : `Pay with Apple Pay (${formatCurrency(total, lang)})`}</span>
                </button>
              </div>
            )}
          </div>

          {/* Saudi VAT (15% Included) & Total Breakdown */}
          <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>{isAr ? 'المجموع غير شامل الضريبة:' : 'Subtotal (Excl. 15% VAT):'}</span>
              <span className="font-semibold text-stone-300 font-mono">{formatCurrencyDetailed(vat.subtotalExclVat, lang)}</span>
            </div>

            <div className="flex justify-between text-stone-400">
              <span className="flex items-center gap-1">
                <span>{isAr ? 'ضريبة القيمة المضافة (15% مشمولة):' : 'VAT 15% (Included):'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400">ZATCA</span>
              </span>
              <span className="font-semibold text-amber-400 font-mono">{formatCurrencyDetailed(vat.vatAmount, lang)}</span>
            </div>

            {orderType === 'delivery' && (
              <div className="flex justify-between text-stone-400">
                <span>{t.cartDeliveryFee}</span>
                <span className="font-bold text-amber-400">
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee, lang)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-sm font-bold text-white">
              <span>{isAr ? 'المجموع الإجمالي (شامل الضريبة):' : 'Gross Total (Incl. VAT):'}</span>
              <span className="font-serif text-lg font-black text-amber-400 font-mono">
                {formatCurrency(total, lang)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed">
            {t.checkoutDisclaimer}
          </p>

          {/* Submit Order Button (for Cash on Delivery) */}
          {paymentMethod === 'cash_on_delivery' && (
            <button
              type="button"
              onClick={handleDirectSubmit}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <span>
                {isSubmitting
                  ? (isAr ? 'جاري تأكيد ومعالجة الطلب...' : 'Processing...')
                  : t.confirmWhatsAppBtn}
              </span>
              <ArrowRight
                className={`w-4 h-4 transition-transform ${
                  dir === 'rtl' ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
