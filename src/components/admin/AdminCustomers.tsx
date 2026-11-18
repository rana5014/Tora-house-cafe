import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Search, UserCheck, Phone, MapPin } from 'lucide-react';
import { formatCurrency, formatOrderDate } from '../../lib/utils';

export const AdminCustomers: React.FC = () => {
  const { orders } = useStore();
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState('');

  // Extract unique customers from orders
  const customerMap = new Map<string, { name: string; phone: string; address?: string; ordersCount: number; totalSpent: number; lastOrder: string }>();

  orders.forEach((o) => {
    const key = o.customer.phone || o.customer.name;
    const existing = customerMap.get(key);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += o.total;
      if (new Date(o.createdAt) > new Date(existing.lastOrder)) {
        existing.lastOrder = o.createdAt;
      }
    } else {
      customerMap.set(key, {
        name: o.customer.name,
        phone: o.customer.phone,
        address: o.customer.address,
        ordersCount: 1,
        totalSpent: o.total,
        lastOrder: o.createdAt,
      });
    }
  });

  const customersList = Array.from(customerMap.values()).filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-9 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <span className="text-xs text-stone-400">
          Total Customers: <strong className="text-white">{customersList.length}</strong>
        </span>
      </div>

      <div className="bg-stone-900/40 border border-stone-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-4 text-start">Customer</th>
                <th className="py-3.5 px-4 text-start">Phone</th>
                <th className="py-3.5 px-4 text-start">Orders Count</th>
                <th className="py-3.5 px-4 text-start">Total Spent</th>
                <th className="py-3.5 px-4 text-start">Last Order Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {customersList.map((c, i) => (
                <tr key={i} className="hover:bg-stone-800/30">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-stone-400 dir-ltr text-start">
                    {c.phone}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                    {c.ordersCount} orders
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {formatCurrency(c.totalSpent, lang)}
                  </td>
                  <td className="py-3.5 px-4 text-stone-400 text-[11px]">
                    {formatOrderDate(c.lastOrder, lang)}
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
