'use client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, CheckCircle2, XCircle, Wrench, ChevronRight } from 'lucide-react';
import { changeRequestService } from '@/lib/api';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = [
  { key: 'draft', label: 'Draft', color: 'bg-border-subtle text-text-secondary', icon: FileText },
  { key: 'submitted', label: 'Submitted', color: 'bg-pending-soft text-pending-text', icon: Clock },
  { key: 'approved', label: 'Approved', color: 'bg-success-soft text-success-text', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', color: 'bg-danger-soft text-danger-text', icon: XCircle },
  { key: 'implemented', label: 'Implemented', color: 'bg-info-soft text-info-text', icon: Wrench },
];

export default function CRSummaryCard() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['cr-summary'],
    queryFn: () => changeRequestService.summary().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading)
    return (
      <div className="bg-white rounded-[6px] border border-border-subtle p-5 mb-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-border-subtle rounded w-1/3" />
          <div className="grid grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-border-subtle rounded-[6px]" />
            ))}
          </div>
        </div>
      </div>
    );

  const byStatus = data?.by_status || {};
  const total = data?.total || 0;

  return (
    <div className="bg-white rounded-[6px] border border-border-subtle p-5 mb-5 hover:border-border transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-navy-700/10 rounded-[6px] flex items-center justify-center">
            <FileText className="w-4 h-4 text-navy-700" />
          </div>
          <div>
            <div className="text-sm font-bold text-navy-800">Change Request</div>
            <div className="text-xs text-text-placeholder">{total} total CR</div>
          </div>
        </div>
        <button
          onClick={() => router.push('/change-management')}
          className="flex items-center gap-1 text-xs text-navy-700 font-semibold hover:underline"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {STATUS_CONFIG.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => router.push(`/change-management?status=${key}`)}
            className="flex flex-col items-center p-2.5 rounded-[6px] bg-surface-2 hover:bg-border-subtle transition-colors text-center"
          >
            <div className={`text-xl font-bold mb-1 ${byStatus[key] > 0 ? 'text-navy-800' : 'text-border-button'}`}>
              {byStatus[key] || 0}
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
