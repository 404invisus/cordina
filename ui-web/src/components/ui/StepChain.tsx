import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepChainStep = {
  label: string;
  assignee?: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
};

/** Horizontal approval-chain visual — used by Change Management, e-Sign, TTE Distribution. */
export default function StepChain({ steps, className }: { steps: StepChainStep[]; className?: string }) {
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1 relative">
          {i > 0 && (
            <div
              className={cn(
                'absolute top-[11px] h-[2px]',
                steps[i - 1].status === 'completed'
                  ? 'bg-success'
                  : steps[i - 1].status === 'rejected'
                    ? 'bg-danger'
                    : 'bg-border',
              )}
              style={{ left: 'calc(-50% + 14px)', right: 'calc(50% + 14px)' }}
            />
          )}

          <div
            className={cn(
              'w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-none font-mono text-[9.5px] font-bold',
              step.status === 'completed' && 'bg-success border-success',
              step.status === 'rejected' && 'bg-danger border-danger',
              step.status === 'current' && 'bg-gold-500 border-gold-500 text-navy-800',
              step.status === 'pending' && 'bg-white border-border-button text-text-meta',
            )}
          >
            {step.status === 'completed' && <Check className="w-3 h-3 text-white" strokeWidth={2.6} />}
            {step.status === 'rejected' && <X className="w-3 h-3 text-white" strokeWidth={2.6} />}
            {(step.status === 'current' || step.status === 'pending') && i + 1}
          </div>

          <div className="text-center px-1">
            <div
              className={cn(
                'text-[11px] font-semibold leading-tight',
                step.status === 'pending'
                  ? 'text-text-placeholder'
                  : step.status === 'rejected'
                    ? 'text-danger-text'
                    : 'text-navy-800',
              )}
            >
              {step.label}
            </div>
            {step.assignee && <div className="font-mono text-[9px] tracking-[0.06em] text-text-meta uppercase mt-0.5">{step.assignee}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
