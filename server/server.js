import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { securityService } from './securityService.js';
import { sendWhatsAppOrderNotification } from './whatsappService.js';
import { initialProducts, initialCafeSettings } from './defaults.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors());
app.use(express.json());

// Initialize DB with menu and settings if not present
if (!db.getProducts() || db.getProducts().length === 0) {
  db.saveProducts(initialProducts);
}
if (!db.getSettings()) {
  db.saveSettings(initialCafeSettings);
}

// Load saved WhatsApp API credentials if present
const startupSettings = db.getSettings();
if (startupSettings?.whatsappApi) {
  if (startupSettings.whatsappApi.token) process.env.META_WHATSAPP_TOKEN = startupSettings.whatsappApi.token;
  if (startupSettings.whatsappApi.phoneNumberId) process.env.META_PHONE_NUMBER_ID = startupSettings.whatsappApi.phoneNumberId;
  if (startupSettings.whatsappApi.destination) process.env.OWNER_WHATSAPP_DESTINATION = startupSettings.whatsappApi.destination;
}

// Client IP helper
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
}

// Server-side Authorization Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const validation = securityService.validateToken(token);

  if (!validation.valid) {
    return res.status(401).json({ error: `Unauthorized: ${validation.error || 'Invalid or expired session'}` });
  }

  req.adminSessionId = validation.sessionId;
  next();
}

// ==========================================
// 1. ORDER & CHECKOUT ENDPOINTS
// ==========================================

/**
 * Customer Order Placement
 * 1. Saves order in database
 * 2. Automatically sends WhatsApp notification to OWNER ONLY (+966579165664)
 * 3. Records WhatsApp delivery status in database
 * 4. Returns order to customer WITHOUT redirecting to WhatsApp
 */
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, subtotal, tax, deliveryFee, total, orderType, paymentMethod } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // 1. Save in database
    const newOrder = db.createOrder({
      customer,
      items,
      subtotal: Number(subtotal) || 0,
      tax: Number(tax) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      total: Number(total) || 0,
      orderType: orderType || 'pickup',
      paymentMethod: paymentMethod || 'cash_on_delivery',
    });

    console.log(`[Order API] Created new order ${newOrder.orderNumber} for ${customer.name} (${customer.phone})`);

    // 2. Dispatch Meta WhatsApp Business Cloud API notification to owner
    const waResult = await sendWhatsAppOrderNotification(newOrder);

    // 3. Record delivery status
    const updatedOrder = db.updateOrderWhatsAppStatus(newOrder.id, {
      deliveryStatus: waResult.status,
      messageId: waResult.messageId,
      error: waResult.error,
    });

    return res.status(201).json({
      success: true,
      order: updatedOrder,
      whatsappStatus: waResult.status,
    });
  } catch (err) {
    console.error('[Order API] Error processing order:', err);
    return res.status(500).json({ error: 'Internal server error processing order' });
  }
});

/**
 * Customer Order History
 * Enforces customer privacy: Customers can only query their own orders by phone
 */
