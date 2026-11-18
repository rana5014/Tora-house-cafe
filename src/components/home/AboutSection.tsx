import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Award, Leaf, Flame, HeartHandshake } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section id="about" className="py-24 bg-[#0c0a09] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Visual Gallery Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 relative">
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden border border-stone-800 shadow-luxury aspect-[3/4] bg-stone-900">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
                  alt="Specialty Roasting"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 rounded-3xl bg-stone-900/90 border border-amber-500/30 text-start space-y-2">
                <span className="font-serif text-3xl font-black text-amber-400">100%</span>
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.aboutFeature1}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isAr ? 'حبوب منتقاة من أشهر مزارع العالم' : 'Ethically sourced single origins'}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 text-start space-y-2">
                <HeartHandshake className="w-7 h-7 text-amber-400" />
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  {isAr ? 'حفاوة وكرم سعودي' : 'Saudi Hospitality'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isAr ? 'خدمة متميزة تليق بضيوفنا' : 'Dedicated barista care in every cup'}
                </p>
              </div>
              <div className="rounded-3xl overflow-hidden border border-stone-800 shadow-luxury aspect-[3/4] bg-stone-900">
                <img
                  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
                  alt="Barista Pouring"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Text Content */}
          <div className="lg:col-span-6 space-y-6 text-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>{t.aboutBadge}</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {t.aboutTitle}
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-stone-300 leading-relaxed font-light">
              <p>{t.aboutP1}</p>
              <p>{t.aboutP2}</p>
              <p className="text-stone-400 text-xs sm:text-sm">{t.aboutP3}</p>
            </div>

            {/* Feature Bullets */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-stone-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {t.aboutFeature1}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Leaf className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {t.aboutFeature2}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {t.aboutFeature3}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
