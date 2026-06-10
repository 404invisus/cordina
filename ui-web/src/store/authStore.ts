import { create } from 'zustand';
import Cookies from 'js-cookie';

export interface User {
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
  isAdmin: () => boolean;
  primaryRole: () => string | null;
}

function safeGetUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

function safeGetToken(): string | null {
  try {
    return Cookies.get('token') || localStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

const isBrowser = typeof window !== 'undefined';

const ROLE_ORDER = ['administrator', 'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'];
const ADMIN_ROLES = ['administrator', 'kepala_balai'];

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            isBrowser ? safeGetUser()  : null,
  token:           isBrowser ? safeGetToken() : null,
  isAuthenticated: isBrowser ? !!safeGetToken() : false,

  setAuth: (user, token) => {
    Cookies.set('token', token, { expires: 1 });
    Cookies.set('user_roles', encodeURIComponent(JSON.stringify(user.roles)), { expires: 1 });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user_roles');
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
    return Array.isArray(role)
      ? role.some(r => user.roles.includes(r))
      : user.roles.includes(role);
  },

  isAdmin: () => {
    const user = get().user;
    if (!user) return false;
    return ADMIN_ROLES.some(r => user.roles.includes(r));
  },

  primaryRole: () => {
    const user = get().user;
    if (!user?.roles?.length) return null;
    return ROLE_ORDER.find(r => user.roles.includes(r)) ?? user.roles[0];
  },
}));
