'use client';
import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ListTodo, Clock, CheckSquare, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { taskService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-danger',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-success',
};

const COLS = [
  { key: 'todo', label: 'To Do', dot: '#8a8f98', bg: '#f1f0ed' },
  { key: 'in_progress', label: 'In Progress', dot: '#14406a', bg: '#eaf1f8' },
  { key: 'done', label: 'Done', dot: '#137a52', bg: '#e9f4ee' },
];

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', 'mine', user?.id],
    queryFn: () => taskService.list({ assignee_id: user?.id }).then((r) => r.data.data),
    enabled: !!user?.id,
  });

  if (isLoading) return <LoadingSpinner />;

  const todo = tasks?.filter((t: any) => t.status === 'todo') || [];
  const inProgress = tasks?.filter((t: any) => t.status === 'in_progress') || [];
  const done = tasks?.filter((t: any) => t.status === 'done') || [];
  const overdue = tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done') || [];

  const grouped: Record<string, any[]> = { todo, in_progress: inProgress, done: done.slice(0, 8) };

  return (
    <div className="space-y-6">
      <PageHeader
        section="OVERVIEW"
        title={`Hello, ${user?.full_name}`}
        subtitle="Tasks assigned to you"
        actions={
          <Link
            href="/tasks"
            className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            <ListTodo className="w-3 h-3" />
            All Tasks
          </Link>
        }
      />

      <CRSummaryCard />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="To Do" value={todo.length} icon={ListTodo} color="brand" index={0} />
        <StatCard title="In Progress" value={inProgress.length} icon={Clock} color="brand" index={1} />
        <StatCard title="Completed" value={done.length} icon={CheckSquare} color="green" index={2} />
        <StatCard title="Overdue" value={overdue.length} icon={AlertTriangle} color="red" index={3} />
      </div>

      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-border rounded-[6px] px-[15px] py-[11px] flex items-center gap-[12px]"
          style={{ borderLeft: '3px solid #b3261e' }}
        >
          <AlertTriangle className="w-[14px] h-[14px] text-danger flex-none" />
          <div className="flex-1 min-w-0">
            <span className="text-[12.5px] font-semibold text-navy-800">
              {overdue.length} task{overdue.length !== 1 ? 's' : ''}{' '}
            </span>
            <span className="text-[12px] text-text-tertiary">past their deadline</span>
          </div>
          <Link href="/tasks" className="text-[11.5px] font-bold text-danger hover:underline flex-none flex items-center gap-1">
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {COLS.map((col, ci) => (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 + ci * 0.08 }}
            className="bg-white border border-border rounded-[6px] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3.5 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                <span className="text-[12.5px] font-semibold text-navy-900">{col.label}</span>
                <span
                  className="font-mono text-[10px] font-semibold px-[6px] py-[1px] rounded-[3px]"
                  style={{ background: col.bg, color: col.dot }}
                >
                  {grouped[col.key].length}
                </span>
              </div>
              <Link href="/tasks" className="text-text-placeholder hover:text-navy-700 transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-3 flex flex-col gap-2 flex-1">
              {grouped[col.key].map((t: any, i: number) => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.36 + ci * 0.08 + i * 0.04 }}
                  >
                    <Link
                      href={`/tasks/${t.id}`}
                      className="block p-3 rounded-[6px] border border-border hover:border-navy-700 hover:bg-surface-2 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[12px] font-semibold text-navy-800 group-hover:text-navy-700 leading-snug transition-colors line-clamp-2">
                          {t.title}
                        </span>
                        {t.priority && (
                          <span className={`w-2 h-2 rounded-full flex-none mt-1 ${PRIORITY_DOT[t.priority] || 'bg-text-meta'}`} />
                        )}
                      </div>
                      {t.due_date && (
                        <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-danger' : 'text-text-placeholder'}`}>
                          <Calendar className="w-3 h-3 flex-none" />
                          {isOverdue && <span className="font-semibold">Overdue · </span>}
                          {formatDate(t.due_date)}
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              {grouped[col.key].length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-text-meta">
                  <CheckSquare className="w-7 h-7 mb-2 opacity-40" />
                  <span className="text-[11px]">Empty</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
