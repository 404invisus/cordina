import { LucideIcon, Plus, FilterX } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-[6px] bg-surface-2 border-2 border-dashed border-border flex items-center justify-center">
          <Icon className="w-8 h-8 text-text-placeholder" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-[5px] bg-white border border-border flex items-center justify-center shadow-card">
          <Plus className="w-3 h-3 text-text-tertiary" />
        </div>
      </div>
      <h3 className="text-base font-bold text-navy-800 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-text-tertiary mb-5 max-w-xs leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}

/** Empty state for a filtered/searched list that returned nothing — offers a way out. */
export function FilteredEmptyState({
  onClearFilters,
  title = 'No results',
  subtitle,
}: {
  onClearFilters: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-14 h-14 rounded-[6px] bg-surface-2 border border-border flex items-center justify-center mb-4">
        <FilterX className="w-6 h-6 text-text-placeholder" />
      </div>
      <h3 className="text-[13px] font-bold text-navy-800 mb-1">{title}</h3>
      <p className="text-[12px] text-text-tertiary mb-4 max-w-xs leading-relaxed">{subtitle ?? 'Nothing matches the current filters.'}</p>
      <button
        onClick={onClearFilters}
        className="h-[30px] px-3 rounded-[6px] border border-border-button bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
      >
        Clear filters
      </button>
    </motion.div>
  );
}

export function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative">
        <div className={`${s[size]} rounded-full border-2 border-border-subtle`} />
        <div className={`${s[size]} rounded-full border-2 border-transparent border-t-navy-700 animate-spin absolute inset-0`} />
        <div
          className={`${s[size]} rounded-full border-2 border-transparent border-r-navy-700/30 animate-spin absolute inset-0`}
          style={{ animationDuration: '1.5s' }}
        />
      </div>
      {label && <p className="text-xs font-medium text-text-tertiary animate-pulse">{label}</p>}
    </div>
  );
}

export default EmptyState;
