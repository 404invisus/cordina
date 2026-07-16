'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { reportService, reportExportService, projectService, sprintService } from '@/lib/api';
import { FileDown } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#284074', '#3d5a9e', '#5677bc', '#8099cd', '#abbbd0'];

const TABS = [
  {
    id: 'workload', label: 'Workload',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    id: 'sprint', label: 'Sprint',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  {
    id: 'time', label: 'Time Tracking',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    id: 'velocity', label: 'Velocity',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
];

function SelectField({ value, onChange, disabled, children, icon }: any) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">{icon}</div>
      <select value={value} onChange={onChange} disabled={disabled}
        className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all appearance-none bg-white cursor-pointer w-52 disabled:opacity-50 disabled:cursor-not-allowed">
        {children}
      </select>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-slate-300">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-400">Pilih project dan sprint</p>
      <p className="text-xs text-slate-300 mt-1">untuk melihat laporan analitik</p>
    </div>
  );
}

const customTooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: '12px',
  color: '#f8fafc',
  fontSize: '12px',
  padding: '10px 14px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
};

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [tab, setTab] = useState('workload');
  const [exportLoading, setExportLoading] = useState(false);
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
    queryFn: () => reportService.timeTracking({ project_id: selectedProject, from: dateFrom, to: dateTo }).then(r => (r.data.data || []).flatMap((u: any) => (u.logs || []).map((log: any) => ({ ...log, full_name: u.full_name })))),
    enabled: !!selectedProject && !!dateFrom && !!dateTo && tab === 'time',
  });
  const { data: velocityReport, isLoading: vLoading } = useQuery({
    queryKey: ['report-velocity', selectedProject],
    queryFn: () => reportService.velocity(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject && tab === 'velocity',
  });

  const isLoading = wLoading || sLoading || tLoading || vLoading;
  const handleExport = async () => {
    setExportLoading(true);
    try {
      let res;
      const now = new Date().toISOString().slice(0,10);
      if (tab === 'workload') {
        res = await reportExportService.workload(selectedSprint);
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `laporan_workload_${now}.pdf`);
      } else if (tab === 'sprint' && selectedSprint) {
        res = await reportExportService.sprint(selectedSprint);
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `laporan_sprint_${now}.pdf`);
      } else if (tab === 'velocity' && selectedProject) {
        res = await reportExportService.velocity(selectedProject);
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `laporan_velocity_${now}.pdf`);
      } else if (tab === 'time') {
        const params: any = { project_id: selectedProject, from: dateFrom, to: dateTo };
        res = await reportExportService.timeTracking(params);
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `laporan_timetracking_${now}.pdf`);
      }
    } catch { toast.error('Gagal mengekspor laporan'); }
    setExportLoading(false);
  };

  const needsSprint = tab === 'workload' || tab === 'sprint';
  const hasData = (tab === 'workload' && workloadReport) || (tab === 'sprint' && sprintReport) ||
    (tab === 'time' && timeReport) || (tab === 'velocity' && velocityReport);

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-400 mt-0.5">Laporan analitik project dan tim</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-[#284074] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SelectField
              value={selectedProject}
              onChange={(e: any) => { setSelectedProject(e.target.value); setSelectedSprint(''); }}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M3 7a2 2 0 012-2h4l2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>}
            >
              <option value="">Pilih Project</option>
              {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </SelectField>

            {needsSprint && (
              <SelectField
                value={selectedSprint}
                onChange={(e: any) => setSelectedSprint(e.target.value)}
                disabled={!selectedProject}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              >
                <option value="">Pilih Sprint</option>
                {sprints?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectField>
            )}

            {tab === 'time' && (
              <>
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" />
                </div>
                <span className="text-slate-400 text-sm">—</span>
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LoadingSpinner />
          </motion.div>
        ) : !hasData ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyReport />
          </motion.div>
        ) : (
          <>

            {(tab === 'workload' || tab === 'sprint' || tab === 'velocity' || tab === 'time') && (
              <div className="flex justify-end mb-3">
                <button onClick={handleExport} disabled={exportLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] disabled:opacity-50 transition-all">
                  <FileDown className="w-4 h-4" />
                  {exportLoading ? 'Mengekspor...' : 'Export PDF'}
                </button>
              </div>
            )}
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {tab === 'workload' && workloadReport && (
              <>
                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5">
                    <h3 className="font-bold text-slate-800 mb-4">Distribusi Task per Anggota</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={workloadReport || []} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="full_name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="total_tasks" fill="#284074" radius={[6, 6, 0, 0]} name="Total Task" />
                        <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} name="Selesai" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 p-5">
                    <h3 className="font-bold text-slate-800 mb-4">Progress per Anggota</h3>
                    <div className="space-y-3.5">
                      {(workloadReport || []).map((u: any, i: number) => {
                        const pct = u.total_tasks > 0 ? Math.round((u.completed / u.total_tasks) * 100) : 0;
                        return (
                          <div key={u.user_id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#284074] to-[#3d5a9e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {(u.full_name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-semibold text-slate-700 truncate">{u.full_name}</span>
                                <span className="text-slate-400 flex-shrink-0 ml-2">{u.completed}/{u.total_tasks} · {pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05 }}
                                  className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#284074]'}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'sprint' && sprintReport && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Task', value: sprintReport.total_tasks, color: 'text-[#284074]', bg: 'bg-[#284074]/8' },
                    { label: 'Selesai', value: sprintReport.done_tasks, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Completion Rate', value: `${Math.round((sprintReport.done_tasks / sprintReport.total_tasks) * 100 || 0)}%`, color: 'text-violet-600', bg: 'bg-violet-50' },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                      <div className={`text-4xl font-bold mb-1 ${s.color}`}>{s.value}</div>
                      <div className="text-sm text-slate-500 font-medium">{s.label}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Distribusi Task per Status</h3>
                  <div className="flex items-center gap-6 flex-wrap">
                    {Object.entries(sprintReport.by_status || {}).map(([status, count]: any, i: number) => (
                      <div key={status} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-slate-600 capitalize">{status.replace("_", " ")}</span>
                        <span className="text-sm font-bold text-slate-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'time' && timeReport && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Time Tracking Log</h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{timeReport.length} entri</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {['Task', 'Sprint', 'Jam', 'Tanggal', 'Deskripsi'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(timeReport || []).map((log: any, i: number) => (
                      <motion.tr key={`${log.task_id}-${log.logged_at}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{log.task_title}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{log.sprint_name || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-mono font-bold text-[#284074] bg-[#284074]/8 px-2 py-0.5 rounded-lg">{log.logged_hours}h</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{log.logged_at?.slice(0, 10)}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">{log.description || '—'}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'velocity' && velocityReport && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-800 mb-5">Velocity per Sprint</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={velocityReport} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="total_points" fill="#e2e8f0" radius={[6, 6, 0, 0]} name="Total Points" />
                    <Bar dataKey="completed_points" fill="#284074" radius={[6, 6, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

          </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}