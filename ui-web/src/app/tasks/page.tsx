'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, AlertTriangle, Activity, Clock, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { taskService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';

const dict = {
  en: {
    pageTitle: 'Tasks',
    subtitle: '{all} task{plural} · {inPrg} in progress · {over} overdue',
    statusTodo: 'To do',
    statusInProgress: 'In progress',
    statusInReview: 'In review',
    statusDone: 'Done',
    statusOverdue: 'Overdue',
    priorityCritical: 'Critical',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    tabAll: 'All',
    tabMine: 'Mine',
    tabOverdue: 'Overdue',
    tabDueToday: 'Due today',
    tabDone: 'Done',
    openTasks: 'Open Tasks',
    notDoneYet: 'not done yet',
    inProgress: 'In Progress',
    beingWorkedOn: 'being worked on',
    overdueStat: 'Overdue',
    oldest2Days: 'oldest 2 days',
    completed: 'Completed',
    thisSprint: 'this sprint',
    searchTasks: 'Search tasks',
    colTask: 'TASK',
    colAssignee: 'ASSIGNEE',
    colPriority: 'PRIORITY',
    colStatus: 'STATUS',
    colProgress: 'PROGRESS',
    colDue: 'DUE',
    noTasksFound: 'No tasks found',
    noOverdueTasks: 'No overdue tasks',
    noTasksAssigned: 'No tasks assigned to you',
    noTasksMatch: 'No tasks match your filter',
    overdueDays: 'Overdue {days}d',
  },
  id: {
    pageTitle: 'Tugas',
    subtitle: '{all} tugas · {inPrg} sedang berjalan · {over} terlambat',
    statusTodo: 'Belum dimulai',
    statusInProgress: 'Sedang berjalan',
    statusInReview: 'Ditinjau',
    statusDone: 'Selesai',
    statusOverdue: 'Terlambat',
    priorityCritical: 'Kritis',
    priorityHigh: 'Tinggi',
    priorityMedium: 'Sedang',
    priorityLow: 'Rendah',
    tabAll: 'Semua',
    tabMine: 'Saya',
    tabOverdue: 'Terlambat',
    tabDueToday: 'Jatuh tempo hari ini',
    tabDone: 'Selesai',
    openTasks: 'Tugas Terbuka',
    notDoneYet: 'belum selesai',
    inProgress: 'Sedang Berjalan',
    beingWorkedOn: 'sedang dikerjakan',
    overdueStat: 'Terlambat',
    oldest2Days: 'tertua 2 hari',
    completed: 'Selesai',
    thisSprint: 'sprint ini',
    searchTasks: 'Cari tugas',
    colTask: 'TUGAS',
    colAssignee: 'PENANGGUNG JAWAB',
    colPriority: 'PRIORITAS',
    colStatus: 'STATUS',
    colProgress: 'PROGRES',
    colDue: 'JATUH TEMPO',
    noTasksFound: 'Tidak ada tugas ditemukan',
    noOverdueTasks: 'Tidak ada tugas terlambat',
    noTasksAssigned: 'Tidak ada tugas yang ditugaskan kepada Anda',
    noTasksMatch: 'Tidak ada tugas yang cocok dengan filter Anda',
    overdueDays: 'Terlambat {days}h',
  },
};

