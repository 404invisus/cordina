'use client';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, CheckSquare, Users, BarChart3, ArrowRight, Plus, Clock } from 'lucide-react';
import Link from 'next/link';
import { projectService, taskService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, getPriorityColor, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function ProjectManagerDashboard() {
  const { user } = useAuthStore();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });
  const { data: myTasks } = useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => taskService.list({ assignee_id: user?.id }).then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const todoTasks = myTasks?.filter((t: any) => t.status === 'todo') || [];
  const inProgressTasks = myTasks?.filter((t: any) => t.status === 'in_progress') || [];

  return (
    <div>
      <PageHeader
        title="Dashboard Project Manager"
        subtitle="Kelola sprint dan distribusi task tim"
        icon={FolderKanban}
        actions={
          <Link href="/projects" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Sprint
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Projects" value={projects?.length || 0} icon={FolderKanban} color="blue" index={0} />
        <StatCard title="Task Saya" value={myTasks?.length || 0} icon={CheckSquare} color="green" index={1} />
        <StatCard title="In Progress" value={inProgressTasks.length} icon={Clock} color="orange" index={2} />
        <StatCard title="To Do" value={todoTasks.length} icon={BarChart3} color="purple" index={3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-slate-800">Projects</h2>
            <Link href="/projects" className="text-sm text-[#284074] font-medium flex items-center gap-1">Lihat semua <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="space-y-3">
            {projects?.slice(0, 5).map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group">
                <div>
                  <div className="text-sm font-medium text-slate-800 group-hover:text-[#284074]">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.division}</div>
                </div>
                <span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-slate-800">Task Saya</h2>
            <Link href="/tasks" className="text-sm text-[#284074] font-medium flex items-center gap-1">Semua <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="space-y-2">
            {myTasks?.slice(0, 6).map((t: any) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority === 'high' || t.priority === 'critical' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-700 truncate group-hover:text-[#284074]">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.due_date ? formatDate(t.due_date) : 'No due date'}</div>
                </div>
                <span className={`badge ${getStatusColor(t.status)}`}>{getStatusLabel(t.status)}</span>
              </Link>
            ))}
            {(!myTasks || myTasks.length === 0) && <div className="text-center py-6 text-slate-400 text-sm">Tidak ada task</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
