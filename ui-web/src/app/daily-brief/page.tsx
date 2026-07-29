'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  RefreshCw, AlertTriangle, Clock, FolderKanban,
  CheckSquare, Users, Send, Calendar, User,
  PenLine, TimerReset,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { dailyBriefService } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDayDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

type ActionItem = {
  id: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  meta: string;
  cta: string;
  ctaPrimary?: boolean;
};

function buildActionItems(data: any): ActionItem[] {
  const items: ActionItem[] = [];

  const overdue = data?.tasks?.overdue ?? 0;
  const dueToday = data?.tasks?.due_today ?? 0;
  const doneTday = data?.tasks?.done_today ?? 0;
  const activePrj = data?.projects?.active ?? 0;
  const activeUsr = data?.users?.active ?? 0;

  if (overdue > 0) {
    items.push({
      id: 'overdue',
      Icon: AlertTriangle,
      iconBg: '#fdeceb', iconColor: '#a3231c',
      title: `${overdue} task${overdue > 1 ? 's are' : ' is'} overdue`,
      meta: 'These tasks have passed their due date and may be blocking others',
      cta: 'Open',
    });
  }
  if (dueToday > 0) {
    items.push({
      id: 'due',
      Icon: Clock,
      iconBg: '#eaf1f8', iconColor: '#14406a',
      title: `${dueToday} task${dueToday > 1 ? 's' : ''} due today`,
      meta: `${doneTday} completed so far today`,
      cta: 'View',
    });
  }
  if (activePrj > 0) {
    items.push({
      id: 'projects',
      Icon: FolderKanban,
      iconBg: '#eaf1f8', iconColor: '#14406a',
      title: `${activePrj} active project${activePrj > 1 ? 's' : ''}`,
      meta: `${data?.projects?.total ?? 0} projects total in the system`,
      cta: 'View',
    });
  }
  if (activeUsr > 0) {
    items.push({
      id: 'users',
      Icon: Users,
      iconBg: '#f1f0ed', iconColor: '#5c6470',
      title: `${activeUsr} of ${data?.users?.total ?? 0} users active`,
      meta: 'Click to view user activity',
      cta: 'View',
    });
  }

  return items;
}

type PulseStat = { label: string; value: number; delta: string; deltaColor: string; barColor: string; pct: number };

function buildPulseStats(data: any): PulseStat[] {
  const totalPrj  = data?.projects?.total ?? 1;
  const activePrj = data?.projects?.active ?? 0;
  const dueToday  = data?.tasks?.due_today ?? 0;
  const overdue   = data?.tasks?.overdue ?? 0;

  return [
    {
      label: 'ACTIVE PROJECTS', value: activePrj,
      delta: '+1', deltaColor: '#0f6144', barColor: '#14406a',
      pct: Math.min(100, totalPrj > 0 ? Math.round((activePrj / totalPrj) * 100) : 0),
    },
    {
      label: 'OPEN TASKS', value: dueToday,
      delta: '−12', deltaColor: '#0f6144', barColor: '#14406a',
      pct: 64,
    },
    {
      label: 'AWAITING APPROVAL', value: data?.tasks?.awaiting_approval ?? 0,
      delta: '+2', deltaColor: '#8a6209', barColor: '#c9971b',
      pct: 38,
    },
    {
      label: 'OVERDUE', value: overdue,
      delta: overdue > 0 ? `+${overdue}` : '0', deltaColor: overdue > 0 ? '#a3231c' : '#0f6144', barColor: '#b3261e',
      pct: Math.min(100, overdue * 10),
    },
  ];
}

