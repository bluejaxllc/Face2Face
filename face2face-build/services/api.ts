/**
 * API Service
 * HTTP client for communicating with the Face2Face Express backend on Railway.
 * Uses fetch with cookie-based session auth.
 */

import * as SecureStore from 'expo-secure-store';

// Local development backend URL
// API explicitly routed to Railway production
const API_BASE = 'https://face2face-production-11ee.up.railway.app';
// const API_BASE = 'http://192.168.0.2:5000';
// Session cookie storage key
const SESSION_KEY = 'face2face_session';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private sessionCookie: string | null = null;
  _onAuthFailure: (() => void) | null = null;

  onAuthFailure(callback: () => void) {
    this._onAuthFailure = callback;
  }

  async init() {
    try {
      this.sessionCookie = await SecureStore.getItemAsync(SESSION_KEY);
    } catch {
      this.sessionCookie = null;
    }
  }

  private async saveSession(cookie: string) {
    this.sessionCookie = cookie;
    try {
      await SecureStore.setItemAsync(SESSION_KEY, cookie);
    } catch (e) {
      console.warn('[API] Failed to save session:', e);
    }
  }

  async clearSession() {
    this.sessionCookie = null;
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch (e) {
      console.warn('[API] Failed to clear session:', e);
    }
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.sessionCookie) {
      fetchHeaders['Cookie'] = this.sessionCookie;
      fetchHeaders['X-Session-Token'] = this.sessionCookie;
    }

    const config: RequestInit = {
      method,
      headers: fetchHeaders,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const url = `${API_BASE}${endpoint}`;
    console.log(`[API] ${method} ${endpoint} (session: ${this.sessionCookie ? 'YES' : 'NONE'})`);

    const response = await fetch(url, config);

    // Session is extracted from JSON body (sessionToken field) on login/register
    // No need to parse Set-Cookie headers - iOS strips them anyway

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Auto-clear stale session on 401 so we don't keep repeating failed requests
      if (response.status === 401 && this.sessionCookie) {
        console.log('[API] ⚠️ Got 401 — clearing stale session');
        await this.clearSession();
        // Notify auth context to redirect to login
        if (this._onAuthFailure) this._onAuthFailure();
      }
      throw new ApiError(response.status, errorData.message || `Request failed: ${response.status}`);
    }

    const text = await response.text();
    if (!text) return {} as T;

    try {
      const json = JSON.parse(text);
      if (json && json.sessionToken) {
        console.log(`[API] 🔑 Session token received! Saving: ${json.sessionToken.substring(0, 30)}...`);
        await this.saveSession(json.sessionToken);
        delete json.sessionToken; // clean it up
      }
      console.log(`[API] ✅ ${method} ${endpoint} → session active: ${!!this.sessionCookie}`);
      return json as T;
    } catch {
      return text as unknown as T;
    }
  }

  // Convenience methods
  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  getBaseUrl() {
    return API_BASE;
  }

  isAuthenticated() {
    return !!this.sessionCookie;
  }
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export { ApiError };
export const api = new ApiService();
export default api;
