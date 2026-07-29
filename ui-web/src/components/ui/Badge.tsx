import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-success-soft text-emerald-700',
  warning: 'bg-warning-soft text-amber-700',
  danger:  'bg-danger-soft text-red-700',
  info:    'bg-info-soft text-blue-700',
  purple:  'bg-violet-50 text-violet-700',
  outline: 'bg-white border border-slate-200 text-slate-600',
};

export default function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
