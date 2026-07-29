'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, AlertTriangle, Clock, FolderKanban, CheckSquare, GitMerge, Calendar, User } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { dailyBriefService, calendarService, changeRequestService, taskService } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDayDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** A CR is "my turn" when I'm the approver at the current step and it's still pending. */
function isMyTurn(cr: any, userId: string): boolean {
  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;
  const myApproval = approvals.find((a: any) => a.approver_id === userId && a.order === currentStep && a.status === 'pending');
  return !!myApproval && cr.status === 'submitted';
}

type ActionItem = {
  id: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  meta: string;
  cta: string;
  href: string;
};

type MyTaskCounts = { overdue: number; dueToday: number; doneToday: number };

function buildActionItems(data: any, myTasks: MyTaskCounts, awaitingApprovalCount: number): ActionItem[] {
  const items: ActionItem[] = [];

  const { overdue, dueToday, doneToday } = myTasks;
  const activePrj = data?.projects?.active ?? 0;

  if (overdue > 0) {
    items.push({
      id: 'overdue',
      Icon: AlertTriangle,
      iconBg: '#fdeceb',
      iconColor: '#a3231c',
      title: `${overdue} of your task${overdue > 1 ? 's are' : ' is'} overdue`,
      meta: 'These are assigned to you and have passed their due date',
      cta: 'Open',
      href: '/tasks',
    });
  }
  if (dueToday > 0) {
    items.push({
      id: 'due',
      Icon: Clock,
      iconBg: '#eaf1f8',
      iconColor: '#14406a',
      title: `${dueToday} of your task${dueToday > 1 ? 's' : ''} due today`,
      meta: `${doneToday} completed so far today`,
      cta: 'View',
      href: '/tasks',
    });
  }
  if (awaitingApprovalCount > 0) {
    items.push({
      id: 'approvals',
      Icon: GitMerge,
      iconBg: '#fbf3e0',
      iconColor: '#8a6209',
      title: `${awaitingApprovalCount} change request${awaitingApprovalCount > 1 ? 's' : ''} need your approval`,
      meta: 'Your review is the next step in the workflow',
      cta: 'Review',
      href: '/change-management',
    });
  }
  if (activePrj > 0) {
    items.push({
      id: 'projects',
      Icon: FolderKanban,
      iconBg: '#eaf1f8',
      iconColor: '#14406a',
      title: `${activePrj} active project${activePrj > 1 ? 's' : ''}`,
      meta: `${data?.projects?.total ?? 0} projects total in the system`,
      cta: 'View',
      href: '/projects',
    });
  }

  return items;
}

type PulseStat = { label: string; value: number; pct?: number; barColor: string };

function buildPulseStats(data: any, awaitingApprovalCount: number): PulseStat[] {
  const totalPrj = data?.projects?.total ?? 0;
  const activePrj = data?.projects?.active ?? 0;
  const dueToday = data?.tasks?.due_today ?? 0;
  const doneToday = data?.tasks?.done_today ?? 0;
  const overdue = data?.tasks?.overdue ?? 0;

  return [
    {
      label: 'ACTIVE PROJECTS',
      value: activePrj,
      barColor: '#14406a',
      pct: totalPrj > 0 ? Math.round((activePrj / totalPrj) * 100) : 0,
    },
    {
      label: 'DUE TODAY',
      value: dueToday,
      barColor: '#14406a',
      pct: dueToday + doneToday > 0 ? Math.round((doneToday / (dueToday + doneToday)) * 100) : undefined,
    },
    {
      label: 'AWAITING APPROVAL',
      value: awaitingApprovalCount,
      barColor: '#c9971b',
    },
    {
      label: 'OVERDUE',
      value: overdue,
      barColor: '#b3261e',
      pct: overdue + dueToday > 0 ? Math.round((overdue / (overdue + dueToday)) * 100) : undefined,
    },
  ];
}

