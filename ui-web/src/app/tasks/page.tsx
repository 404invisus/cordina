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

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string; bar: string }> = {
  todo:        { label: 'To do',       bg: '#f1f0ed', color: '#5c6470', dot: '#8a8f98', bar: '#8a8f98' },
  in_progress: { label: 'In progress', bg: '#eaf1f8', color: '#14406a', dot: '#14406a', bar: '#14406a' },
  review:      { label: 'In review',   bg: '#f3f0ff', color: '#5b21b6', dot: '#7c3aed', bar: '#7c3aed' },
  done:        { label: 'Done',        bg: '#e9f4ee', color: '#0f6144', dot: '#137a52', bar: '#137a52' },
  overdue:     { label: 'Overdue',     bg: '#fdeceb', color: '#a3231c', dot: '#b3261e', bar: '#b3261e' },
};

const PRIORITY_CFG: Record<string, { label: string; bg: string; color: string }> = {
  critical: { label: 'Critical', bg: '#fdeceb', color: '#a3231c' },
  high:     { label: 'High',     bg: '#fdeceb', color: '#a3231c' },
  medium:   { label: 'Medium',   bg: '#fbf3e0', color: '#8a6209' },
  low:      { label: 'Low',      bg: '#f1f0ed', color: '#5c6470' },
};

type TabFilter = 'all' | 'mine' | 'overdue' | 'due_today' | 'done';

