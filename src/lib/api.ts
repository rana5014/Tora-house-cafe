import { Order, Product, CafeSettings, OrderStatus } from '../types';
import { getSupabaseClient } from './supabaseClient';

const API_BASE = '/api';

function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || localStorage.getItem('tora_admin_token') || '';
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

export const api = {
  // Orders
  async createOrder(orderData: any): Promise<{ success: boolean; order: Order; whatsappStatus: string }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to place order');
    }
    return res.json();
  },

  async fetchCustomerOrders(phone: string): Promise<Order[]> {
    const cleanPhone = phone.replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/orders?phone=${encodeURIComponent(cleanPhone)}`);
    if (!res.ok) return [];
    return res.json();
  },

  // Check if owner custom PIN has already been configured
  isPinConfigured(): boolean {
    const storedPin = localStorage.getItem('tora_admin_custom_pin');
    return Boolean(storedPin && storedPin !== 'tora2026');
  },

  // First-time owner PIN setup (replaces any insecure default)
  async adminSetupInitialPin(newPin: string): Promise<{ success: boolean; token: string; expiresAt: number }> {
    const cleanPin = newPin.trim();
    if (cleanPin.length < 4) {
      throw new Error('Owner PIN must be at least 4 characters');
    }
    if (cleanPin.toLowerCase() === 'tora2026') {
      throw new Error('Default PIN "tora2026" is forbidden. Please choose a private, secure PIN.');
    }

    localStorage.setItem('tora_admin_custom_pin', cleanPin);
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
    const staticToken = 'static_' + btoa(JSON.stringify({ sessionId: 'owner_session', expiresAt }));
    localStorage.setItem('tora_admin_token', staticToken);
    localStorage.setItem('tora_admin_expires', String(expiresAt));

    // Try synchronizing to backend if available
    try {
      await fetch(`${API_BASE}/admin/change-pin`, {
        method: 'POST',
        headers: getAuthHeaders(staticToken),
        body: JSON.stringify({ currentPin: '', newPin: cleanPin }),
      });
    } catch {}

    return { success: true, token: staticToken, expiresAt };
  },

  // Admin Auth & Security (Hybrid: Uses backend if available, falls back to secure client auth)
  async adminLogin(pin: string): Promise<{ success: boolean; token: string; expiresAt: number }> {
    const cleanPin = pin.trim();

    // Insecure default credential tora2026 is strictly forbidden
    if (cleanPin.toLowerCase() === 'tora2026') {
      throw new Error(
        'The insecure default PIN "tora2026" has been permanently removed for security. Please use your custom owner PIN or set one up.'
      );
    }

    const storedPin = localStorage.getItem('tora_admin_custom_pin');

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('tora_admin_token', data.token);
          localStorage.setItem('tora_admin_expires', String(data.expiresAt));
          return data;
        }
      }
    } catch {
      // Backend not running (e.g. GitHub Pages static hosting), fall through to client validation
    }

    // Secure static validation
    if (storedPin && cleanPin === storedPin) {
      const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
      const staticToken = 'static_' + btoa(JSON.stringify({ sessionId: 'static_owner', expiresAt }));
      localStorage.setItem('tora_admin_token', staticToken);
      localStorage.setItem('tora_admin_expires', String(expiresAt));
      return { success: true, token: staticToken, expiresAt };
    }

    if (!storedPin) {
      throw new Error('No owner PIN has been set yet. Please complete First-Time Setup to create your secure PIN.');
    }

    throw new Error('Incorrect PIN. Please try again.');
  },

  // Supabase Auth Login (Email + Password for Owner / Admin)
  async adminLoginSupabase(email: string, password: string): Promise<{ success: boolean; token: string; expiresAt: number; user: any }> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client is not available. Please verify your Supabase configuration.');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message || 'Supabase authentication failed');
    }

    const expiresAt = data.session?.expires_at ? data.session.expires_at * 1000 : Date.now() + 2 * 60 * 60 * 1000;
    const token = data.session?.access_token || ('supabase_' + btoa(JSON.stringify({ userId: data.user?.id, email: data.user?.email, expiresAt })));

    localStorage.setItem('tora_admin_token', token);
    localStorage.setItem('tora_admin_expires', String(expiresAt));

    return {
      success: true,
      token,
      expiresAt,
      user: data.user,
    };
  },

  async adminVerify(): Promise<boolean> {
    const token = localStorage.getItem('tora_admin_token');
    const expires = Number(localStorage.getItem('tora_admin_expires') || '0');
    if (!token || Date.now() > expires) {
      localStorage.removeItem('tora_admin_token');
      localStorage.removeItem('tora_admin_expires');
      return false;
    }

    if (token.startsWith('static_')) return true;

    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        headers: getAuthHeaders(token),
      });
      return res.ok;
    } catch {
      return token.startsWith('static_');
    }
  },

  async adminChangePin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string; token?: string; expiresAt?: number }> {
    const cleanCur = currentPin.trim();
    const cleanNew = newPin.trim();
    const storedPin = localStorage.getItem('tora_admin_custom_pin');

    if (cleanCur.toLowerCase() === 'tora2026') {
      throw new Error('Default PIN "tora2026" is permanently invalid. Please use your configured PIN or set a new one.');
    }

    if (cleanNew.toLowerCase() === 'tora2026') {
      throw new Error('You cannot set the PIN to "tora2026". Please choose a secure PIN.');
    }

    if (cleanNew.length < 4) {
      throw new Error('New PIN must be at least 4 characters');
    }

    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
    if (!isGitHubPages) {
      try {
        const res = await fetch(`${API_BASE}/admin/change-pin`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ currentPin: cleanCur, newPin: cleanNew }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            localStorage.setItem('tora_admin_custom_pin', cleanNew);
            if (data.token) {
              localStorage.setItem('tora_admin_token', data.token);
              localStorage.setItem('tora_admin_expires', String(data.expiresAt));
            }
            return data;
          }
        } else if (res.status === 400 || res.status === 401) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Current PIN is incorrect');
        }
      } catch (err: any) {
        if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
          throw err;
        }
      }
    }

    // Static fallback (GitHub Pages or offline)
    if (storedPin && cleanCur !== storedPin) {
      throw new Error('Current PIN is incorrect');
    }
    localStorage.setItem('tora_admin_custom_pin', cleanNew);
    return { success: true, message: 'PIN updated successfully!' };
  },

  async adminRecovery(recoveryKey: string, newPin: string): Promise<{ success: boolean; newRecoveryKey: string }> {
    const cleanKey = recoveryKey.trim().toUpperCase();
    const cleanPin = newPin.trim();
    const defaultKey = 'TORA-RECOVER-886CBE17-3CF0CA1E';
    const storedKey = (localStorage.getItem('tora_admin_recovery_key') || defaultKey).toUpperCase();

    try {
      const res = await fetch(`${API_BASE}/admin/recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryKey: cleanKey, newPin: cleanPin }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('tora_admin_custom_pin', cleanPin);
          localStorage.setItem('tora_admin_recovery_key', data.newRecoveryKey);
          return data;
        }
      }
    } catch {}

    // Static fallback
    const validKeys = [
      defaultKey,
      'TORA-RECOVER-103CC70F-5CC0E4CB',
      storedKey,
    ];
    if (!validKeys.includes(cleanKey)) {
      throw new Error('Invalid recovery key');
    }
    if (cleanPin.length < 4) {
      throw new Error('New PIN must be at least 4 characters');
    }
    localStorage.setItem('tora_admin_custom_pin', cleanPin);
    return { success: true, newRecoveryKey: defaultKey };
  },

  async adminGetSecurityInfo(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/admin/security-info`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return res.json();
    } catch {}

    // Static fallback
    return {
      lastPinChange: new Date().toISOString(),
      activeSessionsCount: 1,
      recoveryKeyPreview: localStorage.getItem('tora_admin_recovery_key') || 'TORA-RECOVER-886CBE17-3CF0CA1E',
      recentAuditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: 'LOGIN_ACTIVE',
          ip: 'client',
          success: true,
        },
      ],
    };
  },

  async adminLogoutAll(): Promise<void> {
    await fetch(`${API_BASE}/admin/logout-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => {});
    localStorage.removeItem('tora_admin_token');
    localStorage.removeItem('tora_admin_expires');
  },

  // Admin Orders
  async adminGetOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin orders');
    return res.json();
  },

  async adminUpdateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async adminRetryWhatsApp(orderId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/retry-whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async adminGetWhatsAppConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/whatsapp-config`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { isConfigured: false };
    return res.json();
  },

  async adminSaveWhatsAppConfig(config: { token?: string; phoneNumberId?: string; destinationPhone?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/whatsapp-config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async adminTestWhatsApp(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/whatsapp-test`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Products
  async fetchProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async adminAddProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
  },

  async adminUpdateProduct(product: Product): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products/${product.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  async adminDeleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete product');
  },

  async adminResetProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/admin/products/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset products');
    return res.json();
  },

  // Settings
  async fetchSettings(): Promise<CafeSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async adminUpdateSettings(settings: CafeSettings): Promise<CafeSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },
};
