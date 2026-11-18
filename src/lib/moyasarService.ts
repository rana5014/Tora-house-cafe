/**
 * Moyasar Saudi Payment Gateway Service
 * Supports Mada, Visa, Mastercard, and Apple Pay with real 3D Secure bank OTP
 * Official Docs: https://moyasar.com/docs/api/
 */

export interface MoyasarPaymentResult {
  id: string;
  status: 'initiated' | 'paid' | 'failed' | 'captured';
  amount: number; // in SAR
  currency: string;
  description?: string;
  transactionUrl?: string;
  errorMessage?: string;
  source?: {
    type: string;
    company?: string; // 'mada' | 'visa' | 'mastercard'
    name?: string;
    number?: string;
    message?: string;
  };
}

const DEFAULT_TEST_PUBLISHABLE_KEY = 'pk_test_vcFUAGuvJyBgAyuhAQ71R4Bifhgf7rHA824876b5';

export function getMoyasarKey(settingsKey?: string): string {
  if (settingsKey && settingsKey.trim()) {
    return settingsKey.trim();
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tora_moyasar_key');
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }
  return DEFAULT_TEST_PUBLISHABLE_KEY;
}

export function isMoyasarSandbox(key?: string): boolean {
  const k = key ? key.trim() : getMoyasarKey();
  return k.startsWith('pk_test_');
}

/**
 * Dynamically loads Moyasar Web Form SDK (JS and CSS) if not already present
 */
export async function loadMoyasarSDK(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Check if Moyasar global exists
  if ((window as any).Moyasar) {
    return;
  }

  return new Promise((resolve, reject) => {
    // 1. Inject CSS if not present
    const cssId = 'moyasar-sdk-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
      document.head.appendChild(link);
    }

    // 2. Inject JS if not present
    const scriptId = 'moyasar-sdk-js';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).Moyasar) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load Moyasar Payment Gateway SDK. Please check your internet connection.'));
    document.body.appendChild(script);
  });
}

/**
 * Verifies a payment directly with Moyasar API
 */
export async function verifyMoyasarPayment(paymentId: string, customKey?: string): Promise<MoyasarPaymentResult> {
  const publishableKey = getMoyasarKey(customKey);

  try {
    const res = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(publishableKey + ':')}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        status: data.status,
        amount: Number(data.amount) / 100,
        currency: data.currency,
        description: data.description,
        source: data.source,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to verify payment status with Moyasar');
    }
  } catch (err: any) {
    console.error('[Moyasar] Verification error:', err);
    throw err;
  }
}

const PENDING_ORDER_STORAGE_KEY = 'tora_pending_order';

export function savePendingCheckoutOrder(orderData: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify({
      orderData,
      timestamp: Date.now(),
    }));
  }
}

export function getPendingCheckoutOrder(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Ignore if older than 3 hours
    if (Date.now() - parsed.timestamp > 3 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      return null;
    }
    return parsed.orderData;
  } catch (e) {
    return null;
  }
}

export function clearPendingCheckoutOrder(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
  }
}
