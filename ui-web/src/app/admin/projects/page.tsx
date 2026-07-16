'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Search, MoreVertical, Trash2, X,
  CheckSquare, Clock, AlertTriangle, Users, Eye,
  Download,
  Loader2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminProjectService, adminReportExportService } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: 'Aktif',    color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  inactive:  { label: 'Nonaktif', color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  completed: { label: 'Selesai',  color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  archived:  { label: 'Arsip',    color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500' },
};

const TASK_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  todo:        { label: 'To Do',       color: 'text-slate-500' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  review:      { label: 'Review',      color: 'text-violet-600' },
  done:        { label: 'Done',        color: 'text-emerald-600' },
};

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
function ProjectDrawer({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data: project, isLoading } = useQuery({
    queryKey: ['admin-project', projectId],
    queryFn: () => adminProjectService.show(projectId).then(r => r.data.data),
  });

  const { data: tasks } = useQuery({
    queryKey: ['admin-project-tasks', projectId],
    queryFn: () => adminProjectService.tasks(projectId).then(r => r.data.data),
  });

  const { data: members } = useQuery({
    queryKey: ['admin-project-members', projectId],
    queryFn: () => adminProjectService.members(projectId).then(r => r.data.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Detail Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
          </div>
        ) : project ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-xl text-slate-900">{project.name}</h3>
                {(() => {
                  const conf = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${conf.bg} ${conf.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                      {conf.label}
                    </span>
                  );
                })()}
              </div>
              {project.description && <p className="text-sm text-slate-500">{project.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-0.5">Mulai</div>
                <div className="text-sm font-semibold text-slate-700">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-0.5">Selesai</div>
                <div className="text-sm font-semibold text-slate-700">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>

            {tasks && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tasks ({tasks.length})</div>
                <div className="space-y-1.5">
                  {Object.entries(
                    tasks.reduce((acc: any, t: any) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {})
                  ).map(([status, count]: any) => {
                    const conf = TASK_STATUS_CONFIG[status] || { label: status, color: 'text-slate-500' };
                    return (
                      <div key={status} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                        <span className={`text-sm font-medium ${conf.color}`}>{conf.label}</span>
                        <span className="text-sm font-bold text-slate-700">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {members && members.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Anggota ({members.length})</div>
                <div className="space-y-2">
                  {members.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-[#284074] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {m.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{m.full_name}</div>
                        <div className="text-xs text-slate-400">{m.pivot?.role || m.roles?.[0] || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
export default function AdminProjectsPage() {
  const qc = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminReportExportService.projects();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'laporan_project.pdf'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Laporan berhasil diunduh');
    } catch { toast.error('Gagal mengunduh laporan'); }
    finally { setExporting(false); }
  };
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu]       = useState<string | null>(null);
  const [viewProject, setViewProject] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ['admin-project-stats'],
    queryFn: () => adminProjectService.stats().then(r => r.data.data),
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['admin-projects', search, statusFilter],
    queryFn: () => adminProjectService.list({ ...(search && {search}), ...(statusFilter && {status: statusFilter}), per_page: 50 }).then(r => r.data),
  });

  const projects = projectsData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminProjectService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects'] });
      qc.invalidateQueries({ queryKey: ['admin-project-stats'] });
      toast.success('Project dihapus');
      setDeleteProject(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-2xl flex items-center justify-center border border-violet-500/10">
            <FolderOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Project</h1>
            <p className="text-sm text-slate-400 mt-0.5">{stats?.total_projects || 0} project terdaftar</p>
          </div>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Ekspor PDF
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={FolderOpen}     label="Total Project"  value={stats.total_projects}           color="text-violet-600" bg="bg-violet-50" />
          <StatCard icon={CheckSquare}    label="Task Selesai"   value={stats.tasks_by_status?.done || 0} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard icon={Clock}          label="In Progress"    value={stats.tasks_by_status?.in_progress || 0} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={AlertTriangle}  label="Overdue Tasks"  value={stats.overdue_tasks || 0}       color="text-red-600"    bg="bg-red-50" />
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        {[{ value: '', label: 'Semua' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map(({ value, label }) => (
          <button key={value} onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === value
                ? 'bg-[#284074] text-white'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all w-full"
              placeholder="Cari project..." />
          </div>
          <span className="ml-auto text-xs text-slate-400">{projects.length} project</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada project</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {['Project', 'Status', 'Periode', 'Members', 'Tasks', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {projects.map((p: any, i: number) => {
                  const sConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
                  return (
                    <motion.tr key={p.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-4 h-4 text-violet-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                            {p.description && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{p.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sConf.bg} ${sConf.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sConf.dot}`} />
                          {sConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {p.start_date ? new Date(p.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}
                        {' — '}
                        {p.end_date ? new Date(p.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {p.members_count ?? '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                          {p.tasks_count ?? '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewProject(p.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#284074]">
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </button>
                            <AnimatePresence>
                              {openMenu === p.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20">
                                  <button onClick={() => { setViewProject(p.id); setOpenMenu(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                                    <Eye className="w-3.5 h-3.5" /> Lihat Detail
                                  </button>
                                  <div className="h-px bg-slate-100 mx-2" />
                                  <button onClick={() => { setDeleteProject(p); setOpenMenu(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {viewProject && <ProjectDrawer projectId={viewProject} onClose={() => setViewProject(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {deleteProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteProject(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Hapus Project?</h3>
              <p className="text-sm text-slate-500 mb-5">
                <span className="font-semibold text-slate-700">{deleteProject.name}</span> dan semua data terkait akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteProject(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Batal
                </button>
                <button onClick={() => deleteMutation.mutate(deleteProject.id)} disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
