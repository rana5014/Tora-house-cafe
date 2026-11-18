import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, ProductSizeOption } from '../../types';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, Snowflake, Flame, Cake, PlusCircle, LayoutGrid, Check } from 'lucide-react';

interface MenuSectionProps {
  onOpenCustomizer: (product: Product, defaultSize?: ProductSizeOption) => void;
  initialCategory?: ProductCategory | 'all';
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  onOpenCustomizer,
  initialCategory = 'all',
}) => {
  const { lang, t } = useLanguage();
  const { products } = useStore();
  const isAr = lang === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'popular'>('default');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Categories list with counts
  const categoryFilters = [
    { id: 'all' as const, label: t.catAll, icon: LayoutGrid },
    { id: 'cold' as const, label: t.catCold, icon: Snowflake },
    { id: 'hot' as const, label: t.catHot, icon: Flame },
    { id: 'sweets' as const, label: t.catSweets, icon: Cake },
    { id: 'addons' as const, label: t.catAddons, icon: PlusCircle },
  ];

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Availability filter
    if (availableOnly) {
      result = result.filter((p) => p.isAvailable);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nameEn.toLowerCase().includes(q) ||
          p.nameAr.includes(q) ||
          p.descriptionEn.toLowerCase().includes(q) ||
          p.descriptionAr.includes(q)
      );
    }

    // Sort order
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'popular') {
      result = [...result].sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, availableOnly, searchQuery, sortBy]);

  return (
    <section id="menu" className="py-24 bg-[#0a0908] min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest block mb-2">
            TORA HOUSE MENU
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-black text-white">
            {isAr ? 'قائمة المشروبات والحلويات' : 'Crafted Beverage & Bakery Menu'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-3">
            {isAr
              ? 'تصفح تشكيلتنا الكاملة من القهوة المختصة، الموهيتو المنعش، والمخبوزات الطازجة مع أسعارها الدقيقة بالريال السعودي.'
              : 'Explore our full menu with authentic prices in SAR, custom size selections, syrups, and direct WhatsApp ordering.'}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#141210] border border-stone-800 rounded-3xl p-4 sm:p-5 mb-8 shadow-luxury space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-4 h-4 text-stone-400 rtl:left-auto rtl:right-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.menuSearchPlaceholder}
                className="w-full bg-stone-900/90 border border-stone-800 rounded-2xl py-3 px-11 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 -translate-y-1/2 right-4 text-xs text-stone-400 hover:text-white rtl:right-auto rtl:left-4"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & Availability Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-stone-900 border border-stone-800 text-stone-200 text-xs rounded-2xl py-3 px-4 focus:outline-none focus:border-amber-400"
              >
                <option value="default">{t.sortDefault}</option>
                <option value="popular">{t.sortPopular}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
              </select>

              {/* Available Only Toggle */}
              <button
                type="button"
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`flex items-center gap-2 py-2.5 px-3.5 rounded-2xl border text-xs font-semibold transition-all whitespace-nowrap ${
                  availableOnly
                    ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                    : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    availableOnly ? 'bg-amber-400 border-amber-400 text-black' : 'border-stone-600'
                  }`}
                >
                  {availableOnly && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{t.filterAvailableOnly}</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-stone-800/80">
            {categoryFilters.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? products.length
                  : products.filter((p) => p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-gold-sm scale-[1.02]'
                      : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-black/20 text-black' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-stone-400 mb-6 px-1">
          <span>
            {isAr
              ? `عرض ${filteredProducts.length} من إجمالي ${products.length} صنف`
              : `Showing ${filteredProducts.length} of ${products.length} menu items`}
          </span>
          {searchQuery && (
            <span className="text-amber-400 font-medium">
              {isAr ? `نتائج البحث عن: "${searchQuery}"` : `Filtered by: "${searchQuery}"`}
            </span>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenCustomizer={onOpenCustomizer}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center bg-[#141210] border border-stone-800 rounded-3xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 text-stone-500 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white mb-2">
              {t.menuNoResults}
            </h3>
            <p className="text-xs text-stone-400 mb-6">
              {isAr
                ? 'تأكد من كتابة اسم الصنف بالشكل الصحيح أو أعد تعيين الفلاتر.'
                : 'Check your spelling or reset filters to view our full coffee and juice list.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setAvailableOnly(false);
              }}
              className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-gold-sm"
            >
              {t.catAll}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
