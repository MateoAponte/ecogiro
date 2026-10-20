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
  flushAuthStorage,
  getAuthTokens,
  type StoredUser,
} from '@/lib/auth-session';

import { normalizeRole } from '@/lib/auth-roles';
import { clearDeviceNotifications } from '@/lib/device-notifications';
export type { UserRole } from '@/lib/auth-roles';

type UserData = StoredUser;

interface AuthContextType {
  user: UserData | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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

function toUserData(data: LoginResponse): UserData {
  return { ...data, rol: normalizeRole(data.rol) };
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
    const restore = async (initial = false) => {
      const attempt = authAttempt.current;
      const result = await apiRestoreSession();
      if (!active || attempt !== authAttempt.current) return;
      if (result.success && result.data) {
        // The API adapter maps refresh.data.user to the fields used by the views.
        const profile = toUserData(result.data);
        saveAuthUser(profile);
        setUser(profile);
      } else if (initial || !getAuthTokens()) {
        setUser(null);
      }
      if (initial) setIsRestoringSession(false);
    };
    void restore(true);
    // Refresh quietly on returning from the background; do not unmount camera modals.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void restore();
    };
    const onOnline = () => {
      void restore();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
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
    try {
      await flushAuthStorage();
    } catch {
      if (attempt !== authAttempt.current) return { success: false };
      clearAuthTokens();
      await flushAuthStorage().catch(() => undefined);
      return {
        success: false,
        error: 'No se pudo guardar la sesión en este dispositivo. Intenta nuevamente.',
      };
    }
    if (attempt !== authAttempt.current) return { success: false };
    setUser(profile);
    setIsRestoringSession(false);
    // Load local points after login
    setLocalPoints(getLocalPoints());
    return { success: true };
  };

  const logout = async () => {
    const attempt = ++authAttempt.current;
    await clearDeviceNotifications();
    clearAuthTokens();
    await flushAuthStorage();
    if (attempt !== authAttempt.current) return;
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
