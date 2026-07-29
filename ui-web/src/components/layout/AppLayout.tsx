'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3,
  Bell, Settings, LogOut, Menu, ChevronDown,
  Activity, HardDrive, Shield, ChevronRight, Calendar, GitMerge, Archive, FileText,
  UserCog, FolderOpen, CalendarRange, MessageCircle, FileSignature, FilePen, Search,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationService, authService } from '@/lib/api';
import { getInitials, getRoleLabel, getDashboardPath } from '@/lib/utils';
import toast from 'react-hot-toast';

type NavItem = {
  label: string;
  icon: any;
  href: string | null;
  roles: string[];
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'WORKSPACE',
    items: [
      { label: 'Dashboard',     icon: LayoutDashboard, href: null,                 roles: ['administrator','kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'Projects',      icon: FolderKanban,    href: '/projects',           roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'Tasks',         icon: CheckSquare,     href: '/tasks',              roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'Workload',      icon: Activity,        href: '/workload',           roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master'] },
      { label: 'Calendar',      icon: Calendar,        href: '/calendar',           roles: ['administrator','kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'Reports',       icon: BarChart3,       href: '/reports',            roles: ['kepala_balai','kepala_seksi','project_manager'] },
      { label: 'Notifications',    icon: Bell,         href: '/notifications',      roles: ['administrator','kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
    ],
  },
  {
    label: 'RECORDS',
    items: [
      { label: 'Storage',           icon: HardDrive,    href: '/storage',    roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'Physical Assets',   icon: Archive,      href: '/assets',     roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'Official Documents', icon: FileText,    href: '/documents',  roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { label: 'Change Management',   icon: GitMerge,      href: '/change-management', roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'e-Sign',              icon: FileSignature,  href: '/esign',             roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
      { label: 'e-Sign Distribution', icon: FilePen,        href: '/tte-sign',          roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
    ],
  },
  {
    label: 'BRIEFING',
    items: [
      { label: 'Daily Brief', icon: Activity, href: '/daily-brief', roles: ['kepala_balai','kepala_seksi','project_manager','scrum_master','staff'] },
    ],
  },
];

const navItems = navGroups.flatMap(g => g.items);

const adminNavItems = [
  { label: 'Manage Users',       icon: UserCog,       href: '/admin/users' },
  { label: 'Manage Projects',    icon: FolderOpen,    href: '/admin/projects' },
  { label: 'Manage Calendar',    icon: CalendarRange, href: '/admin/calendar' },
  { label: 'Workload Monitor',   icon: Activity,      href: '/admin/workload' },
  { label: 'Telegram Bot',       icon: MessageCircle, href: '/admin/telegram' },
  { label: 'e-Sign Config',      icon: Shield,        href: '/admin/tte' },
  { label: 'Activity Log',       icon: Activity,      href: '/admin/activity',    roles: ['administrator'] },
  { label: 'User Groups',        icon: Users,         href: '/admin/user-groups', roles: ['administrator'] },
];

function NavLink({
  item, active, dashboardHref, notifCount, onClick,
}: {
  item: NavItem;
  active: boolean;
  dashboardHref: string;
  notifCount?: number;
  onClick?: () => void;
}) {
  const href = item.href || dashboardHref;
  return (
    <Link href={href} onClick={onClick}
      className={`relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[12.5px] font-medium transition-all duration-150 group ${
        active
          ? 'bg-white/14 text-white'
          : 'text-white/65 hover:bg-white/8 hover:text-white/90'
      }`}>
      {active && (
        <motion.div layoutId="sidebar-active"
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-[17px] rounded-r-sm bg-white/70" />
      )}
      <item.icon className="w-[14px] h-[14px] flex-shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {notifCount ? (
        <span className="ml-auto font-mono text-[10px] font-semibold bg-white/13 px-[5px] py-px rounded-[3px]">
          {notifCount}
        </span>
      ) : null}
    </Link>
  );
}

function NavGroupLabel({ label }: { label: string }) {
  return (
    <div className="px-2 pt-3 pb-1">
      <span className="text-[9.5px] font-semibold font-mono tracking-[0.14em] text-blue-200/50 uppercase">
        {label}
      </span>
    </div>
  );
}

function SidebarContent({
  user, userRoles, dashboardHref, pathname, onClose, onLogout, primaryRole, isAdmin, unreadCount,
}: {
  user: any; userRoles: string[]; dashboardHref: string;
  pathname: string; onClose: () => void; onLogout: () => void;
  primaryRole: string; isAdmin: boolean; unreadCount?: number;
}) {
  const isActive = (href: string | null) =>
    href ? pathname.startsWith(href) : pathname.startsWith('/dashboard');

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-[18px] py-4 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center gap-[11px]">
          <div className="w-[30px] h-[30px] flex items-center justify-center flex-shrink-0">
            <img src="/logo-only-white.png" alt="ConnectOne" className="w-[28px] h-[28px] object-contain" />
          </div>
          <span className="font-bold text-[13.5px] text-white tracking-[-0.01em]">ConnectOne</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto pb-2">
        {navGroups.map(group => {
          const visible = group.items.filter(item => userRoles.some(r => item.roles.includes(r)));
          if (!visible.length) return null;
          return (
            <div key={group.label}>
              <NavGroupLabel label={group.label} />
              {visible.map(item => (
                <NavLink key={item.label} item={item} active={isActive(item.href)}
                  dashboardHref={dashboardHref}
                  notifCount={item.label === 'Notifications' ? (unreadCount || undefined) : undefined}
                  onClick={onClose} />
              ))}
            </div>
          );
        })}

        {isAdmin && (
          <div>
            <div className="px-2 pt-3 pb-1 flex items-center gap-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[9.5px] font-semibold font-mono tracking-[0.14em] text-blue-200/50 uppercase">Admin</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            {adminNavItems.map(item => (
              <NavLink key={item.label} item={item as NavItem} active={isActive(item.href)}
                dashboardHref={dashboardHref} onClick={onClose} />
            ))}
          </div>
        )}
      </nav>

      {/* User + actions */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10 flex-shrink-0 space-y-0.5">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-white/8 border border-white/10 mb-2">
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {getInitials(user.full_name)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-[12px] font-semibold truncate">{user.full_name}</div>
            <div className="text-blue-300/70 text-[9px] font-mono">{getRoleLabel(primaryRole)}</div>
          </div>
        </div>
        <Link href="/settings" onClick={onClose}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium transition-all duration-150 ${
            pathname.startsWith('/settings') ? 'bg-white/14 text-white' : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
          }`}>
          <Settings className="w-[14px] h-[14px]" />
          Settings
        </Link>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-200 transition-all duration-150">
          <LogOut className="w-[14px] h-[14px]" />
          Sign Out
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
    toast.success('Signed out successfully');
    router.push('/login');
  };

  const role = primaryRole() || 'staff';

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
  const userRoles     = user?.roles || [];
  const userIsAdmin   = isAdmin();

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-9 h-9 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading...</span>
      </div>
    </div>
  );

  const sidebarProps = {
    user, userRoles, dashboardHref, pathname,
    onClose: () => setSidebarOpen(false),
    onLogout: handleLogout,
    primaryRole: role,
    isAdmin: userIsAdmin,
    unreadCount: unreadCount || 0,
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[224px] bg-brand flex-col flex-shrink-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside key="sidebar" initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 w-[224px] bg-brand z-50 lg:hidden shadow-2xl">
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-5 h-[52px] flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
            <Menu className="w-5 h-5 text-slate-500" />
          </button>

          <div className="text-[12px] font-medium text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          <div className="ml-auto flex items-center gap-[13px]">
            {/* Search */}
            <Link href="/notifications"
              className="hidden sm:flex items-center gap-2 h-[30px] px-3 border border-slate-200 rounded-md w-[210px] text-slate-400 text-[12px] hover:border-slate-300 transition-colors">
              <Search className="w-3 h-3 flex-shrink-0" />
              <span>Search</span>
            </Link>

            {/* Bell */}
            <Link href="/notifications" className="relative flex-shrink-0">
              <Bell className="w-[17px] h-[17px] text-slate-500" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute -top-px -right-px w-[7px] h-[7px] rounded-full bg-amber-500 border-[1.5px] border-white" />
              )}
            </Link>

            <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

            {/* Profile dropdown */}
            <div id="profile-dropdown" className="relative flex-shrink-0">
              <button onClick={() => setProfileOpen(prev => !prev)}
                className="flex items-center gap-[7px] hover:opacity-80 transition-opacity">
                <div className="w-[26px] h-[26px] rounded-md bg-brand flex items-center justify-center text-white text-[10.5px] font-bold">
                  {getInitials(user.full_name)}
                </div>
                <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-[10px] h-[10px] text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="px-4 py-3.5 border-b border-slate-50 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {getInitials(user.full_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-b border-slate-50">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand/8 px-2.5 py-1 rounded-lg">
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
                        Sign Out
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
