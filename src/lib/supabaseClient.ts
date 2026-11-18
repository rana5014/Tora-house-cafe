import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Keys for runtime configuration stored by Admin Portal
const STORAGE_KEY_URL = 'tora_supabase_url';
const STORAGE_KEY_ANON = 'tora_supabase_anon_key';

/**
 * Normalizes any Supabase URL pasted by the user.
 * Automatically strips accidental suffixes like /rest/v1, /rest/v1/, /graphql, or trailing slashes
 * so that @supabase/supabase-js never constructs invalid paths like /rest/v1/rest/v1/products.
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  // Strip /rest/v1 or /rest if copied from Data API tab in Supabase dashboard
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/rest\/?$/i, '');
  url = url.replace(/\/graphql\/?$/i, '');
  url = url.replace(/\/auth\/v1\/?$/i, '');

  return url.trim();
}

const DEFAULT_SUPABASE_URL = 'https://hhzsorynqqqnryhlsere.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoenNvcnlucXFxbnJ5aGxzZXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5MjM1OTIsImV4cCI6MjExMDQ5OTU5Mn0.T20kFF4-paO4M57rLrWBReaLrGEgftBgpA-_Xep6upw';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  let runtimeUrl = typeof window !== 'undefined' ? normalizeSupabaseUrl(localStorage.getItem(STORAGE_KEY_URL) || '') : '';
  let runtimeKey = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_ANON) || '').trim() : '';

  let envUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
  let envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

  // Prefer valid runtime override if valid, otherwise use baked-in verified credentials
  let url = runtimeUrl && runtimeUrl.includes('.supabase.co') && !runtimeUrl.includes('invalid') ? runtimeUrl : envUrl;
  let anonKey = runtimeKey && runtimeKey.length > 80 && runtimeKey.includes('.') ? runtimeKey : envKey;

  return { url, anonKey };
}

export function isConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    !url.includes('your-project') &&
    !url.includes('your-supabase-project')
  );
}

let activeClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (activeClient) return activeClient;

  if (isConfigured()) {
    const { url, anonKey } = getSupabaseCredentials();
    try {
      activeClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      return activeClient;
    } catch (err) {
      console.error('[Supabase] Failed to initialize client:', err);
      return null;
    }
  }

  return null;
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    if (cleanUrl) {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }

    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY_ANON, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
  }

  // Reset active client instance to re-initialize with new credentials
  activeClient = null;
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  tableCount?: number;
  cleanedUrl?: string;
}> {
  const rawUrl = customUrl || getSupabaseCredentials().url;
  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = (customKey || getSupabaseCredentials().anonKey).trim();

  if (!url || !anonKey) {
    return { success: false, message: 'Supabase URL and Anon Key are required.' };
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return {
      success: false,
      message: 'Invalid Supabase URL format. Expected: https://[project-ref].supabase.co (do not include /rest/v1)',
    };
  }

  try {
    const tempClient = createClient(url, anonKey);
    const { data, error } = await tempClient.from('products').select('id').limit(1);

    if (error) {
      // Check if table does not exist yet
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but the "products" table was not found. Please paste and run schema.sql in Supabase SQL Editor.',
          cleanedUrl: url,
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}`, cleanedUrl: url };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase Central Database!',
      tableCount: data ? data.length : 0,
      cleanedUrl: url,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to connect to Supabase.', cleanedUrl: url };
  }
}

// Export dynamic references
export const isSupabaseConfigured = isConfigured();
export const supabase = getSupabaseClient();
