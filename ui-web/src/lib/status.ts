import { commonDict } from '@/lib/i18n/common-dict';
import type { Locale } from '@/lib/i18n/types';

export type StatusTone = 'success' | 'pending' | 'info' | 'danger' | 'neutral';

/**
 * One semantic status rule for every module (project, task, CR, document,
 * asset, workload, notification). Badge colors always resolve through this —
 * never a per-module color map. Gold ("pending") doubles as the CTA color:
 * it means a human must act, nothing else.
 */
export const STATUS_MAP: Record<StatusTone, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-success-soft', text: 'text-success-text', dot: 'bg-success' },
  pending: { bg: 'bg-pending-soft', text: 'text-pending-text', dot: 'bg-pending' },
  info: { bg: 'bg-info-soft', text: 'text-info-text', dot: 'bg-info' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger-text', dot: 'bg-danger' },
  neutral: { bg: 'bg-neutral-soft', text: 'text-neutral-text', dot: 'bg-neutral' },
};

/** Maps every raw status/priority string used across the app to one of the 5 tones. */
const TONE_BY_STATUS: Record<string, StatusTone> = {
  // neutral — draft / not started / archived
  todo: 'neutral',
  planned: 'neutral',
  draft: 'neutral',
  on_hold: 'neutral',
  archived: 'neutral',
  low: 'neutral',

  // info — in motion
  in_progress: 'info',
  active: 'info',
  submitted: 'info',
  review: 'info',
  medium: 'info',

  // success — done / approved / signed / healthy
  done: 'success',
  completed: 'success',
  approved: 'success',
  signed: 'success',
  on_track: 'success',
  good: 'success',

  // pending — awaiting a human action (= gold, = CTA)
  pending: 'pending',
  pending_signature: 'pending',
  awaiting: 'pending',
  awaiting_approval: 'pending',
  in_review: 'pending',

  // danger — at risk / rejected / overloaded / expired
  rejected: 'danger',
  revoked: 'danger',
  at_risk: 'danger',
  overdue: 'danger',
  blocked: 'danger',
  expired: 'danger',
  overloaded: 'danger',
  critical: 'danger',
  high: 'danger',
};

export function getStatusTone(status: string | null | undefined): StatusTone {
  if (!status) return 'neutral';
  return TONE_BY_STATUS[status.toLowerCase()] ?? 'neutral';
}

export function getStatusLabel(status: string | null | undefined, locale: Locale = 'en'): string {
  if (!status) return '—';
  const key = `status_${status.toLowerCase()}`;
  const mapped = commonDict[locale][key] ?? commonDict.en[key];
  if (mapped) return mapped;
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
