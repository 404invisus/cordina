'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationService, authService } from '@/lib/api';
import { getDashboardPath } from '@/lib/utils';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import Header from './Header';
import { useT } from '@/lib/i18n';

const dict = {
  en: { loading: 'Loading...', signedOut: 'Signed out successfully' },
  id: { loading: 'Memuat...', signedOut: 'Berhasil keluar' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, primaryRole, isAdmin } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useT(dict);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    logout();
    toast.success(t('signedOut'));
    router.push('/login');
  };

  const role = primaryRole() || 'staff';

  const { data: unreadCount } = useQuery({
    queryKey: ['notif-unread-count'],
    queryFn: () => notificationService.list(1).then((r) => (r.data.data?.data || []).filter((n: any) => n.status === 'sent').length),
    refetchInterval: 30000,
    staleTime: 0,
    enabled: isAuthenticated,
  });

  const dashboardHref = user ? getDashboardPath(role) : '/dashboard';
  const userRoles = user?.roles || [];
  const userIsAdmin = isAdmin();

  if (!mounted)
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-9 h-9 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
      </div>
    );

  if (!isAuthenticated || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
          <span className="text-sm text-text-tertiary">{t('loading')}</span>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-bg-page overflow-hidden">
      <Sidebar
        user={user}
        userRoles={userRoles}
        dashboardHref={dashboardHref}
        pathname={pathname}
        onLogout={handleLogout}
        primaryRole={role}
        isAdmin={userIsAdmin}
        unreadCount={unreadCount || 0}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header user={user} role={role} unreadCount={unreadCount || 0} onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-[18px_20px]">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
