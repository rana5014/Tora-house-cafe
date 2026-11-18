import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Order, OrderStatus } from '../../types';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Flame,
  DollarSign,
  ArrowUpRight,
  KeyRound,
  Coffee,
  Receipt,
  CreditCard,
  Banknote,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatCurrencyDetailed, formatOrderDate } from '../../lib/utils';

export const AdminOverview: React.FC<{
  onSelectTab: (tab: any) => void;
  onOpenReceipt: (order: Order) => void;
}> = ({ onSelectTab, onOpenReceipt }) => {
  const { orders, products, updateOrderStatus } = useStore();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const totalOrders = orders.length;
  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  const grossRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const vatCollected = Math.round(((grossRevenue * 15) / 115) * 100) / 100;
  const netRevenue = Math.round((grossRevenue - vatCollected) * 100) / 100;

  // Payment Breakdown
  const codOrders = validOrders.filter((o) => o.paymentMethod === 'cash_on_delivery');
  const onlineOrders = validOrders.filter((o) => o.paymentMethod !== 'cash_on_delivery');
  const codTotal = codOrders.reduce((s, o) => s + o.total, 0);
  const onlineTotal = onlineOrders.reduce((s, o) => s + o.total, 0);

  const paidOrders = validOrders.filter(
    (o) => o.paymentStatus === 'Paid' || (!o.paymentStatus && o.paymentMethod !== 'cash_on_delivery')
  ).length;
  const pendingPaymentOrders = validOrders.filter(
    (o) => o.paymentStatus === 'Pending' || (!o.paymentStatus && o.paymentMethod === 'cash_on_delivery')
  ).length;

  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;

  // Today's orders (within last 24h)
  const oneDayAgo = Date.now() - 24 * 3600 * 1000;
  const todayOrders = orders.filter((o) => new Date(o.createdAt).getTime() > oneDayAgo).length;

  // Best selling product
  const bestSeller = products.find((p) => p.isBestSeller) || products[0];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">{t.adminStatTotalRevenue}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-black text-amber-400">
            {formatCurrency(grossRevenue, lang)}
          </p>
          <span className="text-[10px] text-emerald-400 font-medium">
            +18% from last week
          </span>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">{t.adminStatTotalOrders}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-black text-white">
            {totalOrders}
          </p>
          <span className="text-[10px] text-stone-400">
            {todayOrders} today
          </span>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">{t.adminStatPendingOrders}</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-black text-orange-400">
            {pendingOrders}
          </p>
          <span className="text-[10px] text-orange-300">
            Awaiting preparation
          </span>
        </div>

        {/* Top Seller */}
        <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">{t.adminStatPopularProduct}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-lg font-bold text-white line-clamp-1">
            {isAr ? bestSeller?.nameAr : bestSeller?.nameEn}
          </p>
          <span className="text-[10px] text-amber-400 font-medium">
            Signature drink
          </span>
        </div>
      </div>

      {/* Saudi VAT (15%) & Financial Reports Card */}
      <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'التقرير المالي وضريبة القيمة المضافة (ZATCA 15%)' : 'Financial & Saudi VAT Report (ZATCA 15%)'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isAr ? 'حسابات دقيقة وفقاً لمعادلة الضريبة المشمولة: المبلغ * 15 / 115' : 'Calculated using VAT-inclusive formula: Gross * 15 / 115'}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            15% VAT Included
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-1">
            <span className="text-[11px] text-stone-400">
              {isAr ? 'إجمالي المبيعات (شامل الضريبة)' : 'Gross Revenue (Incl. VAT)'}
            </span>
            <p className="text-lg font-bold text-white font-mono">
              {formatCurrencyDetailed(grossRevenue, lang)}
            </p>
            <span className="text-[10px] text-stone-500">{validOrders.length} {isAr ? 'طلباً نشطاً' : 'active orders'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-1">
            <span className="text-[11px] text-stone-400">
              {isAr ? 'المبيعات الصافية (غير شامل الضريبة)' : 'Net Sales (Excl. VAT)'}
            </span>
            <p className="text-lg font-bold text-stone-300 font-mono">
              {formatCurrencyDetailed(netRevenue, lang)}
            </p>
            <span className="text-[10px] text-stone-500">Gross / 1.15</span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-950/80 border border-amber-500/30 space-y-1">
            <span className="text-[11px] text-amber-400 font-semibold">
              {isAr ? 'ضريبة القيمة المضافة المحصلة (15%)' : 'VAT 15% Collected'}
            </span>
            <p className="text-lg font-black text-amber-400 font-mono">
              {formatCurrencyDetailed(vatCollected, lang)}
            </p>
            <span className="text-[10px] text-amber-300/80">ZATCA Tax Due</span>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-stone-950/50 border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">
                  {isAr ? 'مدفوعات إلكترونية (مدى / فيزا / أبل باي)' : 'Online (Mada / Visa / Apple Pay)'}
                </p>
                <p className="text-[10px] text-stone-400">{onlineOrders.length} {isAr ? 'طلبات' : 'orders'}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {formatCurrencyDetailed(onlineTotal, lang)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950/50 border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Banknote className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">
                  {isAr ? 'نقد عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                </p>
                <p className="text-[10px] text-stone-400">{codOrders.length} {isAr ? 'طلبات' : 'orders'}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {formatCurrencyDetailed(codTotal, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectTab('settings')}
          className="p-4 rounded-2xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800 hover:border-amber-400 text-start flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
              {isAr ? '🔑 تغيير الـ PIN' : '🔑 Change PIN'}
            </p>
            <p className="text-[10px] text-stone-400">
              {isAr ? 'تأمين حساب الإدارة' : 'Secure Admin PIN'}
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('products')}
          className="p-4 rounded-2xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/30 text-start flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
              {isAr ? '✏️ إدارة المنتجات' : '✏️ Edit Menu'}
            </p>
            <p className="text-[10px] text-stone-400">
              {isAr ? 'رفع صور وقوائم' : 'Images & items'}
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('addons')}
          className="p-4 rounded-2xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/30 text-start flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
              {isAr ? '✨ النكهات والإضافات' : '✨ Flavors & Add-ons'}
            </p>
            <p className="text-[10px] text-stone-400">
              {isAr ? 'تعديل الأسعار والخيارات' : 'Add-ons & prices'}
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('orders')}
          className="p-4 rounded-2xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/30 text-start flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
              {isAr ? '📦 الطلبات والفواتير' : '📦 Orders & Receipts'}
            </p>
            <p className="text-[10px] text-stone-400">
              {isAr ? 'طباعة وحالات الدفع' : 'Print & payments'}
            </p>
          </div>
        </button>
      </div>

      {/* Recent Orders Overview Table */}
      <div className="p-6 rounded-3xl bg-stone-900/40 border border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-white">
            {isAr ? 'أحدث الطلبات المستلمة' : 'Recent Customer Orders'}
          </h3>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>{isAr ? 'عرض كل الطلبات' : 'View All Orders'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-3 text-start">Order #</th>
                <th className="py-3 px-3 text-start">Customer</th>
                <th className="py-3 px-3 text-start">Items</th>
                <th className="py-3 px-3 text-start">Total</th>
                <th className="py-3 px-3 text-start">Status</th>
                <th className="py-3 px-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-800/30">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-white">{ord.customer.name}</p>
                    <p className="text-[10px] text-stone-400">{ord.customer.phone}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="line-clamp-1 text-stone-300">
                      {ord.items.map((i) => `${i.quantity}x ${isAr ? i.product.nameAr : i.product.nameEn}`).join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                    {formatCurrency(ord.total, lang)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        ord.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : ord.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-end">
                    <button
                      onClick={() => onOpenReceipt(ord)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-semibold"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
