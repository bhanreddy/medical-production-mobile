import { create } from 'zustand';
import { SecureStorage } from '@/lib/secureStorage';
import { authEventEmitter } from '@/lib/authEventEmitter';

/* ─── Types ─────────────────────────────────────────── */

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  clinicId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isBooting: boolean;
}

interface AuthActions {
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  /** Load JWT + user from SecureStore. Call after splash mounts. */
  hydrateAuthFromSecureStorage: () => Promise<boolean>;
  /** Save both tokens to SecureStorage (call after login/refresh). */
  saveTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

/* ─── Store ─────────────────────────────────────────── */

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isBooting: true,

  hydrateAuthFromSecureStorage: async () => {
    try {
      const [token, userObj] = await Promise.all([
        SecureStorage.getAccessToken(),
        SecureStorage.getUser(),
      ]);
      if (token && userObj) {
        set({
          token,
          user: userObj as User,
          isAuthenticated: true,
          isBooting: false,
        });
        return true;
      }
      set({ isBooting: false });
      return false;
    } catch {
      set({ isBooting: false });
      return false;
    }
  },

  saveTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStorage.saveTokens(accessToken, refreshToken);
    set({ token: accessToken, isAuthenticated: true });
  },

  setToken: (newToken: string) => {
    // Kept for backward compatibility — prefer saveTokens for new code
    set({ token: newToken, isAuthenticated: true });
  },

  setUser: (newUser: User) => {
    void SecureStorage.saveUser(newUser);
    set({ user: newUser });
  },

  logout: () => {
    void SecureStorage.clearAll();
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

/* ─── Listen for forced logouts from API client ─────── */

authEventEmitter.on('LOGOUT', () => {
  useAuthStore.getState().logout();
});

// Re-export store for backward compat with screens that imported { store } from authStore
export { store } from '@/utils/storage';
