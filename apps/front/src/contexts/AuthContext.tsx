import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { apiLogin, apiRestoreSession, type LoginResponse } from '@/lib/api';
import {
  clearAuthTokens,
  saveAuthTokens,
  getAuthUser,
  saveAuthUser,
  type StoredUser,
} from '@/lib/auth-session';

export type UserRole = 'CIUDADANO' | 'CENTRO_DE_ACOPIO' | null;

type UserData = StoredUser;

interface AuthContextType {
  user: UserData | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  updateUserPoints: (points: number) => void;
  updateUserProfile: (data: Partial<UserData>) => void;
  addPoints: (points: number) => void;
  deductPoints: (points: number) => boolean;
  getTotalPoints: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const POINTS_STORAGE_KEY = 'eco_local_points';

const formatRole = (rol: string): UserRole => {
  if (rol === '1') return 'CIUDADANO';
  if (rol === '2') return 'CENTRO_DE_ACOPIO';
  const normalized = rol.toLowerCase().trim().replace(/_/g, ' ');
  if (normalized === 'ciudadano') return 'CIUDADANO';
  if (normalized === 'centro de acopio') return 'CENTRO_DE_ACOPIO';
  const upper = rol.toUpperCase().trim();
  if (upper === 'CIUDADANO') return 'CIUDADANO';
  if (upper === 'CENTRO_DE_ACOPIO') return 'CENTRO_DE_ACOPIO';
  return 'CIUDADANO';
};

function toUserData(data: LoginResponse): UserData {
  return { ...data, rol: formatRole(data.rol) };
}

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
    console.error('Error saving points to storage:', e);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(getAuthUser);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const authAttempt = useRef(0);
  const [localPoints, setLocalPoints] = useState<number>(0);

  // Load local points on mount
  useEffect(() => {
    setLocalPoints(getLocalPoints());
    let active = true;
    const attempt = authAttempt.current;
    void apiRestoreSession().then((result) => {
      if (!active || attempt !== authAttempt.current) return;
      if (result.success && result.data) {
        // The API adapter maps refresh.data.user to the fields used by the views.
        const profile = toUserData(result.data);
        saveAuthUser(profile);
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsRestoringSession(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const attempt = ++authAttempt.current;
    const result = await apiLogin(email, password);

    if (attempt !== authAttempt.current) return { success: false };

    if (!result.success || !result.data || !result.tokens) {
      return { success: false, error: result.error || 'Error al iniciar sesión' };
    }

    saveAuthTokens(result.tokens);
    const profile = toUserData(result.data);
    saveAuthUser(profile);
    setUser(profile);
    setIsRestoringSession(false);
    // Load local points after login
    setLocalPoints(getLocalPoints());
    return { success: true };
  };

  const logout = () => {
    authAttempt.current += 1;
    clearAuthTokens();
    setUser(null);
    setIsRestoringSession(false);
  };

  const updateUserPoints = (points: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, puntos_acumulados: points };
      saveAuthUser(next);
      return next;
    });
  };

  const updateUserProfile = (data: Partial<UserData>) => {
    setUser((previous) => {
      if (!previous) return null;
      const next = { ...previous, ...data };
      saveAuthUser(next);
      return next;
    });
  };

  // Add points to local storage (from AI response)
  const addPoints = useCallback(
    (points: number) => {
      const newTotal = localPoints + points;
      setLocalPoints(newTotal);
      saveLocalPoints(newTotal);
    },
    [localPoints],
  );

  // Deduct points from local storage (for reward redemption)
  const deductPoints = useCallback(
    (points: number): boolean => {
      const totalPoints = (user?.puntos_acumulados || 0) + localPoints;
      if (points > totalPoints) {
        return false; // Not enough points
      }
      const newLocalPoints = localPoints - points;
      setLocalPoints(newLocalPoints);
      saveLocalPoints(newLocalPoints);
      return true;
    },
    [localPoints, user?.puntos_acumulados],
  );

  // Get total points (API + local)
  const getTotalPoints = useCallback((): number => {
    const apiPoints = user?.puntos_acumulados || 0;
    return apiPoints + localPoints;
  }, [user?.puntos_acumulados, localPoints]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isRestoringSession,
        updateUserPoints,
        updateUserProfile,
        addPoints,
        deductPoints,
        getTotalPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
