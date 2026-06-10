'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { projectService } from '@/lib/api';
import { getStatusLabel, formatDate } from '@/lib/utils';

const sprintStatusConfig: Record<string, { bg: string; text: string; bar: string; dot: string }> = {
  active:    { bg: 'bg-blue-50',   text: 'text-blue-700',  bar: 'from-[#284074] to-[#3d5a9e]', dot: 'bg-[#284074]' },
  completed: { bg: 'bg-green-50',  text: 'text-green-700', bar: 'from-green-500 to-emerald-400', dot: 'bg-green-500' },
  planned:   { bg: 'bg-slate-100', text: 'text-slate-600', bar: 'from-slate-400 to-slate-300',  dot: 'bg-slate-400' },
};

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['roadmap', id],
    queryFn: () => projectService.roadmap(id).then(r => r.data.data),
  });

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  const sprints = roadmap?.sprints || [];
  const today = new Date();

  const allDates = sprints.flatMap((s: any) => [new Date(s.start_date), new Date(s.end_date)]);
  const minDate = allDates.length
    ? new Date(Math.min(...allDates.map((d: Date) => d.getTime())))
    : new Date();
  const maxDate = allDates.length
    ? new Date(Math.max(...allDates.map((d: Date) => d.getTime())))
    : new Date();

  const pad = 86400000 * 3;
  const rangeStart = new Date(minDate.getTime() - pad);
  const rangeEnd   = new Date(maxDate.getTime() + pad);
  const totalMs    = rangeEnd.getTime() - rangeStart.getTime();

  const pct = (date: Date) =>
    Math.max(0, Math.min(100, ((date.getTime() - rangeStart.getTime()) / totalMs) * 100));

  const monthLabels: { label: string; left: number }[] = [];
  const cursor = new Date(rangeStart);
  cursor.setDate(1);
  while (cursor <= rangeEnd) {
    monthLabels.push({
      label: cursor.toLocaleString('id-ID', { month: 'short', year: '2-digit' }),
      left: pct(cursor),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const todayPct = pct(today);
  const showToday = todayPct >= 0 && todayPct <= 100;

  return (
    <AppLayout>
      <div className="mb-5">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#284074] transition-colors font-medium mb-4"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali ke Project
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#284074]/10 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#284074]">
                <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <path d="M18 9a9 9 0 01-9 9"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Roadmap</h1>
              <p className="text-sm text-slate-400 mt-0.5">{sprints.length} sprint · Timeline visual</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {Object.entries(sprintStatusConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="capitalize">{getStatusLabel(key)}</span>
              </div>
            ))}
            {showToday && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span>Hari ini</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-slate-300">
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M18 9a9 9 0 01-9 9"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-400">Belum ada sprint</p>
          <p className="text-xs text-slate-300 mt-1">Buat sprint untuk melihat roadmap</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 800 }} className="p-6">

              <div className="relative h-8 mb-1">
                {monthLabels.map((m, i) => (
                  <div
                    key={i}
                    className="absolute text-xs font-semibold text-slate-400"
                    style={{ left: `${m.left}%` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex">
                  {monthLabels.map((_, i) => (
                    <div key={i} className="flex-1 border-l border-slate-100 first:border-l-0" />
                  ))}
                </div>

                {showToday && (
                  <div
                    className="absolute top-0 bottom-0 z-10"
                    style={{ left: `${todayPct}%` }}
                  >
                    <div className="relative h-full">
                      <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        Hari ini
                      </div>
                      <div className="absolute top-6 bottom-0 left-0 w-px bg-red-400 border-l-2 border-dashed border-red-300" />
                    </div>
                  </div>
                )}

                <div className="pt-8 space-y-3">
                  {sprints.map((s: any, i: number) => {
                    const cfg = sprintStatusConfig[s.status] || sprintStatusConfig.planned;
                    const left = pct(new Date(s.start_date));
                    const right = pct(new Date(s.end_date));
                    const width = right - left;
                    const sprintDays = Math.round((new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) / 86400000);

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="relative flex items-center h-11"
                      >
                        <div
                          className="absolute h-full flex items-center group"
                          style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                        >
                          <div className={`relative h-9 w-full rounded-xl bg-gradient-to-r ${cfg.bar} shadow-sm flex items-center px-3 gap-2 overflow-hidden`}>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-white/80 flex-shrink-0">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span className="text-xs font-bold text-white truncate">{s.name}</span>
                            {width > 12 && (
                              <span className="ml-auto text-xs text-white/70 flex-shrink-0">{sprintDays}h</span>
                            )}
                          </div>

                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                            <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-nowrap">
                              <div className="font-bold mb-1">{s.name}</div>
                              <div className="text-slate-300">{formatDate(s.start_date)} → {formatDate(s.end_date)}</div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                                  {getStatusLabel(s.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className="absolute right-0 text-xs text-slate-400 font-medium"
                          style={{ paddingRight: 4 }}
                        >
                          {formatDate(s.end_date)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="grid gap-2">
                  {sprints.map((s: any) => {
                    const cfg = sprintStatusConfig[s.status] || sprintStatusConfig.planned;
                    const sprintDays = Math.round((new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) / 86400000);
                    return (
                      <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <span className="text-sm font-semibold text-slate-700 w-36 truncate">{s.name}</span>
                        <span className="text-xs text-slate-400">{formatDate(s.start_date)}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-slate-300 flex-shrink-0">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <span className="text-xs text-slate-400">{formatDate(s.end_date)}</span>
                        <span className="text-xs text-slate-400 ml-auto">{sprintDays} hari</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {getStatusLabel(s.status)}
                        </span>
                        {s.goal && (
                          <span className="text-xs text-slate-400 italic truncate max-w-xs">{s.goal}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}