'use client';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  /** 0–100. Omit to show a full bar. */
  progress?: number;
  trend?: { value: number; label: string };
  color?: 'default' | 'blue' | 'brand' | 'green' | 'orange' | 'purple' | 'red';
  index?: number;
}

const colorMap: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    bar: string;
    subtitleColor: string;
  }
> = {
  default: { iconBg: 'bg-info-soft', iconColor: 'text-navy-700', bar: 'bg-navy-700', subtitleColor: 'text-text-tertiary' },
  blue: { iconBg: 'bg-info-soft', iconColor: 'text-navy-700', bar: 'bg-navy-700', subtitleColor: 'text-text-tertiary' },
  brand: { iconBg: 'bg-info-soft', iconColor: 'text-navy-700', bar: 'bg-navy-700', subtitleColor: 'text-text-tertiary' },
  green: { iconBg: 'bg-success-soft', iconColor: 'text-success', bar: 'bg-success', subtitleColor: 'text-text-tertiary' },
  orange: { iconBg: 'bg-gold-soft', iconColor: 'text-gold-500', bar: 'bg-gold-500', subtitleColor: 'text-gold-700' },
  purple: { iconBg: 'bg-navy-700/8', iconColor: 'text-navy-700', bar: 'bg-navy-700', subtitleColor: 'text-text-tertiary' },
  red: { iconBg: 'bg-danger-soft', iconColor: 'text-danger', bar: 'bg-danger', subtitleColor: 'text-danger' },
};

export default function StatCard({ title, value, subtitle, icon: Icon, progress, trend, color = 'default', index = 0 }: StatCardProps) {
  const c = colorMap[color] ?? colorMap.default;
  const barWidth = progress !== undefined ? Math.max(1, Math.min(100, progress)) : 100;
  const isUp = trend && trend.value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 220, damping: 22 }}
      className="bg-white border border-border rounded-[6px] px-[14px] py-3 flex flex-col gap-2"
    >
      {/* Title + icon */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10.5px] font-semibold tracking-[0.03em] text-text-tertiary uppercase leading-none">{title}</div>
        <div className={cn('w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0', c.iconBg)}>
          <Icon className={cn('w-3.5 h-3.5', c.iconColor)} />
        </div>
      </div>

      {/* Value + subtitle */}
      <div className="flex items-baseline gap-[7px]">
        <span className="font-display font-semibold leading-none text-[25px] text-navy-900 tabular-nums">{value}</span>
        {subtitle && <span className={cn('text-[11px] font-semibold leading-none', c.subtitleColor)}>{subtitle}</span>}
      </div>

      {/* Progress bar */}
      <div className="h-[3px] rounded-full bg-border-subtle overflow-hidden">
        <div className={cn('h-full rounded-full', c.bar)} style={{ width: `${barWidth}%` }} />
      </div>

      {/* Trend badge (optional, backward compat) */}
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 text-[10px] font-semibold self-start px-2 py-0.5 rounded',
            isUp ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </motion.div>
  );
}
