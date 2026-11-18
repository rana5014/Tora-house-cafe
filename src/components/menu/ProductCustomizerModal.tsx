import React, { useState, useEffect } from 'react';
import { Product, ProductSizeOption, AddOnOption, CartCustomization } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart, calculateItemUnitPrice } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { X, Check, Plus, Minus, Sparkles, Coffee } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface ProductCustomizerModalProps {
  product: Product | null;
  initialSize?: ProductSizeOption;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({
  product,
  initialSize,
  isOpen,
  onClose,
}) => {
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const { addOns } = useStore();
  const isAr = lang === 'ar';

  const [selectedSize, setSelectedSize] = useState<ProductSizeOption | undefined>(initialSize);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnOption[]>([]);
  const [sweetnessLevel, setSweetnessLevel] = useState<'0%' | '25%' | '50%' | '100%'>('100%');
  const [iceLevel, setIceLevel] = useState<'None' | 'Less' | 'Regular' | 'Extra'>('Regular');
  const [milkChoice, setMilkChoice] = useState<'Whole Milk' | 'Oat Milk' | 'Almond Milk' | 'Skimmed Milk'>('Whole Milk');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(
        initialSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined)
      );
      setSelectedAddOns([]);
      setSweetnessLevel('100%');
      setIceLevel(product.category === 'cold' ? 'Regular' : 'None');
      setMilkChoice('Whole Milk');
      setSpecialInstructions('');
      setQuantity(1);
      setIsSuccess(false);
    }
  }, [product, initialSize]);

  if (!isOpen || !product) return null;

  const currentCustomization: Partial<CartCustomization> = {
    selectedSize,
    addOns: selectedAddOns,
    sweetnessLevel,
    iceLevel,
    milkChoice,
    specialInstructions,
  };

  const unitPrice = calculateItemUnitPrice(product, currentCustomization);
  const totalPrice = unitPrice * quantity;

  const toggleAddOn = (addon: AddOnOption) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    addToCart(product, quantity, currentCustomization);
    setIsSuccess(true);

    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#E5A93C', '#F3ECE0', '#FFFFFF'],
      });
    } catch {}

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-xl bg-[#141210] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header with image banner */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-stone-900 shrink-0">
          <img
            src={product.image}
            alt={isAr ? product.nameAr : product.nameEn}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-black/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-stone-300 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title on image */}
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {isAr ? product.nameAr : product.nameEn}
            </h2>
            <p className="text-amber-400 font-bold text-lg mt-0.5">
              {formatCurrency(unitPrice, lang)}
            </p>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-200">
          {/* Description */}
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            {isAr ? product.descriptionAr : product.descriptionEn}
          </p>

          {/* 1. Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t.selectSizeTitle}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`p-3.5 rounded-2xl border text-start transition-all flex items-center justify-between ${
                      selectedSize?.id === size.id
                        ? 'border-amber-400 bg-amber-500/10 text-white shadow-gold-sm'
                        : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {isAr ? size.nameAr : size.nameEn}
                      </p>
                      <p className="text-xs text-amber-400 font-semibold mt-0.5">
                        {size.price} {t.sar}
                      </p>
                    </div>
                    {selectedSize?.id === size.id && (
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Flavor Syrups & Add-Ons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t.addOnsTitle}
              </label>
              <span className="text-[11px] text-stone-400">
                {selectedAddOns.length} {isAr ? 'محدد' : 'selected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {addOns
                .filter((addon) => {
                  if (addon.isAvailable === false) return false;
                  if (addon.applicableCategories && addon.applicableCategories.length > 0) {
                    return addon.applicableCategories.includes(product.category);
                  }
                  return true;
                })
                .map((addon) => {
                  const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon)}
                      className={`p-3 rounded-xl border text-start transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 text-white'
                          : 'border-stone-800 bg-stone-900/40 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <span className="font-medium">{isAr ? addon.nameAr : addon.nameEn}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">+{addon.price} {t.sar}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isSelected
                              ? 'bg-amber-400 border-amber-400 text-black'
                              : 'border-stone-700 bg-stone-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 3. Sweetness Level (for drinks) */}
          {product.category !== 'sweets' && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t.sweetnessTitle}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['100%', '50%', '25%', '0%'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSweetnessLevel(level)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all ${
                      sweetnessLevel === level
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Ice Level (for cold drinks) */}
          {product.category === 'cold' && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t.iceTitle}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'Regular', label: t.iceRegular },
                    { id: 'Less', label: t.iceLess },
                    { id: 'Extra', label: t.iceExtra },
                    { id: 'None', label: t.iceNone },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIceLevel(opt.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all ${
                      iceLevel === opt.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Special Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              {t.specialNotesTitle}
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder={t.specialNotesPlaceholder}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Footer with Quantity Stepper & Final Add-to-Cart */}
        <div className="p-4 sm:p-6 bg-[#181716] border-t border-stone-800/80 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-stone-900 rounded-2xl border border-stone-800 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-800 disabled:opacity-30 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-base text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-800 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-gold-sm ${
              isSuccess
                ? 'bg-emerald-500 text-black'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>{t.success}</span>
              </>
            ) : (
              <>
                <span>{t.addToCart}</span>
                <span className="text-black/80 font-black">•</span>
                <span>{formatCurrency(totalPrice, lang)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
