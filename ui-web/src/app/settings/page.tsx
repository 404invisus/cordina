'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import api, { authService, notificationService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile', label: 'Profil', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'notif',   label: 'Notifikasi', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
];

const AVATAR_GRADIENTS = [
  'from-[#284074] to-[#3d5a9e]', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-500',
];
function getGradient(name: string) {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}
function getInitials(name: string) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}


const NOTIF_TYPES = [
  { key: 'task.assigned',          label: 'Task Ditugaskan',      desc: 'Saat task di-assign ke kamu' },
  { key: 'task.commented',         label: 'Komentar Task',        desc: 'Saat ada komentar baru di task kamu' },
  { key: 'sprint.started',         label: 'Sprint Dimulai',       desc: 'Saat sprint baru dimulai' },
  { key: 'sprint.completed',       label: 'Sprint Selesai',       desc: 'Saat sprint selesai' },
  { key: 'calendar.event_created', label: 'Agenda Baru',          desc: 'Saat ada agenda kegiatan baru' },
  { key: 'calendar.event_assigned',   label: 'Dijadwalkan di Agenda',        desc: 'Saat kamu dijadwalkan dalam agenda' },
  { key: 'calendar.deadline_reminder', label: 'Pengingat Agenda',              desc: 'Pengingat H-1 dan H-0 agenda' },
  { key: 'tte.sign_requested',         label: 'Permintaan Tanda Tangan',       desc: 'Saat kamu diminta menandatangani dokumen TTE' },
  { key: 'tte.all_signed',             label: 'Dokumen Selesai Ditandatangani',desc: 'Saat semua penandatangan selesai' },
  { key: 'tte.distributed',            label: 'Dokumen Didistribusikan',       desc: 'Saat dokumen TTE dikirim ke kamu' },
  { key: 'change_request.submitted',   label: 'CR Baru Diajukan',              desc: 'Saat ada CR baru yang perlu ditinjau' },
  { key: 'change_request.approved',    label: 'CR Disetujui',                  desc: 'Saat CR kamu disetujui' },
  { key: 'change_request.rejected',    label: 'CR Ditolak',                    desc: 'Saat CR kamu ditolak' },
];

function NotifSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['notif-settings'],
    queryFn: () => notificationService.settings().then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => notificationService.updateSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-settings'] }),
    onError: () => {},
  });

  const isEnabled = (type: string, channel: string) => {
    if (!settings) return true;
    const s = settings.find((x: any) => x.event_type === type && x.channel === channel);
    return s ? s.enabled : true;
  };

  const toggle = (type: string, channel: string, current: boolean) => {
    updateMutation.mutate({ event_type: type, channel, enabled: !current });
  };

  if (isLoading) return <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-1">Pengaturan Notifikasi</h3>
      <p className="text-xs text-slate-400 mb-5">Pilih notifikasi yang ingin kamu terima</p>
      <div className="space-y-1">
        <div className="grid grid-cols-3 gap-2 px-3 pb-2">
          <div className="col-span-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Telegram</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">In-App</div>
        </div>
        {NOTIF_TYPES.map(({ key, label, desc }) => (
          <div key={key} className="grid grid-cols-3 gap-2 items-center px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <div className="text-sm font-semibold text-slate-700">{label}</div>
              <div className="text-xs text-slate-400">{desc}</div>
            </div>
            {['telegram', 'in_app'].map(channel => {
              const enabled = isEnabled(key, channel);
              return (
                <div key={channel} className="flex justify-center">
                  <button onClick={() => toggle(key, channel, enabled)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-[#284074]' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [telegramId, setTelegramId] = useState(user?.telegram_chat_id || '');
  const [nik, setNik] = useState(user?.nik || '');
  const [specimenFile, setSpecimenFile] = useState<File | null>(null);
  const [specimenBlobUrl, setSpecimenBlobUrl] = useState<string | null>(null);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    authService.me().then(r => {
      const u = r.data?.data;
      if (u) {
        updateUser(u);
        setTelegramId(u.telegram_chat_id || '');
        setNik(u.nik || '');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.tte_specimen_url) return;
    api.get(`/api/v1/storage/${user.tte_specimen_url}/download`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        setSpecimenBlobUrl(url);
      })
      .catch(() => setSpecimenBlobUrl(null));
  }, [user?.tte_specimen_url]);

  const tteMutation = useMutation({
    mutationFn: async () => {
      let specimenUrl = user?.tte_specimen_url || '';
      if (specimenFile) {
        const fd = new FormData();
        fd.append('file', specimenFile);
        const res = await api.post('/api/v1/storage/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        specimenUrl = res.data?.data?.id || '';
      }
      return api.put(`/api/v1/users/${user?.id}`, { nik, tte_specimen_url: specimenUrl || undefined });
    },
    onSuccess: (res: any) => {
      updateUser({ nik, tte_specimen_url: res.data?.data?.tte_specimen_url || user?.tte_specimen_url });
      toast.success('Data TTE disimpan!');
      setSpecimenFile(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menyimpan'),
  });

  const telegramMutation = useMutation({
    mutationFn: (id: string) => authService.setTelegram(id),
    onSuccess: () => { updateUser({ telegram_chat_id: telegramId }); toast.success('Telegram Chat ID disimpan!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menyimpan'),
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Kelola preferensi dan profil kamu</p>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${tab === t.id ? 'bg-[#284074]/8 text-[#284074]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {tab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center gap-5 pb-5 mb-5 border-b border-slate-100">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradient(user?.full_name || '')} text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0`}>
                      {getInitials(user?.full_name || '')}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
                      <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {user?.roles?.map((r: string) => (
                          <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#284074]/8 text-[#284074]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#284074]" />{getRoleLabel(r)}
                          </span>
                        ))}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${user?.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user?.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user?.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Divisi', value: user?.division || '—', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                      { label: 'Jabatan', value: user?.position || '—', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-700">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TTE Section */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">Tanda Tangan Elektronik (TTE)</h3>
                    <p className="text-xs text-slate-400">Data ini digunakan saat Anda ditunjuk sebagai penandatangan dokumen</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIK</label>
                    <input
                      value={nik}
                      onChange={e => setNik(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-mono placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
                      placeholder="16 digit NIK" maxLength={16} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Spesimen Tanda Tangan</label>
                    {user?.tte_specimen_url && (
                      <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <img
                          src={specimenBlobUrl ?? undefined}
                          alt="Spesimen TTD"
                          className="h-12 object-contain rounded"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                        <div className="text-xs text-slate-500">Spesimen tersimpan. Upload baru untuk mengganti.</div>
                      </div>
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/jpg"
                      onChange={e => setSpecimenFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#284074]/8 file:text-[#284074] hover:file:bg-[#284074]/15 transition-all" />
                    <p className="text-xs text-slate-400 mt-1.5">Format PNG/JPG, disarankan latar transparan</p>
                  </div>

                  <button onClick={() => tteMutation.mutate()} disabled={tteMutation.isPending || (!nik && !specimenFile)}
                    className="px-5 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] disabled:opacity-50 transition-all">
                    {tteMutation.isPending ? 'Menyimpan...' : 'Simpan Data TTE'}
                  </button>
                </div>

                <NotifSettings />
              </motion.div>
            )}

            {tab === 'notif' && (
              <motion.div key="notif" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.47c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.75z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Telegram Notifikasi</h3>
                      <p className="text-xs text-slate-400">Terima notifikasi task secara real-time</p>
                    </div>
                    {user?.telegram_chat_id && (
                      <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Terhubung
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telegram Chat ID</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                          </svg>
                          <input value={telegramId} onChange={e => setTelegramId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all font-mono"
                            placeholder="Contoh: 123456789" />
                        </div>
                        <button onClick={() => telegramMutation.mutate(telegramId)}
                          disabled={telegramMutation.isPending || !telegramId}
                          className="px-5 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] disabled:opacity-50 transition-all whitespace-nowrap">
                          {telegramMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Cara mendapatkan Chat ID:</p>
                      <ol className="text-xs text-slate-500 space-y-1.5">
                        {['Buka Telegram dan cari @BLPIDWorkloadBot', 'Kirim /start ke bot tersebut', 'Salin ID yang diberikan ke kolom di atas'].map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#284074]/10 text-[#284074] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {user?.telegram_chat_id && (
                      <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-500 flex-shrink-0">
                          <circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <div className="text-xs text-emerald-700">
                          Terhubung dengan Chat ID: <span className="font-mono font-bold">{user.telegram_chat_id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <NotifSettings />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}