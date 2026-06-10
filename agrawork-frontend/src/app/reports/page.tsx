'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileText, Clock, Users, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { reportService, projectService, sprintService } from '@/lib/api';

const COLORS = ['#284074', '#3d5a9e', '#5677bc', '#8099cd', '#abbbd e'];
const TABS = [
  { id: 'workload', label: 'Workload', icon: Users },
  { id: 'sprint', label: 'Sprint', icon: Zap },
  { id: 'time', label: 'Time Tracking', icon: Clock },
  { id: 'velocity', label: 'Velocity', icon: BarChart3 },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('workload');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => projectService.list().then(r => r.data.data) });
  const { data: sprints } = useQuery({
    queryKey: ['sprints', selectedProject],
    queryFn: () => sprintService.list(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject,
  });

  const { data: workloadReport, isLoading: wLoading } = useQuery({
    queryKey: ['report-workload', selectedSprint],
    queryFn: () => reportService.workload(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint && tab === 'workload',
  });
  const { data: sprintReport, isLoading: sLoading } = useQuery({
    queryKey: ['report-sprint', selectedSprint],
    queryFn: () => reportService.sprint(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint && tab === 'sprint',
  });
  const { data: timeReport, isLoading: tLoading } = useQuery({
    queryKey: ['report-time', selectedProject, dateFrom, dateTo],
    queryFn: () => reportService.timeTracking({ project_id: selectedProject, from: dateFrom, to: dateTo }).then(r => r.data.data),
    enabled: !!selectedProject && !!dateFrom && !!dateTo && tab === 'time',
  });
  const { data: velocityReport, isLoading: vLoading } = useQuery({
    queryKey: ['report-velocity', selectedProject],
    queryFn: () => reportService.velocity(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject && tab === 'velocity',
  });

  const isLoading = wLoading || sLoading || tLoading || vLoading;

  return (
    <AppLayout>
      <PageHeader title="Reports" subtitle="Laporan analitik project dan tim" icon={BarChart3} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-[#284074] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedSprint(''); }} className="input-field w-48 text-sm">
          <option value="">Pilih Project</option>
          {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(tab === 'workload' || tab === 'sprint') && (
          <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)} className="input-field w-48 text-sm" disabled={!selectedProject}>
            <option value="">Pilih Sprint</option>
            {sprints?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {tab === 'time' && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field w-40 text-sm" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field w-40 text-sm" />
          </>
        )}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div>
          {tab === 'workload' && workloadReport && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-display font-600 text-slate-800 mb-4">Distribusi Task per Anggota</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={workloadReport?.by_user || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="full_name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="task_count" fill="#284074" radius={[4, 4, 0, 0]} name="Tasks" />
                    <Bar dataKey="done_count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Done" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-display font-600 text-slate-800 mb-4">Detail Workload</h3>
                <div className="space-y-3">
                  {(workloadReport?.by_user || []).map((u: any) => (
                    <div key={u.user_id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#284074] text-white text-xs font-600 flex items-center justify-center">
                        {(u.full_name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{u.full_name}</span>
                          <span className="text-slate-400">{u.done_count}/{u.task_count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-[#284074] h-1.5 rounded-full" style={{ width: `${u.task_count ? (u.done_count / u.task_count) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'sprint' && sprintReport && (
            <div className="grid lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Task', value: sprintReport.total_tasks },
                { label: 'Selesai', value: sprintReport.done_tasks },
                { label: 'Completion Rate', value: `${Math.round((sprintReport.done_tasks / sprintReport.total_tasks) * 100 || 0)}%` },
              ].map(s => (
                <div key={s.label} className="card text-center">
                  <div className="font-display text-3xl font-700 text-[#284074] mb-1">{s.value}</div>
                  <div className="text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
              <div className="card lg:col-span-3">
                <h3 className="font-display font-600 text-slate-800 mb-4">Task per Status</h3>
                <div className="flex gap-4">
                  {(sprintReport.by_status || []).map((s: any, i: number) => (
                    <div key={s.status} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600">{s.status}: <span className="font-medium">{s.count}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'time' && timeReport && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Task', 'Sprint', 'User', 'Jam', 'Tanggal', 'Deskripsi'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(timeReport || []).map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-sm font-medium text-slate-800">{log.task_title}</td>
                      <td className="px-5 py-3 text-sm text-slate-500">{log.sprint_name}</td>
                      <td className="px-5 py-3 text-sm text-slate-500">{log.user_id?.slice(0, 8)}...</td>
                      <td className="px-5 py-3 text-sm font-mono font-medium">{log.logged_hours}h</td>
                      <td className="px-5 py-3 text-sm text-slate-500">{log.logged_at?.slice(0, 10)}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">{log.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'velocity' && velocityReport && (
            <div className="card">
              <h3 className="font-display font-600 text-slate-800 mb-4">Velocity per Sprint</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={velocityReport}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="completed_points" fill="#284074" radius={[4, 4, 0, 0]} name="Completed Points" />
                  <Bar dataKey="total_points" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total Points" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!selectedSprint && (tab === 'workload' || tab === 'sprint') && (
            <div className="card text-center py-16 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <div>Pilih project dan sprint untuk melihat laporan</div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
