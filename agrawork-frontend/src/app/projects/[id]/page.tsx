'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FolderKanban, LayoutGrid, GitBranch, Zap, Users, Plus, Play, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService, sprintService, epicService } from '@/lib/api';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FolderKanban },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'sprints', label: 'Sprints', icon: Zap },
  { id: 'epics', label: 'Epics', icon: GitBranch },
  { id: 'members', label: 'Members', icon: Users },
];

function SprintCard({ sprint, projectId }: { sprint: any; projectId: string }) {
  const qc = useQueryClient();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const startMutation = useMutation({
    mutationFn: () => sprintService.start(projectId, sprint.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', projectId] }); toast.success('Sprint dimulai!'); },
  });
  const completeMutation = useMutation({
    mutationFn: () => sprintService.complete(projectId, sprint.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', projectId] }); toast.success('Sprint selesai!'); },
  });

  return (
    <div className="p-4 rounded-xl border border-slate-100 hover:border-[#284074]/20 transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-slate-800">{sprint.name}</h4>
        <span className={`badge ${getStatusColor(sprint.status)}`}>{getStatusLabel(sprint.status)}</span>
      </div>
      <div className="text-xs text-slate-400 mb-3">{formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}</div>
      {sprint.goal && <p className="text-sm text-slate-500 mb-3">{sprint.goal}</p>}
      {canManage && (
        <div className="flex gap-2">
          {sprint.status === 'planned' && (
            <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-[#284074] text-white px-3 py-1.5 rounded-lg hover:bg-[#1e3260]">
              <Play className="w-3 h-3" /> Mulai Sprint
            </button>
          )}
          {sprint.status === 'active' && (
            <button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
              <CheckCircle2 className="w-3 h-3" /> Selesaikan
            </button>
          )}
          <Link href={`/projects/${projectId}/board?sprint_id=${sprint.id}`}
            className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-[#284074] hover:text-[#284074]">
            <LayoutGrid className="w-3 h-3" /> Board
          </Link>
        </div>
      )}
    </div>
  );
}

function CreateSprintModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => sprintService.create(projectId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprints', projectId] }); toast.success('Sprint dibuat!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Buat Sprint Baru">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Sprint</label>
          <input {...register('name', { required: true })} className="input-field" placeholder="Sprint 1" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Sprint Goal</label>
          <textarea {...register('goal')} className="input-field h-16 resize-none" placeholder="Tujuan sprint ini..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
            <input {...register('start_date', { required: true })} type="date" className="input-field" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
            <input {...register('end_date', { required: true })} type="date" className="input-field" /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary">Batal</button>
          <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? 'Membuat...' : 'Buat Sprint'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState('overview');
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.show(id).then(r => r.data.data),
  });
  const { data: sprints } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => sprintService.list(id).then(r => r.data.data),
    enabled: tab === 'sprints' || tab === 'overview',
  });
  const { data: epics } = useQuery({
    queryKey: ['epics', id],
    queryFn: () => epicService.list(id).then(r => r.data.data),
    enabled: tab === 'epics',
  });
  const { data: members } = useQuery({
    queryKey: ['members', id],
    queryFn: () => projectService.members(id).then(r => r.data.data),
    enabled: tab === 'members',
  });

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-4">
        <Link href="/projects" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#284074] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Projects
        </Link>
      </div>

      <PageHeader
        title={project?.name || ''}
        subtitle={project?.description}
        icon={FolderKanban}
        actions={
          <div className="flex items-center gap-2">
            <span className={`badge ${getStatusColor(project?.status)}`}>{getStatusLabel(project?.status)}</span>
            <Link href={`/projects/${id}/board`} className="btn-primary flex items-center gap-2 text-sm">
              <LayoutGrid className="w-4 h-4" /> Board
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-[#284074] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h3 className="font-display font-600 text-slate-800 mb-3">Detail Project</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Divisi', project?.division],
                  ['Status', getStatusLabel(project?.status)],
                  ['Mulai', formatDate(project?.start_date)],
                  ['Selesai', formatDate(project?.end_date)],
                ].map(([k, v]) => (
                  <div key={k}><span className="text-slate-400">{k}</span><div className="font-medium text-slate-700 mt-0.5">{v}</div></div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-600 text-slate-800">Sprint Aktif</h3>
                <Link href={`/projects/${id}/board`} className="text-sm text-[#284074]">Buka Board →</Link>
              </div>
              {sprints?.filter((s: any) => s.status === 'active').map((s: any) => (
                <SprintCard key={s.id} sprint={s} projectId={id} />
              ))}
              {!sprints?.some((s: any) => s.status === 'active') && (
                <div className="text-sm text-slate-400 text-center py-4">Tidak ada sprint aktif</div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-display font-600 text-slate-800 mb-3">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { href: `/projects/${id}/board`, label: 'Kanban Board', icon: LayoutGrid },
                  { href: `/projects/${id}/roadmap`, label: 'Roadmap', icon: GitBranch },
                  { href: `/workload`, label: 'Workload', icon: Users },
                ].map(l => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-50 text-sm text-slate-600 hover:text-[#284074] transition-colors">
                    <l.icon className="w-4 h-4" />{l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sprints */}
      {tab === 'sprints' && (
        <div>
          {canManage && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setCreateSprintOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Buat Sprint
              </button>
            </div>
          )}
          <div className="space-y-3">
            {sprints?.map((s: any) => <SprintCard key={s.id} sprint={s} projectId={id} />)}
            {(!sprints || sprints.length === 0) && <div className="card text-center py-12 text-slate-400">Belum ada sprint</div>}
          </div>
          <CreateSprintModal open={createSprintOpen} onClose={() => setCreateSprintOpen(false)} projectId={id} />
        </div>
      )}

      {/* Epics */}
      {tab === 'epics' && (
        <div className="space-y-3">
          {epics?.map((e: any) => (
            <div key={e.id} className="card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">{e.title}</div>
                  <div className="text-sm text-slate-400 mt-1">{e.description}</div>
                </div>
                <span className={`badge ${getStatusColor(e.status)}`}>{getStatusLabel(e.status)}</span>
              </div>
            </div>
          ))}
          {(!epics || epics.length === 0) && <div className="card text-center py-12 text-slate-400">Belum ada epic</div>}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members?.map((m: any) => (
            <div key={m.user_id || m.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#284074] text-white flex items-center justify-center font-600">
                {(m.full_name || m.user?.full_name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-slate-800 text-sm">{m.full_name || m.user?.full_name}</div>
                <div className="text-xs text-slate-400">{m.role || m.user?.division}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Board redirect */}
      {tab === 'board' && (
        <div className="text-center py-12">
          <Link href={`/projects/${id}/board`} className="btn-primary inline-flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Buka Kanban Board
          </Link>
        </div>
      )}
    </AppLayout>
  );
}
