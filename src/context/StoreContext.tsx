import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, Order, CafeSettings, OrderStatus, AddOnOption, PaymentStatus } from '../types';
import { storage } from '../lib/storage';
import { initialTestimonials, Testimonial, initialCafeSettings } from '../data/initialSettings';
import { initialProducts, initialAddOns } from '../data/initialMenu';
import { getSupabaseClient, isConfigured } from '../lib/supabaseClient';
import { generateOrderNumber, calculateSaudiVat } from '../lib/utils';
import { api } from '../lib/api';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'unconfigured';

interface StoreContextType {
  products: Product[];
  addOns: AddOnOption[];
  orders: Order[];
  settings: CafeSettings;
  testimonials: Testimonial[];
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetProductsToDefault: () => void;
  // Extra Flavors & Add-ons
  addAddOn: (addon: Omit<AddOnOption, 'id'> | AddOnOption) => Promise<AddOnOption>;
  updateAddOn: (addon: AddOnOption) => Promise<void>;
  deleteAddOn: (id: string) => Promise<void>;
  toggleAddOnAvailability: (id: string) => Promise<void>;
  // Orders & Payments
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'whatsappSent'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => Promise<void>;
  updateSettings: (newSettings: CafeSettings) => Promise<void>;
  refreshData: () => Promise<void>;
  seedCloudDatabase: () => Promise<{ success: boolean; message: string }>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Helper to map DB row to Product model
function mapDbProduct(p: any): Product {
  return {
    id: p.id,
    nameEn: p.name_en || '',
    nameAr: p.name_ar || '',
    descriptionEn: p.description_en || '',
    descriptionAr: p.description_ar || '',
    category: p.category || 'cold',
    basePrice: Number(p.base_price) || 0,
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    image: p.image || '',
    isAvailable: typeof p.is_available === 'boolean' ? p.is_available : true,
    isFeatured: Boolean(p.is_featured),
    isBestSeller: Boolean(p.is_bestseller),
    calories: p.calories ? Number(p.calories) : undefined,
  };
}

// Helper to map DB row to AddOnOption model
function mapDbAddOn(a: any): AddOnOption {
  return {
    id: a.id,
    nameEn: a.name_en || '',
    nameAr: a.name_ar || '',
    price: Number(a.price) || 0,
    category: a.category || 'flavor',
    isAvailable: typeof a.is_available === 'boolean' ? a.is_available : true,
    applicableCategories: Array.isArray(a.applicable_categories) ? a.applicable_categories : ['cold', 'hot', 'sweets'],
    sortOrder: Number(a.sort_order) || 0,
  };
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [addOns, setAddOns] = useState<AddOnOption[]>(() => storage.getAddOns());
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [settings, setSettings] = useState<CafeSettings>(() => storage.getSettings());
  const [testimonials] = useState<Testimonial[]>(initialTestimonials);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => (isConfigured() ? 'syncing' : 'unconfigured'));
  const [syncError, setSyncError] = useState<string | null>(null);

  const realtimeChannelRef = useRef<any>(null);

