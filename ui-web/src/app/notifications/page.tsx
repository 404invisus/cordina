'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, PenLine, Clock, CalendarDays, AtSign, CheckCircle, BarChart2, FileWarning, CheckSquare, Mail, Send } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { notificationService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: {
    labelSignatureRequested: 'Signature requested',
    labelApprovalNeeded: 'Approval needed',
    labelMeetingInvite: 'Meeting invite',
    labelMention: 'Mention',
    labelDocumentSigned: 'Document signed',
    labelSprintClosed: 'Sprint closed',
    labelDocumentExpiring: 'Document expiring',
    labelTaskAssigned: 'Task assigned',
    labelCrApproved: 'CR approved',
    labelCrRejected: 'CR rejected',
    labelSprintStarted: 'Sprint started',
    labelNewEvent: 'New event',
    labelStatusChanged: 'Status changed',
    ctaSignNow: 'Sign now',
    ctaReview: 'Review',
    ctaOpenAgenda: 'Open agenda',
    ctaReply: 'Reply',
    ctaViewReport: 'View report',
    ctaOpen: 'Open',
    ctaView: 'View',
    earlier: 'Earlier',
    section: 'INBOX',
    title: 'Notifications',
    subtitle: '{unread} unread · {needsAction} need an action from you · nothing is marked read automatically',
    preferencesBtn: 'Preferences',
    markAllReadBtn: 'Mark all as read',
    tabNeedsAction: 'Needs action',
    tabUnread: 'Unread',
    tabAll: 'All',
    tabMentions: 'Mentions',
    emptyTitle: 'No notifications',
    emptyNeedsAction: 'Nothing needs your action right now',
    emptyGeneric: 'No notifications to show',
    showingCount: 'Showing {shown} of {total} · grouped by day',
    deliveryChannelsTitle: 'Delivery channels',
    inAppTitle: 'In-app',
    alwaysOn: 'Always on',
    telegramTitle: 'Telegram',
    telegramConnected: 'Connected · {chatId}',
    telegramNotConnected: 'Not connected',
    prefsModalTitle: 'Notification Preferences',
    prefsModalSubtitle: 'Configure your notification channels',
    telegramViaBotSubtitle: 'Notifications via Telegram bot',
    chatIdLabel: 'Chat ID',
    notSet: 'Not set',
    telegramWarningPrefix: 'Telegram Chat ID not set. Configure it in',
    settingsLink: 'Settings',
    telegramWarningSuffix: 'to enable Telegram notifications.',
  },
  id: {
    labelSignatureRequested: 'Permintaan tanda tangan',
    labelApprovalNeeded: 'Persetujuan diperlukan',
    labelMeetingInvite: 'Undangan rapat',
    labelMention: 'Sebutan',
    labelDocumentSigned: 'Dokumen ditandatangani',
    labelSprintClosed: 'Sprint ditutup',
    labelDocumentExpiring: 'Dokumen akan kedaluwarsa',
    labelTaskAssigned: 'Tugas ditugaskan',
    labelCrApproved: 'CR disetujui',
    labelCrRejected: 'CR ditolak',
    labelSprintStarted: 'Sprint dimulai',
    labelNewEvent: 'Acara baru',
    labelStatusChanged: 'Status berubah',
    ctaSignNow: 'Tandatangani sekarang',
    ctaReview: 'Tinjau',
    ctaOpenAgenda: 'Buka agenda',
    ctaReply: 'Balas',
    ctaViewReport: 'Lihat laporan',
    ctaOpen: 'Buka',
    ctaView: 'Lihat',
    earlier: 'Sebelumnya',
    section: 'KOTAK MASUK',
    title: 'Notifikasi',
    subtitle: '{unread} belum dibaca · {needsAction} memerlukan tindakan Anda · tidak ada yang otomatis ditandai dibaca',
    preferencesBtn: 'Preferensi',
    markAllReadBtn: 'Tandai semua telah dibaca',
    tabNeedsAction: 'Perlu tindakan',
    tabUnread: 'Belum dibaca',
    tabAll: 'Semua',
    tabMentions: 'Sebutan',
    emptyTitle: 'Tidak ada notifikasi',
    emptyNeedsAction: 'Tidak ada yang memerlukan tindakan Anda saat ini',
    emptyGeneric: 'Tidak ada notifikasi untuk ditampilkan',
    showingCount: 'Menampilkan {shown} dari {total} · dikelompokkan per hari',
    deliveryChannelsTitle: 'Saluran pengiriman',
    inAppTitle: 'Dalam aplikasi',
    alwaysOn: 'Selalu aktif',
    telegramTitle: 'Telegram',
    telegramConnected: 'Terhubung · {chatId}',
    telegramNotConnected: 'Belum terhubung',
    prefsModalTitle: 'Preferensi Notifikasi',
    prefsModalSubtitle: 'Atur saluran notifikasi Anda',
    telegramViaBotSubtitle: 'Notifikasi melalui bot Telegram',
    chatIdLabel: 'ID Chat',
    notSet: 'Belum diatur',
    telegramWarningPrefix: 'ID Chat Telegram belum diatur. Aturlah di',
    settingsLink: 'Pengaturan',
    telegramWarningSuffix: 'untuk mengaktifkan notifikasi Telegram.',
  },
};

