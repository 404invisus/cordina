'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Plus, Search, LayoutGrid, List, TrendingUp, CheckCircle2, AlertTriangle, Activity, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const dict = {
  en: {
    statusInProgress: 'In progress',
    statusOnTrack: 'On track',
    statusAtRisk: 'At risk',
    statusAwaitingApproval: 'Awaiting approval',
    statusCompleted: 'Completed',
    statusPlanned: 'Planned',
    statusOnHold: 'On hold',
    pageTitle: 'Projects',
    filterAll: 'All',
    newProjectModalTitle: 'New project',
    newProject: 'New project',
    nameLabel: 'NAME',
    descriptionLabel: 'DESCRIPTION',
    startDateLabel: 'START DATE',
    endDateLabel: 'END DATE',
    divisionLabel: 'DIVISION',
    nameRequired: 'Name is required',
    projectNamePlaceholder: 'Project name...',
    descriptionPlaceholder: 'Scope and goals...',
    divisionPlaceholder: 'Division or unit name',
    creating: 'Creating…',
    createProject: 'Create project',
    projectCreated: 'Project created!',
    failedToCreate: 'Failed to create project',
    subtitleCount: '{total} project{plural} · {active} active · {completed} completed',
    subtitleEmpty: 'Manage and monitor all team projects',
    totalProjects: 'Total Projects',
    allTime: 'all time',
    activeStat: 'Active',
    inProgressSub: 'in progress',
    needsAttention: 'Needs Attention',
    atRiskPendingSub: 'at risk / pending',
    completedStat: 'Completed',
    thisQuarter: 'this quarter',
    searchProjects: 'Search projects',
    statusFilterLabel: 'Status: {label}',
    sortDueDate: 'Sort: Due date ↑',
    sortNameAz: 'Sort: Name A–Z',
    sortStatus: 'Sort: Status',
    noProjectsMatch: 'No projects match your filters',
    noProjectsYet: 'No projects yet',
    createFirstProject: 'Create the first project to get started',
    noProjectsCreated: 'No projects have been created yet',
    colProject: 'PROJECT',
    colOwner: 'OWNER',
    colTeam: 'TEAM',
    colStatus: 'STATUS',
    colProgress: 'PROGRESS',
    colDue: 'DUE',
    showingOf: 'Showing {filtered} of {total}',
  },
  id: {
    statusInProgress: 'Berjalan',
    statusOnTrack: 'Sesuai rencana',
    statusAtRisk: 'Berisiko',
    statusAwaitingApproval: 'Menunggu persetujuan',
    statusCompleted: 'Selesai',
    statusPlanned: 'Direncanakan',
    statusOnHold: 'Ditunda',
    pageTitle: 'Proyek',
    filterAll: 'Semua',
    newProjectModalTitle: 'Proyek baru',
    newProject: 'Proyek baru',
    nameLabel: 'NAMA',
    descriptionLabel: 'DESKRIPSI',
    startDateLabel: 'TANGGAL MULAI',
    endDateLabel: 'TANGGAL SELESAI',
    divisionLabel: 'DIVISI',
    nameRequired: 'Nama wajib diisi',
    projectNamePlaceholder: 'Nama proyek...',
    descriptionPlaceholder: 'Ruang lingkup dan tujuan...',
    divisionPlaceholder: 'Nama divisi atau unit',
    creating: 'Membuat…',
    createProject: 'Buat proyek',
    projectCreated: 'Proyek berhasil dibuat!',
    failedToCreate: 'Gagal membuat proyek',
    subtitleCount: '{total} proyek · {active} aktif · {completed} selesai',
    subtitleEmpty: 'Kelola dan pantau semua proyek tim',
    totalProjects: 'Total Proyek',
    allTime: 'sepanjang waktu',
    activeStat: 'Aktif',
    inProgressSub: 'sedang berjalan',
    needsAttention: 'Perlu Perhatian',
    atRiskPendingSub: 'berisiko / menunggu',
    completedStat: 'Selesai',
    thisQuarter: 'kuartal ini',
    searchProjects: 'Cari proyek',
    statusFilterLabel: 'Status: {label}',
    sortDueDate: 'Urutkan: Tanggal jatuh tempo ↑',
    sortNameAz: 'Urutkan: Nama A–Z',
    sortStatus: 'Urutkan: Status',
    noProjectsMatch: 'Tidak ada proyek yang cocok dengan filter Anda',
    noProjectsYet: 'Belum ada proyek',
    createFirstProject: 'Buat proyek pertama untuk memulai',
    noProjectsCreated: 'Belum ada proyek yang dibuat',
    colProject: 'PROYEK',
    colOwner: 'PEMILIK',
    colTeam: 'TIM',
    colStatus: 'STATUS',
    colProgress: 'PROGRES',
    colDue: 'JATUH TEMPO',
    showingOf: 'Menampilkan {filtered} dari {total}',
  },
};

