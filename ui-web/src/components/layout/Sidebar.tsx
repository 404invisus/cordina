'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Activity,
  HardDrive,
  Shield,
  Calendar,
  GitMerge,
  Archive,
  FileText,
  UserCog,
  FolderOpen,
  CalendarRange,
  MessageCircle,
  FileSignature,
  FilePen,
} from 'lucide-react';
import { getInitials, getRoleLabel } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: {
    groupWorkspace: 'WORKSPACE',
    groupRecords: 'RECORDS',
    groupGovernance: 'GOVERNANCE',
    groupBriefing: 'BRIEFING',
    groupAdmin: 'Admin',
    navDashboard: 'Dashboard',
    navProjects: 'Projects',
    navTasks: 'Tasks',
    navWorkload: 'Workload',
    navCalendar: 'Calendar',
    navReports: 'Reports',
    navNotifications: 'Notifications',
    navStorage: 'Storage',
    navAssets: 'Physical Assets',
    navDocuments: 'Official Documents',
    navChangeManagement: 'Change Management',
    navEsign: 'e-Sign',
    navEsignDistribution: 'e-Sign Distribution',
    navDailyBrief: 'Daily Brief',
    adminManageUsers: 'Manage Users',
    adminManageProjects: 'Manage Projects',
    adminManageCalendar: 'Manage Calendar',
    adminWorkloadMonitor: 'Workload Monitor',
    adminTelegramBot: 'Telegram Bot',
    adminEsignConfig: 'e-Sign Config',
    adminActivityLog: 'Activity Log',
    adminUserGroups: 'User Groups',
  },
  id: {
    groupWorkspace: 'RUANG KERJA',
    groupRecords: 'ARSIP',
    groupGovernance: 'TATA KELOLA',
    groupBriefing: 'RINGKASAN',
    groupAdmin: 'Admin',
    navDashboard: 'Dasbor',
    navProjects: 'Proyek',
    navTasks: 'Tugas',
    navWorkload: 'Beban Kerja',
    navCalendar: 'Kalender',
    navReports: 'Laporan',
    navNotifications: 'Notifikasi',
    navStorage: 'Penyimpanan',
    navAssets: 'Aset Fisik',
    navDocuments: 'Dokumen Resmi',
    navChangeManagement: 'Manajemen Perubahan',
    navEsign: 'e-Sign',
    navEsignDistribution: 'Distribusi e-Sign',
    navDailyBrief: 'Ringkasan Harian',
    adminManageUsers: 'Kelola Pengguna',
    adminManageProjects: 'Kelola Proyek',
    adminManageCalendar: 'Kelola Kalender',
    adminWorkloadMonitor: 'Monitor Beban Kerja',
    adminTelegramBot: 'Bot Telegram',
    adminEsignConfig: 'Konfigurasi e-Sign',
    adminActivityLog: 'Log Aktivitas',
    adminUserGroups: 'Grup Pengguna',
  },
};

