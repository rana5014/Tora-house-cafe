import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { CoffeeCup3D } from '../3d/CoffeeCup3D';
import { ArrowRight, Sparkles, MessageCircle, Star, Flame, ShieldCheck } from 'lucide-react';
import { getWhatsAppUrl } from '../../lib/whatsapp';

interface HeroSectionProps {
  onOrderNow: () => void;
  onExploreMenu: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOrderNow, onExploreMenu }) => {
  const { lang, t, dir } = useLanguage();
  const { settings } = useStore();

  const isAr = lang === 'ar';
  const whatsappUrl = getWhatsAppUrl(settings.whatsappNumber, 'Hello Tora House!');

  return (
    <section className="relative min-h-[92vh] pt-28 pb-16 lg:py-36 flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-[#11100e] to-[#0c0a09]">
      {/* Background Decorative Ambient Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 bg-amber-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle geometric luxury grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1c190f_1px,transparent_1px),linear-gradient(to_bottom,#1f1c190f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Optional Announcement Banner */}
        {settings.showAnnouncement && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-gold-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{isAr ? settings.announcementBannerAr : settings.announcementBannerEn}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Text & Actions */}
          <div className="lg:col-span-7 text-center lg:text-start space-y-6">
            {/* Brand Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300 text-xs tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{t.heroBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
              TORA <span className="text-amber-400 underline decoration-amber-500/40 decoration-4">HOUSE</span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-stone-200 font-sans font-light mt-3">
                {t.heroTitle}
              </span>
            </h1>

            {/* Tagline Accent */}
            <p className="text-lg sm:text-xl font-serif italic text-amber-400/95 font-medium">
              "{isAr ? settings.taglineAr : settings.taglineEn}"
            </p>

            {/* Descriptive Body */}
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
              {t.heroDescription}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={onOrderNow}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-base shadow-gold-glow hover:shadow-gold-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <span>{t.heroOrderNow}</span>
                <ArrowRight
                  className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                    dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''
                  }`}
                />
              </button>

              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 text-white font-semibold text-base transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{t.heroExploreMenu}</span>
              </button>
            </div>

            {/* Highlights Micro Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-800/80 max-w-lg mx-auto lg:mx-0">
              <div className="p-3 rounded-2xl bg-stone-900/50 border border-stone-800/70 text-center">
                <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-white">{t.heroStatsDrinks}</p>
                <p className="text-[10px] text-stone-400">{isAr ? 'ساخن وبارد' : 'Specialty craft'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900/50 border border-stone-800/70 text-center">
                <Star className="w-4 h-4 text-amber-400 mx-auto mb-1 fill-amber-400" />
                <p className="text-xs font-bold text-white">{t.heroStatsRating}</p>
                <p className="text-[10px] text-stone-400">{isAr ? 'تقييم الضيوف' : 'Guest verified'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-900/50 border border-stone-800/70 text-center">
                <MessageCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-white">{t.heroStatsSpeed}</p>
                <p className="text-[10px] text-stone-400">{isAr ? 'عبر الواتساب' : 'Via WhatsApp'}</p>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Coffee Cup Experience */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Glowing circular backdrop for 3D */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-amber-600/20 via-amber-400/10 to-transparent blur-2xl" />
            </div>

            {/* 3D Component */}
            <div className="relative w-full max-w-md aspect-square rounded-3xl bg-stone-950/40 border border-stone-800/80 backdrop-blur-sm p-4 shadow-luxury">
              <CoffeeCup3D className="w-full h-full" theme="black-gold" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
