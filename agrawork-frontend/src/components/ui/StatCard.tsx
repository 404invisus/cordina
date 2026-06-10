import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  index?: number;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-600' },
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-600' },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', index = 0 }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
      <div className="font-display text-3xl font-700 text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </motion.div>
  );
}
