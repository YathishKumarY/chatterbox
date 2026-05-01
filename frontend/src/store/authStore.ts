import { create } from 'zustand';
import client from '../api/client';

interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  avatarData?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: { username?: string; avatarData?: string | null }) => Promise<void>;
  logout: () => void;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post('/auth/login', { email, password });
      get().setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post('/auth/register', { email, username, password });
      get().setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await client.get('/users/me');
      set({ user: data, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  updateProfile: async (data) => {
    const { data: updated } = await client.patch('/users/me', data);
    set({ user: { ...get().user!, ...updated } });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  handleOAuthCallback: async (accessToken, refreshToken) => {
    get().setTokens(accessToken, refreshToken);
    await get().fetchUser();
  },
}));
