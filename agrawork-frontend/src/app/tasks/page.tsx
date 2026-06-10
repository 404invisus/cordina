'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import { taskService } from '@/lib/api';
import { getStatusColor, getStatusLabel, getPriorityColor, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { user, hasRole } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const canCreate = hasRole(['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master']);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: () => taskService.list(statusFilter !== 'all' ? { status: statusFilter } : {}).then(r => r.data.data),
  });

  const filtered = tasks?.filter((t: any) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const assignMutation = useMutation({
    mutationFn: ({ id, assignee_id }: any) => taskService.assign(id, assignee_id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task di-assign!'); setSelectedTask(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  return (
    <AppLayout>
      <PageHeader
        title="Tasks"
        subtitle={`${tasks?.length || 0} task`}
        icon={CheckSquare}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-48 text-sm" placeholder="Cari task..." />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-36 text-sm">
              <option value="all">Semua Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        }
      />

      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Tidak ada task" subtitle="Buat task dari halaman board project" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Task', 'Status', 'Priority', 'Due Date', 'Jam', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/tasks/${t.id}`} className="text-sm font-medium text-slate-800 hover:text-[#284074] transition-colors">{t.title}</Link>
                    {t.type && <div className="text-xs text-slate-400 mt-0.5 capitalize">{t.type}</div>}
                  </td>
                  <td className="px-5 py-3.5"><span className={`badge ${getStatusColor(t.status)}`}>{getStatusLabel(t.status)}</span></td>
                  <td className="px-5 py-3.5"><span className={`badge border ${getPriorityColor(t.priority)}`}>{t.priority}</span></td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{t.due_date ? formatDate(t.due_date) : '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    <span className="font-mono">{t.actual_hours || 0}</span>
                    <span className="text-slate-300">/{t.estimated_hours || 0}h</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/tasks/${t.id}`} className="text-sm text-[#284074] font-medium">Detail →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
