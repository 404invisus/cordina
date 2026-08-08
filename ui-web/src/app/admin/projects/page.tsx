'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Search,
  MoreVertical,
  Trash2,
  X,
  CheckSquare,
  Clock,
  AlertTriangle,
  Users,
  Eye,
  Download,
  Pencil,
  Loader2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminProjectService, adminReportExportService } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

const dict = {
  en: {
    detailProject: 'Detail Project',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    statusCompleted: 'Completed',
    statusArchived: 'Archived',
    taskStatusTodo: 'To Do',
    taskStatusInProgress: 'In Progress',
    taskStatusReview: 'Review',
    taskStatusDone: 'Done',
    startLabel: 'Mulai',
    endLabel: 'Selesai',
    tasksCount: 'Tasks ({count})',
    membersCount: 'Members ({count})',
    editProject: 'Edit Project',
    updateProjectInfo: 'Update project information',
    projectNameLabel: 'Nama Project *',
    projectNamePlaceholder: 'Nama project',
    descriptionLabel: 'Deskripsi',
    descriptionPlaceholder: 'Deskripsi project',
    statusOptionActive: 'Active',
    statusOptionInactive: 'Nonaktif',
    statusOptionCompleted: 'Selesai',
    statusOptionArchived: 'Arsip',
    startDateLabel: 'Tanggal Mulai',
    endDateLabel: 'Tanggal Selesai',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    projectUpdated: 'Project updated!',
    failed: 'Failed',
    projectNameRequired: 'Project name is required',
    exportPdf: 'Export PDF',
    manageProjects: 'Manage Projects',
    projectsRegistered: '{count} projects registered',
    statTotalProject: 'Total Project',
    statTaskCompleted: 'Task Selesai',
    statInProgress: 'In Progress',
    statOverdueTasks: 'Overdue Tasks',
    filterAll: 'All',
    searchProjectsPlaceholder: 'Search projects...',
    projectsCount: '{count} project',
    noProjects: 'No projects',
    colProject: 'Project',
    colPeriode: 'Periode',
    colMembers: 'Members',
    colTasks: 'Tasks',
    viewDetails: 'View Details',
    deleteProjectTitle: 'Delete Project?',
    andAllDataDeleted: 'and all related data will be permanently deleted.',
    deleting: 'Deleting...',
    reportDownloaded: 'Report downloaded successfully',
    failedDownloadReport: 'Failed to download report',
    projectDeleted: 'Project deleted',
  },
  id: {
    detailProject: 'Detail Proyek',
    statusActive: 'Aktif',
    statusInactive: 'Tidak Aktif',
    statusCompleted: 'Selesai',
    statusArchived: 'Diarsipkan',
    taskStatusTodo: 'Belum Dimulai',
    taskStatusInProgress: 'Sedang Berjalan',
    taskStatusReview: 'Ditinjau',
    taskStatusDone: 'Selesai',
    startLabel: 'Mulai',
    endLabel: 'Selesai',
    tasksCount: 'Tugas ({count})',
    membersCount: 'Anggota ({count})',
    editProject: 'Ubah Proyek',
    updateProjectInfo: 'Perbarui informasi proyek',
    projectNameLabel: 'Nama Proyek *',
    projectNamePlaceholder: 'Nama proyek',
    descriptionLabel: 'Deskripsi',
    descriptionPlaceholder: 'Deskripsi proyek',
    statusOptionActive: 'Aktif',
    statusOptionInactive: 'Nonaktif',
    statusOptionCompleted: 'Selesai',
    statusOptionArchived: 'Diarsipkan',
    startDateLabel: 'Tanggal Mulai',
    endDateLabel: 'Tanggal Selesai',
    saving: 'Menyimpan...',
    saveChanges: 'Simpan Perubahan',
    projectUpdated: 'Proyek berhasil diperbarui!',
    failed: 'Gagal',
    projectNameRequired: 'Nama proyek wajib diisi',
    exportPdf: 'Ekspor PDF',
    manageProjects: 'Kelola Proyek',
    projectsRegistered: '{count} proyek terdaftar',
    statTotalProject: 'Total Proyek',
    statTaskCompleted: 'Tugas Selesai',
    statInProgress: 'Sedang Berjalan',
    statOverdueTasks: 'Tugas Terlambat',
    filterAll: 'Semua',
    searchProjectsPlaceholder: 'Cari proyek...',
    projectsCount: '{count} proyek',
    noProjects: 'Tidak ada proyek',
    colProject: 'Proyek',
    colPeriode: 'Periode',
    colMembers: 'Anggota',
    colTasks: 'Tugas',
    viewDetails: 'Lihat Detail',
    deleteProjectTitle: 'Hapus Proyek?',
    andAllDataDeleted: 'beserta seluruh data terkait akan dihapus secara permanen.',
    deleting: 'Menghapus...',
    reportDownloaded: 'Laporan berhasil diunduh',
    failedDownloadReport: 'Gagal mengunduh laporan',
    projectDeleted: 'Proyek berhasil dihapus',
  },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  active: { color: 'text-success-text', bg: 'bg-success-soft', dot: 'bg-success' },
  inactive: { color: 'text-text-tertiary', bg: 'bg-border-subtle', dot: 'bg-text-placeholder' },
  completed: { color: 'text-info-text', bg: 'bg-info-soft', dot: 'bg-info' },
  archived: { color: 'text-neutral-text', bg: 'bg-neutral-soft', dot: 'bg-neutral' },
};

