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
        title="Dashboard Product Owner"
        subtitle="Pantau seluruh project dan tim"
        icon={Activity}
        actions={
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-md hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Buat Project
          </Link>
        }
      />
      <CRSummaryCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Project"   value={total}            icon={FolderKanban} color="blue"   index={0} />
        <StatCard title="Project Aktif"   value={active}           icon={TrendingUp}   color="green"  index={1} />
        <StatCard title="Total Anggota"   value={users?.length||0} icon={Users}        color="purple" index={2} />
        <StatCard title="Selesai"         value={completed}        icon={CheckSquare}  color="orange" index={3} />
      </div>

      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#284074]" />
              <span className="text-sm font-semibold text-slate-700">Distribusi Status Project</span>
            </div>
            <span className="text-xs text-slate-400">{total} total</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {active    > 0 && <div style={{ width: `${(active/total)*100}%` }}    className="bg-emerald-400 transition-all" />}
            {completed > 0 && <div style={{ width: `${(completed/total)*100}%` }} className="bg-[#284074] transition-all" />}
            {onHold    > 0 && <div style={{ width: `${(onHold/total)*100}%` }}    className="bg-amber-400 transition-all" />}
            <div className="flex-1 bg-slate-100" />
          </div>
          <div className="flex items-center gap-4 mt-2.5">
            {[
              { label: 'Aktif',    val: active,    dot: 'bg-emerald-400' },
              { label: 'Selesai',  val: completed, dot: 'bg-[#284074]' },
              { label: 'On Hold',  val: onHold,    dot: 'bg-amber-400' },
              { label: 'Lainnya', val: total - active - completed - onHold, dot: 'bg-slate-200' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                {item.label} ({item.val})
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#284074]" />
              <h2 className="font-semibold text-slate-800 text-sm">Semua Project</h2>
            </div>
            <Link
              href="/projects"
              className="text-xs text-[#284074] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {projects?.slice(0, 6).map((p: any, i: number) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-[#284074]/8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#284074] transition-colors">
                      <FolderKanban className="w-4 h-4 text-[#284074] group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-[#284074] transition-colors truncate">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(p.start_date)} – {formatDate(p.end_date)}
                      </div>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </Link>
              </motion.div>
            ))}

            {(!projects || projects.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FolderKanban className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-sm">Belum ada project</span>
                <Link href="/projects" className="mt-3 text-xs text-[#284074] font-semibold hover:underline">
                  + Buat project pertama
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#284074]" />
              <h2 className="font-semibold text-slate-800 text-sm">Anggota Tim</h2>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-[#284074] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Kelola <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {users?.slice(0, 8).map((u: any, i: number) => {
              const role     = u.roles?.[0] ?? 'staff';
              const initials = u.full_name.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.full_name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-[#284074] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{u.full_name}</div>
                    <div className="text-xs text-slate-400 truncate">{u.division || u.email}</div>
                  </div>

                  <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-lg ${ROLE_COLOR[role] ?? 'bg-slate-100 text-slate-500'}`}>
                    {ROLE_LABEL[role] ?? role}
                  </span>
                </motion.div>
              );
            })}

            {(!users || users.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Users className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-sm">Belum ada anggota</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
