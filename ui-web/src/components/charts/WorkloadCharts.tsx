'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export function BurndownChart({ data, workloadData }: { data: any; workloadData?: any[] }) {
  if (!data) return null;
  const { sprint, total_points, completed_by_day } = data;

  const generateDateRange = (start: string, end: string) => {
    const dates: string[] = [];
    const cur = new Date(start);
    const endDate = new Date(end);
    while (cur <= endDate) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  const dates = sprint?.start_date && sprint?.end_date
    ? generateDateRange(sprint.start_date, sprint.end_date)
    : [];

  const totalDays = dates.length || 1;

  // Gunakan estimated_hours dari workload jika total_points = 0
  const totalHours = workloadData?.reduce((s: number, u: any) => s + (u.estimated_hours || 0), 0) || 0;
  const actualHours = workloadData?.reduce((s: number, u: any) => s + (u.actual_hours || 0), 0) || 0;
  const usePoints = total_points > 0;
  const total = usePoints ? total_points : totalHours;
  const unit = usePoints ? 'story points' : 'jam estimasi';

  const today = new Date().toISOString().slice(0, 10);

  const chartData = dates.map((date: string, i: number) => {
    const isPast = date <= today;
    // Simulasi burndown linear dari actual_hours untuk hari yang sudah lewat
    const progressRatio = isPast
      ? Math.min(1, (new Date(date).getTime() - new Date(sprint.start_date).getTime()) /
          (new Date(today).getTime() - new Date(sprint.start_date).getTime() + 1))
      : null;

    const completedSoFar = usePoints
      ? (completed_by_day?.filter((d: any) => d.date <= date)?.reduce((s: number, x: any) => s + (x.points_completed || 0), 0) || 0)
      : (progressRatio !== null ? actualHours * progressRatio : null);

    const remaining = completedSoFar !== null ? Math.max(0, total - completedSoFar) : null;
    const ideal = Math.max(0, Math.round((total - (total / totalDays) * (i + 1)) * 10) / 10);

    return {
      date: date.slice(5),
      remaining,
      ideal,
    };
  });

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="mb-4">
          <h3 className="font-bold text-slate-800">Burndown Chart</h3>
          <p className="text-xs text-slate-400 mt-0.5">{sprint?.name}</p>
        </div>
        <div className="flex flex-col items-center justify-center h-48 text-slate-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <p className="text-sm">Belum ada estimasi jam</p>
          <p className="text-xs mt-1">Tambahkan estimasi jam pada task untuk melihat burndown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800">Burndown Chart</h3>
        <p className="text-xs text-slate-400 mt-0.5">{sprint?.name} • {total} {unit}</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }} />
          <Line type="monotone" dataKey="remaining" stroke="#284074" strokeWidth={2.5} dot={false} name="Remaining" connectNulls={false} />
          <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Ideal" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VelocityChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((s: any) => ({
    name: s.sprint_name?.slice(0, 12) || s.name?.slice(0, 12),
    completed: parseFloat(s.completed_points) || 0,
    total: parseFloat(s.total_points) || 0,
  }));
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800">Velocity Chart</h3>
        <p className="text-xs text-slate-400 mt-0.5">Estimasi jam per sprint</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }} />
          <Legend />
          <Bar dataKey="total" fill="#e2e8f0" radius={[6, 6, 0, 0]} name="Total" />
          <Bar dataKey="completed" fill="#284074" radius={[6, 6, 0, 0]} name="Completed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
