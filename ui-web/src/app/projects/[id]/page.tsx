'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService, sprintService, epicService } from '@/lib/api';
import { getStatusLabel, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const STATUS_META: Record<string, { dot: string; bg: string; text: string }> = {
  active:     { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  completed:  { dot: 'bg-[#284074]',   bg: 'bg-blue-50',    text: 'text-blue-700'    },
  planned:    { dot: 'bg-slate-400',   bg: 'bg-slate-100',  text: 'text-slate-600'   },
  on_hold:    { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700'   },
  todo:       { dot: 'bg-slate-400',   bg: 'bg-slate-100',  text: 'text-slate-600'   },
  in_progress:{ dot: 'bg-blue-400',   bg: 'bg-blue-50',    text: 'text-blue-700'    },
  done:       { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META['planned'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {getStatusLabel(status)}
    </span>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview',  icon: 'M3 7h18M3 12h18M3 17h18' },
  { id: 'board',    label: 'Board',     icon: 'M4 5h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 13h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z' },
  { id: 'sprints',  label: 'Sprints',   icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'epics',    label: 'Epics',     icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { id: 'members',  label: 'Members',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

function SprintCard({ sprint, projectId }: { sprint: any; projectId: string }) {
  const qc = useQueryClient();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const startMutation = useMutation({
    mutationFn: () => sprintService.start(projectId, sprint.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', projectId] }); toast.success('Sprint dimulai!'); },
    onError: () => toast.error('Gagal memulai sprint'),
  });
  const completeMutation = useMutation({
    mutationFn: () => sprintService.complete(projectId, sprint.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', projectId] }); toast.success('Sprint selesai!'); },
    onError: () => toast.error('Gagal menyelesaikan sprint'),
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-[#284074]/20 hover:shadow-[0_4px_24px_rgba(40,64,116,0.08)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-slate-800">{sprint.name}</h4>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}
          </div>
        </div>
        <StatusBadge status={sprint.status} />
      </div>
      {sprint.goal && <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-3">{sprint.goal}</p>}
      {canManage && (
        <div className="flex gap-2 flex-wrap">
          {sprint.status === 'planned' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => startMutation.mutate()} disabled={startMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs bg-[#284074] text-white px-3.5 py-2 rounded-xl font-semibold hover:bg-[#1e3260] transition-all shadow-sm disabled:opacity-60">
              <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><polygon points="5 3 19 12 5 21 5 3"/></svg> Mulai Sprint
            </motion.button>
          )}
          {sprint.status === 'active' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3.5 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg> Selesaikan
            </motion.button>
          )}
          <Link href={`/projects/${projectId}/board?sprint_id=${sprint.id}`}
            className="inline-flex items-center gap-1.5 text-xs border-2 border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl font-semibold hover:border-[#284074] hover:text-[#284074] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg> Board
          </Link>
        </div>
      )}
    </div>
  );
}

function FieldWrap({ focused, name, children }: { focused: string | null; name: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border-2 transition-all duration-200 ${focused === name ? 'border-[#284074] shadow-[0_0_0_4px_rgba(40,64,116,0.08)]' : 'border-slate-200 hover:border-slate-300'}`}>
      {children}
    </div>
  );
}
const fieldCls = 'w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400';

function CreateSprintModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => sprintService.create(projectId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', projectId] }); toast.success('Sprint dibuat!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal membuat sprint'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Buat Sprint Baru">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Sprint</label>
          <FieldWrap focused={focused} name="name">
            <input {...register('name', { required: true })} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} className={fieldCls} placeholder="Sprint 1" />
          </FieldWrap>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sprint Goal</label>
          <FieldWrap focused={focused} name="goal">
            <textarea {...register('goal')} onFocus={() => setFocused('goal')} onBlur={() => setFocused(null)} className={`${fieldCls} h-20 resize-none`} placeholder="Tujuan sprint ini..." />
          </FieldWrap>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Mulai</label>
            <FieldWrap focused={focused} name="start">
              <input {...register('start_date', { required: true })} type="date" onFocus={() => setFocused('start')} onBlur={() => setFocused(null)} className={fieldCls} />
            </FieldWrap>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Selesai</label>
            <FieldWrap focused={focused} name="end">
              <input {...register('end_date', { required: true })} type="date" onFocus={() => setFocused('end')} onBlur={() => setFocused(null)} className={fieldCls} />
            </FieldWrap>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">Batal</button>
          <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#284074] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20 disabled:opacity-70">
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Buat Sprint'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

function CreateEpicModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { title: '', description: '', color: '#284074', status: 'active', start_date: '', end_date: '' } });
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => epicService.create(projectId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['epics', projectId] }); toast.success('Epic dibuat!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal membuat epic'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Buat Epic Baru">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Epic</label>
          <FieldWrap focused={focused} name="title">
            <input {...register('title', { required: true })} onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} className={fieldCls} placeholder="Nama epic..." />
          </FieldWrap>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
          <FieldWrap focused={focused} name="desc">
            <textarea {...register('description')} onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)} className={`${fieldCls} h-20 resize-none`} placeholder="Deskripsi epic..." />
          </FieldWrap>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Warna</label>
            <FieldWrap focused={focused} name="color">
              <div className="flex items-center gap-2 px-4 py-2">
                <input {...register('color')} type="color" className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                <input {...register('color')} onFocus={() => setFocused('color')} onBlur={() => setFocused(null)} className="flex-1 bg-transparent outline-none text-sm text-slate-700" placeholder="#284074" />
              </div>
            </FieldWrap>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <FieldWrap focused={focused} name="status">
              <select {...register('status')} onFocus={() => setFocused('status')} onBlur={() => setFocused(null)} className={fieldCls}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </FieldWrap>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Mulai</label>
            <FieldWrap focused={focused} name="start">
              <input {...register('start_date')} type="date" onFocus={() => setFocused('start')} onBlur={() => setFocused(null)} className={fieldCls} />
            </FieldWrap>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Selesai</label>
            <FieldWrap focused={focused} name="end">
              <input {...register('end_date')} type="date" onFocus={() => setFocused('end')} onBlur={() => setFocused(null)} className={fieldCls} />
            </FieldWrap>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">Batal</button>
          <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#284074] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20 disabled:opacity-70">
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Buat Epic'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberModal({ open, onClose, projectId, existingMembers }: { open: boolean; onClose: () => void; projectId: string; existingMembers: any[] }) {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, watch } = useForm();

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/api/v1/users').then(r => r.data.data?.data || r.data.data || []),
    enabled: open,
  });

  const existingIds = new Set(existingMembers?.map((m: any) => m.user_id || m.id));
  const filtered = (allUsers || []).filter((u: any) =>
    !existingIds.has(u.id) &&
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => projectService.addMember(projectId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members', projectId] }); toast.success('Member ditambahkan!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menambahkan member'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Tambah Member">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cari User</label>
          <div className="rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all">
            <input value={search} onChange={e => setSearch(e.target.value)} className={fieldCls} placeholder="Nama atau email..." />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih User</label>
          <FieldWrap focused={focused} name="user">
            <select {...register('user_id', { required: true })} onFocus={() => setFocused('user')} onBlur={() => setFocused(null)} className={fieldCls}>
              {filtered.length === 0 && <option disabled>Tidak ada user tersedia</option>}
              {filtered.map((u: any) => (
                <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>
              ))}
            </select>
          </FieldWrap>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role dalam Project</label>
          <FieldWrap focused={focused} name="role">
            <select {...register('role', { required: true })} onFocus={() => setFocused('role')} onBlur={() => setFocused(null)} className={fieldCls}>
              <option value="member">Member</option>
              <option value="scrum_master">Scrum Master</option>
              <option value="manager">Manager</option>
            </select>
          </FieldWrap>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">Batal</button>
          <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#284074] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20 disabled:opacity-70">
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Tambah Member'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState('overview');
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
  const canAdmin = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager']);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.show(id).then(r => r.data.data),
  });
  const { data: sprints } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => sprintService.list(id).then(r => r.data.data),
    enabled: tab === 'sprints' || tab === 'overview',
  });
  const { data: epics } = useQuery({
    queryKey: ['epics', id],
    queryFn: () => epicService.list(id).then(r => r.data.data),
    enabled: tab === 'epics' || tab === 'overview',
  });
  const { data: members } = useQuery({
    queryKey: ['members', id],
    queryFn: () => projectService.members(id).then(r => r.data.data),
    enabled: tab === 'members' || tab === 'overview',
  });

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  const activeSprints = sprints?.filter((s: any) => s.status === 'active') || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#284074] transition-colors mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
            Kembali ke Projects
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#284074]/8 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#284074" strokeWidth="2" className="w-6 h-6">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{project?.name}</h1>
                  <StatusBadge status={project?.status} />
                </div>
                {project?.description && <p className="text-sm text-slate-400 max-w-xl">{project.description}</p>}
              </div>
            </div>
            <Link href={`/projects/${id}/board`}
              className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20 hover:-translate-y-0.5 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg> Buka Board
            </Link>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === t.id ? 'bg-white text-[#284074] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d={t.icon}/></svg>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {tab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4">Detail Project</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { k: 'Divisi',  v: project?.division || '—' },
                        { k: 'Status',  v: <StatusBadge status={project?.status} /> },
                        { k: 'Mulai',   v: formatDate(project?.start_date) },
                        { k: 'Selesai', v: formatDate(project?.end_date) },
                      ].map(({ k, v }) => (
                        <div key={k} className="bg-slate-50 rounded-xl px-4 py-3">
                          <div className="text-xs text-slate-400 mb-1">{k}</div>
                          <div className="text-sm font-semibold text-slate-700">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-800">Sprint Aktif</h3>
                      <Link href={`/projects/${id}/board`} className="text-xs font-semibold text-[#284074] flex items-center gap-1 hover:gap-2 transition-all">
                        Buka Board <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </Link>
                    </div>
                    {activeSprints.length > 0 ? (
                      <div className="space-y-3">{activeSprints.map((s: any) => <SprintCard key={s.id} sprint={s} projectId={id} />)}</div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mb-2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        <span className="text-sm">Tidak ada sprint aktif</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-3">Ringkasan</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 border-b border-slate-50">
                        <span className="text-sm text-slate-500">Total Sprint</span>
                        <span className="text-sm font-bold text-slate-800">{sprints?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-50">
                        <span className="text-sm text-slate-500">Total Epic</span>
                        <span className="text-sm font-bold text-slate-800">{epics?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-slate-500">Total Member</span>
                        <span className="text-sm font-bold text-slate-800">{members?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-3">Semua Sprint</h3>
                    <div className="space-y-2">
                      {sprints?.slice(0, 4).map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <span className="text-sm text-slate-600 font-medium">{s.name}</span>
                          <StatusBadge status={s.status} />
                        </div>
                      ))}
                      {(!sprints || sprints.length === 0) && <div className="text-xs text-slate-400 text-center py-3">Belum ada sprint</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'sprints' && (
              <div>
                {canManage && (
                  <div className="flex justify-end mb-4">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCreateSprintOpen(true)}
                      className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20">
                      + Buat Sprint
                    </motion.button>
                  </div>
                )}
                <div className="space-y-3">
                  {sprints?.map((s: any) => <SprintCard key={s.id} sprint={s} projectId={id} />)}
                  {(!sprints || sprints.length === 0) && (
                    <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-3"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      <span className="text-sm font-medium">Belum ada sprint</span>
                      {canManage && <button onClick={() => setCreateSprintOpen(true)} className="mt-3 text-xs text-[#284074] font-semibold hover:underline">+ Buat sprint pertama</button>}
                    </div>
                  )}
                </div>
                <CreateSprintModal open={createSprintOpen} onClose={() => setCreateSprintOpen(false)} projectId={id} />
              </div>
            )}

            {tab === 'epics' && (
              <div>
                {canAdmin && (
                  <div className="flex justify-end mb-4">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCreateEpicOpen(true)}
                      className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20">
                      + Buat Epic
                    </motion.button>
                  </div>
                )}
                <div className="space-y-3">
                  {epics?.map((e: any) => (
                    <div key={e.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-[#284074]/20 hover:shadow-[0_4px_20px_rgba(40,64,116,0.08)] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: e.color ? `${e.color}20` : '#284074' + '20' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke={e.color || '#284074'} strokeWidth="2" className="w-4 h-4">
                              <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{e.title}</div>
                            {e.description && <div className="text-sm text-slate-400 mt-0.5">{e.description}</div>}
                            {(e.start_date || e.end_date) && (
                              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {formatDate(e.start_date)} – {formatDate(e.end_date)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.color && <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: e.color }} />}
                          <StatusBadge status={e.status || 'todo'} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!epics || epics.length === 0) && (
                    <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-3">
                        <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                      </svg>
                      <span className="text-sm font-medium">Belum ada epic</span>
                      {canAdmin && <button onClick={() => setCreateEpicOpen(true)} className="mt-3 text-xs text-[#284074] font-semibold hover:underline">+ Buat epic pertama</button>}
                    </div>
                  )}
                </div>
                <CreateEpicModal open={createEpicOpen} onClose={() => setCreateEpicOpen(false)} projectId={id} />
              </div>
            )}

            {tab === 'members' && (
              <div>
                {canAdmin && (
                  <div className="flex justify-end mb-4">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAddMemberOpen(true)}
                      className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20">
                      + Tambah Member
                    </motion.button>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members?.map((m: any) => {
                    const name = m.full_name || m.user?.full_name || 'User';
                    const initials = name.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
                    const ROLE_LABELS: Record<string, string> = { manager: 'Manager', scrum_master: 'Scrum Master', member: 'Member' };
                    return (
                      <div key={m.user_id || m.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 hover:border-[#284074]/20 hover:shadow-[0_4px_20px_rgba(40,64,116,0.08)] transition-all">
                        <div className="w-11 h-11 rounded-xl bg-[#284074] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 text-sm truncate">{name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{m.division || '—'}</div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#284074]/8 text-[#284074] flex-shrink-0">
                          {ROLE_LABELS[m.role] || m.role || 'Member'}
                        </span>
                      </div>
                    );
                  })}
                  {(!members || members.length === 0) && (
                    <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-3">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span className="text-sm font-medium">Belum ada anggota</span>
                      {canAdmin && <button onClick={() => setAddMemberOpen(true)} className="mt-3 text-xs text-[#284074] font-semibold hover:underline">+ Tambah member pertama</button>}
                    </div>
                  )}
                </div>
                <AddMemberModal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} projectId={id} existingMembers={members || []} />
              </div>
            )}

            {tab === 'board' && (
              <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-[#284074]/8 rounded-2xl flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#284074" strokeWidth="1.5" strokeOpacity="0.4" className="w-7 h-7">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">Buka Kanban Board</h3>
                <p className="text-sm text-slate-400 mb-5">Kelola task dengan drag and drop</p>
                <Link href={`/projects/${id}/board`}
                  className="inline-flex items-center gap-2 bg-[#284074] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20">
                  Buka Board
                </Link>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
