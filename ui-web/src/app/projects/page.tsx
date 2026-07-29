'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Plus, Search, LayoutGrid, List, TrendingUp, CheckCircle2, AlertTriangle, Activity, ChevronDown,
} from 'lucide-react';
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

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string; bar: string }> = {
  active:            { label: 'In progress',       bg: '#eaf1f8', color: '#14406a', dot: '#14406a', bar: '#14406a' },
  on_track:          { label: 'On track',          bg: '#e9f4ee', color: '#0f6144', dot: '#137a52', bar: '#137a52' },
  at_risk:           { label: 'At risk',           bg: '#fdeceb', color: '#a3231c', dot: '#b3261e', bar: '#b3261e' },
  awaiting_approval: { label: 'Awaiting approval', bg: '#fbf3e0', color: '#8a6209', dot: '#c9971b', bar: '#c9971b' },
  completed:         { label: 'Completed',         bg: '#e9f4ee', color: '#0f6144', dot: '#137a52', bar: '#137a52' },
  planned:           { label: 'Planned',           bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98', bar: '#8a8f98' },
  on_hold:           { label: 'On hold',           bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98', bar: '#8a8f98' },
};

const STATUS_FILTERS = [
  { value: '',        label: 'All'        },
  { value: 'active',  label: 'In progress'},
  { value: 'on_track',label: 'On track'  },
  { value: 'at_risk', label: 'At risk'   },
  { value: 'planned', label: 'Planned'   },
  { value: 'on_hold', label: 'On hold'   },
  { value: 'completed',label: 'Completed'},
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.planned;
  return (
    <span className="inline-flex items-center gap-[5px] h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold flex-none"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-[5px] h-[5px] rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function initials(name: string) {
  return (name || 'U').split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => projectService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create project'),
  });

  return (
    <Modal open={open} onClose={onClose} title="New project">
      <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-[10px]">
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">NAME</label>
          <input {...register('name', { required: true })}
            className="mt-1 w-full h-[32px] px-[10px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none focus:border-brand"
            placeholder="Project name..." />
          {errors.name && <p className="text-[10.5px] text-danger mt-1">Name is required</p>}
        </div>
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">DESCRIPTION</label>
          <textarea {...register('description')} rows={3}
            className="mt-1 w-full px-[10px] py-[6px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white resize-none focus:outline-none"
            placeholder="Scope and goals..." />
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">START DATE</label>
            <input {...register('start_date', { required: true })} type="date"
              className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none" />
          </div>
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">END DATE</label>
            <input {...register('end_date', { required: true })} type="date"
              className="mt-1 w-full h-[32px] px-[8px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]">DIVISION</label>
          <input {...register('division')}
            className="mt-1 w-full h-[32px] px-[10px] border border-[#d9d6cf] rounded-[5px] text-[12px] text-[#12283c] bg-white focus:outline-none"
            placeholder="Division or unit name" />
        </div>
        <div className="flex gap-[6px] pt-[4px]">
          <button type="button" onClick={onClose}
            className="flex-1 h-[34px] border border-[#d9d6cf] rounded-[6px] text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 h-[34px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold disabled:opacity-60 transition-opacity"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}>
            {isPending ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectCard({ project, index }: { project: any; index: number }) {
  const cfg = STATUS_CFG[project.status] ?? STATUS_CFG.planned;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 220, damping: 22 }}>
      <Link href={`/projects/${project.id}`} className="block group">
        <div className="bg-white border border-[#e6e4df] rounded-[6px] px-[14px] py-[12px] flex flex-col gap-[10px] hover:border-brand hover:shadow-[0_2px_12px_rgba(40,64,116,0.10)] transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="w-[28px] h-[28px] rounded-[5px] bg-brand-soft flex items-center justify-center flex-none">
              <FolderKanban className="w-[14px] h-[14px] text-brand" />
            </div>
            <StatusBadge status={project.status} />
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-[#12283c] group-hover:text-brand transition-colors leading-snug">{project.name}</div>
            {project.division && <div className="font-mono text-[10px] text-[#9ca3af] mt-[2px]">{project.division}</div>}
            {project.description && (
              <p className="text-[11px] text-[#8a8f98] mt-[5px] line-clamp-2 leading-relaxed">{project.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="font-mono text-[#8a8f98]">
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
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'due' | 'name' | 'status'>('due');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });

  const filtered = [...(projects || [])]
    .filter((p: any) => {
      const q = search.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.division?.toLowerCase().includes(q);
      const matchS = !statusFilter || p.status === statusFilter;
      return matchQ && matchS;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'due')    return (a.end_date || '').localeCompare(b.end_date || '');
      if (sortBy === 'name')   return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  const canCreate = hasPermission('project.create');
  const total     = projects?.length || 0;
  const active    = (projects || []).filter((p: any) => p.status === 'active' || p.status === 'on_track').length;
  const awaiting  = (projects || []).filter((p: any) => p.status === 'awaiting_approval' || p.status === 'at_risk').length;
  const completed = (projects || []).filter((p: any) => p.status === 'completed').length;

  const subtitle = total
    ? `${total} project${total !== 1 ? 's' : ''} · ${active} active · ${completed} completed`
    : 'Manage and monitor all team projects';

  return (
    <AppLayout>
      <PageHeader
        section="PROJECTS"
        title="Projects"
        subtitle={subtitle}
        actions={
          canCreate ? (
            <button onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}>
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              New project
            </button>
          ) : undefined
        }
      />

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard index={0} title="Total Projects"    value={total}     subtitle="all time"       icon={FolderKanban} color="brand"  progress={100} />
        <StatCard index={1} title="Active"            value={active}    subtitle="in progress"    icon={Activity}     color="brand"  progress={total > 0 ? Math.round((active / total) * 100) : 0} />
        <StatCard index={2} title="Needs Attention"  value={awaiting}  subtitle="at risk / pending" icon={AlertTriangle} color="red" progress={total > 0 ? Math.round((awaiting / total) * 100) : 0} />
        <StatCard index={3} title="Completed"        value={completed}  subtitle="this quarter"   icon={CheckCircle2} color="green" progress={total > 0 ? Math.round((completed / total) * 100) : 0} />
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#e6e4df] rounded-[6px] flex items-center gap-[10px] px-[15px] py-[10px] flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-[7px] h-[32px] px-[11px] border border-[#e2e0da] rounded-[6px] w-[250px] text-[#9ca3af]">
          <Search className="w-[13px] h-[13px] flex-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-[#12283c] placeholder:text-[#9ca3af] focus:outline-none"
            placeholder="Search projects"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-[32px] pl-[11px] pr-[26px] border border-[#e2e0da] rounded-[6px] text-[12px] font-medium text-[#4b5563] appearance-none bg-white focus:outline-none cursor-pointer">
            {STATUS_FILTERS.map(s => (
              <option key={s.value} value={s.value}>{`Status: ${s.label}`}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-[7px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-[#9ca3af] pointer-events-none" strokeWidth={1.8} />
        </div>

        {/* Sort */}
        <div className="relative">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="h-[32px] pl-[11px] pr-[26px] border border-[#e2e0da] rounded-[6px] text-[12px] font-medium text-[#4b5563] appearance-none bg-white focus:outline-none cursor-pointer">
            <option value="due">Sort: Due date ↑</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="status">Sort: Status</option>
          </select>
          <ChevronDown className="absolute right-[7px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-[#9ca3af] pointer-events-none" strokeWidth={1.8} />
        </div>

        {/* View toggle */}
        <div className="ml-auto flex border border-[#e2e0da] rounded-[6px] overflow-hidden h-[32px]">
          <button onClick={() => setViewMode('list')}
            className="w-[34px] flex items-center justify-center transition-colors"
            style={viewMode === 'list' ? { background: '#14406a' } : {}}>
            <List className="w-[13px] h-[13px]" style={{ color: viewMode === 'list' ? '#fff' : '#9ca3af' }} />
          </button>
          <button onClick={() => setViewMode('grid')}
            className="w-[34px] flex items-center justify-center border-l border-[#e2e0da] transition-colors"
            style={viewMode === 'grid' ? { background: '#14406a' } : {}}>
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
              title={search || statusFilter ? 'No projects match your filters' : 'No projects yet'}
              subtitle={canCreate ? 'Create the first project to get started' : 'No projects have been created yet'}
              action={canCreate && !search && !statusFilter ? (
                <button onClick={() => setCreateOpen(true)}
                  className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold mt-2"
                  style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}>
                  <Plus className="w-3 h-3" strokeWidth={2.5} />New project
                </button>
              ) : undefined}
            />
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            {filtered.map((p: any, i: number) => <ProjectCard key={p.id} project={p} index={i} />)}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
            {/* Table header */}
            <div className="grid px-[15px] h-[30px] items-center border-b border-[#eceae4] bg-[#faf9f7]"
              style={{ gridTemplateColumns: '1fr 132px 116px 130px 104px 78px' }}>
              {['PROJECT', 'OWNER', 'TEAM', 'STATUS', 'PROGRESS', 'DUE'].map((h, i) => (
                <div key={h} className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]"
                  style={i === 5 ? { textAlign: 'right' } : {}}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((p: any, i: number) => {
              const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.planned;
              const ownerName = p.owner_name || p.created_by_name || p.manager_name || '';
              const progress = p.progress ?? (p.status === 'completed' ? 100 : 0);
              const teamMembers: string[] = p.members?.slice(0, 3) || [];
              const extraCount = (p.members?.length || 0) - 3;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid px-[15px] h-[40px] items-center border-b border-[#f2f0ec] last:border-b-0 hover:bg-[#faf9f7] transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: '1fr 132px 116px 130px 104px 78px' }}
                  onClick={() => window.location.href = `/projects/${p.id}`}
                >
                  {/* Project */}
                  <div className="flex flex-col gap-[1px] min-w-0">
                    <div className="text-[12.5px] font-semibold text-[#12283c] truncate">{p.name}</div>
                    <div className="font-mono text-[10px] text-[#9ca3af] truncate">
                      {[p.code, p.division].filter(Boolean).join(' · ') || p.description?.slice(0, 30)}
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-[7px]">
                    {ownerName ? (
                      <>
                        <div className="w-[22px] h-[22px] rounded-[4px] bg-[#eaf1f8] text-[#14406a] flex items-center justify-center font-mono text-[9.5px] font-bold flex-none">
                          {initials(ownerName)}
                        </div>
                        <span className="text-[12px] text-[#4b5563] truncate">{ownerName}</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-[#c0bcb4]">—</span>
                    )}
                  </div>

                  {/* Team */}
                  <div className="flex items-center">
                    {teamMembers.length > 0 ? (
                      <div className="flex">
                        {teamMembers.map((m: any, ti: number) => (
                          <div key={ti}
                            className="w-[22px] h-[22px] rounded-full bg-[#dfe6ee] border-[1.5px] border-white flex items-center justify-center font-mono text-[9px] font-semibold text-[#14406a]"
                            style={{ marginLeft: ti === 0 ? 0 : -7 }}>
                            {initials(m.name || m)}
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <div className="w-[22px] h-[22px] rounded-full bg-[#f1f0ed] border-[1.5px] border-white flex items-center justify-center font-mono text-[8.5px] font-semibold text-[#6b7280]"
                            style={{ marginLeft: -7 }}>
                            +{extraCount}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#c0bcb4]">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div><StatusBadge status={p.status} /></div>

                  {/* Progress */}
                  <div className="flex items-center gap-[7px]">
                    <div className="flex-1 h-[4px] rounded-[2px] bg-[#eceae4] overflow-hidden">
                      <div className="h-full rounded-[2px]" style={{ width: `${progress}%`, background: cfg.bar }} />
                    </div>
                    <span className="font-mono text-[10.5px] text-[#6b7280] w-[24px] text-right">{progress}</span>
                  </div>

                  {/* Due date */}
                  <div className="text-right font-mono text-[11px] text-[#4b5563]">
                    {p.end_date ? fmtDate(p.end_date) : '—'}
                  </div>
                </motion.div>
              );
            })}

            {/* Footer */}
            <div className="h-[36px] flex items-center justify-between px-[15px] border-t border-[#eceae4] bg-[#faf9f7]">
              <span className="text-[11px] text-[#8a8f98]">
                Showing {filtered.length} of {total}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppLayout>
  );
}
