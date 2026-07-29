'use client';

import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import {
  FolderKanban, Users, CheckSquare, Activity,
  TrendingUp, Plus, ArrowRight, Clock, BarChart2,
} from 'lucide-react';
import Link from 'next/link';
import { projectService, userService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';

const ROLE_LABEL: Record<string, string> = {
  kepala_balai:    'Product Owner',
  kepala_seksi:    'Product Manager',
  project_manager: 'Project Manager',
  scrum_master:    'Scrum Master',
  staff:           'Staff',
};

const ROLE_COLOR: Record<string, string> = {
  kepala_balai:    'bg-amber-50 text-amber-600',
  kepala_seksi:    'bg-violet-50 text-violet-600',
  project_manager: 'bg-blue-50 text-blue-600',
  scrum_master:    'bg-orange-50 text-orange-600',
  staff:           'bg-emerald-50 text-emerald-600',
};

export default function KepalaBalaiDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const total     = projects?.length || 0;
  const active    = projects?.filter((p: any) => p.status === 'active')?.length || 0;
  const completed = projects?.filter((p: any) => p.status === 'completed')?.length || 0;
  const onHold    = projects?.filter((p: any) => p.status === 'on_hold')?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        section="OVERVIEW"
        title="Dashboard"
        subtitle="Monitor all projects and team"
        actions={
          <Link
            href="/projects"
            className="h-[34px] inline-flex items-center gap-[6px] px-[14px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            New project
          </Link>
        }
      />
      <CRSummaryCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={total}            icon={FolderKanban} color="brand" index={0} />
        <StatCard title="Active"         value={active}           icon={TrendingUp}   color="green" index={1} />
        <StatCard title="Team Members"   value={users?.length||0} icon={Users}        color="brand" index={2} />
        <StatCard title="Completed"      value={completed}        icon={CheckSquare}  color="green" index={3} />
      </div>

      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-[#e6e4df] rounded-[6px] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand" />
              <span className="text-[12.5px] font-semibold text-[#0d2b48]">Project Status Distribution</span>
            </div>
            <span className="font-mono text-[10px] text-[#a6a094]">{total} total</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {active    > 0 && <div style={{ width: `${(active/total)*100}%` }}    className="bg-[#137a52] transition-all" />}
            {completed > 0 && <div style={{ width: `${(completed/total)*100}%` }} className="bg-brand transition-all" />}
            {onHold    > 0 && <div style={{ width: `${(onHold/total)*100}%` }}    className="bg-accent transition-all" />}
            <div className="flex-1 bg-[#eceae4]" />
          </div>
          <div className="flex items-center gap-4 mt-2.5">
            {[
              { label: 'Active',    val: active,    bg: '#137a52' },
              { label: 'Completed', val: completed, bg: '#284074' },
              { label: 'On hold',   val: onHold,    bg: '#c9971b' },
              { label: 'Other',     val: total - active - completed - onHold, bg: '#c0bcb4' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                <div className="w-2 h-2 rounded-full" style={{ background: item.bg }} />
                {item.label} ({item.val})
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e6e4df] rounded-[6px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eceae4]">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand" />
              <h2 className="text-[12.5px] font-semibold text-[#0d2b48]">All Projects</h2>
            </div>
            <Link href="/projects" className="text-[11.5px] font-semibold text-brand flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#f2f0ec]">
            {projects?.slice(0, 6).map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/projects/${p.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#faf9f7] transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-[#eaf1f8] rounded-[4px] flex items-center justify-center flex-none">
                      <FolderKanban className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#12283c] group-hover:text-brand transition-colors truncate">{p.name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-[#9ca3af] mt-0.5">
                        <Clock className="w-3 h-3" />{formatDate(p.start_date)} – {formatDate(p.end_date)}
                      </div>
                    </div>
                  </div>
                  <span className={`flex-none text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </Link>
              </motion.div>
            ))}
            {(!projects || projects.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-[#c0bcb4]">
                <FolderKanban className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-[12px]">No projects yet</span>
                <Link href="/projects" className="mt-3 text-[11.5px] text-brand font-semibold hover:underline">
                  + Create first project
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e6e4df] rounded-[6px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eceae4]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              <h2 className="text-[12.5px] font-semibold text-[#0d2b48]">Team Members</h2>
            </div>
            <Link href="/admin/users" className="text-[11.5px] font-semibold text-brand flex items-center gap-1 hover:gap-2 transition-all">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#f2f0ec]">
            {users?.slice(0, 8).map((u: any, i: number) => {
              const role     = u.roles?.[0] ?? 'staff';
              const initials = u.full_name.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#faf9f7] transition-colors"
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.full_name} className="w-8 h-8 rounded-[4px] object-cover flex-none" />
                  ) : (
                    <div className="w-8 h-8 rounded-[4px] bg-[#eaf1f8] flex items-center justify-center text-brand text-[10px] font-bold flex-none">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-[#12283c] truncate">{u.full_name}</div>
                    <div className="text-[11px] text-[#9ca3af] truncate">{u.division || u.email}</div>
                  </div>
                  <span className={`flex-none text-[10px] font-semibold px-2 py-0.5 rounded-[3px] ${ROLE_COLOR[role] ?? 'bg-slate-100 text-slate-500'}`}>
                    {ROLE_LABEL[role] ?? role}
                  </span>
                </motion.div>
              );
            })}
            {(!users || users.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-[#c0bcb4]">
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
