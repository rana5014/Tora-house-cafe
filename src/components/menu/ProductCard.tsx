import React, { useState } from 'react';
import { Product, ProductSizeOption } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, SlidersHorizontal, Check, Flame, Star, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface ProductCardProps {
  product: Product;
  onOpenCustomizer: (product: Product, defaultSize?: ProductSizeOption) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenCustomizer }) => {
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const isAr = lang === 'ar';

  const [selectedSize, setSelectedSize] = useState<ProductSizeOption | undefined>(() => {
    return product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
  });
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const currentPrice = selectedSize ? selectedSize.price : product.basePrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;

    addToCart(product, quantity, {
      selectedSize,
      addOns: [],
    });

    setJustAdded(true);
    // Subtle golden confetti burst from button
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 15,
        spread: 45,
        origin: { x, y },
        colors: ['#E5A93C', '#F3ECE0', '#FFFFFF'],
        ticks: 50,
      });
    } catch {}

    setTimeout(() => {
      setJustAdded(false);
      setQuantity(1);
    }, 1200);
  };

  const handleSizeChange = (e: React.MouseEvent, size: ProductSizeOption) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  return (
    <div
      onClick={() => onOpenCustomizer(product, selectedSize)}
      className="group relative flex flex-col justify-between bg-[#151311] hover:bg-[#1a1816] border border-stone-800/80 hover:border-amber-500/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 transition-all duration-300 hover:shadow-gold-glow hover:-translate-y-1 cursor-pointer"
    >
      {/* Top Media & Badges */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-900 mb-3.5">
        <img
          src={product.image}
          alt={isAr ? product.nameAr : product.nameEn}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Status / Feature Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex flex-wrap gap-1">
            {product.isBestSeller && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold shadow-sm">
                <Flame className="w-3 h-3 fill-black" />
                <span>{t.bestSellerBadge}</span>
              </span>
            )}
            {product.isFeatured && !product.isBestSeller && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900/90 text-amber-300 border border-amber-500/30 text-[10px] font-bold backdrop-blur-sm">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{t.featuredBadge}</span>
              </span>
            )}
          </div>

          {!product.isAvailable && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold shadow-sm">
              {t.outOfStock}
            </span>
          )}
        </div>

        {/* Calories if available */}
        {product.calories && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-stone-300 font-medium">
            {product.calories} {t.caloriesLabel}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
              {isAr ? product.nameAr : product.nameEn}
            </h3>
            <span className="font-sans font-black text-amber-400 text-base sm:text-lg whitespace-nowrap">
              {formatCurrency(currentPrice, lang)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mt-1">
            {isAr ? product.descriptionAr : product.descriptionEn}
          </p>
        </div>

        {/* Size Selection Pills (if applicable) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-900/90 border border-stone-800">
              {product.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={(e) => handleSizeChange(e, size)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedSize?.id === size.id
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {isAr ? size.nameAr : size.nameEn} • {size.price} {t.sar}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
          {/* Customizer trigger icon button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCustomizer(product, selectedSize);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-[11px] font-medium text-stone-300 hover:text-white transition-all"
            title={t.customize}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">{t.customize}</span>
          </button>

          {/* Quantity Controls & Yellow Add-to-Cart "+" Button */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Quantity Stepper */}
            <div className="flex items-center bg-stone-900 rounded-xl border border-stone-800 p-0.5">
              <button
                disabled={quantity <= 1 || !product.isAvailable}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-stone-800"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-white">
                {quantity}
              </span>
              <button
                disabled={!product.isAvailable}
                onClick={() => setQuantity((q) => q + 1)}
                className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-stone-800"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Signature Golden Yellow Add-to-Cart Button */}
            <button
              disabled={!product.isAvailable}
              onClick={handleQuickAdd}
              aria-label={t.addToCart}
              title={t.addToCart}
              className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black transition-all active:scale-90 ${
                !product.isAvailable
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald-500 text-black shadow-lg scale-105'
                  : 'bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-gold-sm hover:shadow-gold-glow hover:scale-105'
              }`}
            >
              {justAdded ? (
                <Check className="w-5 h-5 text-black animate-scale-up" />
              ) : (
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[2.8]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
