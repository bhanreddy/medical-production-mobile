import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'med_pos_access_token',
  REFRESH_TOKEN: 'med_pos_refresh_token',
  USER: 'med_pos_user',
} as const;

let rememberSession = true;
let volatileTokens: { accessToken: string; refreshToken: string } | null = null;
let volatileUser: object | null = null;

export const SecureStorage = {
  /** Unchecked Remember me retains credentials only until this app process ends. */
  async setSessionPersistence(remember: boolean): Promise<void> {
    await SecureStorage.clearAll();
    rememberSession = remember;
  },
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (!rememberSession) { volatileTokens = { accessToken, refreshToken }; return; }
    try {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    } catch {
      // Never crash on storage write failure
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (!rememberSession) return volatileTokens?.accessToken ?? null;
    try {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (!rememberSession) return volatileTokens?.refreshToken ?? null;
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async saveUser(user: object): Promise<void> {
    if (!rememberSession) { volatileUser = user; return; }
    try {
      await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
    } catch {
      // Never crash on storage write failure
    }
  },

  async getUser(): Promise<object | null> {
    if (!rememberSession) return volatileUser;
    try {
      const raw = await SecureStore.getItemAsync(KEYS.USER);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    volatileTokens = null;
    volatileUser = null;
    try {
      await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    } catch { /* ignore */ }
    try {
      await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    } catch { /* ignore */ }
    try {
      await SecureStore.deleteItemAsync(KEYS.USER);
    } catch { /* ignore */ }
  },
};
