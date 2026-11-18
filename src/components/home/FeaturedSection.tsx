import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../menu/ProductCard';
import { Product, ProductSizeOption } from '../../types';
import { Flame, ArrowRight } from 'lucide-react';

interface FeaturedSectionProps {
  onOpenCustomizer: (product: Product, defaultSize?: ProductSizeOption) => void;
  onViewAllMenu: () => void;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  onOpenCustomizer,
  onViewAllMenu,
}) => {
  const { t, dir } = useLanguage();
  const { products } = useStore();

  const featuredProducts = products.filter((p) => p.isFeatured || p.isBestSeller).slice(0, 4);

  return (
    <section className="py-20 bg-[#0e0d0c] relative overflow-hidden">
      {/* Decorative accent background */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold mb-2">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{t.bestSellerBadge}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
              {t.featuredTitle}
            </h2>
            <p className="text-sm text-stone-400 mt-1 max-w-xl">
              {t.featuredSubtitle}
            </p>
          </div>

          <button
            onClick={onViewAllMenu}
            className="flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <span>{t.catAll}</span>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''
              }`}
            />
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenCustomizer={onOpenCustomizer}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
