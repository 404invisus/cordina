'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import api, { authService, notificationService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useLocale, useT } from '@/lib/i18n';
import SegmentedControl from '@/components/ui/SegmentedControl';

const dict = {
  en: {
    pageTitle: 'Settings',
    pageSubtitle: 'Manage your preferences and profile',
    tabProfile: 'Profile',
    tabNotifications: 'Notifications',
    tabSecurity: 'Security',
    division: 'Division',
    position: 'Position',
    esignTitle: 'Electronic Signature (e-Sign)',
    esignDesc: 'This information is used when you are designated as a document signatory',
    nikLabel: 'NIK',
    nikPlaceholder: '16 digit NIK',
    signatureSpecimen: 'Signature Specimen',
    specimenAlt: 'Signature specimen',
    specimenSavedMsg: 'Specimen saved. Upload a new file to replace it.',
    specimenFormatHint: 'PNG/JPG format, transparent background recommended',
    saving: 'Saving...',
    saveEsignData: 'Save e-Sign Data',
    esignSavedToast: 'e-Sign data saved!',
    failedToSave: 'Failed to save',
    telegramNotifTitle: 'Telegram Notifications',
    telegramNotifDesc: 'Receive real-time task notifications',
    connected: 'Connected',
    telegramChatId: 'Telegram Chat ID',
    telegramPlaceholder: 'e.g. 123456789',
    telegramSavedToast: 'Telegram Chat ID saved!',
    howToGetChatId: 'How to get your Chat ID:',
    telegramStep1: 'Open Telegram and search for @BLPIDWorkloadBot',
    telegramStep2: 'Send /start to the bot',
    telegramStep3: 'Copy the ID provided and paste it above',
    connectedWithChatId: 'Connected with Chat ID:',
    notifSettingsTitle: 'Notification Settings',
    notifSettingsDesc: 'Choose which notifications you want to receive',
    colType: 'Type',
    colTelegram: 'Telegram',
    colInApp: 'In-App',
    'task.assigned.label': 'Task Assigned',
    'task.assigned.desc': 'When a task is assigned to you',
    'task.commented.label': 'Task Comment',
    'task.commented.desc': 'When a new comment is added to your task',
    'sprint.started.label': 'Sprint Started',
    'sprint.started.desc': 'When a new sprint begins',
    'sprint.completed.label': 'Sprint Completed',
    'sprint.completed.desc': 'When a sprint is completed',
    'calendar.event_created.label': 'New Event',
    'calendar.event_created.desc': 'When a new calendar event is created',
    'calendar.event_assigned.label': 'Added to Event',
    'calendar.event_assigned.desc': 'When you are added to a calendar event',
    'calendar.deadline_reminder.label': 'Event Reminder',
    'calendar.deadline_reminder.desc': 'Reminder 1 day and day-of for events',
    'tte.sign_requested.label': 'Signature Request',
    'tte.sign_requested.desc': 'When you are asked to sign an e-Sign document',
    'tte.all_signed.label': 'Document Fully Signed',
    'tte.all_signed.desc': 'When all signatories have completed signing',
    'tte.distributed.label': 'Document Distributed',
    'tte.distributed.desc': 'When an e-Sign document is sent to you',
    'change_request.submitted.label': 'New CR Submitted',
    'change_request.submitted.desc': 'When a new Change Request needs review',
    'change_request.approved.label': 'CR Approved',
    'change_request.approved.desc': 'When your Change Request is approved',
    'change_request.rejected.label': 'CR Rejected',
    'change_request.rejected.desc': 'When your Change Request is rejected',
    pwRule0: 'At least 12 characters',
    pwRule1: 'Upper and lowercase letters',
    pwRule2: 'At least 1 number',
    pwRule3: 'At least 1 symbol',
    changePasswordTitle: 'Change Password',
    changePasswordDesc: 'You will be signed out after changing your password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    showPassword: 'Show password',
    passwordsMatch: 'Passwords match',
    changePasswordBtn: 'Change Password',
    passwordChangedToast: 'Password changed. Please sign in again.',
    failedChangePassword: 'Failed to change password',
    languageDesc: 'Choose the display language for the application',
  },
  id: {
    pageTitle: 'Pengaturan',
    pageSubtitle: 'Kelola preferensi dan profil Anda',
    tabProfile: 'Profil',
    tabNotifications: 'Notifikasi',
    tabSecurity: 'Keamanan',
    division: 'Divisi',
    position: 'Jabatan',
    esignTitle: 'Tanda Tangan Elektronik (e-Sign)',
    esignDesc: 'Informasi ini digunakan ketika Anda ditetapkan sebagai penanda tangan dokumen',
    nikLabel: 'NIK',
    nikPlaceholder: 'NIK 16 digit',
    signatureSpecimen: 'Spesimen Tanda Tangan',
    specimenAlt: 'Spesimen tanda tangan',
    specimenSavedMsg: 'Spesimen tersimpan. Unggah berkas baru untuk menggantinya.',
    specimenFormatHint: 'Format PNG/JPG, latar belakang transparan disarankan',
    saving: 'Menyimpan...',
    saveEsignData: 'Simpan Data e-Sign',
    esignSavedToast: 'Data e-Sign berhasil disimpan!',
    failedToSave: 'Gagal menyimpan',
    telegramNotifTitle: 'Notifikasi Telegram',
    telegramNotifDesc: 'Terima notifikasi tugas secara real-time',
    connected: 'Terhubung',
    telegramChatId: 'Telegram Chat ID',
    telegramPlaceholder: 'contoh: 123456789',
    telegramSavedToast: 'Telegram Chat ID berhasil disimpan!',
    howToGetChatId: 'Cara mendapatkan Chat ID Anda:',
    telegramStep1: 'Buka Telegram dan cari @BLPIDWorkloadBot',
    telegramStep2: 'Kirim /start ke bot tersebut',
    telegramStep3: 'Salin ID yang diberikan dan tempel di atas',
    connectedWithChatId: 'Terhubung dengan Chat ID:',
    notifSettingsTitle: 'Pengaturan Notifikasi',
    notifSettingsDesc: 'Pilih notifikasi yang ingin Anda terima',
    colType: 'Jenis',
    colTelegram: 'Telegram',
    colInApp: 'Dalam Aplikasi',
    'task.assigned.label': 'Tugas Ditetapkan',
    'task.assigned.desc': 'Ketika sebuah tugas ditetapkan untuk Anda',
    'task.commented.label': 'Komentar Tugas',
    'task.commented.desc': 'Ketika komentar baru ditambahkan pada tugas Anda',
    'sprint.started.label': 'Sprint Dimulai',
    'sprint.started.desc': 'Ketika sprint baru dimulai',
    'sprint.completed.label': 'Sprint Selesai',
    'sprint.completed.desc': 'Ketika sebuah sprint selesai',
    'calendar.event_created.label': 'Acara Baru',
    'calendar.event_created.desc': 'Ketika acara kalender baru dibuat',
    'calendar.event_assigned.label': 'Ditambahkan ke Acara',
    'calendar.event_assigned.desc': 'Ketika Anda ditambahkan ke acara kalender',
    'calendar.deadline_reminder.label': 'Pengingat Acara',
    'calendar.deadline_reminder.desc': 'Pengingat 1 hari sebelumnya dan pada hari-H acara',
    'tte.sign_requested.label': 'Permintaan Tanda Tangan',
    'tte.sign_requested.desc': 'Ketika Anda diminta menandatangani dokumen e-Sign',
    'tte.all_signed.label': 'Dokumen Selesai Ditandatangani',
    'tte.all_signed.desc': 'Ketika semua penanda tangan telah menyelesaikan tanda tangan',
    'tte.distributed.label': 'Dokumen Didistribusikan',
    'tte.distributed.desc': 'Ketika dokumen e-Sign dikirimkan kepada Anda',
    'change_request.submitted.label': 'CR Baru Diajukan',
    'change_request.submitted.desc': 'Ketika Change Request baru perlu ditinjau',
    'change_request.approved.label': 'CR Disetujui',
    'change_request.approved.desc': 'Ketika Change Request Anda disetujui',
    'change_request.rejected.label': 'CR Ditolak',
    'change_request.rejected.desc': 'Ketika Change Request Anda ditolak',
    pwRule0: 'Minimal 12 karakter',
    pwRule1: 'Huruf besar dan huruf kecil',
    pwRule2: 'Minimal 1 angka',
    pwRule3: 'Minimal 1 simbol',
    changePasswordTitle: 'Ubah Kata Sandi',
    changePasswordDesc: 'Anda akan keluar setelah mengubah kata sandi',
    currentPassword: 'Kata Sandi Saat Ini',
    newPassword: 'Kata Sandi Baru',
    confirmNewPassword: 'Konfirmasi Kata Sandi Baru',
    showPassword: 'Tampilkan kata sandi',
    passwordsMatch: 'Kata sandi cocok',
    changePasswordBtn: 'Ubah Kata Sandi',
    passwordChangedToast: 'Kata sandi berhasil diubah. Silakan masuk kembali.',
    failedChangePassword: 'Gagal mengubah kata sandi',
    languageDesc: 'Pilih bahasa tampilan untuk aplikasi',
  },
};

