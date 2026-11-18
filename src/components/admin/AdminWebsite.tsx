import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { CafeSettings } from '../../types';
import { Save, Check, Globe } from 'lucide-react';

export const AdminWebsite: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const [form, setForm] = useState<CafeSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-white">
            {isAr ? 'محتوى ونصوص المتجر' : 'Website Content & Brand Texts'}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {isAr
              ? 'تحكم في شريط الإعلانات، الشعار اللفظي، وساعات العمل ورقم الواتساب مباشرة'
              : 'Edit live taglines, announcements, operating hours, and official WhatsApp number'}
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-gold-sm transition-all"
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? t.success : t.adminSaveBtn}</span>
        </button>
      </div>

      {/* Announcement Banner */}
      <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-4">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-white text-xs">
          <input
            type="checkbox"
            checked={form.showAnnouncement}
            onChange={(e) => setForm({ ...form, showAnnouncement: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500"
          />
          <span>{t.adminWebShowBanner}</span>
        </label>

        {form.showAnnouncement && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-stone-400 text-xs mb-1">{t.adminWebBannerEn}</label>
              <input
                type="text"
                value={form.announcementBannerEn}
                onChange={(e) => setForm({ ...form, announcementBannerEn: e.target.value })}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-stone-400 text-xs mb-1">{t.adminWebBannerAr}</label>
              <input
                type="text"
                value={form.announcementBannerAr}
                onChange={(e) => setForm({ ...form, announcementBannerAr: e.target.value })}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Taglines */}
      <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-4">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          {isAr ? 'الشعار اللفظي والهوية' : 'Brand Taglines'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebTaglineEn}</label>
            <input
              type="text"
              value={form.taglineEn}
              onChange={(e) => setForm({ ...form, taglineEn: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebTaglineAr}</label>
            <input
              type="text"
              value={form.taglineAr}
              onChange={(e) => setForm({ ...form, taglineAr: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp & Contact info */}
      <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-4">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          {isAr ? 'بيانات التواصل والواتساب' : 'WhatsApp & Contact Coordinates'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebWhatsapp}</label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white dir-ltr text-start"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Normalized format: 966579165664 (no +, no leading 0)
            </p>
          </div>
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebPhone}</label>
            <input
              type="text"
              value={form.phoneDisplay}
              onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white dir-ltr text-start"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebHoursEn}</label>
            <input
              type="text"
              value={form.openingHoursEn}
              onChange={(e) => setForm({ ...form, openingHoursEn: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebHoursAr}</label>
            <input
              type="text"
              value={form.openingHoursAr}
              onChange={(e) => setForm({ ...form, openingHoursAr: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebAddressEn}</label>
            <input
              type="text"
              value={form.addressEn}
              onChange={(e) => setForm({ ...form, addressEn: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-stone-400 text-xs mb-1">{t.adminWebAddressAr}</label>
            <input
              type="text"
              value={form.addressAr}
              onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
