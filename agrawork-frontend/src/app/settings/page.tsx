'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Settings, User, Bell, Shield } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [telegramId, setTelegramId] = useState(user?.telegram_chat_id || '');
  const [tab, setTab] = useState('profile');

  const telegramMutation = useMutation({
    mutationFn: (id: string) => authService.setTelegram(id),
    onSuccess: () => { updateUser({ telegram_chat_id: telegramId }); toast.success('Telegram Chat ID disimpan!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menyimpan'),
  });

  return (
    <AppLayout>
      <PageHeader title="Settings" subtitle="Kelola preferensi dan profil kamu" icon={Settings} />

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {[{ id: 'profile', label: 'Profil', icon: User }, { id: 'notif', label: 'Notifikasi', icon: Bell }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-[#284074] shadow-sm' : 'text-slate-500'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="max-w-lg">
          <div className="card space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-[#284074] text-white flex items-center justify-center text-2xl font-700">
                {(user?.full_name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-display font-600 text-xl text-slate-900">{user?.full_name}</div>
                <div className="text-slate-400 text-sm">{user?.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Divisi', user?.division || '—'],
                ['Jabatan', user?.position || '—'],
                ['Role', getRoleLabel(user?.roles?.[0] || '')],
                ['Status', user?.is_active ? 'Aktif' : 'Nonaktif'],
              ].map(([k, v]) => (
                <div key={k}><div className="text-slate-400 text-xs mb-0.5">{k}</div><div className="font-medium text-slate-700">{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'notif' && (
        <div className="max-w-lg">
          <div className="card space-y-4">
            <div>
              <h3 className="font-display font-600 text-slate-800 mb-1">Telegram Notifikasi</h3>
              <p className="text-sm text-slate-500 mb-4">Hubungkan akun Telegram kamu untuk menerima notifikasi task secara real-time.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Telegram Chat ID</label>
                  <div className="flex gap-2">
                    <input value={telegramId} onChange={e => setTelegramId(e.target.value)}
                      className="input-field flex-1" placeholder="Contoh: 123456789" />
                    <button onClick={() => telegramMutation.mutate(telegramId)} disabled={telegramMutation.isPending || !telegramId}
                      className="btn-primary px-4 whitespace-nowrap">
                      {telegramMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  <strong>Cara mendapatkan Chat ID:</strong><br />
                  1. Buka Telegram dan cari @userinfobot<br />
                  2. Kirim /start ke bot tersebut<br />
                  3. Salin ID yang diberikan ke kolom di atas
                </div>
                {user?.telegram_chat_id && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-700">Telegram terhubung: <span className="font-mono font-medium">{user.telegram_chat_id}</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
