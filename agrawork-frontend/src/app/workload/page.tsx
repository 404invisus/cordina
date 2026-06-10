'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Users, BarChart3 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
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

  return (
    <AppLayout>
      <PageHeader title="Workload" subtitle="Monitor kapasitas dan distribusi kerja tim" icon={Activity} />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedSprint(''); }}
          className="input-field w-48 text-sm">
          <option value="">Pilih Project</option>
          {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)}
          className="input-field w-48 text-sm" disabled={!selectedProject}>
          <option value="">Pilih Sprint</option>
          {sprints?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!selectedSprint ? (
        <div className="card text-center py-16 text-slate-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div>Pilih project dan sprint untuk melihat workload</div>
        </div>
      ) : isLoading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          {/* Workload table */}
          {canViewAll && data && data.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-display font-600 text-slate-800">Distribusi Workload Tim</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Anggota', 'Divisi', 'Tasks', 'Selesai', 'Estimasi', 'Aktual', 'Kapasitas'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((row: any) => (
                    <tr key={row.user_id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#284074] text-white text-xs font-600 flex items-center justify-center">
                            {(row.full_name || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{row.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{row.division || '—'}</td>
                      <td className="px-5 py-3.5 text-sm font-medium">{row.task_count}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${row.task_count ? (row.done_count / row.task_count) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{row.done_count}/{row.task_count}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-mono">{row.estimated_hours}h</td>
                      <td className="px-5 py-3.5 text-sm font-mono">{row.actual_hours}h</td>
                      <td className="px-5 py-3.5 text-sm font-mono text-[#284074]">{row.available_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {burndown && <BurndownChart data={burndown} />}
            {velocity && selectedProject && <VelocityChart data={velocity} />}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
