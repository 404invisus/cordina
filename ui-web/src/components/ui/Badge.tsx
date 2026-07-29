import { cn } from '@/lib/utils';
import { STATUS_MAP, type StatusTone } from '@/lib/status';

/**
 * One badge shape for every status/category across the app — dot + pill.
 * Colors always resolve through STATUS_MAP; never a per-module variant.
 */
export default function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  const t = STATUS_MAP[tone];
  return (
    <span className={cn('inline-flex items-center gap-[5px] h-5 px-2 rounded-[3px] text-[10.5px] font-semibold', t.bg, t.text, className)}>
      <span className={cn('w-[5px] h-[5px] rounded-full flex-none', t.dot)} />
      {children}
    </span>
  );
}

/** Category/type tag — same pill shape, no dot (e.g. "Contract", "Sheet", "PDF"). */
export function TagBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded-[3px] text-[10.5px] font-semibold bg-neutral-soft text-neutral-text',
        className,
      )}
    >
      {children}
    </span>
  );
}
