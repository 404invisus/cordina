import { LucideIcon } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, actions }: {
  title: string; subtitle?: string; icon?: LucideIcon; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-[#284074]/10 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#284074]" />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-700 text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
