import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };

export default function Avatar({ name, size = 'md', className }: {
  name: string; size?: 'sm' | 'md' | 'lg'; className?: string;
}) {
  return (
    <div className={cn('rounded-xl bg-[#284074] text-white font-600 flex items-center justify-center flex-shrink-0', sizes[size], className)}>
      {getInitials(name)}
    </div>
  );
}
