'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatDate } from '@/lib/utils';

export function BurndownChart({ data }: { data: any }) {
  if (!data) return null;
  const { sprint, total_points, completed_by_day } = data;

  const chartData = completed_by_day?.map((d: any, i: number) => ({
    date: d.date,
    remaining: Math.max(0, total_points - completed_by_day.slice(0, i + 1).reduce((s: number, x: any) => s + (x.points_completed || 0), 0)),
    ideal: Math.round(total_points - (total_points / (completed_by_day.length)) * (i + 1)),
  })) || [];

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-600 text-slate-800">Burndown Chart</h3>
        <p className="text-xs text-slate-400 mt-0.5">{sprint?.name} • {total_points} story points</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Line type="monotone" dataKey="remaining" stroke="#284074" strokeWidth={2} dot={false} name="Remaining" />
          <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Ideal" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VelocityChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((s: any) => ({
    name: s.name?.slice(0, 10),
    completed: s.completed_points || 0,
    total: s.total_points || 0,
  }));

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-600 text-slate-800">Velocity Chart</h3>
        <p className="text-xs text-slate-400 mt-0.5">Story points per sprint</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Legend />
          <Bar dataKey="completed" fill="#284074" radius={[4, 4, 0, 0]} name="Completed" />
          <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
