'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, AlertTriangle, Clock, FolderKanban, CheckSquare, GitMerge, Calendar, User, FileSignature } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { dailyBriefService, calendarService, changeRequestService, taskService, tteSignService } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

function fmtTime(d: Date, locale: Locale = 'en') {
  return d.toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDayDate(d: Date, locale: Locale = 'en') {
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
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

type WaitingItem = {
  id: string;
  Icon: React.ElementType;
  href: string;
  title: string;
  meta: string;
};

function buildActionItems(
  data: any,
  myTasks: MyTaskCounts,
  awaitingApprovalCount: number,
  awaitingSignatureCount: number,
  t: ReturnType<typeof useT>,
): ActionItem[] {
  const items: ActionItem[] = [];

  const { overdue, dueToday, doneToday } = myTasks;
  const activePrj = data?.projects?.active ?? 0;

  if (overdue > 0) {
    items.push({
      id: 'overdue',
      Icon: AlertTriangle,
      iconBg: '#fdeceb',
      iconColor: '#a3231c',
      title: t('overdueTasksTitle', { count: overdue, s: overdue > 1 ? 's are' : ' is' }),
      meta: t('overdueTasksMeta'),
      cta: t('open'),
      href: '/tasks',
    });
  }
  if (dueToday > 0) {
    items.push({
      id: 'due',
      Icon: Clock,
      iconBg: '#eaf1f8',
      iconColor: '#14406a',
      title: t('dueTodayTitle', { count: dueToday, s: dueToday > 1 ? 's' : '' }),
      meta: t('dueTodayMeta', { count: doneToday }),
      cta: t('common.view'),
      href: '/tasks',
    });
  }
  if (awaitingApprovalCount > 0) {
    items.push({
      id: 'approvals',
      Icon: GitMerge,
      iconBg: '#fbf3e0',
      iconColor: '#8a6209',
      title: t('approvalsTitle', { count: awaitingApprovalCount, s: awaitingApprovalCount > 1 ? 's' : '' }),
      meta: t('approvalsMeta'),
      cta: t('review'),
      href: '/change-management',
    });
  }
  if (awaitingSignatureCount > 0) {
    items.push({
      id: 'signatures',
      Icon: FileSignature,
      iconBg: '#eaf1f8',
      iconColor: '#14406a',
      title: t('signaturesTitle', { count: awaitingSignatureCount, s: awaitingSignatureCount > 1 ? 's' : '' }),
      meta: t('signaturesMeta'),
      cta: t('sign'),
      href: '/tte-sign',
    });
  }
  if (activePrj > 0) {
    items.push({
      id: 'projects',
      Icon: FolderKanban,
      iconBg: '#eaf1f8',
      iconColor: '#14406a',
      title: t('activeProjectsTitle', { count: activePrj, s: activePrj > 1 ? 's' : '' }),
      meta: t('activeProjectsMeta', { count: data?.projects?.total ?? 0 }),
      cta: t('common.view'),
      href: '/projects',
    });
  }

  return items;
}

type PulseStat = { label: string; value: number; pct?: number; barColor: string };

function buildPulseStats(data: any, awaitingApprovalCount: number, t: ReturnType<typeof useT>): PulseStat[] {
  const totalPrj = data?.projects?.total ?? 0;
  const activePrj = data?.projects?.active ?? 0;
  const dueToday = data?.tasks?.due_today ?? 0;
  const doneToday = data?.tasks?.done_today ?? 0;
  const overdue = data?.tasks?.overdue ?? 0;

  return [
    {
      label: t('activeProjectsLabel'),
      value: activePrj,
      barColor: '#14406a',
      pct: totalPrj > 0 ? Math.round((activePrj / totalPrj) * 100) : 0,
    },
    {
      label: t('dueTodayLabel'),
      value: dueToday,
      barColor: '#14406a',
      pct: dueToday + doneToday > 0 ? Math.round((doneToday / (dueToday + doneToday)) * 100) : undefined,
    },
    {
      label: t('awaitingApprovalLabel'),
      value: awaitingApprovalCount,
      barColor: '#c9971b',
    },
    {
      label: t('overdueLabel'),
      value: overdue,
      barColor: '#b3261e',
      pct: overdue + dueToday > 0 ? Math.round((overdue / (overdue + dueToday)) * 100) : undefined,
    },
  ];
}

const dict = {
  en: {
    yourDay: 'YOUR DAY',
    dailyBrief: 'Daily Brief',
    subtitle: '{day} · {count} things need you · updated {time} WIB',
    failedToLoad: 'Failed to load data',
    overdueTasksTitle: '{count} of your task{s} overdue',
    overdueTasksMeta: 'These are assigned to you and have passed their due date',
    open: 'Open',
    dueTodayTitle: '{count} of your task{s} due today',
    dueTodayMeta: '{count} completed so far today',
    approvalsTitle: '{count} change request{s} need your approval',
    approvalsMeta: 'Your review is the next step in the workflow',
    review: 'Review',
    signaturesTitle: '{count} document{s} need your signature',
    signaturesMeta: 'You are the next signer in the e-Sign order',
    sign: 'Sign',
    activeProjectsTitle: '{count} active project{s}',
    activeProjectsMeta: '{count} projects total in the system',
    activeProjectsLabel: 'ACTIVE PROJECTS',
    dueTodayLabel: 'DUE TODAY',
    awaitingApprovalLabel: 'AWAITING APPROVAL',
    overdueLabel: 'OVERDUE',
    needsYouToday: 'Needs you today',
    nothingNeedsYouToday: 'Nothing needs you today',
    allCaughtUp: "You're all caught up.",
    institutionPulse: 'Institution pulse',
    rightNow: 'RIGHT NOW',
    yourAgenda: 'Your agenda',
    today: 'TODAY',
    noEventsToday: 'No events scheduled for today',
    allDay: 'All day',
    viewFullCalendar: 'View full calendar',
    waitingOnOthers: 'Waiting on other people',
    nothingWaiting: 'Nothing is waiting on others right now',
    step: 'Step {current}/{total}',
    signedCount: 'Signed {signed}/{total} · {note}',
    youRequestedThis: 'you requested this',
    earlierSignersFirst: 'earlier signers first',
  },
  id: {
    yourDay: 'HARI ANDA',
    dailyBrief: 'Ringkasan Harian',
    subtitle: '{day} · {count} hal memerlukan perhatian Anda · diperbarui {time} WIB',
    failedToLoad: 'Gagal memuat data',
    overdueTasksTitle: '{count} tugas Anda terlambat',
    overdueTasksMeta: 'Tugas ini ditugaskan kepada Anda dan telah melewati batas waktu',
    open: 'Buka',
    dueTodayTitle: '{count} tugas Anda jatuh tempo hari ini',
    dueTodayMeta: '{count} selesai sejauh ini hari ini',
    approvalsTitle: '{count} permintaan perubahan memerlukan persetujuan Anda',
    approvalsMeta: 'Tinjauan Anda adalah langkah berikutnya dalam alur kerja',
    review: 'Tinjau',
    signaturesTitle: '{count} dokumen memerlukan tanda tangan Anda',
    signaturesMeta: 'Anda adalah penanda tangan berikutnya dalam urutan e-Sign',
    sign: 'Tanda Tangani',
    activeProjectsTitle: '{count} proyek aktif',
    activeProjectsMeta: '{count} proyek total dalam sistem',
    activeProjectsLabel: 'PROYEK AKTIF',
    dueTodayLabel: 'JATUH TEMPO HARI INI',
    awaitingApprovalLabel: 'MENUNGGU PERSETUJUAN',
    overdueLabel: 'TERLAMBAT',
    needsYouToday: 'Memerlukan perhatian Anda hari ini',
    nothingNeedsYouToday: 'Tidak ada yang memerlukan perhatian Anda hari ini',
    allCaughtUp: 'Semua sudah selesai.',
    institutionPulse: 'Denyut institusi',
    rightNow: 'SAAT INI',
    yourAgenda: 'Agenda Anda',
    today: 'HARI INI',
    noEventsToday: 'Tidak ada acara terjadwal hari ini',
    allDay: 'Sepanjang hari',
    viewFullCalendar: 'Lihat kalender lengkap',
    waitingOnOthers: 'Menunggu orang lain',
    nothingWaiting: 'Tidak ada yang sedang menunggu orang lain saat ini',
    step: 'Langkah {current}/{total}',
    signedCount: 'Ditandatangani {signed}/{total} · {note}',
    youRequestedThis: 'Anda yang meminta ini',
    earlierSignersFirst: 'penanda tangan sebelumnya terlebih dahulu',
  },
};

export default function DailyBriefPage() {
  const t = useT(dict);
  const { locale } = useLocale();
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

  const { data: myTteRequests } = useQuery({
    queryKey: ['daily-brief-tte', user?.id],
    queryFn: () => tteSignService.list().then((r) => r.data.data || []),
    enabled: !!user?.id,
  });

  const awaitingSignature = useMemo(
    () => (myTteRequests || []).filter((d: any) => d.can_sign),
    [myTteRequests],
  );

  const awaitingApproval = useMemo(
    () => (myChangeRequests || []).filter((cr: any) => isMyTurn(cr, user?.id || '')),
    [myChangeRequests, user?.id],
  );
  const waitingOnOthers = useMemo((): WaitingItem[] => {
    const crs: WaitingItem[] = (myChangeRequests || [])
      .filter((cr: any) => cr.requester_id === user?.id && cr.status === 'submitted' && !isMyTurn(cr, user?.id || ''))
      .map((cr: any) => ({
        id: `cr-${cr.id}`,
        Icon: GitMerge,
        href: '/change-management',
        title: cr.title,
        meta: t('step', { current: cr.current_step ?? 0, total: cr.total_steps ?? '-' }),
      }));

    const docs: WaitingItem[] = (myTteRequests || [])
      .filter(
        (d: any) =>
          !d.can_sign && d.status === 'waiting_signature' && (d.my_role === 'signer' || d.my_role === 'creator'),
      )
      .map((d: any) => ({
        id: `tte-${d.id}`,
        Icon: FileSignature,
        href: '/tte-sign',
        title: d.title,
        meta: t('signedCount', {
          signed: d.signed_count ?? 0,
          total: d.signer_count ?? 0,
          note: d.my_role === 'creator' ? t('youRequestedThis') : t('earlierSignersFirst'),
        }),
      }));

    return [...crs, ...docs];
  }, [myChangeRequests, myTteRequests, user?.id, t]);

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
  const updatedTime = dataUpdatedAt ? fmtTime(new Date(dataUpdatedAt), locale) : fmtTime(now, locale);
  const actionItems = data
    ? buildActionItems(data, myTaskCounts, awaitingApproval.length, awaitingSignature.length, t)
    : [];
  const pulseStats = data ? buildPulseStats(data, awaitingApproval.length, t) : [];
  const dayDateLabel = fmtDayDate(now, locale);

  return (
    <AppLayout>
      <PageHeader
        section={t('yourDay')}
        title={t('dailyBrief')}
        subtitle={t('subtitle', { day: dayDateLabel, count: actionItems.length, time: updatedTime })}
        actions={
          <>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary disabled:opacity-50 hover:bg-surface-2 transition-colors"
            >
              <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
              {t('common.refresh')}
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
          <p className="text-[12.5px] font-semibold text-text-placeholder">{t('failedToLoad')}</p>
          <button onClick={() => refetch()} className="mt-3 text-[12px] text-navy-700 font-semibold hover:underline">
            {t('common.tryAgain')}
          </button>
        </div>
      ) : (
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1fr 330px' }}>
          {/* ── Left column ─────────────────────────────── */}
          <div className="flex flex-col gap-[14px]">
            {/* Needs you today */}
            <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle gap-[10px]">
                <span className="text-[12.5px] font-semibold text-navy-900">{t('needsYouToday')}</span>
                <div className="ml-auto">
                  <span className="inline-flex items-center h-[20px] px-[8px] rounded-[3px] bg-gold-500 text-navy-800 font-mono text-[10.5px] font-bold">
                    {actionItems.length}
                  </span>
                </div>
              </div>

              {actionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <CheckSquare className="w-8 h-8 text-success mb-2" />
                  <p className="text-[12.5px] font-semibold text-navy-900">{t('nothingNeedsYouToday')}</p>
                  <p className="text-[11px] text-neutral mt-0.5">{t('allCaughtUp')}</p>
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
                <span className="text-[12.5px] font-semibold text-navy-900">{t('institutionPulse')}</span>
                <span className="ml-auto font-mono text-[9.5px] text-text-meta">{t('rightNow')}</span>
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
                <span className="text-[12.5px] font-semibold text-navy-900">{t('yourAgenda')}</span>
                <span className="ml-auto font-mono text-[9.5px] text-text-meta">{t('today')}</span>
              </div>
              <div className="px-[15px] py-[13px] pb-[6px] flex flex-col">
                {!todayEvents || todayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Calendar className="w-7 h-7 text-border mb-2" />
                    <p className="text-[11px] text-neutral">{t('noEventsToday')}</p>
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
                          {e.all_day ? t('allDay') : (e.start_time?.slice(0, 5) ?? '-')}
                        </span>
                        <span className="text-[12px] text-navy-800 font-medium truncate flex-1 min-w-0">{e.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="pt-[8px] border-t border-border-subtle mt-[2px]">
                  <Link href="/calendar" className="text-[11px] text-navy-700 font-semibold hover:underline">
                    {t('viewFullCalendar')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Waiting on other people */}
            <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
              <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-border-subtle">
                <span className="text-[12.5px] font-semibold text-navy-900">{t('waitingOnOthers')}</span>
              </div>
              <div className="px-[15px] py-[11px] flex flex-col gap-[10px]">
                {waitingOnOthers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <User className="w-6 h-6 text-border mb-2" />
                    <p className="text-[11px] text-neutral">{t('nothingWaiting')}</p>
                  </div>
                ) : (
                  waitingOnOthers.slice(0, 5).map((item) => (
                    <Link key={item.id} href={item.href} className="flex items-center gap-[9px] hover:opacity-70 transition-opacity">
                      <div className="w-[26px] h-[26px] flex-none rounded-[5px] bg-pending-soft flex items-center justify-center">
                        <item.Icon className="w-[13px] h-[13px] text-pending-text" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11.5px] font-semibold text-navy-800 truncate">{item.title}</div>
                        <div className="text-[10.5px] text-neutral truncate">{item.meta}</div>
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
