import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { AdminOverview } from './AdminOverview';
import { AdminProducts } from './AdminProducts';
import { AdminAddOns } from './AdminAddOns';
import { AdminOrders } from './AdminOrders';
import { AdminWebsite } from './AdminWebsite';
import { AdminCustomers } from './AdminCustomers';
import { AdminSettings } from './AdminSettings';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { api } from '../../lib/api';
import {
  X,
  LayoutDashboard,
  Coffee,
  ShoppingBag,
  Globe,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  Lock,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Mail,
  ShieldAlert,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, isAdminModalOpen, setIsAdminModalOpen, adminLogin, adminLogout } = useAuth();
  const { lang, t } = useLanguage();
  const { syncStatus } = useStore();
  const isAr = lang === 'ar';

  const [loginMethod, setLoginMethod] = useState<'pin' | 'supabase'>('pin');
  const [pin, setPin] = useState('');
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);

  // Supabase Auth Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // First-time owner setup state
  const isConfigured = api.isPinConfigured();
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(!isConfigured);
  const [newSetupPin, setNewSetupPin] = useState('');
  const [confirmSetupPin, setConfirmSetupPin] = useState('');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'addons' | 'orders' | 'website' | 'customers' | 'settings'
  >('overview');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Mode on Login Screen
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isAdminModalOpen) return null;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg(null);
    const cleanPin = pin.trim();

    if (cleanPin.toLowerCase() === 'tora2026') {
      setLoginErrorMsg(
        isAr
          ? 'تم إلغاء الرمز الافتراضي tora2026 نهائياً لتعزيز الأمان. يرجى استخدام رمز PIN الخاص بك أو إعداده لأول مرة.'
          : 'The default PIN "tora2026" has been permanently removed for security. Please use your custom PIN or set one up.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await adminLogin(cleanPin);
      if (success) {
        setPin('');
      } else {
        setLoginErrorMsg(isAr ? 'رمز الدخول غير صحيح' : 'Incorrect PIN. Please try again.');
      }
    } catch (err: any) {
      setLoginErrorMsg(err.message || (isAr ? 'رمز الدخول غير صحيح' : 'Incorrect PIN. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg(null);
    const p1 = newSetupPin.trim();
    const p2 = confirmSetupPin.trim();

    if (p1.length < 4) {
      setLoginErrorMsg(isAr ? 'يجب أن يتكون رمز PIN من 4 خانات على الأقل' : 'PIN must be at least 4 characters');
      return;
    }
    if (p1.toLowerCase() === 'tora2026') {
      setLoginErrorMsg(isAr ? 'الرمز tora2026 محظور تماماً. يرجى اختيار رمز خاص قوي.' : 'Default PIN "tora2026" is forbidden. Please choose a private PIN.');
      return;
    }
    if (p1 !== p2) {
      setLoginErrorMsg(isAr ? 'رمزا PIN غير متطابقين' : 'PINs do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.adminSetupInitialPin(p1);
      await adminLogin(p1);
      setIsFirstTimeSetup(false);
      setNewSetupPin('');
      setConfirmSetupPin('');
    } catch (err: any) {
      setLoginErrorMsg(err.message || (isAr ? 'فشل حفظ الرمز' : 'Failed to configure PIN'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg(null);
    if (!adminEmail.trim() || !adminPassword) {
      setLoginErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.adminLoginSupabase(adminEmail.trim(), adminPassword);
      if (res.success) {
        window.location.reload();
      }
    } catch (err: any) {
      setLoginErrorMsg(err.message || (isAr ? 'فشل تسجيل الدخول عبر Supabase' : 'Supabase authentication failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus(null);
    try {
      const res = await api.adminRecovery(recoveryKey.trim(), recoveryPin.trim());
      setRecoveryStatus({
        success: true,
        msg: isAr
          ? 'تمت إعادة تعيين رمز PIN بنجاح! يمكنك الآن تسجيل الدخول بالرمز الجديد.'
          : 'PIN reset successfully! You can now log in with your new PIN.',
      });
      setPin(recoveryPin.trim());
      setIsRecoveryOpen(false);
      setIsFirstTimeSetup(false);
      setRecoveryKey('');
      setRecoveryPin('');
    } catch (err: any) {
      setRecoveryStatus({
        success: false,
        msg: err.message || (isAr ? 'فشل استرداد الرمز' : 'Invalid recovery key or PIN'),
      });
    }
  };

  const navTabs = [
    { id: 'overview' as const, label: isAr ? 'لوحة التحكم' : 'Overview', icon: LayoutDashboard },
    { id: 'products' as const, label: isAr ? '✏️ تعديل المنتجات والمنيو' : '✏️ Edit Products & Menu', icon: Coffee },
    { id: 'addons' as const, label: isAr ? '✨ النكهات والإضافات' : '✨ Flavors & Add-ons', icon: Sparkles },
    { id: 'orders' as const, label: isAr ? '📦 الطلبات والواتساب' : '📦 Orders & WhatsApp', icon: ShoppingBag },
    { id: 'website' as const, label: isAr ? '🌐 تعديل بيانات الموقع' : '🌐 Edit Website Info', icon: Globe },
    { id: 'customers' as const, label: isAr ? '👥 العملاء' : 'Customers', icon: Users },
    { id: 'settings' as const, label: isAr ? '🔑 تغيير الـ PIN والإعدادات' : '🔑 Change PIN & Settings', icon: KeyRound },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => setIsAdminModalOpen(false)}
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-6xl bg-[#121110] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col h-[94vh]">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#151413]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
                  {t.adminTitle}
                </h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-sans font-bold whitespace-nowrap">
                    v1.0 Live
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-sans font-bold flex items-center gap-1 whitespace-nowrap ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                    title={syncStatus === 'synced' ? 'Connected to Centralized Cloud Database' : 'Using Local Storage'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                    <span>{syncStatus === 'synced' ? 'Cloud Sync' : syncStatus === 'syncing' ? 'Syncing...' : 'Local DB'}</span>
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-stone-400">
                Tora House • Coffee • Tea • Juices Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                  }`}
                  title={isAr ? 'تغيير رمز PIN' : 'Change Admin PIN'}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'تغيير PIN' : 'Change PIN'}</span>
                </button>

                <button
                  onClick={adminLogout}
                  className="px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title={t.adminLogout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.adminLogout}</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsAdminModalOpen(false)}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAdmin ? (
          /* Secure Owner Authentication Screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-stone-900/60 border border-stone-800 rounded-3xl p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  {isFirstTimeSetup
                    ? (isAr ? 'إعداد رمز دخول المالك' : 'First-Time Owner Setup')
                    : (isAr ? 'منطقة المشرفين المصرح لهم' : 'Authorized Access Only')}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  {isFirstTimeSetup
                    ? (isAr ? 'لحماية متجرك، يرجى إنشاء رمز PIN خاص بك للدخول' : 'Create your private owner PIN to protect your store')
                    : t.adminLoginPrompt}
                </p>
              </div>

              {/* Login Method Toggle (When not first time setup) */}
              {!isFirstTimeSetup && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-950 border border-stone-800 rounded-2xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('pin');
                      setLoginErrorMsg(null);
                    }}
                    className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      loginMethod === 'pin'
                        ? 'bg-amber-500 text-black shadow-gold-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isAr ? 'رمز PIN' : 'Owner PIN'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('supabase');
                      setLoginErrorMsg(null);
                    }}
                    className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      loginMethod === 'supabase'
                        ? 'bg-amber-500 text-black shadow-gold-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isAr ? 'سوبابيز' : 'Supabase'}</span>
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {loginErrorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-start">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginErrorMsg}</span>
                </div>
              )}

              {/* Form 1: First-Time Owner PIN Setup */}
              {isFirstTimeSetup ? (
                <form onSubmit={handleFirstTimeSetup} className="space-y-3.5 text-start">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      {isAr ? 'رمز PIN الجديد (4+ خانات)' : 'New Owner PIN (4+ chars)'}
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={newSetupPin}
                      onChange={(e) => setNewSetupPin(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-2xl p-3 text-center text-sm tracking-widest text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      {isAr ? 'تأكيد رمز PIN' : 'Confirm Owner PIN'}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmSetupPin}
                      onChange={(e) => setConfirmSetupPin(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-2xl p-3 text-center text-sm tracking-widest text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-extrabold text-xs shadow-gold-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{isSubmitting ? '...' : (isAr ? 'حفظ الرمز وتفعيل الإدارة' : 'Save PIN & Enter Portal')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </form>
              ) : loginMethod === 'pin' ? (
                /* Form 2: Standard PIN Login */
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      autoFocus
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        setLoginErrorMsg(null);
                      }}
                      placeholder={t.adminPinLabel}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-2xl p-3.5 text-center text-sm tracking-widest text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-extrabold text-xs shadow-gold-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{isSubmitting ? '...' : t.adminLoginBtn}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                  </button>
                </form>
              ) : (
                /* Form 3: Supabase Email & Password Auth */
                <form onSubmit={handleSupabaseLogin} className="space-y-3.5 text-start">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      {isAr ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@torahouse.sa"
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-2xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      {isAr ? 'كلمة المرور' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-2xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-extrabold text-xs shadow-gold-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{isSubmitting ? '...' : (isAr ? 'تسجيل الدخول عبر سوبابيز' : 'Sign in with Supabase')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </form>
              )}

              {/* Forgot PIN Recovery Accordion */}
              {!isFirstTimeSetup && loginMethod === 'pin' && (
                <div className="pt-2 border-t border-stone-800/80">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(!isRecoveryOpen)}
                    className="text-xs text-amber-400 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isRecoveryOpen ? (isAr ? 'إلغاء الاسترداد' : 'Cancel Recovery') : (isAr ? 'استرداد الرمز بمفتاح الطوارئ' : 'Emergency PIN Recovery')}</span>
                  </button>

                  {isRecoveryOpen && (
                    <form onSubmit={handleRecoverySubmit} className="mt-3 p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3 text-start">
                      <p className="text-[11px] text-stone-400">
                        {isAr ? 'أدخل مفتاح الاسترداد والرمز الجديد المطلوب تعيينه:' : 'Enter your Master Recovery Key and desired new PIN:'}
                      </p>
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-1">Master Recovery Key</label>
                        <input
                          type="text"
                          required
                          value={recoveryKey}
                          onChange={(e) => setRecoveryKey(e.target.value)}
                          placeholder="TORA-RECOVER-..."
                          className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-1">{isAr ? 'رمز PIN الجديد' : 'New PIN'}</label>
                        <input
                          type="password"
                          required
                          value={recoveryPin}
                          onChange={(e) => setRecoveryPin(e.target.value)}
                          placeholder="New PIN (4+ digits)"
                          className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
                      >
                        {isAr ? 'إعادة تعيين والدخول' : 'Reset & Log In'}
                      </button>
                    </form>
                  )}

                  {recoveryStatus && (
                    <p className={`mt-2 text-[11px] font-semibold ${recoveryStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {recoveryStatus.msg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-stone-800 bg-[#161513] p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap text-start ${
                      isSelected
                        ? 'bg-amber-500 text-black shadow-gold-sm'
                        : 'text-stone-400 hover:text-white hover:bg-stone-900/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Main Panel */}
            <main className="flex-1 p-5 sm:p-8 overflow-y-auto bg-[#100f0e]">
              {activeTab === 'overview' && (
                <AdminOverview
                  onSelectTab={setActiveTab}
                  onOpenReceipt={setReceiptOrder}
                />
              )}
              {activeTab === 'products' && <AdminProducts />}
              {activeTab === 'addons' && <AdminAddOns />}
              {activeTab === 'orders' && (
                <AdminOrders onOpenReceipt={setReceiptOrder} />
              )}
              {activeTab === 'website' && <AdminWebsite />}
              {activeTab === 'customers' && <AdminCustomers />}
              {activeTab === 'settings' && <AdminSettings />}
            </main>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptPrintModal
        order={receiptOrder}
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
};
