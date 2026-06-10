import { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, subtitle, action }: {
  icon: LucideIcon; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="font-display font-600 text-slate-700 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${s[size]} border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin`} />
    </div>
  );
}

export default EmptyState;