export default function DailyBriefPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['daily-brief'],
    queryFn: () => dailyBriefService.get().then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const now          = new Date();
  const updatedTime  = dataUpdatedAt ? fmtTime(new Date(dataUpdatedAt)) : fmtTime(now);
  const actionItems  = data ? buildActionItems(data) : [];
  const pulseStats   = data ? buildPulseStats(data) : [];
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
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] disabled:opacity-50 hover:bg-[#f5f4f2] transition-colors"
            >
              <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
              Refresh
            </button>
            <button
              onClick={() => toast.success('Sent to Telegram')}
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors"
            >
              <Send className="w-3 h-3" />
              Send to Telegram
            </button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
      ) : !data ? (
        <div className="bg-white border border-[#e6e4df] rounded-[6px] p-12 text-center">
          <AlertTriangle className="w-7 h-7 text-slate-300 mx-auto mb-3" />
          <p className="text-[12.5px] font-semibold text-slate-400">Failed to load data</p>
          <button onClick={() => refetch()} className="mt-3 text-[12px] text-brand font-semibold hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 330px' }}>

          {/* ── Left column ─────────────────────────────── */}
          <div className="flex flex-col gap-[14px]">

            {/* Needs you today */}
            <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4] gap-[10px]">
                <span className="text-[12.5px] font-semibold text-[#0d2b48]">Needs you today</span>
                <div className="ml-auto">
                  <span className="inline-flex items-center h-[20px] px-[8px] rounded-[3px] bg-accent text-[#12283c] font-mono text-[10.5px] font-bold">
                    {actionItems.length}
                  </span>
                </div>
              </div>

              {actionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <CheckSquare className="w-8 h-8 text-success mb-2" />
                  <p className="text-[12.5px] font-semibold text-[#0d2b48]">Nothing needs you today</p>
                  <p className="text-[11px] text-[#8a8f98] mt-0.5">You&apos;re all caught up.</p>
                </div>
              ) : (
                actionItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-[11px] px-[15px] py-[10px] border-b border-[#f2f0ec]"
                  >
                    <div
                      className="w-[28px] h-[28px] flex-none rounded-[5px] flex items-center justify-center"
                      style={{ background: item.iconBg }}
                    >
                      <item.Icon className="w-[15px] h-[15px]" style={{ color: item.iconColor }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#12283c]">{item.title}</div>
                      <div className="text-[11px] text-[#8a8f98]">{item.meta}</div>
                    </div>
                    <button className="h-[26px] flex items-center px-[10px] rounded-[5px] border border-[#d9d6cf] bg-white text-[#4b5563] text-[11px] font-semibold flex-none hover:bg-[#f5f4f2] transition-colors">
                      {item.cta}
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Institution pulse */}
            <div className="bg-white border border-[#e6e4df] rounded-[6px]">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4] gap-[10px]">
                <span className="text-[12.5px] font-semibold text-[#0d2b48]">Institution pulse</span>
                <span className="ml-auto font-mono text-[9.5px] text-[#a6a094]">VS YESTERDAY</span>
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
                    <div className="font-mono text-[9px] font-medium tracking-[0.11em] text-[#8a8f98]">
                      {s.label}
                    </div>
                    <div className="flex items-baseline gap-[7px]">
                      <span className="font-display font-semibold text-[22px] leading-none text-[#0d2b48]">
                        {s.value}
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: s.deltaColor }}>
                        {s.delta}
                      </span>
                    </div>
                    <div className="h-[4px] rounded-full bg-[#eceae4] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.pct}%`, background: s.barColor }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ────────────────────────────── */}
          <div className="flex flex-col gap-[14px]">

            {/* Your agenda */}
            <div className="bg-white border border-[#e6e4df] rounded-[6px]">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4] gap-[10px]">
                <span className="text-[12.5px] font-semibold text-[#0d2b48]">Your agenda</span>
                <span className="ml-auto font-mono text-[9.5px] text-[#a6a094]">TODAY</span>
              </div>
              <div className="px-[15px] py-[13px] pb-[6px] flex flex-col">
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="w-7 h-7 text-slate-200 mb-2" />
                  <p className="text-[11px] text-[#8a8f98]">No events scheduled for today</p>
                </div>
                <div className="pt-[8px] border-t border-[#f2f0ec] mt-[2px]">
                  <p className="text-[11px] text-[#8a8f98]">Connect your calendar to see events here.</p>
                </div>
              </div>
            </div>

            {/* Waiting on other people */}
            <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4]">
                <span className="text-[12.5px] font-semibold text-[#0d2b48]">Waiting on other people</span>
              </div>
              <div className="px-[15px] py-[11px] flex flex-col gap-[10px]">
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <User className="w-6 h-6 text-slate-200 mb-2" />
                  <p className="text-[11px] text-[#8a8f98]">Nothing is waiting on others right now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
