'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { workloadService, projectService, sprintService } from '@/lib/api';
import { BurndownChart, VelocityChart } from '@/components/charts/WorkloadCharts';
import { useAuthStore } from '@/store/authStore';

export default function WorkloadPage() {
  const { hasRole } = useAuthStore();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const canViewAll = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });
  const { data: sprints } = useQuery({
    queryKey: ['sprints-list', selectedProject],
    queryFn: () => sprintService.list(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject,
  });
  const { data: summary, isLoading } = useQuery({
    queryKey: ['workload-summary', selectedSprint],
    queryFn: () => workloadService.summary(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint && canViewAll,
  });
  const { data: mySummary } = useQuery({
    queryKey: ['workload-me', selectedSprint],
    queryFn: () => workloadService.me(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint && !canViewAll,
  });
  const { data: burndown } = useQuery({
    queryKey: ['burndown', selectedSprint],
    queryFn: () => workloadService.burndown(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint,
  });
  const { data: velocity } = useQuery({
    queryKey: ['velocity', selectedProject],
    queryFn: () => workloadService.velocity(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject,
  });

  const data = canViewAll ? summary : (mySummary ? [mySummary] : []);

  const totalTasks = data?.reduce((a: number, r: any) => a + (r.task_count || 0), 0) || 0;
  const totalDone = data?.reduce((a: number, r: any) => a + (r.done_count || 0), 0) || 0;
  const totalEst = data?.reduce((a: number, r: any) => a + (r.estimated_hours || 0), 0) || 0;
  const totalActual = data?.reduce((a: number, r: any) => a + (r.actual_hours || 0), 0) || 0;
  const overallProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
            <Activity className="w-5 h-5 text-[#284074]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Workload</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor kapasitas dan distribusi kerja tim</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
              <path d="M3 7a2 2 0 012-2h4l2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            <select
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setSelectedSprint(''); }}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white cursor-pointer w-52"
            >
              <option value="">Pilih Project</option>
              {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <select
              value={selectedSprint}
              onChange={e => setSelectedSprint(e.target.value)}
              disabled={!selectedProject}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white cursor-pointer w-52 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Pilih Sprint</option>
              {sprints?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedSprint ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
              <Activity className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Pilih project dan sprint</p>
            <p className="text-xs text-slate-300 mt-1">untuk melihat data workload tim</p>
          </motion.div>
        ) : isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LoadingSpinner />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {selectedSprint && data && data.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Task', value: totalTasks, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#284074]"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>, bg: 'bg-[#284074]/8', val: 'text-[#284074]' },
                  { label: 'Selesai', value: `${totalDone}/${totalTasks}`, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>, bg: 'bg-emerald-50', val: 'text-emerald-600' },
                  { label: 'Est. Jam', value: `${totalEst}h`, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, bg: 'bg-blue-50', val: 'text-blue-600' },
                  { label: 'Progress', value: `${overallProgress}%`, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-violet-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, bg: 'bg-violet-50', val: 'text-violet-600' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                    <div>
                      <div className={`text-xl font-bold ${s.val}`}>{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {canViewAll && data && data.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    Distribusi Workload Tim
                  </h2>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{data.length} anggota</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {['Anggota', 'Tasks', 'Progress', 'Estimasi', 'Aktual', 'Efisiensi'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row: any, i: number) => {
                      const pct = row.task_count > 0 ? Math.round((row.done_count / row.task_count) * 100) : 0;
                      const efficiency = row.estimated_hours > 0 ? Math.round((row.estimated_hours / (row.actual_hours || row.estimated_hours)) * 100) : null;
                      return (
                        <motion.tr key={row.user_id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#284074] to-[#3d5a9e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                                {(row.full_name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800">{row.full_name}</div>
                                {row.division && <div className="text-xs text-slate-400">{row.division}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-slate-700">{row.task_count}</span>
                            <span className="text-xs text-slate-400 ml-1">task</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05 }}
                                  className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#284074]'}`}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-600 w-8">{pct}%</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{row.done_count}/{row.task_count} selesai</div>
                          </td>
                          <td className="px-5 py-4 text-sm font-mono font-medium text-slate-600">{row.estimated_hours}h</td>
                          <td className="px-5 py-4 text-sm font-mono font-medium text-slate-600">{row.actual_hours}h</td>
                          <td className="px-5 py-4">
                            {efficiency !== null ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${efficiency >= 100 ? 'bg-emerald-50 text-emerald-600' : efficiency >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                {efficiency}%
                              </span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-5">
              {burndown && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <BurndownChart data={burndown} workloadData={data} />
                </motion.div>
              )}
              {velocity && selectedProject && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <VelocityChart data={velocity} />
                </motion.div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}