'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { calendarService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; bar: string }> = {
  internal: { label: 'Internal',  bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500',   bar: 'bg-blue-500' },
  external: { label: 'External',  bg: 'bg-violet-50',  text: 'text-violet-700', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  cuti:     { label: 'Cuti',      bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500',  bar: 'bg-amber-400' },
  lainnya:  { label: 'Lainnya',   bg: 'bg-slate-50',   text: 'text-slate-600',  dot: 'bg-slate-400',  bar: 'bg-slate-400' },
};

const DAYS_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const DAYS_FULL  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number) { return String(n).padStart(2, '0'); }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function startOfWeek(d: Date) { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return r; }

function EventChip({ event, onClick }: { event: any; onClick: () => void }) {
  const tc = TYPE_CONFIG[event.type] || TYPE_CONFIG.lainnya;
  return (
    <motion.div whileHover={{ scale: 1.02 }} onClick={e => { e.stopPropagation(); onClick(); }}
      className={`text-xs px-2 py-1 rounded-lg font-medium cursor-pointer truncate flex items-center gap-1.5 ${tc.bg} ${tc.text} border border-transparent hover:border-current transition-all`}>
      {event.visibility === 'private' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 flex-shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      )}
      <span className="truncate">{event.title}</span>
    </motion.div>
  );
}

