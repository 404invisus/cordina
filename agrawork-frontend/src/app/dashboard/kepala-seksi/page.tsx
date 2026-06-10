'use client';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Users, Activity, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

export default function KepalaUnitDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;
  const active = projects?.filter((p: any) => p.status === 'active') || [];

  return (
    <div>
      <PageHeader title="Dashboard Kepala Seksi" subtitle="Supervisi distribusi workload tim" icon={Activity} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Project" value={projects?.length || 0} icon={FolderKanban} color="blue" index={0} />
        <StatCard title="Aktif" value={active.length} icon={Activity} color="green" index={1} />
        <StatCard title="Workload" href="/workload" value="—" icon={Users} color="orange" index={2} />
        <StatCard title="Reports" value="—" icon={BarChart3} color="purple" index={3} />
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-600 text-slate-800">Projects</h2>
          <Link href="/projects" className="text-sm text-[#284074] flex items-center gap-1">Semua <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
        <div className="space-y-3">
          {projects?.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group">
              <div>
                <div className="text-sm font-medium text-slate-800 group-hover:text-[#284074]">{p.name}</div>
                <div className="text-xs text-slate-400">{p.description?.slice(0, 60)}...</div>
              </div>
              <span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
