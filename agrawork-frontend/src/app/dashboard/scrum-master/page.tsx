'use client';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Zap, BarChart3, Activity, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

export default function ScrumMasterDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      <PageHeader title="Dashboard Scrum Master" subtitle="Kelola sprint dan monitor burndown" icon={Zap}
        actions={<Link href="/workload" className="btn-primary flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4" />Workload</Link>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Projects" value={projects?.length || 0} icon={FolderKanban} color="blue" index={0} />
        <StatCard title="Sprint Aktif" value={projects?.filter((p: any) => p.status === 'active').length || 0} icon={Zap} color="orange" index={1} />
        <StatCard title="Burndown" value="—" icon={BarChart3} color="green" index={2} />
        <StatCard title="Velocity" value="—" icon={Activity} color="purple" index={3} />
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-600 text-slate-800">Active Projects</h2>
          <Link href="/projects" className="text-sm text-[#284074] flex items-center gap-1">Semua <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {projects?.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="p-4 rounded-xl border border-slate-100 hover:border-[#284074]/30 hover:shadow-glow transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-800 group-hover:text-[#284074]">{p.name}</div>
                <span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
              </div>
              <div className="text-xs text-slate-400">Klik untuk lihat board & burndown</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
