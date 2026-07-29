'use client';
import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FolderKanban, Activity, Users, BarChart2, ArrowRight } from 'lucide-react';
import { projectService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusTone, getStatusLabel, STATUS_MAP } from '@/lib/status';

export default function KepalaUnitDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then((r) => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const total = projects?.length || 0;
  const active = projects?.filter((p: any) => p.status === 'active')?.length || 0;
  const done = projects?.filter((p: any) => p.status === 'done')?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        section="OVERVIEW"
        title="Dashboard"
        subtitle="Supervise team workload distribution"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/workload"
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
            >
              <Users className="w-3 h-3" />
              Workload
            </Link>
            <Link
              href="/reports"
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <BarChart2 className="w-3 h-3" />
              Reports
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={total} icon={FolderKanban} color="brand" index={0} subtitle="all projects" />
        <StatCard title="Active Projects" value={active} icon={Activity} color="green" index={1} subtitle="in progress" />
        <StatCard title="Workload" value="→" icon={Users} color="brand" index={2} subtitle="team distribution" />
        <StatCard title="Reports" value="→" icon={BarChart2} color="brand" index={3} subtitle="project analytics" />
      </div>

      <CRSummaryCard />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="bg-white border border-border rounded-[6px] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-navy-700" />
            <h2 className="text-[12.5px] font-semibold text-navy-900">Projects</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-text-meta">
              {active} active · {done} completed
            </span>
            <Link href="/projects" className="text-[11.5px] font-semibold text-navy-700 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="divide-y divide-border-subtle">
          {projects?.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 + i * 0.04 }}>
              <Link href={`/projects/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2 group transition-colors">
                <div className="w-8 h-8 rounded-[4px] bg-info-soft flex items-center justify-center text-navy-700 text-[10px] font-bold flex-none">
                  {p.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-navy-800 group-hover:text-navy-700 transition-colors truncate">
                    {p.name}
                  </div>
                  {p.description && <div className="text-[11px] text-text-placeholder truncate mt-0.5">{p.description}</div>}
                </div>
                <span
                  className={`flex-none text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_MAP[getStatusTone(p.status)].bg} ${STATUS_MAP[getStatusTone(p.status)].text}`}
                >
                  {getStatusLabel(p.status)}
                </span>
              </Link>
            </motion.div>
          ))}
          {(!projects || projects.length === 0) && <div className="text-center py-12 text-text-meta text-[12px]">No projects yet</div>}
        </div>
      </motion.div>
    </div>
  );
}
