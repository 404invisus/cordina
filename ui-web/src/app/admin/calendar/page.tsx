'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarRange,
  Plus,
  X,
  Trash2,
  Eye,
  Clock,
  Pencil,
  Users,
  MapPin,
  Lock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminCalendarService, userGroupService, adminReportExportService, adminUserService } from '@/lib/api';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: {
    participantGroups: 'Participant Groups',
    selectedCount: '{count} selected',
    membersCount: '{count} members',
    eventParticipants: 'Event Participants',
    searchByName: 'Search by name...',
    noResultsFound: 'No results found',
    editEvent: 'Edit Event',
    addEvent: 'Add Event',
    titleRequired: 'Title *',
    eventTitlePlaceholder: 'Event title',
    type: 'Type',
    allDay: 'All day',
    startDateRequired: 'Start Date *',
    endDate: 'End Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    location: 'Location',
    locationPlaceholder: 'Online / Meeting Room A',
    eventDescriptionPlaceholder: 'Event description...',
    privateEvent: 'Private Event',
    saving: 'Saving...',
    createEvent: 'Create Event',
    eventUpdated: 'Event updated!',
    eventCreated: 'Event created!',
    failed: 'Failed',
    titleAndStartDateRequired: 'Title and start date are required',
    createdBy: 'Created by',
    participants: 'Participants',
    group: 'Group',
    invited: 'invited',
    noParticipantsYet: 'No participants yet',
    reportDownloaded: 'Report downloaded successfully',
    failedDownloadReport: 'Failed to download report',
    eventDeleted: 'Event deleted',
    manageCalendar: 'Manage Calendar',
    eventsThisMonth: '{count} events this month',
    exportPdf: 'Export PDF',
    moreCount: '+{count} more',
    allEventsThisMonth: 'All Events This Month',
    reportRange: 'Report range:',
    to: 'to',
    leaveEmptyCurrentMonth: 'Leave empty to use current month',
    downloadPdf: 'Download PDF',
    deleteEventTitle: 'Delete Event?',
    willBeDeleted: 'will be permanently deleted.',
    deleting: 'Deleting...',
    daySun: 'Sun',
    dayMon: 'Mon',
    dayTue: 'Tue',
    dayWed: 'Wed',
    dayThu: 'Thu',
    dayFri: 'Fri',
    daySat: 'Sat',
    eventTypeInternal: 'Internal',
    eventTypeExternal: 'External',
    eventTypeLeave: 'Leave',
    eventTypeOther: 'Other',
  },
  id: {
    participantGroups: 'Grup Peserta',
    selectedCount: '{count} dipilih',
    membersCount: '{count} anggota',
    eventParticipants: 'Peserta Acara',
    searchByName: 'Cari berdasarkan nama...',
    noResultsFound: 'Tidak ada hasil',
    editEvent: 'Ubah Acara',
    addEvent: 'Tambah Acara',
    titleRequired: 'Judul *',
    eventTitlePlaceholder: 'Judul acara',
    type: 'Jenis',
    allDay: 'Sepanjang hari',
    startDateRequired: 'Tanggal Mulai *',
    endDate: 'Tanggal Selesai',
    startTime: 'Waktu Mulai',
    endTime: 'Waktu Selesai',
    location: 'Lokasi',
    locationPlaceholder: 'Daring / Ruang Rapat A',
    eventDescriptionPlaceholder: 'Deskripsi acara...',
    privateEvent: 'Acara Privat',
    saving: 'Menyimpan...',
    createEvent: 'Buat Acara',
    eventUpdated: 'Acara berhasil diperbarui!',
    eventCreated: 'Acara berhasil dibuat!',
    failed: 'Gagal',
    titleAndStartDateRequired: 'Judul dan tanggal mulai wajib diisi',
    createdBy: 'Dibuat oleh',
    participants: 'Peserta',
    group: 'Grup',
    invited: 'diundang',
    noParticipantsYet: 'Belum ada peserta',
    reportDownloaded: 'Laporan berhasil diunduh',
    failedDownloadReport: 'Gagal mengunduh laporan',
    eventDeleted: 'Acara berhasil dihapus',
    manageCalendar: 'Kelola Kalender',
    eventsThisMonth: '{count} acara bulan ini',
    exportPdf: 'Ekspor PDF',
    moreCount: '+{count} lainnya',
    allEventsThisMonth: 'Semua Acara Bulan Ini',
    reportRange: 'Rentang laporan:',
    to: 'sampai',
    leaveEmptyCurrentMonth: 'Kosongkan untuk menggunakan bulan berjalan',
    downloadPdf: 'Unduh PDF',
    deleteEventTitle: 'Hapus Acara?',
    willBeDeleted: 'akan dihapus secara permanen.',
    deleting: 'Menghapus...',
    daySun: 'Min',
    dayMon: 'Sen',
    dayTue: 'Sel',
    dayWed: 'Rab',
    dayThu: 'Kam',
    dayFri: 'Jum',
    daySat: 'Sab',
    eventTypeInternal: 'Internal',
    eventTypeExternal: 'Eksternal',
    eventTypeLeave: 'Cuti',
    eventTypeOther: 'Lainnya',
  },
};

