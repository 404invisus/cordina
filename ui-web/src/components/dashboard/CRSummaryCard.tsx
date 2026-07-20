'use client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, CheckCircle2, XCircle, Wrench, ChevronRight } from 'lucide-react';
import { changeRequestService } from '@/lib/api';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = [
  { key: 'draft',       label: 'Draft',        color: 'bg-slate-100 text-slate-600',     icon: FileText },
  { key: 'submitted',   label: 'Diajukan',     color: 'bg-amber-100 text-amber-700',     icon: Clock },
  { key: 'approved',    label: 'Disetujui',    color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  { key: 'rejected',    label: 'Ditolak',      color: 'bg-red-100 text-red-700',         icon: XCircle },
  { key: 'implemented', label: 'Implemented',  color: 'bg-blue-100 text-blue-700',       icon: Wrench },
];

export default function CRSummaryCard() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['cr-summary'],
    queryFn: () => changeRequestService.summary().then(r => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  const byStatus = data?.by_status || {};
  const total = data?.total || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5 hover:border-slate-200 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#284074]/10 rounded-xl flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#284074]" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Change Request</div>
            <div className="text-xs text-slate-400">{total} total CR</div>
          </div>
        </div>
        <button onClick={() => router.push('/change-management')}
          className="flex items-center gap-1 text-xs text-[#284074] font-semibold hover:underline">
          Lihat semua <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {STATUS_CONFIG.map(({ key, label, color }) => (
          <button key={key} onClick={() => router.push(`/change-management?status=${key}`)}
            className="flex flex-col items-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-center">
            <div className={`text-xl font-bold mb-1 ${byStatus[key] > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
              {byStatus[key] || 0}
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
