'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3,
  Bell, Settings, LogOut, Menu, ChevronDown, Layers,
  Activity, HardDrive, Shield, ChevronRight, Calendar, GitMerge, Archive, FileText, MapPin,
  UserCog, FolderOpen, CalendarRange, MessageCircle, FileSignature,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/lib/api';
import { authService } from '@/lib/api';
import { getInitials, getRoleLabel, getDashboardPath } from '@/lib/utils';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['administrator', 'kepala_balai'];

const navItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, href: null,                  roles: ['administrator','kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Projects',      icon: FolderKanban,    href: '/projects',            roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Tasks',         icon: CheckSquare,     href: '/tasks',               roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Workload',      icon: Activity,        href: '/workload',            roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master'] },
  { label: 'Calendar',      icon: Calendar,        href: '/calendar',            roles: ['administrator','kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Reports',       icon: BarChart3,       href: '/reports',             roles: ['kepala_balai','kepala_seksi','project_manager'] },
  { label: 'Notifications', icon: Bell,            href: '/notifications',       roles: ['administrator','kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Storage',       icon: HardDrive,       href: '/storage',             roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Aset Fisik',     icon: Archive,        href: '/assets',              roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Dokumen Resmi',  icon: FileText,        href: '/documents',           roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Change Mgmt',   icon: GitMerge,        href: '/change-management',   roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'e-Sign',         icon: FileSignature,   href: '/esign',               roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
  { label: 'Daily Brief',   icon: Activity,        href: '/daily-brief',         roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
];

const adminNavItems = [
  { label: 'Kelola User',     icon: UserCog,      href: '/admin/users' },
  { label: 'Kelola Project',  icon: FolderOpen,   href: '/admin/projects' },
  { label: 'Kelola Kalender', icon: CalendarRange, href: '/admin/calendar' },
  { label: 'Monitor Workload',icon: Activity,     href: '/admin/workload' },
  { label: 'Telegram Bot',    icon: MessageCircle, href: '/admin/telegram' },
  { label: 'Konfigurasi TTE',  icon: Shield,        href: '/admin/tte' },
];

function NavLink({
  item, active, dashboardHref, notifCount, onClick,
}: {
  item: { label: string; icon: any; href: string | null };
  active: boolean;
  dashboardHref: string;
  notifCount?: number;
  onClick?: () => void;
}) {
  const href = item.href || dashboardHref;
  return (
    <Link href={href} onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
        active ? 'bg-white/15 text-white shadow-sm' : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
      }`}>
      {active && (
        <motion.div layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
      )}
      <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${active ? 'text-white' : 'group-hover:scale-110'}`} />
      <span className="flex-1 truncate">{item.label}</span>
      {notifCount ? (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {notifCount}
        </span>
      ) : active ? (
        <ChevronRight className="w-3.5 h-3.5 text-white/50" />
      ) : null}
    </Link>
  );
}

function SidebarContent({
  user, visibleNav, dashboardHref, pathname, onClose, onLogout, primaryRole, isAdmin, unreadCount,
}: {
  user: any; visibleNav: typeof navItems; dashboardHref: string;
  pathname: string; onClose: () => void; onLogout: () => void;
  primaryRole: string; isAdmin: boolean; unreadCount?: number;
}) {
  const isActive = (href: string | null) =>
    href ? pathname.startsWith(href) : pathname.startsWith('/dashboard');

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src="/logo-only-white.png" alt="ConnectOne" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">ConnectOne</span>
        </div>
      </div>

      <div className="px-4 mb-3 flex-shrink-0">
        <div className="bg-white/8 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user.full_name)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user.full_name}</div>
            <div className="text-blue-300 text-[10px]">{getRoleLabel(primaryRole)}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        <div className="px-1 mb-1.5">
          <span className="text-[10px] font-semibold text-blue-300/50 uppercase tracking-widest">Menu</span>
        </div>
        {visibleNav.map(item => (
          <NavLink key={item.label} item={item} active={isActive(item.href)}
            dashboardHref={dashboardHref}
            notifCount={item.label === 'Notifications' ? (unreadCount || undefined) : undefined}
            onClick={onClose} />
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="px-1 pt-3 pb-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-semibold text-blue-300/50 uppercase tracking-widest">Admin</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>
            {adminNavItems.map(item => (
              <NavLink key={item.label} item={item} active={isActive(item.href)}
                dashboardHref={dashboardHref} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/10 flex-shrink-0 space-y-0.5">
        <span className="block px-3 mb-1 text-[10px] font-semibold text-blue-300/50 uppercase tracking-widest">Akun</span>
        <Link href="/settings" onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            pathname.startsWith('/settings') ? 'bg-white/15 text-white' : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
          }`}>
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-200 transition-all duration-150">
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, primaryRole, isAdmin } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#profile-dropdown')) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    toast.success('Berhasil keluar');
    router.push('/login');
  };

  const role          = primaryRole() || 'staff';

  const { data: unreadCount } = useQuery({
    queryKey: ['notif-unread-count'],
    queryFn: () => notificationService.list(1).then(r =>
      (r.data.data?.data || []).filter((n: any) => n.status === 'sent').length
    ),
    refetchInterval: 30000,
    staleTime: 0,
    enabled: isAuthenticated,
  });
  const dashboardHref = user ? getDashboardPath(role) : '/dashboard';
  const visibleNav    = navItems.filter(item => user?.roles?.some(r => item.roles.includes(r)));
  const userIsAdmin   = isAdmin();

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-9 h-9 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Memuat...</span>
      </div>
    </div>
  );

  const sidebarProps = {
    user, visibleNav, dashboardHref, pathname,
    onClose: () => setSidebarOpen(false),
    onLogout: handleLogout,
    primaryRole: role,
    isAdmin: userIsAdmin,
    unreadCount: unreadCount || 0,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden lg:flex w-[220px] bg-[#284074] flex-col flex-shrink-0 shadow-xl">
        <SidebarContent {...sidebarProps} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside key="sidebar" initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#284074] z-50 lg:hidden shadow-2xl">
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="text-sm text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-500" />
              {(unreadCount ?? 0) > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
            </Link>

            <div id="profile-dropdown" className="relative">
              <button onClick={() => setProfileOpen(prev => !prev)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-[#284074] flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(user.full_name)}
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">
                  {user.full_name.split(' ')[0]}
                </span>
                <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="px-4 py-3.5 border-b border-slate-50 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#284074] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {getInitials(user.full_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-b border-slate-50">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#284074] bg-[#284074]/8 px-2.5 py-1 rounded-lg">
                        <Shield className="w-3 h-3" />
                        {getRoleLabel(role)}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link href="/settings" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
