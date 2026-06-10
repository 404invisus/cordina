'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import { notificationService } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; dot: string }> = {
  'task.assigned': {
    label: 'Task Assigned', bg: 'bg-blue-50', dot: 'bg-blue-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  },
  'task.commented': {
    label: 'Komentar Baru', bg: 'bg-violet-50', dot: 'bg-violet-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
  'task.status_changed': {
    label: 'Status Berubah', bg: 'bg-amber-50', dot: 'bg-amber-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-500"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
  },
  'change_request.submitted': {
    label: 'CR Diajukan', bg: 'bg-violet-50', dot: 'bg-violet-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  'change_request.approved': {
    label: 'CR Disetujui', bg: 'bg-emerald-50', dot: 'bg-emerald-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  'change_request.rejected': {
    label: 'CR Ditolak', bg: 'bg-red-50', dot: 'bg-red-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  },
  'sprint.started': {
    label: 'Sprint Dimulai', bg: 'bg-emerald-50', dot: 'bg-emerald-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-500"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  'sprint.completed': {
    label: 'Sprint Selesai', bg: 'bg-green-50', dot: 'bg-green-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-500"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>,
  },
  'calendar.event_created': {
    label: 'Agenda Baru', bg: 'bg-sky-50', dot: 'bg-sky-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-sky-500"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  'calendar.event_assigned': {
    label: 'Dijadwalkan', bg: 'bg-indigo-50', dot: 'bg-indigo-500',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-indigo-500"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
  },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  sent:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Terkirim' },
  failed:  { bg: 'bg-red-50',     text: 'text-red-600',     label: 'Gagal' },
  pending: { bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Pending' },
  read:    { bg: 'bg-slate-100',  text: 'text-slate-500',   label: 'Dibaca' },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.list(page).then(r => r.data.data),
  });

  const notifications = notifData?.data || [];
  const total = notifData?.total || 0;
  const lastPage = notifData?.last_page || 1;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    notificationService.markAllRead().then(() => {
      qc.invalidateQueries({ queryKey: ['notif-unread-count'] });
    }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n: any) => n.status === 'sent').length || 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10 relative">
              <Bell className="w-5 h-5 text-[#284074]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
              <p className="text-sm text-slate-400 mt-0.5">{total} total notifikasi</p>
            </div>
          </div>
          <button onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Pengaturan
          </button>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : !notifications.length ? (
        <EmptyState icon={Bell} title="Tidak ada notifikasi" subtitle="Notifikasi akan muncul saat ada update task, sprint, atau agenda" />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n: any, i: number) => {
              const typeConf = TYPE_CONFIG[n.type] || {
                label: n.type, bg: 'bg-slate-50', dot: 'bg-slate-400',
                icon: <Bell className="w-4 h-4 text-slate-400" />,
              };
              const statusConf = STATUS_CONFIG[n.status] || STATUS_CONFIG.pending;
              const title = n.payload?.event_title || n.payload?.task_title || n.payload?.message || n.type;

              return (
                <motion.div key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-4 hover:border-slate-200 hover:shadow-sm transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${typeConf.bg} flex items-center justify-center flex-shrink-0`}>
                    {typeConf.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{typeConf.label}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeConf.dot}`} />
                          <span className="text-xs text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded-md">{n.channel}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
                        {n.payload?.event_title && (
                          <div className="mt-1.5 space-y-0.5">
                            {n.payload?.start_date && (
                              <p className="text-xs text-slate-500">
                                📅 {n.payload.start_date}
                                {n.payload?.start_time ? ' · ' + n.payload.start_time.slice(0,5) : n.payload?.all_day ? ' · Seharian' : ''}
                              </p>
                            )}
                            {n.payload?.location && <p className="text-xs text-slate-500">🏛 {n.payload.location}</p>}
                            {n.payload?.participants && <p className="text-xs text-slate-500">👥 {n.payload.participants}</p>}
                          </div>
                        )}
                        {n.payload?.task_title && !n.payload?.event_title && (
                          <p className="text-xs text-slate-500 mt-1">Task: {n.payload.task_title}</p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                ← Sebelumnya
              </button>
              <span className="text-sm text-slate-500 px-3">{page} / {lastPage}</span>
              <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Selanjutnya →
              </button>
            </div>
          )}
        </div>
      )}

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Pengaturan Notifikasi" subtitle="Konfigurasi channel notifikasi kamu" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.47c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.75z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700">Telegram</div>
                <div className="text-xs text-slate-400">Notifikasi via bot Telegram</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Chat ID</span>
              <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${user?.telegram_chat_id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {user?.telegram_chat_id || 'Belum diset'}
              </span>
            </div>
          </div>
          {!user?.telegram_chat_id && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">
                Telegram Chat ID belum diset. Set melalui halaman <strong>Settings</strong> untuk mengaktifkan notifikasi.
              </p>
            </div>
          )}
          <button onClick={() => setSettingsOpen(false)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] transition-colors">
            Tutup
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