const STATUS_LABEL_KEY: Record<string, string> = {
  active: 'statusActive',
  inactive: 'statusInactive',
  completed: 'statusCompleted',
  archived: 'statusArchived',
};

function statusLabel(status: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  return t(STATUS_LABEL_KEY[status] || STATUS_LABEL_KEY.active);
}

const TASK_STATUS_CONFIG: Record<string, { color: string }> = {
  todo: { color: 'text-text-tertiary' },
  in_progress: { color: 'text-info-text' },
  review: { color: 'text-navy-700' },
  done: { color: 'text-success-text' },
};

const TASK_STATUS_LABEL_KEY: Record<string, string> = {
  todo: 'taskStatusTodo',
  in_progress: 'taskStatusInProgress',
  review: 'taskStatusReview',
  done: 'taskStatusDone',
};

function taskStatusLabel(status: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  return TASK_STATUS_LABEL_KEY[status] ? t(TASK_STATUS_LABEL_KEY[status]) : status;
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white rounded-[6px] border border-border-subtle p-4 flex items-center gap-4">
      <div className={`w-11 h-11 ${bg} rounded-[6px] flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="text-xs text-text-placeholder">{label}</div>
        <div className="text-2xl font-extrabold text-navy-900">{value}</div>
      </div>
    </div>
  );
}
function ProjectDrawer({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const t = useT(dict);
  const { data: project, isLoading } = useQuery({
    queryKey: ['admin-project', projectId],
    queryFn: () => adminProjectService.show(projectId).then((r) => r.data.data),
  });

  const { data: tasks } = useQuery({
    queryKey: ['admin-project-tasks', projectId],
    queryFn: () => adminProjectService.tasks(projectId).then((r) => r.data.data),
  });

  const { data: members } = useQuery({
    queryKey: ['admin-project-members', projectId],
    queryFn: () => adminProjectService.members(projectId).then((r) => r.data.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-md bg-white flex flex-col h-full"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="font-bold text-navy-900">{t('detailProject')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
            <X className="w-4 h-4 text-text-placeholder" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
          </div>
        ) : project ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-xl text-navy-900">{project.name}</h3>
                {(() => {
                  const conf = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${conf.bg} ${conf.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                      {statusLabel(project.status, t)}
                    </span>
                  );
                })()}
              </div>
              {project.description && <p className="text-sm text-text-tertiary">{project.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 rounded-[6px] p-3">
                <div className="text-xs text-text-placeholder mb-0.5">{t('startLabel')}</div>
                <div className="text-sm font-semibold text-text-secondary">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </div>
              </div>
              <div className="bg-surface-2 rounded-[6px] p-3">
                <div className="text-xs text-text-placeholder mb-0.5">{t('endLabel')}</div>
                <div className="text-sm font-semibold text-text-secondary">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-'}
                </div>
              </div>
            </div>

            {tasks && (
              <div>
                <div className="text-xs font-semibold text-text-placeholder uppercase tracking-wider mb-2">
                  {t('tasksCount', { count: tasks.length })}
                </div>
                <div className="space-y-1.5">
                  {Object.entries(
                    tasks.reduce((acc: any, t: any) => {
                      acc[t.status] = (acc[t.status] || 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([status, count]: any) => {
                    const conf = TASK_STATUS_CONFIG[status] || { color: 'text-text-tertiary' };
                    return (
                      <div key={status} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg">
                        <span className={`text-sm font-medium ${conf.color}`}>{taskStatusLabel(status, t)}</span>
                        <span className="text-sm font-bold text-text-secondary">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {members && members.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-text-placeholder uppercase tracking-wider mb-2">
                  {t('membersCount', { count: members.length })}
                </div>
                <div className="space-y-2">
                  {members.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-surface-2 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-navy-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {m.full_name
                          ?.split(' ')
                          .map((w: string) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-navy-800">{m.full_name}</div>
                        <div className="text-xs text-text-placeholder">{m.pivot?.role || m.roles?.[0] || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
function EditProjectModal({ project, onClose }: { project: any; onClose: () => void }) {
  const qc = useQueryClient();
  const t = useT(dict);
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    start_date: project?.start_date ? String(project.start_date).slice(0, 10) : '',
    end_date: project?.end_date ? String(project.end_date).slice(0, 10) : '',
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: any) => adminProjectService.update(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects'] });
      qc.invalidateQueries({ queryKey: ['admin-project-stats'] });
      toast.success(t('projectUpdated'));
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error(t('projectNameRequired'));
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-[6px] w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="font-bold text-navy-900">{t('editProject')}</h2>
            <p className="text-xs text-text-placeholder mt-0.5">{t('updateProjectInfo')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
            <X className="w-4 h-4 text-text-placeholder" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('projectNameLabel')}</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
              placeholder={t('projectNamePlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('descriptionLabel')}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all resize-none"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('common.status')}</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all pr-8"
              >
                <option value="active">{t('statusOptionActive')}</option>
                <option value="inactive">{t('statusOptionInactive')}</option>
                <option value="completed">{t('statusOptionCompleted')}</option>
                <option value="archived">{t('statusOptionArchived')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('startDateLabel')}</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('endDateLabel')}</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


const ACTION_MENU_WIDTH = 160; // w-40

/**
 * Menu aksi baris proyek.
 *
 * Dirender lewat portal ke document.body dengan posisi fixed, bukan absolute
 * di dalam baris tabel. Kartu tabel memakai overflow-hidden agar sudutnya
 * membulat rapi, dan itu memotong menu yang diposisikan absolute, sehingga
 * pilihan paling bawah (Hapus) tidak dapat diklik. Pola ini mengikuti menu
 * aksi pada halaman Kelola Pengguna.
 */
function ProjectRowActions({ project, openMenu, setOpenMenu, onView, onEdit, onDelete }: any) {
  const t = useT(dict);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const isOpen = openMenu === project.id;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setOpenMenu]);

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const MENU_HEIGHT = 132;
      // buka ke atas bila ruang di bawah tidak cukup
      const openUpward = rect.bottom + MENU_HEIGHT > window.innerHeight - 8;
      setPosition({
        top: openUpward ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
        left: Math.max(8, rect.right - ACTION_MENU_WIDTH),
      });
    }
    setOpenMenu(isOpen ? null : project.id);
  };

  const item = 'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors';

  return (
    <div className="relative inline-block">
      <button ref={btnRef} onClick={handleToggle} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
        <MoreVertical className="w-4 h-4 text-text-placeholder" />
      </button>
      {isOpen &&
        position &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'fixed', top: position.top, left: position.left }}
              className="w-40 bg-white rounded-[6px] border border-border-subtle shadow-[0_8px_24px_rgba(13,43,72,0.16)] overflow-hidden z-50"
            >
              <button
                onClick={() => { onView(); setOpenMenu(null); }}
                className={`${item} text-text-secondary hover:bg-surface-2`}
              >
                <Eye className="w-3.5 h-3.5" /> {t('viewDetails')}
              </button>
              <button
                onClick={() => { onEdit(); setOpenMenu(null); }}
                className={`${item} text-text-secondary hover:bg-surface-2`}
              >
                <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
              </button>
              <div className="h-px bg-border-subtle mx-2" />
              <button
                onClick={() => { onDelete(); setOpenMenu(null); }}
                className={`${item} text-danger-text hover:bg-danger-soft`}
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
              </button>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export default function AdminProjectsPage() {
  const qc = useQueryClient();
  const t = useT(dict);
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminReportExportService.projects();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'laporan_project.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('reportDownloaded'));
    } catch {
      toast.error(t('failedDownloadReport'));
    } finally {
      setExporting(false);
    }
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewProject, setViewProject] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<any>(null);
  const [editProject, setEditProject] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ['admin-project-stats'],
    queryFn: () => adminProjectService.stats().then((r) => r.data.data),
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['admin-projects', search, statusFilter],
    queryFn: () =>
      adminProjectService
        .list({ ...(search && { search }), ...(statusFilter && { status: statusFilter }), per_page: 50 })
        .then((r) => r.data),
  });

  const projects = projectsData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminProjectService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects'] });
      qc.invalidateQueries({ queryKey: ['admin-project-stats'] });
      toast.success(t('projectDeleted'));
      setDeleteProject(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-navy-700 to-navy-700 rounded-[6px] flex items-center justify-center border border-navy-700">
            <FolderOpen className="w-5 h-5 text-navy-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{t('manageProjects')}</h1>
            <p className="text-sm text-text-placeholder mt-0.5">{t('projectsRegistered', { count: stats?.total_projects || 0 })}</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-40"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t('exportPdf')}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={FolderOpen} label={t('statTotalProject')} value={stats.total_projects} color="text-navy-700" bg="bg-navy-700/8" />
          <StatCard
            icon={CheckSquare}
            label={t('statTaskCompleted')}
            value={stats.tasks_by_status?.done || 0}
            color="text-success-text"
            bg="bg-success-soft"
          />
          <StatCard
            icon={Clock}
            label={t('statInProgress')}
            value={stats.tasks_by_status?.in_progress || 0}
            color="text-info-text"
            bg="bg-info-soft"
          />
          <StatCard icon={AlertTriangle} label={t('statOverdueTasks')} value={stats.overdue_tasks || 0} color="text-danger-text" bg="bg-danger-soft" />
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        {[{ value: '', label: t('filterAll') }, ...Object.entries(STATUS_CONFIG).map(([v]) => ({ value: v, label: statusLabel(v, t) }))].map(
          ({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === value
                  ? 'bg-navy-700 text-white'
                  : 'bg-white border border-border text-text-tertiary hover:border-border-button'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="bg-white rounded-[6px] border border-border-subtle overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-[6px] border border-border text-sm text-text-secondary placeholder:text-border-button focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all w-full"
              placeholder={t('searchProjectsPlaceholder')}
            />
          </div>
          <span className="ml-auto text-xs text-text-placeholder">{t('projectsCount', { count: projects.length })}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-text-placeholder">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('noProjects')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-2/50 border-b border-border-subtle">
                {[t('colProject'), t('common.status'), t('colPeriode'), t('colMembers'), t('colTasks'), ''].map((h, i) => (
                  <th key={i} className="text-left px-5 py-3 text-xs font-semibold text-text-placeholder uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {projects.map((p: any, i: number) => {
                  const sConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-surface-2 hover:bg-surface-2/60 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[6px] bg-navy-700/10 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-4 h-4 text-navy-700" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-navy-800">{p.name}</div>
                            {p.description && (
                              <div className="text-xs text-text-placeholder mt-0.5 truncate max-w-[180px]">{p.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sConf.bg} ${sConf.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sConf.dot}`} />
                          {statusLabel(p.status, t)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-text-tertiary">
                        {p.start_date ? new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                        {' - '}
                        {p.end_date
                          ? new Date(p.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-text-secondary">
                          <Users className="w-3.5 h-3.5 text-text-placeholder" />
                          {p.members_count ?? '-'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-text-secondary">
                          <CheckSquare className="w-3.5 h-3.5 text-text-placeholder" />
                          {p.tasks_count ?? '-'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewProject(p.id)}
                            className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors text-text-placeholder hover:text-navy-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <ProjectRowActions
                            project={p}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            onView={() => setViewProject(p.id)}
                            onEdit={() => setEditProject(p)}
                            onDelete={() => setDeleteProject(p)}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>{viewProject && <ProjectDrawer projectId={viewProject} onClose={() => setViewProject(null)} />}</AnimatePresence>

      <AnimatePresence>{editProject && <EditProjectModal project={editProject} onClose={() => setEditProject(null)} />}</AnimatePresence>

      <AnimatePresence>
        {deleteProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteProject(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-[6px] w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <h3 className="font-bold text-navy-900 mb-1">{t('deleteProjectTitle')}</h3>
              <p className="text-sm text-text-tertiary mb-5">
                <span className="font-semibold text-text-secondary">{deleteProject.name}</span> {t('andAllDataDeleted')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteProject(null)}
                  className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteProject.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[6px] bg-danger text-white text-sm font-semibold hover:bg-danger-text disabled:opacity-50"
                >
                  {deleteMutation.isPending ? t('deleting') : t('common.delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