type TFn = (key: string, vars?: Record<string, string | number>) => string;

/* ── Type config ─────────────────────────────────────────── */
type NotifConfig = {
  label: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  cta?: string;
  ctaPrimary?: boolean;
  needsAction?: boolean;
};

type NotifMeta = {
  labelKey: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  ctaKey?: string;
  ctaPrimary?: boolean;
  needsAction?: boolean;
};

const TYPE_META: Record<string, NotifMeta> = {
  'tte.sign_requested': {
    labelKey: 'labelSignatureRequested',
    Icon: PenLine,
    iconBg: '#fbf3e0',
    iconColor: '#8a6209',
    ctaKey: 'ctaSignNow',
    ctaPrimary: true,
    needsAction: true,
  },
  'change_request.submitted': {
    labelKey: 'labelApprovalNeeded',
    Icon: Clock,
    iconBg: '#fbf3e0',
    iconColor: '#8a6209',
    ctaKey: 'ctaReview',
    ctaPrimary: true,
    needsAction: true,
  },
  'calendar.event_assigned': { labelKey: 'labelMeetingInvite', Icon: CalendarDays, iconBg: '#eaf1f8', iconColor: '#14406a', ctaKey: 'ctaOpenAgenda' },
  'task.commented': { labelKey: 'labelMention', Icon: AtSign, iconBg: '#fdeceb', iconColor: '#a3231c', ctaKey: 'ctaReply' },
  'tte.signed': { labelKey: 'labelDocumentSigned', Icon: CheckCircle, iconBg: '#e9f4ee', iconColor: '#0f6144', ctaKey: 'common.download' },
  'sprint.completed': { labelKey: 'labelSprintClosed', Icon: BarChart2, iconBg: '#f1f0ed', iconColor: '#5c6470', ctaKey: 'ctaViewReport' },
  'document.expiring': { labelKey: 'labelDocumentExpiring', Icon: FileWarning, iconBg: '#fbf3e0', iconColor: '#8a6209', ctaKey: 'ctaOpen' },
  'task.assigned': { labelKey: 'labelTaskAssigned', Icon: CheckSquare, iconBg: '#eaf1f8', iconColor: '#14406a', ctaKey: 'ctaOpen' },
  'change_request.approved': { labelKey: 'labelCrApproved', Icon: CheckCircle, iconBg: '#e9f4ee', iconColor: '#0f6144', ctaKey: 'ctaView' },
  'change_request.rejected': { labelKey: 'labelCrRejected', Icon: FileWarning, iconBg: '#fdeceb', iconColor: '#a3231c', ctaKey: 'ctaView' },
  'sprint.started': { labelKey: 'labelSprintStarted', Icon: BarChart2, iconBg: '#e9f4ee', iconColor: '#0f6144' },
  'calendar.event_created': { labelKey: 'labelNewEvent', Icon: CalendarDays, iconBg: '#eaf1f8', iconColor: '#14406a', ctaKey: 'ctaOpen' },
  'task.status_changed': { labelKey: 'labelStatusChanged', Icon: CheckSquare, iconBg: '#f1f0ed', iconColor: '#5c6470' },
};

function getCfg(type: string, t: TFn): NotifConfig {
  const meta = TYPE_META[type];
  if (!meta) return { label: type, Icon: Bell, iconBg: '#f1f0ed', iconColor: '#5c6470' };
  return {
    label: t(meta.labelKey),
    Icon: meta.Icon,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
    cta: meta.ctaKey ? t(meta.ctaKey) : undefined,
    ctaPrimary: meta.ctaPrimary,
    needsAction: meta.needsAction,
  };
}

