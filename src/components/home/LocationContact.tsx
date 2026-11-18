import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { MapPin, Phone, Mail, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { getWhatsAppUrl } from '../../lib/whatsapp';

export const LocationContact: React.FC = () => {
  const { lang, t } = useLanguage();
  const { settings } = useStore();
  const isAr = lang === 'ar';

  const whatsappUrl = getWhatsAppUrl(settings.whatsappNumber, 'Hello Tora House!');
  const googleMapsUrl = 'https://maps.google.com/?q=Riyadh+Saudi+Arabia';

  return (
    <section id="contact" className="py-24 bg-[#0e0d0c] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{t.contactTitle}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            {isAr ? 'موقعنا وأوقات استقبالكم' : 'Visit Our Cafe in Riyadh'}
          </h2>
          <p className="text-sm text-stone-400 mt-2">
            {t.contactSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="p-6 rounded-3xl bg-[#141210] border border-stone-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.contactAddressTitle}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {isAr ? settings.addressAr : settings.addressEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#141210] border border-stone-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.contactHoursTitle}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {isAr ? settings.openingHoursAr : settings.openingHoursEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#141210] border border-stone-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.contactPhoneTitle}</h3>
                  <p className="text-xs text-stone-400 mt-0.5 dir-ltr">
                    {settings.phoneDisplay}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout Banner */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-[#141210] border border-emerald-500/40 hover:border-emerald-400 flex items-center justify-between gap-4 transition-all hover:scale-[1.01] active:scale-95 group shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-bold">
                  <MessageSquare className="w-6 h-6 fill-black" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                    {isAr ? 'الطلب الفوري عبر الواتساب' : 'Direct WhatsApp Concierge'}
                  </h4>
                  <p className="text-xs text-stone-400">
                    {isAr ? 'اضغط هنا لفتح محادثة مباشرة' : 'Tap to start live chat with barista'}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-emerald-400" />
            </a>
          </div>

          {/* Map Preview Card */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-stone-800 bg-[#141210] relative min-h-[360px] flex flex-col">
            {/* Visual map styled preview */}
            <div className="relative w-full flex-1 min-h-[300px] overflow-hidden bg-stone-900">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                alt="Map Background"
                className="w-full h-full object-cover opacity-40 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-black/30 to-black/50" />

              {/* Pin Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-gold-glow animate-bounce">
                  <MapPin className="w-8 h-8 text-amber-400 fill-amber-400" />
                </div>
                <h4 className="font-serif text-2xl font-bold text-white mt-4">
                  TORA HOUSE CAFE
                </h4>
                <p className="text-xs sm:text-sm text-stone-300 max-w-sm mt-1">
                  {isAr ? settings.addressAr : settings.addressEn}
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-2 shadow-gold-sm transition-all"
                >
                  <span>{t.contactOpenMap}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
