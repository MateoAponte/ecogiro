import { z } from 'zod';
import {
  readSession,
  writeSession,
  readLegacySession,
  clearLegacySession,
} from './session-storage';

const userSchema = z.object({
  user_id: z.number().int().positive(),
  rol: z.enum(['CIUDADANO', 'RECUPERADOR', 'CENTRO_DE_ACOPIO']).nullable(),
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

const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type AuthTokens = z.infer<typeof tokensSchema>;
const sessionSchema = z.object({ tokens: tokensSchema, user: userSchema.nullable() });
let memoryTokens: AuthTokens | null = null;
let memoryUser: StoredUser | null = null;
let version = 0;
let initialization: Promise<void> | null = null;
let pendingWrite: Promise<void> = Promise.resolve();
let persistenceError: unknown = null;

// Serialize native writes: an older save cannot finish after logout and resurrect a session.
function persist(): void {
  const snapshot = memoryTokens
    ? JSON.stringify({ tokens: memoryTokens, user: memoryUser })
    : null;
  pendingWrite = pendingWrite.then(async () => {
    try {
      await writeSession(snapshot);
      clearLegacySession();
      persistenceError = null;
    } catch (error) {
      persistenceError = error;
    }
  });
}

export async function flushAuthStorage(): Promise<void> {
  await pendingWrite;
  if (persistenceError)
    throw new Error(
      'No se pudo guardar o borrar la sesión en este dispositivo. Intenta nuevamente.',
    );
}

export function initializeAuthSession(): Promise<void> {
  if (initialization) return initialization;
  const initialVersion = version;
  initialization = (async () => {
    const saved = await readSession();
    let value: unknown = null;
    try {
      value = saved === null ? readLegacySession() : JSON.parse(saved);
    } catch {
      /* Discard corrupt JSON. */
    }
    // A valid token pair may survive a missing/corrupt cached profile: refresh supplies it.
    const raw = value as { tokens?: unknown; user?: unknown } | null;
    const tokens = tokensSchema.safeParse(raw?.tokens);
    const user = userSchema.safeParse(raw?.user);
    if (version !== initialVersion) return;
    if (tokens.success) {
      memoryTokens = tokens.data;
      memoryUser = user.success ? user.data : null;
      if (saved === null || !sessionSchema.safeParse(value).success) {
        persist();
        await flushAuthStorage();
      } else clearLegacySession();
    } else if (saved !== null || value !== null) {
      memoryTokens = null;
      memoryUser = null;
      persist();
      await flushAuthStorage();
    }
  })().catch((error: unknown) => {
    initialization = null;
    throw error;
  });
  return initialization;
}

export function getSessionVersion(): number {
  return version;
}
export function getAuthTokens(): AuthTokens | null {
  return memoryTokens;
}
export function getAuthUser(): StoredUser | null {
  return memoryTokens ? memoryUser : null;
}

export function saveAuthTokens(tokens: AuthTokens): void {
  memoryTokens = tokensSchema.parse(tokens);
  version += 1;
  persist();
}

export function saveAuthUser(user: StoredUser): void {
  memoryUser = userSchema.parse(user);
  persist();
}

export function clearAuthTokens(): void {
  memoryTokens = null;
  memoryUser = null;
  version += 1;
  clearLegacySession();
  persist();
}
