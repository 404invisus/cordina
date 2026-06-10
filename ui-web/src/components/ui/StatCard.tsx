import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'default';
  index?: number;
}

const colorMap = {
  default: { grad: 'from-[#284074] to-[#3d5a9e]', soft: 'bg-[#284074]/8', text: 'text-[#284074]' },
  blue:    { grad: 'from-blue-500 to-blue-600',    soft: 'bg-blue-50',     text: 'text-blue-600' },
  green:   { grad: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50',  text: 'text-emerald-600' },
  orange:  { grad: 'from-orange-500 to-amber-500', soft: 'bg-orange-50',   text: 'text-orange-600' },
  purple:  { grad: 'from-violet-500 to-purple-600',soft: 'bg-violet-50',   text: 'text-violet-600' },
  red:     { grad: 'from-red-500 to-rose-600',     soft: 'bg-red-50',      text: 'text-red-600' },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'default', index = 0 }: StatCardProps) {
  const c = colorMap[color];
  const isUp = trend && trend.value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
      className="relative bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] -translate-y-6 translate-x-6"
        style={{ background: `linear-gradient(135deg, #284074, #3d5a9e)` }} />

      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm', c.grad)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          )}>
            {isUp ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
              </svg>
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-slate-900 mb-0.5 tabular-nums">{value}</div>
      <div className="text-sm font-semibold text-slate-600">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
      {trend && (
        <div className="text-xs text-slate-400 mt-0.5">{trend.label}</div>
      )}
    </motion.div>
  );
}