import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { apiLogin } from "@/lib/api";

export type UserRole = "CIUDADANO" | "CENTRO_DE_ACOPIO" | null;

interface UserData {
  user_id: number;
  rol: UserRole;
  nombres: string;
  apellidos: string;
  telefono: string;
  puntos_acumulados: number;
  nivel_gamificacion: number;
}

interface AuthContextType {
  user: UserData | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserPoints: (points: number) => void;
  addPoints: (points: number) => void;
  deductPoints: (points: number) => boolean;
  getTotalPoints: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const POINTS_STORAGE_KEY = "eco_local_points";

const formatRole = (rol: string): UserRole => {
  const normalized = rol.toLowerCase().trim().replace(/_/g, " ");
  if (normalized === "ciudadano") return "CIUDADANO";
  if (normalized === "centro de acopio") return "CENTRO_DE_ACOPIO";
  const upper = rol.toUpperCase().trim();
  if (upper === "CIUDADANO") return "CIUDADANO";
  if (upper === "CENTRO_DE_ACOPIO") return "CENTRO_DE_ACOPIO";
  return "CIUDADANO";
};

// Get local points from storage
const getLocalPoints = (): number => {
  try {
    const stored = localStorage.getItem(POINTS_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

// Save local points to storage
const saveLocalPoints = (points: number) => {
  try {
    localStorage.setItem(POINTS_STORAGE_KEY, points.toString());
  } catch (e) {
    console.error("Error saving points to storage:", e);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [localPoints, setLocalPoints] = useState<number>(0);

  // Load local points on mount
  useEffect(() => {
    setLocalPoints(getLocalPoints());
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await apiLogin(email, password);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || "Error al iniciar sesión" };
    }

    const userData: UserData = {
      user_id: result.data.user_id,
      rol: formatRole(result.data.rol),
      nombres: result.data.nombres,
      apellidos: result.data.apellidos,
      telefono: result.data.telefono,
      puntos_acumulados: result.data.puntos_acumulados,
      nivel_gamificacion: result.data.nivel_gamificacion,
    };

    setUser(userData);
    // Load local points after login
    setLocalPoints(getLocalPoints());
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserPoints = (points: number) => {
    setUser((prev) => prev ? { ...prev, puntos_acumulados: points } : null);
  };

  // Add points to local storage (from AI response)
  const addPoints = useCallback((points: number) => {
    const newTotal = localPoints + points;
    setLocalPoints(newTotal);
    saveLocalPoints(newTotal);
  }, [localPoints]);

  // Deduct points from local storage (for reward redemption)
  const deductPoints = useCallback((points: number): boolean => {
    const totalPoints = (user?.puntos_acumulados || 0) + localPoints;
    if (points > totalPoints) {
      return false; // Not enough points
    }
    const newLocalPoints = localPoints - points;
    setLocalPoints(newLocalPoints);
    saveLocalPoints(newLocalPoints);
    return true;
  }, [localPoints, user?.puntos_acumulados]);

  // Get total points (API + local)
  const getTotalPoints = useCallback((): number => {
    const apiPoints = user?.puntos_acumulados || 0;
    return apiPoints + localPoints;
  }, [user?.puntos_acumulados, localPoints]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user, 
      updateUserPoints,
      addPoints,
      deductPoints,
      getTotalPoints,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
