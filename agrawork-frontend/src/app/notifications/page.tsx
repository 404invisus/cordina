'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Settings } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import { notificationService } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user } = useAuthStore();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list().then(r => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const typeIcons: Record<string, string> = {
    'task.assigned': '📋',
    'task.commented': '💬',
    'task.status_changed': '🔄',
    'sprint.started': '🚀',
    'sprint.completed': '✅',
  };

  return (
    <AppLayout>
      <PageHeader
        title="Notifikasi"
        subtitle="Riwayat notifikasi kamu"
        icon={Bell}
        actions={
          <button onClick={() => setSettingsOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" /> Pengaturan
          </button>
        }
      />

      {isLoading ? <LoadingSpinner /> : !notifications?.length ? (
        <EmptyState icon={Bell} title="Tidak ada notifikasi" subtitle="Notifikasi akan muncul saat ada update task atau sprint" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n.id} className={`card p-4 flex items-start gap-4 transition-all ${n.status === 'sent' ? 'border-[#284074]/10' : 'opacity-70'}`}>
              <div className="text-2xl flex-shrink-0">{typeIcons[n.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 mb-0.5">
                  {n.payload?.message || n.type}
                </div>
                <div className="text-xs text-slate-400">{timeAgo(n.created_at)}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge ${n.status === 'sent' ? 'bg-green-100 text-green-700' : n.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                  {n.status}
                </span>
                <span className="text-xs text-slate-400 capitalize">{n.channel}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Pengaturan Notifikasi" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
            <div className="font-medium mb-1">Telegram Chat ID</div>
            <div className="font-mono text-[#284074]">{user?.telegram_chat_id || 'Belum diset'}</div>
          </div>
          <p className="text-xs text-slate-400">Untuk mengaktifkan notifikasi Telegram, set chat ID kamu melalui endpoint API atau hubungi admin.</p>
          <button onClick={() => setSettingsOpen(false)} className="w-full btn-primary">Tutup</button>
        </div>
      </Modal>
    </AppLayout>
  );
}
