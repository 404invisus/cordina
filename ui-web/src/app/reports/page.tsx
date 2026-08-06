'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { reportService, reportExportService, projectService, sprintService } from '@/lib/api';
import { FileBarChart2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocale, useT } from '@/lib/i18n';

const REPORT_TABS = [
  { id: 'workload', label: 'Workload', needsSprint: true },
  { id: 'sprint', label: 'Sprint', needsSprint: true },
  { id: 'time', label: 'Time tracking', needsSprint: false },
  { id: 'velocity', label: 'Velocity', needsSprint: false },
  { id: 'portfolio', label: 'Portfolio', needsSprint: false },
];

const TAB_LABEL_KEY: Record<string, string> = {
  workload: 'tabWorkload',
  sprint: 'tabSprint',
  time: 'tabTime',
  velocity: 'tabVelocity',
  portfolio: 'tabPortfolio',
};

function tabLabel(id: string | undefined, t: ReturnType<typeof useT>): string {
  if (!id || !TAB_LABEL_KEY[id]) return '';
  return t(TAB_LABEL_KEY[id]);
}

const dict = {
  en: {
    reporting: 'REPORTING',
    reports: 'Reports',
    subtitle: 'Same layout on screen and in the exported PDF',
    schedule: 'Schedule',
    exporting: 'Exporting…',
    exportPdf: 'Export PDF',
    exportFailed: 'Export failed',
    tabWorkload: 'Workload',
    tabSprint: 'Sprint',
    tabTime: 'Time tracking',
    tabVelocity: 'Velocity',
    tabPortfolio: 'Portfolio',
    requiredLabel: 'REQUIRED',
    chooseProject: 'Project: choose one',
    chooseSprintToContinue: 'Sprint: choose one to continue',
    chooseProjectToContinue: 'Choose a project to continue',
    reportNeedsSprint: '{label} report needs a sprint',
    chooseDateRangeToContinue: 'Choose a date range to continue',
    noReportToPreview: 'No report to preview',
    selectFiltersToGenerate: 'Select filters above to generate a report',
    livePreviewLabel: 'LIVE PREVIEW: EXACTLY WHAT THE PDF CONTAINS',
    a4Portrait: 'A4 · PORTRAIT',
    project: 'Project',
    reportOf: '{label} Report',
    generatedInline: 'Generated {date}',
    filtered: 'Filtered:',
    taskDistribution: 'TASK DISTRIBUTION',
    total: 'Total',
    done: 'Done',
    progressPerMember: 'PROGRESS PER MEMBER',
    totalTasks: 'TOTAL TASKS',
    completedLabel: 'COMPLETED',
    completionLabel: 'COMPLETION',
    statusBreakdown: 'STATUS BREAKDOWN',
    timeLogEntries: 'TIME LOG - {count} entries',
    colTask: 'TASK',
    colSprint: 'SPRINT',
    colHrs: 'HRS',
    colDate: 'DATE',
    velocityPerSprint: 'VELOCITY PER SPRINT',
    planned: 'Planned',
    completed: 'Completed',
    exportLabel: 'EXPORT',
    scope: 'SCOPE',
    sprintWord: 'Sprint',
    dateRange: 'Date range',
    generatedLabel: 'Generated',
  },
  id: {
    reporting: 'PELAPORAN',
    reports: 'Laporan',
    subtitle: 'Tata letak yang sama di layar dan pada PDF yang diekspor',
    schedule: 'Jadwalkan',
    exporting: 'Mengekspor…',
    exportPdf: 'Ekspor PDF',
    exportFailed: 'Ekspor gagal',
    tabWorkload: 'Beban Kerja',
    tabSprint: 'Sprint',
    tabTime: 'Pelacakan Waktu',
    tabVelocity: 'Kecepatan',
    tabPortfolio: 'Portofolio',
    requiredLabel: 'WAJIB',
    chooseProject: 'Proyek: pilih salah satu',
    chooseSprintToContinue: 'Sprint: pilih salah satu untuk melanjutkan',
    chooseProjectToContinue: 'Pilih proyek untuk melanjutkan',
    reportNeedsSprint: 'Laporan {label} memerlukan sprint',
    chooseDateRangeToContinue: 'Pilih rentang tanggal untuk melanjutkan',
    noReportToPreview: 'Tidak ada laporan untuk ditinjau',
    selectFiltersToGenerate: 'Pilih filter di atas untuk membuat laporan',
    livePreviewLabel: 'PRATINJAU LANGSUNG: SAMA PERSIS DENGAN ISI PDF',
    a4Portrait: 'A4 · POTRET',
    project: 'Proyek',
    reportOf: 'Laporan {label}',
    generatedInline: 'Dibuat {date}',
    filtered: 'Difilter:',
    taskDistribution: 'DISTRIBUSI TUGAS',
    total: 'Total',
    done: 'Selesai',
    progressPerMember: 'PROGRES PER ANGGOTA',
    totalTasks: 'TOTAL TUGAS',
    completedLabel: 'SELESAI',
    completionLabel: 'PENYELESAIAN',
    statusBreakdown: 'RINCIAN STATUS',
    timeLogEntries: 'LOG WAKTU - {count} entri',
    colTask: 'TUGAS',
    colSprint: 'SPRINT',
    colHrs: 'JAM',
    colDate: 'TANGGAL',
    velocityPerSprint: 'KECEPATAN PER SPRINT',
    planned: 'Direncanakan',
    completed: 'Selesai',
    exportLabel: 'EKSPOR',
    scope: 'CAKUPAN',
    sprintWord: 'Sprint',
    dateRange: 'Rentang tanggal',
    generatedLabel: 'Dibuat',
  },
};

