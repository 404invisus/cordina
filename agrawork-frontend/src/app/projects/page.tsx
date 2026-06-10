'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Search, LayoutGrid, List, Users, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => projectService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project berhasil dibuat!'); reset(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal membuat project'),
  });
  return (
    <Modal open={open} onClose={onClose} title="Buat Project Baru" size="md">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Project</label>
          <input {...register('name', { required: 'Wajib diisi' })} className="input-field" placeholder="Nama project..." />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
          <textarea {...register('description')} className="input-field h-20 resize-none" placeholder="Deskripsi project..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
            <input {...register('start_date', { required: 'Wajib' })} type="date" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
            <input {...register('end_date', { required: 'Wajib' })} type="date" className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Divisi</label>
          <input {...register('division')} className="input-field" placeholder="Nama divisi..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary">Batal</button>
          <button type="submit" disabled={isPending} className="flex-1 btn-primary">
            {isPending ? 'Membuat...' : 'Buat Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectsPage() {
  const { hasRole } = useAuthStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list().then(r => r.data.data),
  });

  const filtered = projects?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const canCreate = hasRole(['kepala_balai']);

  return (
    <AppLayout>
      <PageHeader
        title="Projects"
        subtitle={`${projects?.length || 0} project ditemukan`}
        icon={FolderKanban}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 w-48 text-sm" placeholder="Cari project..." />
            </div>
            <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="p-2 rounded-lg hover:bg-slate-100 border border-slate-200">
              {viewMode === 'grid' ? <List className="w-4 h-4 text-slate-600" /> : <LayoutGrid className="w-4 h-4 text-slate-600" />}
            </button>
            {canCreate && (
              <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />Buat Project
              </button>
            )}
          </div>
        }
      />

      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Belum ada project" subtitle="Mulai dengan membuat project pertama"
          action={canCreate && <button onClick={() => setCreateOpen(true)} className="btn-primary">Buat Project</button>}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/projects/${p.id}`} className="card-hover block group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-[#284074]/10 rounded-xl flex items-center justify-center group-hover:bg-[#284074] transition-colors">
                    <FolderKanban className="w-5 h-5 text-[#284074] group-hover:text-white transition-colors" />
                  </div>
                  <span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
                </div>
                <h3 className="font-display font-600 text-slate-800 mb-1 group-hover:text-[#284074] transition-colors">{p.name}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(p.start_date)}</div>
                  <div className="flex items-center gap-1 text-[#284074] font-medium group-hover:gap-2 transition-all">Buka <ArrowRight className="w-3 h-3" /></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Nama', 'Status', 'Divisi', 'Mulai', 'Selesai', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.description?.slice(0, 40)}...</div>
                  </td>
                  <td className="px-5 py-3.5"><span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span></td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{p.division || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(p.start_date)}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(p.end_date)}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/projects/${p.id}`} className="text-sm text-[#284074] font-medium flex items-center gap-1 hover:gap-2 transition-all">
                      Buka <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppLayout>
  );
}