app.get('/api/orders', (req, res) => {
  const { phone } = req.query;

  // Check if admin is requesting
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (securityService.validateToken(token).valid) {
      return res.json(db.getOrders());
    }
  }

  // Customer query
  if (!phone) {
    return res.status(400).json({ error: 'Customer phone number is required to access order history' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const allOrders = db.getOrders();
  const customerOrders = allOrders.filter(
    (o) => o.customer.phone.replace(/\D/g, '') === cleanPhone
  );

  return res.json(customerOrders);
});

// ==========================================
// 1B. PRODUCTS & SETTINGS ENDPOINTS
// ==========================================

/**
 * Public Menu Products (Centralized for all browsers)
 */
app.get('/api/products', (req, res) => {
  let products = db.getProducts();
  if (!products || !products.length) {
    products = initialProducts;
    db.saveProducts(products);
  }
  return res.json(products);
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const newProduct = db.addProduct(req.body);
  return res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  return res.json(updated);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.deleteProduct(req.params.id);
  return res.json({ success: true });
});

/**
 * Public Cafe Settings (Location, WhatsApp, Hours)
 */
app.get('/api/settings', (req, res) => {
  let settings = db.getSettings();
  if (!settings) {
    settings = initialCafeSettings;
    db.saveSettings(settings);
  }
  return res.json(settings);
});

app.post('/api/admin/settings', requireAdmin, (req, res) => {
  db.saveSettings(req.body);
  return res.json({ success: true, settings: req.body });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  db.saveSettings(req.body);
  return res.json({ success: true, settings: req.body });
});


// ==========================================
// 2. PRIVATE ADMIN SECURITY & AUTH ENDPOINTS
// ==========================================

/**
 * Admin Login with Salted/Hashed PIN Verification
 */
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  const authResult = securityService.authenticate(pin, ip, userAgent);

  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }

  return res.json({
    success: true,
    token: authResult.token,
    expiresAt: authResult.expiresAt,
  });
});

/**
 * Verify active Admin Token
 */
app.get('/api/admin/verify', requireAdmin, (req, res) => {
  return res.json({ valid: true, sessionId: req.adminSessionId });
});

/**
 * Change Admin PIN (requires current PIN)
 */
app.post('/api/admin/change-pin', requireAdmin, (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin) {
    return res.status(400).json({ error: 'Current PIN and new PIN are required' });
  }

  const ip = getClientIp(req);
  const result = securityService.changePin(currentPin, newPin, ip);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    message: 'Admin PIN updated successfully. All other sessions invalidated.',
    token: result.token,
    expiresAt: result.expiresAt,
  });
});

/**
 * Emergency PIN Recovery using Master Recovery Key
 */
app.post('/api/admin/recovery', (req, res) => {
  const { recoveryKey, newPin } = req.body;
  if (!recoveryKey || !newPin) {
    return res.status(400).json({ error: 'Master Recovery Key and new PIN are required' });
  }

  const ip = getClientIp(req);
  const result = securityService.recoverPin(recoveryKey, newPin, ip);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    message: 'Admin PIN reset successfully via Recovery Key',
    newRecoveryKey: result.newRecoveryKey,
  });
});

/**
 * Admin Security Info (Recovery Key, Sessions, Audit Log)
 */
app.get('/api/admin/security-info', requireAdmin, (req, res) => {
  const info = securityService.getSecurityInfo();
  return res.json(info);
});

/**
 * Logout all active admin sessions
 */
app.post('/api/admin/logout-all', requireAdmin, (req, res) => {
  securityService.logoutAllSessions();
  return res.json({ success: true, message: 'All active sessions invalidated' });
});

// ==========================================
// 3. ADMIN ORDER MANAGEMENT ENDPOINTS
// ==========================================

/**
 * View all orders with full details & WhatsApp status
 */
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  return res.json(db.getOrders());
});

/**
 * Update order status (Confirmed, Preparing, Ready, Completed, Cancelled)
 */
app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready for Pickup',
    'Out for Delivery',
    'Completed',
    'Cancelled',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const updated = db.updateOrderStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }

  return res.json(updated);
});

/**
 * Retry WhatsApp Business Cloud API notification manually
 */
app.post('/api/admin/orders/:id/retry-whatsapp', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const order = db.getOrderById(id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const waResult = await sendWhatsAppOrderNotification(order);
  const updatedOrder = db.updateOrderWhatsAppStatus(order.id, {
    deliveryStatus: waResult.status,
    messageId: waResult.messageId,
    error: waResult.error,
  });

  return res.json({
    success: waResult.success,
    order: updatedOrder,
    whatsappResult: waResult,
  });
});

/**
 * WhatsApp Meta Cloud API Configuration Status
 */
