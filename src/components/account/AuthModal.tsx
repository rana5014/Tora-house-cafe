import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, User, Phone, Mail, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useAuth();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'login') {
      await login(phone || email, name);
    } else {
      await register(name, phone, email, address);
    }

    setIsLoading(false);
    setIsAuthModalOpen(false);
  };

  const handleDemoLogin = async () => {
    await login('0551234567', 'Ahmed Al-Mansoor');
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        onClick={() => setIsAuthModalOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-md bg-[#141210] border border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 space-y-6">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-900 text-stone-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            {mode === 'login' ? t.authTitleLogin : t.authTitleRegister}
          </h3>
          <p className="text-xs text-stone-400">{t.authSub}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {t.authFullName} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              {t.authPhone} *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 dir-ltr text-start"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              {t.authEmail}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {isAr ? 'عنوان التوصيل الافتراضي' : 'Default Delivery Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isAr ? 'حي الملقا، الرياض' : 'District, City'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-gold-sm transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <span>{mode === 'login' ? t.authBtnLogin : t.authBtnRegister}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>

        <div className="pt-2 border-t border-stone-800/80 space-y-3 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-stone-400 hover:text-amber-400 transition-colors"
          >
            {mode === 'login' ? t.authSwitchToReg : t.authSwitchToLogin}
          </button>

          {/* Quick Demo Login */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold flex items-center justify-center gap-1.5 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل دخول تجريبي فوري (أحمد المنصور)' : 'Instant Demo Login (Ahmed)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
