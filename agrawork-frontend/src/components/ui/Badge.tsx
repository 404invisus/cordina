import { cn } from '@/lib/utils';

export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('badge', className)}>{children}</span>;
}