app.get('/api/admin/whatsapp-config', requireAdmin, (req, res) => {
  const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneId = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const destination = process.env.OWNER_WHATSAPP_DESTINATION || '966579165664';

  return res.json({
    isConfigured: Boolean(token && phoneId),
    hasToken: Boolean(token),
    hasPhoneId: Boolean(phoneId),
    destinationPhone: destination,
    tokenPreview: token ? `${token.slice(0, 6)}...${token.slice(-4)}` : '',
    phoneId: phoneId,
    documentation: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
  });
});

/**
 * Save WhatsApp Meta Cloud API Configuration
 */
app.post('/api/admin/whatsapp-config', requireAdmin, (req, res) => {
  const { token, phoneNumberId, destinationPhone } = req.body;

  if (token !== undefined) {
    process.env.META_WHATSAPP_TOKEN = token.trim();
  }
  if (phoneNumberId !== undefined) {
    process.env.META_PHONE_NUMBER_ID = phoneNumberId.trim();
  }
  if (destinationPhone !== undefined) {
    process.env.OWNER_WHATSAPP_DESTINATION = destinationPhone.trim();
  }

  const currentSettings = db.getSettings() || {};
  currentSettings.whatsappApi = {
    token: process.env.META_WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
    destination: process.env.OWNER_WHATSAPP_DESTINATION || '966579165664',
  };
  db.saveSettings(currentSettings);

  return res.json({
    success: true,
    isConfigured: Boolean(process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID),
    hasToken: Boolean(process.env.META_WHATSAPP_TOKEN),
    hasPhoneId: Boolean(process.env.META_PHONE_NUMBER_ID),
    destinationPhone: process.env.OWNER_WHATSAPP_DESTINATION || '966579165664',
  });
});

/**
 * Send Live Test WhatsApp Notification to Owner Phone (+966579165664)
 */
app.post('/api/admin/whatsapp-test', requireAdmin, async (req, res) => {
  const testOrder = {
    id: `test-${Date.now()}`,
    orderNumber: '#TH-TEST',
    customer: {
      name: 'Tora House Owner Test',
      phone: process.env.OWNER_WHATSAPP_DESTINATION || '966579165664',
    },
    items: [
      {
        quantity: 1,
        product: { nameEn: 'Ice Spanish Latte' },
        subtotal: 14,
      },
      {
        quantity: 1,
        product: { nameEn: 'Croissant Cheese' },
        subtotal: 7,
      },
    ],
    subtotal: 21,
    deliveryFee: 0,
    total: 21,
    orderType: 'pickup',
  };

  const result = await sendWhatsAppOrderNotification(testOrder);
  return res.json(result);
});

// ==========================================
// 4. PRODUCTS & SETTINGS ENDPOINTS
// ==========================================

app.get('/api/products', (req, res) => {
  return res.json(db.getProducts() || initialProducts);
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const newProduct = db.addProduct(req.body);
  return res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  return res.json(updated);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.deleteProduct(req.params.id);
  return res.json({ success: true });
});

app.post('/api/admin/products/reset', requireAdmin, (req, res) => {
  db.saveProducts(initialProducts);
  return res.json(initialProducts);
});

app.get('/api/settings', (req, res) => {
  return res.json(db.getSettings() || initialCafeSettings);
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  db.saveSettings(req.body);
  return res.json(req.body);
});

// ==========================================
// 5. VITE INTEGRATION / STATIC SPA SERVING
// ==========================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: rootDir,
    });

    // Only use Vite middleware for non-API requests
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      vite.middlewares(req, res, next);
    });
  } else {
    // Production mode: Serve dist statically
    const distPath = path.join(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 TORA HOUSE FULL-STACK SERVER RUNNING`);
    console.log(`👉 Local:   http://localhost:${PORT}/`);
    console.log(`👉 Direct:  http://127.0.0.1:${PORT}/`);
    console.log(`🔒 Admin Portal Secret Route: http://localhost:${PORT}/#owner`);
    console.log(`📱 Owner WhatsApp Notification Target: +966579165664`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to launch server:', err);
});