const STATUS_CFG: Record<string, { labelKey: string; bg: string; color: string; dot: string; bar: string }> = {
  active: { labelKey: 'statusInProgress', bg: '#eaf1f8', color: '#14406a', dot: '#14406a', bar: '#14406a' },
  on_track: { labelKey: 'statusOnTrack', bg: '#e9f4ee', color: '#0f6144', dot: '#137a52', bar: '#137a52' },
  at_risk: { labelKey: 'statusAtRisk', bg: '#fdeceb', color: '#a3231c', dot: '#b3261e', bar: '#b3261e' },
  awaiting_approval: { labelKey: 'statusAwaitingApproval', bg: '#fbf3e0', color: '#8a6209', dot: '#c9971b', bar: '#c9971b' },
  completed: { labelKey: 'statusCompleted', bg: '#e9f4ee', color: '#0f6144', dot: '#137a52', bar: '#137a52' },
  planned: { labelKey: 'statusPlanned', bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98', bar: '#8a8f98' },
  on_hold: { labelKey: 'statusOnHold', bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98', bar: '#8a8f98' },
};

const STATUS_FILTER_VALUES = ['', 'active', 'on_track', 'at_risk', 'planned', 'on_hold', 'completed'];

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useT> }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.planned;
  return (
    <span
      className="inline-flex items-center gap-[5px] h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold flex-none"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-[5px] h-[5px] rounded-full flex-none" style={{ background: cfg.dot }} />
      {t(cfg.labelKey)}
    </span>
  );
}

