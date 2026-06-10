import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyState({ icon: Icon, title, subtitle, action }: {
  icon: LucideIcon; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
          <Icon className="w-8 h-8 text-slate-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-slate-400">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 mb-5 max-w-xs leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}

export function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative">
        <div className={`${s[size]} rounded-full border-2 border-slate-100`} />
        <div className={`${s[size]} rounded-full border-2 border-transparent border-t-[#284074] animate-spin absolute inset-0`} />
      </div>
      {label && <p className="text-xs font-medium text-slate-400">{label}</p>}
    </div>
  );
}

export default EmptyState;