const STATUS_EVENT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  upcoming: { label: 'Akan Datang', bg: 'bg-blue-50',    text: 'text-blue-600' },
  ongoing:  { label: 'Berlangsung', bg: 'bg-amber-50',   text: 'text-amber-600' },
  done:     { label: 'Selesai',     bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

function DetailModal({ event, onClose, onDelete, canDelete, onUpdate }: any) {
  const tc = TYPE_CONFIG[event.type] || TYPE_CONFIG.lainnya;
  const sc = STATUS_EVENT_CONFIG[event.status] || STATUS_EVENT_CONFIG.upcoming;
  const [editMode, setEditMode] = React.useState(false);
  const [form, setForm] = React.useState({
    status:           event.status           || 'upcoming',
    notulensi:        event.notulensi        || '',
    hasil_pembahasan: event.hasil_pembahasan || '',
    tindak_lanjut:    event.tindak_lanjut    || '',
  });
  const canEdit = canDelete;

  return (
    <Modal open={!!event} onClose={() => { setEditMode(false); onClose(); }} title="Detail Kegiatan" size="sm">
      <div className="space-y-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${tc.bg} ${tc.text}`}>
          <div className={`w-2 h-2 rounded-full ${tc.dot}`} />
          {tc.label}
          {event.visibility === 'private' && (
            <span className="flex items-center gap-1 text-xs opacity-70">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg> Private
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>

        <div className="space-y-2.5">
          {event.user_name && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-8 h-8 rounded-xl bg-[#284074] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {event.user_name.trim().split(' ').slice(0,2).map((w:string)=>w[0]).join('').toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-700">{event.user_name}</div>
                {event.user_division && <div className="text-xs text-slate-400">{event.user_division}</div>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400 flex-shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{event.start_date?.slice(0,10)}{event.start_date?.slice(0,10) !== event.end_date?.slice(0,10) ? ` – ${event.end_date?.slice(0,10)}` : ''}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {event.all_day
              ? <span className="text-slate-400">Seharian penuh</span>
              : <span>{event.start_time || '—'}{event.end_time ? ` – ${event.end_time}` : ''}</span>
            }
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">{event.description}</p>
        )}

        {event.participants && event.participants.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Peserta ({event.participants.length})
            </div>
            <div className="space-y-1.5">
              {event.participants.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-[#284074] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {p.is_group ? '👥' : (p.full_name || '').trim().split(' ').filter(Boolean).slice(0,2).map((w:string)=>w[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{p.group_name || p.full_name || '—'}</div>
                    {p.division && <div className="text-xs text-slate-400">{p.division}</div>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    p.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                    p.status === 'declined' ? 'bg-red-50 text-red-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>{p.status || 'invited'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
            {sc.label}
          </span>
          {canEdit && !editMode && (
            <button onClick={() => setEditMode(true)}
              className="text-xs font-semibold text-[#284074] hover:underline">
              + Isi Laporan
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-3 bg-slate-50 rounded-2xl p-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Kegiatan</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
                <option value="upcoming">Akan Datang</option>
                <option value="ongoing">Berlangsung</option>
                <option value="done">Selesai</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notulensi</label>
              <textarea value={form.notulensi} onChange={e => setForm(f => ({ ...f, notulensi: e.target.value }))}
                rows={3} placeholder="Catatan selama kegiatan berlangsung..."
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasil Pembahasan</label>
              <textarea value={form.hasil_pembahasan} onChange={e => setForm(f => ({ ...f, hasil_pembahasan: e.target.value }))}
                rows={3} placeholder="1. Poin pertama&#10;2. Poin kedua..."
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tindak Lanjut</label>
              <textarea value={form.tindak_lanjut} onChange={e => setForm(f => ({ ...f, tindak_lanjut: e.target.value }))}
                rows={3} placeholder="1. Follow up pertama&#10;2. Follow up kedua..."
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                Batal
              </button>
              <button onClick={() => { onUpdate(event.id, form); setEditMode(false); }}
                className="flex-1 px-4 py-2 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] transition-colors">
                Simpan
              </button>
            </div>
          </div>
        ) : (event.notulensi || event.hasil_pembahasan || event.tindak_lanjut) ? (
          <div className="space-y-3">
            {event.notulensi && (
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notulensi</div>
                <p className="text-sm text-slate-600 whitespace-pre-line">{event.notulensi}</p>
              </div>
            )}
            {event.hasil_pembahasan && (
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Hasil Pembahasan</div>
                <p className="text-sm text-slate-600 whitespace-pre-line">{event.hasil_pembahasan}</p>
              </div>
            )}
            {event.tindak_lanjut && (
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tindak Lanjut</div>
                <p className="text-sm text-slate-600 whitespace-pre-line">{event.tindak_lanjut}</p>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {canDelete && (
            <button onClick={() => onDelete(event.id)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
              Hapus
            </button>
          )}
          <button onClick={() => { setEditMode(false); onClose(); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateModal({ open, onClose, defaultDate, onSubmit, isPending }: any) {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { title: '', visibility: 'public', type: 'internal', all_day: true, start_date: defaultDate, end_date: defaultDate, start_time: '', end_time: '', location: '', description: '' }
  });

  const prevDate = useRef(defaultDate);
  useEffect(() => {
    if (open && defaultDate !== prevDate.current) {
      prevDate.current = defaultDate;
      reset({ visibility: 'public', type: 'internal', all_day: true, start_date: defaultDate, end_date: defaultDate });
    } else if (open) {
      reset({ visibility: 'public', type: 'internal', all_day: true, start_date: defaultDate, end_date: defaultDate });
    }
  }, [open, defaultDate]);
  const allDay = watch('all_day');
  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Tambah Kegiatan">
      <form onSubmit={handleSubmit(d => onSubmit(d, reset))} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Judul</label>
          <input {...register('title', { required: true })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
            placeholder="Nama kegiatan..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jenis</label>
            <div className="relative">
              <select {...register('type')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white">
                <option value="internal">Internal Kantor</option>
                <option value="external">External Kantor</option>
                <option value="cuti">Cuti</option>
                <option value="lainnya">Lainnya</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Visibilitas</label>
            <div className="relative">
              <select {...register('visibility')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mulai</label>
            <input {...register('start_date', { required: true })} type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Selesai</label>
            <input {...register('end_date', { required: true })} type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input {...register('all_day')} type="checkbox" id="all_day" className="w-4 h-4 rounded accent-[#284074]" />
          <label htmlFor="all_day" className="text-sm font-medium text-slate-700">Seharian penuh</label>
        </div>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jam Mulai</label>
              <input {...register('start_time')} type="time" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jam Selesai</label>
              <input {...register('end_time')} type="time" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" />
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Lokasi</label>
          <input {...register('location')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" placeholder="Opsional" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi</label>
          <textarea {...register('description')} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-black focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all resize-none" placeholder="Keterangan tambahan..." />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => { onClose(); reset(); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
          <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e3060] disabled:opacity-60 transition-colors">
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<'monthly'|'weekly'|'daily'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState(dateStr(today));
  const [detailEvent, setDetailEvent] = useState<any | null>(null);
  const { user, hasRole } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = hasRole(['kepala_balai', 'superadmin']);

  const { fromDate, toDate } = useMemo(() => {
    if (view === 'monthly') {
      const y = currentDate.getFullYear(), m = currentDate.getMonth();
      const last = new Date(y, m+1, 0).getDate();
      return { fromDate: `${y}-${pad(m+1)}-01`, toDate: `${y}-${pad(m+1)}-${pad(last)}` };
    } else if (view === 'weekly') {
      const sw = startOfWeek(currentDate);
      return { fromDate: dateStr(sw), toDate: dateStr(addDays(sw, 6)) };
    } else {
      const s = dateStr(currentDate);
      return { fromDate: s, toDate: s };
    }
  }, [view, currentDate]);

  const { data: events = [] } = useQuery({
    queryKey: ['calendar', fromDate, toDate],
    queryFn: () => calendarService.list(fromDate, toDate).then(r =>
      (r.data.data || []).map((e: any) => ({
        ...e,
        user_name: e.creator_name || e.user_name || null,
        user_division: e.creator_division || e.user_division || null,
      }))
    ),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => calendarService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Kegiatan ditambahkan!'); setCreateOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => calendarService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Kegiatan diperbarui!'); setDetailEvent(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Kegiatan dihapus!'); setDetailEvent(null); },
  });

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (events || []).forEach((e: any) => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      const cur = new Date(start);
      while (cur <= end) {
        const key = cur.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(e);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [events]);

  const navigate = (dir: number) => {
    if (view === 'monthly') {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    } else if (view === 'weekly') {
      setCurrentDate(d => addDays(d, dir * 7));
    } else {
      setCurrentDate(d => addDays(d, dir));
    }
  };

  const todayStr = dateStr(today);

  const headerLabel = useMemo(() => {
    if (view === 'monthly') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'weekly') {
      const sw = startOfWeek(currentDate);
      const ew = addDays(sw, 6);
      return `${sw.getDate()} ${MONTHS[sw.getMonth()]} – ${ew.getDate()} ${MONTHS[ew.getMonth()]} ${ew.getFullYear()}`;
    }
    return `${DAYS_FULL[currentDate.getDay()]}, ${currentDate.getDate()} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  const openCreate = (date: string) => { setDefaultDate(date); setCreateOpen(true); };

  const MonthlyView = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_SHORT.map((d, i) => <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-red-400' : 'text-slate-400'}`}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className="min-h-[110px] border-b border-r border-slate-50 bg-slate-50/30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = `${y}-${pad(m+1)}-${pad(day)}`;
            const dayEvents = eventsByDate[ds] || [];
            const isToday = ds === todayStr;
            const col = (firstDay + i) % 7;
            const isWeekend = col === 0 || col === 6;
            return (
              <div key={day} onClick={() => openCreate(ds)}
                className={`min-h-[110px] border-b border-r border-slate-50 p-2 cursor-pointer hover:bg-slate-50/60 transition-colors ${col === 6 ? 'border-r-0' : ''} ${isWeekend ? 'bg-red-50/40' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1.5 ${isToday ? 'bg-[#284074] text-white' : isWeekend ? 'text-red-400' : 'text-slate-700'}`}>{day}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e: any) => <EventChip key={e.id} event={e} onClick={() => setDetailEvent(e)} />)}
                  {dayEvents.length > 3 && <div className="text-xs text-slate-400 px-1">+{dayEvents.length - 3} lagi</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const WeeklyView = () => {
    const sw = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(sw, i));
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="border-r border-slate-100" />
          {days.map((d, i) => {
            const ds = dateStr(d);
            const isToday = ds === todayStr;
            return (
              <div key={i} className={`py-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-[#284074]/5' : (d.getDay() === 0 || d.getDay() === 6) ? 'bg-red-50/40' : ''}`}>
                <div className={`text-xs font-semibold uppercase ${d.getDay() === 0 || d.getDay() === 6 ? 'text-red-400' : 'text-slate-400'}`}>{DAYS_SHORT[d.getDay()]}</div>
                <div className={`mx-auto mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-[#284074] text-white' : (d.getDay() === 0 || d.getDay() === 6) ? 'text-red-400' : 'text-slate-700'}`}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {HOURS.map(h => (
            <div key={h} className="grid border-b border-slate-50" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
              <div className="py-3 px-2 text-xs text-slate-400 text-right border-r border-slate-100 font-mono">{pad(h)}:00</div>
              {days.map((d, i) => {
                const ds = dateStr(d);
                const isToday = ds === todayStr;
                const slotEvents = (eventsByDate[ds] || []).filter((e: any) => {
                  if (e.all_day) return h === 0;
                  if (!e.start_time) return h === 8;
                  return parseInt(e.start_time.split(':')[0]) === h;
                });
                return (
                  <div key={i} onClick={() => openCreate(ds)}
                    className={`min-h-[52px] border-r border-slate-50 last:border-r-0 p-1 cursor-pointer hover:bg-slate-50/60 transition-colors ${isToday ? 'bg-[#284074]/3' : (d.getDay() === 0 || d.getDay() === 6) ? 'bg-red-50/30' : ''}`}>
                    <div className="space-y-0.5">
                      {slotEvents.map((e: any) => <EventChip key={e.id} event={e} onClick={() => setDetailEvent(e)} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DailyView = () => {
    const ds = dateStr(currentDate);
    const dayEvents = eventsByDate[ds] || [];
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-y-auto max-h-[600px]">
          {HOURS.map(h => {
            const slotEvents = dayEvents.filter((e: any) => {
              if (e.all_day) return h === 0;
              if (!e.start_time) return h === 8;
              return parseInt(e.start_time.split(':')[0]) === h;
            });
            return (
              <div key={h} onClick={() => openCreate(ds)}
                className="flex border-b border-slate-50 cursor-pointer hover:bg-slate-50/60 transition-colors min-h-[64px]">
                <div className="w-16 py-3 px-3 text-xs text-slate-400 font-mono text-right border-r border-slate-100 flex-shrink-0">{pad(h)}:00</div>
                <div className="flex-1 p-2 space-y-1">
                  {slotEvents.map((e: any) => {
                    const tc = TYPE_CONFIG[e.type] || TYPE_CONFIG.lainnya;
                    return (
                      <motion.div key={e.id} whileHover={{ x: 2 }} onClick={ev => { ev.stopPropagation(); setDetailEvent(e); }}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer ${tc.bg} border border-transparent hover:border-current transition-all`}>
                        <div className={`w-1 h-full min-h-[20px] rounded-full ${tc.bar} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${tc.text} flex items-center gap-2`}>
                            {e.visibility === 'private' && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0">
                                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                              </svg>
                            )}
                            {e.title}
                          </div>
                          {e.location && <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {e.location}
                          </div>}
                        </div>
                        {!e.all_day && e.start_time && (
                          <div className="text-xs text-slate-400 flex-shrink-0">{e.start_time}{e.end_time ? `–${e.end_time}` : ''}</div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kalender</h1>
            <p className="text-sm text-slate-400 mt-0.5">Jadwal kegiatan tim</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {(['daily','weekly','monthly'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${view === v ? 'bg-white text-[#284074] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {v === 'daily' ? 'Harian' : v === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </button>
              ))}
            </div>
            <button onClick={() => {
                const now = new Date();
                setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
                setView('daily');
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Hari ini
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => openCreate(todayStr)}
              className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tambah
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 className="text-base font-bold text-slate-800 min-w-0">{headerLabel}</h2>
          <button onClick={() => navigate(1)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <div className="ml-auto flex items-center gap-3 flex-wrap">
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${v.dot}`} />
                <span className="text-xs text-slate-500">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {view === 'monthly' && <MonthlyView />}
            {view === 'weekly' && <WeeklyView />}
            {view === 'daily' && <DailyView />}
          </motion.div>
        </AnimatePresence>
      </div>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} defaultDate={defaultDate}
        onSubmit={(data: any, reset: any) => { createMutation.mutate(data); reset(); }}
        isPending={createMutation.isPending} />

      {detailEvent && (
        <DetailModal event={detailEvent} onClose={() => setDetailEvent(null)}
          onDelete={(id: string) => deleteMutation.mutate(id)}
          onUpdate={(id: string, data: any) => updateMutation.mutate({ id, data })}
          canDelete={detailEvent.user_id === user?.id} />
      )}
    </AppLayout>
  );
}