const TABS: { id: TabFilter; label: string }[] = [
  { id: 'all',       label: 'All'       },
  { id: 'mine',      label: 'Mine'      },
  { id: 'overdue',   label: 'Overdue'   },
  { id: 'due_today', label: 'Due today' },
  { id: 'done',      label: 'Done'      },
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
  return (name || 'U').split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabFilter>('mine');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', tab, user?.id],
    queryFn: () => {
      const params: any = {};
      if (tab === 'mine' && user?.id) params.assignee_id = user.id;
      if (tab === 'done') params.status = 'done';
      return taskService.list(params).then(r => r.data.data);
    },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    let list = (tasks || []) as any[];
    if (search) list = list.filter((t: any) => t.title?.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'overdue') list = list.filter((t: any) => t.due_date && new Date(t.due_date) < today && t.status !== 'done');
    if (tab === 'due_today') list = list.filter((t: any) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    return list;
  }, [tasks, search, tab, today]);

  const all   = tasks?.length || 0;
  const done  = (tasks || []).filter((t: any) => t.status === 'done').length;
  const inPrg = (tasks || []).filter((t: any) => t.status === 'in_progress').length;
  const over  = (tasks || []).filter((t: any) => t.due_date && new Date(t.due_date) < today && t.status !== 'done').length;

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const allChecked = filtered.length > 0 && filtered.every((t: any) => selected.has(t.id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((t: any) => t.id)));
  };

  return (
    <AppLayout>
      <PageHeader
        section="WORK"
        title="Tasks"
        subtitle={`${all} task${all !== 1 ? 's' : ''} · ${inPrg} in progress · ${over} overdue`}
      />

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard index={0} title="Open Tasks"  value={all - done} subtitle="not done yet"    icon={CheckSquare}  color="brand" progress={all > 0 ? Math.round(((all - done) / all) * 100) : 0} />
        <StatCard index={1} title="In Progress" value={inPrg}      subtitle="being worked on" icon={Activity}     color="brand" progress={all > 0 ? Math.round((inPrg / all) * 100) : 0} />
        <StatCard index={2} title="Overdue"     value={over}       subtitle="oldest 2 days"    icon={AlertTriangle} color="red"  progress={all > 0 ? Math.round((over / all) * 100) : 0} />
        <StatCard index={3} title="Completed"   value={done}       subtitle="this sprint"      icon={Clock}        color="green" progress={all > 0 ? Math.round((done / all) * 100) : 0} />
      </div>

      {/* Task list card */}
      <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
        {/* Controls */}
        <div className="flex items-center px-[15px] py-[9px] gap-[10px] border-b border-[#eceae4] flex-wrap">
          {/* View tabs */}
          <div className="flex gap-[5px]">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected(new Set()); }}
                className="h-[26px] px-[10px] rounded-[4px] text-[11.5px] transition-colors"
                style={tab === t.id
                  ? { background: '#14406a', color: '#fff', fontWeight: 600 }
                  : { color: '#6b7280', fontWeight: 500 }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-[20px] bg-[#eceae4] flex-none" />

          {/* Search */}
          <div className="flex items-center gap-[6px] h-[30px] px-[10px] border border-[#e2e0da] rounded-[6px] w-[200px]">
            <svg className="w-[11px] h-[11px] text-[#9ca3af] flex-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[11.5px] text-[#12283c] placeholder:text-[#9ca3af] focus:outline-none"
              placeholder="Search tasks" />
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <>
              <span className="ml-auto text-[11.5px] font-medium text-[#8a8f98]">{selected.size} selected</span>
              <button className="h-[34px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
                Reassign
              </button>
              <button className="h-[34px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
                Change sprint
              </button>
            </>
          )}
        </div>

        {/* Table header */}
        <div className="grid px-[15px] h-[30px] items-center border-b border-[#eceae4] bg-[#faf9f7]"
          style={{ gridTemplateColumns: '26px 1fr 128px 110px 96px 96px 80px' }}>
          <div>
            <input type="checkbox" checked={allChecked} onChange={toggleAll}
              className="w-[13px] h-[13px] rounded-[2px] accent-brand cursor-pointer" />
          </div>
          {['TASK', 'ASSIGNEE', 'PRIORITY', 'STATUS', 'PROGRESS', 'DUE'].map((h, i) => (
            <div key={h} className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]"
              style={i === 5 ? { textAlign: 'right' } : {}}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10">
            <EmptyState icon={CheckSquare} title="No tasks found"
              subtitle={tab === 'overdue' ? 'No overdue tasks' : tab === 'mine' ? 'No tasks assigned to you' : 'No tasks match your filter'} />
          </div>
        ) : (
          filtered.map((t: any, i: number) => {
            const isOverdue = t.due_date && new Date(t.due_date) < today && t.status !== 'done';
            const daysOver  = isOverdue ? overdueDays(t.due_date) : 0;
            const statusKey = isOverdue && t.status !== 'done' ? 'overdue' : t.status;
            const statusCfg = STATUS_CFG[statusKey] ?? STATUS_CFG.todo;
            const priCfg    = PRIORITY_CFG[t.priority] ?? PRIORITY_CFG.medium;
            const progress  = t.estimated_hours > 0
              ? Math.min(100, Math.round(((t.actual_hours || 0) / t.estimated_hours) * 100))
              : null;
            const assigneeName = t.assignee_name || t.assigned_to_name || '';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid px-[15px] h-[40px] items-center border-b border-[#f2f0ec] last:border-b-0 hover:bg-[#faf9f7] transition-colors"
                style={{
                  gridTemplateColumns: '26px 1fr 128px 110px 96px 96px 80px',
                  ...(isOverdue && { boxShadow: 'inset 2px 0 0 #b3261e', background: '#fffbfb' }),
                }}
              >
                {/* Checkbox */}
                <div onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
                    className="w-[13px] h-[13px] rounded-[3px] border border-[#d9d6cf] accent-brand cursor-pointer" />
                </div>

                {/* Task title */}
                <div className="flex flex-col gap-[1px] min-w-0">
                  <Link href={`/tasks/${t.id}`}
                    className="text-[12.5px] font-semibold text-[#12283c] hover:text-brand transition-colors truncate">
                    {t.title}
                  </Link>
                  <div className="font-mono text-[10px] text-[#9ca3af] truncate">
                    {[t.project_code || t.project_name, t.sprint_name].filter(Boolean).join(' · ')}
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-[7px]">
                  {assigneeName ? (
                    <>
                      <div className="w-[22px] h-[22px] rounded-full bg-[#eaf1f8] text-[#14406a] flex items-center justify-center font-mono text-[9.5px] font-bold flex-none">
                        {initials(assigneeName)}
                      </div>
                      <span className="text-[12px] text-[#4b5563] truncate">{assigneeName}</span>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#c0bcb4]">—</span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  {t.priority ? (
                    <span className="inline-flex items-center h-[20px] px-[7px] rounded-[3px] text-[10.5px] font-semibold"
                      style={{ background: priCfg.bg, color: priCfg.color }}>
                      {priCfg.label}
                    </span>
                  ) : <span className="text-[11px] text-[#c0bcb4]">—</span>}
                </div>

                {/* Status */}
                <div>
                  <span className="inline-flex items-center gap-[5px] h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}>
                    <span className="w-[5px] h-[5px] rounded-full flex-none" style={{ background: statusCfg.dot }} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Progress */}
                <div>
                  {progress !== null ? (
                    <div className="flex items-center gap-[7px]">
                      <div className="flex-1 h-[4px] rounded-[2px] bg-[#eceae4] overflow-hidden">
                        <div className="h-full rounded-[2px]"
                          style={{ width: `${progress}%`, background: statusCfg.bar }} />
                      </div>
                      <span className="font-mono text-[10.5px] text-[#6b7280] w-[22px] text-right">{progress}</span>
                    </div>
                  ) : <span className="text-[11px] text-[#c0bcb4]">—</span>}
                </div>

                {/* Due date */}
                <div className="text-right">
                  {t.due_date ? (
                    <span className="font-mono text-[11px]"
                      style={{ color: isOverdue ? '#b3261e' : '#4b5563' }}>
                      {isOverdue ? `Overdue ${daysOver}d` : fmtDue(t.due_date)}
                    </span>
                  ) : <span className="font-mono text-[11px] text-[#c0bcb4]">—</span>}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
