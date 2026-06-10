'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Search } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import { taskService } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  todo:        { label: 'To Do',       dot: 'bg-slate-400',   bg: 'bg-slate-100',   text: 'text-slate-600' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500',    bg: 'bg-blue-50',     text: 'text-blue-700' },
  review:      { label: 'Review',      dot: 'bg-violet-500',  bg: 'bg-violet-50',   text: 'text-violet-700' },
  done:        { label: 'Done',        dot: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  critical: { label: 'Critical', bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500' },
  high:     { label: 'High',     bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400' },
  low:      { label: 'Low',      bg: 'bg-emerald-50',text: 'text-emerald-600',dot: 'bg-emerald-400' },
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

const STATUS_FILTERS = ['all', 'todo', 'in_progress', 'review', 'done'];

export default function TasksPage() {
  const { hasRole } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: () => taskService.list(statusFilter !== 'all' ? { status: statusFilter } : {}).then(r => r.data.data),
  });

  const filtered = (tasks || []).filter((t: any) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: tasks?.length || 0,
    done: tasks?.filter((t: any) => t.status === 'done').length || 0,
    inProgress: tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
    overdue: tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length || 0,
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
            <p className="text-sm text-slate-400 mt-0.5">Kelola dan pantau semua task</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Task', value: stats.total, dot: 'bg-[#284074]', bg: 'bg-[#284074]/8', text: 'text-[#284074]' },
            { label: 'In Progress', value: stats.inProgress, dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Selesai', value: stats.done, dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: 'Overdue', value: stats.overdue, dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all bg-white"
              placeholder="Cari task..." />
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {STATUS_FILTERS.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${statusFilter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                  {cfg ? cfg.label : 'Semua'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Tidak ada task" subtitle="Task akan muncul setelah dibuat dari halaman board project" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Task', 'Status', 'Priority', 'Due Date', 'Progress', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((t: any, i: number) => {
                  const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.todo;
                  const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                  const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
                  const progressPct = t.estimated_hours
                    ? Math.min(100, Math.round(((t.actual_hours || 0) / t.estimated_hours) * 100))
                    : null;

                  return (
                    <motion.tr key={t.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                            {TYPE_ICON[t.type] || TYPE_ICON.task}
                          </div>
                          <div>
                            <Link href={`/tasks/${t.id}`}
                              className="text-sm font-semibold text-slate-800 hover:text-[#284074] transition-colors line-clamp-1">
                              {t.title}
                            </Link>
                            {t.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {t.due_date ? (
                          <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                            {isOverdue && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            )}
                            {isOverdue ? 'Overdue · ' : ''}{formatDate(t.due_date)}
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {progressPct !== null ? (
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-400">{t.actual_hours || 0}h</span>
                              <span className="font-semibold text-slate-600">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-[#284074]'}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/tasks/${t.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-[#284074] opacity-0 group-hover:opacity-100 transition-all">
                          Detail
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}