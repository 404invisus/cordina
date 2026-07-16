'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge, Plus, X, AlertTriangle, CheckCircle2, Clock,
  FileEdit, ChevronDown, ChevronUp, Check, Pen, Paperclip, Download, Trash2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { changeRequestService, crAttachmentService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  draft:       { label: 'Draft',      bg: 'bg-slate-100',  text: 'text-slate-600',   icon: FileEdit },
  submitted:   { label: 'Diajukan',   bg: 'bg-blue-50',    text: 'text-blue-600',    icon: Clock },
  approved:    { label: 'Disetujui',  bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
  rejected:    { label: 'Ditolak',    bg: 'bg-red-50',     text: 'text-red-600',     icon: AlertTriangle },
  implemented: { label: 'Implemented',bg: 'bg-violet-50',  text: 'text-violet-600',  icon: Pen },
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

// ── Multi-select user picker ──────────────────────────────────────────────────

function UserMultiSelect({ label, users, selected, onChange, exclude = [] }: {
  label: string; users: any[]; selected: string[]; onChange: (ids: string[]) => void; exclude?: string[];
}) {
  const toggle = (uid: string) => onChange(selected.includes(uid) ? selected.filter(id => id !== uid) : [...selected, uid]);
  const filtered = users.filter(u => !exclude.includes(u.id));
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-32 overflow-y-auto divide-y divide-slate-50">
          {filtered.map((u: any) => {
            const checked = selected.includes(u.id);
            const idx = selected.indexOf(u.id);
            return (
              <div key={u.id} onClick={() => toggle(u.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-[#284074]/5' : 'hover:bg-slate-50'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all ${checked ? 'bg-[#284074] border-[#284074] text-white' : 'border-slate-300'}`}>
                  {checked ? idx + 1 : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{u.full_name || u.email}</div>
                  <div className="text-xs text-slate-400">{u.roles?.[0] || u.email}</div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="px-3 py-4 text-sm text-slate-400 text-center">Tidak ada pengguna</div>}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {selected.map((uid, i) => {
            const u = users.find(u => u.id === uid);
            return (
              <span key={uid} className="inline-flex items-center gap-1 text-xs bg-[#284074]/10 text-[#284074] px-2 py-0.5 rounded-full font-medium">
                {i + 1}. {u?.full_name || uid}
                <button onClick={e => { e.stopPropagation(); onChange(selected.filter(id => id !== uid)); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Timeline Progress ─────────────────────────────────────────────────────────

function CRTimeline({ cr, usersMap }: { cr: any; usersMap: Record<string, string> }) {
  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;

  const steps = [
    { label: 'CR Dibuat', role: 'creator', order: 0, status: 'done', actedAt: cr.created_at, note: null },
    ...approvals.map((a: any) => ({
      label: a.role === 'signer'
        ? `Penandatangan: ${usersMap?.[a.approver_id] || '...'}`
        : `Penilai ${a.order}: ${usersMap?.[a.approver_id] || '...'}`,
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
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-100 rounded-full" />
      {steps.map((step, i) => (
        <div key={i} className="relative pb-5 last:pb-0">
          <div className={`absolute -left-7 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${step.status === 'done'     ? 'bg-emerald-500 border-emerald-500' :
              step.status === 'rejected' ? 'bg-red-500 border-red-500' :
              step.status === 'active'   ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100' :
                                           'bg-white border-slate-200'}`}>
            {step.status === 'done'     && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'rejected' && <X className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'active'   && <Clock className="w-2.5 h-2.5 text-white" />}
            {step.status === 'pending'  && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
          </div>
          <div className={`ml-1 ${step.status === 'pending' ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold
                ${step.status === 'done'     ? 'text-emerald-700' :
                  step.status === 'rejected' ? 'text-red-600' :
                  step.status === 'active'   ? 'text-blue-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
              {step.role === 'signer' && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600">TTE</span>}
              {step.status === 'active' && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 animate-pulse">Menunggu</span>}
            </div>
            {step.actedAt && <div className="text-xs text-slate-400 mt-0.5">{formatDate(step.actedAt)}</div>}
            {step.note && <div className="text-xs text-slate-500 mt-1 bg-slate-50 rounded-lg px-2 py-1.5 italic">"{step.note}"</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CR Form Modal ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', description: '', reason: '', impact: '',
  priority: 'medium', change_type: 'normal',
  rincian: '', rencana_waktu: '', dependensi_layanan: '',
  si_terdampak: '', langkah_mitigasi: '', risiko_tidak_dilakukan: '',
  langkah_penanganan_kegagalan: '',
};

function CRModal({ open, onClose, editData, pendingFiles, setPendingFiles }: { open: boolean; onClose: () => void; editData?: any; pendingFiles: File[]; setPendingFiles: React.Dispatch<React.SetStateAction<File[]>> }) {
  const qc = useQueryClient();
  const [form, setForm]             = useState<any>(EMPTY_FORM);
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [signerId, setSignerId]       = useState('');
  const [pelaksanaIds, setPelaksanaIds] = useState<string[]>([]);


  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({ ...EMPTY_FORM, ...editData });
        setPelaksanaIds(editData.pelaksana_ids || []);
      } else {
        setForm(EMPTY_FORM);
        setReviewerIds([]);
        setSignerId('');
        setPelaksanaIds([]);
      }
    }
  }, [editData, open]);

  const { data: usersData } = useQuery({
    queryKey: ['all-users-cr'],
    queryFn: () => api.get('/api/v1/users', { params: { per_page: 100 } }).then(r => r.data.data),
    enabled: open,
  });
  const users: any[] = usersData || [];

  const f = (key: string) => (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.value }));
  const ta = (key: string) => (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: any) => editData
      ? changeRequestService.update(editData.id, data)
      : changeRequestService.create(data),
    onSuccess: async (res: any) => {
      // Upload pending lampiran jika ada
      const crId = res.data?.data?.id;
      if (crId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          try { await crAttachmentService.upload(crId, file); } catch {}
        }
      }
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(editData ? 'CR diperbarui' : 'CR berhasil dibuat');
      setPendingFiles([]);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menyimpan'),
  });

  const handleSubmit = () => {
    if (!editData && reviewerIds.length === 0) return toast.error('Pilih minimal 1 penilai');
    if (!editData && !signerId) return toast.error('Pilih penandatangan');
    const payload = editData
      ? { ...form, pelaksana_ids: pelaksanaIds }
      : { ...form, reviewer_ids: reviewerIds, signer_id: signerId, pelaksana_ids: pelaksanaIds };
    mutation.mutate(payload);
  };

  if (!open) return null;

  const inputCls = "mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]";
  const taCls = inputCls + " resize-none";
  const lbl = (t: string, req = false) => (
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t}{req && <span className="text-red-400 ml-0.5">*</span>}</label>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Change Request' : 'Buat Change Request'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Informasi Dasar */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Dasar</div>
            <div>{lbl('Judul', true)}<input value={form.title} onChange={f('title')} className={inputCls} placeholder="Judul perubahan" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>{lbl('Prioritas')}<select value={form.priority} onChange={f('priority')} className={inputCls}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select></div>
              <div>{lbl('Tipe Perubahan')}<select value={form.change_type} onChange={f('change_type')} className={inputCls}>
                <option value="normal">Normal</option><option value="standard">Standard</option><option value="emergency">Emergency</option>
              </select></div>
            </div>
            <div>{lbl('Rencana Waktu Perubahan')}<input type="date" value={form.rencana_waktu} onChange={f('rencana_waktu')} className={inputCls} /></div>
          </div>

          {/* Informasi Perubahan */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Perubahan</div>
            <div>{lbl('Perubahan yang Diajukan', true)}<textarea value={form.description} onChange={ta('description')} rows={3} className={taCls} placeholder="Apa yang akan diubah?" /></div>
            <div>{lbl('Rincian Perubahan')}<textarea value={form.rincian} onChange={ta('rincian')} rows={3} className={taCls} placeholder="Langkah-langkah detail perubahan" /></div>
            <div>{lbl('Latar Belakang / Alasan', true)}<textarea value={form.reason} onChange={ta('reason')} rows={2} className={taCls} placeholder="Mengapa perubahan ini diperlukan?" /></div>
            <div>{lbl('Dependensi Layanan')}<textarea value={form.dependensi_layanan} onChange={ta('dependensi_layanan')} rows={2} className={taCls} placeholder="Layanan yang berkaitan" /></div>
            <div>{lbl('SI yang Terdampak')}<textarea value={form.si_terdampak} onChange={ta('si_terdampak')} rows={2} className={taCls} placeholder="Sistem informasi yang terdampak" /></div>
          </div>

          {/* Analisis Risiko */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analisis Risiko</div>
            <div>{lbl('Analisis/Kajian Risiko Perubahan')}<textarea value={form.impact} onChange={ta('impact')} rows={2} className={taCls} placeholder="Risiko yang mungkin terjadi" /></div>
            <div>{lbl('Langkah Mitigasi Risiko')}<textarea value={form.langkah_mitigasi} onChange={ta('langkah_mitigasi')} rows={2} className={taCls} placeholder="Langkah untuk mengurangi risiko" /></div>
            <div>{lbl('Risiko Apabila Perubahan Tidak Dilakukan')}<textarea value={form.risiko_tidak_dilakukan} onChange={ta('risiko_tidak_dilakukan')} rows={2} className={taCls} placeholder="Dampak jika tidak dilakukan" /></div>
            <div>{lbl('Langkah Penanganan Kegagalan')}<textarea value={form.langkah_penanganan_kegagalan} onChange={ta('langkah_penanganan_kegagalan')} rows={2} className={taCls} placeholder="Rollback plan jika terjadi kegagalan" /></div>
          </div>

          {/* Personil */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personil</div>
            <UserMultiSelect label="Pelaksana" users={users} selected={pelaksanaIds} onChange={setPelaksanaIds} />
            {!editData && (
              <>
                <UserMultiSelect
                  label="Penilai * (urutan sesuai pilihan)"
                  users={users}
                  selected={reviewerIds}
                  onChange={setReviewerIds}
                  exclude={[signerId].filter(Boolean)}
                />
                <div>{lbl('Penandatangan * (1 orang, TTD via TTE)')}
                  <select value={signerId} onChange={e => { setSignerId(e.target.value); setReviewerIds(prev => prev.filter(id => id !== e.target.value)); }} className={inputCls}>
                    <option value="">-- Pilih penandatangan --</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        {/* Lampiran */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lampiran Pendukung</div>
            <label className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
              <Paperclip className="w-4 h-4" /> Tambah Lampiran
              <input type="file" className="hidden" multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar,.txt,.csv"
                onChange={e => {
                  if (e.target.files) setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  (e.target as HTMLInputElement).value = '';
                }} />
            </label>
            {pendingFiles.length > 0 && (
              <div className="space-y-1.5">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-700 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-slate-400">{(file.size/1024).toFixed(1)} KB</span>
                    <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">File akan diunggah setelah CR berhasil dibuat</p>
          </div>
        </div>


        <div className="flex gap-3 p-6 pt-0 sticky bottom-0 bg-white border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit} disabled={mutation.isPending || !form.title || !form.description || !form.reason}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({ open, crId, onClose }: { open: boolean; crId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const mutation = useMutation({
    mutationFn: () => changeRequestService.reject(crId, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR ditolak'); onClose(); setNote(''); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Tolak Change Request</h2>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
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

// ── Sign Modal ────────────────────────────────────────────────────────────────

function SignModal({ open, cr, onClose }: { open: boolean; cr: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [passphrase, setPassphrase] = useState('');
  const mutation = useMutation({
    mutationFn: () => api.post(`/api/v1/change-requests/${cr?.id}/sign`, { passphrase }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('Dokumen berhasil ditandatangani!'); onClose(); setPassphrase(''); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menandatangani'),
  });
  if (!open || !cr) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Tandatangani Dokumen</h2>
        <p className="text-sm text-slate-400 mb-4">{cr.title}</p>
        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
          <span className="font-medium">Menandatangani sebagai:</span> {user?.full_name}
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Passphrase TTE</label>
          <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]"
            placeholder="Masukkan passphrase TTE Anda" />
        </div>
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Passphrase tidak disimpan di sistem. Dokumen akan ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh BSrE.
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !passphrase}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Pen className="w-3.5 h-3.5" />
            {mutation.isPending ? 'Menandatangani...' : 'Tandatangani'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}



// ── CR Audit Log ──────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  created:          { label: 'CR Dibuat',             color: 'text-slate-500' },
  submitted:        { label: 'CR Diajukan',            color: 'text-blue-600' },
  reviewed:         { label: 'Ditinjau',               color: 'text-emerald-600' },
  approved:         { label: 'Disetujui',              color: 'text-emerald-600' },
  rejected:         { label: 'Ditolak',                color: 'text-red-600' },
  implemented:      { label: 'Diimplementasikan',      color: 'text-violet-600' },
  signed:           { label: 'Ditandatangani (TTE)',   color: 'text-violet-600' },
  attachment_added: { label: 'Lampiran Ditambahkan',   color: 'text-slate-500' },
  attachment_deleted:{ label: 'Lampiran Dihapus',      color: 'text-red-400' },
};

function CRAuditLog({ crId, usersMap }: { crId: string; usersMap: Record<string, string> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cr-logs', crId],
    queryFn: () => changeRequestService.logs(crId).then(r => r.data.data),
  });

  const logs: any[] = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="text-xs text-slate-400 py-2 mt-3 border-t border-slate-100 pt-3">Memuat log...</div>;
  if (logs.length === 0) return null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="text-xs font-semibold text-slate-500 mb-2">Riwayat Aktivitas</div>
      <div className="space-y-2">
        {logs.map((log: any) => {
          const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'text-slate-500' };
          return (
            <div key={log.id} className="flex items-start gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                {log.actor_id && <span className="text-slate-400"> oleh {usersMap[log.actor_id] || 'sistem'}</span>}
                {log.note && <span className="text-slate-400 italic">, {log.note}</span>}
                <div className="text-slate-300 mt-0.5">{formatDate(log.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CR Attachments ────────────────────────────────────────────────────────────

function CRAttachments({ crId, canUpload }: { crId: string; canUpload: boolean }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cr-attachments', crId],
    queryFn: () => crAttachmentService.list(crId).then(r => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => crAttachmentService.upload(crId, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cr-attachments', crId] }); toast.success('Lampiran berhasil diunggah'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal mengunggah'),
  });

  const implementMutation = useMutation({
    mutationFn: () => changeRequestService.implement(cr.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR ditandai sebagai diimplementasikan'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (attachId: string) => crAttachmentService.delete(crId, attachId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cr-attachments', crId] }); toast.success('Lampiran dihapus'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menghapus'),
  });

  const handleDownload = async (attach: any) => {
    try {
      const res = await crAttachmentService.download(crId, attach.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = attach.file_name; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Gagal mengunduh'); }
  };

  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';

  const attachments: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" /> Lampiran ({attachments.length})
        </span>
        {canUpload && (
          <>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar,.txt,.csv"
              onChange={e => { if (e.target.files?.[0]) uploadMutation.mutate(e.target.files[0]); if (fileRef.current) fileRef.current.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50">
              <Plus className="w-3 h-3" /> {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah'}
            </button>
          </>
        )}
      </div>
      {isLoading ? (
        <div className="text-xs text-slate-400 py-2">Memuat lampiran...</div>
      ) : attachments.length === 0 ? (
        <div className="text-xs text-slate-400 py-1">Belum ada lampiran</div>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((a: any) => (
            <div key={a.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-700 flex-1 truncate">{a.file_name}</span>
              <span className="text-xs text-slate-400">{formatSize(a.file_size)}</span>
              <button onClick={() => handleDownload(a)} className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700">
                <Download className="w-3.5 h-3.5" />
              </button>
              {canUpload && (
                <button onClick={() => { if (confirm('Hapus lampiran ini?')) deleteMutation.mutate(a.id); }}
                  className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CR Card ───────────────────────────────────────────────────────────────────

function CRCard({ cr, onEdit, onReject, onSign, onImplement, userId, usersMap }: {
  cr: any; onEdit: (cr: any) => void; onReject: (id: string) => void;
  onSign: (cr: any) => void;
  onImplement: (id: string) => void; userId: string; usersMap: Record<string, string>;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[cr.status] || STATUS_CONFIG.draft;
  const pc = PRIORITY_CONFIG[cr.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = sc.icon;

  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;
  const myApproval = approvals.find((a: any) => a.approver_id === userId && a.order === currentStep && a.status === 'pending');
  const isMyTurn   = !!myApproval && cr.status === 'submitted';
  const isSigner   = myApproval?.role === 'signer';

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
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-snug">{cr.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(cr.created_at)}</p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} flex-shrink-0`}>
            <StatusIcon className="w-3 h-3" />{sc.label}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{pc.label}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{cr.change_type}</span>
          {cr.rencana_waktu && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{new Date(cr.rencana_waktu).toLocaleDateString('id-ID')}</span>}
          {cr.total_steps > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">{currentStep > 0 ? `Step ${currentStep}/${cr.total_steps}` : `${cr.total_steps} step`}</span>}
        </div>

        {isMyTurn && (
          <div className="mb-3 flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            {isSigner ? 'Giliran Anda untuk menandatangani dokumen CR ini' : 'Giliran Anda untuk meninjau CR ini'}
          </div>
        )}

        {cr.status === 'approved' && cr.signed_document_url && (
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/change-requests/${cr.id}/document`}
            className="mb-3 flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-violet-100 transition-colors"
            target="_blank">
            <Pen className="w-3.5 h-3.5" /> Unduh Dokumen Ter-TTE
          </a>
        )}

        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-1">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Sembunyikan progress' : 'Lihat progress'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <CRTimeline cr={cr} usersMap={usersMap} />
              <CRAttachments crId={cr.id} canUpload={isMyTurn || (cr.requester_id === userId && cr.status === 'draft')} />
              <CRAuditLog crId={cr.id} usersMap={usersMap} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2 px-5 pb-4 flex-wrap">
        {cr.requester_id === userId && cr.status === 'draft' && (
          <>
            <button onClick={() => onEdit(cr)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Edit</button>
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#284074] text-white hover:bg-[#1e3260] disabled:opacity-50">
              {submitMutation.isPending ? 'Mengajukan...' : 'Ajukan'}
            </button>
            <button onClick={() => { if (confirm('Hapus CR ini?')) deleteMutation.mutate(); }} disabled={deleteMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Hapus</button>
          </>
        )}
        {cr.requester_id === userId && cr.status === 'approved' && (
          <button onClick={() => onImplement(cr.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tandai Diimplementasikan
          </button>
        )}
        {isMyTurn && !isSigner && (
          <>
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">
              {approveMutation.isPending ? 'Memproses...' : 'Setujui'}
            </button>
            <button onClick={() => onReject(cr.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Tolak</button>
          </>
        )}
        {isMyTurn && isSigner && (
          <button onClick={() => onSign(cr)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 flex items-center gap-1.5">
            <Pen className="w-3 h-3" /> Tandatangani
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ChangeManagementPage() {
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen]   = useState(false);
  const [editData, setEditData]       = useState<any>(null);
  const [rejectId, setRejectId]       = useState<string | null>(null);
  const [signCr, setSignCr]           = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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
  const qc = useQueryClient();
  const implementCrMutation = useMutation({
    mutationFn: (id: string) => changeRequestService.implement(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['change-requests'] }); toast.success('CR ditandai sebagai diimplementasikan'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  return (
    <AppLayout>
      <CRModal open={createOpen || !!editData} onClose={() => { setCreateOpen(false); setEditData(null); setPendingFiles([]); }} editData={editData} pendingFiles={pendingFiles} setPendingFiles={setPendingFiles} />
      <RejectModal open={!!rejectId} crId={rejectId || ''} onClose={() => setRejectId(null)} />
      <SignModal open={!!signCr} cr={signCr} onClose={() => setSignCr(null)} />

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
          <Plus className="w-4 h-4" /> Buat CR
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'draft', 'submitted', 'approved', 'rejected', 'implemented'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${filterStatus === s ? 'bg-[#284074] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#284074]/30'}`}>
            {s === '' ? 'Semua' : s === 'draft' ? 'Draft' : s === 'submitted' ? 'Diajukan' : s === 'approved' ? 'Disetujui' : s === 'rejected' ? 'Ditolak' : 'Implemented'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        </div>
      ) : crs.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">Belum ada change request</div>
      ) : (
        <div className="grid gap-4">
          {crs.map((cr: any) => (
            <CRCard key={cr.id} cr={cr} userId={user?.id || ''} onEdit={setEditData} onReject={setRejectId} onSign={setSignCr} onImplement={(id) => implementCrMutation.mutate(id)} usersMap={usersMap} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
