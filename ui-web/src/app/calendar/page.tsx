'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { calendarService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type View = 'month' | 'week' | 'day' | 'agenda';

const TYPE_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  internal: { label: 'Internal', bg: '#eaf1f8', color: '#14406a', dot: '#14406a' },
  external: { label: 'External', bg: '#fbf3e0', color: '#8a6209', dot: '#8a6209' },
  cuti:     { label: 'Leave',    bg: '#f1f0ed', color: '#5c6470', dot: '#5c6470' },
  lainnya:  { label: 'Other',    bg: '#e9f4ee', color: '#0f6144', dot: '#0f6144' },
};

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number) { return String(n).padStart(2, '0'); }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeekMon(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day));
  return r;
}

function EventPill({ event, onClick }: { event: any; onClick: () => void }) {
  const cfg = TYPE_CFG[event.type] || TYPE_CFG.lainnya;
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-[5px] h-[18px] px-[5px] rounded-[3px] cursor-pointer overflow-hidden whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-[4px] h-[4px] rounded-full flex-none" style={{ background: cfg.dot }} />
      {!event.all_day && event.start_time && (
        <span className="font-mono text-[9px] font-medium flex-none">{event.start_time.slice(0, 5)}</span>
      )}
      <span className="text-[9.5px] font-semibold truncate">{event.title}</span>
    </div>
  );
}

