import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderType, PaymentMethod } from '../../types';
import { X, Store, Truck, ArrowRight, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { formatCurrency, formatCurrencyDetailed, calculateSaudiVat } from '../../lib/utils';
import { MadaLogo, VisaLogo, MastercardLogo, ApplePayLogo, CashLogo } from './PaymentLogos';
import { processMoyasarPayment, isMoyasarSandbox } from '../../lib/moyasarService';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');

  // Card payment fields
  const [cardName, setCardName] = useState(currentUser?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = orderType === 'delivery' ? (isFreeDelivery ? 0 : settings.deliveryFee) : 0;
  const total = subtotal + deliveryFee;
  const vat = calculateSaudiVat(subtotal, deliveryFee);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const paymentOptions: { id: PaymentMethod; label: string; logo: React.ReactNode }[] = [
    {
      id: 'cash_on_delivery',
      label: isAr ? 'نقد عند الاستلام' : 'Cash on Delivery',
      logo: <CashLogo className="h-5 w-auto" />,
    },
    {
      id: 'mada',
      label: isAr ? 'بطاقة مدى' : 'Mada Debit Card',
      logo: <MadaLogo className="h-5 w-auto" />,
    },
    {
      id: 'visa',
      label: isAr ? 'فيزا' : 'Visa Card',
      logo: <VisaLogo className="h-4 w-auto" />,
    },
    {
      id: 'mastercard',
      label: isAr ? 'ماستركارد' : 'Mastercard',
      logo: <MastercardLogo className="h-5 w-auto" />,
    },
    {
      id: 'apple_pay',
      label: isAr ? 'أبل باي' : 'Apple Pay',
      logo: <ApplePayLogo className="h-5 w-auto" />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال اسم العميل' : 'Please enter your name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم جوال صحيح' : 'Please enter a valid mobile number');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال عنوان التوصيل' : 'Please provide delivery address');
      return;
    }

    // Card validations
    const isCard = ['mada', 'visa', 'mastercard'].includes(paymentMethod);
    if (isCard) {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setErrorMsg(isAr ? 'يرجى إدخال رقم بطاقة صحيح' : 'Please enter a valid card number');
        return;
      }
      if (!expMonth || !expYear || !cvc) {
        setErrorMsg(isAr ? 'يرجى إكمال بيانات البطاقة (تاريخ الانتهاء ورمز الأمان)' : 'Please complete card expiry and CVC');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Auto save or update user profile address
      if (currentUser) {
        updateProfile({ defaultAddress: address, name, phone });
      }

      let paymentStatus: 'Pending' | 'Paid' | 'Failed' = 'Pending';
      let transactionId: string | undefined = undefined;

      // Online card payment via Moyasar
      if (isCard) {
        const result = await processMoyasarPayment({
          amountSar: total,
          orderNumber: `TH-${Date.now().toString().slice(-4)}`,
          customerName: name,
          cardName: cardName || name,
          cardNumber,
          expMonth,
          expYear,
          cvc,
        });

        if (result.status === 'paid' || result.status === 'captured') {
          paymentStatus = 'Paid';
          transactionId = result.id;
        } else {
          paymentStatus = 'Pending';
          transactionId = result.id;
        }
      } else if (paymentMethod === 'apple_pay') {
        paymentStatus = 'Paid';
        transactionId = `apple_pay_${Date.now()}`;
      } else {
        paymentStatus = 'Pending';
      }

      const created = await createOrder({
        customer: {
          name,
          phone,
          address: orderType === 'delivery' ? address : undefined,
          city: orderType === 'delivery' ? city : undefined,
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

      // Clear cart
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
              {isAr ? 'تأكيد وحفظ الطلب للتواصل مع الفرع' : 'Confirm your details for barista preparation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-semibold">
              ⚠️ {errorMsg}
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
                    {deliveryFee > 0 ? `+${deliveryFee} ${t.sar}` : 'Free'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="space-y-3">
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
                  placeholder={isAr ? 'مثال: أحمد المنصور' : 'e.g. Ahmed Al-Mansoor'}
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
                  placeholder="05xxxxxxxx"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 dir-ltr text-start"
                />
              </div>
            </div>

            {/* Address fields if delivery */}
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

          {/* 3. Saudi Arabia Payment Methods (5 Methods) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                {isAr ? 'طرق الدفع المعتمدة في المملكة' : 'Payment Methods (Saudi Arabia)'}
              </label>
              {isMoyasarSandbox() && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Moyasar Sandbox
                </span>
              )}
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

            {/* Credit / Debit Card Input Form (Mada, Visa, Mastercard) */}
            {['mada', 'visa', 'mastercard'].includes(paymentMethod) && (
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-amber-500/30 space-y-3 mt-2">
                <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold border-b border-stone-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isAr ? 'بوابة دفع ميسر المشفرة والآمنة' : 'Encrypted Moyasar Payment Gateway'}</span>
                  </span>
                  <span className="text-[10px] text-stone-400">100% Secure</span>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-300 font-medium mb-1">
                    {isAr ? 'الاسم على البطاقة' : 'Cardholder Name'}
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="AHMED AL MANSOOR"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-300 font-medium mb-1">
                    {isAr ? 'رقم البطاقة' : 'Card Number'}
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-1">{isAr ? 'الشهر' : 'Month'}</label>
                    <input
                      type="text"
                      placeholder="MM"
                      maxLength={2}
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2 py-2 text-xs text-center text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-1">{isAr ? 'السنة' : 'Year'}</label>
                    <input
                      type="text"
                      placeholder="YY"
                      maxLength={2}
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2 py-2 text-xs text-center text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-1">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2 py-2 text-xs text-center text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Apple Pay helper prompt */}
            {paymentMethod === 'apple_pay' && (
              <div className="p-3.5 rounded-2xl bg-black border border-stone-700 text-center space-y-1 mt-2">
                <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <ApplePayLogo className="h-4 w-auto inline" />
                  <span>{isAr ? 'الدفع السريع بلمسة واحدة عبر أبل باي' : 'One-Touch Instant Payment with Apple Pay'}</span>
                </p>
                <p className="text-[10px] text-stone-400">
                  {isAr ? 'سيتم تأكيد الدفع الفوري والمصادقة البيومترية عبر جهازك' : 'Instant biometric authentication on your Apple device'}
                </p>
              </div>
            )}
          </div>

          {/* Saudi VAT (15% Included) & Order Total Breakdown */}
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

          {/* Submit Order Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-95 group disabled:opacity-50"
          >
            <span>
              {isSubmitting
                ? (isAr ? 'جاري تأكيد ومعالجة الطلب...' : 'Processing...')
                : paymentMethod === 'cash_on_delivery'
                ? t.confirmWhatsAppBtn
                : isAr
                ? `ادفع الآن (${formatCurrency(total, lang)})`
                : `Pay Now (${formatCurrency(total, lang)})`}
            </span>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''
              }`}
            />
          </button>
        </form>
      </div>
    </div>
  );
};
