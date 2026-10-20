import { Capacitor } from '@capacitor/core';

export const AUTH_SESSION_KEY = 'eco_auth_session';

export async function readSession(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
    return SecureStorage.getItem(AUTH_SESSION_KEY);
  }
  try {
    return localStorage.getItem(AUTH_SESSION_KEY);
  } catch {
    return null;
  }
}

export async function writeSession(value: string | null): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
    if (value === null) await SecureStorage.removeItem(AUTH_SESSION_KEY);
    else await SecureStorage.setItem(AUTH_SESSION_KEY, value);
    return;
  }
  if (value === null) localStorage.removeItem(AUTH_SESSION_KEY);
  else localStorage.setItem(AUTH_SESSION_KEY, value);
}

export function readLegacySession(): { tokens: unknown; user: unknown } | null {
  // Keep tokens/profile paired from the same storage during migration.
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      const tokens: unknown = JSON.parse(storage.getItem('eco_auth_tokens') ?? 'null');
      if (tokens) {
        let user: unknown = null;
        try {
          user = JSON.parse(storage.getItem('eco_auth_user') ?? 'null');
        } catch {
          /* Refresh restores the profile. */
        }
        return { tokens, user };
      }
    } catch {
      /* Try the other legacy store. */
    }
  }
  return null;
}

export function clearLegacySession(): void {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      window[name].removeItem('eco_auth_tokens');
      window[name].removeItem('eco_auth_user');
    } catch {
      /* The old browser store may be unavailable. */
    }
  }
}
