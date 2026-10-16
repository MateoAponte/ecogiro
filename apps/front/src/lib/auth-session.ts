export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEY = "eco_auth_tokens";
let memoryTokens: AuthTokens | null = null;
let version = 0;

export function getSessionVersion(): number {
  return version;
}

export function getAuthTokens(): AuthTokens | null {
  if (memoryTokens) return memoryTokens;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      typeof value === "object" && value !== null &&
      "accessToken" in value && typeof value.accessToken === "string" && value.accessToken &&
      "refreshToken" in value && typeof value.refreshToken === "string" && value.refreshToken
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
  } catch { /* Keep the session in memory if browser storage is unavailable. */ }
}

export function clearAuthTokens(): void {
  memoryTokens = null;
  version += 1;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Storage may be unavailable. */ }
}
