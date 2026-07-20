'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Users, TrendingUp, BarChart2, ChevronDown, Download, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminWorkloadService, adminProjectService, adminReportExportService } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const GRADIENTS = [
  'from-[#284074] to-[#3d5a9e]', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',    'from-cyan-500 to-blue-600',
];
function getGradient(name: string) { return GRADIENTS[(name?.charCodeAt(0) || 0) % GRADIENTS.length]; }
function getInitials(name: string) { return (name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(); }
async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminWorkloadPage() {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint]   = useState('');
  const [exporting, setExporting]             = useState(false);

  const { data: projects } = useQuery({
    queryKey: ['admin-projects-list'],
    queryFn: () => adminProjectService.list({ per_page: 50 }).then(r => r.data.data),
  });

  const { data: sprints } = useQuery({
    queryKey: ['admin-project-sprints', selectedProject],
    queryFn: async () => {
      const token = Cookies.get('token') || '';
      const res = await fetch(`/api/v1/projects/${selectedProject}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!selectedProject,
  });

  const activeSprint = sprints?.find((s: any) => s.status === 'active');
  const activeSprintId = selectedSprint || activeSprint?.id || '';

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-workload-summary', activeSprintId],
    queryFn: () => adminWorkloadService.summary(activeSprintId).then(r => r.data.data),
    enabled: !!activeSprintId,
  });

  const { data: burndown } = useQuery({
    queryKey: ['admin-workload-burndown', activeSprintId],
    queryFn: () => adminWorkloadService.burndown(activeSprintId).then(r => r.data.data),
    enabled: !!activeSprintId,
  });

  const { data: velocity } = useQuery({
    queryKey: ['admin-workload-velocity', selectedProject],
    queryFn: () => adminWorkloadService.velocity(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject,
  });

  const userWorkloads: any[] = summary || [];

  const handleExport = async () => {
    if (!selectedProject) { toast.error('Pilih project terlebih dahulu'); return; }
    setExporting(true);
    try {
      const res = await adminReportExportService.workload(selectedProject, selectedSprint || undefined);
      await downloadBlob(res.data, `laporan_workload_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success('Laporan berhasil diunduh');
    } catch { toast.error('Gagal mengunduh laporan'); }
    finally { setExporting(false); }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monitor Workload</h1>
            <p className="text-sm text-slate-400 mt-0.5">Pantau kapasitas dan beban kerja tim</p>
          </div>
        </div>
        <button onClick={handleExport} disabled={exporting || !selectedProject}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] transition-colors disabled:opacity-40">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Ekspor PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select value={selectedProject}
            onChange={e => { setSelectedProject(e.target.value); setSelectedSprint(''); }}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 bg-white min-w-[180px]">
            <option value="">Pilih Project</option>
            {(projects || []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {selectedProject && (
          <div className="relative">
            <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 bg-white min-w-[200px]">
              <option value="">Semua sprint{activeSprint ? ` (aktif: ${activeSprint.name})` : ''}</option>
              {(sprints || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}{s.status === 'active' ? ' (aktif)' : ''}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        )}

        {!selectedProject && <p className="text-sm text-slate-400">Pilih project untuk memuat data workload</p>}
      </div>

      {selectedProject && (
        <>
          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#284074]" />
                <h3 className="font-bold text-slate-800 text-sm">Burndown Chart</h3>
                <span className="text-xs text-slate-400 ml-auto">
                  {selectedSprint ? 'Sprint terpilih' : activeSprint ? `Sprint aktif: ${activeSprint.name}` : 'Tidak ada sprint aktif'}
                </span>
              </div>
              {burndown?.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={burndown.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="ideal"     stroke="#94a3b8" strokeDasharray="5 3" dot={false} name="Ideal" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="remaining" stroke="#284074"               dot={false} name="Aktual" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-slate-300">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  <p className="text-xs">{activeSprintId ? 'Belum ada data burndown' : 'Pilih sprint atau pastikan ada sprint aktif'}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-slate-800 text-sm">Velocity per Sprint</h3>
              </div>
              {velocity?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={velocity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sprint_name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="completed_points" fill="#284074" radius={[4,4,0,0]} name="Story Points" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-slate-300">
                  <BarChart2 className="w-8 h-8 mb-2" />
                  <p className="text-xs">Belum ada data velocity</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-slate-800 text-sm">Workload per Anggota</h3>
              {userWorkloads.length > 0 && <span className="ml-auto text-xs text-slate-400">{userWorkloads.length} anggota</span>}
            </div>

            {loadingSummary ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
              </div>
            ) : !activeSprintId ? (
              <div className="text-center py-16 text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tidak ada sprint aktif pada project ini</p>
                <p className="text-xs mt-1 text-slate-300">Pilih sprint secara manual dari filter di atas</p>
              </div>
            ) : userWorkloads.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tidak ada data workload</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {userWorkloads.map((u: any, i: number) => {
                  const total = u.task_count || 0;
                  const done  = u.done_count || 0;
                  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                  const util  = Math.round(u.allocated_hours > 0 ? (u.actual_hours / u.allocated_hours) * 100 : 0);
                  return (
                    <motion.div key={u.user_id || i}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(u.full_name || '')} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                          {getInitials(u.full_name || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-semibold text-slate-800">{u.full_name || 'Unknown'}</span>
                              <span className="text-xs text-slate-400 ml-2">{u.division || ''}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">{done}</span>/{total} task
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                util > 90 ? 'bg-red-50 text-red-600' :
                                util > 70 ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>{util}% utilisasi</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#284074] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                          </div>
                          <div className="flex gap-3 mt-2">
                            {[
                              { label: 'Total', value: u.task_count || 0, color: 'text-slate-500' },
                              { label: 'Selesai', value: u.done_count || 0, color: 'text-emerald-600' },
                              { label: 'Est. Jam', value: u.estimated_hours || 0, color: 'text-violet-600' },
                              { label: 'Aktual', value: u.actual_hours || 0, color: 'text-amber-600' },
                            ].map(s => (
                              <div key={s.label} className="flex items-center gap-1">
                                <span className={`text-[10px] ${s.color}`}>{s.label}</span>
                                <span className={`text-[10px] font-bold ${s.color}`}>{s.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
