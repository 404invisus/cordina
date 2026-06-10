'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity, Users, FolderKanban, CheckSquare,
  AlertTriangle, RefreshCw, Clock,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { dailyBriefService } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/EmptyState';

function StatCard({
  title, value, sub, icon: Icon, color, index,
}: {
  title: string; value: number | string; sub?: string;
  icon: any; color: string; index: number;
}) {
  const colors: Record<string, { bg: string; icon: string; ring: string }> = {
    blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',    ring: 'border-blue-100' },
    green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'border-emerald-100' },
    violet: { bg: 'bg-violet-50',  icon: 'text-violet-600',  ring: 'border-violet-100' },
    amber:  { bg: 'bg-amber-50',   icon: 'text-amber-600',   ring: 'border-amber-100' },
    red:    { bg: 'bg-red-50',     icon: 'text-red-600',     ring: 'border-red-100' },
  };
  const c = colors[color] || colors.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`bg-white rounded-2xl border ${c.ring} p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-slate-900 mb-0.5">{value}</div>
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default function DailyBriefPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['daily-brief'],
    queryFn: () => dailyBriefService.get().then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
            <Activity className="w-5 h-5 text-[#284074]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Brief</h1>
            <p className="text-sm text-slate-400 mt-0.5">{today}</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#284074] bg-[#284074]/8 px-4 py-2 rounded-xl hover:bg-[#284074]/15 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Gagal memuat data</p>
          <button onClick={() => refetch()} className="mt-3 text-sm text-[#284074] font-semibold hover:underline">
            Coba lagi
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard index={0} title="Total User"     value={data.users?.total   ?? 0} icon={Users}        color="blue"   />
            <StatCard index={1} title="User Aktif"     value={data.users?.active  ?? 0} icon={Users}        color="green"  />
            <StatCard index={2} title="Project Aktif"  value={data.projects?.active ?? 0} sub={`dari ${data.projects?.total ?? 0} total`} icon={FolderKanban} color="violet" />
            <StatCard index={3} title="Task Jatuh Tempo Hari Ini" value={data.tasks?.due_today  ?? 0} icon={Clock}        color="amber"  />
            <StatCard index={4} title="Task Overdue"   value={data.tasks?.overdue ?? 0} icon={AlertTriangle} color="red"    />
          </div>

          {/* Summary row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#284074]" />
                <span className="text-sm font-semibold text-slate-700">Ringkasan Hari Ini</span>
              </div>
              {lastUpdated && (
                <span className="text-xs text-slate-400">Diperbarui {lastUpdated}</span>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pengguna</div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{data.users?.active ?? 0}</span>
                  <span className="text-sm text-slate-400 mb-0.5">dari {data.users?.total ?? 0} terdaftar</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#284074] rounded-full transition-all duration-700"
                    style={{ width: `${data.users?.total ? Math.round((data.users.active / data.users.total) * 100) : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.users?.total ? Math.round((data.users.active / data.users.total) * 100) : 0}% aktif
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project</div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{data.projects?.active ?? 0}</span>
                  <span className="text-sm text-slate-400 mb-0.5">aktif</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${data.projects?.total ? Math.round((data.projects.active / data.projects.total) * 100) : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  dari {data.projects?.total ?? 0} total project
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Task Hari Ini</div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{data.tasks?.done_today ?? 0}</span>
                  <span className="text-sm text-slate-400 mb-0.5">selesai</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${data.tasks?.due_today ? Math.round(((data.tasks.done_today ?? 0) / data.tasks.due_today) * 100) : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.tasks?.due_today ?? 0} task jatuh tempo hari ini
                </div>
              </div>
            </div>
          </motion.div>

          {/* Overdue warning */}
          {(data.tasks?.overdue ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-red-700">
                  {data.tasks.overdue} task melewati deadline
                </div>
                <div className="text-xs text-red-500 mt-0.5">
                  Segera ditindaklanjuti oleh project manager terkait.
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
