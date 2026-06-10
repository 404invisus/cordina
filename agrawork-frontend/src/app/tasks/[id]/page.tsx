'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { CheckSquare, ChevronLeft, Clock, User, Send, Timer } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { taskService, userService } from '@/lib/api';
import { getStatusColor, getStatusLabel, getPriorityColor, formatDate, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user, hasRole } = useAuthStore();
  const [assignOpen, setAssignOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const canManage = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.show(id).then(r => r.data.data),
  });
  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => taskService.comments(id).then(r => r.data.data),
  });
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then(r => r.data.data),
    enabled: assignOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (assignee_id: string) => taskService.assign(id, assignee_id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); toast.success('Task di-assign! Notifikasi Telegram terkirim.'); setAssignOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => taskService.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); toast.success('Status diperbarui!'); },
  });

  const logTimeMutation = useMutation({
    mutationFn: (data: any) => taskService.logTime(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); toast.success('Waktu dicatat!'); setLogOpen(false); },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => taskService.addComment(id, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', id] }); setComment(''); toast.success('Komentar ditambahkan!'); },
  });

  const { register: regLog, handleSubmit: handleLog } = useForm();

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  const statuses = ['todo', 'in_progress', 'review', 'done'];
  const canUpdateStatus = canManage || task?.assignee_id === user?.id;

  return (
    <AppLayout>
      <div className="mb-4">
        <Link href="/tasks" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#284074]">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Tasks
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-display text-2xl font-700 text-slate-900">{task?.title}</h1>
              <div className="flex gap-2 flex-shrink-0">
                <span className={`badge ${getStatusColor(task?.status)}`}>{getStatusLabel(task?.status)}</span>
                <span className={`badge border ${getPriorityColor(task?.priority)}`}>{task?.priority}</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">{task?.description || 'Tidak ada deskripsi'}</p>
            {canUpdateStatus && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-slate-400 self-center">Ubah status:</span>
                {statuses.filter(s => s !== task?.status).map(s => (
                  <button key={s} onClick={() => updateStatusMutation.mutate(s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors hover:border-[#284074] hover:text-[#284074] ${getStatusColor(s)}`}>
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h3 className="font-display font-600 text-slate-800 mb-4">Komentar ({comments?.length || 0})</h3>
            <div className="space-y-4 mb-4">
              {comments?.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#284074]/10 flex items-center justify-center text-xs font-600 text-[#284074] flex-shrink-0">
                    {(c.author_name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700">{c.author_name || 'User'}</span>
                      <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                    </div>
                    <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#284074] flex items-center justify-center text-white text-xs font-600 flex-shrink-0">
                {(user?.full_name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && comment.trim() && commentMutation.mutate(comment)}
                  placeholder="Tambah komentar... (Enter untuk kirim)"
                  className="input-field flex-1 text-sm" />
                <button onClick={() => comment.trim() && commentMutation.mutate(comment)}
                  className="btn-primary px-3 py-2"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-display font-600 text-slate-800 mb-4">Detail</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Type</span>
                <span className="font-medium capitalize">{task?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date</span>
                <span className="font-medium">{task?.due_date ? formatDate(task.due_date) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimasi</span>
                <span className="font-mono font-medium">{task?.estimated_hours || 0}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Aktual</span>
                <span className="font-mono font-medium">{task?.actual_hours || 0}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dibuat</span>
                <span className="font-medium">{task?.created_at ? timeAgo(task.created_at) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-600 text-slate-800">Assignee</h3>
              {canManage && (
                <button onClick={() => setAssignOpen(true)} className="text-xs text-[#284074] font-medium">Assign →</button>
              )}
            </div>
            {task?.assignee_id ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#284074] text-white flex items-center justify-center text-xs font-600">AS</div>
                <span className="text-sm text-slate-700">Assigned</span>
              </div>
            ) : (
              <div className="text-sm text-slate-400">Belum ada assignee</div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setLogOpen(true)} className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm">
              <Timer className="w-4 h-4" /> Log Waktu
            </button>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Task" size="sm">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {users?.map((u: any) => (
            <button key={u.id} onClick={() => assignMutation.mutate(u.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#284074] text-white flex items-center justify-center text-xs font-600">
                {u.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">{u.full_name}</div>
                <div className="text-xs text-slate-400">{u.roles?.[0]}</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Log Time Modal */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log Waktu" size="sm">
        <form onSubmit={handleLog(d => logTimeMutation.mutate(d))} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Jam Dikerjakan</label>
            <input {...regLog('logged_hours', { required: true, min: 0.25, max: 24 })} type="number" step="0.25" className="input-field" placeholder="2.5" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea {...regLog('description')} className="input-field h-16 resize-none" placeholder="Kerjakan apa..." /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input {...regLog('logged_at')} type="date" className="input-field" defaultValue={new Date().toISOString().split('T')[0]} /></div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setLogOpen(false)} className="flex-1 btn-secondary">Batal</button>
            <button type="submit" className="flex-1 btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