const STATUS_CFG: Record<string, { labelKey: string; bg: string; color: string; dot: string; bar: string }> = {
  todo: { labelKey: 'statusTodo', bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98', bar: '#8a8f98' },
  in_progress: { labelKey: 'statusInProgress', bg: '#eaf1f8', color: '#14406a', dot: '#14406a', bar: '#14406a' },
  review: { labelKey: 'statusInReview', bg: '#eaf1f8', color: '#14406a', dot: '#14406a', bar: '#14406a' },
  done: { labelKey: 'statusDone', bg: '#e9f4ee', color: '#0f6144', dot: '#137a52', bar: '#137a52' },
  overdue: { labelKey: 'statusOverdue', bg: '#fdeceb', color: '#a3231c', dot: '#b3261e', bar: '#b3261e' },
};

const PRIORITY_CFG: Record<string, { labelKey: string; bg: string; color: string }> = {
  critical: { labelKey: 'priorityCritical', bg: '#fdeceb', color: '#a3231c' },
  high: { labelKey: 'priorityHigh', bg: '#fdeceb', color: '#a3231c' },
  medium: { labelKey: 'priorityMedium', bg: '#fbf3e0', color: '#8a6209' },
  low: { labelKey: 'priorityLow', bg: '#f1f0ed', color: '#5c6470' },
};

type TabFilter = 'all' | 'mine' | 'overdue' | 'due_today' | 'done';

const TABS: { id: TabFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'tabAll' },
  { id: 'mine', labelKey: 'tabMine' },
  { id: 'overdue', labelKey: 'tabOverdue' },
  { id: 'due_today', labelKey: 'tabDueToday' },
  { id: 'done', labelKey: 'tabDone' },
];

