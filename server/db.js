import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function readJsonFile(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.warn(`[DB] Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[DB] Error writing ${filePath}:`, err.message);
  }
}

export const db = {
  // Orders
  getOrders() {
    return readJsonFile(ORDERS_FILE, []);
  },

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find((o) => o.id === id || o.orderNumber === id);
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const count = orders.length + 1001;
    const orderNumber = `#TH${count}`;
    const id = `ord-${Date.now()}`;

    const newOrder = {
      ...orderData,
      id,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      whatsappSent: false,
      whatsappDeliveryStatus: 'pending',
    };

    const updated = [newOrder, ...orders];
    writeJsonFile(ORDERS_FILE, updated);
    return newOrder;
  },

  updateOrder(id, updates) {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    orders[index] = { ...orders[index], ...updates };
    writeJsonFile(ORDERS_FILE, orders);
    return orders[index];
  },

  updateOrderStatus(id, status) {
    return this.updateOrder(id, { status });
  },

  updateOrderWhatsAppStatus(id, { deliveryStatus, messageId, error }) {
    return this.updateOrder(id, {
      whatsappSent: deliveryStatus === 'sent',
      whatsappDeliveryStatus: deliveryStatus,
      whatsappMessageId: messageId || undefined,
      whatsappError: error || undefined,
      whatsappSentAt: new Date().toISOString(),
    });
  },

  // Products
  getProducts() {
    return readJsonFile(PRODUCTS_FILE, null);
  },

  saveProducts(products) {
    writeJsonFile(PRODUCTS_FILE, products);
  },

  addProduct(product) {
    const products = this.getProducts() || [];
    const id = `prod-${Date.now()}`;
    const newProduct = { ...product, id };
    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id, productData) {
    const products = this.getProducts() || [];
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...productData, id };
    this.saveProducts(products);
    return products[index];
  },

  deleteProduct(id) {
    let products = this.getProducts() || [];
    products = products.filter((p) => p.id !== id);
    this.saveProducts(products);
    return true;
  },

  // Settings
  getSettings() {
    return readJsonFile(SETTINGS_FILE, null);
  },

  saveSettings(settings) {
    writeJsonFile(SETTINGS_FILE, settings);
  },
};
