'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Plus, Search, LayoutGrid, List, Calendar, ArrowRight, Clock, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const STATUS_META: Record<string, { dot: string; bg: string; text: string }> = {
  active:    { dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  completed: { dot: 'bg-[#284074]',   bg: 'bg-blue-50',     text: 'text-blue-700'    },
  planned:   { dot: 'bg-slate-400',   bg: 'bg-slate-100',   text: 'text-slate-600'   },
  on_hold:   { dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
};

const STATUS_FILTERS = ['Semua', 'active', 'planned', 'completed', 'on_hold'];

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META['planned'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {getStatusLabel(status)}
    </span>
  );
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [focused, setFocused] = useState<string | null>(null);
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => projectService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project berhasil dibuat!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal membuat project'),
  });

  const fieldClass = (name: string, hasError?: boolean) =>
    `w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400`;
  const wrapClass = (name: string, hasError?: boolean) =>
    `rounded-xl border-2 transition-all duration-200 ${
      focused === name
        ? 'border-[#284074] shadow-[0_0_0_4px_rgba(40,64,116,0.08)]'
        : hasError
        ? 'border-red-400'
        : 'border-slate-200 hover:border-slate-300'
    }`;

  return (
    <Modal open={open} onClose={onClose} title="Buat Project Baru" size="md">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Project</label>
          <div className={wrapClass('name', !!errors.name)}>
            <input {...register('name', { required: 'Wajib diisi' })} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
              className={fieldClass('name')} placeholder="Masukkan nama project..." />
          </div>
          <AnimatePresence>{errors.name && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-xs mt-1.5">{errors.name.message as string}</motion.p>}</AnimatePresence>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
          <div className={wrapClass('desc')}>
            <textarea {...register('description')} onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
              className={`${fieldClass('desc')} h-24 resize-none`} placeholder="Jelaskan tujuan dan scope project..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Mulai</label>
            <div className={wrapClass('start', !!errors.start_date)}>
              <input {...register('start_date', { required: 'Wajib' })} type="date" onFocus={() => setFocused('start')} onBlur={() => setFocused(null)} className={fieldClass('start')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Selesai</label>
            <div className={wrapClass('end', !!errors.end_date)}>
              <input {...register('end_date', { required: 'Wajib' })} type="date" onFocus={() => setFocused('end')} onBlur={() => setFocused(null)} className={fieldClass('end')} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Divisi</label>
          <div className={wrapClass('division')}>
            <input {...register('division')} onFocus={() => setFocused('division')} onBlur={() => setFocused(null)}
              className={fieldClass('division')} placeholder="Nama divisi atau unit..." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
            Batal
          </button>
          <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#284074] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20 disabled:opacity-70">
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Buat Project
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectCard({ project, index }: { project: any; index: number }) {
  const daysLeft = Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000);
  const m = STATUS_META[project.status] ?? STATUS_META['planned'];

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}>
      <Link href={`/projects/${project.id}`} className="group block h-full">
        <div className="relative bg-white rounded-2xl border border-slate-100 p-5 h-full flex flex-col transition-all duration-300 hover:border-[#284074]/20 hover:shadow-[0_8px_40px_rgba(40,64,116,0.12)] hover:-translate-y-1">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-[#284074] to-[#3d5a9e] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-[#284074]/8 flex items-center justify-center group-hover:bg-[#284074] transition-all duration-300 flex-shrink-0">
              <FolderKanban className="w-5 h-5 text-[#284074] group-hover:text-white transition-colors duration-300" />
            </div>
            <StatusBadge status={project.status} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1.5 group-hover:text-[#284074] transition-colors leading-snug">{project.name}</h3>
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{project.description || 'Tidak ada deskripsi'}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(project.start_date)}
            </div>
            {daysLeft > 0 ? (
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {daysLeft}h lagi
              </div>
            ) : project.status !== 'completed' ? (
              <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between">
            {project.division && (
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{project.division}</span>
            )}
            <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#284074] opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
              Buka <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const { hasRole } = useAuthStore();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });

  const filtered = (projects || []).filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canCreate = hasRole(['kepala_balai']);
  const stats = {
    total:     projects?.length || 0,
    active:    projects?.filter((p: any) => p.status === 'active').length || 0,
    completed: projects?.filter((p: any) => p.status === 'completed').length || 0,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">Kelola dan pantau semua project tim</p>
          </div>
          {canCreate && (
            <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20 hover:shadow-xl hover:shadow-[#284074]/25 hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Buat Project
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Project', value: stats.total,     icon: <FolderKanban className="w-4 h-4 text-[#284074]" />, bg: 'bg-[#284074]/8' },
            { label: 'Aktif',         value: stats.active,    icon: <Zap className="w-4 h-4 text-emerald-500" />,        bg: 'bg-emerald-50'  },
            { label: 'Selesai',       value: stats.completed, icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,  bg: 'bg-blue-50'     },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
              <div>
                <div className="text-xl font-extrabold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className={`relative flex-1 min-w-48 rounded-xl border-2 transition-all duration-200 ${searchFocused ? 'border-[#284074] shadow-[0_0_0_4px_rgba(40,64,116,0.08)]' : 'border-slate-200 hover:border-slate-300'}`}>
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-[#284074]' : 'text-slate-400'}`} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
              placeholder="Cari project..." />
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-white text-[#284074] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {s === 'Semua' ? 'Semua' : getStatusLabel(s)}
              </button>
            ))}
          </div>

          <div className="flex gap-1 border-2 border-slate-200 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#284074] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#284074] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#284074]/8 rounded-2xl flex items-center justify-center mb-4">
              <FolderKanban className="w-7 h-7 text-[#284074]/40" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Belum ada project</h3>
            <p className="text-sm text-slate-400 mb-5">Mulai dengan membuat project pertama</p>
            {canCreate && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 bg-[#284074] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-lg shadow-[#284074]/20">
                <Plus className="w-4 h-4" /> Buat Project
              </motion.button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p: any, i: number) => <ProjectCard key={p.id} project={p} index={i} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Project', 'Status', 'Divisi', 'Periode', 'Sisa Hari', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any, i: number) => {
                  const daysLeft = Math.ceil((new Date(p.end_date).getTime() - Date.now()) / 86400000);
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#284074]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#284074] transition-colors">
                            <FolderKanban className="w-4 h-4 text-[#284074] group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-[#284074] transition-colors">{p.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{p.description?.slice(0, 45)}{p.description?.length > 45 ? '…' : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.division || '—'}</td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        <div>{formatDate(p.start_date)}</div>
                        <div className="text-slate-300 mt-0.5">→ {formatDate(p.end_date)}</div>
                      </td>
                      <td className="px-5 py-4">
                        {daysLeft > 0 ? (
                          <span className={`text-sm font-semibold ${daysLeft < 7 ? 'text-red-500' : daysLeft < 30 ? 'text-orange-500' : 'text-slate-600'}`}>{daysLeft}h</span>
                        ) : p.status !== 'completed' ? (
                          <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Selesai</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[#284074] opacity-0 group-hover:opacity-100 transition-all">
                          Buka <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppLayout>
  );
}