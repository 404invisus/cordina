'use client';
import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { projectService } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function KepalaUnitDashboard() {
  const { user } = useAuthStore();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const active = projects?.filter((p: any) => p.status === 'active') || [];
  const done   = projects?.filter((p: any) => p.status === 'done') || [];

  const stats = [
    { label: 'Total Project', value: projects?.length || 0, sub: 'semua project', color: 'text-[#284074]', bg: 'bg-[#284074]/8',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]"><path d="M3 7a2 2 0 012-2h4l2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>, href: '/projects' },
    { label: 'Aktif', value: active.length, sub: 'sedang berjalan', color: 'text-emerald-600', bg: 'bg-emerald-50',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-emerald-500"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, href: '/projects' },
    { label: 'Workload', value: '→', sub: 'distribusi tim', color: 'text-orange-600', bg: 'bg-orange-50',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-orange-500"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, href: '/workload' },
    { label: 'Reports', value: '→', sub: 'analitik project', color: 'text-violet-600', bg: 'bg-violet-50',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-violet-500"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, href: '/reports' },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Supervisi distribusi workload tim</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/workload"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            Workload
          </Link>
          <Link href="/reports"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] transition-all shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Link href={s.href}
              className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 hover:border-slate-200 hover:shadow-sm transition-all block">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
              <div className="min-w-0">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 font-medium truncate">{s.label}</div>
                <div className="text-xs text-slate-300">{s.sub}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <CRSummaryCard />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
              <path d="M3 7a2 2 0 012-2h4l2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            Projects
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{active.length} aktif · {done.length} selesai</span>
            <Link href="/projects" className="text-xs font-semibold text-[#284074] hover:underline flex items-center gap-1">
              Semua
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {projects?.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 + i * 0.04 }}>
              <Link href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 group transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 border border-[#284074]/10 flex items-center justify-center text-[#284074] text-xs font-bold flex-shrink-0">
                  {p.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 group-hover:text-[#284074] transition-colors truncate">{p.name}</div>
                  {p.description && (
                    <div className="text-xs text-slate-400 truncate mt-0.5">{p.description}</div>
                  )}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(p.status)}`}>
                  {getStatusLabel(p.status)}
                </span>
              </Link>
            </motion.div>
          ))}
          {(!projects || projects.length === 0) && (
            <div className="text-center py-12 text-slate-300 text-sm">Belum ada project</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
