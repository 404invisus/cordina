'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge, Plus, X, AlertTriangle, CheckCircle2, Clock,
  FileEdit, ChevronDown, ChevronUp, User, Check, Pen,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { changeRequestService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  draft:     { label: 'Draft',     bg: 'bg-slate-100',  text: 'text-slate-600',   icon: FileEdit },
  submitted: { label: 'Diajukan', bg: 'bg-blue-50',    text: 'text-blue-600',    icon: Clock },
  approved:  { label: 'Disetujui',bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
  rejected:  { label: 'Ditolak',  bg: 'bg-red-50',     text: 'text-red-600',     icon: AlertTriangle },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  low:      { label: 'Low',      bg: 'bg-slate-100', text: 'text-slate-500' },
  medium:   { label: 'Medium',   bg: 'bg-blue-50',   text: 'text-blue-600' },
  high:     { label: 'High',     bg: 'bg-amber-50',  text: 'text-amber-600' },
  critical: { label: 'Critical', bg: 'bg-red-50',    text: 'text-red-600' },
};

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Timeline Progress ────────────────────────────────────────────────────────

function CRTimeline({ cr, usersMap }: { cr: any; usersMap: Record<string, string> }) {
  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;

  const steps = [
    { label: 'CR Dibuat', role: 'creator', order: 0, status: 'done', actedAt: cr.created_at, note: null, approver: null },
    ...approvals.map((a: any) => ({
      label: a.role === 'signer' ? `Penandatangan: ${usersMap?.[a.approver_id] || ''}` : `Penilai ${a.order}: ${usersMap?.[a.approver_id] || ''}`,
      role: a.role,
      order: a.order,
      status: a.status === 'approved' ? 'done' : a.status === 'rejected' ? 'rejected' : a.order === currentStep && cr.status === 'submitted' ? 'active' : 'pending',
      actedAt: a.acted_at,
      note: a.note,
      approver_id: a.approver_id,
    })),
  ];

  return (
    <div className="relative pl-7 mt-4 space-y-0">
      {/* vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-100 rounded-full" />

      {steps.map((step, i) => (
        <div key={i} className="relative pb-5 last:pb-0">
          {/* dot */}
          <div className={`absolute -left-7 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${step.status === 'done'     ? 'bg-emerald-500 border-emerald-500' :
              step.status === 'rejected' ? 'bg-red-500 border-red-500' :
              step.status === 'active'   ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100' :
                                           'bg-white border-slate-200'}`}>
            {step.status === 'done'     && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'rejected' && <X className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'active'   && <Clock className="w-2.5 h-2.5 text-white" />}
            {step.status === 'pending'  && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
            {step.role === 'signer' && step.status === 'done' && <Pen className="w-3 h-3 text-white" strokeWidth={2} />}
          </div>

          <div className={`ml-1 ${step.status === 'pending' ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold
                ${step.status === 'done'     ? 'text-emerald-700' :
                  step.status === 'rejected' ? 'text-red-600' :
                  step.status === 'active'   ? 'text-blue-700' :
                                               'text-slate-400'}`}>
                {step.label}
              </span>
              {step.role === 'signer' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600">TTE</span>
              )}
              {step.status === 'active' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 animate-pulse">Menunggu</span>
              )}
            </div>
            {step.actedAt && (
              <div className="text-xs text-slate-400 mt-0.5">{formatDate(step.actedAt)}</div>
            )}
            {step.note && (
              <div className="text-xs text-slate-500 mt-1 bg-slate-50 rounded-lg px-2 py-1.5 italic">"{step.note}"</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CR Form Modal ────────────────────────────────────────────────────────────

function CRModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', reason: '', impact: '',
    priority: 'medium', change_type: 'normal',
  });
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [signerId, setSignerId]       = useState('');

  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || '', description: editData.description || '',
        reason: editData.reason || '', impact: editData.impact || '',
        priority: editData.priority || 'medium', change_type: editData.change_type || 'normal',
      });
    } else {
      setForm({ title: '', description: '', reason: '', impact: '', priority: 'medium', change_type: 'normal' });
      setReviewerIds([]);
      setSignerId('');
    }
  }, [editData, open]);

  const { data: usersData } = useQuery({
    queryKey: ['all-users-cr'],
    queryFn: () => api.get('/api/v1/users', { params: { per_page: 100 } }).then(r => r.data.data),
    enabled: open && !editData,
  });
  const users: any[] = usersData || [];

  const toggleReviewer = (uid: string) => {
    if (uid === signerId) return; // tidak bisa jadi reviewer kalau sudah jadi signer
    setReviewerIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

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

  const handleSubmit = () => {
    if (!editData && reviewerIds.length === 0) return toast.error('Pilih minimal 1 penilai');
    if (!editData && !signerId) return toast.error('Pilih penandatangan');
    mutation.mutate(editData ? form : { ...form, reviewer_ids: reviewerIds, signer_id: signerId });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Change Request' : 'Buat Change Request'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Judul */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]"
              placeholder="Judul perubahan" />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] resize-none"
              placeholder="Jelaskan perubahan yang diajukan" />
          </div>

          {/* Alasan */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alasan *</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={2} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] resize-none"
              placeholder="Mengapa perubahan ini diperlukan?" />
          </div>

          {/* Dampak */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dampak</label>
            <textarea value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
              rows={2} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] resize-none"
              placeholder="Dampak jika perubahan diterapkan (opsional)" />
          </div>

          {/* Prioritas + Tipe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioritas</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe</label>
              <select value={form.change_type} onChange={e => setForm(f => ({ ...f, change_type: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]">
                <option value="normal">Normal</option>
                <option value="standard">Standard</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Penilai (hanya saat create) */}
          {!editData && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Penilai * <span className="text-slate-400 normal-case font-normal">(urutan sesuai pilihan)</span>
              </label>
              <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-50">
                  {users.filter(u => u.id !== signerId).map((u: any) => {
                    const idx = reviewerIds.indexOf(u.id);
                    const checked = idx >= 0;
                    return (
                      <div key={u.id} onClick={() => toggleReviewer(u.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                          ${checked ? 'bg-[#284074]/5' : 'hover:bg-slate-50'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all
                          ${checked ? 'bg-[#284074] border-[#284074] text-white' : 'border-slate-300'}`}>
                          {checked ? idx + 1 : ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">{u.full_name || u.email}</div>
                          <div className="text-xs text-slate-400">{u.roles?.[0] || u.email}</div>
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && <div className="px-3 py-4 text-sm text-slate-400 text-center">Memuat pengguna...</div>}
                </div>
              </div>
              {reviewerIds.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {reviewerIds.map((uid, i) => {
                    const u = users.find(u => u.id === uid);
                    return (
                      <span key={uid} className="inline-flex items-center gap-1 text-xs bg-[#284074]/10 text-[#284074] px-2 py-1 rounded-full font-medium">
                        <span className="font-bold">{i+1}.</span> {u?.full_name || uid}
                        <button onClick={() => setReviewerIds(prev => prev.filter(id => id !== uid))} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Penandatangan (hanya saat create) */}
          {!editData && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Penandatangan * <span className="text-slate-400 normal-case font-normal">(1 orang, TTD via TTE)</span>
              </label>
              <select value={signerId} onChange={e => { setSignerId(e.target.value); setReviewerIds(prev => prev.filter(id => id !== e.target.value)); }}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400">
                <option value="">-- Pilih penandatangan --</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={mutation.isPending || !form.title || !form.description || !form.reason}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reject Modal ─────────────────────────────────────────────────────────────

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Tolak Change Request</h2>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
          placeholder="Catatan penolakan (wajib diisi)" />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !note.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
            {mutation.isPending ? 'Memproses...' : 'Tolak CR'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── CR Card ──────────────────────────────────────────────────────────────────

function CRCard({ cr, onEdit, onReject, userId, usersMap }: { cr: any; onEdit: (cr: any) => void; onReject: (id: string) => void; userId: string; usersMap: Record<string, string> }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[cr.status] || STATUS_CONFIG.draft;
  const pc = PRIORITY_CONFIG[cr.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = sc.icon;

  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;
  const myApproval = approvals.find((a: any) => a.approver_id === userId && a.order === currentStep && a.status === 'pending');
  const isMyTurn = !!myApproval && cr.status === 'submitted';

  const submitMutation = useMutation({
    mutationFn: () => changeRequestService.submit(cr.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR disubmit'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal submit'),
  });

  const approveMutation = useMutation({
    mutationFn: () => changeRequestService.approve(cr.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR disetujui'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal approve'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => changeRequestService.delete(cr.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR dihapus'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal hapus'),
  });

  return (
    <motion.div layout className="bg-white rounded-2xl border border-slate-100 hover:border-[#284074]/20 hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-snug">{cr.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(cr.created_at)}</p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} flex-shrink-0`}>
            <StatusIcon className="w-3 h-3" />
            {sc.label}
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{pc.label}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{cr.change_type}</span>
          {cr.total_steps > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
              {currentStep > 0 ? `Step ${currentStep}/${cr.total_steps}` : `${cr.total_steps} step`}
            </span>
          )}
        </div>

        {/* Giliranku badge */}
        {isMyTurn && (
          <div className="mb-3 flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            Giliran Anda untuk meninjau CR ini
          </div>
        )}

        {/* Toggle timeline */}
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-1">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Sembunyikan progress' : 'Lihat progress'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <CRTimeline cr={cr} usersMap={usersMap} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 pb-4 flex-wrap">
        {cr.requester_id === userId && cr.status === 'draft' && (
          <>
            <button onClick={() => onEdit(cr)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              Edit
            </button>
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#284074] text-white hover:bg-[#1e3260] transition-colors disabled:opacity-50">
              {submitMutation.isPending ? 'Mengajukan...' : 'Ajukan'}
            </button>
            <button onClick={() => { if (confirm('Hapus CR ini?')) deleteMutation.mutate(); }} disabled={deleteMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
              Hapus
            </button>
          </>
        )}
        {isMyTurn && (
          <>
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {approveMutation.isPending ? 'Memproses...' : myApproval?.role === 'signer' ? 'Tandatangani' : 'Setujui'}
            </button>
            <button onClick={() => onReject(cr.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
              Tolak
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ChangeManagementPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData]     = useState<any>(null);
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['all-users-directory'],
    queryFn: () => api.get('/api/v1/users', { params: { per_page: 100 } }).then(r => r.data.data),
  });
  const usersMap: Record<string, string> = useMemo(() =>
    Object.fromEntries((usersData || []).map((u: any) => [u.id, u.full_name || u.email]))
  , [usersData]);

  const { data, isLoading } = useQuery({
    queryKey: ['change-requests', filterStatus],
    queryFn: () => changeRequestService.list(filterStatus ? { status: filterStatus } : undefined).then(r => r.data.data),
  });

  const crs = data?.data || [];

  return (
    <AppLayout>
      <CRModal open={createOpen || !!editData} onClose={() => { setCreateOpen(false); setEditData(null); }} editData={editData} />
      <RejectModal open={!!rejectId} crId={rejectId || ''} onClose={() => setRejectId(null)} />

      {/* Header */}
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
        {['', 'draft', 'submitted', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              filterStatus === s ? 'bg-[#284074] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#284074]/30'
            }`}>
            {s === '' ? 'Semua' : s === 'draft' ? 'Draft' : s === 'submitted' ? 'Diajukan' : s === 'approved' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        </div>
      ) : crs.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">Belum ada change request</div>
      ) : (
        <div className="grid gap-4">
          {crs.map((cr: any) => (
            <CRCard key={cr.id} cr={cr} userId={user?.id || ''} onEdit={setEditData} onReject={setRejectId} usersMap={usersMap} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
