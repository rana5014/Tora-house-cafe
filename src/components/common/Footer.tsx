import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { Coffee, MapPin, Phone, Mail, Clock, Instagram, Send, Heart } from 'lucide-react';
import { getWhatsAppUrl } from '../../lib/whatsapp';

export const Footer: React.FC<{ onNavigateMenu: () => void; onNavigateHome: () => void }> = ({
  onNavigateMenu,
  onNavigateHome,
}) => {
  const { lang, t } = useLanguage();
  const { settings } = useStore();

  const isAr = lang === 'ar';
  const whatsappUrl = getWhatsAppUrl(settings.whatsappNumber, 'Hello Tora House!');

  return (
    <footer className="relative bg-[#0b0a09] border-t border-stone-800 text-stone-300 pt-16 pb-12 overflow-hidden">
      {/* Background ambient gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12 border-b border-stone-800/80">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] shadow-gold-sm">
                <div className="w-full h-full bg-[#181716] rounded-[10px] flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold tracking-wider text-white">
                  TORA <span className="text-amber-400">HOUSE</span>
                </h3>
                <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
                  {isAr ? 'قهوة • شاي • عصائر' : 'COFFEE • TEA • JUICES'}
                </p>
              </div>
            </div>

            <p className="text-xs text-amber-400/90 font-medium italic">
              "{isAr ? settings.taglineAr : settings.taglineEn}"
            </p>

            <p className="text-xs text-stone-400 leading-relaxed">
              {t.footerDesc}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-400 hover:text-amber-400 flex items-center justify-center transition-all"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 hover:border-emerald-400 hover:text-emerald-400 flex items-center justify-center transition-all"
                title="WhatsApp"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase border-b border-stone-800 pb-2">
              {t.footerQuickLinks}
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button onClick={onNavigateHome} className="hover:text-amber-400 transition-colors">
                  {t.navHome}
                </button>
              </li>
              <li>
                <button onClick={onNavigateMenu} className="hover:text-amber-400 transition-colors">
                  {t.navMenu}
                </button>
              </li>
              <li>
                <a href="#about" className="hover:text-amber-400 transition-colors">
                  {t.navAbout}
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-amber-400 transition-colors">
                  {t.navWhyUs}
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-amber-400 transition-colors">
                  {t.navReviews}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-amber-400 transition-colors">
                  {t.navContact}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours & Schedule */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase border-b border-stone-800 pb-2">
              {t.footerHours}
            </h4>
            <div className="space-y-3 text-xs text-stone-400">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-200">{isAr ? 'أوقات العمل اليومية' : 'Daily Hours'}:</p>
                  <p className="mt-0.5">{isAr ? settings.openingHoursAr : settings.openingHoursEn}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <p className="text-[11px] text-amber-300 font-medium">
                  {isAr ? '⚡ خدمة سريعة وطلب فوري عبر الواتساب طوال ساعات العمل' : '⚡ Swift WhatsApp order preparation available throughout all working hours.'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase border-b border-stone-800 pb-2">
              {t.contactTitle}
            </h4>
            <ul className="space-y-3 text-xs text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{isAr ? settings.addressAr : settings.addressEn}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${settings.whatsappNumber}`} className="hover:text-amber-400 dir-ltr">
                  {settings.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-amber-400">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>{t.footerRights}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-stone-400">
              Made with <Heart className="w-3 h-3 text-amber-500 fill-amber-500" /> for Tora House
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
