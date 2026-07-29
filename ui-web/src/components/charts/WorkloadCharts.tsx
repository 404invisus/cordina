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

  const dates = sprint?.start_date && sprint?.end_date ? generateDateRange(sprint.start_date, sprint.end_date) : [];

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
      ? Math.min(
          1,
          (new Date(date).getTime() - new Date(sprint.start_date).getTime()) /
            (new Date(today).getTime() - new Date(sprint.start_date).getTime() + 1),
        )
      : null;

    const completedSoFar = usePoints
      ? completed_by_day?.filter((d: any) => d.date <= date)?.reduce((s: number, x: any) => s + (x.points_completed || 0), 0) || 0
      : progressRatio !== null
        ? actualHours * progressRatio
        : null;

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
      <div className="flex flex-col items-center justify-center h-full text-border-button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p className="text-sm">No estimated hours yet</p>
        <p className="text-xs mt-1">Add estimated hours to tasks to view the burndown chart</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a6a094' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#a6a094' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: '#0d2b48', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: 12 }} />
        <Line type="monotone" dataKey="remaining" stroke="#14406a" strokeWidth={2.5} dot={false} name="Remaining" connectNulls={false} />
        <Line type="monotone" dataKey="ideal" stroke="#c0bcb4" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Ideal" />
      </LineChart>
    </ResponsiveContainer>
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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a6a094' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#a6a094' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: '#0d2b48', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: 12 }} />
        <Legend />
        <Bar dataKey="total" fill="#eceae4" radius={[6, 6, 0, 0]} name="Total" />
        <Bar dataKey="completed" fill="#14406a" radius={[6, 6, 0, 0]} name="Completed" />
      </BarChart>
    </ResponsiveContainer>
  );
}
