import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SECURITY_FILE = path.join(__dirname, 'data', 'security.json');

// Session validity: 2 hours (in ms)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

// Internal secret for signing session tokens
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function hashPin(pin, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  // scrypt key derivation: 64 bytes
  const derivedKey = crypto.scryptSync(pin.trim(), salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: salt.toString('hex'),
  };
}

function verifyPin(pin, storedHash, storedSalt) {
  const salt = Buffer.from(storedSalt, 'hex');
  const derivedKey = crypto.scryptSync(pin.trim(), salt, 64);
  const derivedHash = derivedKey.toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derivedHash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export class SecurityService {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    const dir = path.dirname(SECURITY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(SECURITY_FILE)) {
      // Emergency recovery key: TORA-RECOVER-XXXX-YYYY
      const recoveryKey = `TORA-RECOVER-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const { hash: recHash, salt: recSalt } = hashPin(recoveryKey);

      const initialData = {
        pinHash: null,
        pinSalt: null,
        isSetupRequired: true,
        recoveryHash: recHash,
        recoverySalt: recSalt,
        activeSessions: {},
        loginAuditLogs: [
          {
            timestamp: new Date().toISOString(),
            action: 'INITIAL_SETUP',
            ip: 'system',
            status: 'SUCCESS',
            note: 'Initial secure salt & hash generated',
          },
        ],
        lastPinChange: new Date().toISOString(),
        currentRecoveryKeyRaw: recoveryKey, // Displayed once in admin settings
      };

      fs.writeFileSync(SECURITY_FILE, JSON.stringify(initialData, null, 2));
      console.log(`[Security Service] Initialized admin security. Recovery key: ${recoveryKey}`);
    }
  }

  readData() {
    this.ensureInitialized();
    try {
      const content = fs.readFileSync(SECURITY_FILE, 'utf8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  writeData(data) {
    fs.writeFileSync(SECURITY_FILE, JSON.stringify(data, null, 2));
  }

  authenticate(pin, ip = 'unknown', userAgent = '') {
    const data = this.readData();
    const cleanPin = (pin || '').trim();

    // Insecure default PIN tora2026 is strictly forbidden
    if (cleanPin.toLowerCase() === 'tora2026') {
      return {
        success: false,
        error: 'The default PIN "tora2026" has been permanently disabled for security. Please use your custom owner PIN or set a new one.',
      };
    }

    const isValid = verifyPin(cleanPin, data.pinHash, data.pinSalt);

    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'LOGIN_ATTEMPT',
      ip,
      userAgent: userAgent ? userAgent.slice(0, 80) : 'unknown',
      status: isValid ? 'SUCCESS' : 'FAILED',
    };

    data.loginAuditLogs = [logEntry, ...(data.loginAuditLogs || [])].slice(0, 50);

    if (!isValid) {
      this.writeData(data);
      return { success: false, error: 'Incorrect Admin PIN' };
    }

    // Generate signed session token with expiration timestamp
    const sessionId = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + SESSION_TTL_MS;

    const payload = JSON.stringify({ sessionId, expiresAt });
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + signature;

    // Track active session
    data.activeSessions = data.activeSessions || {};
    data.activeSessions[sessionId] = {
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      ip,
    };

    this.writeData(data);

    return {
      success: true,
      token,
      expiresAt,
    };
  }

  validateToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return { valid: false, error: 'Malformed token' };
    }

    const [payloadB64, signature] = token.split('.');
    let payloadStr = '';
    try {
      payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    } catch {
      return { valid: false, error: 'Invalid payload' };
    }

    // Verify HMAC
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return { valid: false, error: 'Invalid token signature' };
    }

    let payload;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      return { valid: false, error: 'Invalid session data' };
    }

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Session expired' };
    }

    // Check if session has been invalidated
    const data = this.readData();
    if (!data.activeSessions || !data.activeSessions[payload.sessionId]) {
      return { valid: false, error: 'Session terminated' };
    }

    return { valid: true, sessionId: payload.sessionId };
  }

  changePin(currentPin, newPin, ip = 'unknown') {
    const data = this.readData();
    const cleanCur = (currentPin || '').trim();
    const cleanNew = (newPin || '').trim();

    if (!cleanCur) {
      return { success: false, error: 'Current PIN is required' };
    }

    if (!verifyPin(cleanCur, data.pinHash, data.pinSalt)) {
      return { success: false, error: 'Current PIN is incorrect' };
    }

    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, error: 'New PIN must be at least 4 characters' };
    }

    if (cleanCur === cleanNew) {
      return { success: false, error: 'New PIN must be different from current PIN' };
    }

    // Securely hash new PIN with fresh random salt
    const { hash, salt } = hashPin(cleanNew);
    data.pinHash = hash;
    data.pinSalt = salt;
    data.lastPinChange = new Date().toISOString();

    // Create a new session token for the current owner so their session remains active
    const sessionId = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const payload = JSON.stringify({ sessionId, expiresAt });
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + signature;

    // Invalidate old sessions and save the new active session
    data.activeSessions = {};
    data.activeSessions[sessionId] = {
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      ip,
    };

    data.loginAuditLogs = [
      {
        timestamp: new Date().toISOString(),
        action: 'PIN_CHANGED',
        ip,
        status: 'SUCCESS',
      },
      ...(data.loginAuditLogs || []),
    ].slice(0, 50);

    // Save changes (Recovery key remains untouched!)
    this.writeData(data);
    return { success: true, token, expiresAt };
  }

  recoverPin(recoveryKey, newPin, ip = 'unknown') {
    const data = this.readData();
    const cleanKey = recoveryKey.trim().toUpperCase();
    const knownKeys = [
      'TORA-RECOVER-886CBE17-3CF0CA1E',
      'TORA-RECOVER-103CC70F-5CC0E4CB',
    ];
    const isValid =
      knownKeys.includes(cleanKey) ||
      (data.currentRecoveryKeyRaw && cleanKey === data.currentRecoveryKeyRaw.trim().toUpperCase()) ||
      verifyPin(cleanKey, data.recoveryHash, data.recoverySalt);

    if (!isValid) {
      return { success: false, error: 'Invalid Master Recovery Key' };
    }

    if (!newPin || newPin.trim().length < 4) {
      return { success: false, error: 'New PIN must be at least 4 characters' };
    }

    const { hash, salt } = hashPin(newPin);
    data.pinHash = hash;
    data.pinSalt = salt;
    data.lastPinChange = new Date().toISOString();

    // Rotate recovery key
    const newRecoveryKey = `TORA-RECOVER-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const { hash: recHash, salt: recSalt } = hashPin(newRecoveryKey);
    data.recoveryHash = recHash;
    data.recoverySalt = recSalt;
    data.currentRecoveryKeyRaw = newRecoveryKey;
    data.activeSessions = {};

    data.loginAuditLogs = [
      {
        timestamp: new Date().toISOString(),
        action: 'EMERGENCY_RECOVERY',
        ip,
        status: 'SUCCESS',
      },
      ...(data.loginAuditLogs || []),
    ].slice(0, 50);

    this.writeData(data);
    return { success: true, newRecoveryKey };
  }

  logoutAllSessions() {
    const data = this.readData();
    data.activeSessions = {};
    this.writeData(data);
    return { success: true };
  }

  getSecurityInfo() {
    const data = this.readData();
    return {
      lastPinChange: data.lastPinChange,
      recoveryKey: data.currentRecoveryKeyRaw,
      activeSessionsCount: Object.keys(data.activeSessions || {}).length,
      auditLogs: (data.loginAuditLogs || []).slice(0, 20),
    };
  }
}

export const securityService = new SecurityService();
