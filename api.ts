import { Order, Product, CafeSettings, OrderStatus } from '../types';

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

  // Admin Auth & Security
  async adminLogin(pin: string): Promise<{ success: boolean; token: string; expiresAt: number }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Authentication failed');
    }
    localStorage.setItem('tora_admin_token', data.token);
    localStorage.setItem('tora_admin_expires', String(data.expiresAt));
    return data;
  },

  async adminVerify(): Promise<boolean> {
    const token = localStorage.getItem('tora_admin_token');
    const expires = Number(localStorage.getItem('tora_admin_expires') || '0');
    if (!token || Date.now() > expires) {
      localStorage.removeItem('tora_admin_token');
      localStorage.removeItem('tora_admin_expires');
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        headers: getAuthHeaders(token),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async adminChangePin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/change-pin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPin, newPin }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update PIN');
    }
    return data;
  },

  async adminRecovery(recoveryKey: string, newPin: string): Promise<{ success: boolean; newRecoveryKey: string }> {
    const res = await fetch(`${API_BASE}/admin/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recoveryKey, newPin }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Recovery failed');
    }
    return data;
  },

  async adminGetSecurityInfo(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/security-info`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
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
