import { getInitials, cn } from '@/lib/utils';

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

const colors = [
  'from-[#284074] to-[#3d5a9e]',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
];

function getColor(name: string) {
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function Avatar({ name, size = 'md', className }: {
  name: string; size?: 'sm' | 'md' | 'lg'; className?: string;
}) {
  return (
    <div className={cn(
      'rounded-xl bg-gradient-to-br text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm select-none',
      getColor(name),
      sizes[size],
      className
    )}>
      {getInitials(name)}
    </div>
  );
}