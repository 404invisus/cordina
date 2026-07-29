'use client';
import { useQuery } from '@tanstack/react-query';
import CRSummaryCard from '@/components/dashboard/CRSummaryCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FolderKanban, Zap, CheckSquare, BarChart2, ArrowRight } from 'lucide-react';
import { projectService } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusTone, getStatusLabel, STATUS_MAP } from '@/lib/status';

export default function ScrumMasterDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then((r) => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const total = projects?.length || 0;
  const activeProjects = projects?.filter((p: any) => p.status === 'active') || [];
  const doneProjects = projects?.filter((p: any) => p.status === 'done' || p.status === 'completed') || [];

  return (
    <div className="space-y-6">
      <PageHeader
        section="OVERVIEW"
        title="Dashboard"
        subtitle="Manage sprints and monitor burndown"
        actions={
          <Link
            href="/workload"
            className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
          >
            <BarChart2 className="w-3 h-3" />
            Workload
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={total} icon={FolderKanban} color="brand" index={0} subtitle="all projects" />
        <StatCard title="Active Projects" value={activeProjects.length} icon={Zap} color="green" index={1} subtitle="in progress" />
        <StatCard title="Completed" value={doneProjects.length} icon={CheckSquare} color="green" index={2} subtitle="finished" />
        <StatCard title="Workload" value="→" icon={BarChart2} color="brand" index={3} subtitle="view burndown" />
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
            <h2 className="text-[12.5px] font-semibold text-navy-900">Active Projects</h2>
          </div>
          <Link href="/projects" className="text-[11.5px] font-semibold text-navy-700 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-4 grid sm:grid-cols-2 gap-3">
          {projects?.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 + i * 0.05 }}>
              <Link
                href={`/projects/${p.id}`}
                className="flex flex-col p-4 rounded-[6px] border border-border hover:border-navy-700 hover:bg-surface-2 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-[4px] bg-info-soft flex items-center justify-center text-navy-700 text-[10px] font-bold flex-none">
                    {p.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-navy-800 group-hover:text-navy-700 transition-colors truncate">
                      {p.name}
                    </div>
                    {p.division && <div className="text-[11px] text-text-placeholder">{p.division}</div>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_MAP[getStatusTone(p.status)].bg} ${STATUS_MAP[getStatusTone(p.status)].text}`}
                  >
                    {getStatusLabel(p.status)}
                  </span>
                  <span className="text-[11px] text-text-meta group-hover:text-navy-700 transition-colors flex items-center gap-1">
                    Board & Burndown <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
          {(!projects || projects.length === 0) && (
            <div className="col-span-2 text-center py-12 text-text-meta text-[12px]">No projects yet</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