function DetailModal({ event, onClose, onDelete, canDelete, onUpdate }: any) {
  const cfg = TYPE_CFG[event.type] || TYPE_CFG.lainnya;
  const [editMode, setEditMode] = React.useState(false);
  const [form, setForm] = React.useState({
    status: event.status || 'upcoming',
    notulensi: event.notulensi || '',
    hasil_pembahasan: event.hasil_pembahasan || '',
    tindak_lanjut: event.tindak_lanjut || '',
  });

  return (
    <Modal open={!!event} onClose={() => { setEditMode(false); onClose(); }} title="Event details" size="sm">
      <div className="flex flex-col gap-[10px]">
        <span className="inline-flex items-center gap-[6px] h-[22px] px-[8px] rounded-[3px] text-[10.5px] font-semibold self-start"
          style={{ background: cfg.bg, color: cfg.color }}>
          <span className="w-[5px] h-[5px] rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>

        <div className="text-[15px] font-semibold text-[#0d2b48]">{event.title}</div>

        <div className="flex flex-col gap-[7px] text-[12px]">
          {event.user_name && (
            <div className="flex items-center gap-[8px]">
              <div className="w-[22px] h-[22px] rounded-[4px] bg-[#eaf1f8] text-[#14406a] flex items-center justify-center font-mono text-[9px] font-bold flex-none">
                {(event.user_name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="font-medium text-[#12283c]">{event.user_name}</span>
              {event.user_division && <span className="text-[#9ca3af]">· {event.user_division}</span>}
            </div>
          )}
          <div className="flex items-center gap-[8px] text-[#4b5563]">
            <span className="font-mono text-[9.5px] text-[#8a8f98] w-[32px]">DATE</span>
            <span>{event.start_date?.slice(0, 10)}{event.end_date?.slice(0, 10) !== event.start_date?.slice(0, 10) ? ` – ${event.end_date?.slice(0, 10)}` : ''}</span>
          </div>
          {!event.all_day && event.start_time && (
            <div className="flex items-center gap-[8px] text-[#4b5563]">
              <span className="font-mono text-[9.5px] text-[#8a8f98] w-[32px]">TIME</span>
              <span>{event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-[8px] text-[#4b5563]">
              <span className="font-mono text-[9.5px] text-[#8a8f98] w-[32px]">LOC</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-[12px] text-[#4b5563] bg-[#f9f8f6] rounded-[5px] px-[10px] py-[8px]">{event.description}</p>
        )}

        {event.participants && event.participants.length > 0 && (
          <div>
            <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98] mb-[6px]">
              PARTICIPANTS ({event.participants.length})
            </div>
            <div className="flex flex-col gap-[3px]">
              {event.participants.map((p: any) => (
                <div key={p.id} className="flex items-center gap-[7px] px-[8px] py-[5px] bg-[#f9f8f6] rounded-[4px]">
                  <div className="w-[20px] h-[20px] rounded-[3px] bg-[#eaf1f8] text-[#14406a] text-[8px] font-bold flex items-center justify-center flex-none">
                    {(p.full_name || '').split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'GR'}
                  </div>
                  <span className="text-[12px] font-medium text-[#12283c] flex-1 truncate">{p.group_name || p.full_name || '—'}</span>
                  <span className="font-mono text-[9.5px]" style={{
                    color: p.status === 'accepted' ? '#0f6144' : p.status === 'declined' ? '#a3231c' : '#8a8f98',
                  }}>{p.status || 'invited'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {canDelete && !editMode && (
          <button onClick={() => setEditMode(true)} className="text-[11px] font-semibold text-[#14406a] hover:underline self-start">
            + Add report
          </button>
        )}

        {editMode && (
          <div className="flex flex-col gap-[8px] bg-[#f9f8f6] rounded-[5px] p-[10px]">
            <div>
              <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">STATUS</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full h-[30px] px-[8px] border border-[#d9d6cf] rounded-[4px] text-[12px] text-[#12283c] bg-white focus:outline-none">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="done">Done</option>
              </select>
            </div>
            {(['notulensi', 'hasil_pembahasan', 'tindak_lanjut'] as const).map((field, i) => (
              <div key={field}>
                <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">
                  {['MINUTES', 'OUTCOMES', 'FOLLOW UP'][i]}
                </label>
                <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  rows={2} className="mt-1 w-full px-[8px] py-[6px] border border-[#d9d6cf] rounded-[4px] text-[12px] text-[#12283c] bg-white resize-none focus:outline-none" />
              </div>
            ))}
            <div className="flex gap-[6px]">
              <button onClick={() => setEditMode(false)}
                className="flex-1 h-[30px] border border-[#d9d6cf] rounded-[4px] text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
                Cancel
              </button>
              <button onClick={() => { onUpdate(event.id, form); setEditMode(false); }}
                className="flex-1 h-[30px] rounded-[4px] bg-[#14406a] text-white text-[12px] font-semibold hover:bg-[#0d2b48] transition-colors">
                Save
              </button>
            </div>
          </div>
        )}

        {!editMode && (event.notulensi || event.hasil_pembahasan || event.tindak_lanjut) && (
          <div className="flex flex-col gap-[6px]">
            {([['notulensi','MINUTES'],['hasil_pembahasan','OUTCOMES'],['tindak_lanjut','FOLLOW UP']] as const).map(([field, label]) =>
              event[field] ? (
                <div key={field} className="bg-[#f9f8f6] rounded-[5px] p-[8px]">
                  <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98] mb-[3px]">{label}</div>
                  <p className="text-[12px] text-[#4b5563] whitespace-pre-line">{event[field]}</p>
                </div>
              ) : null
            )}
          </div>
        )}

        <div className="flex gap-[6px] pt-[6px] border-t border-[#f2f0ec]">
          {canDelete && (
            <button onClick={() => onDelete(event.id)}
              className="flex-1 h-[32px] border border-[#f4d0cf] rounded-[5px] text-[12px] font-semibold text-[#a3231c] hover:bg-[#fdeceb] transition-colors">
              Delete
            </button>
          )}
          <button onClick={() => { setEditMode(false); onClose(); }}
            className="flex-1 h-[32px] bg-[#f1f0ed] rounded-[5px] text-[12px] font-semibold text-[#4b5563] hover:bg-[#e8e6e0] transition-colors">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateModal({ open, onClose, defaultDate, onSubmit, isPending }: any) {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { title: '', visibility: 'public', type: 'internal', all_day: true, start_date: defaultDate, end_date: defaultDate, start_time: '', end_time: '', location: '', description: '' },
  });
  const prevDate = useRef(defaultDate);
  useEffect(() => {
    if (open) {
      const changed = defaultDate !== prevDate.current;
      prevDate.current = defaultDate;
      if (changed) reset({ visibility: 'public', type: 'internal', all_day: true, start_date: defaultDate, end_date: defaultDate, title: '', start_time: '', end_time: '', location: '', description: '' });
      else reset({ visibility: 'public', type: 'internal', all_day: true, start_date: defaultDate, end_date: defaultDate, title: '', start_time: '', end_time: '', location: '', description: '' });
    }
  }, [open, defaultDate]);
  const allDay = watch('all_day');

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="New event">
      <form onSubmit={handleSubmit(d => onSubmit(d, reset))} className="flex flex-col gap-[10px]">
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">TITLE</label>
          <input {...register('title', { required: true })}
            className="mt-1 w-full h-[32px] px-[10px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none focus:border-[#14406a]"
            placeholder="Event title..." />
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">TYPE</label>
            <select {...register('type')} className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none appearance-none">
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="cuti">Leave</option>
              <option value="lainnya">Other</option>
            </select>
          </div>
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">VISIBILITY</label>
            <select {...register('visibility')} className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none appearance-none">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">START</label>
            <input {...register('start_date', { required: true })} type="date"
              className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none" />
          </div>
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">END</label>
            <input {...register('end_date', { required: true })} type="date"
              className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <input {...register('all_day')} type="checkbox" id="all_day" className="w-[13px] h-[13px] rounded accent-[#14406a]" />
          <label htmlFor="all_day" className="text-[12px] font-medium text-[#4b5563]">All day</label>
        </div>
        {!allDay && (
          <div className="grid grid-cols-2 gap-[8px]">
            <div>
              <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">START TIME</label>
              <input {...register('start_time')} type="time"
                className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">END TIME</label>
              <input {...register('end_time')} type="time"
                className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none" />
            </div>
          </div>
        )}
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">LOCATION</label>
          <input {...register('location')}
            className="mt-1 w-full h-[32px] px-[10px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none"
            placeholder="Optional" />
        </div>
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">DESCRIPTION</label>
          <textarea {...register('description')} rows={2}
            className="mt-1 w-full px-[10px] py-[6px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white resize-none focus:outline-none"
            placeholder="Additional notes..." />
        </div>
        <div className="flex gap-[6px] pt-[2px]">
          <button type="button" onClick={() => { onClose(); reset(); }}
            className="flex-1 h-[34px] border border-[#d9d6cf] rounded-[6px] text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 h-[34px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold disabled:opacity-60 transition-colors"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}>
            {isPending ? 'Saving…' : 'Save event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState(dateStr(today));
  const [detailEvent, setDetailEvent] = useState<any | null>(null);
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const todayStr = dateStr(today);

  const { fromDate, toDate } = useMemo(() => {
    if (view === 'month') {
      const y = currentDate.getFullYear(), m = currentDate.getMonth();
      const last = new Date(y, m + 1, 0).getDate();
      return { fromDate: `${y}-${pad(m + 1)}-01`, toDate: `${y}-${pad(m + 1)}-${pad(last)}` };
    } else if (view === 'week') {
      const sw = startOfWeekMon(currentDate);
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Event added!'); setCreateOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => calendarService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Event updated!'); setDetailEvent(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Event deleted!'); setDetailEvent(null); },
  });

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (events || []).forEach((e: any) => {
      const cur = new Date(e.start_date);
      const end = new Date(e.end_date);
      while (cur <= end) {
        const k = dateStr(cur);
        if (!map[k]) map[k] = [];
        map[k].push(e);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [events]);

  const conflictDays = useMemo(() =>
    Object.entries(eventsByDate)
      .filter(([, evs]) => evs.filter(e => !e.all_day && e.start_time).length >= 2)
      .map(([d]) => d),
    [eventsByDate]
  );

  const navigate = (dir: number) => {
    if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    else if (view === 'week') setCurrentDate(d => addDays(d, dir * 7));
    else setCurrentDate(d => addDays(d, dir));
  };

  const headerLabel = useMemo(() => {
    if (view === 'month') return `${MONTHS_EN[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const sw = startOfWeekMon(currentDate);
      const ew = addDays(sw, 6);
      return sw.getMonth() === ew.getMonth()
        ? `${sw.getDate()}–${ew.getDate()} ${MONTHS_EN[sw.getMonth()]} ${sw.getFullYear()}`
        : `${sw.getDate()} ${MONTHS_EN[sw.getMonth()]} – ${ew.getDate()} ${MONTHS_EN[ew.getMonth()]} ${ew.getFullYear()}`;
    }
    return `${currentDate.getDate()} ${MONTHS_EN[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  const todayEvents = useMemo(() =>
    (events || []).filter((e: any) => {
      const t = new Date(todayStr);
      return new Date(e.start_date) <= t && t <= new Date(e.end_date);
    }),
    [events, todayStr]
  );

  const subtitle = view === 'month'
    ? `${MONTHS_EN[currentDate.getMonth()]} ${currentDate.getFullYear()} · ${events.length} event${events.length !== 1 ? 's' : ''} · ${todayEvents.length} involve you today`
    : `${events.length} event${events.length !== 1 ? 's' : ''}`;

  const openCreate = (date: string) => { setDefaultDate(date); setCreateOpen(true); };

  /* ── Month View ── */
  const MonthView = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDow = new Date(y, m, 1).getDay();
    const startOffset = firstDow === 0 ? 6 : firstDow - 1;
    const prevMonthTotal = new Date(y, m, 0).getDate();
    const cells: { date: Date; current: boolean }[] = [];
    for (let i = 0; i < startOffset; i++)
      cells.push({ date: new Date(y, m - 1, prevMonthTotal - startOffset + 1 + i), current: false });
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ date: new Date(y, m, d), current: true });
    const totalRows = Math.ceil(cells.length / 7);
    for (let d = 1; cells.length < totalRows * 7; d++)
      cells.push({ date: new Date(y, m + 1, d), current: false });

    return (
      <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
        <div className="grid border-b border-[#eceae4] bg-[#faf9f7]" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
          {WEEK_DAYS.map((d, i) => (
            <div key={d} className="h-[28px] flex items-center px-[8px] font-mono text-[9.5px] font-semibold tracking-[0.1em] border-r border-[#f2f0ec] last:border-r-0"
              style={{ color: i >= 5 ? '#c0bcb4' : '#8a8f98' }}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '1fr' }}>
          {cells.map((cell, idx) => {
            const ds = dateStr(cell.date);
            const dayEvs = eventsByDate[ds] || [];
            const isToday = ds === todayStr;
            const isWeekend = idx % 7 >= 5;
            return (
              <div key={idx} onClick={() => openCreate(ds)}
                className="border-r border-b border-[#f2f0ec] p-[5px_6px] flex flex-col gap-[3px] overflow-hidden cursor-pointer hover:bg-[#f9f8f6] transition-colors"
                style={{
                  background: !cell.current ? '#fbfbfa' : isWeekend ? '#fcfcfb' : undefined,
                  minHeight: 80,
                  ...(idx % 7 === 6 && { borderRight: 'none' }),
                }}>
                <div className="flex items-center justify-between">
                  {isToday ? (
                    <div className="w-[20px] h-[20px] rounded-full bg-accent flex items-center justify-center font-mono text-[10.5px] font-semibold text-[#12283c]">
                      {cell.date.getDate()}
                    </div>
                  ) : (
                    <div className="font-mono text-[10.5px]" style={{
                      color: !cell.current ? '#c9c5bd' : isWeekend ? '#a6a094' : '#4b5563',
                    }}>
                      {cell.date.getDate()}
                    </div>
                  )}
                  {conflictDays.includes(ds) && (
                    <div className="w-[5px] h-[5px] rounded-full bg-[#b3261e]" />
                  )}
                </div>
                {dayEvs.slice(0, 3).map((e: any) => (
                  <EventPill key={e.id} event={e} onClick={() => setDetailEvent(e)} />
                ))}
                {dayEvs.length > 3 && (
                  <div className="text-[9px] font-semibold text-[#8a8f98] px-[2px]">+{dayEvs.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Week View ── */
  const WeekView = () => {
    const sw = startOfWeekMon(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(sw, i));
    return (
      <div className="bg-white border border-[#e6e4df] rounded-[6px] overflow-hidden">
        <div className="grid border-b border-[#eceae4] bg-[#faf9f7]" style={{ gridTemplateColumns: '52px repeat(7,1fr)' }}>
          <div className="border-r border-[#f2f0ec]" />
          {days.map((d, i) => {
            const ds = dateStr(d);
            const isToday = ds === todayStr;
            return (
              <div key={i} className="h-[36px] flex flex-col items-center justify-center border-r border-[#f2f0ec] last:border-r-0"
                style={{ background: isToday ? '#eaf1f8' : undefined }}>
                <span className="font-mono text-[9px] font-semibold tracking-[0.1em]" style={{ color: i >= 5 ? '#c0bcb4' : '#8a8f98' }}>
                  {WEEK_DAYS[i]}
                </span>
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center font-mono text-[10.5px] font-semibold"
                  style={isToday
                    ? { background: '#c9971b', color: '#12283c' }
                    : { color: i >= 5 ? '#a6a094' : '#4b5563' }}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
          {HOURS.map(h => (
            <div key={h} className="grid border-b border-[#f2f0ec]" style={{ gridTemplateColumns: '52px repeat(7,1fr)', minHeight: 44 }}>
              <div className="px-[6px] pt-[4px] font-mono text-[9.5px] text-[#8a8f98] text-right border-r border-[#f2f0ec]">
                {pad(h)}:00
              </div>
              {days.map((d, i) => {
                const ds = dateStr(d);
                const slotEvs = (eventsByDate[ds] || []).filter((e: any) => {
                  if (e.all_day) return h === 0;
                  if (!e.start_time) return h === 8;
                  return parseInt(e.start_time.split(':')[0]) === h;
                });
                return (
                  <div key={i} onClick={() => openCreate(ds)}
                    className="p-[2px] flex flex-col gap-[2px] border-r border-[#f2f0ec] last:border-r-0 cursor-pointer hover:bg-[#f9f8f6] transition-colors">
                    {slotEvs.map((e: any) => <EventPill key={e.id} event={e} onClick={() => setDetailEvent(e)} />)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── Day View ── */
  const DayView = () => {
    const ds = dateStr(currentDate);
    const dayEvs = eventsByDate[ds] || [];
    return (
      <div className="bg-white border border-[#e6e4df] rounded-[6px] overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
          {HOURS.map(h => {
            const slotEvs = dayEvs.filter((e: any) => {
              if (e.all_day) return h === 0;
              if (!e.start_time) return h === 8;
              return parseInt(e.start_time.split(':')[0]) === h;
            });
            return (
              <div key={h} onClick={() => openCreate(ds)}
                className="flex border-b border-[#f2f0ec] cursor-pointer hover:bg-[#f9f8f6] transition-colors"
                style={{ minHeight: 52 }}>
                <div className="w-[52px] pt-[4px] px-[6px] font-mono text-[9.5px] text-[#8a8f98] text-right border-r border-[#f2f0ec] flex-none">
                  {pad(h)}:00
                </div>
                <div className="flex-1 p-[4px] flex flex-col gap-[3px]">
                  {slotEvs.map((e: any) => {
                    const cfg = TYPE_CFG[e.type] || TYPE_CFG.lainnya;
                    return (
                      <div key={e.id} onClick={ev => { ev.stopPropagation(); setDetailEvent(e); }}
                        className="flex items-center gap-[8px] px-[8px] py-[5px] rounded-[4px] cursor-pointer"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <div className="w-[2px] min-h-[18px] rounded-full flex-none" style={{ background: cfg.dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold truncate">{e.title}</div>
                          {e.location && <div className="font-mono text-[10px] text-[#8a8f98] truncate">{e.location}</div>}
                        </div>
                        {!e.all_day && e.start_time && (
                          <span className="font-mono text-[10px] flex-none">
                            {e.start_time.slice(0, 5)}{e.end_time ? `–${e.end_time.slice(0, 5)}` : ''}
                          </span>
                        )}
                      </div>
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

  /* ── Agenda View ── */
  const AgendaView = () => {
    const sorted = [...(events || [])].sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (sorted.length === 0) {
      return (
        <div className="bg-white border border-[#e6e4df] rounded-[6px] py-12 flex items-center justify-center">
          <p className="text-[12.5px] font-semibold text-[#8a8f98]">No events in this period</p>
        </div>
      );
    }
    return (
      <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
        {sorted.map((e: any) => {
          const cfg = TYPE_CFG[e.type] || TYPE_CFG.lainnya;
          return (
            <div key={e.id} onClick={() => setDetailEvent(e)}
              className="flex items-center gap-[12px] px-[15px] h-[44px] border-b border-[#f2f0ec] hover:bg-[#f9f8f6] cursor-pointer transition-colors last:border-b-0">
              <span className="font-mono text-[10.5px] text-[#8a8f98] w-[52px] flex-none">
                {e.start_date?.slice(5)?.replace('-', '/')}
              </span>
              <span className="inline-flex items-center gap-[5px] h-[18px] px-[5px] rounded-[3px] text-[9.5px] font-semibold flex-none"
                style={{ background: cfg.bg, color: cfg.color }}>
                <span className="w-[4px] h-[4px] rounded-full" style={{ background: cfg.dot }} />
                {cfg.label}
              </span>
              <span className="text-[12.5px] font-semibold text-[#12283c] flex-1 truncate">{e.title}</span>
              {!e.all_day && e.start_time && (
                <span className="font-mono text-[10.5px] text-[#8a8f98] flex-none">{e.start_time.slice(0, 5)}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        section="AGENDA"
        title="Calendar"
        subtitle={subtitle}
        actions={
          <>
            <button onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}
              className="h-[34px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
              Today
            </button>
            <button className="h-[34px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
              Export PDF
            </button>
            <button onClick={() => openCreate(todayStr)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}>
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              New event
            </button>
          </>
        }
      />

      {/* Controls bar */}
      <div className="flex items-center gap-[12px]">
        <div className="flex gap-[5px]">
          {(['day','week','month','agenda'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="h-[26px] px-[10px] rounded-[4px] text-[11.5px] transition-colors"
              style={view === v
                ? { background: '#14406a', color: '#fff', fontWeight: 600 }
                : { color: '#6b7280', fontWeight: 500 }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-[8px]">
          <button onClick={() => navigate(-1)} className="w-[26px] h-[26px] border border-[#e2e0da] rounded-[5px] bg-white flex items-center justify-center hover:bg-[#f5f4f2] transition-colors">
            <ChevronLeft className="w-[11px] h-[11px] text-[#6b7280]" />
          </button>
          <span className="font-display text-[14px] font-semibold text-[#0d2b48] min-w-[150px] text-center">{headerLabel}</span>
          <button onClick={() => navigate(1)} className="w-[26px] h-[26px] border border-[#e2e0da] rounded-[5px] bg-white flex items-center justify-center hover:bg-[#f5f4f2] transition-colors">
            <ChevronRight className="w-[11px] h-[11px] text-[#6b7280]" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-[14px] text-[11px] text-[#6b7280]">
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <span key={k} className="flex items-center gap-[5px]">
              <span className="w-[8px] h-[8px] rounded-[2px]" style={{ background: v.dot }} />
              {v.label}
            </span>
          ))}
          {conflictDays.length > 0 && (
            <>
              <span className="w-[1px] h-[16px] bg-[#e6e4df]" />
              <span className="flex items-center gap-[5px] font-semibold text-[#a3231c]">
                <AlertTriangle className="w-[11px] h-[11px]" strokeWidth={1.8} />
                {conflictDays.length} conflict{conflictDays.length > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${view}-${headerLabel}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
          {view === 'month'  && <MonthView />}
          {view === 'week'   && <WeekView />}
          {view === 'day'    && <DayView />}
          {view === 'agenda' && <AgendaView />}
        </motion.div>
      </AnimatePresence>

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
