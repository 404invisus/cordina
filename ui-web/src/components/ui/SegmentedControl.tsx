'use client';
import { cn } from '@/lib/utils';

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-[5px]', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-[26px] flex items-center gap-1.5 px-[10px] rounded-[4px] text-[11.5px] transition-colors',
              active ? 'bg-navy-700 text-white font-semibold' : 'text-text-tertiary font-medium hover:bg-neutral-soft',
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn('font-mono text-[10px]', active ? 'text-white/70' : 'text-text-placeholder')}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