function fmtTime(iso: string, locale: 'en' | 'id') {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso: string, locale: 'en' | 'id', t: TFn) {
  if (!iso) return t('earlier');
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const localeCode = locale === 'id' ? 'id-ID' : 'en-GB';
  if (d.toDateString() === today.toDateString())
    return `${t('common.today').toUpperCase()} · ${d.toLocaleDateString(localeCode, { day: 'numeric', month: 'long' }).toUpperCase()}`;
  if (d.toDateString() === yesterday.toDateString())
    return `${t('common.yesterday').toUpperCase()} · ${d.toLocaleDateString(localeCode, { day: 'numeric', month: 'long' }).toUpperCase()}`;
  return d.toLocaleDateString(localeCode, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

function groupByDay(notifications: any[], locale: 'en' | 'id', t: TFn) {
  const groups: { label: string; items: any[] }[] = [];
  const seen: Record<string, number> = {};
  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    if (seen[d] === undefined) {
      seen[d] = groups.length;
      groups.push({ label: dayLabel(n.created_at, locale, t), items: [] });
    }
    groups[seen[d]].items.push(n);
  }
  return groups;
}

type Tab = 'needs_action' | 'unread' | 'all' | 'mentions';

export default function NotificationsPage() {
  const t = useT(dict);
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>('needs_action');
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { user } = useAuthStore();

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.list(page).then((r) => r.data.data),
  });

  const notifications: any[] = notifData?.data || [];
  const total = notifData?.total || 0;
  const lastPage = notifData?.last_page || 1;

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-unread-count'] });
    },
  });

  const unreadCount = notifications.filter((n) => n.status === 'sent').length;
  const needsActionList = notifications.filter((n) => getCfg(n.type, t).needsAction);
  const mentionList = notifications.filter((n) => n.type === 'task.commented');

  const filtered =
    tab === 'needs_action'
      ? needsActionList
      : tab === 'unread'
        ? notifications.filter((n) => n.status === 'sent')
        : tab === 'mentions'
          ? mentionList
          : notifications;

  const groups = groupByDay(filtered, locale, t);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'needs_action', label: t('tabNeedsAction') },
    { id: 'unread', label: t('tabUnread') },
    { id: 'all', label: t('tabAll') },
    { id: 'mentions', label: t('tabMentions') },
  ];

  return (
    <AppLayout>
      <PageHeader
        section={t('section')}
        title={t('title')}
        subtitle={t('subtitle', { unread: unreadCount, needsAction: needsActionList.length })}
        actions={
          <>
            <button
              onClick={() => setPrefsOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
            >
              {t('preferencesBtn')}
            </button>
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              {t('markAllReadBtn')}
            </button>
          </>
        }
      />

      <div className="flex gap-[14px]">
        {/* ── Notification feed ──────────────────────────────── */}
        <div className="flex-1 bg-white border border-border rounded-[6px] flex flex-col overflow-hidden min-h-[500px]">
          {/* Toolbar */}
          <div className="flex items-center px-[15px] py-[9px] gap-[10px] border-b border-border-subtle">
            <div className="flex gap-[5px]">
              {TABS.map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={cn(
                    'h-[26px] flex items-center px-[10px] rounded-[4px] text-[11.5px] transition-colors',
                    tab === tabItem.id ? 'bg-navy-700 text-white font-semibold' : 'text-text-tertiary font-medium hover:bg-neutral-soft',
                  )}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : !filtered.length ? (
            <EmptyState
              icon={Bell}
              title={t('emptyTitle')}
              subtitle={tab === 'needs_action' ? t('emptyNeedsAction') : t('emptyGeneric')}
            />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="h-[28px] flex items-center px-[15px] bg-surface-2 border-b border-border-subtle font-mono text-[9.5px] font-semibold tracking-[0.12em] text-neutral">
                    {group.label}
                  </div>
                  {group.items.map((n, i) => {
                    const cfg = getCfg(n.type, t);
                    const isAction = cfg.needsAction;
                    const title = n.payload?.event_title || n.payload?.task_title || n.payload?.message || n.type;
                    const meta = [n.payload?.document_number, n.payload?.task_code, n.payload?.body].filter(Boolean).join(' · ');

                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex gap-[11px] px-[15px] py-[11px] border-b border-border-subtle transition-colors hover:bg-surface-2"
                        style={isAction ? { boxShadow: 'inset 2px 0 0 #c9971b', background: '#fffdf6' } : {}}
                      >
                        <div
                          className="w-[30px] h-[30px] flex-none rounded-[5px] flex items-center justify-center"
                          style={{ background: cfg.iconBg }}
                        >
                          <cfg.Icon className="w-[15px] h-[15px]" style={{ color: cfg.iconColor }} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                          <div className="flex items-center gap-[8px]">
                            <span className="text-[12.5px] font-semibold text-navy-800">{title}</span>
                            <span className="font-mono text-[10px] text-text-meta">{fmtTime(n.created_at, locale)}</span>
                          </div>
                          {meta && <span className="text-[11.5px] text-text-tertiary">{meta}</span>}
                        </div>
                        <div className="flex items-center gap-[7px] flex-none">
                          {n.status === 'sent' && <span className="w-[7px] h-[7px] rounded-full bg-gold-500 flex-none" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Footer / pagination */}
          {!isLoading && total > 0 && (
            <div className="h-[36px] flex-none flex items-center justify-between px-[15px] border-t border-border-subtle bg-surface-2">
              <span className="text-[11px] text-neutral">
                {t('showingCount', { shown: filtered.length, total })}
              </span>
              {lastPage > 1 && (
                <div className="flex items-center gap-[4px]">
                  {[
                    { label: '‹', action: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
                    ...Array.from({ length: Math.min(3, lastPage) }, (_, i) => ({
                      label: String(i + 1),
                      action: () => setPage(i + 1),
                      disabled: false,
                      active: page === i + 1,
                    })),
                    { label: '›', action: () => setPage((p) => Math.min(lastPage, p + 1)), disabled: page === lastPage },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={btn.action}
                      disabled={btn.disabled}
                      className={cn(
                        'min-w-[22px] h-[22px] flex items-center justify-center px-[6px] rounded-[4px] font-mono text-[10.5px] font-semibold transition-colors',
                        (btn as any).active
                          ? 'bg-navy-700 text-white'
                          : 'border border-border-input bg-white text-text-tertiary disabled:opacity-40',
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ───────────────────────────────────── */}
        <div className="w-[280px] flex-none flex flex-col gap-[14px]">
          {/* Delivery channels */}
          <div className="bg-white border border-border rounded-[6px]">
            <div className="h-[40px] flex items-center px-[15px] border-b border-border-subtle">
              <span className="text-[12.5px] font-semibold text-navy-900">{t('deliveryChannelsTitle')}</span>
            </div>
            <div className="px-[14px] py-[12px] flex flex-col gap-[11px]">
              {/* In-app */}
              <div className="flex items-center gap-[9px]">
                <div className="w-[28px] h-[28px] rounded-[5px] bg-success-soft flex items-center justify-center">
                  <Mail className="w-[14px] h-[14px] text-success" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-navy-800">{t('inAppTitle')}</div>
                  <div className="text-[10.5px] text-neutral">{t('alwaysOn')}</div>
                </div>
                <div className="w-[32px] h-[18px] rounded-full bg-success p-[2px] flex justify-end">
                  <div className="w-[14px] h-[14px] rounded-full bg-white" />
                </div>
              </div>

              {/* Telegram */}
              <div className="flex items-center gap-[9px]">
                <div className="w-[28px] h-[28px] rounded-[5px] bg-info-soft flex items-center justify-center">
                  <Send className="w-[14px] h-[14px] text-navy-700" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-navy-800">{t('telegramTitle')}</div>
                  <div className={cn('text-[10.5px]', user?.telegram_chat_id ? 'text-success-text' : 'text-neutral')}>
                    {user?.telegram_chat_id ? t('telegramConnected', { chatId: user.telegram_chat_id }) : t('telegramNotConnected')}
                  </div>
                </div>
                <div
                  className={cn(
                    'w-[32px] h-[18px] rounded-full p-[2px]',
                    user?.telegram_chat_id ? 'bg-success flex justify-end' : 'bg-border-button flex justify-start',
                  )}
                >
                  <div className="w-[14px] h-[14px] rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <Modal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title={t('prefsModalTitle')}
        subtitle={t('prefsModalSubtitle')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-surface-2 rounded-[6px] border border-border-subtle">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-info-soft flex items-center justify-center">
                <Send className="w-4 h-4 text-info" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-secondary">{t('telegramTitle')}</div>
                <div className="text-xs text-text-placeholder">{t('telegramViaBotSubtitle')}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">{t('chatIdLabel')}</span>
              <span
                className={cn(
                  'text-xs font-mono font-semibold px-2.5 py-1 rounded-lg',
                  user?.telegram_chat_id ? 'bg-success-soft text-success-text' : 'bg-border-subtle text-text-placeholder',
                )}
              >
                {user?.telegram_chat_id || t('notSet')}
              </span>
            </div>
          </div>
          {!user?.telegram_chat_id && (
            <p className="text-xs text-gold-700 bg-gold-soft border border-gold-500/30 rounded-[6px] p-3">
              {t('telegramWarningPrefix')} <strong>{t('settingsLink')}</strong> {t('telegramWarningSuffix')}
            </p>
          )}
          <button
            onClick={() => setPrefsOpen(false)}
            className="w-full px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            {t('common.close')}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
