import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Coffee, Sparkles, Zap } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const { t } = useLanguage();

  const reasons = [
    {
      icon: MessageSquare,
      title: t.why1Title,
      desc: t.why1Desc,
      glow: 'group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5',
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      icon: Coffee,
      title: t.why2Title,
      desc: t.why2Desc,
      glow: 'group-hover:border-amber-500/50 group-hover:bg-amber-500/5',
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      icon: Sparkles,
      title: t.why3Title,
      desc: t.why3Desc,
      glow: 'group-hover:border-amber-400/50 group-hover:bg-amber-400/5',
      iconColor: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
    },
    {
      icon: Zap,
      title: t.why4Title,
      desc: t.why4Desc,
      glow: 'group-hover:border-amber-600/50 group-hover:bg-amber-600/5',
      iconColor: 'text-amber-500 bg-amber-600/10 border-amber-600/30',
    },
  ];

  return (
    <section id="why-us" className="py-24 bg-[#0e0d0c] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            {t.whyTitle}
          </h2>
          <p className="text-sm text-stone-400 mt-2">
            {t.whySubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className={`group p-8 rounded-3xl bg-[#141210] border border-stone-800 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-gold-glow flex flex-col justify-between ${r.glow}`}
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${r.iconColor}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed mt-3">
                    {r.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-800/80 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-stone-400">
                    TORA HOUSE
                  </span>
                  <span className="text-amber-400 text-xs">•</span>
                  <span className="text-[11px] font-semibold text-amber-400/90">
                    Standard 0{i + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
