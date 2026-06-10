'use client';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Clock, CheckCircle2, AlertCircle, ArrowRight, Timer } from 'lucide-react';
import Link from 'next/link';
import { taskService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, getPriorityColor, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', 'mine', user?.id],
    queryFn: () => taskService.list({ assignee_id: user?.id }).then(r => r.data.data),
    enabled: !!user?.id,
  });

  if (isLoading) return <LoadingSpinner />;

  const todo = tasks?.filter((t: any) => t.status === 'todo') || [];
  const inProgress = tasks?.filter((t: any) => t.status === 'in_progress') || [];
  const done = tasks?.filter((t: any) => t.status === 'done') || [];
  const overdue = tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done') || [];

  return (
    <div>
      <PageHeader title={`Halo, ${user?.full_name?.split(' ')[0]}! 👋`} subtitle="Ini task-task yang perlu kamu selesaikan" icon={CheckSquare} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="To Do" value={todo.length} icon={Clock} color="blue" index={0} />
        <StatCard title="In Progress" value={inProgress.length} icon={Timer} color="orange" index={1} />
        <StatCard title="Selesai" value={done.length} icon={CheckCircle2} color="green" index={2} />
        <StatCard title="Overdue" value={overdue.length} icon={AlertCircle} color="red" index={3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {[
          { label: 'To Do', items: todo, color: 'bg-slate-100' },
          { label: 'In Progress', items: inProgress, color: 'bg-blue-50' },
          { label: 'Done', items: done.slice(0, 5), color: 'bg-green-50' },
        ].map(col => (
          <div key={col.label} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-600 text-slate-800">{col.label}</h2>
                <span className="badge bg-slate-100 text-slate-600">{col.items.length}</span>
              </div>
              <Link href="/tasks" className="text-xs text-[#284074]">Lihat <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            <div className="space-y-2">
              {col.items.map((t: any) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="block p-3 rounded-xl border border-slate-100 hover:border-[#284074]/20 hover:bg-slate-50 transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm text-slate-700 group-hover:text-[#284074] leading-snug">{t.title}</span>
                    <span className={`badge text-xs flex-shrink-0 ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                  </div>
                  {t.due_date && <div className="text-xs text-slate-400">{formatDate(t.due_date)}</div>}
                </Link>
              ))}
              {col.items.length === 0 && <div className="text-center py-6 text-slate-400 text-xs">Kosong</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
