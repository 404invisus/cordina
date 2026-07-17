'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarRange, Plus, X, Trash2, Eye, Clock,
  Users, MapPin, Lock, Globe, ChevronLeft, ChevronRight, Check,
  Download,
  Loader2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminCalendarService, userGroupService, adminReportExportService, adminUserService } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, addMonths, subMonths,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  internal: { label: 'Internal',    color: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500' },
  external: { label: 'External',   color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500' },
  cuti:     { label: 'Cuti',   color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  lainnya:  { label: 'Lainnya',    color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
};

function getInitials(name: string) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatEventDate(e: any) {
  if (!e.start_date) return '';
  try {
    const d = format(new Date(e.start_date), 'EEEE, d MMM', { locale: idLocale });
    const t = e.start_time ? ' · ' + e.start_time.slice(0, 5) : '';
    return d + t;
  } catch { return ''; }
}

function GroupPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { data: groups = [] } = useQuery({
    queryKey: ['user-groups-calendar'],
    queryFn: () => userGroupService.list().then(r => r.data.data || []),
    staleTime: 60000,
  });
  if (groups.length === 0) return null;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  return (
    <div className="mt-3">
      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
        Group Peserta
        {selected.length > 0 && (
          <span className="ml-2 bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{selected.length} dipilih</span>
        )}
      </label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(id => {
            const g = groups.find((g: any) => g.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                {g?.name || id}
                <button onClick={() => onChange(selected.filter(x => x !== id))} className="hover:text-red-500">×</button>
              </span>
            );
          })}
        </div>
      )}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-32 overflow-y-auto divide-y divide-slate-50">
          {groups.map((g: any) => {
            const checked = selected.includes(g.id);
            return (
              <div key={g.id} onClick={() => toggle(g.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-violet-600 border-violet-600 text-white text-[10px] font-bold' : 'border-slate-300'}`}>
                  {checked ? '✓' : ''}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{g.name}</div>
                  <div className="text-xs text-slate-400">{g.member_count || 0} anggota</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ParticipantPicker({ users, selected, onChange }: {
  users: any[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = (users || []).filter((u: any) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
        Peserta Kegiatan
        {selected.length > 0 && (
          <span className="ml-2 bg-[#284074] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {selected.length} dipilih
          </span>
        )}
      </label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(id => {
            const u = users.find((u: any) => u.id === id);
            if (!u) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-[#284074]/10 text-[#284074] rounded-lg text-xs font-semibold">
                {u.full_name.split(' ')[0]}
                <button onClick={() => toggle(id)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
            placeholder="Cari nama..." />
        </div>
        <div className="max-h-36 overflow-y-auto">
          {filtered.map((u: any) => {
            const isSelected = selected.includes(u.id);
            return (
              <button key={u.id} onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${isSelected ? 'bg-[#284074]/5' : ''}`}>
                <div className="w-6 h-6 rounded-lg bg-[#284074] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {getInitials(u.full_name)}
                </div>
                <span className="text-sm text-slate-700 flex-1 truncate">{u.full_name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#284074] flex-shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-4 text-xs text-slate-400">Tidak ditemukan</div>}
        </div>
      </div>
    </div>
  );
}
function EventFormModal({ open, onClose, editEvent, users }: any) {
  const qc = useQueryClient();
  const isEdit = !!editEvent;
  const [form, setForm] = useState({
    title:       editEvent?.title       || '',
    description: editEvent?.description || '',
    type:        editEvent?.type        || 'internal',
    start_date:  editEvent?.start_date  ? String(editEvent.start_date).slice(0, 10) : '',
    end_date:    editEvent?.end_date    ? String(editEvent.end_date).slice(0, 10) : '',
    start_time:  editEvent?.start_time  ? String(editEvent.start_time).slice(0, 5) : '',
    end_time:    editEvent?.end_time    ? String(editEvent.end_time).slice(0, 5) : '',
    location:    editEvent?.location    || '',
    is_private:  editEvent?.visibility === 'private' || false,
    all_day:     editEvent?.all_day     ?? false,
  });
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [participantGroupIds, setParticipantGroupIds] = useState<string[]>([]);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        ...(participantIds.length > 0 ? { participant_ids: participantIds } : {}),
        ...(participantGroupIds.length > 0 ? { group_ids: participantGroupIds } : {}),
      };
      const res = isEdit
        ? await adminCalendarService.update(editEvent.id, payload)
        : await adminCalendarService.create(payload);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      toast.success(isEdit ? 'Event diperbarui!' : 'Event dibuat!');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const handleSubmit = () => {
    if (!form.title || !form.start_date) { toast.error('Judul dan tanggal mulai wajib diisi'); return; }
    const payload: any = {
      title: form.title, description: form.description, type: form.type,
      start_date: form.start_date, end_date: form.end_date || form.start_date,
      location: form.location, visibility: form.is_private ? 'private' : 'public',
      all_day: form.all_day,
    };
    if (!form.all_day) {
      if (form.start_time) payload.start_time = form.start_time;
      if (form.end_time)   payload.end_time   = form.end_time;
    }
    mutation.mutate(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="font-bold text-slate-900">{isEdit ? 'Edit Event' : 'Tambah Event'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Judul *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
              placeholder="Judul event" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipe</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]">
                {Object.entries(EVENT_TYPE_CONFIG).filter(([k]) => k !== 'other').map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <div className={`w-9 h-5 rounded-full transition-colors ${form.all_day ? 'bg-[#284074]' : 'bg-slate-200'}`}
                  onClick={() => set('all_day', !form.all_day)}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${form.all_day ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-slate-600 font-medium">Seharian</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tanggal Mulai *</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tanggal Selesai</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
            </div>
          </div>
          {!form.all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jam Mulai</label>
                <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jam Selesai</label>
                <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Lokasi</label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]"
              placeholder="Online / Ruang Meeting A" />
          </div>
          <ParticipantPicker users={users || []} selected={participantIds} onChange={setParticipantIds} />
          <GroupPicker selected={participantGroupIds} onChange={setParticipantGroupIds} />
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Deskripsi</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] resize-none"
              placeholder="Keterangan event..." />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={`w-9 h-5 rounded-full transition-colors ${form.is_private ? 'bg-[#284074]' : 'bg-slate-200'}`}
              onClick={() => set('is_private', !form.is_private)}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${form.is_private ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-slate-600 font-medium">Event Privat</span>
            {form.is_private ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Globe className="w-3.5 h-3.5 text-slate-400" />}
          </label>
        </div>
        <div className="px-6 pb-5 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit} disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat Event')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
function EventDrawer({ event, onClose, onDelete }: any) {
  const conf = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.lainnya;
  const { data: participants } = useQuery({
    queryKey: ['admin-calendar-participants', event.id],
    queryFn: () => adminCalendarService.participants(event.id).then(r => r.data.data),
  });
  const dateStr = event.start_date ? (() => {
    try { return format(new Date(event.start_date), 'EEEE, d MMMM yyyy', { locale: idLocale }); }
    catch { return String(event.start_date); }
  })() : '—';
  const timeStr = event.all_day ? 'Seharian'
    : [event.start_time?.slice(0, 5), event.end_time?.slice(0, 5)].filter(Boolean).join(' — ') || '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${conf.bg} ${conf.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} /> {conf.label}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div><div>{dateStr}</div><div className="text-slate-400">{timeStr}</div></div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />{event.location}
              </div>
            )}
            {event.creator_name && (
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Dibuat oleh <span className="font-semibold">{event.creator_name}</span></span>
              </div>
            )}
            {(event.visibility === 'private' || event.is_private) && (
              <div className="flex items-center gap-2.5 text-sm text-amber-600">
                <Lock className="w-4 h-4 flex-shrink-0" /> Event Privat
              </div>
            )}
          </div>
          {event.description && (
            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Peserta {participants ? `(${participants.length})` : ''}
            </div>
            {participants && participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map((p: any) => (
                  <div key={p.id || p.user_id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${p.is_group ? 'bg-violet-500' : 'bg-[#284074]'}`}>
                      {p.is_group ? '👥' : getInitials(p.full_name || p.name || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{p.group_name || p.full_name || p.name}</div>
                      {p.is_group && <div className="text-xs text-slate-400">Group</div>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      p.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                      p.status === 'declined' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                    }`}>{p.status || 'invited'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Belum ada peserta</p>
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreate, setShowCreate]     = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [showExportBar, setShowExportBar] = useState(false);
  const [exportFrom, setExportFrom]     = useState('');
  const [exportTo, setExportTo]         = useState('');
  const handleExport = async () => {
    const f = exportFrom || from;
    const t = exportTo   || to;
    setExporting(true);
    try {
      const res = await adminReportExportService.calendar(f, t);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'laporan_kalender.pdf'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Laporan berhasil diunduh');
    } catch { toast.error('Gagal mengunduh laporan'); }
    finally { setExporting(false); }
  };
  const [viewEvent, setViewEvent]       = useState<any>(null);
  const [deleteEvent, setDeleteEvent]   = useState<any>(null);

  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const to   = format(endOfMonth(currentMonth),   'yyyy-MM-dd');

  const { data: events = [] } = useQuery({
    queryKey: ['admin-calendar', from, to],
    queryFn: () => adminCalendarService.list({ from, to }).then(r => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-simple'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCalendarService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      toast.success('Event dihapus');
      setDeleteEvent(null);
      setViewEvent(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = getDay(monthStart);

  const getEventsForDay = (day: Date) =>
    (events as any[]).filter(e => {
      if (!e.start_date) return false;
      try { return isSameDay(new Date(e.start_date), day); } catch { return false; }
    });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-500/10 to-sky-500/5 rounded-2xl flex items-center justify-center border border-sky-500/10">
            <CalendarRange className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Kalender</h1>
            <p className="text-sm text-slate-400 mt-0.5">{(events as any[]).length} event bulan ini</p>
          </div>
        </div>
        <button onClick={() => setShowExportBar(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" /> Ekspor PDF
        </button>
                <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Tambah Event
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {Object.entries(EVENT_TYPE_CONFIG).filter(([k]) => k !== 'other').map(([type, conf]) => (
          <div key={type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${conf.bg} ${conf.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />{conf.label}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h3 className="font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy', { locale: idLocale })}</h3>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[90px] border-b border-r border-slate-50 bg-slate-50/30" />
          ))}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday   = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className="min-h-[90px] border-b border-r border-slate-50 p-1.5 hover:bg-slate-50/50 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${isToday ? 'bg-[#284074] text-white' : 'text-slate-500'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e: any) => {
                    const conf = EVENT_TYPE_CONFIG[e.type] || EVENT_TYPE_CONFIG.lainnya;
                    return (
                      <button key={e.id} onClick={() => setViewEvent(e)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${conf.bg} ${conf.color} hover:opacity-80 transition-opacity`}>
                        {e.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && <div className="text-[10px] text-slate-400 px-1.5">+{dayEvents.length - 3} lagi</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(events as any[]).length > 0 && (
        <div className="mt-5 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Semua Event Bulan Ini</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {(events as any[]).map((e: any) => {
              const conf = EVENT_TYPE_CONFIG[e.type] || EVENT_TYPE_CONFIG.lainnya;
              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors group">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conf.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 truncate">{e.title}</span>
                      {(e.visibility === 'private' || e.is_private) && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {formatEventDate(e)}{e.creator_name ? ` · ${e.creator_name}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewEvent(e)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => setDeleteEvent(e)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
        <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500 font-medium">Rentang laporan:</span>
          <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
          <span className="text-slate-400 text-sm">s/d</span>
          <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
          <p className="text-xs text-slate-400">Kosongkan untuk gunakan bulan ini</p>
          <button onClick={handleExport} disabled={exporting}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] disabled:opacity-40">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Unduh PDF
          </button>
        </div>
      )}
      {showCreate && <EventFormModal open={true} onClose={() => setShowCreate(false)} users={users} />}
        {viewEvent && (
          <EventDrawer event={viewEvent} onClose={() => setViewEvent(null)}
            onDelete={() => { setDeleteEvent(viewEvent); setViewEvent(null); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteEvent(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Hapus Event?</h3>
              <p className="text-sm text-slate-500 mb-5">
                <span className="font-semibold text-slate-700">{deleteEvent.title}</span> akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteEvent(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
                <button onClick={() => deleteMutation.mutate(deleteEvent.id)} disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
