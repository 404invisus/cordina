'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService, taskService, epicService } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       bg: 'bg-slate-50',      border: 'border-slate-200/80', dot: 'bg-slate-400',   header: 'text-slate-600',  count: 'bg-slate-200 text-slate-600' },
  { id: 'in_progress', label: 'In Progress', bg: 'bg-blue-50/40',    border: 'border-blue-200/80',  dot: 'bg-blue-500',    header: 'text-blue-700',   count: 'bg-blue-100 text-blue-700' },
  { id: 'review',      label: 'Review',      bg: 'bg-violet-50/40',  border: 'border-violet-200/80',dot: 'bg-violet-500',  header: 'text-violet-700', count: 'bg-violet-100 text-violet-700' },
  { id: 'done',        label: 'Done',        bg: 'bg-emerald-50/40', border: 'border-emerald-200/80',dot:'bg-emerald-500', header: 'text-emerald-700',count: 'bg-emerald-100 text-emerald-700' },
];

const PRIORITY: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-600',    bg: 'bg-red-50',    dot: 'bg-red-500' },
  high:     { label: 'High',     color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   color: 'text-amber-600',  bg: 'bg-amber-50',  dot: 'bg-amber-400' },
  low:      { label: 'Low',      color: 'text-emerald-600',bg: 'bg-emerald-50',dot: 'bg-emerald-400' },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  bug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-red-400">
      <path d="M8 2l1.5 1.5M15.5 2L14 3.5M12 4a5 5 0 015 5v3a5 5 0 01-10 0V9a5 5 0 015-5z"/>
      <path d="M7.5 7.5L5 5M16.5 7.5L19 5M7 13H4M20 13h-3M8 18l-2 2M16 18l2 2"/>
    </svg>
  ),
  feature: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-blue-400">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  task: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-400">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
};

