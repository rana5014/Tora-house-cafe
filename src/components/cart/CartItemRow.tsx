import React from 'react';
import { CartItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => {
  const { lang, t } = useLanguage();
  const { updateQuantity, removeFromCart } = useCart();
  const isAr = lang === 'ar';

  const { product, quantity, customization, subtotal, unitPrice } = item;

  return (
    <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-stone-700 transition-all flex gap-3.5 items-start">
      {/* Thumbnail */}
      <img
        src={product.image}
        alt={isAr ? product.nameAr : product.nameEn}
        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-950 border border-stone-800"
      />

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-serif text-sm font-bold text-white line-clamp-1">
            {isAr ? product.nameAr : product.nameEn}
          </h4>
          <span className="font-sans font-black text-amber-400 text-sm whitespace-nowrap">
            {formatCurrency(subtotal, lang)}
          </span>
        </div>

        {/* Selected size if any */}
        {customization.selectedSize && (
          <p className="text-[11px] text-amber-300 font-medium">
            {isAr ? customization.selectedSize.nameAr : customization.selectedSize.nameEn}
          </p>
        )}

        {/* Customization Details: Addons, Sweetness, Ice, Notes */}
        <div className="text-[10px] text-stone-400 space-y-0.5">
          {customization.addOns && customization.addOns.length > 0 && (
            <p className="line-clamp-1">
              <span className="text-stone-500">{t.cartAddonsIncluded} </span>
              {customization.addOns.map((a) => (isAr ? a.nameAr : a.nameEn)).join(', ')}
            </p>
          )}

          <div className="flex items-center gap-2 text-stone-400">
            {customization.sweetnessLevel && (
              <span>{customization.sweetnessLevel} Sugar</span>
            )}
            {customization.iceLevel && (
              <>
                <span>•</span>
                <span>{customization.iceLevel} Ice</span>
              </>
            )}
          </div>

          {customization.specialInstructions && (
            <p className="italic text-stone-400 line-clamp-1">
              "{customization.specialInstructions}"
            </p>
          )}
        </div>

        {/* Quantity Stepper & Remove */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center bg-stone-950 rounded-xl border border-stone-800 p-0.5">
            <button
              onClick={() => updateQuantity(item.id, quantity - 1)}
              className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-xs font-bold text-white">
              {quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, quantity + 1)}
              className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => removeFromCart(item.id)}
            className="text-stone-500 hover:text-rose-400 p-1.5 transition-colors"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
