'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FolderKanban, Users, CheckSquare, Activity, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { projectService, userService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';

export default function KepalaBalaiDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const activeProjects = projects?.filter((p: any) => p.status === 'active') || [];
  const totalProjects = projects?.length || 0;

  return (
    <div>
      <PageHeader
        title="Dashboard Kepala Balai"
        subtitle="Pantau seluruh project dan tim"
        icon={Activity}
        actions={
          <Link href="/projects" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Buat Project
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Project" value={totalProjects} icon={FolderKanban} color="blue" index={0} />
        <StatCard title="Project Aktif" value={activeProjects.length} icon={TrendingUp} color="green" index={1} />
        <StatCard title="Total Anggota" value={users?.length || 0} icon={Users} color="purple" index={2} />
        <StatCard title="Selesai" value={projects?.filter((p: any) => p.status === 'completed')?.length || 0} icon={CheckSquare} color="orange" index={3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Projects list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-slate-800">Semua Project</h2>
            <Link href="/projects" className="text-sm text-[#284074] font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {projects?.slice(0, 6).map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#284074]/10 rounded-lg flex items-center justify-center">
                      <FolderKanban className="w-4 h-4 text-[#284074]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800 group-hover:text-[#284074] transition-colors">{p.name}</div>
                      <div className="text-xs text-slate-400">{formatDate(p.start_date)} – {formatDate(p.end_date)}</div>
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
                </Link>
              </motion.div>
            ))}
            {(!projects || projects.length === 0) && (
              <div className="text-center py-8 text-slate-400 text-sm">Belum ada project</div>
            )}
          </div>
        </div>

        {/* Team */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-slate-800">Tim</h2>
            <Link href="/admin/users" className="text-sm text-[#284074] font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Kelola <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {users?.slice(0, 8).map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-[#284074] flex items-center justify-center text-white text-xs font-600">
                  {u.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{u.full_name}</div>
                  <div className="text-xs text-slate-400">{u.division}</div>
                </div>
                <span className="text-xs text-[#284074] font-medium">{u.roles?.[0]?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
