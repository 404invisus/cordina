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

const TYPE_CFG: Record<string, NotifConfig> = {
  'tte.sign_requested': {
    label: 'Signature requested',
    Icon: PenLine,
    iconBg: '#fbf3e0',
    iconColor: '#8a6209',
    cta: 'Sign now',
    ctaPrimary: true,
    needsAction: true,
  },
  'change_request.submitted': {
    label: 'Approval needed',
    Icon: Clock,
    iconBg: '#fbf3e0',
    iconColor: '#8a6209',
    cta: 'Review',
    ctaPrimary: true,
    needsAction: true,
  },
  'calendar.event_assigned': { label: 'Meeting invite', Icon: CalendarDays, iconBg: '#eaf1f8', iconColor: '#14406a', cta: 'Open agenda' },
  'task.commented': { label: 'Mention', Icon: AtSign, iconBg: '#fdeceb', iconColor: '#a3231c', cta: 'Reply' },
  'tte.signed': { label: 'Document signed', Icon: CheckCircle, iconBg: '#e9f4ee', iconColor: '#0f6144', cta: 'Download' },
  'sprint.completed': { label: 'Sprint closed', Icon: BarChart2, iconBg: '#f1f0ed', iconColor: '#5c6470', cta: 'View report' },
  'document.expiring': { label: 'Document expiring', Icon: FileWarning, iconBg: '#fbf3e0', iconColor: '#8a6209', cta: 'Open' },
  'task.assigned': { label: 'Task assigned', Icon: CheckSquare, iconBg: '#eaf1f8', iconColor: '#14406a', cta: 'Open' },
  'change_request.approved': { label: 'CR approved', Icon: CheckCircle, iconBg: '#e9f4ee', iconColor: '#0f6144', cta: 'View' },
  'change_request.rejected': { label: 'CR rejected', Icon: FileWarning, iconBg: '#fdeceb', iconColor: '#a3231c', cta: 'View' },
  'sprint.started': { label: 'Sprint started', Icon: BarChart2, iconBg: '#e9f4ee', iconColor: '#0f6144' },
  'calendar.event_created': { label: 'New event', Icon: CalendarDays, iconBg: '#eaf1f8', iconColor: '#14406a', cta: 'Open' },
  'task.status_changed': { label: 'Status changed', Icon: CheckSquare, iconBg: '#f1f0ed', iconColor: '#5c6470' },
};

function getCfg(type: string): NotifConfig {
  return TYPE_CFG[type] ?? { label: type, Icon: Bell, iconBg: '#f1f0ed', iconColor: '#5c6470' };
}

function fmtTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso: string) {
  if (!iso) return 'Earlier';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())
    return `TODAY · ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toUpperCase()}`;
  if (d.toDateString() === yesterday.toDateString())
    return `YESTERDAY · ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toUpperCase()}`;
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

function groupByDay(notifications: any[]) {
  const groups: { label: string; items: any[] }[] = [];
  const seen: Record<string, number> = {};
  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    if (seen[d] === undefined) {
      seen[d] = groups.length;
      groups.push({ label: dayLabel(n.created_at), items: [] });
    }
    groups[seen[d]].items.push(n);
  }
  return groups;
}

type Tab = 'needs_action' | 'unread' | 'all' | 'mentions';

