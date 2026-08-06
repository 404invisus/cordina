'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService, taskService, sprintService, epicService, storyService } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: {
    reviewColumnLabel: 'Review',
    moveTo: 'Move to',
    progressLabel: 'Progress',
    addBacklogToBoardTitle: 'Add Backlog to Board',
    addBacklogToBoardSubtitle: 'Select backlog from this sprint',
    loadingBacklogs: 'Loading backlogs...',
    allBacklogsOnBoard: 'All backlogs are already on the board',
    ptsSuffix: 'pts',
    assigneeLabel: 'Assignee',
    noMembers: 'No members',
    backlogAddedToBoard: 'Backlog added to board!',
    addBacklogFailed: 'Failed to add backlog',
    backToProject: 'Back to Project',
    addBacklogBtn: 'Add Backlog',
    moveTaskFailed: 'Failed to move task',
    kanbanBoard: 'Kanban Board',
    boardSubtitle: '{count} tasks total · hover a card to change status',
    noTasks: 'No tasks',
    doneSuffix: 'done',
  },
  id: {
    reviewColumnLabel: 'Ditinjau',
    moveTo: 'Pindahkan ke',
    progressLabel: 'Progres',
    addBacklogToBoardTitle: 'Tambah Backlog ke Papan',
    addBacklogToBoardSubtitle: 'Pilih backlog dari sprint ini',
    loadingBacklogs: 'Memuat backlog...',
    allBacklogsOnBoard: 'Semua backlog sudah ada di papan',
    ptsSuffix: 'poin',
    assigneeLabel: 'Penanggung Jawab',
    noMembers: 'Tidak ada anggota',
    backlogAddedToBoard: 'Backlog berhasil ditambahkan ke papan!',
    addBacklogFailed: 'Gagal menambahkan backlog',
    backToProject: 'Kembali ke Proyek',
    addBacklogBtn: 'Tambah Backlog',
    moveTaskFailed: 'Gagal memindahkan tugas',
    kanbanBoard: 'Papan Kanban',
    boardSubtitle: '{count} total tugas · arahkan kursor ke kartu untuk mengubah status',
    noTasks: 'Tidak ada tugas',
    doneSuffix: 'selesai',
  },
};

const COLUMNS = [
  {
    id: 'todo',
    label: 'common.status_todo',
    bg: 'bg-surface-2',
    border: 'border-border/80',
    dot: 'bg-text-placeholder',
    header: 'text-text-secondary',
    count: 'bg-border text-text-secondary',
  },
  {
    id: 'in_progress',
    label: 'common.status_in_progress',
    bg: 'bg-info-soft/40',
    border: 'border-info/30',
    dot: 'bg-info',
    header: 'text-info-text',
    count: 'bg-info-soft text-info-text',
  },
  {
    id: 'review',
    label: 'reviewColumnLabel',
    bg: 'bg-navy-700/8',
    border: 'border-navy-700/20',
    dot: 'bg-navy-700',
    header: 'text-navy-900',
    count: 'bg-navy-700/10 text-navy-900',
  },
  {
    id: 'done',
    label: 'common.status_done',
    bg: 'bg-success-soft/40',
    border: 'border-success/30',
    dot: 'bg-success',
    header: 'text-success-text',
    count: 'bg-success-soft text-success-text',
  },
];

const PRIORITY: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'common.status_critical', color: 'text-danger-text', bg: 'bg-danger-soft', dot: 'bg-danger' },
  high: { label: 'common.status_high', color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  medium: { label: 'common.status_medium', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-400' },
  low: { label: 'common.status_low', color: 'text-success-text', bg: 'bg-success-soft', dot: 'bg-success' },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  bug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-danger">
      <path d="M8 2l1.5 1.5M15.5 2L14 3.5M12 4a5 5 0 015 5v3a5 5 0 01-10 0V9a5 5 0 015-5z" />
      <path d="M7.5 7.5L5 5M16.5 7.5L19 5M7 13H4M20 13h-3M8 18l-2 2M16 18l2 2" />
    </svg>
  ),
  feature: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-info">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  task: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-text-placeholder">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
};

