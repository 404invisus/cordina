'use client';
import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { projectService, taskService } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  medium:   'bg-amber-400',
  low:      'bg-green-400',
};

export default function ProjectManagerDashboard() {
  const { user } = useAuthStore();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });
  const { data: myTasks } = useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => taskService.list({ assignee_id: user?.id }).then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const inProgress = myTasks?.filter((t: any) => t.status === 'in_progress') || [];
  const todo       = myTasks?.filter((t: any) => t.status === 'todo') || [];
  const done       = myTasks?.filter((t: any) => t.status === 'done') || [];
  const activeProjects = projects?.filter((p: any) => p.status === 'active') || [];

  const stats = [
    { label: 'Total Projects', value: projects?.length || 0, sub: `${activeProjects.length} aktif`, color: 'text-[#284074]', bg: 'bg-[#284074]/8', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]"><path d="M3 7a2 2 0 012-2h4l2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg> },
    { label: 'Task Saya', value: myTasks?.length || 0, sub: `${done.length} selesai`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-emerald-500"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
    { label: 'In Progress', value: inProgress.length, sub: 'sedang dikerjakan', color: 'text-blue-600', bg: 'bg-blue-50', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-blue-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'To Do', value: todo.length, sub: 'menunggu dikerjakan', color: 'text-violet-600', bg: 'bg-violet-50', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-violet-500"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Selamat datang, {user?.full_name}</p>
          </div>
        </div>
        <Link href="/projects"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] transition-all shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Sprint
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div className="min-w-0">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 truncate">{s.label}</div>
              <div className="text-xs text-slate-300">{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <CRSummaryCard />

      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <path d="M3 7a2 2 0 012-2h4l2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              </svg>
              Projects
            </h2>
            <Link href="/projects" className="text-xs font-semibold text-[#284074] hover:underline flex items-center gap-1">
              Lihat semua
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {projects?.slice(0, 5).map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}>
                <Link href={`/projects/${p.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 group transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 flex items-center justify-center flex-shrink-0 text-[#284074] text-xs font-bold border border-[#284074]/10">
                      {p.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-[#284074] transition-colors truncate">{p.name}</div>
                      {p.division && <div className="text-xs text-slate-400">{p.division}</div>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-3 ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </Link>
              </motion.div>
            ))}
            {(!projects || projects.length === 0) && (
              <div className="text-center py-10 text-slate-300 text-sm">Belum ada project</div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Task Saya
            </h2>
            <Link href="/tasks" className="text-xs font-semibold text-[#284074] hover:underline flex items-center gap-1">
              Semua
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {myTasks?.slice(0, 6).map((t: any, i: number) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }}>
                <Link href={`/tasks/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 group transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] || 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 group-hover:text-[#284074] transition-colors truncate">{t.title}</div>
                    <div className="text-xs text-slate-400">{t.due_date ? formatDate(t.due_date) : 'No due date'}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(t.status)}`}>
                    {getStatusLabel(t.status)}
                  </span>
                </Link>
              </motion.div>
            ))}
            {(!myTasks || myTasks.length === 0) && (
              <div className="text-center py-10 text-slate-300 text-sm">Tidak ada task</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
