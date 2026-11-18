import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const { lang, t } = useLanguage();
  const { testimonials } = useStore();
  const isAr = lang === 'ar';

  return (
    <section id="reviews" className="py-24 bg-[#0c0a09] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold mb-3">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{isAr ? 'تقييم 4.9 من 5' : '4.9 / 5 Guest Rating'}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            {t.reviewsTitle}
          </h2>
          <p className="text-sm text-stone-400 mt-2">
            {t.reviewsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl bg-[#141210] border border-stone-800 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between hover:shadow-gold-glow group"
            >
              <div>
                {/* Rating stars & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-stone-700 group-hover:text-amber-500/50 transition-colors" />
                </div>

                {/* Comment body */}
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
                  "{isAr ? rev.commentAr : rev.commentEn}"
                </p>
              </div>

              {/* Guest Profile and item */}
              <div className="pt-6 mt-6 border-t border-stone-800/80 flex items-center gap-3">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-white truncate">{rev.name}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  </div>
                  <p className="text-[10px] text-amber-400/90 font-medium truncate">
                    {rev.favoriteItem}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
