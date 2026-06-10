import { LucideIcon } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, actions }: {
  title: string; subtitle?: string; icon?: LucideIcon; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#284074]/10">
            <Icon className="w-5 h-5 text-[#284074]" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}