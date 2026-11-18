import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured, getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection, normalizeSupabaseUrl } from '../../lib/supabaseClient';
import { api } from '../../lib/api';
import {
  Save,
  Check,
  RefreshCw,
  Database,
  ShieldAlert,
  KeyRound,
  Lock,
  Copy,
  CheckCheck,
  Send,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  LogOut,
  History,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetProductsToDefault,
    syncStatus,
    isSyncing,
    syncError,
    refreshData,
    seedCloudDatabase,
  } = useStore();
  const { lang, t } = useLanguage();
  const { adminLogout } = useAuth();
  const isAr = lang === 'ar';

  // ─── Store Operations State ──────────────────────────────────────────
  const [deliveryFee, setDeliveryFee] = useState(String(settings.deliveryFee));
  const [freeThreshold, setFreeThreshold] = useState(String(settings.freeDeliveryThreshold));
  const [isSavedOps, setIsSavedOps] = useState(false);

  // ─── PIN Change State ────────────────────────────────────────────────
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // ─── Security Info & Recovery State ──────────────────────────────────
  const [securityInfo, setSecurityInfo] = useState<{
    lastPinChange?: string;
    activeSessionsCount?: number;
    recoveryKeyPreview?: string;
    recentAuditLogs?: Array<{ action: string; timestamp: string; ip: string; success: boolean }>;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [recoveryNewPin, setRecoveryNewPin] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── WhatsApp Config State ───────────────────────────────────────────
  const [waConfig, setWaConfig] = useState<{
    isConfigured: boolean;
    hasToken: boolean;
    hasPhoneId: boolean;
    destinationPhone: string;
    phoneId?: string;
  } | null>(null);
  const [waToken, setWaToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waDestination, setWaDestination] = useState('966579165664');
  const [showWaToken, setShowWaToken] = useState(false);
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [waSaveMsg, setWaSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Supabase Cloud Sync State ───────────────────────────────────────
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseCredentials().anonKey);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [supabaseSaveMsg, setSupabaseSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const cleaned = normalizeSupabaseUrl(supabaseUrlInput);
      if (cleaned && cleaned !== supabaseUrlInput) {
        setSupabaseUrlInput(cleaned);
      }
      const res = await testSupabaseConnection(cleaned || supabaseUrlInput, supabaseKeyInput);
      if (res.cleanedUrl && res.cleanedUrl !== supabaseUrlInput) {
        setSupabaseUrlInput(res.cleanedUrl);
      }
      setSupabaseTestResult(res);
    } catch (e: any) {
      setSupabaseTestResult({ success: false, message: e.message || 'Connection failed' });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSupabase(true);
    setSupabaseSaveMsg(null);
    try {
      const cleanUrl = normalizeSupabaseUrl(supabaseUrlInput);
      if (cleanUrl !== supabaseUrlInput) {
        setSupabaseUrlInput(cleanUrl);
      }
      saveSupabaseCredentials(cleanUrl, supabaseKeyInput);
      await refreshData();
      setSupabaseSaveMsg({
        type: 'success',
        text: isAr ? 'تم حفظ بيانات Supabase وتفعيل المزامنة الفورية السحابية بنجاح!' : 'Supabase credentials saved! Centralized cloud sync is now active.',
      });
    } catch (e: any) {
      setSupabaseSaveMsg({ type: 'error', text: e.message || 'Failed to save credentials' });
    } finally {
      setIsSavingSupabase(false);
    }
  };

  const handleSeedCloudDatabase = async () => {
    setIsSeedingDb(true);
    setSeedResult(null);
    try {
      const res = await seedCloudDatabase();
      setSeedResult(res);
    } catch (e: any) {
      setSeedResult({ success: false, message: e.message || 'Seeding failed' });
    } finally {
      setIsSeedingDb(false);
    }
  };

  // Load Security Info and WhatsApp Config
  const loadData = async () => {
    try {
      const sec = await api.adminGetSecurityInfo();
      setSecurityInfo(sec);
    } catch (e) {
      console.warn('Security info fetch:', e);
    }

    try {
      const wa = await api.adminGetWhatsAppConfig();
      setWaConfig(wa);
      if (wa.phoneId) setWaPhoneId(wa.phoneId);
      if (wa.destinationPhone) setWaDestination(wa.destinationPhone);
    } catch (e) {
      console.warn('WhatsApp config fetch:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── 1. Handle PIN Change ────────────────────────────────────────────
  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (!currentPin) {
      setPinMessage({ type: 'error', text: isAr ? 'يرجى إدخال رمز PIN الحالي' : 'Please enter your current PIN' });
      return;
    }
    if (!newPin || newPin.length < 4) {
      setPinMessage({ type: 'error', text: isAr ? 'يجب أن يتكون الرمز الجديد من 4 خانات على الأقل' : 'New PIN must be at least 4 characters' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage({ type: 'error', text: isAr ? 'رمز PIN الجديد غير متطابق' : 'New PINs do not match' });
      return;
    }
    if (currentPin.trim() === newPin.trim()) {
      setPinMessage({ type: 'error', text: isAr ? 'الرمز الجديد يجب أن يكون مختلفاً عن الرمز الحالي' : 'New PIN must be different from current PIN' });
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await api.adminChangePin(currentPin, newPin);
      setPinMessage({ type: 'success', text: isAr ? 'تم تغيير رمز PIN بنجاح!' : res.message || 'PIN updated successfully!' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      loadData();
    } catch (err: any) {
      setPinMessage({ type: 'error', text: err.message || (isAr ? 'فشل تغيير الرمز. تحقق من الرمز الحالي.' : 'Failed to update PIN. Verify current PIN.') });
    } finally {
      setIsChangingPin(false);
    }
  };

  // ─── 2. Handle Master Recovery ───────────────────────────────────────
  const handleRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMsg(null);

    if (!recoveryKeyInput.trim() || !recoveryNewPin.trim()) {
      setRecoveryMsg({ type: 'error', text: isAr ? 'يرجى ملء جميع الحقول' : 'Please fill all fields' });
      return;
    }

    try {
      const res = await api.adminRecovery(recoveryKeyInput.trim(), recoveryNewPin.trim());
      setRecoveryMsg({
        type: 'success',
        text: isAr ? `تمت إعادة تعيين رمز PIN بنجاح! المفتاح الجديد: ${res.newRecoveryKey}` : `PIN reset successfully! Your new Master Key is: ${res.newRecoveryKey}`,
      });
      setRecoveryKeyInput('');
      setRecoveryNewPin('');
      loadData();
    } catch (err: any) {
      setRecoveryMsg({ type: 'error', text: err.message || 'Recovery failed' });
    }
  };

  // ─── 3. Copy Recovery Key ────────────────────────────────────────────
  const copyRecoveryKey = () => {
    if (securityInfo?.recoveryKeyPreview) {
      navigator.clipboard.writeText(securityInfo.recoveryKeyPreview);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // ─── 4. Logout All Sessions ──────────────────────────────────────────
  const handleLogoutAll = async () => {
    if (window.confirm(isAr ? 'هل تريد تسجيل الخروج من جميع الجلسات والأجهزة؟' : 'Log out from all active admin sessions on all devices?')) {
      await api.adminLogoutAll();
      adminLogout();
    }
  };

  // ─── 5. Save WhatsApp Config ─────────────────────────────────────────
  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaSaveMsg(null);
    setIsSavingWa(true);

    try {
      const res = await api.adminSaveWhatsAppConfig({
        token: waToken || undefined,
        phoneNumberId: waPhoneId || undefined,
        destinationPhone: waDestination || undefined,
      });

      if (res.success) {
        setWaConfig(res);
        setWaSaveMsg({
          type: 'success',
          text: isAr ? 'تم حفظ إعدادات واتساب بنجاح!' : 'WhatsApp API configuration saved successfully!',
        });
        setWaToken('');
      }
    } catch (err: any) {
      setWaSaveMsg({ type: 'error', text: err.message || 'Failed to save configuration' });
    } finally {
      setIsSavingWa(false);
    }
  };

  // ─── 6. Test WhatsApp Notification ───────────────────────────────────
  const handleTestWhatsApp = async () => {
    setWaTestResult(null);
    setIsTestingWa(true);

    try {
      const res = await api.adminTestWhatsApp();
      if (res.success) {
        setWaTestResult({
          success: true,
          message: isAr
            ? `تم إرسال إشعار تجريبي بنجاح إلى رقمك (+${waConfig?.destinationPhone || waDestination})! تحقق من رسائل واتساب.`
            : `Live test notification sent successfully to +${waConfig?.destinationPhone || waDestination}! Check your WhatsApp.`,
        });
      } else {
        setWaTestResult({
          success: false,
          message: res.error || (isAr ? 'فشل إرسال الإشعار. يرجى التأكد من التوكن و Phone Number ID.' : 'Failed to send test notification. Check your Token and Phone Number ID.'),
        });
      }
    } catch (err: any) {
      setWaTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setIsTestingWa(false);
    }
  };

  // ─── 7. Save Operations ──────────────────────────────────────────────
  const handleSaveOps = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      ...settings,
      deliveryFee: Number(deliveryFee) || 10,
      freeDeliveryThreshold: Number(freeThreshold) || 75,
    });
    setIsSavedOps(true);
    setTimeout(() => setIsSavedOps(false), 2000);
  };

  // ─── 8. Reset Menu ───────────────────────────────────────────────────
  const handleResetMenu = () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من استعادة قائمة المنيو الأصلية والأسعار الأساسية؟' : 'Are you sure you want to reset all products and prices back to default reference menu?')) {
      resetProductsToDefault();
      alert(isAr ? 'تمت استعادة المنيو الأصلي بنجاح!' : 'Menu reset to default successfully!');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: ADMIN SECURITY & PIN SETTINGS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'أمان الدخول وتغيير رمز PIN' : 'Admin Security & PIN Settings'}</span>
              </h3>
              <p className="text-xs text-stone-400">
                {isAr ? 'تغيير رمز PIN الخاص بمالك المتجر والمفتاح الاحتياطي' : 'Change your owner Admin PIN, view recovery key, and manage sessions'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogoutAll}
            className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Log out from all devices"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'تسجيل خروج من كل الأجهزة' : 'Logout All Devices'}</span>
          </button>
        </div>

        {/* Change PIN Form */}
        <form onSubmit={handlePinChange} className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            {isAr ? 'تغيير رمز PIN الحالي' : 'Change Current Admin PIN'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-300 text-xs font-medium mb-1">
                {isAr ? 'رمز PIN الحالي *' : 'Current PIN *'}
              </label>
              <div className="relative">
                <input
                  type={showPins ? 'text' : 'password'}
                  required
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder={isAr ? 'أدخل الرمز الحالي' : 'Enter current PIN'}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 text-xs font-medium mb-1">
                {isAr ? 'رمز PIN الجديد *' : 'New PIN *'}
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={isAr ? 'رمز جديد (4+ خانات)' : 'New PIN (4+ chars)'}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-300 text-xs font-medium mb-1">
                {isAr ? 'تأكيد الرمز الجديد *' : 'Confirm New PIN *'}
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder={isAr ? 'أعد إدخال الرمز الجديد' : 'Re-enter new PIN'}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1.5"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPins ? (isAr ? 'إخفاء الأرقام' : 'Hide digits') : (isAr ? 'إظهار الأرقام' : 'Show digits')}</span>
            </button>

            <button
              type="submit"
              disabled={isChangingPin}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-xs font-bold flex items-center gap-1.5 shadow-gold-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPin ? '...' : isAr ? 'حفظ رمز PIN الجديد' : 'Update Admin PIN'}</span>
            </button>
          </div>

          {pinMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                pinMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {pinMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{pinMessage.text}</span>
            </div>
          )}
        </form>

        {/* Master Recovery Key Card */}
        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'مفتاح الاسترداد في حالات الطوارئ (Master Recovery Key)' : 'Master Emergency Recovery Key'}</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {isAr
                  ? 'احفظ هذا المفتاح في مكان آمن. يتيح لك إعادة تعيين رمز PIN إذا نسيته دون فقدان أي بيانات.'
                  : 'Save this key safely. If you ever forget your PIN, use this key to reset it instantly.'}
              </p>
            </div>

            <button
              type="button"
              onClick={copyRecoveryKey}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copiedKey ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ المفتاح' : 'Copy Key')}</span>
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 font-mono text-xs text-amber-400 break-all select-all">
            {securityInfo?.recoveryKeyPreview || 'Loading recovery key...'}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setRecoveryMode(!recoveryMode)}
              className="text-xs text-amber-400/90 hover:text-amber-300 font-semibold underline underline-offset-4"
            >
              {recoveryMode
                ? (isAr ? 'إخفاء نموذج الاسترداد' : 'Hide recovery form')
                : (isAr ? 'هل نسيت رمز PIN؟ اضغط هنا لإعادة تعيينه بواسطة مفتاح الاسترداد' : 'Forgot PIN? Click here to reset using Master Recovery Key')}
            </button>
          </div>

          {recoveryMode && (
            <form onSubmit={handleRecoveryReset} className="pt-3 border-t border-stone-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 text-xs font-medium mb-1">
                    {isAr ? 'مفتاح الاسترداد الكامل' : 'Master Recovery Key'}
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryKeyInput}
                    onChange={(e) => setRecoveryKeyInput(e.target.value)}
                    placeholder="TORA-RECOVER-..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 text-xs font-medium mb-1">
                    {isAr ? 'رمز PIN الجديد المطلوب تعيينه' : 'Set New PIN'}
                  </label>
                  <input
                    type="password"
                    required
                    value={recoveryNewPin}
                    onChange={(e) => setRecoveryNewPin(e.target.value)}
                    placeholder="New PIN (e.g. 5566)"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
              >
                {isAr ? 'إعادة ضبط PIN الآن' : 'Reset PIN with Recovery Key'}
              </button>

              {recoveryMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs ${
                    recoveryMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {recoveryMsg.text}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Security Audit Activity */}
        {securityInfo?.recentAuditLogs && securityInfo.recentAuditLogs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-stone-800/80">
            <p className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-stone-400" />
              <span>{isAr ? 'سجل العمليات وتسجيل الدخول الأخير' : 'Recent Admin Security Activity'}</span>
            </p>
            <div className="space-y-1.5">
              {securityInfo.recentAuditLogs.slice(0, 4).map((log, i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-stone-950/80 border border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400"
                >
                  <span className="font-medium text-stone-300">{log.action}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-stone-500">{log.ip}</span>
                    <span className="text-stone-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: WHATSAPP BUSINESS API INTEGRATION
          ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'إشعارات واتساب التلقائية للطلبات' : 'WhatsApp Automatic Order Notifications'}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-sans font-bold ${
                    waConfig?.isConfigured
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  }`}
                >
                  {waConfig?.isConfigured
                    ? isAr ? 'متصل وجاهز' : 'Active & Ready'
                    : isAr ? 'بحاجة للربط' : 'Setup Required'}
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                {isAr
                  ? 'إرسال تفاصيل كل طلب فوراً وبشكل تلقائي إلى رقمك على واتساب (+966579165664)'
                  : 'Instantly dispatches full order notifications directly to your phone (+966579165664)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestWhatsApp}
            disabled={isTestingWa}
            className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Send test message to your WhatsApp"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTestingWa ? '...' : isAr ? 'إرسال تجربة الآن' : 'Send Test Ping'}</span>
          </button>
        </div>

        {/* WhatsApp Notification Explanation */}
        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{isAr ? 'لماذا لم تصل الرسائل إلى واتساب بعد؟' : 'Why haven’t notifications reached WhatsApp yet?'}</span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            {isAr
              ? 'تعتمد هذه الميزة على واجهة Meta WhatsApp Business Cloud API الرسمية. لكي يتمكن السيرفر من إرسال رسائل تلقائية إلى رقمك دون تدخل بشري، يلزم إدخال رمز الوصول (Access Token) ومعرف الرقم (Phone Number ID) من لوحة مطوري فيسبوك (مجاناً).'
              : 'This feature uses the official Meta WhatsApp Business Cloud API. For the server to send automated messages directly to your WhatsApp without manual customer interaction, Meta requires a free Cloud API Access Token and Phone Number ID.'}
          </p>
        </div>

        {/* WhatsApp Credentials Form */}
        <form onSubmit={handleSaveWhatsApp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-300 text-xs font-semibold mb-1">
                {isAr ? 'رقم الواتساب المستلم (رقمك المعتمد)' : 'Destination Phone (Your WhatsApp Number)'}
              </label>
              <input
                type="text"
                value={waDestination}
                onChange={(e) => setWaDestination(e.target.value)}
                placeholder="966579165664"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white font-mono"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Official Tora House WhatsApp: <code className="text-amber-400">966579165664</code>
              </p>
            </div>

            <div>
              <label className="block text-stone-300 text-xs font-semibold mb-1">
                {isAr ? 'معرف رقم الهاتف من ميتا (Phone Number ID)' : 'Meta Phone Number ID'}
              </label>
              <input
                type="text"
                value={waPhoneId}
                onChange={(e) => setWaPhoneId(e.target.value)}
                placeholder="e.g. 512984718567123"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-stone-300 text-xs font-semibold">
                {isAr ? 'رمز وصول ميتا (Meta Access Token)' : 'Meta WhatsApp Cloud API Access Token'}
              </label>
              <button
                type="button"
                onClick={() => setShowWaToken(!showWaToken)}
                className="text-[10px] text-stone-400 hover:text-stone-200 flex items-center gap-1"
              >
                {showWaToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showWaToken ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showWaToken ? 'text' : 'password'}
              value={waToken}
              onChange={(e) => setWaToken(e.target.value)}
              placeholder={waConfig?.hasToken ? '(Token configured — leave blank to keep current, or paste new token)' : 'EAABw... (paste token from Meta Developer portal)'}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-400 hover:underline"
            >
              {isAr ? 'دليل إعداد Meta Cloud API خطوة بخطوة ↗' : 'Meta WhatsApp Cloud API Setup Guide ↗'}
            </a>

            <button
              type="submit"
              disabled={isSavingWa}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-xs font-bold flex items-center gap-1.5 shadow-gold-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingWa ? '...' : isAr ? 'حفظ إعدادات واتساب' : 'Save WhatsApp API Settings'}</span>
            </button>
          </div>

          {waSaveMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                waSaveMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {waSaveMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{waSaveMsg.text}</span>
            </div>
          )}

          {waTestResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                waTestResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {waTestResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{waTestResult.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: STORE OPERATIONS & DELIVERY FEES
          ══════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSaveOps} className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
              {isAr ? 'إعدادات المتجر والعمليات' : 'Store Operations & Fees'}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {isAr ? 'إدارة رسوم التوصيل، حد التوصيل المجاني، والعملة' : 'Configure delivery costs, thresholds, and currency'}
            </p>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-gold-sm transition-all"
          >
            {isSavedOps ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSavedOps ? t.success : t.adminSaveBtn}</span>
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-300 text-xs font-semibold mb-1">
                {t.adminSettingsDeliveryFee}
              </label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-stone-300 text-xs font-semibold mb-1">
                {t.adminSettingsFreeDelivery}
              </label>
              <input
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-400 text-xs mb-1">Currency</label>
            <input
              type="text"
              disabled
              value="Saudi Riyal (SAR / ر.س)"
              className="w-full bg-stone-900/50 border border-stone-800/80 rounded-xl p-2.5 text-xs text-stone-500 cursor-not-allowed"
            />
          </div>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: CENTRALIZED CLOUD DATABASE & REALTIME SYNC (SUPABASE)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'قاعدة البيانات المركزية والمزامنة الفورية (Supabase)' : 'Centralized Cloud Database & Realtime Sync'}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-sans font-bold flex items-center gap-1.5 ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-stone-800/80 border-stone-700 text-stone-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                  {syncStatus === 'synced'
                    ? (isAr ? 'متصل سحابياً (Realtime شغال)' : 'Connected & Realtime Active')
                    : syncStatus === 'syncing'
                    ? (isAr ? 'جاري المزامنة...' : 'Syncing...')
                    : (isAr ? 'بحاجة للربط' : 'Not Connected')}
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr
                  ? 'قاعدة بيانات سحابية موحدة تربط كل المتصفحات والأجهزة (Chrome, Kiwi, Mises, Firefox) وتحدث المنيو والأسعار والموقع فورياً دون الحاجة لتحديث الصفحة.'
                  : 'Single centralized cloud database for all browsers & devices. Edits in Chrome appear instantly in Kiwi, Mises & Firefox.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSupabaseGuide(!showSupabaseGuide)}
            className="px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{showSupabaseGuide ? (isAr ? 'إخفاء الدليل' : 'Hide Guide') : (isAr ? 'دليل الإعداد السريع' : 'Setup Guide')}</span>
          </button>
        </div>

        {/* Setup Guide Accordion */}
        {showSupabaseGuide && (
          <div className="p-4 rounded-2xl bg-stone-950 border border-amber-500/30 space-y-3 text-xs text-stone-300">
            <h5 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'كيفية ربط قاعدة بيانات Supabase المجانية في 3 خطوات بسيطة:' : 'How to connect your free Supabase database in 3 easy steps:'}</span>
            </h5>
            <ol className="list-decimal list-inside space-y-2 text-stone-400 leading-relaxed">
              <li>
                <strong className="text-white">Create Project:</strong> Open{' '}
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and create a free project.
              </li>
              <li>
                <strong className="text-white">Run SQL Script:</strong> In your Supabase dashboard, click <em>SQL Editor ➔ New Query</em>, paste the contents of{' '}
                <code className="text-amber-300 bg-stone-900 px-1.5 py-0.5 rounded">schema.sql</code>, and click <em>Run</em>.
              </li>
              <li>
                <strong className="text-white">Copy Credentials:</strong> Go to <em>Project Settings ➔ API</em> and copy your{' '}
                <strong className="text-amber-400">Project URL</strong> and <strong className="text-amber-400">anon public key</strong>. Paste them below and click <em>Save & Connect</em>!
              </li>
            </ol>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90">
              🔒 <strong>Security Guarantee:</strong> Row Level Security (RLS) is active. Never enter the <code>service_role</code> secret key in the frontend. Only the public <code>anon</code> key is used.
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSaveSupabase} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-300 text-xs font-semibold mb-1">
                {isAr ? '1. رابط مشروع Supabase (Project URL) *' : '1. Supabase Project URL *'}
              </label>
              <input
                type="text"
                required
                value={supabaseUrlInput}
                onChange={(e) => {
                  const val = e.target.value;
                  // If pasted with /rest/v1/, instantly clean it
                  if (val.includes('/rest/v1') || val.includes('/rest')) {
                    setSupabaseUrlInput(normalizeSupabaseUrl(val));
                  } else {
                    setSupabaseUrlInput(val);
                  }
                }}
                placeholder="https://[project-id].supabase.co"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                {isAr
                  ? 'من لوحة Supabase: Data API ➔ API URL أو Project Settings ➔ API (يتم إزالة /rest/v1 تلقائياً)'
                  : 'From Supabase: Data API ➔ API URL OR Settings ➔ API (auto-strips /rest/v1)'}
              </p>
            </div>

            <div>
              <label className="block text-stone-300 text-xs font-semibold mb-1">
                {isAr ? '2. المفتاح العام (Publishable / Anon Key) *' : '2. Supabase Anon / Publishable Key *'}
              </label>
              <input
                type="password"
                required
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value.trim())}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                {isAr
                  ? 'من لوحة Supabase: API Keys ➔ Publishable key أو View legacy API keys ➔ anon public'
                  : 'From Supabase: API Keys ➔ Publishable key OR View legacy API keys ➔ anon public'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isTestingSupabase ? (isAr ? 'جاري الفحص...' : 'Testing...') : (isAr ? 'اختبار الاتصال' : 'Test Connection')}</span>
              </button>

              <button
                type="button"
                onClick={handleSeedCloudDatabase}
                disabled={isSeedingDb || !supabaseUrlInput}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Upload all local products and cafe settings to Supabase"
              >
                <Database className={`w-3.5 h-3.5 ${isSeedingDb ? 'animate-pulse' : ''}`} />
                <span>{isSeedingDb ? (isAr ? 'جاري الرفع...' : 'Seeding...') : (isAr ? 'رفع المنيو والموقع للسحابة' : 'Seed Menu & Settings to Cloud')}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSavingSupabase}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-xs font-bold flex items-center gap-1.5 shadow-gold-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSupabase ? '...' : (isAr ? 'حفظ وتفعيل المزامنة' : 'Save & Connect Cloud')}</span>
            </button>
          </div>

          {/* Test Result Banner */}
          {supabaseTestResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                supabaseTestResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {supabaseTestResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{supabaseTestResult.message}</span>
            </div>
          )}

          {/* Save Result Banner */}
          {supabaseSaveMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                supabaseSaveMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {supabaseSaveMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{supabaseSaveMsg.text}</span>
            </div>
          )}

          {/* Seed Result Banner */}
          {seedResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                seedResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {seedResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{seedResult.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5: DANGER ZONE - MENU RESET
          ══════════════════════════════════════════════════════════════════ */}
      <div className="p-5 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
          <ShieldAlert className="w-4 h-4" />
          <span>{isAr ? 'منطقة الصيانة وإعادة الضبط' : 'Factory Reset'}</span>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          {t.adminSettingsResetNotice}
        </p>
        <button
          onClick={handleResetMenu}
          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t.adminSettingsResetMenu}</span>
        </button>
      </div>
    </div>
  );
};
