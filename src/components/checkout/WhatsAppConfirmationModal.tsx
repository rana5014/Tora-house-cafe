import React, { useState } from 'react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { generateWhatsAppMessage, getWhatsAppUrl } from '../../lib/whatsapp';
import { CheckCircle2, MessageSquare, Copy, Check, ExternalLink, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WhatsAppConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOrder: () => void;
}

export const WhatsAppConfirmationModal: React.FC<WhatsAppConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewOrder,
}) => {
  const { lang, t } = useLanguage();
  const { settings } = useStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const rawMessage = generateWhatsAppMessage(order, lang);
  const destinationNumber = settings.whatsappNumber || '966579165664';
  const whatsappUrl = getWhatsAppUrl(destinationNumber, rawMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#25D366', '#E5A93C', '#FFFFFF'],
      });
    } catch {}

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-lg bg-[#141210] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 text-center space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-900 text-stone-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Title */}
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
            {t.waModalTitle}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {t.waModalSub}{' '}
            <span className="font-mono font-bold text-amber-400 text-sm">
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* Important notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{lang === 'ar' ? 'خطوة أخيرة هامة:' : 'Final Step Required:'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            {t.waModalDesc}
          </p>
        </div>

        {/* Prepared Message Preview Box */}
        <div className="relative p-4 rounded-2xl bg-stone-950/80 border border-stone-800 text-start text-xs font-mono text-stone-300 max-h-40 overflow-y-auto whitespace-pre-line leading-relaxed">
          {rawMessage}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Big Green WhatsApp Open Button */}
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <MessageSquare className="w-5 h-5 fill-black" />
            <span>{t.waOpenBtn}</span>
            <ExternalLink className="w-4 h-4 text-black/80" />
          </button>

          {/* Copy Message Fallback Button */}
          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{t.waCopiedMsg}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>{t.waCopyBtn}</span>
              </>
            )}
          </button>

          {/* View Order in My Orders */}
          <button
            onClick={() => {
              onClose();
              onViewOrder();
            }}
            className="text-xs text-amber-400 hover:underline font-semibold block mx-auto pt-1"
          >
            {t.waViewOrder} →
          </button>
        </div>
      </div>
    </div>
  );
};
