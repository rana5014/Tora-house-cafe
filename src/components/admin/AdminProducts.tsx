import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Product, ProductCategory, ProductSizeOption } from '../../types';
import { Plus, Edit2, Trash2, Check, X, Search, Image as ImageIcon, Flame, Star, Sparkles, Upload, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { uploadProductImage } from '../../lib/imageUpload';

export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, resetProductsToDefault } = useStore();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [category, setCategory] = useState<ProductCategory>('cold');
  const [basePrice, setBasePrice] = useState('10');
  const [hasSizes, setHasSizes] = useState(false);
  const [regularPrice, setRegularPrice] = useState('10');
  const [largePrice, setLargePrice] = useState('12');
  const [image, setImage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [calories, setCalories] = useState('');

  // Mobile Gallery Image Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError(isAr ? 'يرجى اختيار صورة بصيغة JPG أو PNG أو WebP' : 'Please select a JPG, PNG, or WebP image');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      const res = await uploadProductImage(file, editingProduct?.id, (prog) => {
        setUploadProgress(prog);
      });

      if (res.success && res.url) {
        setImage(res.url);
        setUploadError(null);
      } else {
        setUploadError(res.error || (isAr ? 'فشل رفع الصورة' : 'Failed to upload image'));
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNameEn('');
    setNameAr('');
    setDescriptionEn('');
    setDescriptionAr('');
    setCategory('cold');
    setBasePrice('10');
    setHasSizes(false);
    setRegularPrice('10');
    setLargePrice('12');
    setImage('https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80');
    setIsAvailable(true);
    setIsFeatured(false);
    setIsBestSeller(false);
    setCalories('150');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setNameEn(p.nameEn);
    setNameAr(p.nameAr);
    setDescriptionEn(p.descriptionEn);
    setDescriptionAr(p.descriptionAr);
    setCategory(p.category);
    setBasePrice(String(p.basePrice));
    setHasSizes(Boolean(p.sizes && p.sizes.length > 0));
    setRegularPrice(p.sizes && p.sizes[0] ? String(p.sizes[0].price) : String(p.basePrice));
    setLargePrice(p.sizes && p.sizes[1] ? String(p.sizes[1].price) : String(p.basePrice + 2));
    setImage(p.image);
    setIsAvailable(p.isAvailable);
    setIsFeatured(Boolean(p.isFeatured));
    setIsBestSeller(Boolean(p.isBestSeller));
    setCalories(p.calories ? String(p.calories) : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const sizes: ProductSizeOption[] | undefined = hasSizes
      ? [
          { id: 'regular', nameEn: 'Regular', nameAr: 'وسط', price: Number(regularPrice) || Number(basePrice) },
          { id: 'large', nameEn: 'Large', nameAr: 'كبير', price: Number(largePrice) || Number(basePrice) + 2 },
        ]
      : undefined;

    const prodPayload = {
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      category,
      basePrice: Number(basePrice) || 10,
      sizes,
      image,
      isAvailable,
      isFeatured,
      isBestSeller,
      calories: calories ? Number(calories) : undefined,
    };

    if (editingProduct) {
      await updateProduct({ ...prodPayload, id: editingProduct.id });
    } else {
      await addProduct(prodPayload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.adminConfirmDelete)) {
      await deleteProduct(id);
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !search.trim() ||
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.nameAr.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث في المنتجات...' : 'Search products...'}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-9 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-gold-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.adminAddProductBtn}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'cold', 'hot', 'sweets', 'addons'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-stone-800 text-amber-400 border border-amber-500/30'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            {cat === 'all'
              ? t.catAll
              : cat === 'cold'
              ? t.catCold
              : cat === 'hot'
              ? t.catHot
              : cat === 'sweets'
              ? t.catSweets
              : t.catAddons}
          </button>
        ))}
      </div>

      {/* Helper Tip Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
        <span className="flex items-center gap-2">
          <span>💡</span>
          <span>
            {isAr
              ? 'لتعديل أي منتج (السعر، الصورة، الاسم، الأحجام، التوفر)، اضغط على زر "تعديل ✏️" الخاص به أدناه.'
              : 'To edit any product (price, photo, name, sizes, or availability), tap its "Edit ✏️" button below.'}
          </span>
        </span>
        <button
          onClick={openAddModal}
          className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 shadow-gold-sm"
        >
          + {t.adminAddProductBtn}
        </button>
      </div>

      {/* MOBILE VIEW: Product Cards with Prominent Edit Buttons */}
      <div className="block md:hidden space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={p.image}
                alt={p.nameEn}
                className="w-14 h-14 rounded-2xl object-cover bg-stone-950 border border-stone-800 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{p.nameEn}</p>
                <p className="text-xs text-amber-400 font-medium truncate">{p.nameAr}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-white text-xs">
                    {formatCurrency(p.basePrice, lang)}
                  </span>
                  <span className="text-[10px] text-stone-500 capitalize px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800">
                    {p.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => updateProduct({ ...p, isAvailable: !p.isAvailable })}
                className={`px-2 py-1 rounded-full text-[10px] font-bold border shrink-0 transition-all ${
                  p.isAvailable
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {p.isAvailable ? t.inStock : t.outOfStock}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
              <button
                onClick={() => openEditModal(p)}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-gold-sm transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تعديل المنتج ✏️' : 'Edit Product ✏️'}</span>
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-rose-400 border border-stone-700"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP VIEW: Products Table */}
      <div className="hidden md:block bg-stone-900/40 border border-stone-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3.5 px-4 text-start">Product</th>
                <th className="py-3.5 px-4 text-start">Category</th>
                <th className="py-3.5 px-4 text-start">Price (SAR)</th>
                <th className="py-3.5 px-4 text-start">Sizes</th>
                <th className="py-3.5 px-4 text-start">Status</th>
                <th className="py-3.5 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-stone-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.nameEn}
                        className="w-10 h-10 rounded-xl object-cover bg-stone-950 border border-stone-800 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white text-xs">{p.nameEn}</p>
                        <p className="text-[11px] text-amber-400/90 font-medium">{p.nameAr}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-stone-400">
                    {p.category}
                  </td>
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                    {formatCurrency(p.basePrice, lang)}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-stone-400">
                    {p.sizes && p.sizes.length > 0
                      ? p.sizes.map((s) => `${s.nameEn}: ${s.price}`).join(', ')
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => updateProduct({ ...p, isAvailable: !p.isAvailable })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        p.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {p.isAvailable ? t.inStock : t.outOfStock}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-rose-400 hover:bg-stone-700"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          <div className="relative w-full max-w-xl bg-[#141210] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif text-xl font-bold text-white">
                {editingProduct ? t.adminEditProduct : t.adminAddProductBtn}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {t.adminProdNameEn} *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {t.adminProdNameAr} *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {t.adminProdCategory}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="cold">Cold Drinks</option>
                    <option value="hot">Hot Drinks</option>
                    <option value="sweets">Sweets & Bakery</option>
                    <option value="addons">Syrups & Add-ons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {t.adminProdPrice} *
                  </label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Has Sizes Toggle */}
              <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-stone-200 font-bold">
                  <input
                    type="checkbox"
                    checked={hasSizes}
                    onChange={(e) => setHasSizes(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Product has multiple sizes (Regular / Large)</span>
                </label>

                {hasSizes && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-stone-400 mb-1">Regular Price (SAR)</label>
                      <input
                        type="number"
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 mb-1">Large Price (SAR)</label>
                      <input
                        type="number"
                        value={largePrice}
                        onChange={(e) => setLargePrice(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Image Section: Native Mobile Gallery Upload */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>{isAr ? 'صورة المنتج (من الاستوديو أو الكاميرا)' : 'Product Image (Gallery / Camera)'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                    className="text-[10px] text-stone-400 hover:text-amber-400 underline"
                  >
                    {showManualUrl ? (isAr ? 'إخفاء حقل الرابط' : 'Hide URL input') : (isAr ? 'لصق رابط مباشر بدلاً' : 'Paste URL instead')}
                  </button>
                </div>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />

                {/* Image Preview & Action Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  {image ? (
                    <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-stone-950 border border-stone-700 shrink-0 shadow-lg">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400"
                          title="Replace Image"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-400"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-stone-800 bg-stone-950 flex flex-col items-center justify-center text-stone-500 shrink-0">
                      <ImageIcon className="w-6 h-6 mb-1 text-stone-600" />
                      <span className="text-[10px]">{isAr ? 'لا توجد صورة' : 'No image'}</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isUploadingImage ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>{isAr ? `جاري ضغط ورفع الصورة (${uploadProgress}%)...` : `Optimizing & Uploading (${uploadProgress}%)...`}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{image ? (isAr ? 'استبدال الصورة من الهاتف 📸' : 'Replace Photo from Phone 📸') : (isAr ? 'اختيار صورة من استوديو الهاتف 📸' : 'Select Photo from Phone Gallery 📸')}</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-stone-400 text-center sm:text-start">
                      {isAr
                        ? 'يدعم JPG و PNG و WebP. يتم ضغط الصورة وتحسينها تلقائياً وسرعة رفعها للسحابة.'
                        : 'Supports JPG, PNG, WebP. Automatically optimized & compressed for fast mobile loading.'}
                    </p>

                    {uploadError && (
                      <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional Manual URL Input */}
                {showManualUrl && (
                  <div className="pt-2 border-t border-stone-800">
                    <label className="block text-stone-400 text-[10px] mb-1">
                      {isAr ? 'رابط مباشر للصورة (URL)' : 'Direct Image URL'}
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {t.adminProdDescEn}
                </label>
                <textarea
                  rows={2}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {t.adminProdDescAr}
                </label>
                <textarea
                  rows={2}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Toggles: Available, Featured, Best Seller */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 border border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="text-amber-500 rounded"
                  />
                  <span className="text-[11px] text-stone-300">Available</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 border border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="text-amber-500 rounded"
                  />
                  <span className="text-[11px] text-stone-300">Featured</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900 border border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="text-amber-500 rounded"
                  />
                  <span className="text-[11px] text-stone-300">Best Seller</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white"
                >
                  {t.adminCancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-gold-sm"
                >
                  {t.adminSaveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