type NavItem = {
  label: string;
  icon: any;
  href: string | null;
  roles: string[];
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'groupWorkspace',
    items: [
      {
        label: 'navDashboard',
        icon: LayoutDashboard,
        href: null,
        roles: ['administrator', 'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      {
        label: 'navProjects',
        icon: FolderKanban,
        href: '/projects',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      {
        label: 'navTasks',
        icon: CheckSquare,
        href: '/tasks',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      { label: 'navWorkload', icon: Activity, href: '/workload', roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master'] },
      {
        label: 'navCalendar',
        icon: Calendar,
        href: '/calendar',
        roles: ['administrator', 'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      { label: 'navReports', icon: BarChart3, href: '/reports', roles: ['kepala_balai', 'kepala_seksi', 'project_manager'] },
      {
        label: 'navNotifications',
        icon: Bell,
        href: '/notifications',
        roles: ['administrator', 'kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
    ],
  },
  {
    label: 'groupRecords',
    items: [
      {
        label: 'navStorage',
        icon: HardDrive,
        href: '/storage',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      {
        label: 'navAssets',
        icon: Archive,
        href: '/assets',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      {
        label: 'navDocuments',
        icon: FileText,
        href: '/documents',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
    ],
  },
  {
    label: 'groupGovernance',
    items: [
      {
        label: 'navChangeManagement',
        icon: GitMerge,
        href: '/change-management',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      {
        label: 'navEsign',
        icon: FileSignature,
        href: '/esign',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
      {
        label: 'navEsignDistribution',
        icon: FilePen,
        href: '/tte-sign',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
    ],
  },
  {
    label: 'groupBriefing',
    items: [
      {
        label: 'navDailyBrief',
        icon: Activity,
        href: '/daily-brief',
        roles: ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'],
      },
    ],
  },
];

const adminNavItems = [
  { label: 'adminManageUsers', icon: UserCog, href: '/admin/users' },
  { label: 'adminManageProjects', icon: FolderOpen, href: '/admin/projects' },
  { label: 'adminManageCalendar', icon: CalendarRange, href: '/admin/calendar' },
  { label: 'adminWorkloadMonitor', icon: Activity, href: '/admin/workload' },
  { label: 'adminTelegramBot', icon: MessageCircle, href: '/admin/telegram' },
  { label: 'adminEsignConfig', icon: Shield, href: '/admin/tte' },
  { label: 'adminActivityLog', icon: Activity, href: '/admin/activity', roles: ['administrator'] },
  { label: 'adminUserGroups', icon: Users, href: '/admin/user-groups', roles: ['administrator'] },
];

function NavLink({
  item,
  active,
  dashboardHref,
  notifCount,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  dashboardHref: string;
  notifCount?: number;
  onClick?: () => void;
}) {
  const t = useT(dict);
  const href = item.href || dashboardHref;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-[10px] py-[7px] rounded-[6px] text-[12.5px] font-medium transition-all duration-150 ${
        active ? 'bg-white/14 text-white font-semibold' : 'text-navy-text-muted hover:bg-white/8 hover:text-white/90'
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-[17px] rounded-r-sm bg-gold-500"
        />
      )}
      <item.icon className="w-[14px] h-[14px] flex-shrink-0" strokeWidth={1.4} />
      <span className="flex-1 truncate">{t(item.label)}</span>
      {notifCount ? (
        <span className="ml-auto font-mono text-[10px] font-semibold bg-white/13 px-[5px] py-px rounded-[3px]">{notifCount}</span>
      ) : null}
    </Link>
  );
}

function NavGroupLabel({ label }: { label: string }) {
  const t = useT(dict);
  return (
    <div className="px-2 pt-3.5 pb-[5px]">
      <span className="text-[9.5px] font-semibold font-mono tracking-[0.14em] text-navy-text-dim">{t(label)}</span>
    </div>
  );
}

function SidebarContent({
  user,
  userRoles,
  dashboardHref,
  pathname,
  onClose,
  onLogout,
  primaryRole,
  isAdmin,
  unreadCount,
}: {
  user: any;
  userRoles: string[];
  dashboardHref: string;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
  primaryRole: string;
  isAdmin: boolean;
  unreadCount?: number;
}) {
  const { locale } = useLocale();
  const t = useT(dict);
  const isActive = (href: string | null) => (href ? pathname.startsWith(href) : pathname.startsWith('/dashboard'));

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-[18px] py-4 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center gap-[11px]">
          <div className="w-[30px] h-[30px] flex items-center justify-center flex-shrink-0">
            <img src="/logo-only-white.png" alt="ConnectOne" className="w-[28px] h-[28px] object-contain" />
          </div>
          <div className="flex flex-col gap-px min-w-0">
            <span className="font-bold text-[13.5px] text-white tracking-[-0.01em] truncate">ConnectOne</span>
            <span className="font-mono text-[8.5px] font-medium tracking-[0.12em] text-white/50 truncate">BLPID</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto pb-2">
        {navGroups.map((group) => {
          const visible = group.items.filter((item) => userRoles.some((r) => item.roles.includes(r)));
          if (!visible.length) return null;
          return (
            <div key={group.label}>
              <NavGroupLabel label={group.label} />
              {visible.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  active={isActive(item.href)}
                  dashboardHref={dashboardHref}
                  notifCount={item.label === 'navNotifications' ? unreadCount || undefined : undefined}
                  onClick={onClose}
                />
              ))}
            </div>
          );
        })}

        {isAdmin && (
          <div>
            <div className="px-2 pt-3.5 pb-[5px] flex items-center gap-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[9.5px] font-semibold font-mono tracking-[0.14em] text-navy-text-dim">{t('groupAdmin')}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.label}
                item={item as NavItem}
                active={isActive(item.href)}
                dashboardHref={dashboardHref}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </nav>

      {/* User card + actions */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10 flex-shrink-0 space-y-0.5">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-[6px] bg-white/8 border border-white/10 mb-2">
          <div className="w-7 h-7 rounded-[5px] bg-gold-500 flex items-center justify-center text-navy-800 text-[11px] font-bold flex-shrink-0">
            {getInitials(user.full_name)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-[12px] font-semibold truncate">{user.full_name}</div>
            <div className="text-navy-text-dim text-[9px] font-mono uppercase tracking-[0.06em]">{getRoleLabel(primaryRole, locale)}</div>
          </div>
        </div>
        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12.5px] font-medium transition-all duration-150 ${
            pathname.startsWith('/settings') ? 'bg-white/14 text-white' : 'text-navy-text-muted hover:bg-white/8 hover:text-white'
          }`}
        >
          <Settings className="w-[14px] h-[14px]" strokeWidth={1.4} />
          {t('common.settings')}
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12.5px] font-medium text-danger/70 hover:bg-danger/10 hover:text-danger transition-all duration-150"
        >
          <LogOut className="w-[14px] h-[14px]" strokeWidth={1.4} />
          {t('common.signOut')}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  mobileOpen,
  onMobileClose,
  ...contentProps
}: {
  user: any;
  userRoles: string[];
  dashboardHref: string;
  pathname: string;
  onLogout: () => void;
  primaryRole: string;
  isAdmin: boolean;
  unreadCount?: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[224px] bg-navy-700 flex-col flex-shrink-0">
        <SidebarContent {...contentProps} onClose={onMobileClose} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              key="sidebar"
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 w-[224px] bg-navy-700 z-50 lg:hidden "
            >
              <SidebarContent {...contentProps} onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