const TABS = [
  {
    id: 'profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'notif',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'security',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

const AVATAR_GRADIENTS = [
  'from-navy-700 to-navy-700',
  'from-navy-700 to-navy-700',
  'from-success to-teal-600',
  'from-orange-500 to-amber-500',
];
function getGradient(name: string) {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}
function getInitials(name: string) {
  return (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const NOTIF_TYPES = [
  { key: 'task.assigned' },
  { key: 'task.commented' },
  { key: 'sprint.started' },
  { key: 'sprint.completed' },
  { key: 'calendar.event_created' },
  { key: 'calendar.event_assigned' },
  { key: 'calendar.deadline_reminder' },
  { key: 'tte.sign_requested' },
  { key: 'tte.all_signed' },
  { key: 'tte.distributed' },
  { key: 'change_request.submitted' },
  { key: 'change_request.approved' },
  { key: 'change_request.rejected' },
];

function NotifSettings() {
  const t = useT(dict);
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['notif-settings'],
    queryFn: () => notificationService.settings().then((r) => r.data.data),
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

  if (isLoading)
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="bg-white rounded-[6px] border border-border-subtle p-6">
      <h3 className="font-bold text-navy-800 mb-1">{t('notifSettingsTitle')}</h3>
      <p className="text-xs text-text-placeholder mb-5">{t('notifSettingsDesc')}</p>
      <div className="space-y-1">
        <div className="grid grid-cols-3 gap-2 px-3 pb-2">
          <div className="col-span-1 text-xs font-semibold text-text-placeholder uppercase tracking-wider">{t('colType')}</div>
          <div className="text-xs font-semibold text-text-placeholder uppercase tracking-wider text-center">{t('colTelegram')}</div>
          <div className="text-xs font-semibold text-text-placeholder uppercase tracking-wider text-center">{t('colInApp')}</div>
        </div>
        {NOTIF_TYPES.map(({ key }) => (
          <div key={key} className="grid grid-cols-3 gap-2 items-center px-3 py-3 rounded-[6px] hover:bg-surface-2 transition-colors">
            <div>
              <div className="text-sm font-semibold text-text-secondary">{t(`${key}.label`)}</div>
              <div className="text-xs text-text-placeholder">{t(`${key}.desc`)}</div>
            </div>
            {['telegram', 'in_app'].map((channel) => {
              const enabled = isEnabled(key, channel);
              return (
                <div key={channel} className="flex justify-center">
                  <button
                    onClick={() => toggle(key, channel, enabled)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-navy-700' : 'bg-border'}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
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

const PW_RULES = [
  { key: 'pwRule0', test: (v: string) => v.length >= 12 },
  { key: 'pwRule1', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { key: 'pwRule2', test: (v: string) => /[0-9]/.test(v) },
  { key: 'pwRule3', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function SecuritySettings() {
  const t = useT(dict);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const passed = PW_RULES.map((r) => r.test(next));
  const allPassed = passed.every(Boolean);
  const matched = next.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && allPassed && matched;

  const mutation = useMutation({
    mutationFn: () =>
      authService.changePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      }),
    onSuccess: () => {
      toast.success(t('passwordChangedToast'));
      setCurrent('');
      setNext('');
      setConfirm('');
      setErrors({});
      setTimeout(() => {
        Cookies.remove('token');
        Cookies.remove('user_roles');
        sessionStorage.clear();
        window.location.href = '/login';
      }, 1500);
    },
    onError: (e: any) => {
      setErrors(e?.response?.data?.errors || {});
      toast.error(e?.response?.data?.message || t('failedChangePassword'));
    },
  });

  const field = (label: string, value: string, setter: (v: string) => void, key: string) => (
    <div>
      <label className="block text-xs font-semibold text-text-tertiary mb-1.5">{label}</label>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => setter(e.target.value)}
        autoComplete={key === 'current_password' ? 'current-password' : 'new-password'}
        className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700/40 transition-all"
      />
      {errors[key]?.map((m, i) => (
        <p key={i} className="text-xs text-danger mt-1.5">
          {m}
        </p>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-[6px] border border-border-subtle p-6 max-w-lg">
      <h3 className="font-bold text-navy-800 mb-1">{t('changePasswordTitle')}</h3>
      <p className="text-xs text-text-placeholder mb-5">{t('changePasswordDesc')}</p>

      <div className="space-y-4">
        {field(t('currentPassword'), current, setCurrent, 'current_password')}
        {field(t('newPassword'), next, setNext, 'password')}
        {field(t('confirmNewPassword'), confirm, setConfirm, 'password_confirmation')}

        <label className="flex items-center gap-2 text-xs text-text-tertiary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="rounded border-border-button text-navy-700 focus:ring-navy-700/20"
          />
          {t('showPassword')}
        </label>

        {next.length > 0 && (
          <div className="bg-surface-2 rounded-[6px] p-3.5 space-y-1.5">
            {PW_RULES.map((r, i) => (
              <div key={r.key} className={`flex items-center gap-2 text-xs ${passed[i] ? 'text-success-text' : 'text-text-placeholder'}`}>
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${passed[i] ? 'bg-success-soft' : 'bg-border'}`}
                >
                  {passed[i] ? '\u2713' : ''}
                </span>
                {t(r.key)}
              </div>
            ))}
            {confirm.length > 0 && (
              <div className={`flex items-center gap-2 text-xs ${matched ? 'text-success-text' : 'text-danger'}`}>
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${matched ? 'bg-success-soft' : 'bg-danger-soft'}`}
                >
                  {matched ? '\u2713' : '\u00d7'}
                </span>
                {t('passwordsMatch')}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="w-full px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {mutation.isPending ? t('saving') : t('changePasswordBtn')}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { locale, setLocale } = useLocale();
  const t = useT(dict);
  const [telegramId, setTelegramId] = useState(user?.telegram_chat_id || '');
  const [nik, setNik] = useState(user?.nik || '');
  const [specimenFile, setSpecimenFile] = useState<File | null>(null);
  const [specimenBlobUrl, setSpecimenBlobUrl] = useState<string | null>(null);
  const [tab, setTab] = useState('profile');

  const TAB_LABELS: Record<string, string> = {
    profile: t('tabProfile'),
    notif: t('tabNotifications'),
    security: t('tabSecurity'),
  };

  useEffect(() => {
    authService
      .me()
      .then((r) => {
        const u = r.data?.data;
        if (u) {
          updateUser(u);
          setTelegramId(u.telegram_chat_id || '');
          setNik(u.nik || '');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.tte_specimen_url) return;
    api
      .get(`/api/v1/storage/${user.tte_specimen_url}/download`, { responseType: 'blob' })
      .then((res) => {
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
      toast.success(t('esignSavedToast'));
      setSpecimenFile(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToSave')),
  });

  const telegramMutation = useMutation({
    mutationFn: (id: string) => authService.setTelegram(id),
    onSuccess: () => {
      updateUser({ telegram_chat_id: telegramId });
      toast.success(t('telegramSavedToast'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToSave')),
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-navy-700/10 to-navy-700/5 rounded-[6px] flex items-center justify-center border border-navy-700/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-navy-700">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t('pageTitle')}</h1>
          <p className="text-sm text-text-placeholder mt-0.5">{t('pageSubtitle')}</p>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[6px] text-sm font-semibold transition-all text-left ${tab === tabItem.id ? 'bg-navy-700/8 text-navy-700' : 'text-text-tertiary hover:bg-border-subtle hover:text-text-secondary'}`}
              >
                {tabItem.icon}
                {TAB_LABELS[tabItem.id]}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {tab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <SecuritySettings />
              </motion.div>
            )}
            {tab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-[6px] border border-border-subtle p-6">
                  <div className="flex items-center gap-5 pb-5 mb-5 border-b border-border-subtle">
                    <div
                      className={`w-16 h-16 rounded-[6px] bg-gradient-to-br ${getGradient(user?.full_name || '')} text-white flex items-center justify-center text-xl font-bold flex-shrink-0`}
                    >
                      {getInitials(user?.full_name || '')}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-900">{user?.full_name}</h2>
                      <p className="text-sm text-text-placeholder mt-0.5">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {user?.roles?.map((r: string) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-navy-700/8 text-navy-700"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-700" />
                            {getRoleLabel(r)}
                          </span>
                        ))}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${user?.is_active ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user?.is_active ? 'bg-success' : 'bg-danger'}`} />
                          {user?.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: t('division'),
                        value: user?.division || '—',
                        icon: (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4 text-text-placeholder"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        ),
                      },
                      {
                        label: t('position'),
                        value: user?.position || '—',
                        icon: (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4 text-text-placeholder"
                          >
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                          </svg>
                        ),
                      },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface-2 rounded-[6px] p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center flex-shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs text-text-placeholder mb-0.5">{item.label}</div>
                          <div className="text-sm font-semibold text-text-secondary">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[6px] border border-border-subtle p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-navy-800 mb-1">{t('common.language')}</h3>
                      <p className="text-xs text-text-placeholder">{t('languageDesc')}</p>
                    </div>
                    <SegmentedControl
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'id', label: 'Bahasa Indonesia' },
                      ]}
                      value={locale}
                      onChange={setLocale}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[6px] border border-border-subtle p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-navy-800 mb-1">{t('esignTitle')}</h3>
                    <p className="text-xs text-text-placeholder">{t('esignDesc')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">{t('nikLabel')}</label>
                    <input
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 font-mono placeholder:text-border-button focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                      placeholder={t('nikPlaceholder')}
                      maxLength={16}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">{t('signatureSpecimen')}</label>
                    {user?.tte_specimen_url && (
                      <div className="mb-3 p-3 bg-surface-2 rounded-[6px] border border-border-subtle flex items-center gap-3">
                        <img
                          src={specimenBlobUrl ?? undefined}
                          alt={t('specimenAlt')}
                          className="h-12 object-contain rounded"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <div className="text-xs text-text-tertiary">{t('specimenSavedMsg')}</div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => setSpecimenFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-text-tertiary file:mr-3 file:py-2 file:px-4 file:rounded-[6px] file:border-0 file:text-sm file:font-semibold file:bg-navy-700/8 file:text-navy-700 hover:file:bg-navy-700/15 transition-all"
                    />
                    <p className="text-xs text-text-placeholder mt-1.5">{t('specimenFormatHint')}</p>
                  </div>

                  <button
                    onClick={() => tteMutation.mutate()}
                    disabled={tteMutation.isPending || (!nik && !specimenFile)}
                    className="px-5 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50 transition-all"
                  >
                    {tteMutation.isPending ? t('saving') : t('saveEsignData')}
                  </button>
                </div>

                <NotifSettings />
              </motion.div>
            )}

            {tab === 'notif' && (
              <motion.div
                key="notif"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-[6px] border border-border-subtle p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-[6px] bg-info-soft flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-info">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.47c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.75z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-800">{t('telegramNotifTitle')}</h3>
                      <p className="text-xs text-text-placeholder">{t('telegramNotifDesc')}</p>
                    </div>
                    {user?.telegram_chat_id && (
                      <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-soft text-success-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        {t('connected')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-1.5">{t('telegramChatId')}</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder pointer-events-none"
                          >
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                          <input
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-[6px] border border-border text-sm text-text-secondary placeholder:text-border-button focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all font-mono"
                            placeholder={t('telegramPlaceholder')}
                          />
                        </div>
                        <button
                          onClick={() => telegramMutation.mutate(telegramId)}
                          disabled={telegramMutation.isPending || !telegramId}
                          className="px-5 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50 transition-all whitespace-nowrap"
                        >
                          {telegramMutation.isPending ? t('saving') : t('common.save')}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-surface-2 rounded-[6px] border border-border-subtle">
                      <p className="text-xs font-semibold text-text-secondary mb-2">{t('howToGetChatId')}</p>
                      <ol className="text-xs text-text-tertiary space-y-1.5">
                        {[t('telegramStep1'), t('telegramStep2'), t('telegramStep3')].map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-navy-700/10 text-navy-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {user?.telegram_chat_id && (
                      <div className="flex items-center gap-3 p-3.5 bg-success-soft border border-success-soft rounded-[6px]">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 text-success flex-shrink-0"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <div className="text-xs text-success-text">
                          Connected with Chat ID: <span className="font-mono font-bold">{user.telegram_chat_id}</span>
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