function TaskCard({ task, onMove, colId }: { task: any; onMove: (id: string, status: string) => void; colId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && colId !== 'done';
  const progressPct = task.estimated_hours && task.actual_hours
    ? Math.min(100, Math.round((task.actual_hours / task.estimated_hours) * 100))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent`} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
              {TYPE_ICON[task.type] || TYPE_ICON.task}
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${p.bg} ${p.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              {p.label}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
              </svg>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="absolute right-0 top-8 z-20 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 py-1.5 w-40 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pindah ke</div>
                    {COLUMNS.filter(c => c.id !== colId).map(c => (
                      <button key={c.id} onClick={() => { onMove(task.id, c.id); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        {c.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Link href={`/tasks/${task.id}`} className="block mb-3 group/link">
          <p className="text-sm font-semibold text-slate-800 group-hover/link:text-[#284074] leading-snug transition-colors line-clamp-2">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
        </Link>

        {progressPct !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-[#284074]'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
          <div className="flex items-center gap-2.5">
            {task.due_date && (
              <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                {isOverdue ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                )}
                {isOverdue ? 'Overdue' : formatDate(task.due_date)}
              </div>
            )}
            {task.estimated_hours && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {task.estimated_hours}h
              </div>
            )}
          </div>

          {task.assignee_id ? (
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#284074] to-[#3d5a9e] flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-white">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-slate-300">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateTaskModal({ open, onClose, sprintId, projectId }: any) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => taskService.create({ ...data, sprint_id: sprintId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['board', projectId] }); toast.success('Task dibuat!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });
  const { data: epics } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => epicService.list(projectId).then(r => r.data.data),
    enabled: open,
  });
  const { data: members } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => projectService.members(projectId).then(r => r.data.data),
    enabled: open,
  });

  return (
    <Modal open={open} onClose={onClose} title="Buat Task Baru" subtitle="Tambahkan task ke sprint aktif" size="md">
  <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-5">
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Judul Task</label>
      <input
        {...register('title', { required: true })}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
        placeholder="Deskripsikan task secara singkat..."
      />
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi</label>
      <textarea
        {...register('description')}
        rows={3}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all resize-none"
        placeholder="Detail tambahan tentang task ini..."
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
        <div className="relative">
          <select
            {...register('priority')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
        <div className="relative">
          <select
            {...register('type')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="task">Task</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estimasi (jam)</label>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <input
            {...register('estimated_hours')}
            type="number" step="0.5" min="0"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            {...register('due_date')}
            type="date"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
          />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Epic</label>
        <div className="relative">
          <select {...register('epic_id')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white cursor-pointer">
            <option value="">— Tanpa Epic —</option>
            {(epics || []).map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assignee</label>
        <div className="relative">
          <select {...register('assignee_id')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white cursor-pointer">
            <option value="">— Pilih Assignee —</option>
            {(members || []).map((m: any) => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email || m.user_id}</option>)}
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
    </div>

    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onClose}
        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
        Batal
      </button>
      <button type="submit" disabled={isPending}
        className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e3060] disabled:opacity-60 transition-colors">
        {isPending
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Membuat...</>
          : <><Plus className="w-4 h-4" />Buat Task</>
        }
      </button>
    </div>
  </form>
</Modal>
  );
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sprintId = searchParams.get('sprint_id') || '';
  const qc = useQueryClient();
  const { hasRole } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', id, sprintId],
    queryFn: () => projectService.board(id, sprintId || undefined).then(r => r.data.data),
  });

  const moveMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => taskService.move(taskId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', id] }),
    onError: () => toast.error('Gagal memindahkan task'),
  });

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  const columns = COLUMNS.map(col => ({
    ...col,
    tasks: (board?.tasks || []).filter((t: any) => t.status === col.id),
  }));

  const totalTasks = board?.tasks?.length || 0;
  const doneTasks = columns.find(c => c.id === 'done')?.tasks.length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#284074] transition-colors font-medium">
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Project
          </Link>
          {canCreate && sprintId && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm text-[#284074]">
              <Plus className="w-4 h-4" />
              Buat Task
            </motion.button>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {totalTasks} task total · hover kartu untuk pindah status
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm">
            {columns.map((col, i) => (
              <div key={col.id} className="flex items-center gap-1.5">
                {i > 0 && <div className="w-px h-3 bg-slate-200 mx-1" />}
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs text-slate-500">{col.label}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${col.count}`}>{col.tasks.length}</span>
              </div>
            ))}
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-[#284074] to-[#3d5a9e]"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-sm font-bold text-slate-700">{progress}%</span>
              <span className="text-xs text-slate-400">selesai</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {columns.map(col => (
          <div key={col.id} className="flex-shrink-0 w-[300px] flex flex-col">
            <div className={`rounded-2xl border ${col.border} ${col.bg} flex flex-col flex-1`}>
              <div className="px-4 pt-4 pb-3.5 flex items-center justify-between border-b border-white/60">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${col.dot}`} />
                  <span className={`text-sm font-bold ${col.header}`}>{col.label}</span>
                </div>
                <span className={`min-w-6 h-6 px-2 rounded-lg text-xs font-bold flex items-center justify-center ${col.count}`}>
                  {col.tasks.length}
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                <AnimatePresence mode="popLayout">
                  {col.tasks.map((task: any) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      colId={col.id}
                      onMove={(taskId, status) => moveMutation.mutate({ taskId, status })}
                    />
                  ))}
                </AnimatePresence>

                {col.tasks.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/70 border-2 border-dashed border-slate-200 flex items-center justify-center mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-slate-300">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Tidak ada task</p>
                  </div>
                )}

                {canCreate && col.id === 'todo' && sprintId && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCreateOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-slate-200 text-xs font-semibold text-slate-400 hover:border-[#284074]/30 hover:text-[#284074] hover:bg-white/80 transition-all mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah task
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} sprintId={sprintId} projectId={id} />
    </AppLayout>
  );
}