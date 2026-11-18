export type Language = 'en' | 'ar';

export type ProductCategory = 'cold' | 'hot' | 'sweets' | 'addons';

export interface ProductSizeOption {
  id: 'regular' | 'large';
  nameEn: string;
  nameAr: string;
  price: number;
}

export interface AddOnOption {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  category: 'flavor' | 'topping' | 'shot' | 'other';
  isAvailable?: boolean;
  applicableCategories?: ('cold' | 'hot' | 'sweets' | 'addons')[];
  sortOrder?: number;
}

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'mada'
  | 'visa'
  | 'mastercard'
  | 'apple_pay'
  | 'card_at_pickup';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface VatBreakdown {
  grossTotal: number;
  subtotalExclVat: number;
  vatRate: number; // 0.15
  vatAmount: number;
  deliveryFee: number;
}

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: ProductCategory;
  basePrice: number;
  sizes?: ProductSizeOption[];
  image: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  calories?: number;
  tags?: string[];
}

export interface CartCustomization {
  selectedSize?: ProductSizeOption;
  addOns: AddOnOption[];
  sweetnessLevel?: '0%' | '25%' | '50%' | '100%';
  iceLevel?: 'None' | 'Less' | 'Regular' | 'Extra';
  milkChoice?: 'Whole Milk' | 'Oat Milk' | 'Almond Milk' | 'Skimmed Milk';
  specialInstructions?: string;
}

export interface CartItem {
  id: string; // unique item uuid (product.id + unique custom options)
  product: Product;
  quantity: number;
  unitPrice: number;
  customization: CartCustomization;
  subtotal: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export type OrderType = 'pickup' | 'delivery';

export interface CustomerInfo {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export type WhatsAppDeliveryStatus = 'sent' | 'failed' | 'pending' | 'credentials_missing';

export interface Order {
  id: string; // internal id or uuid
  orderNumber: string; // #TH1001
  createdAt: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number; // Gross items total (VAT included)
  subtotalExclVat?: number; // Net items total (excluding VAT)
  tax: number; // VAT Amount (15% included)
  deliveryFee: number;
  total: number; // Gross final total (VAT included)
  orderType: OrderType;
  status: OrderStatus;
  whatsappSent: boolean;
  whatsappDeliveryStatus?: WhatsAppDeliveryStatus;
  whatsappMessageId?: string;
  whatsappError?: string;
  whatsappSentAt?: string;
  pickupTime?: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionId?: string;
}

export interface CafeSettings {
  cafeName: string;
  cafeNameAr: string;
  taglineEn: string;
  taglineAr: string;
  whatsappNumber: string; // "966579165664"
  whatsappDisplay: string; // "+966 057 916 5664"
  phoneDisplay: string;
  email: string;
  addressEn: string;
  addressAr: string;
  city: string;
  openingHoursEn: string;
  openingHoursAr: string;
  currency: string;
  currencyAr: string;
  taxRate: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  announcementBannerEn: string;
  announcementBannerAr: string;
  showAnnouncement: boolean;
  instagramUrl: string;
  tiktokUrl: string;
  snapchatUrl: string;
  twitterUrl: string;
  moyasarPublishableKey?: string;
  moyasarLiveMode?: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  defaultAddress: string;
  joinedDate: string;
}