  // ─── 1. FETCH & AUTO-SEED CENTRALIZED SUPABASE DATA ─────────────────────────
  const refreshData = useCallback(async () => {
    const supabase = getSupabaseClient();

    if (!supabase || !isConfigured()) {
      setSyncStatus('unconfigured');
      setIsLoading(false);
      setIsSyncing(false);
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      // ── A. Fetch Central Products ──
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (prodErr) {
        console.warn('[Supabase] Products query error:', prodErr.message);
        setSyncError(prodErr.message);
        setSyncStatus('offline');
      } else if (prodData && prodData.length > 0) {
        const mapped = prodData.map(mapDbProduct);
        setProducts(mapped);
        storage.setProducts(mapped); // local read-through cache
      } else if (prodData && prodData.length === 0) {
        // Table exists but is empty -> Auto-seed with default products
        console.log('[Supabase] Products table empty, auto-seeding defaults...');
        const seedPayload = initialProducts.map((p, idx) => ({
          id: p.id,
          name_en: p.nameEn,
          name_ar: p.nameAr,
          description_en: p.descriptionEn || '',
          description_ar: p.descriptionAr || '',
          category: p.category,
          base_price: p.basePrice,
          sizes: p.sizes || [],
          image: p.image,
          is_available: p.isAvailable,
          is_featured: Boolean(p.isFeatured),
          is_bestseller: Boolean(p.isBestSeller),
          calories: p.calories || null,
          sort_order: idx + 1,
        }));
        await supabase.from('products').insert(seedPayload);
        setProducts(initialProducts);
        storage.setProducts(initialProducts);
      }

      // ── B. Fetch Central Extra Flavors & Add-ons ──
      try {
        const { data: addOnData, error: addOnErr } = await supabase
          .from('add_ons')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!addOnErr && addOnData && addOnData.length > 0) {
          const mappedAddons = addOnData.map(mapDbAddOn);
          setAddOns(mappedAddons);
          storage.setAddOns(mappedAddons);
        } else if (!addOnErr && addOnData && addOnData.length === 0) {
          // Auto-seed initial add-ons if table is empty
          const seedPayload = initialAddOns.map((ao, idx) => ({
            id: ao.id,
            name_en: ao.nameEn,
            name_ar: ao.nameAr,
            price: ao.price,
            category: ao.category,
            is_available: ao.isAvailable !== false,
            applicable_categories: ao.applicableCategories || ['cold', 'hot', 'sweets'],
            sort_order: idx + 1,
          }));
          await supabase.from('add_ons').insert(seedPayload);
          setAddOns(initialAddOns);
          storage.setAddOns(initialAddOns);
        }
      } catch (e) {
        console.warn('[Supabase] add_ons query warning:', e);
      }

      // ── C. Fetch Central Cafe Settings (Location, WhatsApp, Banner, Hours) ──
      const { data: setRow, error: setErr } = await supabase
        .from('cafe_settings')
        .select('settings')
        .eq('id', 'primary_config')
        .maybeSingle();

      if (setErr) {
        console.warn('[Supabase] Settings query error:', setErr.message);
      } else if (setRow && setRow.settings) {
        const mergedSettings = { ...initialCafeSettings, ...setRow.settings };
        setSettings(mergedSettings);
        storage.setSettings(mergedSettings);

        // Fallback: if add_ons table had error, check customAddOns in cafe_settings
        if (Array.isArray((setRow.settings as any).customAddOns) && (setRow.settings as any).customAddOns.length > 0) {
          setAddOns((setRow.settings as any).customAddOns);
        }
      } else if (!setRow) {
        // Auto-seed default settings
        console.log('[Supabase] Cafe settings missing, auto-seeding defaults...');
        await supabase.from('cafe_settings').upsert({
          id: 'primary_config',
          settings: initialCafeSettings,
          updated_at: new Date().toISOString(),
        });
        setSettings(initialCafeSettings);
        storage.setSettings(initialCafeSettings);
      }

      // ── D. Fetch Central Orders with VAT & Payment Details ──
      const { data: ordData, error: ordErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordErr) {
        console.warn('[Supabase] Orders query error:', ordErr.message);
      } else if (ordData && ordData.length > 0) {
        const mappedOrders: Order[] = ordData.map((o) => {
          const vatInfo = calculateSaudiVat(Number(o.subtotal) || 0, Number(o.delivery_fee) || 0);
          return {
            id: o.id,
            orderNumber: o.order_number,
            createdAt: o.created_at,
            customer: o.customer,
            items: o.items,
            subtotal: Number(o.subtotal) || 0,
            subtotalExclVat: o.subtotal_excl_vat != null ? Number(o.subtotal_excl_vat) : vatInfo.subtotalExclVat,
            tax: o.tax != null && Number(o.tax) > 0 ? Number(o.tax) : vatInfo.vatAmount,
            deliveryFee: Number(o.delivery_fee) || 0,
            total: Number(o.total) || 0,
            orderType: o.order_type || 'pickup',
            status: o.status || 'Pending',
            whatsappSent: Boolean(o.whatsapp_sent),
            whatsappDeliveryStatus: o.whatsapp_delivery_status,
            pickupTime: o.pickup_time,
            paymentMethod: o.payment_method || 'cash_on_delivery',
            paymentStatus: o.payment_status || (o.payment_method === 'cash_on_delivery' ? 'Pending' : 'Pending'),
            transactionId: o.transaction_id,
          };
        });
        setOrders(mappedOrders);
        storage.setOrders(mappedOrders);
      }

      setSyncStatus('synced');
    } catch (err: any) {
      console.error('[Supabase] Sync error:', err);
      setSyncError(err.message || 'Connection failed');
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // ─── 2. REALTIME WEBSOCKET SUBSCRIPTION (Instant Cross-Browser Sync) ─────────
  useEffect(() => {
    refreshData();

    const supabase = getSupabaseClient();
    if (!supabase || !isConfigured()) return;

    // Clean up any existing channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    // Subscribe to all changes in public schema
    const channel = supabase
      .channel('tora-cloud-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[Supabase Realtime] Product event:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const newProd = mapDbProduct(payload.new);
            setProducts((prev) => {
              if (prev.some((p) => p.id === newProd.id)) return prev;
              const next = [newProd, ...prev];
              storage.setProducts(next);
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProd = mapDbProduct(payload.new);
            setProducts((prev) => {
              const next = prev.map((p) => (p.id === updatedProd.id ? updatedProd : p));
              storage.setProducts(next);
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setProducts((prev) => {
                const next = prev.filter((p) => p.id !== deletedId);
                storage.setProducts(next);
                return next;
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'add_ons' },
        (payload) => {
          console.log('[Supabase Realtime] Add-on event:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const newAddon = mapDbAddOn(payload.new);
            setAddOns((prev) => {
              if (prev.some((a) => a.id === newAddon.id)) return prev;
              const next = [...prev, newAddon];
              storage.setAddOns(next);
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedAddon = mapDbAddOn(payload.new);
            setAddOns((prev) => {
              const next = prev.map((a) => (a.id === updatedAddon.id ? updatedAddon : a));
              storage.setAddOns(next);
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setAddOns((prev) => {
                const next = prev.filter((a) => a.id !== deletedId);
                storage.setAddOns(next);
                return next;
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cafe_settings' },
        (payload) => {
          console.log('[Supabase Realtime] Cafe settings event:', payload.eventType);
          if (payload.new && (payload.new as any).settings) {
            const updatedSettings = { ...initialCafeSettings, ...(payload.new as any).settings };
            setSettings(updatedSettings);
            storage.setSettings(updatedSettings);

            if (Array.isArray((payload.new as any).settings.customAddOns)) {
              setAddOns((payload.new as any).settings.customAddOns);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Supabase Realtime] Orders event:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const o = payload.new as any;
            const vatInfo = calculateSaudiVat(Number(o.subtotal) || 0, Number(o.delivery_fee) || 0);
            const newOrder: Order = {
              id: o.id,
              orderNumber: o.order_number,
              createdAt: o.created_at,
              customer: o.customer,
              items: o.items,
              subtotal: Number(o.subtotal) || 0,
              subtotalExclVat: o.subtotal_excl_vat != null ? Number(o.subtotal_excl_vat) : vatInfo.subtotalExclVat,
              tax: o.tax != null && Number(o.tax) > 0 ? Number(o.tax) : vatInfo.vatAmount,
              deliveryFee: Number(o.delivery_fee) || 0,
              total: Number(o.total) || 0,
              orderType: o.order_type || 'pickup',
              status: o.status || 'Pending',
              whatsappSent: Boolean(o.whatsapp_sent),
              whatsappDeliveryStatus: o.whatsapp_delivery_status,
              pickupTime: o.pickup_time,
              paymentMethod: o.payment_method || 'cash_on_delivery',
              paymentStatus: o.payment_status || (o.payment_method === 'cash_on_delivery' ? 'Pending' : 'Pending'),
              transactionId: o.transaction_id,
            };
            setOrders((prev) => {
              if (prev.some((item) => item.id === newOrder.id)) return prev;
              const next = [newOrder, ...prev];
              storage.setOrders(next);
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const o = payload.new as any;
            const vatInfo = calculateSaudiVat(Number(o.subtotal) || 0, Number(o.delivery_fee) || 0);
            setOrders((prev) => {
              const next = prev.map((item) =>
                item.id === o.id
                  ? {
                      ...item,
                      status: o.status || item.status,
                      paymentStatus: o.payment_status || item.paymentStatus,
                      paymentMethod: o.payment_method || item.paymentMethod,
                      subtotalExclVat: o.subtotal_excl_vat != null ? Number(o.subtotal_excl_vat) : vatInfo.subtotalExclVat,
                      tax: o.tax != null && Number(o.tax) > 0 ? Number(o.tax) : vatInfo.vatAmount,
                      total: Number(o.total) || item.total,
                      whatsappSent: Boolean(o.whatsapp_sent),
                      whatsappDeliveryStatus: o.whatsapp_delivery_status,
                    }
                  : item
              );
              storage.setOrders(next);
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setSyncStatus('synced');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setSyncStatus('offline');
        }
      });

    realtimeChannelRef.current = channel;

    // Window focus / visibility change re-sync (when switching between Kiwi/Mises/Chrome)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      if (realtimeChannelRef.current && supabase) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [refreshData]);

  // ─── 3. PRODUCT CRUD MUTATIONS (Sync directly to Supabase) ─────────────────
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = { ...productData, id: newId };

    // Optimistic local state update
    const updated = [newProduct, ...products];
    setProducts(updated);
    storage.setProducts(updated);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        setIsSyncing(true);
        const { error } = await supabase.from('products').insert([
          {
            id: newProduct.id,
            name_en: newProduct.nameEn,
            name_ar: newProduct.nameAr,
            description_en: newProduct.descriptionEn || '',
            description_ar: newProduct.descriptionAr || '',
            category: newProduct.category,
            base_price: newProduct.basePrice,
            sizes: newProduct.sizes || [],
            image: newProduct.image,
            is_available: newProduct.isAvailable,
            is_featured: Boolean(newProduct.isFeatured),
            is_bestseller: Boolean(newProduct.isBestSeller),
            calories: newProduct.calories || null,
            sort_order: 1,
          },
        ]);
        if (error) throw error;
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('[Supabase] addProduct error:', err);
        setSyncError(err.message);
      } finally {
        setIsSyncing(false);
      }
    }

    return newProduct;
  };

  const updateProduct = async (updatedProduct: Product) => {
    // Optimistic local state update
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    storage.setProducts(updated);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        setIsSyncing(true);
        const { error } = await supabase
          .from('products')
          .update({
            name_en: updatedProduct.nameEn,
            name_ar: updatedProduct.nameAr,
            description_en: updatedProduct.descriptionEn || '',
            description_ar: updatedProduct.descriptionAr || '',
            category: updatedProduct.category,
            base_price: updatedProduct.basePrice,
            sizes: updatedProduct.sizes || [],
            image: updatedProduct.image,
            is_available: updatedProduct.isAvailable,
            is_featured: Boolean(updatedProduct.isFeatured),
            is_bestseller: Boolean(updatedProduct.isBestSeller),
            calories: updatedProduct.calories || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', updatedProduct.id);

        if (error) throw error;
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('[Supabase] updateProduct error:', err);
        setSyncError(err.message);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    // Optimistic local state update
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    storage.setProducts(updated);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        setIsSyncing(true);
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('[Supabase] deleteProduct error:', err);
        setSyncError(err.message);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const resetProductsToDefault = () => {
    const defaultProds = storage.resetProducts();
    setProducts(defaultProds);
  };

  // ─── 4. CAFE SETTINGS MUTATIONS (Location, WhatsApp, Banner, Hours) ────────
  const updateSettings = async (newSettings: CafeSettings) => {
    setSettings(newSettings);
    storage.setSettings(newSettings);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        setIsSyncing(true);
        const { error } = await supabase.from('cafe_settings').upsert({
          id: 'primary_config',
          settings: newSettings,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('[Supabase] updateSettings error:', err);
        setSyncError(err.message);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // ─── 5. EXTRA FLAVORS & ADD-ONS MUTATIONS (Instant Cloud Sync) ─────────────
  const addAddOn = async (addonData: Omit<AddOnOption, 'id'> | AddOnOption): Promise<AddOnOption> => {
    const newId = 'id' in addonData && addonData.id ? addonData.id : `${addonData.category}-${Date.now()}`;
    const newAddon: AddOnOption = {
      ...addonData,
      id: newId,
      isAvailable: addonData.isAvailable !== false,
      sortOrder: addonData.sortOrder || addOns.length + 1,
      applicableCategories: addonData.applicableCategories || ['cold', 'hot', 'sweets'],
    };

    const next = [...addOns, newAddon];
    setAddOns(next);
    storage.setAddOns(next);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        setIsSyncing(true);
        const { error } = await supabase.from('add_ons').insert([
          {
            id: newAddon.id,
            name_en: newAddon.nameEn,
            name_ar: newAddon.nameAr,
            price: newAddon.price,
            category: newAddon.category,
            is_available: newAddon.isAvailable,
            applicable_categories: newAddon.applicableCategories,
            sort_order: newAddon.sortOrder,
          },
        ]);
        if (error && error.code === 'PGRST205') {
          // Table not present yet: fallback sync via cafe_settings
          await supabase.from('cafe_settings').upsert({
            id: 'primary_config',
            settings: { ...settings, customAddOns: next },
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error('[Supabase] addAddOn error:', err);
      } finally {
        setIsSyncing(false);
      }
    }

    return newAddon;
  };

  const updateAddOn = async (updated: AddOnOption): Promise<void> => {
    const next = addOns.map((a) => (a.id === updated.id ? updated : a));
    setAddOns(next);
    storage.setAddOns(next);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        setIsSyncing(true);
        const { error } = await supabase
          .from('add_ons')
          .update({
            name_en: updated.nameEn,
            name_ar: updated.nameAr,
            price: updated.price,
            category: updated.category,
            is_available: updated.isAvailable,
            applicable_categories: updated.applicableCategories,
            sort_order: updated.sortOrder,
            updated_at: new Date().toISOString(),
          })
          .eq('id', updated.id);

        if (error && error.code === 'PGRST205') {
          await supabase.from('cafe_settings').upsert({
            id: 'primary_config',
            settings: { ...settings, customAddOns: next },
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error('[Supabase] updateAddOn error:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const deleteAddOn = async (id: string): Promise<void> => {
    const next = addOns.filter((a) => a.id !== id);
    setAddOns(next);
    storage.setAddOns(next);

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        setIsSyncing(true);
        const { error } = await supabase.from('add_ons').delete().eq('id', id);
        if (error && error.code === 'PGRST205') {
          await supabase.from('cafe_settings').upsert({
            id: 'primary_config',
            settings: { ...settings, customAddOns: next },
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error('[Supabase] deleteAddOn error:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const toggleAddOnAvailability = async (id: string): Promise<void> => {
    const item = addOns.find((a) => a.id === id);
    if (!item) return;
    await updateAddOn({ ...item, isAvailable: !item.isAvailable });
  };

  // ─── 6. ORDER MANAGEMENT & SAUDI VAT (15% INCLUDED) ────────────────────────
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'whatsappSent'>
  ): Promise<Order> => {
    const orderNumber = generateOrderNumber(orders.length);
    const id = `ord-${Date.now()}`;

    // Exact Saudi 15% VAT snapshot calculation (all prices are VAT-inclusive)
    const vatInfo = calculateSaudiVat(orderData.subtotal, orderData.deliveryFee || 0);

    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === 'cash_on_delivery' ? 'Pending' : 'Pending'),
      subtotalExclVat: vatInfo.subtotalExclVat,
      tax: vatInfo.vatAmount, // 15% VAT component
      total: vatInfo.grossTotal, // Final gross total
      whatsappSent: false,
      whatsappDeliveryStatus: 'pending',
    };

    // 1. Dispatch to server API (if Express server is running)
    try {
      const res = await api.createOrder(orderData);
      if (res?.order) {
        newOrder.id = res.order.id;
        newOrder.orderNumber = res.order.orderNumber;
        newOrder.whatsappSent = res.order.whatsappSent;
        newOrder.whatsappDeliveryStatus = res.order.whatsappDeliveryStatus;
      }
    } catch (e) {
      console.warn('[StoreContext] Local server not running, proceeding with Cloud DB order');
    }

    // 2. Save to Supabase Central Database with immutable VAT snapshot
    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        await supabase.from('orders').insert([
          {
            id: newOrder.id,
            order_number: newOrder.orderNumber,
            customer: newOrder.customer,
            items: newOrder.items,
            subtotal: newOrder.subtotal,
            subtotal_excl_vat: newOrder.subtotalExclVat,
            tax: newOrder.tax,
            delivery_fee: newOrder.deliveryFee || 0,
            total: newOrder.total,
            order_type: newOrder.orderType,
            status: newOrder.status,
            payment_status: newOrder.paymentStatus,
            payment_method: newOrder.paymentMethod,
            transaction_id: newOrder.transactionId || null,
            whatsapp_sent: newOrder.whatsappSent,
            whatsapp_delivery_status: newOrder.whatsappDeliveryStatus,
            pickup_time: newOrder.pickupTime || null,
            created_at: newOrder.createdAt,
          },
        ]);
      } catch (err) {
        console.error('[Supabase] createOrder save error:', err);
      }
    }

    const updated = storage.addOrder(newOrder);
    setOrders(updated);
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.adminUpdateOrderStatus(orderId, status);
    } catch {}

    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        await supabase.from('orders').update({ status }).eq('id', orderId);
      } catch (err) {
        console.error('[Supabase] updateOrderStatus error:', err);
      }
    }

    const updated = storage.updateOrderStatus(orderId, status);
    setOrders(updated);
  };

  const updateOrderPaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    const supabase = getSupabaseClient();
    if (supabase && isConfigured()) {
      try {
        await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', orderId);
      } catch (err) {
        console.error('[Supabase] updateOrderPaymentStatus error:', err);
      }
    }

    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o));
      storage.setOrders(next);
      return next;
    });
  };

  // ─── 7. SEED CLOUD DATABASE DIRECTLY FROM ADMIN PORTAL ──────────────────────
  const seedCloudDatabase = async (): Promise<{ success: boolean; message: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase || !isConfigured()) {
      return { success: false, message: 'Supabase is not configured yet. Please enter your credentials first.' };
    }

    try {
      setIsSyncing(true);

      // 1. Seed settings
      await supabase.from('cafe_settings').upsert({
        id: 'primary_config',
        settings: { ...settings, customAddOns: addOns },
        updated_at: new Date().toISOString(),
      });

      // 2. Seed current products
      const seedItems = products.map((p, idx) => ({
        id: p.id,
        name_en: p.nameEn,
        name_ar: p.nameAr,
        description_en: p.descriptionEn || '',
        description_ar: p.descriptionAr || '',
        category: p.category,
        base_price: p.basePrice,
        sizes: p.sizes || [],
        image: p.image,
        is_available: p.isAvailable,
        is_featured: Boolean(p.isFeatured),
        is_bestseller: Boolean(p.isBestSeller),
        calories: p.calories || null,
        sort_order: idx + 1,
      }));

      const { error: prodErr } = await supabase.from('products').upsert(seedItems);
      if (prodErr) throw prodErr;

      // 3. Seed add_ons table if available
      try {
        const seedAddons = addOns.map((ao, idx) => ({
          id: ao.id,
          name_en: ao.nameEn,
          name_ar: ao.nameAr,
          price: ao.price,
          category: ao.category,
          is_available: ao.isAvailable !== false,
          applicable_categories: ao.applicableCategories || ['cold', 'hot', 'sweets'],
          sort_order: idx + 1,
        }));
        await supabase.from('add_ons').upsert(seedAddons);
      } catch (e) {
        console.warn('Seeding add_ons warning (table may need schema.sql update):', e);
      }

      setSyncStatus('synced');
      return {
        success: true,
        message: `Cloud database synchronized! Uploaded ${products.length} menu items, ${addOns.length} add-ons, and current cafe settings.`,
      };
    } catch (err: any) {
      console.error('[Supabase] seedCloudDatabase error:', err);
      return { success: false, message: err.message || 'Failed to seed cloud database.' };
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        addOns,
        orders,
        settings,
        testimonials,
        isLoading,
        isSyncing,
        syncStatus,
        syncError,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProductsToDefault,
        addAddOn,
        updateAddOn,
        deleteAddOn,
        toggleAddOnAvailability,
        createOrder,
        updateOrderStatus,
        updateOrderPaymentStatus,
        updateSettings,
        refreshData,
        seedCloudDatabase,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
