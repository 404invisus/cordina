import { LucideIcon } from 'lucide-react';

export default function PageHeader({ title, subtitle, section, actions }: {
  title: string;
  subtitle?: string;
  section?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5 gap-5">
      <div className="flex flex-col gap-1 min-w-0">
        {section && (
          <div className="font-mono text-[9.5px] font-semibold tracking-[0.16em] uppercase text-accent">
            {section}
          </div>
        )}
        <h1
          className="font-display font-semibold leading-[1.1] tracking-[-0.01em] text-[#0d2b48]"
          style={{ fontSize: '23px' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12.5px] text-slate-500 leading-snug">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
