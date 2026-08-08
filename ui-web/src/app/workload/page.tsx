'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BarChart2, Users, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import { workloadService, projectService, sprintService, reportExportService } from '@/lib/api';
import { BurndownChart, VelocityChart } from '@/components/charts/WorkloadCharts';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

type CapacityLevel = 'overloaded' | 'near_limit' | 'healthy' | 'available';

function capacityLevel(pct: number): CapacityLevel {
  if (pct >= 100) return 'overloaded';
  if (pct >= 85) return 'near_limit';
  if (pct >= 40) return 'healthy';
  return 'available';
}

const dict = {
  en: {
    section: 'CAPACITY',
    title: 'Workload',
    subtitleSelect: 'Select a project and sprint to view team capacity',
    projectFallback: 'Project',
    selectProjectOption: 'Select Project ▾',
    selectSprintOption: 'Select Sprint ▾',
    sprintOption: 'Sprint ▾',
    allMembersOption: 'All Members ▾',
    memberOption: 'Member ▾',
    exportPdf: 'Export PDF',
    exporting: 'Exporting…',
    selectSprintFirst: 'Select a project and sprint first',
    exported: 'Report downloaded',
    exportFailed: 'Failed to download report',
    emptyTitle: 'Select a project and sprint',
    emptySubtitle: 'Choose from the dropdowns above to view team workload data',
    statAvgUtilTitle: 'Avg Utilisation',
    statHighLoad: 'high load',
    statWithinRange: 'within range',
    statOverloadedTitle: 'Overloaded',
    statAbove100: 'above 100%',
    statAvailableTitle: 'Available',
    statUnder40: 'under 40%',
    statVelocityTitle: 'Sprint Velocity',
    statStoryPoints: 'story points',
    burndownTitle: 'Burndown - {sprint}',
    sprintFallback: 'Sprint',
    legendActual: 'Actual',
    legendIdeal: 'Ideal',
    velocityTitle: 'Velocity',
    ptsPerSprint: 'pts / sprint',
    noVelocityData: 'No velocity data',
    workloadPerMember: 'Workload per member',
    membersSorted: '{count} members · sorted by load',
    colMember: 'MEMBER',
    colTasks: 'TASKS',
    colLogged: 'LOGGED',
    colLoad: 'LOAD',
    colCapacity: 'CAPACITY',
    capacityOverloaded: 'Overloaded',
    capacityNearLimit: 'Near limit',
    capacityHealthy: 'Healthy',
    capacityAvailable: 'Available',
  },
  id: {
    section: 'KAPASITAS',
    title: 'Beban Kerja',
    subtitleSelect: 'Pilih proyek dan sprint untuk melihat kapasitas tim',
    projectFallback: 'Proyek',
    selectProjectOption: 'Pilih Proyek ▾',
    selectSprintOption: 'Pilih Sprint ▾',
    sprintOption: 'Sprint ▾',
    allMembersOption: 'Semua Anggota ▾',
    memberOption: 'Anggota ▾',
    exportPdf: 'Ekspor PDF',
    exporting: 'Mengekspor…',
    selectSprintFirst: 'Pilih proyek dan sprint terlebih dahulu',
    exported: 'Laporan berhasil diunduh',
    exportFailed: 'Gagal mengunduh laporan',
    emptyTitle: 'Pilih proyek dan sprint',
    emptySubtitle: 'Pilih dari menu tarik-turun di atas untuk melihat data beban kerja tim',
    statAvgUtilTitle: 'Rata-rata Utilisasi',
    statHighLoad: 'beban tinggi',
    statWithinRange: 'dalam batas normal',
    statOverloadedTitle: 'Kelebihan Beban',
    statAbove100: 'di atas 100%',
    statAvailableTitle: 'Tersedia',
    statUnder40: 'di bawah 40%',
    statVelocityTitle: 'Velositas Sprint',
    statStoryPoints: 'story point',
    burndownTitle: 'Burndown - {sprint}',
    sprintFallback: 'Sprint',
    legendActual: 'Aktual',
    legendIdeal: 'Ideal',
    velocityTitle: 'Velositas',
    ptsPerSprint: 'poin / sprint',
    noVelocityData: 'Tidak ada data velositas',
    workloadPerMember: 'Beban kerja per anggota',
    membersSorted: '{count} anggota · diurutkan berdasarkan beban',
    colMember: 'ANGGOTA',
    colTasks: 'TUGAS',
    colLogged: 'TERCATAT',
    colLoad: 'BEBAN',
    colCapacity: 'KAPASITAS',
    capacityOverloaded: 'Kelebihan Beban',
    capacityNearLimit: 'Mendekati Batas',
    capacityHealthy: 'Sehat',
    capacityAvailable: 'Tersedia',
  },
};

