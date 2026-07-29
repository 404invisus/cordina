'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  ChevronDown,
  ChevronUp,
  Check,
  Pen,
  Paperclip,
  Download,
  Trash2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { changeRequestService, crAttachmentService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDateTime as formatDate } from '@/lib/format';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  draft: { label: 'Draft', bg: 'bg-border-subtle', text: 'text-text-secondary', icon: FileEdit },
  submitted: { label: 'Diajukan', bg: 'bg-info-soft', text: 'text-info-text', icon: Clock },
  approved: { label: 'Disetujui', bg: 'bg-success-soft', text: 'text-success-text', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', bg: 'bg-danger-soft', text: 'text-danger-text', icon: AlertTriangle },
  implemented: { label: 'Implemented', bg: 'bg-navy-700/8', text: 'text-navy-700', icon: Pen },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: 'Low', bg: 'bg-border-subtle', text: 'text-text-tertiary' },
  medium: { label: 'Medium', bg: 'bg-info-soft', text: 'text-info-text' },
  high: { label: 'High', bg: 'bg-amber-50', text: 'text-amber-600' },
  critical: { label: 'Critical', bg: 'bg-danger-soft', text: 'text-danger-text' },
};

type TabFilter = 'all' | 'awaiting_me' | 'in_flight' | 'submitted_by_me' | 'closed';

const TABS: { id: TabFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'awaiting_me', label: 'Awaiting me' },
  { id: 'in_flight', label: 'In flight' },
  { id: 'submitted_by_me', label: 'Submitted by me' },
  { id: 'closed', label: 'Closed' },
];

function isMyTurnFn(cr: any, userId: string): boolean {
  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;
  const myApproval = approvals.find((a: any) => a.approver_id === userId && a.order === currentStep && a.status === 'pending');
  return !!myApproval && cr.status === 'submitted';
}