function fmtDue(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function overdueDays(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return diff;
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

export default function TasksPage() {
  const t = useT(dict);
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabFilter>('mine');
  const [search, setSearch] = useState('');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', tab, user?.id],
    queryFn: () => {
      const params: any = {};
      if (tab === 'mine' && user?.id) params.assignee_id = user.id;
      if (tab === 'done') params.status = 'done';
      return taskService.list(params).then((r) => r.data.data);
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    let list = (tasks || []) as any[];
    if (search) list = list.filter((t: any) => t.title?.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'overdue') list = list.filter((t: any) => t.due_date && new Date(t.due_date) < today && t.status !== 'done');
    if (tab === 'due_today')
      list = list.filter((t: any) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    return list;
  }, [tasks, search, tab, today]);

  const all = tasks?.length || 0;
  const done = (tasks || []).filter((t: any) => t.status === 'done').length;
  const inPrg = (tasks || []).filter((t: any) => t.status === 'in_progress').length;
  const over = (tasks || []).filter((t: any) => t.due_date && new Date(t.due_date) < today && t.status !== 'done').length;

  return (
    <AppLayout>
      <PageHeader
        section="WORK"
        title={t('pageTitle')}
        subtitle={t('subtitle', { all, plural: all !== 1 ? 's' : '', inPrg, over })}
      />

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          index={0}
          title={t('openTasks')}
          value={all - done}
          subtitle={t('notDoneYet')}
          icon={CheckSquare}
          color="brand"
          progress={all > 0 ? Math.round(((all - done) / all) * 100) : 0}
        />
        <StatCard
          index={1}
          title={t('inProgress')}
          value={inPrg}
          subtitle={t('beingWorkedOn')}
          icon={Activity}
          color="brand"
          progress={all > 0 ? Math.round((inPrg / all) * 100) : 0}
        />
        <StatCard
          index={2}
          title={t('overdueStat')}
          value={over}
          subtitle={t('oldest2Days')}
          icon={AlertTriangle}
          color="red"
          progress={all > 0 ? Math.round((over / all) * 100) : 0}
        />
        <StatCard
          index={3}
          title={t('completed')}
          value={done}
          subtitle={t('thisSprint')}
          icon={Clock}
          color="green"
          progress={all > 0 ? Math.round((done / all) * 100) : 0}
        />
      </div>

      {/* Task list card */}
      <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
        {/* Controls */}
        <div className="flex items-center px-[15px] py-[9px] gap-[10px] border-b border-border-subtle flex-wrap">
          {/* View tabs */}
          <div className="flex gap-[5px]">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className="h-[26px] px-[10px] rounded-[4px] text-[11.5px] transition-colors"
                style={
                  tab === tabItem.id ? { background: '#14406a', color: '#fff', fontWeight: 600 } : { color: '#6b7280', fontWeight: 500 }
                }
              >
                {t(tabItem.labelKey)}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-[20px] bg-border-subtle flex-none" />

          {/* Search */}
          <div className="flex items-center gap-[6px] h-[30px] px-[10px] border border-border-input rounded-[6px] w-[200px]">
            <svg
              className="w-[11px] h-[11px] text-text-placeholder flex-none"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5L14 14" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[11.5px] text-navy-800 placeholder:text-text-placeholder focus:outline-none"
              placeholder={t('searchTasks')}
            />
          </div>
        </div>

        {/* Table header */}
        <div
          className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
          style={{ gridTemplateColumns: '1fr 128px 110px 96px 96px 80px' }}
        >
          {[t('colTask'), t('colAssignee'), t('colPriority'), t('colStatus'), t('colProgress'), t('colDue')].map((h, i) => (
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
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={CheckSquare}
              title={t('noTasksFound')}
              subtitle={tab === 'overdue' ? t('noOverdueTasks') : tab === 'mine' ? t('noTasksAssigned') : t('noTasksMatch')}
            />
          </div>
        ) : (
          filtered.map((task: any, i: number) => {
            const isOverdue = task.due_date && new Date(task.due_date) < today && task.status !== 'done';
            const daysOver = isOverdue ? overdueDays(task.due_date) : 0;
            const statusKey = isOverdue && task.status !== 'done' ? 'overdue' : task.status;
            const statusCfg = STATUS_CFG[statusKey] ?? STATUS_CFG.todo;
            const priCfg = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium;
            const progress =
              task.estimated_hours > 0 ? Math.min(100, Math.round(((task.actual_hours || 0) / task.estimated_hours) * 100)) : null;
            const assigneeName = task.assignee_name || task.assigned_to_name || '';

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid px-[15px] h-[40px] items-center border-b border-border-subtle last:border-b-0 hover:bg-surface-2 transition-colors"
                style={{
                  gridTemplateColumns: '1fr 128px 110px 96px 96px 80px',
                  ...(isOverdue && { boxShadow: 'inset 2px 0 0 #b3261e', background: '#fffbfb' }),
                }}
              >
                {/* Task title */}
                <div className="flex flex-col gap-[1px] min-w-0">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-[12.5px] font-semibold text-navy-800 hover:text-navy-700 transition-colors truncate"
                  >
                    {task.title}
                  </Link>
                  <div className="font-mono text-[10px] text-text-placeholder truncate">
                    {[task.project_code || task.project_name, task.sprint_name].filter(Boolean).join(' · ')}
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-[7px]">
                  {assigneeName ? (
                    <>
                      <div className="w-[22px] h-[22px] rounded-full bg-info-soft text-navy-700 flex items-center justify-center font-mono text-[9.5px] font-bold flex-none">
                        {initials(assigneeName)}
                      </div>
                      <span className="text-[12px] text-text-secondary truncate">{assigneeName}</span>
                    </>
                  ) : (
                    <span className="text-[11px] text-text-meta">—</span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  {task.priority ? (
                    <span
                      className="inline-flex items-center h-[20px] px-[7px] rounded-[3px] text-[10.5px] font-semibold"
                      style={{ background: priCfg.bg, color: priCfg.color }}
                    >
                      {t(priCfg.labelKey)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-text-meta">—</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <span
                    className="inline-flex items-center gap-[5px] h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full flex-none" style={{ background: statusCfg.dot }} />
                    {t(statusCfg.labelKey)}
                  </span>
                </div>

                {/* Progress */}
                <div>
                  {progress !== null ? (
                    <div className="flex items-center gap-[7px]">
                      <div className="flex-1 h-[4px] rounded-[2px] bg-border-subtle overflow-hidden">
                        <div className="h-full rounded-[2px]" style={{ width: `${progress}%`, background: statusCfg.bar }} />
                      </div>
                      <span className="font-mono text-[10.5px] text-text-tertiary w-[22px] text-right">{progress}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-text-meta">—</span>
                  )}
                </div>

                {/* Due date */}
                <div className="text-right">
                  {task.due_date ? (
                    <span className="font-mono text-[11px]" style={{ color: isOverdue ? '#b3261e' : '#4b5563' }}>
                      {isOverdue ? t('overdueDays', { days: daysOver }) : fmtDue(task.due_date)}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-text-meta">—</span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
