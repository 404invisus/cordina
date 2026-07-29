'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, BarChart2, Users, TrendingUp, AlertTriangle, ChevronDown,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import { workloadService, projectService, sprintService } from '@/lib/api';
import { BurndownChart, VelocityChart } from '@/components/charts/WorkloadCharts';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

type CapacityLevel = 'overloaded' | 'near_limit' | 'healthy' | 'available';

function capacityLevel(pct: number): CapacityLevel {
  if (pct >= 100) return 'overloaded';
  if (pct >= 85)  return 'near_limit';
  if (pct >= 40)  return 'healthy';
  return 'available';
}

const CAPACITY_BADGE: Record<CapacityLevel, { label: string; bg: string; color: string; dot: string }> = {
  overloaded:  { label: 'Overloaded', bg: '#fdeceb', color: '#a3231c', dot: '#b3261e' },
  near_limit:  { label: 'Near limit',  bg: '#fbf3e0', color: '#8a6209', dot: '#c9971b' },
  healthy:     { label: 'Healthy',     bg: '#e9f4ee', color: '#0f6144', dot: '#137a52' },
  available:   { label: 'Available',   bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98' },
};

const CAPACITY_BAR: Record<CapacityLevel, string> = {
  overloaded: '#b3261e',
  near_limit: '#8a6209',
  healthy:    '#0f6144',
  available:  '#5c6470',
};

function memberInitials(name: string) {
  return (name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function WorkloadPage() {
  const { hasRole } = useAuthStore();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint,  setSelectedSprint]  = useState('');
  const canViewAll = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });
  const { data: sprints } = useQuery({
    queryKey: ['sprints-list', selectedProject],
    queryFn: () => sprintService.list(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject,
  });
  const { data: summary, isLoading } = useQuery({
    queryKey: ['workload-summary', selectedSprint],
    queryFn: () => workloadService.summary(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint && canViewAll,
  });
  const { data: mySummary } = useQuery({
    queryKey: ['workload-me', selectedSprint],
    queryFn: () => workloadService.me(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint && !canViewAll,
  });
  const { data: burndown } = useQuery({
    queryKey: ['burndown', selectedSprint],
    queryFn: () => workloadService.burndown(selectedSprint).then(r => r.data.data),
    enabled: !!selectedSprint,
  });
  const { data: velocity } = useQuery({
    queryKey: ['velocity', selectedProject],
    queryFn: () => workloadService.velocity(selectedProject).then(r => r.data.data),
    enabled: !!selectedProject,
  });

  const data: any[] = canViewAll ? (summary || []) : (mySummary ? [mySummary] : []);

  const selectedSprintObj = sprints?.find((s: any) => s.id === selectedSprint);
  const selectedProjectObj = projects?.find((p: any) => p.id === selectedProject);

  const subtitle = selectedSprint && selectedSprintObj
    ? `${selectedProjectObj?.name || 'Project'} · ${selectedSprintObj.name}`
    : 'Select a project and sprint to view team capacity';

  /* ── Derived stats ── */
  const loadPcts = data.map(r =>
    r.estimated_hours > 0 ? Math.round((r.actual_hours / r.estimated_hours) * 100) : 0
  );
  const avgUtil    = loadPcts.length > 0 ? Math.round(loadPcts.reduce((a, b) => a + b, 0) / loadPcts.length) : 0;
  const overloaded = loadPcts.filter(p => p >= 100).length;
  const available  = loadPcts.filter(p => p < 40).length;
  const sprintVelocity = velocity?.length > 0
    ? velocity[velocity.length - 1]?.total_points ?? 0
    : 0;

  return (
    <AppLayout>
      <PageHeader
        section="CAPACITY"
        title="Workload"
        subtitle={subtitle}
        actions={
          <>
            {/* Project selector */}
            <div className="relative">
              <select
                value={selectedProject}
                onChange={e => { setSelectedProject(e.target.value); setSelectedSprint(''); }}
                className="h-[34px] pl-[11px] pr-[26px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] appearance-none cursor-pointer focus:outline-none"
              >
                <option value="">Select Project ▾</option>
                {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="absolute right-[8px] top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" />
            </div>

            {/* Sprint selector */}
            <div className="relative">
              <select
                value={selectedSprint}
                onChange={e => setSelectedSprint(e.target.value)}
                disabled={!selectedProject}
                className="h-[34px] pl-[11px] pr-[26px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] appearance-none cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{selectedProject ? 'Select Sprint ▾' : 'Sprint ▾'}</option>
                {sprints?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-[8px] top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" />
            </div>

            <button className="h-[34px] flex items-center gap-[6px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
              Export PDF
            </button>
            <button
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              Rebalance
            </button>
          </>
        }
      />

      <AnimatePresence mode="wait">
        {!selectedSprint ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={BarChart2}
              title="Select a project and sprint"
              subtitle="Choose from the dropdowns above to view team workload data"
            />
          </motion.div>
        ) : isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-[14px]"
          >
            {/* 4 StatCards */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard
                index={0} title="Avg Utilisation" value={`${avgUtil}%`}
                subtitle={avgUtil > 80 ? 'high load' : 'within range'}
                icon={Activity} color="brand" progress={Math.min(100, avgUtil)}
              />
              <StatCard
                index={1} title="Overloaded" value={overloaded}
                subtitle="above 100%"
                icon={AlertTriangle} color="red" progress={Math.min(100, overloaded * 12)}
              />
              <StatCard
                index={2} title="Available" value={available}
                subtitle="under 40%"
                icon={Users} color="green" progress={Math.min(100, available * 12)}
              />
              <StatCard
                index={3} title="Sprint Velocity" value={sprintVelocity}
                subtitle="story points"
                icon={TrendingUp} color="green" progress={100}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 340px', height: 200 }}>
              {/* Burndown */}
              <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
                <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4] gap-[10px]">
                  <span className="text-[12.5px] font-semibold text-[#0d2b48]">
                    Burndown — {selectedSprintObj?.name || 'Sprint'}
                  </span>
                  <div className="ml-auto flex items-center gap-[10px] text-[10px] text-[#8a8f98] font-mono">
                    <span className="flex items-center gap-[4px]">
                      <span className="inline-block w-3 h-[2px] bg-brand" />Actual
                    </span>
                    <span className="flex items-center gap-[4px]">
                      <span className="inline-block w-3 h-0 border-t-2 border-dashed border-[#c0bcb4]" />Ideal
                    </span>
                  </div>
                </div>
                <div className="flex-1 px-[15px] py-[8px] min-h-0">
                  <BurndownChart data={burndown} workloadData={data} />
                </div>
              </div>

              {/* Velocity */}
              <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
                <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4] gap-[10px]">
                  <span className="text-[12.5px] font-semibold text-[#0d2b48]">Velocity</span>
                  <span className="ml-auto font-mono text-[9.5px] text-[#a6a094]">pts / sprint</span>
                </div>
                <div className="flex-1 px-[15px] py-[8px] min-h-0">
                  {velocity && selectedProject
                    ? <VelocityChart data={velocity} />
                    : <div className="flex items-center justify-center h-full text-[11px] text-[#8a8f98]">No velocity data</div>
                  }
                </div>
              </div>
            </div>

            {/* Member workload table */}
            {canViewAll && data.length > 0 && (
              <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
                <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4] gap-[10px]">
                  <span className="text-[12.5px] font-semibold text-[#0d2b48]">Workload per member</span>
                  <span className="ml-auto text-[11px] text-[#8a8f98]">{data.length} members · sorted by load</span>
                </div>

                {/* Table header */}
                <div
                  className="grid px-[15px] h-[30px] items-center border-b border-[#eceae4] bg-[#faf9f7]"
                  style={{ gridTemplateColumns: '1fr 96px 88px 88px 150px 100px' }}
                >
                  {['MEMBER', 'TASKS', 'LOGGED', 'LOAD', '', 'CAPACITY'].map((h, i) => (
                    <div
                      key={i}
                      className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]"
                      style={i === 5 ? { textAlign: 'right' } : {}}
                    >{h}</div>
                  ))}
                </div>

                {/* Rows */}
                {[...data]
                  .sort((a, b) => {
                    const pa = a.estimated_hours > 0 ? (a.actual_hours / a.estimated_hours) : 0;
                    const pb = b.estimated_hours > 0 ? (b.actual_hours / b.estimated_hours) : 0;
                    return pb - pa;
                  })
                  .map((row: any, i: number) => {
                    const loadPct = row.estimated_hours > 0
                      ? Math.round((row.actual_hours / row.estimated_hours) * 100)
                      : 0;
                    const level = capacityLevel(loadPct);
                    const badge = CAPACITY_BADGE[level];
                    const barColor = CAPACITY_BAR[level];

                    return (
                      <motion.div
                        key={row.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="grid px-[15px] h-[34px] items-center border-b border-[#f2f0ec] transition-colors hover:bg-[#faf9f7]"
                        style={{
                          gridTemplateColumns: '1fr 96px 88px 88px 150px 100px',
                          ...(level === 'overloaded' && {
                            boxShadow: 'inset 2px 0 0 #b3261e',
                            background: '#fffbfb',
                          }),
                        }}
                      >
                        {/* Member */}
                        <div className="flex items-center gap-[9px]">
                          <div className="w-[24px] h-[24px] rounded-full bg-[#eaf1f8] text-brand flex items-center justify-center font-mono text-[9.5px] font-bold flex-none">
                            {memberInitials(row.full_name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12.5px] font-semibold text-[#12283c]">{row.full_name}</span>
                            {row.division && (
                              <span className="font-mono text-[10px] text-[#9ca3af]">{row.division}</span>
                            )}
                          </div>
                        </div>

                        {/* Tasks */}
                        <div className="font-mono text-[11px] text-[#4b5563]">{row.task_count}</div>

                        {/* Logged hours */}
                        <div className="font-mono text-[11px] text-[#4b5563]">{row.actual_hours} h</div>

                        {/* Load % */}
                        <div
                          className="font-mono text-[11px] font-semibold"
                          style={{ color: barColor }}
                        >
                          {loadPct}%
                        </div>

                        {/* Bar */}
                        <div className="flex items-center gap-[7px]">
                          <div className="flex-1 h-[6px] rounded-[2px] bg-[#eceae4] overflow-hidden">
                            <div
                              className="h-full rounded-[2px]"
                              style={{ width: `${Math.min(100, loadPct)}%`, background: barColor }}
                            />
                          </div>
                        </div>

                        {/* Capacity badge */}
                        <div className="flex justify-end">
                          <span
                            className="inline-flex items-center gap-[5px] h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            <span className="w-[5px] h-[5px] rounded-full" style={{ background: badge.dot }} />
                            {badge.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