const TOOLTIP_STYLE = {
  backgroundColor: '#0d2b48',
  border: 'none',
  borderRadius: '5px',
  color: '#e6e4df',
  fontSize: '11px',
  padding: '7px 11px',
};

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SelectorBtn({ label, value, empty }: { label: string; value: string; empty?: boolean }) {
  return (
    <div
      className="flex items-center gap-[6px] h-[30px] px-[10px] rounded-[6px] border text-[11.5px] font-semibold cursor-pointer"
      style={
        empty
          ? { border: '1.5px solid #c9971b', background: '#fffdf6', color: '#8a6209' }
          : { border: '1px solid #e2e0da', color: '#12283c' }
      }
    >
      <span className="text-neutral font-normal">{label}:</span>
      <span className="truncate max-w-[140px]">{value}</span>
      <ChevronDown className="w-[10px] h-[10px] flex-none text-text-placeholder" strokeWidth={1.8} />
    </div>
  );
}

export default function ReportsPage() {
  const t = useT(dict);
  const { locale } = useLocale();
  const [tab, setTab] = useState('sprint');
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then((r) => r.data.data),
  });
  const { data: sprints } = useQuery({
    queryKey: ['sprints', selectedProject],
    queryFn: () => sprintService.list(selectedProject).then((r) => r.data.data),
    enabled: !!selectedProject,
  });
  const { data: workloadReport, isLoading: wLoading } = useQuery({
    queryKey: ['report-workload', selectedSprint],
    queryFn: () => reportService.workload(selectedSprint).then((r) => r.data.data),
    enabled: !!selectedSprint && tab === 'workload',
  });
  const { data: sprintReport, isLoading: sLoading } = useQuery({
    queryKey: ['report-sprint', selectedSprint],
    queryFn: () => reportService.sprint(selectedSprint).then((r) => r.data.data),
    enabled: !!selectedSprint && tab === 'sprint',
  });
  const { data: timeReport, isLoading: tLoading } = useQuery({
    queryKey: ['report-time', selectedProject, dateFrom, dateTo],
    queryFn: () =>
      reportService
        .timeTracking({ project_id: selectedProject, from: dateFrom, to: dateTo })
        .then((r) => (r.data.data || []).flatMap((u: any) => (u.logs || []).map((log: any) => ({ ...log, full_name: u.full_name })))),
    enabled: !!selectedProject && !!dateFrom && !!dateTo && tab === 'time',
  });
  const { data: velocityReport, isLoading: vLoading } = useQuery({
    queryKey: ['report-velocity', selectedProject],
    queryFn: () => reportService.velocity(selectedProject).then((r) => r.data.data),
    enabled: !!selectedProject && tab === 'velocity',
  });

  const currentTab = REPORT_TABS.find((rt) => rt.id === tab);
  const needsSprint = currentTab?.needsSprint ?? false;
  const isLoading = wLoading || sLoading || tLoading || vLoading;
  const hasData =
    (tab === 'workload' && workloadReport) ||
    (tab === 'sprint' && sprintReport) ||
    (tab === 'time' && timeReport) ||
    (tab === 'velocity' && velocityReport);

  const selectedProjectObj = projects?.find((p: any) => p.id === selectedProject);
  const selectedSprintObj = sprints?.find((s: any) => s.id === selectedSprint);

  const missingProject = !selectedProject;
  const missingSprint = needsSprint && !selectedSprint;

  const hintText = missingProject
    ? t('chooseProjectToContinue')
    : missingSprint
      ? t('reportNeedsSprint', { label: tabLabel(currentTab?.id, t) })
      : tab === 'time' && (!dateFrom || !dateTo)
        ? t('chooseDateRangeToContinue')
        : null;

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const now = new Date().toISOString().slice(0, 10);
      let res: any;
      if (tab === 'workload') {
        res = await reportExportService.workload(selectedSprint);
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `report_workload_${now}.pdf`);
      } else if (tab === 'sprint') {
        res = await reportExportService.sprint(selectedSprint);
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `report_sprint_${now}.pdf`);
      } else if (tab === 'velocity') {
        res = await reportExportService.velocity(selectedProject);
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `report_velocity_${now}.pdf`);
      } else if (tab === 'time') {
        res = await reportExportService.timeTracking({ project_id: selectedProject, from: dateFrom, to: dateTo });
        await downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `report_time_${now}.pdf`);
      }
    } catch {
      toast.error(t('exportFailed'));
    }
    setExportLoading(false);
  };

  return (
    <AppLayout>
      <PageHeader
        section={t('reporting')}
        title={t('reports')}
        subtitle={t('subtitle')}
        actions={
          <>
            <button className="h-[34px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors">
              {t('schedule')}
            </button>
            <button
              onClick={handleExport}
              disabled={exportLoading || !hasData}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-50 transition-opacity"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <FileBarChart2 className="w-3 h-3" strokeWidth={2} />
              {exportLoading ? t('exporting') : t('exportPdf')}
            </button>
          </>
        }
      />

      {/* Control bar */}
      <div className="bg-white border border-border rounded-[6px] flex items-center px-[15px] py-[9px] gap-[12px] flex-wrap">
        {/* Tabs */}
        <div className="flex gap-[5px]">
          {REPORT_TABS.map((rt) => (
            <button
              key={rt.id}
              onClick={() => {
                setTab(rt.id);
                setSelectedMember(null);
              }}
              className="h-[26px] px-[10px] rounded-[4px] text-[11.5px] transition-colors"
              style={tab === rt.id ? { background: '#14406a', color: '#fff', fontWeight: 600 } : { color: '#6b7280', fontWeight: 500 }}
            >
              {tabLabel(rt.id, t)}
            </button>
          ))}
        </div>

        <div className="w-[1px] h-[20px] bg-border-subtle flex-none" />

        {/* REQUIRED label */}
        <span className="font-mono text-[10.5px] font-semibold text-neutral tracking-[0.06em] flex-none">{t('requiredLabel')}</span>

        {/* Project selector */}
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setSelectedSprint('');
              setSelectedMember(null);
            }}
            className="h-[30px] pl-[10px] pr-[22px] border border-border-input rounded-[6px] text-[11.5px] font-semibold text-navy-800 appearance-none bg-white focus:outline-none cursor-pointer"
          >
            <option value="">{t('chooseProject')}</option>
            {projects?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-[6px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-text-placeholder pointer-events-none"
            strokeWidth={1.8}
          />
        </div>

        {/* Sprint selector (conditional) */}
        {needsSprint && (
          <div className="relative">
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              disabled={!selectedProject}
              className="h-[30px] pl-[10px] pr-[22px] rounded-[6px] text-[11.5px] font-semibold appearance-none bg-gold-100 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: '1.5px solid #c9971b', color: selectedSprint ? '#12283c' : '#8a6209' }}
            >
              <option value="">{t('chooseSprintToContinue')}</option>
              {sprints?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-[6px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-gold-500 pointer-events-none"
              strokeWidth={1.8}
            />
          </div>
        )}

        {/* Date range for time tracking */}
        {tab === 'time' && (
          <>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-[30px] px-[8px] border border-border-input rounded-[6px] text-[11.5px] text-navy-800 bg-white focus:outline-none"
            />
            <span className="text-neutral text-[11px]">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-[30px] px-[8px] border border-border-input rounded-[6px] text-[11.5px] text-navy-800 bg-white focus:outline-none"
            />
          </>
        )}

        {/* Hint text */}
        {hintText && <span className="ml-auto text-[11px] text-neutral">{hintText}</span>}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </motion.div>
        ) : !hasData ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              icon={FileBarChart2}
              title={t('noReportToPreview')}
              subtitle={hintText || t('selectFiltersToGenerate')}
            />
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-[14px]"
            style={{ minHeight: 0 }}
          >
            {/* Live preview panel */}
            <div className="flex-1 bg-white border border-border rounded-[6px] flex flex-col overflow-hidden min-w-0">
              <div className="h-[34px] flex-none flex items-center justify-between px-[14px] border-b border-border-subtle bg-surface-2">
                <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-neutral">
                  {t('livePreviewLabel')}
                </span>
                <span className="font-mono text-[10px] text-text-meta">{t('a4Portrait')}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-[22px_26px] flex flex-col gap-[16px]">
                {/* Report header (PDF branding) */}
                <div className="flex items-start gap-[14px] pb-[14px] border-b-2 border-gold-500">
                  <div className="w-[42px] h-[42px] rounded-[6px] bg-navy-700 flex items-center justify-center font-display text-[17px] font-bold text-white flex-none">
                    C1
                  </div>
                  <div className="flex flex-col gap-[2px] flex-1">
                    <div className="text-[12px] font-bold text-navy-900 tracking-[0.02em]">ConnectOne</div>
                    <div className="text-[11px] text-text-secondary">{selectedProjectObj?.name || t('project')}</div>
                    <div className="font-mono text-[9.5px] text-text-placeholder">
                      {t('reportOf', { label: tabLabel(tab, t) })} · {selectedSprintObj?.name || new Date().getFullYear()}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[9.5px] text-text-placeholder">
                    <div>{t('generatedInline', { date: new Date().toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB') })}</div>
                    <div className="text-navy-900 font-semibold text-[11px] mt-[2px]">{tabLabel(tab, t)}</div>
                  </div>
                </div>

                {/* ── Workload report ── */}
                {tab === 'workload' && workloadReport && (
                  <div className="flex flex-col gap-[16px]">
                    {selectedMember && (
                      <div className="flex items-center gap-[6px]">
                        <span className="text-[11px] text-neutral">{t('filtered')}</span>
                        <button
                          onClick={() => setSelectedMember(null)}
                          className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-navy-700 bg-info-soft px-[8px] h-[22px] rounded-[3px] hover:bg-info-soft transition-colors"
                        >
                          {(workloadReport || []).find((u: any) => u.user_id === selectedMember)?.full_name || selectedMember}
                          <span className="text-text-placeholder">×</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-[14px]">
                      <div>
                        <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral mb-[10px]">
                          {t('taskDistribution')}
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={workloadReport || []} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" vertical={false} />
                            <XAxis dataKey="full_name" tick={{ fontSize: 9, fill: '#8a8f98' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#8a8f98' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f5f4f2' }} />
                            <Bar
                              dataKey="total_tasks"
                              radius={[3, 3, 0, 0]}
                              name={t('total')}
                              cursor="pointer"
                              onClick={(d: any) => setSelectedMember((prev) => (prev === d.user_id ? null : d.user_id))}
                            >
                              {(workloadReport || []).map((u: any, i: number) => (
                                <Cell key={i} fill="#14406a" fillOpacity={!selectedMember || selectedMember === u.user_id ? 1 : 0.25} />
                              ))}
                            </Bar>
                            <Bar
                              dataKey="completed"
                              radius={[3, 3, 0, 0]}
                              name={t('done')}
                              cursor="pointer"
                              onClick={(d: any) => setSelectedMember((prev) => (prev === d.user_id ? null : d.user_id))}
                            >
                              {(workloadReport || []).map((u: any, i: number) => (
                                <Cell key={i} fill="#137a52" fillOpacity={!selectedMember || selectedMember === u.user_id ? 1 : 0.25} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div>
                        <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral mb-[10px]">
                          {t('progressPerMember')}
                        </div>
                        <div className="flex flex-col gap-[10px]">
                          {(workloadReport || [])
                            .filter((u: any) => !selectedMember || u.user_id === selectedMember)
                            .map((u: any, i: number) => {
                              const pct = u.total_tasks > 0 ? Math.round((u.completed / u.total_tasks) * 100) : 0;
                              return (
                                <div key={u.user_id} className="flex items-center gap-[8px]">
                                  <div className="w-[22px] h-[22px] rounded-[4px] bg-info-soft text-navy-700 flex items-center justify-center font-mono text-[9px] font-bold flex-none">
                                    {(u.full_name || 'U')
                                      .split(' ')
                                      .map((w: string) => w[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between text-[10.5px] mb-[3px]">
                                      <span className="font-semibold text-navy-800 truncate">{u.full_name}</span>
                                      <span className="text-neutral flex-none ml-2">
                                        {u.completed}/{u.total_tasks} · {pct}%
                                      </span>
                                    </div>
                                    <div className="h-[4px] rounded-full bg-border-subtle overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.04 }}
                                        className="h-full rounded-full"
                                        style={{ background: pct >= 100 ? '#137a52' : '#14406a' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Sprint report ── */}
                {tab === 'sprint' && sprintReport && (
                  <div className="flex flex-col gap-[16px]">
                    <div className="grid grid-cols-3 gap-[10px]">
                      {[
                        { label: t('totalTasks'), value: sprintReport.total_tasks, color: '#14406a' },
                        { label: t('completedLabel'), value: sprintReport.done_tasks, color: '#137a52' },
                        {
                          label: t('completionLabel'),
                          value: `${Math.round((sprintReport.done_tasks / sprintReport.total_tasks) * 100 || 0)}%`,
                          color: '#8a6209',
                        },
                      ].map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="border border-border rounded-[5px] p-[12px_14px]"
                        >
                          <div className="font-mono text-[9px] font-semibold tracking-[0.1em] text-neutral mb-[6px]">{s.label}</div>
                          <div className="font-display font-semibold text-[26px] leading-none" style={{ color: s.color }}>
                            {s.value}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div>
                      <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral mb-[8px]">{t('statusBreakdown')}</div>
                      <div className="flex flex-wrap gap-[10px]">
                        {Object.entries(sprintReport.by_status || {}).map(([status, count]: any, i: number) => (
                          <div key={status} className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[4px] bg-surface-2">
                            <div
                              className="w-[6px] h-[6px] rounded-full flex-none"
                              style={{ background: ['#14406a', '#137a52', '#c9971b', '#8a8f98'][i % 4] }}
                            />
                            <span className="text-[11.5px] font-medium text-text-secondary capitalize">{status.replace('_', ' ')}</span>
                            <span className="font-mono text-[11px] font-semibold text-navy-800">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Time tracking report ── */}
                {tab === 'time' && timeReport && (
                  <div>
                    <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral mb-[8px]">
                      {t('timeLogEntries', { count: timeReport.length })}
                    </div>
                    {/* Table header */}
                    <div
                      className="grid px-[10px] h-[28px] items-center bg-surface-2 border border-border-subtle rounded-t-[4px]"
                      style={{ gridTemplateColumns: '1fr 100px 70px 90px' }}
                    >
                      {[t('colTask'), t('colSprint'), t('colHrs'), t('colDate')].map((h) => (
                        <div key={h} className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">
                          {h}
                        </div>
                      ))}
                    </div>
                    <div className="border border-t-0 border-border-subtle rounded-b-[4px] overflow-hidden">
                      {(timeReport || []).map((log: any, i: number) => (
                        <motion.div
                          key={`${log.task_id}-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="grid px-[10px] h-[34px] items-center border-b border-border-subtle last:border-b-0 hover:bg-surface-2 transition-colors"
                          style={{ gridTemplateColumns: '1fr 100px 70px 90px' }}
                        >
                          <span className="text-[12px] font-semibold text-navy-800 truncate">{log.task_title}</span>
                          <span className="text-[11px] text-text-secondary truncate">{log.sprint_name || '—'}</span>
                          <span className="font-mono text-[11px] font-semibold text-navy-700">{log.logged_hours}h</span>
                          <span className="font-mono text-[11px] text-neutral">{log.logged_at?.slice(0, 10)}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Velocity report ── */}
                {tab === 'velocity' && velocityReport && (
                  <div>
                    <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral mb-[10px]">{t('velocityPerSprint')}</div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={velocityReport} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8a8f98' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#8a8f98' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f5f4f2' }} />
                        <Bar dataKey="total_points" fill="#eceae4" radius={[3, 3, 0, 0]} name={t('planned')} />
                        <Bar dataKey="completed_points" fill="#14406a" radius={[3, 3, 0, 0]} name={t('completed')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Export panel */}
            <div className="w-[230px] flex-none flex flex-col gap-[10px]">
              <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
                <div className="h-[36px] flex-none flex items-center px-[13px] border-b border-border-subtle">
                  <span className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('exportLabel')}</span>
                </div>
                <div className="p-[12px]">
                  <button
                    onClick={handleExport}
                    disabled={exportLoading || !hasData}
                    className="w-full h-[34px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-50 transition-opacity"
                    style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
                  >
                    {exportLoading ? t('exporting') : t('exportPdf')}
                  </button>
                </div>
              </div>

              {/* Report info */}
              <div className="bg-white border border-border rounded-[6px] p-[12px] flex flex-col gap-[6px]">
                <div className="font-mono text-[9px] font-semibold tracking-[0.1em] text-neutral mb-[2px]">{t('scope')}</div>
                {selectedProjectObj && (
                  <div className="flex flex-col gap-[1px]">
                    <span className="text-[10.5px] text-neutral">{t('project')}</span>
                    <span className="text-[12px] font-semibold text-navy-800 leading-tight">{selectedProjectObj.name}</span>
                  </div>
                )}
                {selectedSprintObj && (
                  <div className="flex flex-col gap-[1px]">
                    <span className="text-[10.5px] text-neutral">{t('sprintWord')}</span>
                    <span className="text-[12px] font-semibold text-navy-800">{selectedSprintObj.name}</span>
                  </div>
                )}
                {tab === 'time' && dateFrom && dateTo && (
                  <div className="flex flex-col gap-[1px]">
                    <span className="text-[10.5px] text-neutral">{t('dateRange')}</span>
                    <span className="font-mono text-[11px] text-navy-800">
                      {dateFrom} – {dateTo}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-[1px]">
                  <span className="text-[10.5px] text-neutral">{t('generatedLabel')}</span>
                  <span className="font-mono text-[11px] text-navy-800">
                    {new Date().toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