export default function DailyBriefPage() {
  const { user } = useAuthStore();

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['daily-brief'],
    queryFn: () => dailyBriefService.get().then((r) => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const today = todayStr();
  const { data: todayEvents } = useQuery({
    queryKey: ['daily-brief-agenda', today],
    queryFn: () => calendarService.list(today, today).then((r) => r.data.data || []),
  });

  const { data: myChangeRequests } = useQuery({
    queryKey: ['daily-brief-crs', user?.id],
    queryFn: () => changeRequestService.list({}).then((r) => r.data.data?.data || []),
    enabled: !!user?.id,
  });

  const { data: myTasksRaw } = useQuery({
    queryKey: ['daily-brief-tasks', user?.id],
    queryFn: () => taskService.list({ assignee_id: user?.id }).then((r) => r.data.data || []),
    enabled: !!user?.id,
  });

  const awaitingApproval = useMemo(
    () => (myChangeRequests || []).filter((cr: any) => isMyTurn(cr, user?.id || '')),
    [myChangeRequests, user?.id],
  );
  const waitingOnOthers = useMemo(
    () =>
      (myChangeRequests || []).filter(
        (cr: any) => cr.requester_id === user?.id && cr.status === 'submitted' && !isMyTurn(cr, user?.id || ''),
      ),
    [myChangeRequests, user?.id],
  );

  const myTaskCounts = useMemo((): MyTaskCounts => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayIso = todayMidnight.toISOString().slice(0, 10);
    const tasks = myTasksRaw || [];
    return {
      overdue: tasks.filter((t: any) => t.due_date && t.status !== 'done' && new Date(t.due_date) < todayMidnight).length,
      dueToday: tasks.filter((t: any) => t.due_date?.slice(0, 10) === todayIso).length,
      doneToday: tasks.filter((t: any) => t.status === 'done' && t.updated_at?.slice(0, 10) === todayIso).length,
    };
  }, [myTasksRaw]);

  const now = new Date();
  const updatedTime = dataUpdatedAt ? fmtTime(new Date(dataUpdatedAt)) : fmtTime(now);
  const actionItems = data ? buildActionItems(data, myTaskCounts, awaitingApproval.length) : [];
  const pulseStats = data ? buildPulseStats(data, awaitingApproval.length) : [];
  const dayDateLabel = fmtDayDate(now);

  return (
    <AppLayout>
      <PageHeader
        section="YOUR DAY"
        title="Daily Brief"
        subtitle={`${dayDateLabel} · ${actionItems.length} things need you · updated ${updatedTime} WIB`}
        actions={
          <>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary disabled:opacity-50 hover:bg-surface-2 transition-colors"
            >
              <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
              Refresh
            </button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : !data ? (
        <div className="bg-white border border-border rounded-[6px] p-12 text-center">
          <AlertTriangle className="w-7 h-7 text-border-button mx-auto mb-3" />
          <p className="text-[12.5px] font-semibold text-text-placeholder">Failed to load data</p>
          <button onClick={() => refetch()} className="mt-3 text-[12px] text-navy-700 font-semibold hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 330px' }}>
          {/* ── Left column ─────────────────────────────── */}
          <div className="flex flex-col gap-[14px]">
            {/* Needs you today */}
            <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle gap-[10px]">
                <span className="text-[12.5px] font-semibold text-navy-900">Needs you today</span>
                <div className="ml-auto">
                  <span className="inline-flex items-center h-[20px] px-[8px] rounded-[3px] bg-gold-500 text-navy-800 font-mono text-[10.5px] font-bold">
                    {actionItems.length}
                  </span>
                </div>
              </div>

              {actionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <CheckSquare className="w-8 h-8 text-success mb-2" />
                  <p className="text-[12.5px] font-semibold text-navy-900">Nothing needs you today</p>
                  <p className="text-[11px] text-neutral mt-0.5">You&apos;re all caught up.</p>
                </div>
              ) : (
                actionItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-[11px] px-[15px] py-[10px] border-b border-border-subtle"
                  >
                    <div
                      className="w-[28px] h-[28px] flex-none rounded-[5px] flex items-center justify-center"
                      style={{ background: item.iconBg }}
                    >
                      <item.Icon className="w-[15px] h-[15px]" style={{ color: item.iconColor }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-navy-800">{item.title}</div>
                      <div className="text-[11px] text-neutral">{item.meta}</div>
                    </div>
                    <Link
                      href={item.href}
                      className="h-[26px] flex items-center px-[10px] rounded-[5px] border border-border-button bg-white text-text-secondary text-[11px] font-semibold flex-none hover:bg-surface-2 transition-colors"
                    >
                      {item.cta}
                    </Link>
                  </motion.div>
                ))
              )}
            </div>

            {/* Institution pulse */}
            <div className="bg-white border border-border rounded-[6px]">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle gap-[10px]">
                <span className="text-[12.5px] font-semibold text-navy-900">Institution pulse</span>
                <span className="ml-auto font-mono text-[9.5px] text-text-meta">RIGHT NOW</span>
              </div>
              <div className="px-[15px] py-[12px] grid grid-cols-4 gap-[14px]">
                {pulseStats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="flex flex-col gap-[6px]"
                  >
                    <div className="font-mono text-[9px] font-medium tracking-[0.11em] text-neutral">{s.label}</div>
                    <div className="flex items-baseline gap-[7px]">
                      <span className="font-display font-semibold text-[22px] leading-none text-navy-900">{s.value}</span>
                    </div>
                    {s.pct !== undefined && (
                      <div className="h-[4px] rounded-full bg-border-subtle overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.barColor }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ────────────────────────────── */}
          <div className="flex flex-col gap-[14px]">
            {/* Your agenda */}
            <div className="bg-white border border-border rounded-[6px]">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle gap-[10px]">
                <span className="text-[12.5px] font-semibold text-navy-900">Your agenda</span>
                <span className="ml-auto font-mono text-[9.5px] text-text-meta">TODAY</span>
              </div>
              <div className="px-[15px] py-[13px] pb-[6px] flex flex-col">
                {!todayEvents || todayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Calendar className="w-7 h-7 text-border mb-2" />
                    <p className="text-[11px] text-neutral">No events scheduled for today</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[9px] pb-[8px]">
                    {todayEvents.slice(0, 5).map((e: any) => (
                      <Link
                        key={e.id}
                        href="/calendar"
                        className="flex items-center gap-[9px] hover:opacity-70 transition-opacity"
                      >
                        <span className="font-mono text-[10px] text-text-meta w-[42px] flex-none">
                          {e.all_day ? 'All day' : (e.start_time?.slice(0, 5) ?? '—')}
                        </span>
                        <span className="text-[12px] text-navy-800 font-medium truncate flex-1 min-w-0">{e.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="pt-[8px] border-t border-border-subtle mt-[2px]">
                  <Link href="/calendar" className="text-[11px] text-navy-700 font-semibold hover:underline">
                    View full calendar
                  </Link>
                </div>
              </div>
            </div>

            {/* Waiting on other people */}
            <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle">
                <span className="text-[12.5px] font-semibold text-navy-900">Waiting on other people</span>
              </div>
              <div className="px-[15px] py-[11px] flex flex-col gap-[10px]">
                {waitingOnOthers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <User className="w-6 h-6 text-border mb-2" />
                    <p className="text-[11px] text-neutral">Nothing is waiting on others right now</p>
                  </div>
                ) : (
                  waitingOnOthers.slice(0, 5).map((cr: any) => (
                    <Link key={cr.id} href="/change-management" className="flex items-center gap-[9px] hover:opacity-70 transition-opacity">
                      <div className="w-[26px] h-[26px] flex-none rounded-[5px] bg-pending-soft flex items-center justify-center">
                        <GitMerge className="w-[13px] h-[13px] text-pending-text" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11.5px] font-semibold text-navy-800 truncate">{cr.title}</div>
                        <div className="text-[10.5px] text-neutral">
                          Step {cr.current_step ?? 0}/{cr.total_steps ?? '—'}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