function UserMultiSelect({
  label,
  users,
  selected,
  onChange,
  exclude = [],
}: {
  label: string;
  users: any[];
  selected: string[];
  onChange: (ids: string[]) => void;
  exclude?: string[];
}) {
  const toggle = (uid: string) => onChange(selected.includes(uid) ? selected.filter((id) => id !== uid) : [...selected, uid]);
  const filtered = users.filter((u) => !exclude.includes(u.id));
  return (
    <div>
      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{label}</label>
      <div className="mt-1 border border-border rounded-[6px] overflow-hidden">
        <div className="max-h-32 overflow-y-auto divide-y divide-surface-2">
          {filtered.map((u: any) => {
            const checked = selected.includes(u.id);
            const idx = selected.indexOf(u.id);
            return (
              <div
                key={u.id}
                onClick={() => toggle(u.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-navy-700/5' : 'hover:bg-surface-2'}`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all ${checked ? 'bg-navy-700 border-navy-700 text-white' : 'border-border-button'}`}
                >
                  {checked ? idx + 1 : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate">{u.full_name || u.email}</div>
                  <div className="text-xs text-text-placeholder">{u.roles?.[0] || u.email}</div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="px-3 py-4 text-sm text-text-placeholder text-center">No users found</div>}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {selected.map((uid, i) => {
            const u = users.find((u) => u.id === uid);
            return (
              <span
                key={uid}
                className="inline-flex items-center gap-1 text-xs bg-navy-700/10 text-navy-700 px-2 py-0.5 rounded-full font-medium"
              >
                {i + 1}. {u?.full_name || uid}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(selected.filter((id) => id !== uid));
                  }}
                  className="hover:text-danger"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CRTimeline({ cr, usersMap }: { cr: any; usersMap: Record<string, string> }) {
  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;

  const steps = [
    { label: 'CR Dibuat', role: 'creator', order: 0, status: 'done', actedAt: cr.created_at, note: null },
    ...approvals.map((a: any) => ({
      label:
        a.role === 'signer'
          ? `Penandatangan: ${usersMap?.[a.approver_id] || '...'}`
          : `Penilai ${a.order}: ${usersMap?.[a.approver_id] || '...'}`,
      role: a.role,
      order: a.order,
      status:
        a.status === 'approved'
          ? 'done'
          : a.status === 'rejected'
            ? 'rejected'
            : a.order === currentStep && cr.status === 'submitted'
              ? 'active'
              : 'pending',
      actedAt: a.acted_at,
      note: a.note,
      approver_id: a.approver_id,
    })),
  ];

  return (
    <div className="relative pl-7 mt-4 space-y-0">
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border-subtle rounded-full" />
      {steps.map((step, i) => (
        <div key={i} className="relative pb-5 last:pb-0">
          <div
            className={`absolute -left-7 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center
 ${
   step.status === 'done'
     ? 'bg-success border-success'
     : step.status === 'rejected'
       ? 'bg-danger border-danger'
       : step.status === 'active'
         ? 'bg-info border-info ring-4 ring-info-soft'
         : 'bg-white border-border'
 }`}
          >
            {step.status === 'done' && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'rejected' && <X className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'active' && <Clock className="w-2.5 h-2.5 text-white" />}
            {step.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-border-button" />}
          </div>
          <div className={`ml-1 ${step.status === 'pending' ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold
 ${
   step.status === 'done'
     ? 'text-success-text'
     : step.status === 'rejected'
       ? 'text-danger-text'
       : step.status === 'active'
         ? 'text-info-text'
         : 'text-text-placeholder'
 }`}
              >
                {step.label}
              </span>
              {step.role === 'signer' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-navy-700/8 text-navy-700">TTE</span>
              )}
              {step.status === 'active' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-info-soft text-info-text animate-pulse">Menunggu</span>
              )}
            </div>
            {step.actedAt && <div className="text-xs text-text-placeholder mt-0.5">{formatDate(step.actedAt)}</div>}
            {step.note && <div className="text-xs text-text-tertiary mt-1 bg-surface-2 rounded-lg px-2 py-1.5 italic">"{step.note}"</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  title: '',
  description: '',
  reason: '',
  impact: '',
  priority: 'medium',
  change_type: 'normal',
  rincian: '',
  rencana_waktu: '',
  dependensi_layanan: '',
  si_terdampak: '',
  langkah_mitigasi: '',
  risiko_tidak_dilakukan: '',
  langkah_penanganan_kegagalan: '',
};

function CRModal({
  open,
  onClose,
  editData,
  pendingFiles,
  setPendingFiles,
}: {
  open: boolean;
  onClose: () => void;
  editData?: any;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [signerId, setSignerId] = useState('');
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
    queryFn: () => api.get('/api/v1/users', { params: { per_page: 100 } }).then((r) => r.data.data),
    enabled: open,
  });
  const users: any[] = usersData || [];

  const f = (key: string) => (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.value }));
  const ta = (key: string) => (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: any) => (editData ? changeRequestService.update(editData.id, data) : changeRequestService.create(data)),
    onSuccess: async (res: any) => {
      const crId = res.data?.data?.id;
      if (crId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          try {
            await crAttachmentService.upload(crId, file);
          } catch {}
        }
      }
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(editData ? 'CR updated' : 'CR created successfully');
      setPendingFiles([]);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
  });

  const handleSubmit = () => {
    if (!editData && reviewerIds.length === 0) return toast.error('Select at least 1 reviewer');
    if (!editData && !signerId) return toast.error('Select a signatory');
    const payload = editData
      ? { ...form, pelaksana_ids: pelaksanaIds }
      : { ...form, reviewer_ids: reviewerIds, signer_id: signerId, pelaksana_ids: pelaksanaIds };
    mutation.mutate(payload);
  };

  if (!open) return null;

  const inputCls =
    'mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700';
  const taCls = inputCls + ' resize-none';
  const lbl = (t: string, req = false) => (
    <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
      {t}
      {req && <span className="text-danger ml-0.5">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-navy-900">{editData ? 'Edit Change Request' : 'Create Change Request'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-border-subtle rounded-[6px]">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">Basic Information</div>
            <div>
              {lbl('Title', true)}
              <input value={form.title} onChange={f('title')} className={inputCls} placeholder="Change title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {lbl('Priority')}
                <select value={form.priority} onChange={f('priority')} className={inputCls}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                {lbl('Change Type')}
                <select value={form.change_type} onChange={f('change_type')} className={inputCls}>
                  <option value="normal">Normal</option>
                  <option value="standard">Standard</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
            <div>
              {lbl('Planned Change Date')}
              <input type="date" value={form.rencana_waktu} onChange={f('rencana_waktu')} className={inputCls} />
            </div>
          </div>

          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">Change Information</div>
            <div>
              {lbl('Proposed Change', true)}
              <textarea
                value={form.description}
                onChange={ta('description')}
                rows={3}
                className={taCls}
                placeholder="What will be changed?"
              />
            </div>
            <div>
              {lbl('Change Details')}
              <textarea
                value={form.rincian}
                onChange={ta('rincian')}
                rows={3}
                className={taCls}
                placeholder="Step-by-step details of the change"
              />
            </div>
            <div>
              {lbl('Background / Reason', true)}
              <textarea
                value={form.reason}
                onChange={ta('reason')}
                rows={2}
                className={taCls}
                placeholder="Why is this change necessary?"
              />
            </div>
            <div>
              {lbl('Service Dependencies')}
              <textarea
                value={form.dependensi_layanan}
                onChange={ta('dependensi_layanan')}
                rows={2}
                className={taCls}
                placeholder="Related services"
              />
            </div>
            <div>
              {lbl('Affected Information Systems')}
              <textarea
                value={form.si_terdampak}
                onChange={ta('si_terdampak')}
                rows={2}
                className={taCls}
                placeholder="Information systems impacted"
              />
            </div>
          </div>

          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">Risk Analysis</div>
            <div>
              {lbl('Change Risk Analysis')}
              <textarea value={form.impact} onChange={ta('impact')} rows={2} className={taCls} placeholder="Risks that may occur" />
            </div>
            <div>
              {lbl('Risk Mitigation Steps')}
              <textarea
                value={form.langkah_mitigasi}
                onChange={ta('langkah_mitigasi')}
                rows={2}
                className={taCls}
                placeholder="Steps to reduce risk"
              />
            </div>
            <div>
              {lbl('Risk if Change is Not Performed')}
              <textarea
                value={form.risiko_tidak_dilakukan}
                onChange={ta('risiko_tidak_dilakukan')}
                rows={2}
                className={taCls}
                placeholder="Impact if not performed"
              />
            </div>
            <div>
              {lbl('Failure Handling Steps')}
              <textarea
                value={form.langkah_penanganan_kegagalan}
                onChange={ta('langkah_penanganan_kegagalan')}
                rows={2}
                className={taCls}
                placeholder="Rollback plan in case of failure"
              />
            </div>
          </div>

          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">Personnel</div>
            <UserMultiSelect label="Implementers" users={users} selected={pelaksanaIds} onChange={setPelaksanaIds} />
            {!editData && (
              <>
                <UserMultiSelect
                  label="Reviewers * (order matches selection)"
                  users={users}
                  selected={reviewerIds}
                  onChange={setReviewerIds}
                  exclude={[signerId].filter(Boolean)}
                />
                <div>
                  {lbl('Signatory * (1 person, signs via e-Sign)')}
                  <select
                    value={signerId}
                    onChange={(e) => {
                      setSignerId(e.target.value);
                      setReviewerIds((prev) => prev.filter((id) => id !== e.target.value));
                    }}
                    className={inputCls}
                  >
                    <option value="">-- Select signatory --</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">Supporting Attachments</div>
            <label className="flex items-center gap-2 text-sm text-text-secondary border border-border px-3 py-2 rounded-[6px] hover:bg-white transition-colors cursor-pointer">
              <Paperclip className="w-4 h-4" /> Add Attachment
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar,.txt,.csv"
                onChange={(e) => {
                  if (e.target.files) setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  (e.target as HTMLInputElement).value = '';
                }}
              />
            </label>
            {pendingFiles.length > 0 && (
              <div className="space-y-1.5">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-border-subtle">
                    <Paperclip className="w-3.5 h-3.5 text-text-placeholder flex-shrink-0" />
                    <span className="text-xs text-text-secondary flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-text-placeholder">{(file.size / 1024).toFixed(1)} KB</span>
                    <button
                      onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 hover:bg-danger-soft rounded text-text-placeholder hover:text-danger"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-text-placeholder">Files will be uploaded after the CR is created</p>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0 sticky bottom-0 bg-white border-t border-border-subtle">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || !form.title || !form.description || !form.reason}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
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
      toast.success('CR rejected');
      onClose();
      setNote('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-md p-6"
      >
        <h2 className="text-lg font-bold text-navy-900 mb-4">Reject Change Request</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger resize-none"
          placeholder="Rejection note (required)"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !note.trim()}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-danger text-white text-sm font-semibold hover:bg-danger-text disabled:opacity-50"
          >
            {mutation.isPending ? 'Processing...' : 'Reject CR'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SignModal({ open, cr, onClose }: { open: boolean; cr: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [passphrase, setPassphrase] = useState('');
  const mutation = useMutation({
    mutationFn: async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/esign/warmup`).catch(() => {});
      return api.post(`/api/v1/change-requests/${cr?.id}/sign`, { passphrase });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('Document signed successfully!');
      onClose();
      setPassphrase('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to sign document'),
  });
  if (!open || !cr) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-md p-6"
      >
        <h2 className="text-lg font-bold text-navy-900 mb-1">Sign Document</h2>
        <p className="text-sm text-text-placeholder mb-4">{cr.title}</p>
        <div className="flex items-center gap-2 mb-4 p-3 bg-surface-2 rounded-[6px] text-sm text-text-secondary">
          <span className="font-medium">Signing as:</span> {user?.full_name}
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">e-Sign Passphrase</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 font-mono focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
            placeholder="Enter your e-Sign passphrase"
          />
        </div>
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-[6px] mb-4 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Passphrase is not stored in the system. The document will be signed electronically using a certificate issued by BSrE.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !passphrase}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Pen className="w-3.5 h-3.5" />
            {mutation.isPending ? 'Signing...' : 'Sign'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  created: { label: 'CR Dibuat', color: 'text-text-tertiary' },
  submitted: { label: 'CR Diajukan', color: 'text-info-text' },
  reviewed: { label: 'Ditinjau', color: 'text-success-text' },
  approved: { label: 'Disetujui', color: 'text-success-text' },
  rejected: { label: 'Ditolak', color: 'text-danger-text' },
  implemented: { label: 'Diimplementasikan', color: 'text-navy-700' },
  signed: { label: 'Ditandatangani (TTE)', color: 'text-navy-700' },
  attachment_added: { label: 'Lampiran Ditambahkan', color: 'text-text-tertiary' },
  attachment_deleted: { label: 'Lampiran Dihapus', color: 'text-danger' },
};

function CRAuditLog({ crId, usersMap }: { crId: string; usersMap: Record<string, string> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cr-logs', crId],
    queryFn: () => changeRequestService.logs(crId).then((r) => r.data.data),
  });

  const logs: any[] = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="text-xs text-text-placeholder py-2 mt-3 border-t border-border-subtle pt-3">Loading log...</div>;
  if (logs.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <div className="text-xs font-semibold text-text-tertiary mb-2">Riwayat Aktivitas</div>
      <div className="space-y-2">
        {logs.map((log: any) => {
          const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'text-text-tertiary' };
          return (
            <div key={log.id} className="flex items-start gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-border-button flex-shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                {log.actor_id && <span className="text-text-placeholder"> oleh {usersMap[log.actor_id] || 'sistem'}</span>}
                {log.note && <span className="text-text-placeholder italic">, {log.note}</span>}
                <div className="text-border-button mt-0.5">{formatDate(log.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CRAttachments({ crId, canUpload }: { crId: string; canUpload: boolean }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cr-attachments', crId],
    queryFn: () => crAttachmentService.list(crId).then((r) => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => crAttachmentService.upload(crId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cr-attachments', crId] });
      toast.success('Attachment uploaded');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to upload'),
  });

  const implementMutation = useMutation({
    mutationFn: () => changeRequestService.implement(crId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('CR marked as implemented');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (attachId: string) => crAttachmentService.delete(crId, attachId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cr-attachments', crId] });
      toast.success('Attachment deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const handleDownload = async (attach: any) => {
    try {
      const res = await crAttachmentService.download(crId, attach.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = attach.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';

  const attachments: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" /> Attachments ({attachments.length})
        </span>
        {canUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar,.txt,.csv"
              onChange={(e) => {
                if (e.target.files?.[0]) uploadMutation.mutate(e.target.files[0]);
                if (fileRef.current) fileRef.current.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:bg-surface-2 flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </>
        )}
      </div>
      {isLoading ? (
        <div className="text-xs text-text-placeholder py-2">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="text-xs text-text-placeholder py-1">No attachments yet</div>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((a: any) => (
            <div key={a.id} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
              <Paperclip className="w-3.5 h-3.5 text-text-placeholder flex-shrink-0" />
              <span className="text-xs text-text-secondary flex-1 truncate">{a.file_name}</span>
              <span className="text-xs text-text-placeholder">{formatSize(a.file_size)}</span>
              <button
                onClick={() => handleDownload(a)}
                className="p-1 hover:bg-border rounded text-text-tertiary hover:text-text-secondary"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {canUpload && (
                <button
                  onClick={() => {
                    if (confirm('Delete this attachment?')) deleteMutation.mutate(a.id);
                  }}
                  className="p-1 hover:bg-danger-soft rounded text-text-placeholder hover:text-danger"
                >
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

function CRCard({
  cr,
  onEdit,
  onReject,
  onSign,
  onImplement,
  userId,
  usersMap,
}: {
  cr: any;
  onEdit: (cr: any) => void;
  onReject: (id: string) => void;
  onSign: (cr: any) => void;
  onImplement: (id: string) => void;
  userId: string;
  usersMap: Record<string, string>;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[cr.status] || STATUS_CONFIG.draft;
  const pc = PRIORITY_CONFIG[cr.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = sc.icon;

  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;
  const myApproval = approvals.find((a: any) => a.approver_id === userId && a.order === currentStep && a.status === 'pending');
  const isMyTurn = !!myApproval && cr.status === 'submitted';
  const isSigner = myApproval?.role === 'signer';

  const submitMutation = useMutation({
    mutationFn: () => changeRequestService.submit(cr.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('CR submitted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: () => changeRequestService.approve(cr.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('CR approved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to approve'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => changeRequestService.delete(cr.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('CR deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <motion.div
      layout
      className="bg-white rounded-[6px] border border-border-subtle hover:border-navy-700/20 transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-navy-900 text-base leading-snug">{cr.title}</h3>
            <p className="text-xs text-text-placeholder mt-0.5">{formatDate(cr.created_at)}</p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} flex-shrink-0`}
          >
            <StatusIcon className="w-3 h-3" />
            {sc.label}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{pc.label}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-border-subtle text-text-tertiary capitalize">
            {cr.change_type}
          </span>
          {cr.rencana_waktu && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-border-subtle text-text-tertiary">
              {new Date(cr.rencana_waktu).toLocaleDateString('en-GB')}
            </span>
          )}
          {cr.total_steps > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-navy-700/8 text-navy-700">
              {currentStep > 0 ? `Step ${currentStep}/${cr.total_steps}` : `${cr.total_steps} step`}
            </span>
          )}
        </div>

        {isMyTurn && (
          <div className="mb-3 flex items-center gap-2 bg-info-soft text-info-text text-xs font-semibold px-3 py-2 rounded-[6px]">
            <Clock className="w-3.5 h-3.5" />
            {isSigner ? 'Your turn to sign this CR document' : 'Your turn to review this CR'}
          </div>
        )}

        {cr.status === 'approved' && cr.signed_document_id && (
          <button
            onClick={async () => {
              try {
                const res = await api.get(`/api/v1/change-requests/${cr.id}/document`, { responseType: 'blob' });
                const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `CR_${cr.id}_signed.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                toast.error('Failed to download document');
              }
            }}
            className="mb-3 flex items-center gap-2 bg-navy-700/8 text-navy-900 text-xs font-semibold px-3 py-2 rounded-[6px] hover:bg-navy-700/10 transition-colors"
          >
            <Pen className="w-3.5 h-3.5" /> Download Signed Document
          </button>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-placeholder hover:text-text-secondary transition-colors mb-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide progress' : 'View progress'}
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
            <button
              onClick={() => onEdit(cr)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-2"
            >
              Edit
            </button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-700 text-white hover:bg-navy-900 disabled:opacity-50"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this CR?')) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger-soft"
            >
              Delete
            </button>
          </>
        )}
        {cr.requester_id === userId && cr.status === 'approved' && (
          <button
            onClick={() => onImplement(cr.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-success-text text-white hover:bg-success-text disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark as Implemented
          </button>
        )}
        {isMyTurn && !isSigner && (
          <>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-success text-white hover:bg-success-text disabled:opacity-50"
            >
              {approveMutation.isPending ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => onReject(cr.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger-soft"
            >
              Reject
            </button>
          </>
        )}
        {isMyTurn && isSigner && (
          <button
            onClick={() => onSign(cr)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-700 text-white hover:bg-navy-900 flex items-center gap-1.5"
          >
            <Pen className="w-3 h-3" /> Sign
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ChangeManagementPage() {
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [signCr, setSignCr] = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [tab, setTab] = useState<TabFilter>('all');

  const { data: usersData } = useQuery({
    queryKey: ['all-users-directory'],
    queryFn: () => api.get('/api/v1/users', { params: { per_page: 100 } }).then((r) => r.data.data),
  });
  const usersMap: Record<string, string> = useMemo(
    () => Object.fromEntries((usersData || []).map((u: any) => [u.id, u.full_name || u.email])),
    [usersData],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['change-requests'],
    queryFn: () => changeRequestService.list({}).then((r) => r.data.data),
  });

  const crs: any[] = data?.data || [];
  const qc = useQueryClient();
  const implementCrMutation = useMutation({
    mutationFn: (id: string) => changeRequestService.implement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('CR marked as implemented');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const awaitingMe = useMemo(() => crs.filter((cr) => isMyTurnFn(cr, user?.id || '')), [crs, user?.id]);

  const filtered = useMemo(() => {
    switch (tab) {
      case 'awaiting_me':
        return crs.filter((cr) => isMyTurnFn(cr, user?.id || ''));
      case 'in_flight':
        return crs.filter((cr) => ['submitted', 'approved'].includes(cr.status));
      case 'submitted_by_me':
        return crs.filter((cr) => cr.requester_id === user?.id);
      case 'closed':
        return crs.filter((cr) => ['rejected', 'implemented'].includes(cr.status));
      default:
        return crs;
    }
  }, [crs, tab, user?.id]);

  const inFlight = crs.filter((cr) => ['submitted', 'approved'].includes(cr.status)).length;

  return (
    <AppLayout>
      <CRModal
        open={createOpen || !!editData}
        onClose={() => {
          setCreateOpen(false);
          setEditData(null);
          setPendingFiles([]);
        }}
        editData={editData}
        pendingFiles={pendingFiles}
        setPendingFiles={setPendingFiles}
      />
      <RejectModal open={!!rejectId} crId={rejectId || ''} onClose={() => setRejectId(null)} />
      <SignModal open={!!signCr} cr={signCr} onClose={() => setSignCr(null)} />

      <PageHeader
        section="GOVERNANCE"
        title="Change Management"
        subtitle={`${crs.length} request${crs.length !== 1 ? 's' : ''} · ${inFlight} in flight · ${awaitingMe.length} awaiting you`}
        actions={
          <>
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              New request
            </button>
          </>
        }
      />

      {/* Priority banner */}
      {awaitingMe.length > 0 && (
        <div
          className="bg-white border border-border rounded-[6px] px-[15px] py-[11px] flex items-center gap-[12px]"
          style={{ borderLeft: '3px solid #c9971b' }}
        >
          <AlertTriangle className="w-[14px] h-[14px] text-gold-500 flex-none" />
          <div className="flex-1 min-w-0">
            <span className="text-[12.5px] font-semibold text-navy-800">
              {awaitingMe.length === 1 ? `${awaitingMe[0].title} ` : `${awaitingMe.length} requests `}
            </span>
            <span className="text-[12px] text-text-tertiary">awaiting your approval</span>
          </div>
          <span className="inline-flex items-center h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold bg-gold-soft text-gold-700">
            Action required
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border border-border rounded-[6px] flex items-center px-[15px] py-[9px] gap-[5px]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="h-[26px] px-[10px] rounded-[4px] text-[11.5px] transition-colors flex items-center gap-[5px]"
            style={tab === t.id ? { background: '#14406a', color: '#fff', fontWeight: 600 } : { color: '#6b7280', fontWeight: 500 }}
          >
            {t.label}
            {t.id === 'awaiting_me' && awaitingMe.length > 0 && (
              <span
                className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full text-[9px] font-bold"
                style={{
                  background: tab === t.id ? 'rgba(255,255,255,0.25)' : '#fdeceb',
                  color: tab === t.id ? '#fff' : '#a3231c',
                }}
              >
                {awaitingMe.length}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto font-mono text-[9.5px] text-text-meta">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* CR list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GitMerge}
          title="No change requests"
          subtitle={
            tab === 'awaiting_me'
              ? 'No requests awaiting your action'
              : tab === 'in_flight'
                ? 'No requests currently in flight'
                : tab === 'submitted_by_me'
                  ? 'You have not submitted any requests'
                  : tab === 'closed'
                    ? 'No closed requests'
                    : 'No change requests yet'
          }
        />
      ) : (
        <div className="flex flex-col gap-[8px]">
          {filtered.map((cr: any) => (
            <CRCard
              key={cr.id}
              cr={cr}
              userId={user?.id || ''}
              onEdit={setEditData}
              onReject={setRejectId}
              onSign={setSignCr}
              onImplement={(id: string) => implementCrMutation.mutate(id)}
              usersMap={usersMap}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
