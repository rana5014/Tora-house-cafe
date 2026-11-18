import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { getWhatsAppUrl } from '../../lib/whatsapp';
import { MessageCircle, X } from 'lucide-react';

export const WhatsAppFloating: React.FC = () => {
  const { settings } = useStore();
  const { lang } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(true);

  const destinationNumber = settings.whatsappNumber || '966579165664';
  const defaultGreeting =
    lang === 'ar'
      ? 'مرحباً كافيه بيت تورا! أرغب في الاستفسار والطلب ☕✨'
      : 'Hello Tora House! I would like to inquire or place an order ☕✨';

  const whatsappUrl = getWhatsAppUrl(destinationNumber, defaultGreeting);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Speech bubble / Tooltip */}
      {showTooltip && (
        <div className="relative mb-2.5 max-w-[220px] bg-[#1c1a18] text-stone-200 border border-amber-500/30 p-3 rounded-2xl shadow-luxury text-xs animate-fade-in">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-1.5 right-1.5 text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{lang === 'ar' ? 'باريستا تورا متواجد الآن' : 'Tora Barista Online'}</span>
          </div>
          <p className="text-stone-300 leading-relaxed text-[11px]">
            {lang === 'ar'
              ? 'تفضل بالتواصل معنا مباشرة عبر الواتساب للطلب الفوري!'
              : 'Chat directly on WhatsApp for lightning orders & inquiries!'}
          </p>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#1c1a18] border-r border-b border-amber-500/30 rotate-45" />
        </div>
      )}

      {/* Floating Official WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with Tora House"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {/* Pulsing glow ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 blur-sm animate-pulse group-hover:bg-[#25D366]/60 transition-colors" />

        {/* Official WhatsApp SVG Logo */}
        <svg
          className="w-8 h-8 sm:w-9 sm:h-9 relative z-10 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.07-1.748-.393-1.425-.591-2.342-2.03-2.413-2.125-.071-.094-.576-.767-.576-1.463 0-.696.365-1.038.495-1.178.13-.14.283-.175.377-.175.095 0 .19.001.272.005.087.004.204-.033.319.243.119.288.406.993.441 1.066.035.073.059.158.012.253-.047.094-.071.153-.142.235-.071.083-.15.185-.214.249-.071.07-.145.147-.062.289.083.141.369.608.792.985.545.485 1.004.636 1.146.707.142.071.226.059.31-.038.085-.097.362-.421.458-.565.096-.144.192-.12.32-.072.128.048.815.384.955.454.14.07.234.105.269.164.035.059.035.344-.109.749z" />
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.761.459 3.479 1.332 4.992l-1.417 5.176 5.305-1.391c1.458.796 3.104 1.216 4.77 1.216 5.508 0 9.991-4.479 9.991-9.985 0-5.506-4.48-9.992-9.991-9.992zm.001 18.232c-1.503 0-2.977-.405-4.264-1.171l-.306-.182-3.167.83.845-3.088-.2-.317c-.842-1.341-1.288-2.9-1.288-4.504 0-4.542 3.696-8.237 8.243-8.237 4.544 0 8.236 3.696 8.236 8.237 0 4.543-3.692 8.241-8.236 8.241z" />
        </svg>

        {/* Small Tora Gold Crown Badge */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-black flex items-center justify-center text-[10px] font-black text-black">
          ★
        </span>
      </a>
    </div>
  );
};
