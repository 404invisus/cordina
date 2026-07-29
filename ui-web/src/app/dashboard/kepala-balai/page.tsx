'use client';

import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import { FolderKanban, Users, CheckSquare, Activity, TrendingUp, Plus, ArrowRight, Clock, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { projectService, userService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusTone, getStatusLabel, STATUS_MAP } from '@/lib/status';
import { formatDate } from '@/lib/format';

const ROLE_LABEL: Record<string, string> = {
  kepala_balai: 'Product Owner',
  kepala_seksi: 'Product Manager',
  project_manager: 'Project Manager',
  scrum_master: 'Scrum Master',
  staff: 'Staff',
};

const ROLE_COLOR: Record<string, string> = {
  kepala_balai: 'bg-amber-50 text-amber-600',
  kepala_seksi: 'bg-navy-700/8 text-navy-700',
  project_manager: 'bg-info-soft text-info-text',
  scrum_master: 'bg-orange-50 text-orange-600',
  staff: 'bg-success-soft text-success-text',
};

export default function KepalaBalaiDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then((r) => r.data.data),
  });
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then((r) => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const total = projects?.length || 0;
  const active = projects?.filter((p: any) => p.status === 'active')?.length || 0;
  const completed = projects?.filter((p: any) => p.status === 'completed')?.length || 0;
  const onHold = projects?.filter((p: any) => p.status === 'on_hold')?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        section="OVERVIEW"
        title="Dashboard"
        subtitle="Monitor all projects and team"
        actions={
          <Link
            href="/projects"
            className="h-[34px] inline-flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            New project
          </Link>
        }
      />
      <CRSummaryCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={total} icon={FolderKanban} color="brand" index={0} />
        <StatCard title="Active" value={active} icon={TrendingUp} color="green" index={1} />
        <StatCard title="Team Members" value={users?.length || 0} icon={Users} color="brand" index={2} />
        <StatCard title="Completed" value={completed} icon={CheckSquare} color="green" index={3} />
      </div>

      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-border rounded-[6px] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-navy-700" />
              <span className="text-[12.5px] font-semibold text-navy-900">Project Status Distribution</span>
            </div>
            <span className="font-mono text-[10px] text-text-meta">{total} total</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {active > 0 && <div style={{ width: `${(active / total) * 100}%` }} className="bg-success transition-all" />}
            {completed > 0 && <div style={{ width: `${(completed / total) * 100}%` }} className="bg-navy-700 transition-all" />}
            {onHold > 0 && <div style={{ width: `${(onHold / total) * 100}%` }} className="bg-neutral transition-all" />}
            <div className="flex-1 bg-border-subtle" />
          </div>
          <div className="flex items-center gap-4 mt-2.5">
            {[
              { label: 'Active', val: active, bg: '#137a52' },
              { label: 'Completed', val: completed, bg: '#14406a' },
              { label: 'On hold', val: onHold, bg: '#8a8f98' },
              { label: 'Other', val: total - active - completed - onHold, bg: '#c0bcb4' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <div className="w-2 h-2 rounded-full" style={{ background: item.bg }} />
                {item.label} ({item.val})
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-[6px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-navy-700" />
              <h2 className="text-[12.5px] font-semibold text-navy-900">All Projects</h2>
            </div>
            <Link href="/projects" className="text-[11.5px] font-semibold text-navy-700 flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border-subtle">
            {projects?.slice(0, 6).map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-info-soft rounded-[4px] flex items-center justify-center flex-none">
                      <FolderKanban className="w-3.5 h-3.5 text-navy-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-navy-800 group-hover:text-navy-700 transition-colors truncate">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-text-placeholder mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(p.start_date)} – {formatDate(p.end_date)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`flex-none text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${STATUS_MAP[getStatusTone(p.status)].bg} ${STATUS_MAP[getStatusTone(p.status)].text}`}
                  >
                    {getStatusLabel(p.status)}
                  </span>
                </Link>
              </motion.div>
            ))}
            {(!projects || projects.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-text-meta">
                <FolderKanban className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-[12px]">No projects yet</span>
                <Link href="/projects" className="mt-3 text-[11.5px] text-navy-700 font-semibold hover:underline">
                  + Create first project
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-border rounded-[6px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-navy-700" />
              <h2 className="text-[12.5px] font-semibold text-navy-900">Team Members</h2>
            </div>
            <Link
              href="/admin/users"
              className="text-[11.5px] font-semibold text-navy-700 flex items-center gap-1 hover:gap-2 transition-all"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border-subtle">
            {users?.slice(0, 8).map((u: any, i: number) => {
              const role = u.roles?.[0] ?? 'staff';
              const initials = u.full_name
                .trim()
                .split(' ')
                .slice(0, 2)
                .map((w: string) => w[0])
                .join('')
                .toUpperCase();
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors"
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.full_name} className="w-8 h-8 rounded-[4px] object-cover flex-none" />
                  ) : (
                    <div className="w-8 h-8 rounded-[4px] bg-info-soft flex items-center justify-center text-navy-700 text-[10px] font-bold flex-none">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-navy-800 truncate">{u.full_name}</div>
                    <div className="text-[11px] text-text-placeholder truncate">{u.division || u.email}</div>
                  </div>
                  <span
                    className={`flex-none text-[10px] font-semibold px-2 py-0.5 rounded-[3px] ${ROLE_COLOR[role] ?? 'bg-border-subtle text-text-tertiary'}`}
                  >
                    {ROLE_LABEL[role] ?? role}
                  </span>
                </motion.div>
              );
            })}
            {(!users || users.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-text-meta">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-[12px]">No team members</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
