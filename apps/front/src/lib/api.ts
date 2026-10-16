/**
 * API Service with Mock Support
 * 
 * Non-authentication endpoints can use mock mode for testing without a backend.
 * 
 * Authentication always uses the configured backend API.
 */

// Toggle this to switch non-authentication endpoints between mock and real APIs
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

export const mockScanResponse = {
  materiales: [
    "Botellas PET transparentes (2 unidades)",
    "Envase de detergente HDPE (1 unidad)",
  ],
  preparacion: [
    "Enjuaga las botellas para eliminar residuos",
    "Retira las tapas y etiquetas si es posible",
    "Aplasta los envases para ahorrar espacio",
  ],
  impacto_inmediato: [
    "Evitarás que 3 envases lleguen a un relleno sanitario",
    "Ahorrarás energía equivalente a 2 horas de luz LED",
    "Reducirás emisiones de CO2 en 0.5 kg",
  ],
  daño_ambiental: [
    "Estas botellas tardarían 450 años en degradarse",
    "Podrían terminar en océanos afectando vida marina",
    "Liberarían microplásticos al descomponerse",
  ],
  peso_estimado: [
    "Botellas PET: 50 a 80 gramos",
    "Envase HDPE: 100 a 150 gramos",
    "Total estimado: 150 a 230 gramos",
  ],
  puntaje: 25,
};

export const mockNoMaterialsResponse = {
  materiales: ["No se detectaron materiales reciclables en la imagen"],
  preparacion: [],
  impacto_inmediato: [],
  daño_ambiental: [],
  peso_estimado: [],
  puntaje: 0,
};

// ============= API Types =============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
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
    user?: {
      id: number;
      name: string;
      rol: string | number;
    };
  };
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

export interface ScanResponse {
  daño_ambiental: string[];
  preparacion: string[];
  impacto_inmediato: string[];
  materiales: string[];
  peso_estimado: string[];
  puntaje: number;
}

export interface UploadImageResponse {
  ia_result: {
    response: string;
  };
}

// ============= API Functions =============

/**
 * Login endpoint
 */
export async function apiLogin(email: string, password: string): Promise<{ success: boolean; data?: LoginResponse; error?: string }> {
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

    const user = responseData.data?.user;
    if (
      !user ||
      typeof user.id !== "number" ||
      typeof user.name !== "string" ||
      (typeof user.rol !== "string" && typeof user.rol !== "number")
    ) {
      console.error("Invalid login response: user data is missing or malformed");
      return { success: false, error: "Respuesta inválida del servidor" };
    }

    return {
      success: true,
      data: {
        user_id: user.id,
        rol: String(user.rol),
        nombres: user.name,
        apellidos: "",
        telefono: "",
        puntos_acumulados: 0,
        nivel_gamificacion: 1,
      },
    };
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
 * Upload and scan image
 */
export async function apiUploadImage(
  imageDataUrl: string,
  userId: number,
  campaniaId?: string
): Promise<{ success: boolean; data?: ScanResponse; error?: string }> {
  if (MOCK_MODE) {
    await delay(MOCK_DELAY * 2); // Simulate longer processing time
    
    // Randomly return valid materials or no materials (80% success rate)
    const hasValidMaterials = Math.random() > 0.2;
    return { 
      success: true, 
      data: hasValidMaterials ? mockScanResponse : mockNoMaterialsResponse 
    };
  }

  try {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("user_id", userId.toString());
    formData.append("file", file);
    formData.append("campania_id", campaniaId || "");

    const apiResponse = await fetch(`${API_BASE_URL}/media/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.detail || "Error al procesar la imagen");
    }

    const data: UploadImageResponse = await apiResponse.json();
    const iaResult = JSON.parse(data.ia_result.response) as ScanResponse;
    return { success: true, data: iaResult };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Error al procesar la imagen" };
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
