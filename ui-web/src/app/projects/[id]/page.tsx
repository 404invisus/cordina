'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService, sprintService, epicService, storyService } from '@/lib/api';
import { getStatusLabel } from '@/lib/status';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const STATUS_META: Record<string, { dot: string; bg: string; text: string }> = {
  active: { dot: 'bg-success', bg: 'bg-success-soft', text: 'text-success-text' },
  completed: { dot: 'bg-navy-700', bg: 'bg-info-soft', text: 'text-info-text' },
  planned: { dot: 'bg-text-placeholder', bg: 'bg-border-subtle', text: 'text-text-secondary' },
  on_hold: { dot: 'bg-neutral', bg: 'bg-neutral-soft', text: 'text-neutral-text' },
  todo: { dot: 'bg-text-placeholder', bg: 'bg-border-subtle', text: 'text-text-secondary' },
  in_progress: { dot: 'bg-info', bg: 'bg-info-soft', text: 'text-info-text' },
  done: { dot: 'bg-success', bg: 'bg-success-soft', text: 'text-success-text' },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META['planned'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {getStatusLabel(status)}
    </span>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'M3 7h18M3 12h18M3 17h18' },
  { id: 'board', label: 'Board', icon: 'M4 5h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 13h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z' },
  { id: 'sprints', label: 'Sprints', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  {
    id: 'epics',
    label: 'Epics',
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  },
  {
    id: 'members',
    label: 'Members',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

function AddBacklogToSprintModal({
  open,
  onClose,
  sprintId,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  sprintId: string;
  projectId: string;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const { data: epics } = useQuery({
    queryKey: ['epics', projectId],
    queryFn: () => epicService.list(projectId).then((r) => r.data.data),
    enabled: open,
  });

  const { data: allStories, isLoading } = useQuery({
    queryKey: ['all-stories-unassigned', projectId],
    queryFn: async () => {
      if (!epics) return [];
      const results = await Promise.all(
        epics.map((e: any) => storyService.list(e.id).then((r) => r.data.data.map((s: any) => ({ ...s, epic_title: e.title })))),
      );
      return results.flat().filter((s: any) => !s.sprint_id);
    },
    enabled: open && !!epics,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => Promise.all(selected.map((id) => storyService.update(id, { sprint_id: sprintId }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      qc.invalidateQueries({ queryKey: ['all-stories-unassigned', projectId] });
      epics?.forEach((e: any) => qc.invalidateQueries({ queryKey: ['stories', e.id] }));
      toast.success(`${selected.length} backlog(s) added to sprint!`);
      setSelected([]);
      onClose();
    },
    onError: () => toast.error('Failed to add backlog'),
  });

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const PRIORITY_COLOR: Record<string, string> = {
    critical: 'text-danger-text bg-danger-soft',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-success-text bg-success-soft',
  };

  return (
    <Modal open={open} onClose={onClose} title="Select Backlog for Sprint">
      <div className="space-y-3">
        {isLoading && <div className="py-8 text-center text-sm text-text-placeholder">Loading backlogs...</div>}
        {!isLoading && (!allStories || allStories.length === 0) && (
          <div className="py-8 text-center text-sm text-text-placeholder">No backlog items outside of a sprint</div>
        )}
        {allStories && allStories.length > 0 && (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {allStories.map((s: any) => (
              <div
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-3 p-3 rounded-[6px] border-2 cursor-pointer transition-all ${selected.includes(s.id) ? 'border-navy-700 bg-navy-700/4' : 'border-border-subtle hover:border-border'}`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.includes(s.id) ? 'bg-navy-700 border-navy-700' : 'border-border-button'}`}
                >
                  {selected.includes(s.id) && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate">{s.title}</div>
                  <div className="text-xs text-text-placeholder mt-0.5">{s.epic_title}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.story_points && (
                    <span className="text-xs font-semibold text-text-placeholder bg-border-subtle px-2 py-0.5 rounded-lg">
                      {s.story_points} pts
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
        <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
          <span className="text-xs text-text-placeholder">{selected.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[6px] text-sm font-semibold text-text-secondary hover:bg-border-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutate()}
              disabled={isPending || selected.length === 0}
              className="px-5 py-2 rounded-[6px] text-sm font-semibold bg-navy-700 text-white hover:bg-navy-900 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Add (${selected.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SprintCard({ sprint, projectId }: { sprint: any; projectId: string }) {
  const qc = useQueryClient();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
  const [addBacklogOpen, setAddBacklogOpen] = useState(false);

  const startMutation = useMutation({
    mutationFn: () => sprintService.start(projectId, sprint.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success('Sprint started!');
    },
    onError: () => toast.error('Failed to start sprint'),
  });
  const completeMutation = useMutation({
    mutationFn: () => sprintService.complete(projectId, sprint.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success('Sprint completed!');
    },
    onError: () => toast.error('Failed to complete sprint'),
  });

  return (
    <div className="bg-white rounded-[6px] border border-border-subtle p-5 hover:border-navy-700/20 hover:shadow-[0_4px_24px_rgba(40,64,116,0.08)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-navy-800">{sprint.name}</h4>
          <div className="flex items-center gap-1.5 text-xs text-text-placeholder mt-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}
          </div>
        </div>
        <StatusBadge status={sprint.status} />
      </div>
      {sprint.goal && <p className="text-sm text-text-tertiary bg-surface-2 rounded-[6px] px-3 py-2 mb-3">{sprint.goal}</p>}
      {canManage && (
        <div className="flex gap-2 flex-wrap">
          {sprint.status === 'planned' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs bg-navy-700 text-white px-3.5 py-2 rounded-[6px] font-semibold hover:bg-navy-900 transition-all disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>{' '}
              Start Sprint
            </motion.button>
          )}
          {sprint.status === 'active' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs bg-success-text text-white px-3.5 py-2 rounded-[6px] font-semibold hover:bg-success-text transition-all disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>{' '}
              Complete
            </motion.button>
          )}
          {sprint.status !== 'completed' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setAddBacklogOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs border-2 border-border text-text-secondary px-3.5 py-2 rounded-[6px] font-semibold hover:border-navy-700 hover:text-navy-700 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>{' '}
              Add Backlog
            </motion.button>
          )}
          <Link
            href={`/projects/${projectId}/board?sprint_id=${sprint.id}`}
            className="inline-flex items-center gap-1.5 text-xs border-2 border-border text-text-secondary px-3.5 py-2 rounded-[6px] font-semibold hover:border-navy-700 hover:text-navy-700 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>{' '}
            Board
          </Link>
        </div>
      )}
      <AddBacklogToSprintModal open={addBacklogOpen} onClose={() => setAddBacklogOpen(false)} sprintId={sprint.id} projectId={projectId} />
    </div>
  );
}

function FieldWrap({ focused, name, children }: { focused: string | null; name: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-[6px] border-2 transition-all duration-200 ${focused === name ? 'border-navy-700 shadow-[0_0_0_4px_rgba(40,64,116,0.08)]' : 'border-border hover:border-border-button'}`}
    >
      {children}
    </div>
  );
}
const fieldCls = 'w-full px-4 py-3 rounded-[6px] bg-transparent outline-none text-sm text-navy-800 placeholder:text-text-placeholder';

function CreateSprintModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => sprintService.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success('Sprint created!');
      reset();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create sprint'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Create New Sprint">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Sprint Name</label>
          <FieldWrap focused={focused} name="name">
            <input
              {...register('name', { required: true })}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              className={fieldCls}
              placeholder="Sprint 1"
            />
          </FieldWrap>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Sprint Goal</label>
          <FieldWrap focused={focused} name="goal">
            <textarea
              {...register('goal')}
              onFocus={() => setFocused('goal')}
              onBlur={() => setFocused(null)}
              className={`${fieldCls} h-20 resize-none`}
              placeholder="Sprint goal..."
            />
          </FieldWrap>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Start Date</label>
            <FieldWrap focused={focused} name="start">
              <input
                {...register('start_date', { required: true })}
                type="date"
                onFocus={() => setFocused('start')}
                onBlur={() => setFocused(null)}
                className={fieldCls}
              />
            </FieldWrap>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">End Date</label>
            <FieldWrap focused={focused} name="end">
              <input
                {...register('end_date', { required: true })}
                type="date"
                onFocus={() => setFocused('end')}
                onBlur={() => setFocused(null)}
                className={fieldCls}
              />
            </FieldWrap>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[6px] border-2 border-border text-text-secondary font-semibold text-sm hover:bg-surface-2 transition-all"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-navy-700 text-white py-3 rounded-[6px] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-navy-900 transition-all shadow-navy-700/20 disabled:opacity-70"
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Create Sprint'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

function CreateStoryModal({ open, onClose, epicId, projectId }: { open: boolean; onClose: () => void; epicId: string; projectId: string }) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>();
  const [focused, setFocused] = useState<string | null>(null);
  const fw = (f: string) =>
    `rounded-[6px] border-2 transition-all duration-200 ${focused === f ? 'border-navy-700 shadow-[0_0_0_4px_rgba(40,64,116,0.08)]' : 'border-border hover:border-border-button'}`;
  const inp = 'w-full px-4 py-3 bg-transparent outline-none text-sm text-navy-800 placeholder:text-text-placeholder';

  const { data: members } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => projectService.members(projectId).then((r) => r.data.data),
    enabled: open,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => storyService.create(epicId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories', epicId] });
      toast.success('Backlog created!');
      reset();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create backlog'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Add New Backlog">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Backlog Title</label>
          <div className={fw('title')}>
            <input
              {...register('title', { required: true })}
              onFocus={() => setFocused('title')}
              onBlur={() => setFocused(null)}
              className={inp}
              placeholder="Briefly describe the backlog..."
            />
          </div>
          {errors.title && <p className="text-xs text-danger mt-1">Title is required</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Description</label>
          <div className={fw('desc')}>
            <textarea
              {...register('description')}
              onFocus={() => setFocused('desc')}
              onBlur={() => setFocused(null)}
              className={`${inp} h-20 resize-none`}
              placeholder="Additional details about this backlog..."
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Priority</label>
            <div className={fw('priority')}>
              <select {...register('priority')} onFocus={() => setFocused('priority')} onBlur={() => setFocused(null)} className={inp}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Type</label>
            <div className={fw('type')}>
              <select {...register('type')} onFocus={() => setFocused('type')} onBlur={() => setFocused(null)} className={inp}>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="task">Task</option>
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Story Points</label>
            <div className={fw('points')}>
              <input
                type="number"
                {...register('story_points')}
                onFocus={() => setFocused('points')}
                onBlur={() => setFocused(null)}
                className={inp}
                placeholder="0"
                min={1}
                max={100}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Estimated (Hours)</label>
            <div className={fw('hours')}>
              <input
                type="number"
                {...register('estimated_hours')}
                onFocus={() => setFocused('hours')}
                onBlur={() => setFocused(null)}
                className={inp}
                placeholder="0"
                min={1}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Due Date</label>
          <div className={fw('due')}>
            <input
              type="date"
              {...register('due_date')}
              onFocus={() => setFocused('due')}
              onBlur={() => setFocused(null)}
              className={inp}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-2 rounded-[6px] text-sm font-semibold text-text-secondary hover:bg-border-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 rounded-[6px] text-sm font-semibold bg-navy-700 text-white hover:bg-navy-900 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Add Backlog'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EpicCard({ epic: e, canManage, onAddStory }: { epic: any; canManage: boolean; onAddStory: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: stories } = useQuery({
    queryKey: ['stories', e.id],
    queryFn: () => storyService.list(e.id).then((r) => r.data.data),
    enabled: expanded,
  });
  const PRIORITY_DOT: Record<string, string> = {
    critical: 'bg-danger',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    low: 'bg-success',
  };
  return (
    <div className="bg-white rounded-[6px] border border-border-subtle hover:border-navy-700/20 hover:shadow-[0_4px_20px_rgba(40,64,116,0.08)] transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-[6px] flex items-center justify-center flex-shrink-0"
              style={{ background: e.color ? `${e.color}20` : '#14406a20' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={e.color || '#14406a'} strokeWidth="2" className="w-4 h-4">
                <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-navy-800">{e.title}</div>
              {e.description && <div className="text-sm text-text-placeholder mt-0.5">{e.description}</div>}
              {(e.start_date || e.end_date) && (
                <div className="text-xs text-text-placeholder mt-1 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatDate(e.start_date)} – {formatDate(e.end_date)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {e.color && <div className="w-4 h-4 rounded-full border-2 border-white " style={{ background: e.color }} />}
            <StatusBadge status={e.status || 'todo'} />
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors text-text-placeholder"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border-subtle px-5 pb-4 pt-3 space-y-2">
          {stories && stories.length > 0 ? (
            stories.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-3 py-2 px-3 rounded-[6px] bg-surface-2 hover:bg-border-subtle transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[s.priority] || 'bg-border-button'}`} />
                <span className="text-sm text-text-secondary flex-1">{s.title}</span>
                {s.story_points && (
                  <span className="text-xs font-semibold text-text-placeholder bg-white border border-border px-2 py-0.5 rounded-lg">
                    {s.story_points} pts
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${s.sprint_id ? 'bg-navy-700/10 text-navy-700' : 'bg-border text-text-tertiary'}`}
                >
                  {s.sprint_id ? 'In sprint' : 'Backlog'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-text-placeholder text-center py-3">No backlog yet</p>
          )}
          {canManage && (
            <button
              onClick={onAddStory}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-[6px] border-2 border-dashed border-border hover:border-navy-700/40 hover:bg-navy-700/4 text-text-placeholder hover:text-navy-700 text-xs font-semibold transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Backlog
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CreateEpicModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: '', description: '', color: '#14406a', status: 'active', start_date: '', end_date: '' },
  });
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => epicService.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics', projectId] });
      toast.success('Epic created!');
      reset();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create epic'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Create New Epic">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Epic Title</label>
          <FieldWrap focused={focused} name="title">
            <input
              {...register('title', { required: true })}
              onFocus={() => setFocused('title')}
              onBlur={() => setFocused(null)}
              className={fieldCls}
              placeholder="Epic name..."
            />
          </FieldWrap>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Description</label>
          <FieldWrap focused={focused} name="desc">
            <textarea
              {...register('description')}
              onFocus={() => setFocused('desc')}
              onBlur={() => setFocused(null)}
              className={`${fieldCls} h-20 resize-none`}
              placeholder="Epic description..."
            />
          </FieldWrap>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Color</label>
            <FieldWrap focused={focused} name="color">
              <div className="flex items-center gap-2 px-4 py-2">
                <input {...register('color')} type="color" className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                <input
                  {...register('color')}
                  onFocus={() => setFocused('color')}
                  onBlur={() => setFocused(null)}
                  className="flex-1 bg-transparent outline-none text-sm text-text-secondary"
                  placeholder="#14406a"
                />
              </div>
            </FieldWrap>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Status</label>
            <FieldWrap focused={focused} name="status">
              <select {...register('status')} onFocus={() => setFocused('status')} onBlur={() => setFocused(null)} className={fieldCls}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </FieldWrap>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Start Date</label>
            <FieldWrap focused={focused} name="start">
              <input
                {...register('start_date')}
                type="date"
                onFocus={() => setFocused('start')}
                onBlur={() => setFocused(null)}
                className={fieldCls}
              />
            </FieldWrap>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">End Date</label>
            <FieldWrap focused={focused} name="end">
              <input
                {...register('end_date')}
                type="date"
                onFocus={() => setFocused('end')}
                onBlur={() => setFocused(null)}
                className={fieldCls}
              />
            </FieldWrap>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[6px] border-2 border-border text-text-secondary font-semibold text-sm hover:bg-surface-2 transition-all"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-navy-700 text-white py-3 rounded-[6px] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-navy-900 transition-all shadow-navy-700/20 disabled:opacity-70"
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Create Epic'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberModal({
  open,
  onClose,
  projectId,
  existingMembers,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  existingMembers: any[];
}) {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, watch } = useForm();

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/api/v1/users').then((r) => r.data.data?.data || r.data.data || []),
    enabled: open,
  });

  const existingIds = new Set(existingMembers?.map((m: any) => m.user_id || m.id));
  const filtered = (allUsers || []).filter(
    (u: any) =>
      !existingIds.has(u.id) &&
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())),
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => projectService.addMember(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', projectId] });
      toast.success('Member added!');
      reset();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add member'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Member">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Search User</label>
          <div className="rounded-[6px] border-2 border-border hover:border-border-button transition-all">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className={fieldCls} placeholder="Nama atau email..." />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Select User</label>
          <FieldWrap focused={focused} name="user">
            <select
              {...register('user_id', { required: true })}
              onFocus={() => setFocused('user')}
              onBlur={() => setFocused(null)}
              className={fieldCls}
            >
              {filtered.length === 0 && <option disabled>No users available</option>}
              {filtered.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} - {u.email}
                </option>
              ))}
            </select>
          </FieldWrap>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Project Role</label>
          <FieldWrap focused={focused} name="role">
            <select
              {...register('role', { required: true })}
              onFocus={() => setFocused('role')}
              onBlur={() => setFocused(null)}
              className={fieldCls}
            >
              <option value="member">Member</option>
              <option value="scrum_master">Scrum Master</option>
              <option value="manager">Manager</option>
            </select>
          </FieldWrap>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[6px] border-2 border-border text-text-secondary font-semibold text-sm hover:bg-surface-2 transition-all"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-navy-700 text-white py-3 rounded-[6px] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-navy-900 transition-all shadow-navy-700/20 disabled:opacity-70"
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Add Member'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState('overview');
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [createStoryEpicId, setCreateStoryEpicId] = useState<string | null>(null);
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);
  const canAdmin = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager']);

  const {
    data: project,
    isLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.show(id).then((r) => r.data.data),
    retry: (count, err: any) => {
      const st = err?.response?.status;
      if (st === 403 || st === 404) return false;
      return count < 2;
    },
  });
  const { data: sprints } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => sprintService.list(id).then((r) => r.data.data),
    enabled: tab === 'sprints' || tab === 'overview',
  });
  const { data: epics } = useQuery({
    queryKey: ['epics', id],
    queryFn: () => epicService.list(id).then((r) => r.data.data),
    enabled: tab === 'epics' || tab === 'overview',
  });
  const { data: members } = useQuery({
    queryKey: ['members', id],
    queryFn: () => projectService.members(id).then((r) => r.data.data),
    enabled: tab === 'members' || tab === 'overview',
  });

  if (isLoading)
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );

  const errStatus = (projectError as any)?.response?.status;
  if (errStatus === 403 || errStatus === 404 || (!isLoading && !project)) {
    const denied = errStatus === 403;
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="w-14 h-14 rounded-[6px] bg-border-subtle flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" className="w-7 h-7">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-navy-800 mb-1.5">{denied ? 'Access Denied' : 'Project Not Found'}</h2>
          <p className="text-sm text-text-placeholder mb-6">
            {denied
              ? 'You are not a member of this project. Contact the Project Manager if you believe you should have access.'
              : 'The project you are looking for is not available or has been deleted.'}
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all"
          >
            Back to Projects
          </Link>
        </div>
      </AppLayout>
    );
  }

  const activeSprints = sprints?.filter((s: any) => s.status === 'active') || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-text-placeholder hover:text-navy-700 transition-colors mb-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Projects
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[6px] bg-navy-700/8 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#14406a" strokeWidth="2" className="w-6 h-6">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">{project?.name}</h1>
                  <StatusBadge status={project?.status} />
                </div>
                {project?.description && <p className="text-sm text-text-placeholder max-w-xl">{project.description}</p>}
              </div>
            </div>
            <Link
              href={`/projects/${id}/board`}
              className="inline-flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all shadow-navy-700/20 hover:-translate-y-0.5 flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>{' '}
              Open Board
            </Link>
          </div>
        </div>

        <div className="flex gap-1 bg-border-subtle p-1 rounded-[6px] w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-semibold transition-all whitespace-nowrap ${tab === t.id ? 'bg-white text-navy-700 ' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-[6px] border border-border-subtle p-5 ">
                    <h3 className="font-semibold text-navy-800 mb-4">Project Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { k: 'Division', v: project?.division || '—' },
                        { k: 'Status', v: <StatusBadge status={project?.status} /> },
                        { k: 'Start', v: formatDate(project?.start_date) },
                        { k: 'End', v: formatDate(project?.end_date) },
                      ].map(({ k, v }) => (
                        <div key={k} className="bg-surface-2 rounded-[6px] px-4 py-3">
                          <div className="text-xs text-text-placeholder mb-1">{k}</div>
                          <div className="text-sm font-semibold text-text-secondary">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-[6px] border border-border-subtle p-5 ">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-navy-800">Active Sprint</h3>
                      <Link
                        href={`/projects/${id}/board`}
                        className="text-xs font-semibold text-navy-700 flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Open Board{' '}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                    {activeSprints.length > 0 ? (
                      <div className="space-y-3">
                        {activeSprints.map((s: any) => (
                          <SprintCard key={s.id} sprint={s} projectId={id} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-border-button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mb-2">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm">No active sprint</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-[6px] border border-border-subtle p-5 ">
                    <h3 className="font-semibold text-navy-800 mb-3">Summary</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 border-b border-surface-2">
                        <span className="text-sm text-text-tertiary">Total Sprints</span>
                        <span className="text-sm font-bold text-navy-800">{sprints?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-surface-2">
                        <span className="text-sm text-text-tertiary">Total Epics</span>
                        <span className="text-sm font-bold text-navy-800">{epics?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-text-tertiary">Total Members</span>
                        <span className="text-sm font-bold text-navy-800">{members?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-[6px] border border-border-subtle p-5 ">
                    <h3 className="font-semibold text-navy-800 mb-3">All Sprints</h3>
                    <div className="space-y-2">
                      {sprints?.slice(0, 4).map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-surface-2 last:border-0">
                          <span className="text-sm text-text-secondary font-medium">{s.name}</span>
                          <StatusBadge status={s.status} />
                        </div>
                      ))}
                      {(!sprints || sprints.length === 0) && (
                        <div className="text-xs text-text-placeholder text-center py-3">No sprints yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'sprints' && (
              <div>
                {canManage && (
                  <div className="flex justify-end mb-4">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setCreateSprintOpen(true)}
                      className="inline-flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all shadow-navy-700/20"
                    >
                      + Create Sprint
                    </motion.button>
                  </div>
                )}
                <div className="space-y-3">
                  {sprints?.map((s: any) => (
                    <SprintCard key={s.id} sprint={s} projectId={id} />
                  ))}
                  {(!sprints || sprints.length === 0) && (
                    <div className="bg-white rounded-[6px] border border-border-subtle flex flex-col items-center justify-center py-16 text-border-button">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-3">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-medium">No sprints yet</span>
                      {canManage && (
                        <button
                          onClick={() => setCreateSprintOpen(true)}
                          className="mt-3 text-xs text-navy-700 font-semibold hover:underline"
                        >
                          + Create first sprint
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <CreateSprintModal open={createSprintOpen} onClose={() => setCreateSprintOpen(false)} projectId={id} />
              </div>
            )}

            {tab === 'epics' && (
              <div>
                {canAdmin && (
                  <div className="flex justify-end mb-4">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setCreateEpicOpen(true)}
                      className="inline-flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all shadow-navy-700/20"
                    >
                      + Create Epic
                    </motion.button>
                  </div>
                )}
                <div className="space-y-3">
                  {epics?.map((e: any) => (
                    <EpicCard key={e.id} epic={e} canManage={canManage} onAddStory={() => setCreateStoryEpicId(e.id)} />
                  ))}
                  {(!epics || epics.length === 0) && (
                    <div className="bg-white rounded-[6px] border border-border-subtle flex flex-col items-center justify-center py-16 text-border-button">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-3">
                        <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                      <span className="text-sm font-medium">No epics yet</span>
                      {canAdmin && (
                        <button
                          onClick={() => setCreateEpicOpen(true)}
                          className="mt-3 text-xs text-navy-700 font-semibold hover:underline"
                        >
                          + Create first epic
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <CreateEpicModal open={createEpicOpen} onClose={() => setCreateEpicOpen(false)} projectId={id} />
                <CreateStoryModal
                  open={!!createStoryEpicId}
                  onClose={() => setCreateStoryEpicId(null)}
                  epicId={createStoryEpicId || ''}
                  projectId={id}
                />
              </div>
            )}

            {tab === 'members' && (
              <div>
                {canAdmin && (
                  <div className="flex justify-end mb-4">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAddMemberOpen(true)}
                      className="inline-flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all shadow-navy-700/20"
                    >
                      + Add Member
                    </motion.button>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members?.map((m: any) => {
                    const name = m.full_name || m.user?.full_name || 'User';
                    const initials = name
                      .trim()
                      .split(' ')
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join('')
                      .toUpperCase();
                    const ROLE_LABELS: Record<string, string> = { manager: 'Manager', scrum_master: 'Scrum Master', member: 'Member' };
                    return (
                      <div
                        key={m.user_id || m.id}
                        className="bg-white rounded-[6px] border border-border-subtle p-4 flex items-center gap-3 hover:border-navy-700/20 hover:shadow-[0_4px_20px_rgba(40,64,116,0.08)] transition-all"
                      >
                        <div className="w-11 h-11 rounded-[6px] bg-navy-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-navy-800 text-sm truncate">{name}</div>
                          <div className="text-xs text-text-placeholder mt-0.5">{m.division || '—'}</div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-700/8 text-navy-700 flex-shrink-0">
                          {ROLE_LABELS[m.role] || m.role || 'Member'}
                        </span>
                      </div>
                    );
                  })}
                  {(!members || members.length === 0) && (
                    <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-[6px] border border-border-subtle flex flex-col items-center justify-center py-16 text-border-button">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-3">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">No members yet</span>
                      {canAdmin && (
                        <button onClick={() => setAddMemberOpen(true)} className="mt-3 text-xs text-navy-700 font-semibold hover:underline">
                          + Add first member
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <AddMemberModal
                  open={addMemberOpen}
                  onClose={() => setAddMemberOpen(false)}
                  projectId={id}
                  existingMembers={members || []}
                />
              </div>
            )}

            {tab === 'board' && (
              <div className="bg-white rounded-[6px] border border-border-subtle flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-navy-700/8 rounded-[6px] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#14406a" strokeWidth="1.5" strokeOpacity="0.4" className="w-7 h-7">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text-secondary mb-1">Open Kanban Board</h3>
                <p className="text-sm text-text-placeholder mb-5">Manage tasks with drag and drop</p>
                <Link
                  href={`/projects/${id}/board`}
                  className="inline-flex items-center gap-2 bg-navy-700 text-white px-5 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all shadow-navy-700/20"
                >
                  Open Board
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
