import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { Tag, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import confetti from 'canvas-confetti';

export const SpecialOffers: React.FC<{ onNavigateMenu: () => void }> = ({ onNavigateMenu }) => {
  const { lang, t, dir } = useLanguage();
  const { products } = useStore();
  const { addToCart, openCart } = useCart();
  const isAr = lang === 'ar';

  const spanishLatte = products.find((p) => p.id === 'cold-ice-spanish-latte') || products[0];
  const donut = products.find((p) => p.id === 'sweet-donut') || products[products.length - 1];
  const v60Hot = products.find((p) => p.id === 'hot-v60') || products[1];
  const cheeseCroissant = products.find((p) => p.id === 'sweet-croissant-cheese') || products[products.length - 2];

  const handleOrderCombo = (comboItems: typeof products, e: React.MouseEvent) => {
    comboItems.forEach((item) => {
      addToCart(item, 1, {});
    });
    openCart();
    try {
      confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#E5A93C', '#F3ECE0'],
      });
    } catch {}
  };

  return (
    <section className="py-20 bg-[#100f0e] border-y border-stone-800/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold mb-3">
            <Tag className="w-3.5 h-3.5" />
            <span>{isAr ? 'عروض تورا المميزة' : 'Limited Time Specials'}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            {isAr ? 'كومبو المشروبات والمخبوزات' : 'Curated Pairing Combos'}
          </h2>
          <p className="text-sm text-stone-400 mt-2">
            {isAr
              ? 'تذوق التناغم المثالي بين قهوتنا المفضلة وألذ المخبوزات الطازجة بسعر مميز'
              : 'The ultimate match between our signature drinks and freshly baked pastries.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Combo 1: Spanish Latte + Glazed Donut */}
          <div className="relative rounded-3xl bg-gradient-to-br from-stone-900 to-[#181614] border border-stone-800 hover:border-amber-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-gold-glow group">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-extrabold">
                  {isAr ? 'وفّر 3 ر.س' : 'SAVE SAR 3'}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
                  {isAr ? 'كومبو الانتعاش والحلا' : 'Afternoon Bliss Combo'}
                </h3>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  {isAr
                    ? 'آيس سبانش لاتيه مميز + دونات فاخرة طازجة بجليز الشوكولاتة'
                    : 'Signature Ice Spanish Latte + Oven-fresh Glazed Chocolate Donut'}
                </p>
              </div>

              <div className="text-end whitespace-nowrap">
                <span className="text-stone-500 line-through text-xs sm:text-sm block">
                  {formatCurrency(21, lang)}
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-black text-amber-400 block">
                  {formatCurrency(18, lang)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
                <img
                  src={spanishLatte.image}
                  alt={isAr ? spanishLatte.nameAr : spanishLatte.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
                <img
                  src={donut.image}
                  alt={isAr ? donut.nameAr : donut.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <button
              onClick={(e) => handleOrderCombo([spanishLatte, donut], e)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isAr ? 'أضف الكومبو للسلة' : 'Add Combo to Cart'}</span>
            </button>
          </div>

          {/* Combo 2: V60 Hot + Cheddar Cheese Croissant */}
          <div className="relative rounded-3xl bg-gradient-to-br from-stone-900 to-[#181614] border border-stone-800 hover:border-amber-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-gold-glow group">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-extrabold">
                  {isAr ? 'وفّر 3 ر.س' : 'SAVE SAR 3'}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
                  {isAr ? 'كومبو الصباح المختص' : 'Artisan Morning Duo'}
                </h3>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  {isAr
                    ? 'قهوة V60 مقطرة حارة بإيحاءات فاخرة + كرواسون جبن شيدر ساخن ومقرمش'
                    : 'Specialty Hot V60 Drip + Warm Melted Cheddar Cheese Croissant'}
                </p>
              </div>

              <div className="text-end whitespace-nowrap">
                <span className="text-stone-500 line-through text-xs sm:text-sm block">
                  {formatCurrency(16, lang)}
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-black text-amber-400 block">
                  {formatCurrency(13, lang)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
                <img
                  src={v60Hot.image}
                  alt={isAr ? v60Hot.nameAr : v60Hot.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
                <img
                  src={cheeseCroissant.image}
                  alt={isAr ? cheeseCroissant.nameAr : cheeseCroissant.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <button
              onClick={(e) => handleOrderCombo([v60Hot, cheeseCroissant], e)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isAr ? 'أضف الكومبو للسلة' : 'Add Combo to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
