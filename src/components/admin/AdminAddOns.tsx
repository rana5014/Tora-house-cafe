import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { AddOnOption } from '../../types';
import { Plus, Edit2, Trash2, Check, X, Sparkles, Coffee, IceCream, Flame, Search } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const AdminAddOns: React.FC = () => {
  const { addOns, addAddOn, updateAddOn, deleteAddOn, toggleAddOnAvailability, isSyncing } = useStore();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const [activeCategory, setActiveCategory] = useState<'all' | 'flavor' | 'topping' | 'shot' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddOnOption | null>(null);

  // Form states
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [price, setPrice] = useState('3');
  const [category, setCategory] = useState<'flavor' | 'topping' | 'shot' | 'other'>('flavor');
  const [isAvailable, setIsAvailable] = useState(true);
  const [applicableCategories, setApplicableCategories] = useState<('cold' | 'hot' | 'sweets' | 'addons')[]>([
    'cold',
    'hot',
  ]);

  const openAddModal = () => {
    setEditingAddon(null);
    setNameEn('');
    setNameAr('');
    setPrice('3');
    setCategory('flavor');
    setIsAvailable(true);
    setApplicableCategories(['cold', 'hot']);
    setIsModalOpen(true);
  };

  const openEditModal = (addon: AddOnOption) => {
    setEditingAddon(addon);
    setNameEn(addon.nameEn);
    setNameAr(addon.nameAr);
    setPrice(String(addon.price));
    setCategory(addon.category);
    setIsAvailable(addon.isAvailable !== false);
    setApplicableCategories(addon.applicableCategories || ['cold', 'hot', 'sweets']);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) return;

    const payload: AddOnOption = {
      id: editingAddon ? editingAddon.id : `${category}-${Date.now()}`,
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      price: Math.max(0, Number(price) || 0),
      category,
      isAvailable,
      applicableCategories,
      sortOrder: editingAddon ? editingAddon.sortOrder : addOns.length + 1,
    };

    if (editingAddon) {
      await updateAddOn(payload);
    } else {
      await addAddOn(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(isAr ? `هل أنت متأكد من حذف الإضافة "${name}" نهائياً؟` : `Are you sure you want to delete "${name}"?`)) {
      await deleteAddOn(id);
    }
  };

  const toggleCategoryApplicable = (cat: 'cold' | 'hot' | 'sweets' | 'addons') => {
    setApplicableCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredAddOns = addOns.filter((a) => {
    const matchesCat = activeCategory === 'all' || a.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      a.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nameAr.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const categoryLabels = {
    all: isAr ? 'الكل' : 'All',
    flavor: isAr ? 'النكهات والسيرب 🍯' : 'Flavors 🍯',
    topping: isAr ? 'التوبينق والصلصات 🍫' : 'Toppings 🍫',
    shot: isAr ? 'شوت إسبريسو ☕' : 'Espresso Shots ☕',
    other: isAr ? 'إضافات أخرى ✨' : 'Other Extras ✨',
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>{isAr ? 'إدارة النكهات والإضافات والتوبينق' : 'Extra Flavors & Add-ons Management'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-sans font-bold">
              {addOns.length} {isAr ? 'إضافة' : 'Items'}
            </span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {isAr
              ? 'أضف وعدل أسعار وتوفر النكهات والتوبينق والشوتات الإضافية لمشروبات وحلويات بيت تورا'
              : 'Manage extra flavors, toppings, espresso shots, prices, and drink availability'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-gold-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isAr ? 'إضافة نكهة / خيار جديد' : 'Add New Flavor / Option'}</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'flavor', 'topping', 'shot', 'other'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-white'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث عن نكهة أو إضافة...' : 'Search flavors...'}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Add-ons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAddOns.map((addon) => {
          const isAvail = addon.isAvailable !== false;
          return (
            <div
              key={addon.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isAvail
                  ? 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                  : 'bg-stone-950/40 border-stone-800/40 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{addon.nameEn}</p>
                    <p className="text-xs text-amber-400 font-medium truncate">{addon.nameAr}</p>
                  </div>
                  <span className="text-sm font-extrabold text-white px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
                    +{formatCurrency(addon.price, lang)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-stone-400 uppercase font-mono font-bold">
                    {addon.category}
                  </span>
                  {addon.applicableCategories?.map((c) => (
                    <span
                      key={c}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 capitalize"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                <button
                  type="button"
                  onClick={() => toggleAddOnAvailability(addon.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                    isAvail
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>{isAvail ? (isAr ? 'متاح للطلب' : 'Available') : (isAr ? 'غير متاح' : 'Disabled')}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(addon)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 transition-colors"
                    title="Edit Add-on"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addon.id, addon.nameEn)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-stone-700 transition-colors"
                    title="Delete Add-on"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAddOns.length === 0 && (
        <div className="p-8 text-center text-stone-500 text-xs border border-dashed border-stone-800 rounded-3xl">
          {isAr ? 'لا توجد إضافات تطابق البحث' : 'No add-ons found matching your criteria.'}
        </div>
      )}

      {/* Add / Edit Add-on Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="relative w-full max-w-lg bg-[#141210] border border-stone-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{editingAddon ? (isAr ? 'تعديل الإضافة' : 'Edit Extra Option') : (isAr ? 'إضافة نكهة / خيار جديد' : 'Add New Extra Option')}</span>
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Vanilla Syrup"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    الاسم بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: سيرب فانيلا"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:border-amber-400 focus:outline-none dir-rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAr ? 'السعر الإضافي (ر.س) *' : 'Extra Price (SAR) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="flavor">{isAr ? 'نكهة / سيرب (Flavor)' : 'Flavor Syrup'}</option>
                    <option value="topping">{isAr ? 'توبينق / صوص (Topping)' : 'Topping / Drizzle'}</option>
                    <option value="shot">{isAr ? 'شوت إسبريسو إضافي (Shot)' : 'Espresso Shot'}</option>
                    <option value="other">{isAr ? 'إضافة مخصصة أخرى' : 'Other Custom Add-on'}</option>
                  </select>
                </div>
              </div>

              {/* Applicable Drinks & Food Categories */}
              <div>
                <label className="block text-stone-300 font-semibold mb-1.5">
                  {isAr ? 'متاح للمنتجات من فئات:' : 'Available for Products in Categories:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['cold', 'hot', 'sweets'] as const).map((cat) => {
                    const isChecked = applicableCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategoryApplicable(cat)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isChecked
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-stone-800 bg-stone-950 text-stone-500'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-amber-400 border-amber-400 text-black' : 'border-stone-700'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="capitalize">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In stock toggle */}
              <label className="flex items-center gap-2 p-3 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="text-stone-300 font-medium">
                  {isAr ? 'متاح للطلب الآن في المتجر' : 'Active and available for customer ordering'}
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-extrabold text-xs shadow-gold-sm"
                >
                  {isSyncing ? '...' : isAr ? 'حفظ الخيار' : 'Save Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
