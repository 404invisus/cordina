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
  permissions: string[];
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isAdmin: () => boolean;
  primaryRole: () => string | null;
}

function safeGetUser(): User | null {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw) as User;
  } catch {
    sessionStorage.removeItem('user');
    return null;
  }
}

function safeGetToken(): string | null {
  try {
    return Cookies.get('token') || null;
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
  permissions:     isBrowser ? JSON.parse(sessionStorage.getItem('permissions') || '[]') : [],

  setAuth: (user, token) => {
    // Token hanya di cookie — JANGAN simpan di localStorage
    Cookies.set('token', token, { expires: 1, sameSite: 'strict' });
    Cookies.set('user_roles', encodeURIComponent(JSON.stringify(user.roles)), { expires: 1, sameSite: 'strict' });
    // User data di sessionStorage (bukan localStorage) — hilang saat tab tutup
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user_roles');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('permissions');
    // Bersihkan localStorage lama jika masih ada
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    }
    set({ user: null, token: null, isAuthenticated: false, permissions: [] });
  },

  updateUser: (userData) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...userData };
      sessionStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    }
  },

  setPermissions: (permissions) => {
    sessionStorage.setItem('permissions', JSON.stringify(permissions));
    set({ permissions });
  },

  hasPermission: (permission) => get().permissions.includes(permission),

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
    return user.roles.some(r => ADMIN_ROLES.includes(r));
  },

  primaryRole: () => {
    const user = get().user;
    if (!user) return null;
    return ROLE_ORDER.find(r => user.roles.includes(r)) ?? user.roles[0] ?? null;
  },
}));
