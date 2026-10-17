/**
 * API Service with Mock Support
 * 
 * Non-authentication endpoints can use mock mode for testing without a backend.
 * 
 * Authentication always uses the configured backend API.
 */

// Toggle this to switch non-authentication endpoints between mock and real APIs
import {
  getAuthTokens, getSessionVersion, saveAuthTokens, clearAuthTokens,
  type AuthTokens,
} from "./auth-session";

export const MOCK_MODE = true;

export const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_API;

// Simulate network delay for more realistic testing
const MOCK_DELAY = 800;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============= Mock Data =============

export const mockUsers = {
  ciudadano: {
    user_id: 1,
    rol: "CIUDADANO",
    nombres: "Carlos",
    apellidos: "González",
    telefono: "3001234567",
    email: "carlos@ejemplo.com",
    puntos_acumulados: 150,
    nivel_gamificacion: 2,
    foto_perfil: "",
  },
  centroAcopio: {
    user_id: 2,
    rol: "CENTRO_DE_ACOPIO",
    nombres: "María",
    apellidos: "Rodríguez",
    telefono: "3009876543",
    email: "maria@centro.com",
    puntos_acumulados: 0,
    nivel_gamificacion: 1,
    foto_perfil: "",
  },
};

// ============= API Types =============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  email?: string;
  direccion?: string;
  foto_perfil?: string;
  user_id: number;
  rol: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  puntos_acumulados: number;
  nivel_gamificacion: number;
}

interface LoginApiEnvelope {
  message?: string | string[];
  data?: {
    at_secret?: string;
    rt_secret?: string;
    user?: {
      id: number;
      name: string;
      rol: string | number;
      eco_points?: number;
      phone?: string;
      email?: string;
      address?: string;
    };
  };
}

export interface AuthResult {
  success: boolean;
  data?: LoginResponse;
  tokens?: AuthTokens;
  error?: string;
}

function parseAuthResponse(response: LoginApiEnvelope): AuthResult {
  const data = response?.data;
  // Login and refresh share the same contract: the current profile is data.user.
  const user = data?.user;
  if (
    !user || typeof user.id !== "number" || typeof user.name !== "string" ||
    (typeof user.rol !== "string" && typeof user.rol !== "number") ||
    typeof data.at_secret !== "string" || !data.at_secret ||
    typeof data.rt_secret !== "string" || !data.rt_secret
  ) {
    return { success: false, error: "Respuesta inválida del servidor" };
  }
  return {
    success: true,
    tokens: { accessToken: data.at_secret, refreshToken: data.rt_secret },
    data: {
      user_id: user.id,
      rol: String(user.rol),
      nombres: user.name,
      apellidos: "",
      telefono: user.phone ?? "",
      email: user.email ?? "",
      direccion: user.address ?? "",
      puntos_acumulados: user.eco_points ?? 0,
      nivel_gamificacion: 1,
    },
  };
}

let refreshRequest: Promise<AuthResult> | null = null;

export function apiRestoreSession(): Promise<AuthResult> {
  if (refreshRequest) return refreshRequest;
  const tokens = getAuthTokens();
  if (!tokens) return Promise.resolve({ success: false });
  const sessionVersion = getSessionVersion();

  refreshRequest = (async (): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokens.refreshToken}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Session refresh failed");
      const result = parseAuthResponse(await response.json());
      // A pending refresh must not restore a session after logout or a new login.
      if (getSessionVersion() !== sessionVersion) return { success: false };
      if (!result.success || !result.tokens) {
        clearAuthTokens();
        return result;
      }
      saveAuthTokens(result.tokens);
      return result;
    } catch {
      if (getSessionVersion() === sessionVersion) clearAuthTokens();
      return { success: false, error: "La sesión expiró. Inicia sesión nuevamente." };
    } finally {
      refreshRequest = null;
    }
  })();
  return refreshRequest;
}

function getLoginError(status: number, message?: string | string[]): string {
  const messages = Array.isArray(message) ? message : message ? [message] : [];

  if (status === 401) {
    if (messages.includes("User not found")) {
      return "No existe una cuenta con este correo electrónico.";
    }
    return "El correo electrónico o la contraseña son incorrectos.";
  }

  if (status === 400) {
    return messages.map((detail) => {
      if (detail.startsWith("Password must contain")) {
        return "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, tres dígitos consecutivos y un carácter especial (@$!%*?&).";
      }
      if (detail === "email must be an email") return "Ingresa un correo electrónico válido.";
      if (detail === "password must be longer than or equal to 12 characters") {
        return "La contraseña debe tener al menos 12 caracteres.";
      }
      return detail;
    }).join(" ") || "Revisa el correo electrónico y la contraseña ingresados.";
  }

  return "No se pudo iniciar sesión. Intenta de nuevo más tarde.";
}

export interface UserProfile {
  usuario_id: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  foto_perfil: string;
  puntos_acumulados: number;
  nivel_gamificacion: number;
}

// ============= API Functions =============

/**
 * Login endpoint
 */
export async function apiLogin(email: string, password: string): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let responseData: LoginApiEnvelope;
    try {
      responseData = await response.json() as LoginApiEnvelope;
    } catch (error) {
      console.error("Invalid login response:", error);
      return { success: false, error: response.ok ? "Respuesta inválida del servidor" : getLoginError(response.status) };
    }

    if (!response.ok) {
      return { success: false, error: getLoginError(response.status, responseData?.message) };
    }

    return parseAuthResponse(responseData);
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

/**
 * Get user profile
 */
export async function apiGetProfile(userId: number): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY);
    
    const mockProfile: UserProfile = {
      usuario_id: userId,
      ...mockUsers.ciudadano,
    };
    return { success: true, data: mockProfile };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`);
    
    if (!response.ok) {
      throw new Error("Error al cargar perfil");
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Profile fetch error:", error);
    return { success: false, error: "No se pudo cargar el perfil" };
  }
}

/**
 * Reverse geocode coordinates to address
 * Note: This uses Mapbox API which doesn't need mocking for basic testing
 */
export async function apiReverseGeocode(lat: string, lng: string): Promise<string> {
  if (MOCK_MODE) {
    await delay(300);
    return "Calle 68 Sur #49-21, Kennedy, Bogotá, Colombia";
  }

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return "Ubicación no disponible";
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&language=es`
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name || "Ubicación no disponible";
    }
    
    return "Ubicación no disponible";
  } catch {
    return `Lat: ${lat}, Lng: ${lng}`;
  }
}

// ============= Mock Mode Toggle =============

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  return MOCK_MODE;
}

/**
 * Get a displayable badge for mock mode (useful for UI indication)
 */
export function getMockModeBadge(): string | null {
  return MOCK_MODE ? "🔧 MODO PRUEBA" : null;
}