export default function NotificationsPage() {
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
  const needsActionList = notifications.filter((n) => getCfg(n.type).needsAction);
  const mentionList = notifications.filter((n) => n.type === 'task.commented');

  const filtered =
    tab === 'needs_action'
      ? needsActionList
      : tab === 'unread'
        ? notifications.filter((n) => n.status === 'sent')
        : tab === 'mentions'
          ? mentionList
          : notifications;

  const groups = groupByDay(filtered);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'needs_action', label: 'Needs action' },
    { id: 'unread', label: 'Unread' },
    { id: 'all', label: 'All' },
    { id: 'mentions', label: 'Mentions' },
  ];

  return (
    <AppLayout>
      <PageHeader
        section="INBOX"
        title="Notifications"
        subtitle={`${unreadCount} unread · ${needsActionList.length} need an action from you · nothing is marked read automatically`}
        actions={
          <>
            <button
              onClick={() => setPrefsOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
            >
              Preferences
            </button>
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="h-[34px] flex items-center gap-[6px] px-[13px] border border-border-button rounded-[6px] bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              Mark all as read
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
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'h-[26px] flex items-center px-[10px] rounded-[4px] text-[11.5px] transition-colors',
                    tab === t.id ? 'bg-navy-700 text-white font-semibold' : 'text-text-tertiary font-medium hover:bg-neutral-soft',
                  )}
                >
                  {t.label}
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
              title="No notifications"
              subtitle={tab === 'needs_action' ? 'Nothing needs your action right now' : 'No notifications to show'}
            />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="h-[28px] flex items-center px-[15px] bg-surface-2 border-b border-border-subtle font-mono text-[9.5px] font-semibold tracking-[0.12em] text-neutral">
                    {group.label}
                  </div>
                  {group.items.map((n, i) => {
                    const cfg = getCfg(n.type);
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
                            <span className="font-mono text-[10px] text-text-meta">{fmtTime(n.created_at)}</span>
                          </div>
                          {meta && <span className="text-[11.5px] text-text-tertiary">{meta}</span>}
                        </div>
                        <div className="flex items-center gap-[7px] flex-none">
                          {cfg.cta && (
                            <button
                              className={cn(
                                'h-[26px] flex items-center px-[10px] rounded-[5px] text-[11px] font-semibold',
                                cfg.ctaPrimary ? 'bg-navy-700 text-white' : 'border border-border-button bg-white text-text-secondary',
                              )}
                            >
                              {cfg.cta}
                            </button>
                          )}
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
                Showing {filtered.length} of {total} · grouped by day
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
              <span className="text-[12.5px] font-semibold text-navy-900">Delivery channels</span>
            </div>
            <div className="px-[14px] py-[12px] flex flex-col gap-[11px]">
              {/* In-app */}
              <div className="flex items-center gap-[9px]">
                <div className="w-[28px] h-[28px] rounded-[5px] bg-success-soft flex items-center justify-center">
                  <Mail className="w-[14px] h-[14px] text-success" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-navy-800">In-app</div>
                  <div className="text-[10.5px] text-neutral">Always on</div>
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
                  <div className="text-[12px] font-semibold text-navy-800">Telegram</div>
                  <div className={cn('text-[10.5px]', user?.telegram_chat_id ? 'text-success-text' : 'text-neutral')}>
                    {user?.telegram_chat_id ? `Connected · ${user.telegram_chat_id}` : 'Not connected'}
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
        title="Notification Preferences"
        subtitle="Configure your notification channels"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-surface-2 rounded-[6px] border border-border-subtle">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-info-soft flex items-center justify-center">
                <Send className="w-4 h-4 text-info" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-secondary">Telegram</div>
                <div className="text-xs text-text-placeholder">Notifications via Telegram bot</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">Chat ID</span>
              <span
                className={cn(
                  'text-xs font-mono font-semibold px-2.5 py-1 rounded-lg',
                  user?.telegram_chat_id ? 'bg-success-soft text-success-text' : 'bg-border-subtle text-text-placeholder',
                )}
              >
                {user?.telegram_chat_id || 'Not set'}
              </span>
            </div>
          </div>
          {!user?.telegram_chat_id && (
            <p className="text-xs text-gold-700 bg-gold-soft border border-gold-500/30 rounded-[6px] p-3">
              Telegram Chat ID not set. Configure it in <strong>Settings</strong> to enable Telegram notifications.
            </p>
          )}
          <button
            onClick={() => setPrefsOpen(false)}
            className="w-full px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
