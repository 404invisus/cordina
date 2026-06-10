'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3,
  Bell, Settings, LogOut, Menu, X, ChevronDown, Layers,
  Briefcase, Activity, FileText, HardDrive, Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/api';
import { getInitials, getRoleLabel, getDashboardPath } from '@/lib/utils';
import toast from 'react-hot-toast';

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: null, // dynamic by role
    roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff', 'superadmin'],
  },
  {
    label: 'Projects',
    icon: FolderKanban,
    href: '/projects',
    roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
  },
  {
    label: 'Tasks',
    icon: CheckSquare,
    href: '/tasks',
    roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
  },
  {
    label: 'Workload',
    icon: Activity,
    href: '/workload',
    roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master'],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    href: '/reports',
    roles: ['kepala_balai', 'kepala_seksi', 'project_manager'],
  },
  {
    label: 'Notifications',
    icon: Bell,
    href: '/notifications',
    roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
  },
  {
    label: 'Users',
    icon: Users,
    href: '/admin/users',
    roles: ['kepala_balai', 'superadmin'],
  },
  {
    label: 'Storage',
    icon: HardDrive,
    href: '/storage',
    roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
  },
  {
    label: 'Super Admin',
    icon: Shield,
    href: '/admin',
    roles: ['superadmin'],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, primaryRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    toast.success('Berhasil keluar');
    router.push('/login');
  };

  const dashboardHref = user ? getDashboardPath(primaryRole() || 'staff') : '/dashboard';

  const visibleNav = navItems.filter(item =>
    user?.roles?.some(r => item.roles.includes(r))
  );

  const isActive = (href: string | null) => {
    if (!href) return pathname.startsWith('/dashboard');
    return pathname.startsWith(href);
  };

  if (!isAuthenticated || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#284074]/30 border-t-[#284074] rounded-full animate-spin" />
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-700 text-xl text-white">Agrawork</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(item => {
          const href = item.href || dashboardHref;
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link-inactive'}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.label === 'Notifications' && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 pb-3 border-t border-white/10 pt-3 space-y-0.5">
        <Link href="/settings" className="sidebar-link-inactive" onClick={() => setSidebarOpen(false)}>
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button onClick={handleLogout} className="sidebar-link-inactive w-full text-left text-red-300 hover:text-red-200 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-600 text-sm">
            {getInitials(user.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.full_name}</div>
            <div className="text-blue-300 text-xs">{getRoleLabel(primaryRole() || '')}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#284074] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-[#284074] z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="text-sm font-medium text-slate-500">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#284074] flex items-center justify-center text-white text-xs font-600">
                  {getInitials(user.full_name)}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.full_name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card-hover border border-slate-100 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-sm font-medium text-slate-800">{user.full_name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                      <Settings className="w-4 h-4" />Settings
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut className="w-4 h-4" />Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
