'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, User } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService, taskService } from '@/lib/api';
import { getStatusColor, getStatusLabel, getPriorityColor, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-100 border-slate-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
  { id: 'review', label: 'Review', color: 'bg-purple-50 border-purple-200' },
  { id: 'done', label: 'Done', color: 'bg-green-50 border-green-200' },
];

function TaskCard({ task, onMove }: { task: any; onMove: (id: string, status: string) => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:shadow-card-hover transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/tasks/${task.id}`} className="text-sm font-medium text-slate-700 group-hover:text-[#284074] leading-snug line-clamp-2">{task.title}</Link>
        <span className={`badge text-xs flex-shrink-0 border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
      </div>
      {task.due_date && <div className="text-xs text-slate-400 mb-2">{formatDate(task.due_date)}</div>}
      {task.assignee_id && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded bg-[#284074]/10 flex items-center justify-center">
            <User className="w-3 h-3 text-[#284074]" />
          </div>
          <span className="text-xs text-slate-400">Assigned</span>
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        {COLUMNS.filter(c => c.id !== task.status).map(c => (
          <button key={c.id} onClick={() => onMove(task.id, c.id)}
            className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-500 hover:border-[#284074] hover:text-[#284074] transition-colors">
            → {c.label}
          </button>
        ))}
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
  return (
    <Modal open={open} onClose={onClose} title="Buat Task Baru">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Judul Task</label>
          <input {...register('title', { required: true })} className="input-field" placeholder="Judul task..." /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
          <textarea {...register('description')} className="input-field h-16 resize-none" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select {...register('priority')} className="input-field">
              <option value="low">Low</option><option value="medium">Medium</option>
              <option value="high">High</option><option value="critical">Critical</option>
            </select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select {...register('type')} className="input-field">
              <option value="task">Task</option><option value="bug">Bug</option>
              <option value="feature">Feature</option>
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Estimasi (jam)</label>
            <input {...register('estimated_hours')} type="number" step="0.5" className="input-field" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input {...register('due_date')} type="date" className="input-field" /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary">Batal</button>
          <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? 'Membuat...' : 'Buat Task'}</button>
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

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/projects/${id}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#284074] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Project
        </Link>
        {canCreate && sprintId && (
          <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Buat Task
          </button>
        )}
      </div>

      <div className="mb-4">
        <h1 className="font-display text-2xl font-700 text-slate-900">Kanban Board</h1>
        <p className="text-sm text-slate-500 mt-1">Drag task ke kolom untuk mengubah status</p>
      </div>

      <div className="grid grid-cols-4 gap-4 overflow-x-auto">
        {columns.map(col => (
          <div key={col.id} className="min-w-[260px]">
            <div className={`rounded-xl border-2 ${col.color} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">{col.label}</span>
                <span className="badge bg-white text-slate-600 shadow-sm">{col.tasks.length}</span>
              </div>
              <div className="space-y-2 kanban-col">
                {col.tasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} onMove={(taskId, status) => moveMutation.mutate({ taskId, status })} />
                ))}
                {col.tasks.length === 0 && (
                  <div className="text-center py-8 text-slate-300 text-xs border-2 border-dashed border-slate-200 rounded-xl">Drop task di sini</div>
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
