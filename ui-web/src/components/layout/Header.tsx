'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, ChevronDown, Shield, Settings, LogOut } from 'lucide-react';
import { getInitials, getRoleLabel } from '@/lib/utils';
import { formatDateLong } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import SegmentedControl from '@/components/ui/SegmentedControl';

const dict = {
  en: { searchPlaceholder: 'Search' },
  id: { searchPlaceholder: 'Cari' },
};

export default function Header({
  user,
  role,
  unreadCount,
  onMenuClick,
  onLogout,
}: {
  user: any;
  role: string;
  unreadCount?: number;
  onMenuClick: () => void;
  onLogout: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const t = useT(dict);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#profile-dropdown')) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  return (
    <header className="bg-white border-b border-border px-5 h-[52px] flex items-center gap-4 flex-shrink-0">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-[6px] hover:bg-surface-2 transition-colors flex-shrink-0">
        <Menu className="w-5 h-5 text-text-tertiary" />
      </button>

      <div className="text-[12px] font-medium text-text-tertiary hidden sm:block">{formatDateLong(new Date(), locale)}</div>

      <div className="ml-auto flex items-center gap-[13px]">
        {/* Search */}
        <Link
          href="/notifications"
          className="hidden sm:flex items-center gap-2 h-[30px] px-3 border border-border-input rounded-[6px] w-[210px] text-text-placeholder text-[12px] hover:border-border-button transition-colors"
        >
          <Search className="w-3 h-3 flex-shrink-0" />
          <span>{t('searchPlaceholder')}</span>
        </Link>

        {/* Language switcher */}
        <SegmentedControl
          options={[
            { value: 'en', label: 'EN' },
            { value: 'id', label: 'ID' },
          ]}
          value={locale}
          onChange={setLocale}
        />

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Bell */}
        <Link href="/notifications" className="relative flex-shrink-0">
          <Bell className="w-[17px] h-[17px] text-text-secondary" strokeWidth={1.6} />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -top-px -right-px w-[7px] h-[7px] rounded-full bg-gold-500 border-[1.5px] border-white" />
          )}
        </Link>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Profile dropdown */}
        <div id="profile-dropdown" className="relative flex-shrink-0">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-[7px] hover:opacity-80 transition-opacity"
          >
            <div className="w-[26px] h-[26px] rounded-[5px] bg-navy-700 flex items-center justify-center text-white text-[10.5px] font-bold">
              {getInitials(user.full_name)}
            </div>
            <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-[10px] h-[10px] text-text-placeholder" />
            </motion.div>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-60 bg-white rounded-[6px] shadow-[0_4px_16px_rgba(13,43,72,0.12)] border border-border overflow-hidden z-50"
              >
                <div className="px-4 py-3.5 border-b border-border-subtle flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[5px] bg-navy-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-navy-800 truncate">{user.full_name}</div>
                    <div className="text-xs text-text-placeholder truncate">{user.email}</div>
                  </div>
                </div>
                <div className="px-4 py-2 border-b border-border-subtle">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-info-text bg-info-soft px-2.5 py-1 rounded-[4px]">
                    <Shield className="w-3 h-3" />
                    {getRoleLabel(role, locale)}
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-text-placeholder" />
                    {t('common.settings')}
                  </Link>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger-soft transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('common.signOut')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
