import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ProductCategory } from '../../types';
import { Snowflake, Flame, Cake, PlusCircle, ArrowRight } from 'lucide-react';

interface CategoriesGridProps {
  onSelectCategory: (cat: ProductCategory) => void;
}

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({ onSelectCategory }) => {
  const { lang, t, dir } = useLanguage();
  const isAr = lang === 'ar';

  const categories = [
    {
      id: 'cold' as ProductCategory,
      title: t.catCold,
      count: isAr ? '17 مشروب' : '17 Drinks',
      desc: isAr
        ? 'سبانش لاتيه، موهيتو، كركديه، فرابيه وعصائر طازجة'
        : 'Ice Spanish Latte, Mojitos, Karkadeh, Frappes & Juices',
      image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=80',
      icon: Snowflake,
      accent: 'from-blue-600/40 to-cyan-500/10',
    },
    {
      id: 'hot' as ProductCategory,
      title: t.catHot,
      count: isAr ? '17 مشروب' : '17 Drinks',
      desc: isAr
        ? 'كابتشينو، كورتادو، قهوة سعودية، شاي كرك و V60'
        : 'Cappuccino, Cortado, Saudi Gahwa, Karrak & V60',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      icon: Flame,
      accent: 'from-amber-600/40 to-orange-500/10',
    },
    {
      id: 'sweets' as ProductCategory,
      title: t.catSweets,
      count: isAr ? '7 أصناف' : '7 Pastries',
      desc: isAr
        ? 'دونات، كرواسون بالزبدة والجبن، ومافن طازج'
        : 'Donuts, Flaky Croissants, English Loaves & Muffins',
      image: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=800&q=80',
      icon: Cake,
      accent: 'from-rose-600/40 to-pink-500/10',
    },
    {
      id: 'addons' as ProductCategory,
      title: t.catAddons,
      count: isAr ? '8 إضافات' : '8 Flavors',
      desc: isAr
        ? 'كراميل، فانيلا، بندق، شوت إسبريسو وآيس كريم'
        : 'Caramel, Vanilla, Hazelnut, Extra Shots & Gelato',
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
      icon: PlusCircle,
      accent: 'from-amber-500/40 to-yellow-500/10',
    },
  ];

  return (
    <section className="py-20 bg-[#0c0a09] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            {t.categoriesTitle}
          </h2>
          <p className="text-sm text-stone-400 mt-2">
            {t.categoriesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative h-80 rounded-3xl overflow-hidden border border-stone-800 hover:border-amber-500/60 transition-all duration-500 hover:shadow-gold-glow hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between p-6"
              >
                {/* Background Image with Zoom */}
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 group-hover:via-black/60 transition-all duration-300 pointer-events-none" />

                {/* Top category badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md border border-stone-700/80 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-stone-700 text-xs font-semibold text-stone-300">
                    {cat.count}
                  </span>
                </div>

                {/* Bottom details */}
                <div className="relative z-10 space-y-2">
                  <h3 className="font-serif text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>{isAr ? 'عرض الأصناف' : 'Explore Category'}</span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
