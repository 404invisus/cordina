import { getInitials, cn } from '@/lib/utils';

const sizes = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-[12.5px]',
  lg: 'w-11 h-11 text-[14px]',
};

export default function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[5px] bg-navy-700 text-white font-bold flex items-center justify-center flex-shrink-0 select-none',
        sizes[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
