import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  division?: string;
  position?: string;
  telegram_chat_id?: string;
  avatar?: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasRole: (role: string | string[]) => boolean;
  primaryRole: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null,
  token: typeof window !== 'undefined'
    ? (Cookies.get('token') || localStorage.getItem('token'))
    : null,
  isAuthenticated: typeof window !== 'undefined'
    ? !!(Cookies.get('token') || localStorage.getItem('token'))
    : false,

  setAuth: (user, token) => {
    Cookies.set('token', token, { expires: 1 });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    }
  },

  hasRole: (role) => {
    const user = get().user;
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.some(r => user.roles.includes(r));
    }
    return user.roles.includes(role);
  },

  primaryRole: () => {
    const user = get().user;
    if (!user || !user.roles.length) return null;
    const roleOrder = ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'];
    for (const r of roleOrder) {
      if (user.roles.includes(r)) return r;
    }
    return user.roles[0];
  },
}));
