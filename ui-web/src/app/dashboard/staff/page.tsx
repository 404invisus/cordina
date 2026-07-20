'use client';
import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { taskService } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, getPriorityColor, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-amber-400', low: 'bg-green-400',
};

const COLS = [
  { key: 'todo',        label: 'To Do',       dot: 'bg-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  { key: 'in_progress', label: 'In Progress',  dot: 'bg-blue-500',    bg: 'bg-blue-50/50', border: 'border-blue-100'  },
  { key: 'done',        label: 'Done',         dot: 'bg-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
];

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', 'mine', user?.id],
    queryFn: () => taskService.list({ assignee_id: user?.id }).then(r => r.data.data),
    enabled: !!user?.id,
  });

  if (isLoading) return <LoadingSpinner />;

  const todo       = tasks?.filter((t: any) => t.status === 'todo') || [];
  const inProgress = tasks?.filter((t: any) => t.status === 'in_progress') || [];
  const done       = tasks?.filter((t: any) => t.status === 'done') || [];
  const overdue    = tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done') || [];

  const grouped: Record<string, any[]> = { todo, in_progress: inProgress, done: done.slice(0, 8) };

  const stats = [
    { label: 'To Do',      value: todo.length,       color: 'text-slate-600',   bg: 'bg-slate-100',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-slate-500"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { label: 'In Progress', value: inProgress.length, color: 'text-blue-600',    bg: 'bg-blue-50',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-blue-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Selesai',    value: done.length,        color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-emerald-500"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg> },
    { label: 'Overdue',    value: overdue.length,     color: 'text-red-600',     bg: 'bg-red-50',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Halo, {user?.full_name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Ini task-task yang perlu kamu selesaikan</p>
          </div>
        </div>
        <Link href="/tasks"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Semua Task
        </Link>
      </div>

      <CRSummaryCard />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {overdue.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-500 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-red-700">
              {overdue.length} task melewati deadline
            </span>
            <span className="text-xs text-red-400 ml-2">Segera selesaikan!</span>
          </div>
          <Link href="/tasks" className="text-xs font-bold text-red-600 hover:underline flex-shrink-0">Lihat →</Link>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {COLS.map((col, ci) => (
          <motion.div key={col.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 + ci * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-bold text-slate-700">{col.label}</span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {grouped[col.key].length}
                </span>
              </div>
              <Link href="/tasks" className="text-xs text-slate-400 hover:text-[#284074] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>

            <div className="p-3 space-y-2 flex-1">
              {grouped[col.key].map((t: any, i: number) => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
                return (
                  <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 + ci * 0.08 + i * 0.04 }}>
                    <Link href={`/tasks/${t.id}`}
                      className="block p-3 rounded-xl border border-slate-100 hover:border-[#284074]/20 hover:bg-slate-50/80 transition-all group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-[#284074] leading-snug transition-colors line-clamp-2">{t.title}</span>
                        {t.priority && (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${PRIORITY_DOT[t.priority] || 'bg-slate-300'}`} />
                        )}
                      </div>
                      {t.due_date && (
                        <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {isOverdue && <span className="font-semibold">Overdue · </span>}
                          {formatDate(t.due_date)}
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              {grouped[col.key].length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mb-2">
                    <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <span className="text-xs">Kosong</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
