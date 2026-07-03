import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'med_pos_access_token',
  REFRESH_TOKEN: 'med_pos_refresh_token',
  USER: 'med_pos_user',
} as const;

export const SecureStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    } catch {
      // Never crash on storage write failure
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async saveUser(user: object): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
    } catch {
      // Never crash on storage write failure
    }
  },

  async getUser(): Promise<object | null> {
    try {
      const raw = await SecureStore.getItemAsync(KEYS.USER);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
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
