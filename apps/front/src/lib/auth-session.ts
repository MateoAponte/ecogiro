import { z } from 'zod';

const userSchema = z.object({
  user_id: z.number().int().positive(),
  rol: z.enum(['CIUDADANO', 'CENTRO_DE_ACOPIO']).nullable(),
  nombres: z.string(),
  apellidos: z.string(),
  telefono: z.string(),
  puntos_acumulados: z.number().int().nonnegative(),
  nivel_gamificacion: z.number(),
  email: z.string().optional(),
  direccion: z.string().optional(),
  foto_perfil: z.string().optional(),
});
export type StoredUser = z.infer<typeof userSchema>;
const USER_STORAGE_KEY = 'eco_auth_user';
let memoryUser: StoredUser | null = null;

export function saveAuthUser(user: StoredUser): void {
  memoryUser = userSchema.parse(user);
  try {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(memoryUser));
  } catch {
    /* Memory fallback. */
  }
}

export function getAuthUser(): StoredUser | null {
  if (!getAuthTokens()) return null;
  if (memoryUser) return memoryUser;
  try {
    const parsed = userSchema.safeParse(
      JSON.parse(sessionStorage.getItem(USER_STORAGE_KEY) ?? 'null'),
    );
    if (parsed.success) memoryUser = parsed.data;
    else sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    /* Missing, corrupt or unavailable storage. */
  }
  return memoryUser;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEY = 'eco_auth_tokens';
let memoryTokens: AuthTokens | null = null;
let version = 0;

export function getSessionVersion(): number {
  return version;
}

export function getAuthTokens(): AuthTokens | null {
  if (memoryTokens) return memoryTokens;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (
      typeof value === 'object' &&
      value !== null &&
      'accessToken' in value &&
      typeof value.accessToken === 'string' &&
      value.accessToken &&
      'refreshToken' in value &&
      typeof value.refreshToken === 'string' &&
      value.refreshToken
    ) {
      memoryTokens = { accessToken: value.accessToken, refreshToken: value.refreshToken };
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable. The session can still work in memory.
  }
  return memoryTokens;
}

export function saveAuthTokens(tokens: AuthTokens): void {
  memoryTokens = tokens;
  version += 1;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    /* Keep the session in memory if browser storage is unavailable. */
  }
}

export function clearAuthTokens(): void {
  memoryTokens = null;
  memoryUser = null;
  version += 1;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}