function initials(name: string) {
  return (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function fmtDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT(dict);
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => projectService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('projectCreated'));
      reset();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToCreate')),
  });

  return (
    <Modal open={open} onClose={onClose} title={t('newProjectModalTitle')}>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-[10px]">
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('nameLabel')}</label>
          <input
            {...register('name', { required: true })}
            className="mt-1 w-full h-[32px] px-[10px] border border-border-button rounded-[5px] text-[12px] text-navy-800 bg-white focus:outline-none focus:border-navy-700"
            placeholder={t('projectNamePlaceholder')}
          />
          {errors.name && <p className="text-[10.5px] text-danger mt-1">{t('nameRequired')}</p>}
        </div>
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('descriptionLabel')}</label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 w-full px-[10px] py-[6px] border border-border-button rounded-[5px] text-[12px] text-navy-800 bg-white resize-none focus:outline-none"
            placeholder={t('descriptionPlaceholder')}
          />
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('startDateLabel')}</label>
            <input
              {...register('start_date', { required: true })}
              type="date"
              className="mt-1 w-full h-[32px] px-[8px] border border-border-button rounded-[5px] text-[12px] text-navy-800 bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('endDateLabel')}</label>
            <input
              {...register('end_date', { required: true })}
              type="date"
              className="mt-1 w-full h-[32px] px-[8px] border border-border-button rounded-[5px] text-[12px] text-navy-800 bg-white focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('divisionLabel')}</label>
          <input
            {...register('division')}
            className="mt-1 w-full h-[32px] px-[10px] border border-border-button rounded-[5px] text-[12px] text-navy-800 bg-white focus:outline-none"
            placeholder={t('divisionPlaceholder')}
          />
        </div>
        <div className="flex gap-[6px] pt-[4px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[34px] border border-border-button rounded-[6px] text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 h-[34px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-60 transition-opacity"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
          >
            {isPending ? t('creating') : t('createProject')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectCard({ project, index, t }: { project: any; index: number; t: ReturnType<typeof useT> }) {
  const cfg = STATUS_CFG[project.status] ?? STATUS_CFG.planned;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 220, damping: 22 }}
    >
      <Link href={`/projects/${project.id}`} className="block group">
        <div className="bg-white border border-border rounded-[6px] px-[14px] py-[12px] flex flex-col gap-[10px] hover:border-navy-700 hover:shadow-[0_2px_12px_rgba(40,64,116,0.10)] transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="w-[28px] h-[28px] rounded-[5px] bg-info-soft flex items-center justify-center flex-none">
              <FolderKanban className="w-[14px] h-[14px] text-navy-700" />
            </div>
            <StatusBadge status={project.status} t={t} />
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-navy-800 group-hover:text-navy-700 transition-colors leading-snug">
              {project.name}
            </div>
            {project.division && <div className="font-mono text-[10px] text-text-placeholder mt-[2px]">{project.division}</div>}
            {project.description && <p className="text-[11px] text-neutral mt-[5px] line-clamp-2 leading-relaxed">{project.description}</p>}
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="font-mono text-neutral">
              {project.start_date ? fmtDate(project.start_date) : '—'}
              {project.end_date ? ` – ${fmtDate(project.end_date)}` : ''}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const t = useT(dict);
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'due' | 'name' | 'status'>('due');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then((r) => r.data.data),
  });

  const filtered = [...(projects || [])]
    .filter((p: any) => {
      const q = search.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.division?.toLowerCase().includes(q);
      const matchS = !statusFilter || p.status === statusFilter;
      return matchQ && matchS;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'due') return (a.end_date || '').localeCompare(b.end_date || '');
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  const canCreate = hasPermission('project.create');
  const total = projects?.length || 0;
  const active = (projects || []).filter((p: any) => p.status === 'active' || p.status === 'on_track').length;
  const awaiting = (projects || []).filter((p: any) => p.status === 'awaiting_approval' || p.status === 'at_risk').length;
  const completed = (projects || []).filter((p: any) => p.status === 'completed').length;

  const subtitle = total
    ? t('subtitleCount', { total, plural: total !== 1 ? 's' : '', active, completed })
    : t('subtitleEmpty');

  return (
    <AppLayout>
      <PageHeader
        section="PROJECTS"
        title={t('pageTitle')}
        subtitle={subtitle}
        actions={
          canCreate ? (
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              {t('newProject')}
            </button>
          ) : undefined
        }
      />

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard index={0} title={t('totalProjects')} value={total} subtitle={t('allTime')} icon={FolderKanban} color="brand" progress={100} />
        <StatCard
          index={1}
          title={t('activeStat')}
          value={active}
          subtitle={t('inProgressSub')}
          icon={Activity}
          color="brand"
          progress={total > 0 ? Math.round((active / total) * 100) : 0}
        />
        <StatCard
          index={2}
          title={t('needsAttention')}
          value={awaiting}
          subtitle={t('atRiskPendingSub')}
          icon={AlertTriangle}
          color="red"
          progress={total > 0 ? Math.round((awaiting / total) * 100) : 0}
        />
        <StatCard
          index={3}
          title={t('completedStat')}
          value={completed}
          subtitle={t('thisQuarter')}
          icon={CheckCircle2}
          color="green"
          progress={total > 0 ? Math.round((completed / total) * 100) : 0}
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-border rounded-[6px] flex items-center gap-[10px] px-[15px] py-[10px] flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-[7px] h-[32px] px-[11px] border border-border-input rounded-[6px] w-[250px] text-text-placeholder">
          <Search className="w-[13px] h-[13px] flex-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-navy-800 placeholder:text-text-placeholder focus:outline-none"
            placeholder={t('searchProjects')}
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[32px] pl-[11px] pr-[26px] border border-border-input rounded-[6px] text-[12px] font-medium text-text-secondary appearance-none bg-white focus:outline-none cursor-pointer"
          >
            {STATUS_FILTER_VALUES.map((v) => (
              <option key={v} value={v}>
                {t('statusFilterLabel', { label: v ? t(STATUS_CFG[v]?.labelKey ?? 'filterAll') : t('filterAll') })}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-[7px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-text-placeholder pointer-events-none"
            strokeWidth={1.8}
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-[32px] pl-[11px] pr-[26px] border border-border-input rounded-[6px] text-[12px] font-medium text-text-secondary appearance-none bg-white focus:outline-none cursor-pointer"
          >
            <option value="due">{t('sortDueDate')}</option>
            <option value="name">{t('sortNameAz')}</option>
            <option value="status">{t('sortStatus')}</option>
          </select>
          <ChevronDown
            className="absolute right-[7px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-text-placeholder pointer-events-none"
            strokeWidth={1.8}
          />
        </div>

        {/* View toggle */}
        <div className="ml-auto flex border border-border-input rounded-[6px] overflow-hidden h-[32px]">
          <button
            onClick={() => setViewMode('list')}
            className="w-[34px] flex items-center justify-center transition-colors"
            style={viewMode === 'list' ? { background: '#14406a' } : {}}
          >
            <List className="w-[13px] h-[13px]" style={{ color: viewMode === 'list' ? '#fff' : '#9ca3af' }} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className="w-[34px] flex items-center justify-center border-l border-border-input transition-colors"
            style={viewMode === 'grid' ? { background: '#14406a' } : {}}
          >
            <LayoutGrid className="w-[13px] h-[13px]" style={{ color: viewMode === 'grid' ? '#fff' : '#9ca3af' }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-48">
            <LoadingSpinner />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              icon={FolderKanban}
              title={search || statusFilter ? t('noProjectsMatch') : t('noProjectsYet')}
              subtitle={canCreate ? t('createFirstProject') : t('noProjectsCreated')}
              action={
                canCreate && !search && !statusFilter ? (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold mt-2"
                    style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
                  >
                    <Plus className="w-3 h-3" strokeWidth={2.5} />
                    {t('newProject')}
                  </button>
                ) : undefined
              }
            />
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[10px]"
          >
            {filtered.map((p: any, i: number) => (
              <ProjectCard key={p.id} project={p} index={i} t={t} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden"
          >
            {/* Table header */}
            <div
              className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
              style={{ gridTemplateColumns: '1fr 132px 116px 130px 104px 78px' }}
            >
              {[t('colProject'), t('colOwner'), t('colTeam'), t('colStatus'), t('colProgress'), t('colDue')].map((h, i) => (
                <div
                  key={h}
                  className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral"
                  style={i === 5 ? { textAlign: 'right' } : {}}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((p: any, i: number) => {
              const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.planned;
              const ownerName = p.owner_name || p.created_by_name || p.manager_name || '';
              const progress = p.progress ?? (p.status === 'completed' ? 100 : 0);
              const teamMembers: any[] = p.members?.slice(0, 3) || [];
              const extraCount = (p.members?.length || 0) - 3;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid px-[15px] h-[40px] items-center border-b border-border-subtle last:border-b-0 hover:bg-surface-2 transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: '1fr 132px 116px 130px 104px 78px' }}
                  onClick={() => (window.location.href = `/projects/${p.id}`)}
                >
                  {/* Project */}
                  <div className="flex flex-col gap-[1px] min-w-0">
                    <div className="text-[12.5px] font-semibold text-navy-800 truncate">{p.name}</div>
                    <div className="font-mono text-[10px] text-text-placeholder truncate">
                      {[p.code, p.division].filter(Boolean).join(' · ') || p.description?.slice(0, 30)}
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-[7px]">
                    {ownerName ? (
                      <>
                        <div className="w-[22px] h-[22px] rounded-[4px] bg-info-soft text-navy-700 flex items-center justify-center font-mono text-[9.5px] font-bold flex-none">
                          {initials(ownerName)}
                        </div>
                        <span className="text-[12px] text-text-secondary truncate">{ownerName}</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-text-meta">—</span>
                    )}
                  </div>

                  {/* Team */}
                  <div className="flex items-center">
                    {teamMembers.length > 0 ? (
                      <div className="flex">
                        {teamMembers.map((m: any, ti: number) => (
                          <div
                            key={ti}
                            className="w-[22px] h-[22px] rounded-full bg-info-soft border-[1.5px] border-white flex items-center justify-center font-mono text-[9px] font-semibold text-navy-700"
                            style={{ marginLeft: ti === 0 ? 0 : -7 }}
                          >
                            {initials(m?.full_name || m?.user?.full_name || 'U')}
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <div
                            className="w-[22px] h-[22px] rounded-full bg-neutral-soft border-[1.5px] border-white flex items-center justify-center font-mono text-[8.5px] font-semibold text-text-tertiary"
                            style={{ marginLeft: -7 }}
                          >
                            +{extraCount}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-text-meta">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={p.status} t={t} />
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-[7px]">
                    <div className="flex-1 h-[4px] rounded-[2px] bg-border-subtle overflow-hidden">
                      <div className="h-full rounded-[2px]" style={{ width: `${progress}%`, background: cfg.bar }} />
                    </div>
                    <span className="font-mono text-[10.5px] text-text-tertiary w-[24px] text-right">{progress}</span>
                  </div>

                  {/* Due date */}
                  <div className="text-right font-mono text-[11px] text-text-secondary">{p.end_date ? fmtDate(p.end_date) : '—'}</div>
                </motion.div>
              );
            })}

            {/* Footer */}
            <div className="h-[36px] flex items-center justify-between px-[15px] border-t border-border-subtle bg-surface-2">
              <span className="text-[11px] text-neutral">{t('showingOf', { filtered: filtered.length, total })}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppLayout>
  );
}