const CAPACITY_STYLE: Record<CapacityLevel, { bg: string; color: string; dot: string }> = {
  overloaded: { bg: '#fdeceb', color: '#a3231c', dot: '#b3261e' },
  near_limit: { bg: '#fbf3e0', color: '#8a6209', dot: '#c9971b' },
  healthy: { bg: '#e9f4ee', color: '#0f6144', dot: '#137a52' },
  available: { bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98' },
};

function capacityLabel(level: CapacityLevel, t: (key: string, vars?: Record<string, string | number>) => string): string {
  switch (level) {
    case 'overloaded':
      return t('capacityOverloaded');
    case 'near_limit':
      return t('capacityNearLimit');
    case 'healthy':
      return t('capacityHealthy');
    case 'available':
      return t('capacityAvailable');
  }
}

const CAPACITY_BAR: Record<CapacityLevel, string> = {
  overloaded: '#b3261e',
  near_limit: '#8a6209',
  healthy: '#0f6144',
  available: '#5c6470',
};

function memberInitials(name: string) {
  return (name || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function WorkloadPage() {
  const t = useT(dict);
  const { hasRole, hasPermission } = useAuthStore();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [exporting, setExporting] = useState(false);
  const canExport = hasPermission('report.export');
  const [selectedMember, setSelectedMember] = useState('');
  const canViewAll = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then((r) => r.data.data),
  });
  const { data: sprints } = useQuery({
    queryKey: ['sprints-list', selectedProject],
    queryFn: () => sprintService.list(selectedProject).then((r) => r.data.data),
    enabled: !!selectedProject,
  });
  const { data: summary, isLoading } = useQuery({
    queryKey: ['workload-summary', selectedSprint],
    queryFn: () => workloadService.summary(selectedSprint).then((r) => r.data.data),
    enabled: !!selectedSprint && canViewAll,
  });
  const { data: mySummary } = useQuery({
    queryKey: ['workload-me', selectedSprint],
    queryFn: () => workloadService.me(selectedSprint).then((r) => r.data.data),
    enabled: !!selectedSprint && !canViewAll,
  });
  const { data: burndown } = useQuery({
    queryKey: ['burndown', selectedSprint],
    queryFn: () => workloadService.burndown(selectedSprint).then((r) => r.data.data),
    enabled: !!selectedSprint,
  });
  const { data: velocity } = useQuery({
    queryKey: ['velocity', selectedProject],
    queryFn: () => workloadService.velocity(selectedProject).then((r) => r.data.data),
    enabled: !!selectedProject,
  });

  const allRows: any[] = canViewAll ? summary || [] : mySummary ? [mySummary] : [];
  const data: any[] = selectedMember ? allRows.filter((r) => r.user_id === selectedMember) : allRows;

  const selectedSprintObj = sprints?.find((s: any) => s.id === selectedSprint);
  const selectedProjectObj = projects?.find((p: any) => p.id === selectedProject);

  const subtitle =
    selectedSprint && selectedSprintObj
      ? `${selectedProjectObj?.name || t('projectFallback')} · ${selectedSprintObj.name}`
      : t('subtitleSelect');

  /* ── Derived stats ── */
  const loadPcts = data.map((r) => (r.estimated_hours > 0 ? Math.round((r.actual_hours / r.estimated_hours) * 100) : 0));
  const avgUtil = loadPcts.length > 0 ? Math.round(loadPcts.reduce((a, b) => a + b, 0) / loadPcts.length) : 0;
  const overloaded = loadPcts.filter((p) => p >= 100).length;
  const available = loadPcts.filter((p) => p < 40).length;
  const sprintVelocity = velocity?.length > 0 ? (velocity[velocity.length - 1]?.total_points ?? 0) : 0;

  const handleExport = async () => {
    if (!selectedSprint) {
      toast.error(t('selectSprintFirst'));
      return;
    }
    setExporting(true);
    try {
      const res = await reportExportService.workload(selectedSprint);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `workload_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('exported'));
    } catch {
      toast.error(t('exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        section={t('section')}
        title={t('title')}
        subtitle={subtitle}
        actions={
          <>
            {/* Project selector */}
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedSprint('');
                  setSelectedMember('');
                }}
                className="h-[34px] pl-[11px] pr-[26px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary appearance-none cursor-pointer focus:outline-none"
              >
                <option value="">{t('selectProjectOption')}</option>
                {projects?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-[8px] top-1/2 -translate-y-1/2 w-3 h-3 text-text-placeholder pointer-events-none" />
            </div>

            {/* Sprint selector */}
            <div className="relative">
              <select
                value={selectedSprint}
                onChange={(e) => {
                  setSelectedSprint(e.target.value);
                  setSelectedMember('');
                }}
                disabled={!selectedProject}
                className="h-[34px] pl-[11px] pr-[26px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary appearance-none cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{selectedProject ? t('selectSprintOption') : t('sprintOption')}</option>
                {sprints?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-[8px] top-1/2 -translate-y-1/2 w-3 h-3 text-text-placeholder pointer-events-none" />
            </div>

            {/* Member selector */}
            {canViewAll && (
              <div className="relative">
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  disabled={!selectedSprint || allRows.length === 0}
                  className="h-[34px] pl-[11px] pr-[26px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary appearance-none cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{selectedSprint ? t('allMembersOption') : t('memberOption')}</option>
                  {allRows.map((r: any) => (
                    <option key={r.user_id} value={r.user_id}>
                      {r.full_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-[8px] top-1/2 -translate-y-1/2 w-3 h-3 text-text-placeholder pointer-events-none" />
              </div>
            )}

            {canExport && (
              <button
                onClick={handleExport}
                disabled={exporting || !selectedSprint}
                className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? t('exporting') : t('exportPdf')}
              </button>
            )}
          </>
        }
      />

      <AnimatePresence mode="wait">
        {!selectedSprint ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState
              icon={BarChart2}
              title={t('emptyTitle')}
              subtitle={t('emptySubtitle')}
            />
          </motion.div>
        ) : isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-[14px]">
            {/* 4 StatCards */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard
                index={0}
                title={t('statAvgUtilTitle')}
                value={`${avgUtil}%`}
                subtitle={avgUtil > 80 ? t('statHighLoad') : t('statWithinRange')}
                icon={Activity}
                color="brand"
                progress={Math.min(100, avgUtil)}
              />
              <StatCard
                index={1}
                title={t('statOverloadedTitle')}
                value={overloaded}
                subtitle={t('statAbove100')}
                icon={AlertTriangle}
                color="red"
                progress={Math.min(100, overloaded * 12)}
              />
              <StatCard
                index={2}
                title={t('statAvailableTitle')}
                value={available}
                subtitle={t('statUnder40')}
                icon={Users}
                color="green"
                progress={Math.min(100, available * 12)}
              />
              <StatCard
                index={3}
                title={t('statVelocityTitle')}
                value={sprintVelocity}
                subtitle={t('statStoryPoints')}
                icon={TrendingUp}
                color="green"
                progress={100}
              />
            </div>

            {/* Charts */}
            <div className="flex flex-col gap-[14px]">
              {/* Burndown */}
              <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden" style={{ height: 300 }}>
                <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle gap-[10px]">
                  <span className="text-[12.5px] font-semibold text-navy-900">{t('burndownTitle', { sprint: selectedSprintObj?.name || t('sprintFallback') })}</span>
                  <div className="ml-auto flex items-center gap-[10px] text-[10px] text-neutral font-mono">
                    <span className="flex items-center gap-[4px]">
                      <span className="inline-block w-3 h-[2px] bg-navy-700" />
                      {t('legendActual')}
                    </span>
                    <span className="flex items-center gap-[4px]">
                      <span className="inline-block w-3 h-0 border-t-2 border-dashed border-text-meta" />
                      {t('legendIdeal')}
                    </span>
                  </div>
                </div>
                <div className="flex-1 px-[15px] py-[8px] min-h-0">
                  <BurndownChart data={burndown} workloadData={data} />
                </div>
              </div>

              {/* Velocity */}
              <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden" style={{ height: 300 }}>
                <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle gap-[10px]">
                  <span className="text-[12.5px] font-semibold text-navy-900">{t('velocityTitle')}</span>
                  <span className="ml-auto font-mono text-[9.5px] text-text-meta">{t('ptsPerSprint')}</span>
                </div>
                <div className="flex-1 px-[15px] py-[8px] min-h-0">
                  {velocity && selectedProject ? (
                    <VelocityChart data={velocity} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[11px] text-neutral">{t('noVelocityData')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Member workload table */}
            {canViewAll && data.length > 0 && (
              <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
                <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle gap-[10px]">
                  <span className="text-[12.5px] font-semibold text-navy-900">{t('workloadPerMember')}</span>
                  <span className="ml-auto text-[11px] text-neutral">{t('membersSorted', { count: data.length })}</span>
                </div>

                {/* Table header */}
                <div
                  className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
                  style={{ gridTemplateColumns: '1fr 96px 88px 88px 150px 100px' }}
                >
                  {[t('colMember'), t('colTasks'), t('colLogged'), t('colLoad'), '', t('colCapacity')].map((h, i) => (
                    <div
                      key={i}
                      className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral"
                      style={i === 5 ? { textAlign: 'right' } : {}}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {[...data]
                  .sort((a, b) => {
                    const pa = a.estimated_hours > 0 ? a.actual_hours / a.estimated_hours : 0;
                    const pb = b.estimated_hours > 0 ? b.actual_hours / b.estimated_hours : 0;
                    return pb - pa;
                  })
                  .map((row: any, i: number) => {
                    const loadPct = row.estimated_hours > 0 ? Math.round((row.actual_hours / row.estimated_hours) * 100) : 0;
                    const level = capacityLevel(loadPct);
                    const badge = CAPACITY_STYLE[level];
                    const badgeLabel = capacityLabel(level, t);
                    const barColor = CAPACITY_BAR[level];

                    return (
                      <motion.div
                        key={row.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="grid px-[15px] h-[34px] items-center border-b border-border-subtle transition-colors hover:bg-surface-2"
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
                          <div className="w-[24px] h-[24px] rounded-full bg-info-soft text-navy-700 flex items-center justify-center font-mono text-[9.5px] font-bold flex-none">
                            {memberInitials(row.full_name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12.5px] font-semibold text-navy-800">{row.full_name}</span>
                            {row.division && <span className="font-mono text-[10px] text-text-placeholder">{row.division}</span>}
                          </div>
                        </div>

                        {/* Tasks */}
                        <div className="font-mono text-[11px] text-text-secondary">{row.task_count}</div>

                        {/* Logged hours */}
                        <div className="font-mono text-[11px] text-text-secondary">{row.actual_hours} h</div>

                        {/* Load % */}
                        <div className="font-mono text-[11px] font-semibold" style={{ color: barColor }}>
                          {loadPct}%
                        </div>

                        {/* Bar */}
                        <div className="flex items-center gap-[7px]">
                          <div className="flex-1 h-[6px] rounded-[2px] bg-border-subtle overflow-hidden">
                            <div className="h-full rounded-[2px]" style={{ width: `${Math.min(100, loadPct)}%`, background: barColor }} />
                          </div>
                        </div>

                        {/* Capacity badge */}
                        <div className="flex justify-end">
                          <span
                            className="inline-flex items-center gap-[5px] h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            <span className="w-[5px] h-[5px] rounded-full" style={{ background: badge.dot }} />
                            {badgeLabel}
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
