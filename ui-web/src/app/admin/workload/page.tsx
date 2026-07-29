'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Users, TrendingUp, BarChart2, ChevronDown, Download, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminWorkloadService, adminProjectService, adminReportExportService } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const GRADIENTS = [
  'from-navy-700 to-navy-700',
  'from-navy-700 to-navy-700',
  'from-success to-teal-600',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-info-text',
];
function getGradient(name: string) {
  return GRADIENTS[(name?.charCodeAt(0) || 0) % GRADIENTS.length];
}
function getInitials(name: string) {
  return (name || '')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminWorkloadPage() {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ['admin-projects-list'],
    queryFn: () => adminProjectService.list({ per_page: 50 }).then((r) => r.data.data),
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
    queryFn: () => adminWorkloadService.summary(activeSprintId).then((r) => r.data.data),
    enabled: !!activeSprintId,
  });

  const { data: burndown } = useQuery({
    queryKey: ['admin-workload-burndown', activeSprintId],
    queryFn: () => adminWorkloadService.burndown(activeSprintId).then((r) => r.data.data),
    enabled: !!activeSprintId,
  });

  const { data: velocity } = useQuery({
    queryKey: ['admin-workload-velocity', selectedProject],
    queryFn: () => adminWorkloadService.velocity(selectedProject).then((r) => r.data.data),
    enabled: !!selectedProject,
  });

  const userWorkloads: any[] = summary || [];

  const handleExport = async () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }
    setExporting(true);
    try {
      const res = await adminReportExportService.workload(selectedProject, selectedSprint || undefined);
      await downloadBlob(res.data, `workload_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-success-soft rounded-[6px] flex items-center justify-center border border-success-soft">
            <Activity className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Workload Monitor</h1>
            <p className="text-sm text-text-placeholder mt-0.5">Monitor team capacity and workload</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !selectedProject}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 transition-colors disabled:opacity-40"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </button>
      </div>

      <div className="bg-white rounded-[6px] border border-border-subtle p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setSelectedSprint('');
            }}
            className="appearance-none pl-3 pr-8 py-2 rounded-[6px] border border-border text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-navy-700/20 bg-white min-w-[180px]"
          >
            <option value="">Select Project</option>
            {(projects || []).map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none" />
        </div>

        {selectedProject && (
          <div className="relative">
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-[6px] border border-border text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-navy-700/20 bg-white min-w-[200px]"
            >
              <option value="">All sprints{activeSprint ? ` (active: ${activeSprint.name})` : ''}</option>
              {(sprints || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.status === 'active' ? ' (active)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none" />
          </div>
        )}

        {!selectedProject && <p className="text-sm text-text-placeholder">Select a project to load workload data</p>}
      </div>

      {selectedProject && (
        <>
          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-[6px] border border-border-subtle p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-navy-700" />
                <h3 className="font-bold text-navy-800 text-sm">Burndown Chart</h3>
                <span className="text-xs text-text-placeholder ml-auto">
                  {selectedSprint ? 'Selected sprint' : activeSprint ? `Active sprint: ${activeSprint.name}` : 'No active sprint'}
                </span>
              </div>
              {burndown?.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={burndown.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="ideal"
                      stroke="#94a3b8"
                      strokeDasharray="5 3"
                      dot={false}
                      name="Ideal"
                      strokeWidth={1.5}
                    />
                    <Line type="monotone" dataKey="remaining" stroke="#284074" dot={false} name="Actual" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-border-button">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  <p className="text-xs">
                    {activeSprintId ? 'No burndown data yet' : 'Select a sprint or ensure there is an active sprint'}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[6px] border border-border-subtle p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-navy-700" />
                <h3 className="font-bold text-navy-800 text-sm">Velocity per Sprint</h3>
              </div>
              {velocity?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={velocity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sprint_name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="completed_points" fill="#284074" radius={[4, 4, 0, 0]} name="Story Points" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-border-button">
                  <BarChart2 className="w-8 h-8 mb-2" />
                  <p className="text-xs">No velocity data yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[6px] border border-border-subtle overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
              <Users className="w-4 h-4 text-text-placeholder" />
              <h3 className="font-bold text-navy-800 text-sm">Workload per Member</h3>
              {userWorkloads.length > 0 && (
                <span className="ml-auto text-xs text-text-placeholder">
                  {userWorkloads.length} member{userWorkloads.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loadingSummary ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
              </div>
            ) : !activeSprintId ? (
              <div className="text-center py-16 text-text-placeholder">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No active sprint on this project</p>
                <p className="text-xs mt-1 text-border-button">Select a sprint manually from the filter above</p>
              </div>
            ) : userWorkloads.length === 0 ? (
              <div className="text-center py-16 text-text-placeholder">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No workload data</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-2">
                {userWorkloads.map((u: any, i: number) => {
                  const total = u.task_count || 0;
                  const done = u.done_count || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const util = Math.round(u.allocated_hours > 0 ? (u.actual_hours / u.allocated_hours) * 100 : 0);
                  return (
                    <motion.div
                      key={u.user_id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-5 py-4 hover:bg-surface-2/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-9 h-9 rounded-[6px] bg-gradient-to-br ${getGradient(u.full_name || '')} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
                        >
                          {getInitials(u.full_name || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-semibold text-navy-800">{u.full_name || 'Unknown'}</span>
                              <span className="text-xs text-text-placeholder ml-2">{u.division || ''}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-text-tertiary">
                                <span className="font-semibold text-text-secondary">{done}</span>/{total} task
                              </div>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  util > 90
                                    ? 'bg-danger-soft text-danger-text'
                                    : util > 70
                                      ? 'bg-pending-soft text-pending-text'
                                      : 'bg-success-soft text-success-text'
                                }`}
                              >
                                {util}% utilization
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <div className="flex-1 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                              <div className="h-full bg-navy-700 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-text-placeholder w-8 text-right">{pct}%</span>
                          </div>
                          <div className="flex gap-3 mt-2">
                            {[
                              { label: 'Total', value: u.task_count || 0, color: 'text-text-tertiary' },
                              { label: 'Done', value: u.done_count || 0, color: 'text-success-text' },
                              { label: 'Est. Hours', value: u.estimated_hours || 0, color: 'text-navy-700' },
                              { label: 'Actual', value: u.actual_hours || 0, color: 'text-amber-600' },
                            ].map((s) => (
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