const EVENT_TYPE_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  internal: { color: 'text-info-text', bg: 'bg-info-soft', dot: 'bg-info' },
  external: { color: 'text-danger-text', bg: 'bg-danger-soft', dot: 'bg-danger' },
  cuti: { color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },
  lainnya: { color: 'text-text-secondary', bg: 'bg-border-subtle', dot: 'bg-text-placeholder' },
};

const EVENT_TYPE_LABEL_KEY: Record<string, string> = {
  internal: 'eventTypeInternal',
  external: 'eventTypeExternal',
  cuti: 'eventTypeLeave',
  lainnya: 'eventTypeOther',
};

function eventTypeLabel(type: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  return t(EVENT_TYPE_LABEL_KEY[type] || EVENT_TYPE_LABEL_KEY.lainnya);
}

function getInitials(name: string) {
  return (name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatEventDate(e: any, locale: 'en' | 'id' = 'en') {
  if (!e.start_date) return '';
  try {
    const d = format(new Date(e.start_date), 'EEEE, d MMM', { locale: locale === 'id' ? idLocale : enUS });
    const timeSuffix = e.start_time ? ' · ' + e.start_time.slice(0, 5) : '';
    return d + timeSuffix;
  } catch {
    return '';
  }
}

function GroupPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const t = useT(dict);
  const { data: groups = [] } = useQuery({
    queryKey: ['user-groups-calendar'],
    queryFn: () => userGroupService.list().then((r) => r.data.data || []),
    staleTime: 60000,
  });
  if (groups.length === 0) return null;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="mt-3">
      <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">
        {t('participantGroups')}
        {selected.length > 0 && (
          <span className="ml-2 bg-navy-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {t('selectedCount', { count: selected.length })}
          </span>
        )}
      </label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((id) => {
            const g = groups.find((g: any) => g.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 text-xs bg-navy-700/10 text-navy-900 px-2 py-0.5 rounded-full font-medium"
              >
                {g?.name || id}
                <button onClick={() => onChange(selected.filter((x) => x !== id))} className="hover:text-danger">
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="border border-border rounded-[6px] overflow-hidden">
        <div className="max-h-32 overflow-y-auto divide-y divide-surface-2">
          {groups.map((g: any) => {
            const checked = selected.includes(g.id);
            return (
              <div
                key={g.id}
                onClick={() => toggle(g.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-navy-700/8' : 'hover:bg-surface-2'}`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-navy-700 border-navy-700 text-white text-[10px] font-bold' : 'border-border-button'}`}
                >
                  {checked ? '✓' : ''}
                </div>
                <div>
                  <div className="text-sm font-medium text-navy-800">{g.name}</div>
                  <div className="text-xs text-text-placeholder">{t('membersCount', { count: g.member_count || 0 })}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ParticipantPicker({ users, selected, onChange }: { users: any[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const t = useT(dict);
  const [search, setSearch] = useState('');
  const filtered = (users || []).filter((u: any) => u.full_name.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div>
      <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">
        {t('eventParticipants')}
        {selected.length > 0 && (
          <span className="ml-2 bg-navy-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {t('selectedCount', { count: selected.length })}
          </span>
        )}
      </label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((id) => {
            const u = users.find((u: any) => u.id === id);
            if (!u) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-navy-700/10 text-navy-700 rounded-lg text-xs font-semibold"
              >
                {u.full_name.split(' ')[0]}
                <button onClick={() => toggle(id)} className="hover:text-danger transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="border border-border rounded-[6px] overflow-hidden">
        <div className="px-3 py-2 border-b border-border-subtle">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm text-text-secondary placeholder:text-border-button focus:outline-none"
            placeholder={t('searchByName')}
          />
        </div>
        <div className="max-h-36 overflow-y-auto">
          {filtered.map((u: any) => {
            const isSelected = selected.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-2 transition-colors ${isSelected ? 'bg-navy-700/5' : ''}`}
              >
                <div className="w-6 h-6 rounded-lg bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {getInitials(u.full_name)}
                </div>
                <span className="text-sm text-text-secondary flex-1 truncate">{u.full_name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-navy-700 flex-shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-4 text-xs text-text-placeholder">{t('noResultsFound')}</div>}
        </div>
      </div>
    </div>
  );
}
function EventFormModal({ open, onClose, editEvent, users }: any) {
  const qc = useQueryClient();
  const t = useT(dict);
  const isEdit = !!editEvent;
  const [form, setForm] = useState({
    title: editEvent?.title || '',
    description: editEvent?.description || '',
    type: editEvent?.type || 'internal',
    start_date: editEvent?.start_date ? String(editEvent.start_date).slice(0, 10) : '',
    end_date: editEvent?.end_date ? String(editEvent.end_date).slice(0, 10) : '',
    start_time: editEvent?.start_time ? String(editEvent.start_time).slice(0, 5) : '',
    end_time: editEvent?.end_time ? String(editEvent.end_time).slice(0, 5) : '',
    location: editEvent?.location || '',
    is_private: editEvent?.visibility === 'private' || false,
    all_day: editEvent?.all_day ?? false,
  });
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [participantGroupIds, setParticipantGroupIds] = useState<string[]>([]);
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        ...(participantIds.length > 0 ? { participant_ids: participantIds } : {}),
        ...(participantGroupIds.length > 0 ? { group_ids: participantGroupIds } : {}),
      };
      const res = isEdit ? await adminCalendarService.update(editEvent.id, payload) : await adminCalendarService.create(payload);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      toast.success(isEdit ? t('eventUpdated') : t('eventCreated'));
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  const handleSubmit = () => {
    if (!form.title || !form.start_date) {
      toast.error(t('titleAndStartDateRequired'));
      return;
    }
    const payload: any = {
      title: form.title,
      description: form.description,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      location: form.location,
      visibility: form.is_private ? 'private' : 'public',
      all_day: form.all_day,
    };
    if (!form.all_day) {
      if (form.start_time) payload.start_time = form.start_time;
      if (form.end_time) payload.end_time = form.end_time;
    }
    mutation.mutate(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-[6px] w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle flex-shrink-0">
          <h2 className="font-bold text-navy-900">{isEdit ? t('editEvent') : t('addEvent')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
            <X className="w-4 h-4 text-text-placeholder" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('titleRequired')}</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
              placeholder={t('eventTitlePlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('type')}</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
              >
                {Object.entries(EVENT_TYPE_CONFIG)
                  .filter(([k]) => k !== 'other')
                  .map(([v]) => (
                    <option key={v} value={v}>
                      {eventTypeLabel(v, t)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <div
                  className={`w-9 h-5 rounded-full transition-colors ${form.all_day ? 'bg-navy-700' : 'bg-border'}`}
                  onClick={() => set('all_day', !form.all_day)}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${form.all_day ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </div>
                <span className="text-sm text-text-secondary font-medium">{t('allDay')}</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('startDateRequired')}</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('endDate')}</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
              />
            </div>
          </div>
          {!form.all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('startTime')}</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => set('start_time', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('endTime')}</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => set('end_time', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('location')}</label>
            <input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
              placeholder={t('locationPlaceholder')}
            />
          </div>
          <ParticipantPicker users={users || []} selected={participantIds} onChange={setParticipantIds} />
          <GroupPicker selected={participantGroupIds} onChange={setParticipantGroupIds} />
          <div>
            <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('common.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 resize-none"
              placeholder={t('eventDescriptionPlaceholder')}
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              className={`w-9 h-5 rounded-full transition-colors ${form.is_private ? 'bg-navy-700' : 'bg-border'}`}
              onClick={() => set('is_private', !form.is_private)}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${form.is_private ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
            <span className="text-sm text-text-secondary font-medium">{t('privateEvent')}</span>
            {form.is_private ? (
              <Lock className="w-3.5 h-3.5 text-text-placeholder" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-text-placeholder" />
            )}
          </label>
        </div>
        <div className="px-6 pb-5 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50"
          >
            {mutation.isPending ? t('saving') : isEdit ? t('common.save') : t('createEvent')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
function EventDrawer({ event, onClose, onDelete, onEdit }: any) {
  const t = useT(dict);
  const { locale } = useLocale();
  const conf = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.lainnya;
  const { data: participants } = useQuery({
    queryKey: ['admin-calendar-participants', event.id],
    queryFn: () => adminCalendarService.participants(event.id).then((r) => r.data.data),
  });
  const dateStr = event.start_date
    ? (() => {
        try {
          return format(new Date(event.start_date), 'EEEE, d MMMM yyyy', { locale: locale === 'id' ? idLocale : enUS });
        } catch {
          return String(event.start_date);
        }
      })()
    : '-';
  const timeStr = event.all_day
    ? t('allDay')
    : [event.start_time?.slice(0, 5), event.end_time?.slice(0, 5)].filter(Boolean).join(' — ') || '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-sm bg-white flex flex-col h-full"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${conf.bg} ${conf.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} /> {eventTypeLabel(event.type, t)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors text-text-placeholder hover:text-navy-700"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-danger-soft transition-colors text-danger hover:text-danger-text">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
              <X className="w-4 h-4 text-text-placeholder" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h2 className="text-xl font-bold text-navy-900">{event.title}</h2>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm text-text-secondary">
              <Clock className="w-4 h-4 text-text-placeholder mt-0.5 flex-shrink-0" />
              <div>
                <div>{dateStr}</div>
                <div className="text-text-placeholder">{timeStr}</div>
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-text-placeholder flex-shrink-0" />
                {event.location}
              </div>
            )}
            {event.creator_name && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Users className="w-4 h-4 text-text-placeholder flex-shrink-0" />
                <span>
                  {t('createdBy')} <span className="font-semibold">{event.creator_name}</span>
                </span>
              </div>
            )}
            {(event.visibility === 'private' || event.is_private) && (
              <div className="flex items-center gap-2.5 text-sm text-amber-600">
                <Lock className="w-4 h-4 flex-shrink-0" /> {t('privateEvent')}
              </div>
            )}
          </div>
          {event.description && (
            <div className="bg-surface-2 rounded-[6px] p-3.5">
              <p className="text-sm text-text-secondary leading-relaxed">{event.description}</p>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-text-placeholder uppercase tracking-wider mb-2.5">
              {t('participants')} {participants ? `(${participants.length})` : ''}
            </div>
            {participants && participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map((p: any) => (
                  <div key={p.id || p.user_id} className="flex items-center gap-3 px-3 py-2 bg-surface-2 rounded-lg">
                    <div
                      className={`w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${p.is_group ? 'bg-navy-700' : 'bg-navy-700'}`}
                    >
                      {p.is_group ? '👥' : getInitials(p.full_name || p.name || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-navy-800 truncate">{p.group_name || p.full_name || p.name}</div>
                      {p.is_group && <div className="text-xs text-text-placeholder">{t('group')}</div>}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        p.status === 'accepted'
                          ? 'bg-success-soft text-success-text'
                          : p.status === 'declined'
                            ? 'bg-danger-soft text-danger-text'
                            : 'bg-border-subtle text-text-tertiary'
                      }`}
                    >
                      {p.status || t('invited')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-text-placeholder">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{t('noParticipantsYet')}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
export default function AdminCalendarPage() {
  const qc = useQueryClient();
  const t = useT(dict);
  const { locale } = useLocale();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportBar, setShowExportBar] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const handleExport = async () => {
    const f = exportFrom || from;
    const toVal = exportTo || to;
    setExporting(true);
    try {
      const res = await adminReportExportService.calendar(f, toVal);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calendar_report.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('reportDownloaded'));
    } catch {
      toast.error(t('failedDownloadReport'));
    } finally {
      setExporting(false);
    }
  };
  const [viewEvent, setViewEvent] = useState<any>(null);
  const [deleteEvent, setDeleteEvent] = useState<any>(null);
  const [editEvent, setEditEvent] = useState<any>(null);

  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: events = [] } = useQuery({
    queryKey: ['admin-calendar', from, to],
    queryFn: () => adminCalendarService.list({ from, to }).then((r) => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-simple'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCalendarService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      toast.success(t('eventDeleted'));
      setDeleteEvent(null);
      setViewEvent(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const getEventsForDay = (day: Date) =>
    (events as any[]).filter((e) => {
      if (!e.start_date) return false;
      try {
        return isSameDay(new Date(e.start_date), day);
      } catch {
        return false;
      }
    });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-500/10 to-sky-500/5 rounded-[6px] flex items-center justify-center border border-sky-500/10">
            <CalendarRange className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{t('manageCalendar')}</h1>
            <p className="text-sm text-text-placeholder mt-0.5">{t('eventsThisMonth', { count: (events as any[]).length })}</p>
          </div>
        </div>
        <button
          onClick={() => setShowExportBar((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
        >
          <Download className="w-4 h-4" /> {t('exportPdf')}
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> {t('addEvent')}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {Object.entries(EVENT_TYPE_CONFIG)
          .filter(([k]) => k !== 'other')
          .map(([type, conf]) => (
            <div key={type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${conf.bg} ${conf.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
              {eventTypeLabel(type, t)}
            </div>
          ))}
      </div>

      <div className="bg-white rounded-[6px] border border-border-subtle overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-[6px] hover:bg-border-subtle transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <h3 className="font-bold text-navy-800">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-[6px] hover:bg-border-subtle transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-border-subtle">
          {[t('daySun'), t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat')].map((d, i) => (
            <div key={i} className="py-2.5 text-center text-xs font-semibold text-text-placeholder">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[90px] border-b border-r border-surface-2 bg-surface-2/30" />
          ))}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className="min-h-[90px] border-b border-r border-surface-2 p-1.5 hover:bg-surface-2/50 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${isToday ? 'bg-navy-700 text-white' : 'text-text-tertiary'}`}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e: any) => {
                    const conf = EVENT_TYPE_CONFIG[e.type] || EVENT_TYPE_CONFIG.lainnya;
                    return (
                      <button
                        key={e.id}
                        onClick={() => setViewEvent(e)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${conf.bg} ${conf.color} hover:opacity-80 transition-opacity`}
                      >
                        {e.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-text-placeholder px-1.5">{t('moreCount', { count: dayEvents.length - 3 })}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(events as any[]).length > 0 && (
        <div className="mt-5 bg-white rounded-[6px] border border-border-subtle overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-subtle">
            <h3 className="font-bold text-navy-800 text-sm">{t('allEventsThisMonth')}</h3>
          </div>
          <div className="divide-y divide-surface-2">
            {(events as any[]).map((e: any) => {
              const conf = EVENT_TYPE_CONFIG[e.type] || EVENT_TYPE_CONFIG.lainnya;
              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-2/50 transition-colors group">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conf.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy-800 truncate">{e.title}</span>
                      {(e.visibility === 'private' || e.is_private) && <Lock className="w-3 h-3 text-text-placeholder flex-shrink-0" />}
                    </div>
                    <div className="text-xs text-text-placeholder mt-0.5">
                      {formatEventDate(e, locale)}
                      {e.creator_name ? ` · ${e.creator_name}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewEvent(e)} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
                      <Eye className="w-3.5 h-3.5 text-text-placeholder" />
                    </button>
                    <button onClick={() => setDeleteEvent(e)} className="p-1.5 rounded-lg hover:bg-danger-soft transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-danger" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showExportBar && (
          <div className="mb-4 p-4 bg-surface-2 border border-border-subtle rounded-[6px] flex items-center gap-3 flex-wrap">
            <span className="text-sm text-text-tertiary font-medium">{t('reportRange')}</span>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-navy-700/20"
            />
            <span className="text-text-placeholder text-sm">{t('to')}</span>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-navy-700/20"
            />
            <p className="text-xs text-text-placeholder">{t('leaveEmptyCurrentMonth')}</p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-40"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t('downloadPdf')}
            </button>
          </div>
        )}
        {showCreate && <EventFormModal open={true} onClose={() => setShowCreate(false)} users={users} />}
        {editEvent && <EventFormModal open={true} editEvent={editEvent} onClose={() => setEditEvent(null)} users={users} />}
        {viewEvent && (
          <EventDrawer
            event={viewEvent}
            onClose={() => setViewEvent(null)}
            onEdit={() => {
              setEditEvent(viewEvent);
              setViewEvent(null);
            }}
            onDelete={() => {
              setDeleteEvent(viewEvent);
              setViewEvent(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteEvent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-[6px] w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <h3 className="font-bold text-navy-900 mb-1">{t('deleteEventTitle')}</h3>
              <p className="text-sm text-text-tertiary mb-5">
                <span className="font-semibold text-text-secondary">{deleteEvent.title}</span> {t('willBeDeleted')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteEvent(null)}
                  className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteEvent.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[6px] bg-danger text-white text-sm font-semibold hover:bg-danger-text disabled:opacity-50"
                >
                  {deleteMutation.isPending ? t('deleting') : t('common.delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
