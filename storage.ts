import { Product, Order, CafeSettings, CustomerProfile, CartItem } from '../types';
import { initialProducts } from '../data/initialMenu';
import { initialCafeSettings } from '../data/initialSettings';

const STORAGE_KEYS = {
  PRODUCTS: 'tora_house_products_v1',
  ORDERS: 'tora_house_orders_v1',
  SETTINGS: 'tora_house_settings_v1',
  CART: 'tora_house_cart_v1',
  USER_PROFILE: 'tora_house_customer_profile_v1',
  ADMIN_AUTH: 'tora_house_admin_session_v1',
  LANGUAGE: 'tora_house_language_pref_v1',
};

// Initial sample orders so order history and admin order management look active and testable immediately
const sampleOrders: Order[] = [
  {
    id: 'ord-th-1001',
    orderNumber: '#TH1001',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), // 3 hours ago
    customer: {
      name: 'Ahmed Al-Mansoor',
      phone: '0551234567',
      address: 'Villa 14, Al-Malqa, Riyadh',
      city: 'Riyadh',
      notes: 'Please do not ring the doorbell, call on arrival.',
    },
    items: [
      {
        id: 'cart-1',
        product: initialProducts[2], // Ice Spanish Latte
        quantity: 2,
        unitPrice: 14,
        customization: {
          addOns: [],
          sweetnessLevel: '50%',
          iceLevel: 'Regular',
        },
        subtotal: 28,
      },
      {
        id: 'cart-2',
        product: initialProducts[10], // Mojito Strawberry
        quantity: 1,
        unitPrice: 10,
        customization: {
          addOns: [],
          iceLevel: 'Extra',
        },
        subtotal: 10,
      },
      {
        id: 'cart-3',
        product: initialProducts[23], // Croissant Cheese
        quantity: 1,
        unitPrice: 7,
        customization: {
          addOns: [],
          specialInstructions: 'Warm it up please',
        },
        subtotal: 7,
      },
    ],
    subtotal: 45,
    tax: 0,
    deliveryFee: 10,
    total: 55,
    orderType: 'delivery',
    status: 'Preparing',
    whatsappSent: true,
    paymentMethod: 'cash_on_delivery',
  },
  {
    id: 'ord-th-1002',
    orderNumber: '#TH1002',
    createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(), // 1 hour ago
    customer: {
      name: 'Sarah Al-Ghamdi',
      phone: '0579876543',
    },
    items: [
      {
        id: 'cart-4',
        product: initialProducts[4], // Ice Matcha Latte
        quantity: 1,
        unitPrice: 10, // large
        customization: {
          selectedSize: { id: 'large', nameEn: 'Large', nameAr: 'كبير', price: 10 },
          addOns: [{ id: 'flavor-vanilla', nameEn: 'Vanilla Flavor', nameAr: 'نكهة فانيلا', price: 3, category: 'flavor' }],
          sweetnessLevel: '25%',
        },
        subtotal: 13,
      },
      {
        id: 'cart-5',
        product: initialProducts[20], // Donut
        quantity: 2,
        unitPrice: 7,
        customization: {
          addOns: [],
        },
        subtotal: 14,
      },
    ],
    subtotal: 27,
    tax: 0,
    deliveryFee: 0,
    total: 27,
    orderType: 'pickup',
    status: 'Ready for Pickup',
    whatsappSent: true,
    pickupTime: '15 mins',
    paymentMethod: 'apple_pay',
  },
];

export const storage = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    // initialize
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
    return initialProducts;
  },

  setProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  resetProducts(): Product[] {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
    return initialProducts;
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    // initialize sample orders for testing
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(sampleOrders));
    return sampleOrders;
  },

  setOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  addOrder(order: Order): Order[] {
    const orders = this.getOrders();
    const updated = [order, ...orders];
    this.setOrders(updated);
    return updated;
  },

  updateOrderStatus(orderId: string, status: Order['status']): Order[] {
    const orders = this.getOrders();
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    this.setOrders(updated);
    return updated;
  },

  getSettings(): CafeSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...initialCafeSettings, ...JSON.parse(data) };
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialCafeSettings));
    return initialCafeSettings;
  },

  setSettings(settings: CafeSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCart(): CartItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  setCart(cart: CartItem[]): void {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  },

  getCustomerProfile(): CustomerProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  },

  setCustomerProfile(profile: CustomerProfile | null): void {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    }
  },

  isAdminLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  setAdminLoggedIn(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, val ? 'true' : 'false');
  },

  getLanguage(): 'en' | 'ar' {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (saved === 'ar' || saved === 'en') return saved;
    return 'en';
  },

  setLanguage(lang: 'en' | 'ar'): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },
};
