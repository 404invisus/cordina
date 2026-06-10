'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ChevronLeft, Send, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { taskService, userService, projectService, adminUserService } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; bar: string }> = {
  todo:        { label: 'To Do',       dot: 'bg-slate-400',   bg: 'bg-slate-100',  text: 'text-slate-600',  bar: 'bg-slate-400' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700',   bar: 'bg-blue-500' },
  review:      { label: 'Review',      dot: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-700', bar: 'bg-violet-500' },
  done:        { label: 'Done',        dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700',bar: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  critical: { label: 'Critical', bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500' },
  high:     { label: 'High',     bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400' },
  low:      { label: 'Low',      bg: 'bg-emerald-50',text: 'text-emerald-600',dot: 'bg-emerald-400' },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  bug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-400">
      <path d="M8 2l1.5 1.5M15.5 2L14 3.5M12 4a5 5 0 015 5v3a5 5 0 01-10 0V9a5 5 0 015-5z"/>
      <path d="M7.5 7.5L5 5M16.5 7.5L19 5M7 13H4M20 13h-3M8 18l-2 2M16 18l2 2"/>
    </svg>
  ),
  feature: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-400">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  task: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
};

function Avatar({ name, size = 'md', color = 'default' }: { name: string; size?: 'sm'|'md'|'lg'; color?: string }) {
  const s = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`${s[size]} rounded-xl bg-gradient-to-br from-[#284074] to-[#3d5a9e] text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user, hasRole, hasPermission } = useAuthStore();
  const [assignOpen, setAssignOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<any[]>([]);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const canManage = hasPermission('task.edit_all');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.show(id).then(r => r.data.data),
  });
  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => taskService.comments(id).then(r => r.data.data),
  });
  const projectId = task?.project_id;
  const { data: projectMembers } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => projectService.members(projectId).then(r => r.data.data),
    enabled: !!projectId,
  });
  const users = projectMembers?.map((m: any) => ({
    id: m.user_id,
    full_name: m.full_name || m.email || m.user_id,
    roles: [m.role],
    division: m.division,
  })) || [];

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assignInitialized, setAssignInitialized] = useState(false);

  const assignMutation = useMutation({
    mutationFn: (assignee_ids: string[]) => taskService.update(id, { assignee_ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); toast.success('Task di-assign!'); setAssignOpen(false); setSelectedAssignees([]); },
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
    mutationFn: (content: string) => taskService.addComment(id, {
      content,
      mentions: mentionedUsers.map((u: any) => u.id),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', id] }); setComment(''); setMentionedUsers([]); },
  });
  
  const { data: allUsers } = useQuery({
    queryKey: ['all-users-list'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then(r => r.data.data || []),
  });

  const resolveUser = (uid: string) =>
    users.find((u: any) => u.id === uid) ||
    (allUsers || []).find((u: any) => u.id === uid) ||
    (uid === task?.assignee_id ? assigneeUser : null);

  const { data: assigneeUser } = useQuery({
    queryKey: ['user', task?.assignee_id],
    queryFn: () => userService.show(task.assignee_id).then(r => r.data.data),
    enabled: !!task?.assignee_id,
});

  const { register: regLog, handleSubmit: handleLog } = useForm();

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  const status = STATUS_CONFIG[task?.status] || STATUS_CONFIG.todo;
  const priority = PRIORITY_CONFIG[task?.priority] || PRIORITY_CONFIG.medium;
  const progressPct = task?.estimated_hours
    ? Math.min(100, Math.round(((task.actual_hours || 0) / task.estimated_hours) * 100))
    : 0;
  const isOverdue = task?.due_date && new Date(task.due_date) < new Date() && task?.status !== 'done';
  const canUpdateStatus = canManage || task?.assignee_id === user?.id;
  const statuses = ['todo', 'in_progress', 'review', 'done'];

  return (
    <AppLayout>
      <div className="mb-5">
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#284074] transition-colors font-medium">
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Tasks
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#284074] to-[#3d5a9e]" />
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {TYPE_ICON[task?.type] || TYPE_ICON.task}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-xl font-bold text-slate-900 leading-snug">{task?.title}</h1>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {task?.description || 'Tidak ada deskripsi untuk task ini.'}
                  </p>
                </div>
              </div>

              {task?.estimated_hours > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Progress Pengerjaan</span>
                    <span className="text-xs font-bold text-slate-700">{task.actual_hours || 0}h / {task.estimated_hours}h</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#284074] to-[#3d5a9e]'}`}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-slate-400">0h</span>
                    <span className={`text-xs font-semibold ${progressPct >= 100 ? 'text-emerald-600' : 'text-[#284074]'}`}>{progressPct}%</span>
                  </div>
                </div>
              )}

              {canUpdateStatus && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ubah status:</span>
                  {statuses.filter(s => s !== task?.status).map(s => {
                    const sc = STATUS_CONFIG[s];
                    return (
                      <button key={s} onClick={() => updateStatusMutation.mutate(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:shadow-sm ${sc.bg} ${sc.text} border-transparent hover:border-current`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Komentar
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{comments?.length || 0}</span>
              </h3>
            </div>

            <div className="space-y-4 mb-5">
              <AnimatePresence>
                {comments?.map((c: any, i: number) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex gap-3">
                    <Avatar name={c.author_name || 'User'} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-slate-700">{c.author_name || 'User'}</span>
                        <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                      </div>
                      <div className="text-sm text-slate-600 bg-slate-50 rounded-xl rounded-tl-sm px-4 py-3 leading-relaxed border border-slate-100">
                        {c.content.split(/(@\w[\w\s]*)/g).map((part: string, i: number) =>
                          part.startsWith('@') ? (
                            <span key={i} className="text-[#284074] font-semibold bg-[#284074]/8 px-1 rounded">{part}</span>
                          ) : part
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {(!comments || comments.length === 0) && (
                <div className="text-center py-8 text-slate-300 text-sm">Belum ada komentar</div>
              )}
            </div>

            <div className="flex gap-3 items-start">
              <Avatar name={user?.full_name || 'U'} size="sm" />
              <div className="flex-1 relative">
                {showMentions && mentionQuery && (
                  <div className="absolute bottom-full mb-1 left-0 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden">
                    {(users || [])
                      .filter((u: any) => u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()) && u.id !== user?.id)
                      .slice(0, 5)
                      .map((u: any) => (
                        <button key={u.id} onMouseDown={e => {
                          e.preventDefault();
                          const before = comment.slice(0, comment.lastIndexOf('@'));
                          setComment(before + '@' + u.full_name + ' ');
                          setMentionedUsers(prev => prev.find(p => p.id === u.id) ? prev : [...prev, u]);
                          setShowMentions(false);
                          setMentionQuery('');
                          commentRef.current?.focus();
                        }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left">
                          <div className="w-7 h-7 rounded-lg bg-[#284074]/10 flex items-center justify-center text-[#284074] text-xs font-bold flex-shrink-0">
                            {u.full_name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{u.full_name}</div>
                            {u.division && <div className="text-xs text-slate-400">{u.division}</div>}
                          </div>
                        </button>
                      ))}
                    {(users || []).filter((u: any) => u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()) && u.id !== user?.id).length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-400">User tidak ditemukan</div>
                    )}
                  </div>
                )}
                {mentionedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {mentionedUsers.map((u: any) => (
                      <span key={u.id} className="inline-flex items-center gap-1 bg-[#284074]/10 text-[#284074] text-xs font-semibold px-2 py-0.5 rounded-full">
                        @{u.full_name}
                        <button onClick={() => setMentionedUsers(prev => prev.filter(p => p.id !== u.id))} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={commentRef}
                    value={comment}
                    rows={2}
                    onChange={e => {
                      const val = e.target.value;
                      setComment(val);
                      const atIndex = val.lastIndexOf('@');
                      if (atIndex !== -1 && atIndex === val.length - 1 - (val.length - 1 - atIndex)) {
                        const query = val.slice(atIndex + 1);
                        if (!query.includes(' ')) {
                          setMentionQuery(query);
                          setShowMentions(true);
                        } else {
                          setShowMentions(false);
                        }
                      } else if (!val.includes('@')) {
                        setShowMentions(false);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                        e.preventDefault();
                        commentMutation.mutate(comment);
                      }
                      if (e.key === 'Escape') setShowMentions(false);
                    }}
                    placeholder="Tulis komentar... ketik @ untuk mention (Enter kirim, Shift+Enter baris baru)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all resize-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => comment.trim() && commentMutation.mutate(comment)}
                    disabled={!comment.trim() || commentMutation.isPending}
                    className="w-10 h-10 rounded-xl bg-[#284074] text-white flex items-center justify-center hover:bg-[#1e3060] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Detail Task</h3>
            <div className="space-y-3">
              {[
                {
                  label: 'Type', value: (
                    <div className="flex items-center gap-1.5">
                      {TYPE_ICON[task?.type] || TYPE_ICON.task}
                      <span className="capitalize text-sm font-medium text-slate-700">{task?.type || '—'}</span>
                    </div>
                  )
                },
                {
                  label: 'Due Date', value: (
                    <span className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-slate-700'}`}>
                      {task?.due_date ? formatDate(task.due_date) : '—'}
                      {isOverdue && ' · Overdue'}
                    </span>
                  )
                },
                { label: 'Estimasi', value: <span className="text-sm font-mono font-semibold text-slate-700">{task?.estimated_hours || 0}h</span> },
                { label: 'Aktual', value: <span className="text-sm font-mono font-semibold text-slate-700">{task?.actual_hours || 0}h</span> },
                { label: 'Dibuat', value: <span className="text-sm text-slate-500">{task?.created_at ? timeAgo(task.created_at) : '—'}</span> },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                  {item.value}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Assignee</h3>
              {canManage && (
                <button onClick={() => { setSelectedAssignees((task?.assignee_ids || [task?.assignee_id]).filter(Boolean)); setAssignOpen(true); }}
                  className="text-xs font-semibold text-[#284074] hover:text-[#1e3060] flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" />
                  Assign
                </button>
              )}
            </div>
            {(task?.assignee_ids?.length > 0 || task?.assignee_id) ? (
              <div className="space-y-1.5">
                {(task?.assignee_ids?.length > 0 ? task.assignee_ids : [task.assignee_id]).map((uid: string, idx: number) => {
                  const u = resolveUser(uid);
                  const name = u?.full_name || 'Loading...';
                  return (
                    <div key={uid} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Avatar name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{name}</div>
                        <div className="text-xs text-slate-400">{idx === 0 ? 'Assignee' : 'Co-assignee'}</div>
                      </div>
                      {canManage && (
                        <button onClick={() => {
                          taskService.removeAssignee(id, uid)
                            .then(() => { qc.invalidateQueries({ queryKey: ['task', id] }); toast.success('Assignee dihapus'); })
                            .catch(() => toast.error('Gagal hapus assignee'));
                        }}
                          className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-5 text-center">
                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-slate-300">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p className="text-xs text-slate-400 font-medium">Belum ada assignee</p>
              </div>
            )}

          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setLogOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 hover:border-[#284074]/30 hover:text-[#284074] hover:bg-[#284074]/5 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Log Waktu
          </motion.button>
        </div>
      </div>

      {assignOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900">Assign Task</h2>
              <p className="text-xs text-slate-400 mt-0.5">Pilih anggota tim untuk task ini</p>
            </div>
            <button onClick={() => { setAssignOpen(false); setSelectedAssignees([]); }} className="p-2 hover:bg-slate-100 rounded-xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
          {users?.map((u: any) => {
            const isSelected = selectedAssignees.includes(u.id);
            // DEBUG: console.log('selectedAssignees', selectedAssignees, 'u.id', u.id, 'isSelected', isSelected);
            return (
            <motion.button key={u.id} whileHover={{ x: 2 }} onClick={() => {
              setSelectedAssignees(prev => {
                const next = prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id];
                console.log('TOGGLE', u.id, 'prev:', prev, 'next:', next);
                return next;
              });
            }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors group ${isSelected ? 'bg-[#284074]/8 border border-[#284074]/20' : 'hover:bg-slate-50'}`}>
              <Avatar name={u.full_name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold transition-colors ${isSelected ? 'text-[#284074]' : 'text-slate-700 group-hover:text-[#284074]'}`}>{u.full_name}</div>
                <div className="text-xs text-slate-400 capitalize">{u.roles?.[0]?.replace('_', ' ')}</div>
              </div>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#284074] border-[#284074]' : 'border-slate-300'}`}>
                {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            </motion.button>
            );
          })}
          </div>
          <div className="flex gap-2 p-4 border-t border-slate-100">
            <button onClick={() => { setAssignOpen(false); setSelectedAssignees([]); }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button onClick={() => assignMutation.mutate(selectedAssignees)}
              disabled={assignMutation.isPending || selectedAssignees.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] disabled:opacity-50">
              {assignMutation.isPending ? 'Menyimpan...' : `Simpan (${selectedAssignees.length})`}
            </button>
          </div>
        </div>
      </div>
      )}

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log Waktu" subtitle="Catat jam pengerjaan task ini" size="sm">
        <form onSubmit={handleLog(d => logTimeMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jam Dikerjakan</label>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <input {...regLog('logged_hours', { required: true, min: 0.25, max: 24 })}
                type="number" step="0.25"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
                placeholder="2.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi</label>
            <textarea {...regLog('description')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all resize-none h-20"
              placeholder="Apa yang dikerjakan..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tanggal</label>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input {...regLog('logged_at')} type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setLogOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] transition-colors flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}