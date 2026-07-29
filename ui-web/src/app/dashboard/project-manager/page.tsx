'use client';
import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FolderKanban, CheckSquare, Clock, ListTodo, Plus, ArrowRight } from 'lucide-react';
import { projectService, taskService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusTone, getStatusLabel, STATUS_MAP } from '@/lib/status';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-danger',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-success',
};

export default function ProjectManagerDashboard() {
  const { user } = useAuthStore();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then((r) => r.data.data),
  });
  const { data: myTasks } = useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => taskService.list({ assignee_id: user?.id }).then((r) => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const inProgress = myTasks?.filter((t: any) => t.status === 'in_progress') || [];
  const todo = myTasks?.filter((t: any) => t.status === 'todo') || [];
  const done = myTasks?.filter((t: any) => t.status === 'done') || [];
  const activeProjects = projects?.filter((p: any) => p.status === 'active') || [];

  return (
    <div className="space-y-6">
      <PageHeader
        section="OVERVIEW"
        title="Dashboard"
        subtitle={`Welcome, ${user?.full_name}`}
        actions={
          <Link
            href="/projects"
            className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            New Sprint
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={projects?.length || 0}
          icon={FolderKanban}
          color="brand"
          index={0}
          subtitle={`${activeProjects.length} active`}
        />
        <StatCard
          title="My Tasks"
          value={myTasks?.length || 0}
          icon={CheckSquare}
          color="green"
          index={1}
          subtitle={`${done.length} completed`}
        />
        <StatCard title="In Progress" value={inProgress.length} icon={Clock} color="brand" index={2} subtitle="being worked on" />
        <StatCard title="To Do" value={todo.length} icon={ListTodo} color="brand" index={3} subtitle="waiting to start" />
      </div>

      <CRSummaryCard />

      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-border rounded-[6px] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-navy-700" />
              <h2 className="text-[12.5px] font-semibold text-navy-900">Projects</h2>
            </div>
            <Link href="/projects" className="text-[11.5px] font-semibold text-navy-700 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {projects?.slice(0, 5).map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-[4px] bg-info-soft flex items-center justify-center flex-none text-navy-700 text-[10px] font-bold">
                      {p.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-navy-800 group-hover:text-navy-700 transition-colors truncate">
                        {p.name}
                      </div>
                      {p.division && <div className="text-[11px] text-text-placeholder">{p.division}</div>}
                    </div>
                  </div>
                  <span
                    className={`flex-none text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ml-3 ${STATUS_MAP[getStatusTone(p.status)].bg} ${STATUS_MAP[getStatusTone(p.status)].text}`}
                  >
                    {getStatusLabel(p.status)}
                  </span>
                </Link>
              </motion.div>
            ))}
            {(!projects || projects.length === 0) && <div className="text-center py-10 text-text-meta text-[12px]">No projects yet</div>}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-border rounded-[6px] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-navy-700" />
              <h2 className="text-[12.5px] font-semibold text-navy-900">My Tasks</h2>
            </div>
            <Link href="/tasks" className="text-[11.5px] font-semibold text-navy-700 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {myTasks?.slice(0, 6).map((t: any, i: number) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }}>
                <Link href={`/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 group transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-none ${PRIORITY_DOT[t.priority] || 'bg-text-meta'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-navy-800 group-hover:text-navy-700 transition-colors truncate">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-text-placeholder">{t.due_date ? formatDate(t.due_date) : 'No due date'}</div>
                  </div>
                  <span
                    className={`flex-none text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_MAP[getStatusTone(t.status)].bg} ${STATUS_MAP[getStatusTone(t.status)].text}`}
                  >
                    {getStatusLabel(t.status)}
                  </span>
                </Link>
              </motion.div>
            ))}
            {(!myTasks || myTasks.length === 0) && <div className="text-center py-10 text-text-meta text-[12px]">No tasks assigned</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
