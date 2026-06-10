'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { GitBranch, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService } from '@/lib/api';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['roadmap', id],
    queryFn: () => projectService.roadmap(id).then(r => r.data.data),
  });

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  const sprints = roadmap?.sprints || [];
  const today = new Date();

  // Calculate date range
  const allDates = sprints.flatMap((s: any) => [new Date(s.start_date), new Date(s.end_date)]);
  const minDate = allDates.length ? new Date(Math.min(...allDates.map((d: Date) => d.getTime()))) : today;
  const maxDate = allDates.length ? new Date(Math.max(...allDates.map((d: Date) => d.getTime()))) : today;
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const getLeftPercent = (date: string) => {
    const d = new Date(date);
    return ((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
  };
  const getWidthPercent = (start: string, end: string) => {
    const s = new Date(start), e = new Date(end);
    return ((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
  };

  return (
    <AppLayout>
      <div className="mb-4">
        <Link href={`/projects/${id}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#284074]">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Project
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#284074]/10 rounded-xl flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-[#284074]" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-700 text-slate-900">Roadmap</h1>
          <p className="text-sm text-slate-500">Timeline sprint dan epics</p>
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">Belum ada data roadmap</div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header months */}
            <div className="relative h-8 mb-2 border-b border-slate-100">
              {[...Array(Math.ceil(totalDays / 30))].map((_, i) => {
                const d = new Date(minDate);
                d.setDate(d.getDate() + i * 30);
                return (
                  <div key={i} className="absolute text-xs text-slate-400"
                    style={{ left: `${(i * 30 / totalDays) * 100}%` }}>
                    {d.toLocaleString('id-ID', { month: 'short', year: '2-digit' })}
                  </div>
                );
              })}
              {/* Today line */}
              <div className="absolute top-0 bottom-0 w-px bg-red-400"
                style={{ left: `${getLeftPercent(today.toISOString())}%` }}>
                <div className="absolute -top-1 -translate-x-1/2 text-xs text-red-400 font-medium">Today</div>
              </div>
            </div>

            {/* Sprints */}
            <div className="space-y-3">
              {sprints.map((s: any) => (
                <div key={s.id} className="relative h-10">
                  <div className="absolute inset-y-0 flex items-center" style={{ left: `${getLeftPercent(s.start_date)}%`, width: `${getWidthPercent(s.start_date, s.end_date)}%` }}>
                    <div className={`h-8 w-full rounded-lg flex items-center px-3 text-xs font-medium text-white shadow-sm ${s.status === 'completed' ? 'bg-green-500' : s.status === 'active' ? 'bg-[#284074]' : 'bg-slate-400'}`}>
                      <span className="truncate">{s.name}</span>
                    </div>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400 pr-2">
                    {formatDate(s.start_date)}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100">
              {[
                { color: 'bg-[#284074]', label: 'Active' },
                { color: 'bg-green-500', label: 'Completed' },
                { color: 'bg-slate-400', label: 'Planned' },
                { color: 'bg-red-400', label: 'Today' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className={`w-3 h-3 rounded ${l.color}`} />{l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