function TaskCard({ task, onMove, colId }: { task: any; onMove: (id: string, status: string) => void; colId: string }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && colId !== 'done';
  const progressPct =
    task.estimated_hours && task.actual_hours ? Math.min(100, Math.round((task.actual_hours / task.estimated_hours) * 100)) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`group relative bg-white rounded-[6px] border border-border transition-all duration-200 ${menuOpen ? '' : 'hover:-translate-y-0.5'}`}
    >
      <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border to-transparent`} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center">
              {TYPE_ICON[task.type] || TYPE_ICON.task}
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${p.bg} ${p.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              {t(p.label)}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-border-button hover:text-text-tertiary hover:bg-border-subtle transition-all ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="absolute right-0 top-8 z-20 bg-white rounded-[6px] border border-border py-1.5 w-40 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-xs font-semibold text-text-placeholder uppercase tracking-wider">{t('moveTo')}</div>
                    {COLUMNS.filter((c) => c.id !== colId).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onMove(task.id, c.id);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-2 text-sm text-text-secondary transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        {t(c.label)}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Link href={`/tasks/${task.id}`} className="block mb-3 group/link">
          <p className="text-sm font-semibold text-navy-800 group-hover/link:text-navy-700 leading-snug transition-colors line-clamp-2">
            {task.title}
          </p>
          {task.description && <p className="text-xs text-text-placeholder mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>}
        </Link>

        {progressPct !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-text-placeholder mb-1">
              <span>{t('progressLabel')}</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-success' : 'bg-navy-700'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-surface-2">
          <div className="flex items-center gap-2.5">
            {task.due_date && (
              <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-danger' : 'text-text-placeholder'}`}>
                {isOverdue ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )}
                {isOverdue ? t('common.status_overdue') : formatDate(task.due_date, locale)}
              </div>
            )}
            {task.estimated_hours && (
              <div className="flex items-center gap-1 text-xs text-text-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {task.estimated_hours}h
              </div>
            )}
          </div>

          {task.assignee_id ? (
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-navy-700 to-navy-700 flex items-center justify-center ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-white">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-border-subtle border border-dashed border-border-button flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-border-button">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AddBacklogModal({ open, onClose, sprintId, projectId, existingStoryIds }: any) {
  const t = useT(dict);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const { data: epics } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => epicService.list(projectId).then((r) => r.data.data),
    enabled: open,
  });
  const { data: allStories, isLoading } = useQuery({
    queryKey: ['all-backlog', projectId],
    queryFn: async () => {
      if (!epics) return [];
      const results = await Promise.all(
        epics.map((e: any) => storyService.list(e.id).then((r) => r.data.data.map((s: any) => ({ ...s, epic_title: e.title })))),
      );
      return results.flat();
    },
    enabled: open && !!epics,
  });
  const { data: members } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => projectService.members(projectId).then((r) => r.data.data),
    enabled: open,
  });

  const unassignedStories = (allStories || [])
    .filter((s: any) => !s.sprint_id || s.sprint_id === sprintId)
    .filter((s: any) => !(existingStoryIds || []).includes(s.id));
  const stories = allStories;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const story = stories?.find((s: any) => s.id === selected);
      console.log('[AddBacklog] selected:', selected, 'sprintId:', sprintId, 'story:', story);
      if (story && story.sprint_id !== sprintId) {
        await storyService.update(selected!, { sprint_id: sprintId });
      }
      return taskService.create({
        title: story?.title,
        type: 'task',
        story_id: selected,
        sprint_id: sprintId,
        assignee_id: assigneeIds[0] || undefined,
        assignee_ids: assigneeIds.length > 0 ? assigneeIds : undefined,
        priority: story?.priority || 'medium',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', projectId, sprintId] });
      qc.invalidateQueries({ queryKey: ['all-backlog', projectId] });
      toast.success(t('backlogAddedToBoard'));
      setSelected(null);
      setAssigneeIds([]);
      onClose();
    },
    onError: (e: any) => {
      console.error('[AddBacklog] error:', e);
      toast.error(e?.response?.data?.message || t('addBacklogFailed'));
    },
  });

  const PRIORITY_COLOR: Record<string, string> = {
    critical: 'text-danger-text bg-danger-soft',
    high: 'text-orange-500 bg-orange-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-success-text bg-success-soft',
  };
  return (
    <Modal open={open} onClose={onClose} title={t('addBacklogToBoardTitle')} subtitle={t('addBacklogToBoardSubtitle')}>
      <div className="space-y-4">
        {isLoading && <div className="py-8 text-center text-sm text-text-placeholder">{t('loadingBacklogs')}</div>}
        {!isLoading && unassignedStories.length === 0 && (
          <div className="py-8 text-center text-sm text-text-placeholder">{t('allBacklogsOnBoard')}</div>
        )}
        {unassignedStories.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {unassignedStories.map((s: any) => (
              <div
                key={s.id}
                onClick={() => {
                  console.log('[select]', s.id);
                  setSelected(s.id);
                }}
                className={`flex items-center gap-3 p-3 rounded-[6px] border-2 cursor-pointer transition-all ${selected === s.id ? 'border-navy-700 bg-navy-700/4' : 'border-border-subtle hover:border-border'}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected === s.id ? 'bg-navy-700 border-navy-700' : 'border-border-button'}`}
                >
                  {selected === s.id && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate">{s.title}</div>
                  {s.description && <div className="text-xs text-text-placeholder truncate mt-0.5">{s.description}</div>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {s.story_points && (
                    <span className="text-xs font-semibold text-text-placeholder bg-border-subtle px-2 py-0.5 rounded-lg">
                      {s.story_points}{t('ptsSuffix')}
                    </span>
                  )}
                  {s.priority && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${PRIORITY_COLOR[s.priority] || ''}`}>{s.priority}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div>
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Assignee</label>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-[6px] p-2">
              {(members || []).length === 0 && <div className="text-xs text-text-placeholder px-2 py-1">No members</div>}
              {(members || []).map((m: any) => {
                const uid = m.user_id || m.id;
                const checked = assigneeIds.includes(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => setAssigneeIds((prev) => (checked ? prev.filter((id) => id !== uid) : [...prev, uid]))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${checked ? 'bg-navy-700/10 text-navy-700' : 'hover:bg-surface-2 text-text-secondary'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-navy-700 border-navy-700' : 'border-border-button'}`}
                    >
                      {checked && (
                        <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span>{m.full_name || m.name || m.email}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => {
              setSelected(null);
              setAssigneeIds([]);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !selected}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-navy-900 disabled:opacity-60 transition-colors"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function BoardPage() {
  const t = useT(dict);
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sprintId = searchParams.get('sprint_id') || '';
  const qc = useQueryClient();
  const { hasRole } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', id, sprintId],
    queryFn: () => projectService.board(id, sprintId || undefined).then((r) => r.data.data),
    enabled: true,
  });

  const moveMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => taskService.move(taskId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', id, sprintId] }),
    onError: () => toast.error(t('moveTaskFailed')),
  });

  if (isLoading)
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );

  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: (board?.tasks || []).filter((t: any) => t.status === col.id),
  }));

  const totalTasks = board?.tasks?.length || 0;
  const doneTasks = columns.find((c) => c.id === 'done')?.tasks.length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-text-placeholder hover:text-navy-700 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Project
          </Link>
          {canCreate && sprintId && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setCreateOpen(true)}
              className="btn-primary flex items-center gap-2 text-sm text-navy-700"
            >
              <Plus className="w-4 h-4" />
              Add Backlog
            </motion.button>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Kanban Board</h1>
            <p className="text-sm text-text-placeholder mt-0.5">{totalTasks} tasks total · hover a card to change status</p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-border-subtle rounded-[6px] px-4 py-2.5 ">
            {columns.map((col, i) => (
              <div key={col.id} className="flex items-center gap-1.5">
                {i > 0 && <div className="w-px h-3 bg-border mx-1" />}
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs text-text-tertiary">{col.label}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${col.count}`}>{col.tasks.length}</span>
              </div>
            ))}
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-border-subtle rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-navy-700 to-navy-700"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-sm font-bold text-text-secondary">{progress}%</span>
              <span className="text-xs text-text-placeholder">done</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {columns.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-[300px] flex flex-col">
            <div className={`rounded-[6px] border ${col.border} ${col.bg} flex flex-col flex-1`}>
              <div className="px-4 pt-4 pb-3.5 flex items-center justify-between border-b border-white/60">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className={`text-sm font-bold ${col.header}`}>{col.label}</span>
                </div>
                <span className={`min-w-6 h-6 px-2 rounded-lg text-xs font-bold flex items-center justify-center ${col.count}`}>
                  {col.tasks.length}
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                <AnimatePresence mode="popLayout">
                  {col.tasks.map((task: any) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      colId={col.id}
                      onMove={(taskId, status) => moveMutation.mutate({ taskId, status })}
                    />
                  ))}
                </AnimatePresence>

                {col.tasks.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-[6px] bg-white/70 border-2 border-dashed border-border flex items-center justify-center mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-border-button">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-border-button">No tasks</p>
                  </div>
                )}

                {canCreate && col.id === 'todo' && sprintId && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCreateOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-[6px] border-2 border-dashed border-border text-xs font-semibold text-text-placeholder hover:border-navy-700/30 hover:text-navy-700 hover:bg-white/80 transition-all mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Backlog
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddBacklogModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        sprintId={sprintId}
        projectId={id}
        existingStoryIds={(board?.tasks || []).map((t: any) => t.story_id).filter(Boolean)}
      />
    </AppLayout>
  );
}
