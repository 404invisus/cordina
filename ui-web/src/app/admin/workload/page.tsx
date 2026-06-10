'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity, Users, TrendingUp, AlertCircle,
  ChevronDown, BarChart2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminWorkloadService, adminProjectService } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

const GRADIENTS = [
  'from-[#284074] to-[#3d5a9e]', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',    'from-cyan-500 to-blue-600',
];
function getGradient(name: string) {
  return GRADIENTS[(name?.charCodeAt(0) || 0) % GRADIENTS.length];
}
function getInitials(name: string) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-2xl font-extrabold text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminWorkloadPage() {
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['admin-projects-list'],
    queryFn: () => adminProjectService.list({ per_page: 50 }).then(r => r.data.data),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-workload-summary', selectedSprint],
    queryFn: () => adminWorkloadService.summary(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint,
  });

  const { data: capacity } = useQuery({
    queryKey: ['admin-workload-capacity', selectedSprint],
    queryFn: () => adminWorkloadService.capacityOverview(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint,
  });

  const { data: burndown } = useQuery({
    queryKey: ['admin-workload-burndown', selectedSprint],
    queryFn: () => adminWorkloadService.burndown(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint,
  });

  const { data: velocity } = useQuery({
    queryKey: ['admin-workload-velocity', selectedProject],
    queryFn: () => adminWorkloadService.velocity(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject,
  });

  const userWorkloads: any[] = summary || [];

  return (
    <AppLayout> 
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl flex items-center justify-center border border-emerald-500/10">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monitor Workload</h1>
            <p className="text-sm text-slate-400 mt-0.5">Pantau kapasitas dan beban kerja tim</p>
          </div>
        </div>
      </div>

      {false && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users}        label="Total User"      value={summary.total_users || userWorkloads.length} color="text-[#284074]"   bg="bg-[#284074]/10" />
          <StatCard icon={Activity}     label="Task Aktif"      value={summary.total_tasks || 0}         color="text-blue-600"    bg="bg-blue-50" />
          <StatCard icon={TrendingUp}   label="Selesai Sprint"  value={summary.completed_tasks || 0}     color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard icon={AlertCircle}  label="Overdue"         value={summary.overdue_tasks || 0}       color="text-red-600"     bg="bg-red-50" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#284074]" />
              <h3 className="font-bold text-slate-800 text-sm">Burndown Chart</h3>
            </div>
            <div className="text-xs text-slate-400">Sprint {selectedSprint || 'terkini'}</div>
          </div>
          {burndown?.data?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={burndown.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ideal"     stroke="#94a3b8" strokeDasharray="5 3" dot={false} name="Ideal" strokeWidth={1.5} />
                <Line type="monotone" dataKey="remaining" stroke="#284074"               dot={false} name="Aktual" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] text-slate-300">
              <TrendingUp className="w-8 h-8 mb-2" />
              <p className="text-xs">Pilih sprint untuk melihat burndown</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-600" />
              <h3 className="font-bold text-slate-800 text-sm">Velocity per Sprint</h3>
            </div>
            <div className="relative">
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
                <option value="">Pilih project</option>
                {(projects || []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {velocity?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={velocity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sprint_name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Bar dataKey="completed_points" fill="#284074" radius={[4,4,0,0]} name="Story Points" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] text-slate-300">
              <BarChart2 className="w-8 h-8 mb-2" />
              <p className="text-xs">Pilih project untuk melihat velocity</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Workload per User</h3>
          </div>
        </div>

        {loadingSummary ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
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
              const done = u.done_count || 0;
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
              const utilization = Math.round(u.allocated_hours > 0 ? (u.actual_hours / u.allocated_hours) * 100 : 0);

              return (
                <motion.div key={u.user_id || i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(u.full_name || '')} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      {getInitials(u.full_name || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-semibold text-slate-800">{u.full_name}</span>
                          <span className="text-xs text-slate-400 ml-2">{u.division || ''}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{done}</span>/{total} task
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            utilization > 90 ? 'bg-red-50 text-red-600' :
                            utilization > 70 ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {utilization}% utilisasi
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#284074] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                      <div className="flex gap-3 mt-2">
                        {[
                          { label: 'Total Task', value: u.task_count || 0, color: 'text-slate-500' },
                          { label: 'Selesai', value: u.done_count || 0, color: 'text-emerald-600' },
                          { label: 'Est. Jam', value: u.estimated_hours || 0, color: 'text-violet-600' },
                          { label: 'Aktual Jam', value: u.actual_hours || 0, color: 'text-amber-600' },
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
    </AppLayout>
  );
}
