'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge, Plus, X, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, FileEdit, Send, Filter,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { changeRequestService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  draft:     { label: 'Draft',     bg: 'bg-slate-100',   text: 'text-slate-600',  icon: FileEdit },
  submitted: { label: 'Submitted', bg: 'bg-blue-50',     text: 'text-blue-600',   icon: Clock },
  approved:  { label: 'Approved',  bg: 'bg-emerald-50',  text: 'text-emerald-600',icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  bg: 'bg-red-50',      text: 'text-red-600',    icon: AlertTriangle },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  low:      { label: 'Low',      bg: 'bg-slate-100',  text: 'text-slate-500' },
  medium:   { label: 'Medium',   bg: 'bg-blue-50',    text: 'text-blue-600' },
  high:     { label: 'High',     bg: 'bg-amber-50',   text: 'text-amber-600' },
  critical: { label: 'Critical', bg: 'bg-red-50',     text: 'text-red-600' },
};

const TYPE_LABEL: Record<string, string> = {
  normal: 'Normal', emergency: 'Emergency', standard: 'Standard',
};

function CRModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: editData?.title || '',
    description: editData?.description || '',
    reason: editData?.reason || '',
    impact: editData?.impact || '',
    priority: editData?.priority || 'medium',
    change_type: editData?.change_type || 'normal',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => editData
      ? changeRequestService.update(editData.id, data)
      : changeRequestService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(editData ? 'CR diperbarui' : 'CR berhasil dibuat');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menyimpan'),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Change Request' : 'Buat Change Request'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]"
              placeholder="Judul perubahan" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] resize-none"
              placeholder="Jelaskan perubahan yang diajukan" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alasan *</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={2} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] resize-none"
              placeholder="Mengapa perubahan ini diperlukan?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dampak</label>
            <textarea value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
              rows={2} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] resize-none"
              placeholder="Dampak jika perubahan diterapkan (opsional)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioritas</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe</label>
              <select value={form.change_type} onChange={e => setForm(f => ({ ...f, change_type: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]">
                <option value="normal">Normal</option>
                <option value="standard">Standard</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title || !form.description || !form.reason}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RejectModal({ open, crId, onClose }: { open: boolean; crId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const mutation = useMutation({
    mutationFn: () => changeRequestService.reject(crId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('CR ditolak');
      onClose();
      setNote('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Tolak Change Request</h2>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
            placeholder="Catatan penolakan (wajib diisi, akan dikirim ke pemohon)" />
          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !note.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
              {mutation.isPending ? 'Memproses...' : 'Tolak CR'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ChangeManagementPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const isReviewer = user?.roles?.some(r => r === 'kepala_seksi');
  const canViewAll = user?.roles?.some(r => ['kepala_balai', 'kepala_seksi', 'administrator'].includes(r));

  const { data, isLoading } = useQuery({
    queryKey: ['change-requests', filterStatus],
    queryFn: () => changeRequestService.list(filterStatus ? { status: filterStatus } : undefined)
      .then(r => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => changeRequestService.submit(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR disubmit'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal submit'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => changeRequestService.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR disetujui'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal approve'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => changeRequestService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR dihapus'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal hapus'),
  });

  const crs = data?.data || [];

  return (
    <AppLayout>
      <CRModal open={createOpen || !!editData} onClose={() => { setCreateOpen(false); setEditData(null); }} editData={editData} />
      <RejectModal open={!!rejectId} crId={rejectId || ''} onClose={() => setRejectId(null)} />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-2xl flex items-center justify-center border border-violet-100">
            <GitMerge className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Change Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">Pengajuan dan persetujuan perubahan sistem</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Buat CR
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { value: '', label: 'Semua' },
          { value: 'draft', label: 'Draft' },
          { value: 'submitted', label: 'Submitted' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              filterStatus === f.value
                ? 'bg-[#284074] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-[#284074]/30'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        </div>
      ) : crs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <GitMerge className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Belum ada change request</p>
          <button onClick={() => setCreateOpen(true)} className="mt-3 text-sm text-[#284074] font-semibold hover:underline">
            Buat yang pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {crs.map((cr: any, i: number) => {
            const status = STATUS_CONFIG[cr.status] || STATUS_CONFIG.draft;
            const priority = PRIORITY_CONFIG[cr.priority] || PRIORITY_CONFIG.medium;
            const StatusIcon = status.icon;
            const isOwner = cr.requester_id === user?.id;
            const canEdit = isOwner && ['draft', 'rejected'].includes(cr.status);
            const canSubmit = isOwner && ['draft', 'rejected'].includes(cr.status);
            const canApprove = isReviewer && cr.status === 'submitted';

            return (
              <motion.div key={cr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text}`}>
                        {priority.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        {TYPE_LABEL[cr.change_type]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{cr.title}</h3>
                    <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{cr.description}</p>
                    {cr.status === 'rejected' && cr.reviewer_note && (
                      <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-red-600 mb-0.5">Catatan penolakan:</p>
                        <p className="text-xs text-red-500">{cr.reviewer_note}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-300 mt-2">
                      {new Date(cr.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canEdit && (
                      <button onClick={() => setEditData(cr)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        Edit
                      </button>
                    )}
                    {canSubmit && (
                      <button onClick={() => submitMutation.mutate(cr.id)} disabled={submitMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#284074] text-white hover:bg-[#1e3260] transition-colors disabled:opacity-50">
                        <Send className="w-3 h-3" />
                        Submit
                      </button>
                    )}
                    {canApprove && (
                      <>
                        <button onClick={() => approveMutation.mutate(cr.id)} disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </button>
                        <button onClick={() => setRejectId(cr.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <X className="w-3 h-3" />
                          Tolak
                        </button>
                      </>
                    )}
                    {isOwner && cr.status === 'draft' && (
                      <button onClick={() => deleteMutation.mutate(cr.id)} disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
