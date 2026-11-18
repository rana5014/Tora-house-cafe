import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { api } from '../../lib/api';
import {
  Search,
  Filter,
  Printer,
  Eye,
  X,
  MessageSquare,
  RefreshCw,
  Send,
  Phone,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { formatCurrency, formatOrderDate } from '../../lib/utils';

export const AdminOrders: React.FC<{ onOpenReceipt: (order: Order) => void }> = ({
  onOpenReceipt,
}) => {
  const { orders, updateOrderStatus, updateOrderPaymentStatus, refreshData } = useStore();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const statuses: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready for Pickup',
    'Out for Delivery',
    'Completed',
    'Cancelled',
  ];

  const paymentStatuses: PaymentStatus[] = ['Pending', 'Paid', 'Failed', 'Refunded'];

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'mada':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#007953]/15 text-[#00c284] border border-[#007953]/30 text-[10px] font-bold whitespace-nowrap">
            مدى mada
          </span>
        );
      case 'visa':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold whitespace-nowrap">
            VISA
          </span>
        );
      case 'mastercard':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] font-bold whitespace-nowrap">
            Mastercard
          </span>
        );
      case 'apple_pay':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-700/60 text-white border border-stone-600 text-[10px] font-bold whitespace-nowrap">
             Apple Pay
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold whitespace-nowrap">
            {isAr ? 'نقد (COD)' : 'Cash (COD)'}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search);
    return matchStatus && matchSearch;
  });

  // Format prefilled WhatsApp text for the owner (+966579165664)
  const formatWhatsAppOrderText = (order: Order) => {
    const itemsList = order.items
      .map((i) => {
        const size = i.customization?.selectedSize ? ` (${i.customization.selectedSize.nameEn})` : '';
        const addOns = i.customization?.addOns?.length
          ? ` + ${i.customization.addOns.map((a) => a.nameEn).join(', ')}`
          : '';
        return `• ${i.quantity}x ${i.product.nameEn}${size} – SAR ${i.subtotal}${addOns}`;
      })
      .join('\n');

    return `*TORA HOUSE – NEW ORDER!*

*Order Number:* ${order.orderNumber}
*Customer:* ${order.customer.name}
*Customer Phone:* ${order.customer.phone}

*ORDER DETAILS:*
${itemsList}

*Subtotal:* SAR ${order.subtotal}
*Delivery Fee:* SAR ${order.deliveryFee}
*TOTAL:* SAR ${order.total}

*Order Type:* ${order.orderType === 'pickup' ? 'Pickup' : `Delivery (${order.customer.address || 'Riyadh'})`}
*Status:* ${order.status}

_Please prepare this order._`;
  };

  const getOwnerWhatsAppLink = (order: Order) => {
    const text = formatWhatsAppOrderText(order);
    return `https://wa.me/966579165664?text=${encodeURIComponent(text)}`;
  };

  // Retry automated Meta Cloud API notification
  const handleRetryCloudWhatsApp = async (orderId: string) => {
    setRetryingId(orderId);
    setRetryResult(null);

    try {
      const res = await api.adminRetryWhatsApp(orderId);
      if (res?.success) {
        setRetryResult({
          id: orderId,
          success: true,
          msg: isAr ? 'تم إرسال إشعار واتساب بنجاح!' : 'WhatsApp notification sent successfully!',
        });
        refreshData();
      } else {
        setRetryResult({
          id: orderId,
          success: false,
          msg: res?.error || (isAr ? 'فشل الإرسال عبر Cloud API. تأكد من إعدادات التوكن في Settings.' : 'Cloud API delivery failed. Check Meta credentials in Settings.'),
        });
      }
    } catch (err: any) {
      setRetryResult({
        id: orderId,
        success: false,
        msg: err.message || 'Retry failed',
      });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث برقم الطلب، اسم العميل، الهاتف...' : 'Search order #, customer name, phone...'}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-9 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* WhatsApp Status Alert Banner */}
      <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between text-xs text-stone-300">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {isAr
              ? 'إشعارات الطلبات على واتساب (+966579165664): يمكنك إرسال أو فتح أي طلب مباشرة عبر زر واتساب الأخضر.'
              : 'Owner WhatsApp (+966579165664): Tap the green WhatsApp button on any order to open or forward full details instantly.'}
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] text-amber-400 font-semibold">
          Target: +966 57 916 5664
        </span>
      </div>

      {/* MOBILE VIEW: Orders Cards */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-stone-900/30 rounded-2xl border border-stone-800">
            {isAr ? 'لا توجد طلبات مطابقة' : 'No orders found'}
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {ord.orderNumber}
                  </span>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {formatOrderDate(ord.createdAt, lang)}
                  </p>
                </div>

                {/* Status Selector */}
                <select
                  value={ord.status}
                  onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                  className={`text-[11px] font-bold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-none ${
                    ord.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : ord.status === 'Cancelled'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : ord.status === 'Preparing'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s} className="bg-stone-900 text-stone-200">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ord.customer.name}</span>
                  </span>
                  <a
                    href={`tel:${ord.customer.phone}`}
                    className="text-stone-300 font-mono text-[11px] hover:text-amber-400 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span className="dir-ltr">{ord.customer.phone}</span>
                  </a>
                </div>
                <div className="text-[11px] text-stone-400">
                  <span>{ord.items.map((i) => `${i.quantity}x ${isAr ? i.product.nameAr : i.product.nameEn}`).join(', ')}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-stone-800/60 font-bold text-white">
                  <span>{isAr ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="text-amber-400">{formatCurrency(ord.total, lang)}</span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-stone-800/60 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {getPaymentMethodBadge(ord.paymentMethod)}
                  </div>
                  <select
                    value={ord.paymentStatus || (ord.paymentMethod === 'cash_on_delivery' ? 'Pending' : 'Paid')}
                    onChange={(e) => updateOrderPaymentStatus(ord.id, e.target.value as PaymentStatus)}
                    className={`text-[10px] font-bold py-0.5 px-2 rounded-full border cursor-pointer focus:outline-none ${
                      ord.paymentStatus === 'Paid' || (!ord.paymentStatus && ord.paymentMethod !== 'cash_on_delivery')
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : ord.paymentStatus === 'Failed'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : ord.paymentStatus === 'Refunded'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {paymentStatuses.map((ps) => (
                      <option key={ps} value={ps} className="bg-stone-900 text-stone-200">
                        {ps === 'Pending' ? (isAr ? 'معلق (لم يُدفع)' : 'Pending') : ps === 'Paid' ? (isAr ? 'تم الدفع بنجاح' : 'Paid') : ps}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WhatsApp & Print Actions */}
              <div className="flex items-center gap-2 pt-1">
                {/* 1-Tap WhatsApp to Owner Number */}
                <a
                  href={getOwnerWhatsAppLink(ord)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  title="Send or open order on Owner WhatsApp (+966579165664)"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح بالواتساب 📲' : 'Open in WhatsApp 📲'}</span>
                </a>

                <button
                  onClick={() => onOpenReceipt(ord)}
                  className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700 border border-stone-700"
                  title="Print Thermal Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedOrder(ord)}
                  className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white border border-stone-700"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Cloud WhatsApp Status */}
              <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ord.whatsappDeliveryStatus === 'sent'
                        ? 'bg-emerald-400'
                        : ord.whatsappDeliveryStatus === 'failed'
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {ord.whatsappDeliveryStatus === 'sent'
                      ? (isAr ? 'تم الإرسال تلقائياً لميتا' : 'Auto-dispatched via Meta')
                      : ord.whatsappDeliveryStatus === 'failed'
                      ? (isAr ? 'فشل إرسال API' : 'Cloud API Failed')
                      : (isAr ? 'بانتظار إعداد توكن ميتا' : 'Meta Token Pending')}
                  </span>
                </span>

                <button
                  onClick={() => handleRetryCloudWhatsApp(ord.id)}
                  disabled={retryingId === ord.id}
                  className="text-stone-400 hover:text-amber-400 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${retryingId === ord.id ? 'animate-spin' : ''}`} />
                  <span>{isAr ? 'إعادة محاولة API' : 'Retry API'}</span>
                </button>
              </div>

              {retryResult && retryResult.id === ord.id && (
                <p className={`text-[10px] ${retryResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {retryResult.msg}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* DESKTOP VIEW: Orders Table */}
      <div className="hidden md:block bg-stone-900/40 border border-stone-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-3 text-start">Order #</th>
                <th className="py-3.5 px-3 text-start">Date & Time</th>
                <th className="py-3.5 px-3 text-start">Customer Details</th>
                <th className="py-3.5 px-3 text-start">Items</th>
                <th className="py-3.5 px-3 text-start">Total</th>
                <th className="py-3.5 px-3 text-start">{isAr ? 'طريقة الدفع' : 'Payment'}</th>
                <th className="py-3.5 px-3 text-start">{isAr ? 'حالة الدفع' : 'Payment Status'}</th>
                <th className="py-3.5 px-3 text-start">{isAr ? 'حالة الطلب' : 'Order Status'}</th>
                <th className="py-3.5 px-3 text-start">WhatsApp</th>
                <th className="py-3.5 px-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-800/30">
                  <td className="py-3.5 px-3 font-mono font-bold text-amber-400">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3.5 px-3 text-stone-400 text-[11px] whitespace-nowrap">
                    {formatOrderDate(ord.createdAt, lang)}
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-white text-xs">{ord.customer.name}</p>
                    <p className="text-[11px] text-stone-400 dir-ltr text-start">{ord.customer.phone}</p>
                    {ord.customer.address && (
                      <p className="text-[10px] text-stone-500 line-clamp-1">{ord.customer.address}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="line-clamp-2 text-stone-300 max-w-xs text-[11px]">
                      {ord.items.map((i) => `${i.quantity}x ${isAr ? i.product.nameAr : i.product.nameEn}`).join(', ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-white whitespace-nowrap">
                    {formatCurrency(ord.total, lang)}
                  </td>
                  <td className="py-3.5 px-3">
                    {getPaymentMethodBadge(ord.paymentMethod)}
                  </td>
                  <td className="py-3.5 px-3">
                    <select
                      value={ord.paymentStatus || (ord.paymentMethod === 'cash_on_delivery' ? 'Pending' : 'Paid')}
                      onChange={(e) => updateOrderPaymentStatus(ord.id, e.target.value as PaymentStatus)}
                      className={`text-[10px] font-bold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-none ${
                        ord.paymentStatus === 'Paid' || (!ord.paymentStatus && ord.paymentMethod !== 'cash_on_delivery')
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : ord.paymentStatus === 'Failed'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : ord.paymentStatus === 'Refunded'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {paymentStatuses.map((ps) => (
                        <option key={ps} value={ps} className="bg-stone-900 text-stone-200">
                          {ps === 'Pending' ? (isAr ? 'معلق (لم يُدفع)' : 'Pending') : ps === 'Paid' ? (isAr ? 'تم الدفع بنجاح' : 'Paid') : ps}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-3">
                    {/* Live Status Selector */}
                    <select
                      value={ord.status}
                      onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                      className={`text-[11px] font-bold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-none ${
                        ord.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : ord.status === 'Cancelled'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : ord.status === 'Preparing'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s} className="bg-stone-900 text-stone-200">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* WhatsApp Direct Action & Status */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={getOwnerWhatsAppLink(ord)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition-all"
                        title="Send / Open on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        onClick={() => handleRetryCloudWhatsApp(ord.id)}
                        disabled={retryingId === ord.id}
                        className="p-1 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800"
                        title="Retry Meta Cloud API notification"
                      >
                        <RefreshCw className={`w-3 h-3 ${retryingId === ord.id ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenReceipt(ord)}
                        className="p-1.5 rounded-lg bg-stone-800 text-amber-400 hover:bg-stone-700"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/85 backdrop-blur-md" />
          <div className="relative w-full max-w-lg bg-[#141210] border border-stone-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  Order Details: {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-400">{formatOrderDate(selectedOrder.createdAt, lang)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
                <p className="text-stone-400">Customer: <strong className="text-white">{selectedOrder.customer.name}</strong></p>
                <p className="text-stone-400">Phone: <strong className="text-white dir-ltr">{selectedOrder.customer.phone}</strong></p>
                <p className="text-stone-400">Type: <strong className="text-amber-400 capitalize">{selectedOrder.orderType}</strong></p>
                {selectedOrder.customer.address && (
                  <p className="text-stone-400">Address: <strong className="text-white">{selectedOrder.customer.address}</strong></p>
                )}
                {selectedOrder.customer.notes && (
                  <p className="text-stone-400 italic">Notes: "{selectedOrder.customer.notes}"</p>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Ordered Items</h4>
                <div className="space-y-1.5 divide-y divide-stone-800/60">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="pt-1.5 flex justify-between items-start text-xs">
                      <div>
                        <p className="text-white font-medium">
                          {it.quantity}x {isAr ? it.product.nameAr : it.product.nameEn}
                          {it.customization?.selectedSize && ` (${it.customization.selectedSize.nameEn})`}
                        </p>
                        {it.customization?.addOns && it.customization.addOns.length > 0 && (
                          <p className="text-[10px] text-amber-400">
                            + {it.customization.addOns.map((a) => a.nameEn).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-white">{formatCurrency(it.subtotal, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-between text-sm font-bold text-white">
                <span>Total Amount:</span>
                <span className="font-serif text-amber-400 text-base">{formatCurrency(selectedOrder.total, lang)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2">
              <a
                href={getOwnerWhatsAppLink(selectedOrder)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open in WhatsApp (+966579165664)</span>
              </a>

              <button
                onClick={() => {
                  onOpenReceipt(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
