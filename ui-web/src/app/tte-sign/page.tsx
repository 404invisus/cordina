'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePen,
  Plus,
  Download,
  Send,
  CheckCircle2,
  Users,
  ChevronRight,
  X,
  Upload,
  Eye,
  Lock,
  Share2,
  FileCheck,
  AlertTriangle,
  History,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { tteSignService, userGroupService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { formatDateTime as formatDate } from '@/lib/format';
import StepChain, { type StepChainStep } from '@/components/ui/StepChain';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-border-subtle text-text-tertiary' },
  waiting_signature: { label: 'Awaiting Signature', color: 'bg-pending-soft text-pending-text' },
  signed: { label: 'Fully Signed', color: 'bg-success-soft text-success-text' },
  distributed: { label: 'Distributed', color: 'bg-navy-700/10 text-navy-900' },
};

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [signerIds, setSignerIds] = useState<string[]>([]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-tte'],
    queryFn: () =>
      import('@/lib/api').then((m) => m.default.get('/api/v1/users?per_page=100')).then((r) => r.data?.data?.data || r.data?.data || []),
    staleTime: 60000,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['user-groups-tte'],
    queryFn: () => userGroupService.list().then((r) => r.data.data || []),
    staleTime: 60000,
  });
  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('File is required');
      if (file.size > 20 * 1024 * 1024) throw { response: { data: { message: 'Maximum file size is 20 MB' } } };
      const fd = new FormData();
      fd.append('title', title);
      if (desc) fd.append('description', desc);
      fd.append('file', file);
      signerIds.forEach((id) => fd.append('signer_ids[]', id));
      return tteSignService.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tte-sign-requests'] });
      toast.success('e-Sign request created!');
      onClose();
      setFile(null);
      setTitle('');
      setDesc('');
      setSignerIds([]);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create request'),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-700/8 rounded-[6px] flex items-center justify-center">
              <FilePen className="w-4 h-4 text-navy-700" />
            </div>
            <h2 className="text-lg font-bold text-navy-900">Create e-Sign Request</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border-subtle rounded-[6px]">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Document Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-navy-700/20"
              placeholder="Enter document title"
              style={{ color: '#94a3b8' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-navy-700/20 resize-none"
              placeholder="Brief description (optional)"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              PDF File * <span className="text-text-placeholder font-normal">(max. 20 MB)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`mt-1 border-2 border-dashed rounded-[6px] p-4 text-center cursor-pointer transition-colors
 ${file ? 'border-navy-700/30 bg-navy-700/8' : 'border-border hover:border-navy-700/30'}`}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Upload className="w-5 h-5 text-text-placeholder mx-auto mb-1" />
              {file ? (
                <p className="text-sm font-medium text-navy-900">{file.name}</p>
              ) : (
                <p className="text-sm text-text-placeholder">Click to upload PDF</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Additional Signatories</label>
            <p className="text-xs text-text-placeholder mt-0.5">You are automatically the first signatory (order 1)</p>
            <UserMultiSelect users={allUsers.filter((u: any) => u.id !== (user as any)?.id)} selected={signerIds} onChange={setSignerIds} />
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title || !file}
            className="w-full py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Creating...' : 'Create e-Sign Request'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function UserMultiSelect({
  selected,
  onChange,
  users,
  showOrder = true,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  users: any[];
  showOrder?: boolean;
}) {
  const toggle = (uid: string) => onChange(selected.includes(uid) ? selected.filter((id) => id !== uid) : [...selected, uid]);
  return (
    <div>
      <div className="mt-1 border border-border rounded-[6px] overflow-hidden">
        <div className="max-h-40 overflow-y-auto divide-y divide-surface-2">
          {users.map((u: any) => {
            const checked = selected.includes(u.id);
            const idx = selected.indexOf(u.id);
            return (
              <div
                key={u.id}
                onClick={() => toggle(u.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-navy-700/8' : 'hover:bg-surface-2'}`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all ${checked ? 'bg-navy-700 border-navy-700 text-white' : 'border-border-button'}`}
                >
                  {checked ? (showOrder ? idx + 2 : '✓') : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate">{u.full_name || u.email}</div>
                  <div className="text-xs text-text-placeholder">{u.email}</div>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <div className="px-3 py-4 text-sm text-text-placeholder text-center">No users available</div>}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {selected.map((uid, i) => {
            const u = users.find((u) => u.id === uid);
            return (
              <span
                key={uid}
                className="inline-flex items-center gap-1 text-xs bg-navy-700/10 text-navy-900 px-2 py-0.5 rounded-full font-medium"
              >
                {showOrder ? `${i + 2}. ` : ''}
                {u?.full_name || uid}
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

function DetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: allGroups = [] } = useQuery({
    queryKey: ['user-groups-tte-detail'],
    queryFn: () => userGroupService.list().then((r) => r.data.data || []),
    staleTime: 60000,
  });
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [passphrase, setPassphrase] = useState('');
  const [showSign, setShowSign] = useState(false);
  const [showDist, setShowDist] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyData, setVerifyData] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [distIds, setDistIds] = useState<string[]>([]);
  const [distGroupIds, setDistGroupIds] = useState<string[]>([]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-tte'],
    queryFn: () =>
      import('@/lib/api').then((m) => m.default.get('/api/v1/users?per_page=100')).then((r) => r.data?.data?.data || r.data?.data || []),
    staleTime: 60000,
  });
  const [tab, setTab] = useState<'info' | 'log'>('info');

  const { data: detail, isLoading } = useQuery({
    queryKey: ['tte-sign-detail', id],
    queryFn: () => tteSignService.show(id).then((r) => r.data.data),
    refetchInterval: 5000,
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/esign/warmup`).catch(() => {});
      return tteSignService.sign(id, passphrase);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tte-sign-detail', id] });
      qc.invalidateQueries({ queryKey: ['tte-sign-requests'] });
      toast.success('Document signed successfully!');
      setShowSign(false);
      setPassphrase('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to sign document'),
  });

  const distMutation = useMutation({
    mutationFn: () => tteSignService.distribute(id, distIds, distGroupIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tte-sign-detail', id] });
      qc.invalidateQueries({ queryKey: ['tte-sign-requests'] });
      toast.success('Document distributed successfully!');
      setShowDist(false);
      setDistIds([]);
      setDistGroupIds([]);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to distribute document'),
  });

  const handleVerify = async () => {
    setVerifyLoading(true);
    try {
      const res = await tteSignService.download(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const fd = new FormData();
      fd.append('file', new File([blob], 'signed.pdf', { type: 'application/pdf' }));
      const vRes = await import('@/lib/api').then((m) => m.default.post(`/api/v1/tte-sign-requests/${id}/verify`));
      setVerifyData(vRes.data?.data);
    } catch {
      toast.error('Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await tteSignService.download(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = (detail?.title || 'document') + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const ACTION_LABELS: Record<string, string> = {
    created: 'Document created',
    signer_added: 'Signatory added',
    submitted: 'Document submitted',
    signed: 'Signed',
    all_signed: 'All signatories completed',
    rejected: 'Rejected',
    distributed: 'Distributed',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-700/8 rounded-[6px] flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-navy-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900">{detail?.title || '...'}</h2>
              {detail?.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CONFIG[detail.status]?.color}`}>
                  {STATUS_CONFIG[detail.status]?.label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border-subtle rounded-[6px]">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex gap-2 border-b border-border-subtle">
              {[
                { key: 'info', label: 'Info & Signatories', icon: Users },
                { key: 'log', label: 'Audit Trail', icon: History },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px
 ${tab === t.key ? 'border-navy-700 text-navy-700' : 'border-transparent text-text-placeholder hover:text-text-secondary'}`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <>
                {detail?.description && <p className="text-sm text-text-tertiary">{detail.description}</p>}

                <div>
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Signatory Order</h3>
                  <StepChain
                    steps={(detail?.signers || []).map(
                      (s: any, i: number, arr: any[]): StepChainStep => ({
                        label: s.user?.full_name || '-',
                        assignee: s.signed_at ? formatDate(s.signed_at) : undefined,
                        status:
                          s.status === 'signed'
                            ? 'completed'
                            : s.status === 'rejected'
                              ? 'rejected'
                              : arr.slice(0, i).every((prev) => prev.status === 'signed')
                                ? 'current'
                                : 'pending',
                      }),
                    )}
                  />
                </div>

                {detail?.distributions?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Distribution Recipients</h3>
                    <div className="space-y-1">
                      {detail.distributions.map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-[6px]">
                          {d.type === 'group'
                            ? <Users className="w-3.5 h-3.5 text-navy-700/60" />
                            : <Share2 className="w-3.5 h-3.5 text-navy-700/60" />}
                          <span className="text-sm text-text-secondary">{d.name || d.user?.full_name || '-'}</span>
                          {d.type === 'group' && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-navy-700/10 text-navy-700">Group</span>
                          )}
                          <span className="text-xs text-text-placeholder ml-auto">{formatDate(d.distributed_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'log' && (
              <div className="space-y-2">
                {detail?.logs?.map((l: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-navy-700/60 mt-1.5 flex-shrink-0" />
                      {i < detail.logs.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="text-sm font-semibold text-navy-800">{ACTION_LABELS[l.action] || l.action}</div>
                      <div className="text-xs text-text-placeholder">
                        {l.user?.full_name} · {formatDate(l.created_at)}
                      </div>
                      {l.note && <div className="text-xs text-text-tertiary mt-0.5">{l.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-border-subtle">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
              >
                <Download className="w-4 h-4" /> Download
              </button>

              {detail?.can_sign && !showSign && (
                <button
                  onClick={() => setShowSign(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900"
                >
                  <Lock className="w-4 h-4" /> Sign
                </button>
              )}

              {detail?.can_distribute && !showDist && (
                <button
                  onClick={() => setShowDist(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-success-text text-white text-sm font-semibold hover:bg-success-text"
                >
                  <Send className="w-4 h-4" /> Distribute
                </button>
              )}

              {detail?.status === 'distributed' && (
                <button
                  onClick={() => setShowVerify((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
                >
                  <Eye className="w-4 h-4" /> Verify e-Sign
                </button>
              )}
            </div>

            {showVerify && (
              <div className="p-4 bg-surface-2 rounded-[6px] border border-border space-y-3">
                {!verifyData && (
                  <button
                    onClick={handleVerify}
                    disabled={verifyLoading}
                    className="w-full py-2 rounded-[6px] bg-text-secondary text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {verifyLoading ? 'Verifying...' : 'Check Digital Signature'}
                  </button>
                )}
                {verifyData && (
                  <div className="space-y-2">
                    <div
                      className={`flex items-center gap-2 p-3 rounded-[6px] ${verifyData.conclusion === 'VALID' ? 'bg-success-soft border border-success-soft' : 'bg-danger-soft border border-danger-soft'}`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${verifyData.conclusion === 'VALID' ? 'text-success' : 'text-danger'}`}
                      />
                      <div>
                        <div className={`text-sm font-semibold ${verifyData.conclusion === 'VALID' ? 'text-success-text' : 'text-danger-text'}`}>
                          {verifyData.conclusion === 'VALID' ? 'Document Valid' : 'Document Invalid'}
                        </div>
                        <div className="text-xs text-text-placeholder">{verifyData.description}</div>
                      </div>
                    </div>
                    {verifyData.signatureInformations?.map((s: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-[6px] border border-border-subtle text-sm">
                        <div className="font-semibold text-navy-800">{s.signerName}</div>
                        <div className="text-xs text-text-placeholder mt-0.5">
                          {formatDate(s.signatureDate)} · {s.signatureFormat}
                        </div>
                        <div className="flex gap-2 mt-1.5">
                          {s.integrityValid && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success-soft text-success-text font-semibold">
                              Integrity OK
                            </span>
                          )}
                          {s.certificateTrusted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-info-soft text-info-text font-semibold">
                              Certificate Trusted
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showSign && (
              <div className="p-4 bg-navy-700/8 rounded-[6px] border border-navy-700/10 space-y-3">
                <p className="text-sm font-semibold text-navy-900">Enter your e-Sign passphrase</p>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[6px] border border-navy-700/20 text-sm text-navy-900 placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-navy-700/30"
                  placeholder="e-Sign passphrase"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => signMutation.mutate()}
                    disabled={signMutation.isPending || !passphrase}
                    className="flex-1 py-2 rounded-[6px] bg-navy-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {signMutation.isPending ? 'Signing...' : 'Confirm Signature'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSign(false);
                      setPassphrase('');
                    }}
                    className="px-3 py-2 rounded-[6px] border border-border text-sm text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showDist && (
              <div className="p-4 bg-success-soft rounded-[6px] border border-success-soft space-y-3">
                <p className="text-sm font-semibold text-success-text">Select distribution recipients</p>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mt-2">Individual</p>
                <UserMultiSelect users={allUsers} selected={distIds} onChange={setDistIds} showOrder={false} />
                {allGroups.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mt-3">Group</p>
                    <div className="border border-border rounded-[6px] overflow-hidden">
                      <div className="max-h-32 overflow-y-auto divide-y divide-surface-2">
                        {allGroups.map((g: any) => {
                          const checked = distGroupIds.includes(g.id);
                          return (
                            <div
                              key={g.id}
                              onClick={() => setDistGroupIds((prev) => (checked ? prev.filter((x) => x !== g.id) : [...prev, g.id]))}
                              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-success-soft' : 'hover:bg-surface-2'}`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-success-text border-success-text text-white' : 'border-border-button'}`}
                              >
                                {checked && <span className="text-[10px] font-bold">✓</span>}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-navy-800">{g.name}</div>
                                <div className="text-xs text-text-placeholder">{g.member_count || 0} members</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {distGroupIds.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-1.5">
                        {distGroupIds.map((gid) => {
                          const g = allGroups.find((x: any) => x.id === gid);
                          return (
                            <span
                              key={gid}
                              className="inline-flex items-center gap-1 text-xs bg-success-soft text-success-text px-2 py-0.5 rounded-full font-medium"
                            >
                              {g?.name || gid}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDistGroupIds((prev) => prev.filter((x) => x !== gid));
                                }}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => distMutation.mutate()}
                    disabled={distMutation.isPending || distIds.length === 0}
                    className="flex-1 py-2 rounded-[6px] bg-success-text text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {distMutation.isPending
                      ? 'Distributing...'
                      : `Distribute to ${distIds.length + distGroupIds.length} recipient${distIds.length + distGroupIds.length !== 1 ? 's' : ''}`}
                  </button>
                  <button
                    onClick={() => {
                      setShowDist(false);
                      setDistIds([]);
                    }}
                    className="px-3 py-2 rounded-[6px] border border-border text-sm text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function TteSignPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tte-sign-requests'],
    queryFn: () => tteSignService.list().then((r) => r.data.data),
    refetchInterval: 10000,
  });

  const requests = Array.isArray(data) ? data : [];

  return (
    <AppLayout>
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {detailId && <DetailModal id={detailId} onClose={() => setDetailId(null)} />}

      <PageHeader
        section="GOVERNANCE"
        title="e-Sign Distribution"
        subtitle="Multi-signatory electronic signature"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold hover:bg-navy-900 transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            New e-Sign Request
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <FilePen className="w-12 h-12 text-border mx-auto mb-3" />
          <div className="text-text-placeholder text-sm">No e-Sign requests yet</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((req: any) => (
            <motion.div
              key={req.id}
              layout
              className="bg-white rounded-[6px] border border-border-subtle hover:border-navy-700/20 transition-all p-5 cursor-pointer"
              onClick={() => setDetailId(req.id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-navy-700/8 rounded-[6px] flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-navy-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy-900 truncate">{req.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CONFIG[req.status]?.color}`}>
                      {STATUS_CONFIG[req.status]?.label}
                    </span>
                    {req.my_role === 'creator' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-info-soft text-info-text">Creator</span>
                    )}
                    {req.can_sign && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pending-soft text-pending-text animate-pulse">
                        Your turn!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-placeholder">{formatDate(req.created_at)}</span>
                    <span className="text-xs text-text-placeholder flex items-center gap-1">
                      <Users className="w-3 h-3" /> {req.signed_count}/{req.signer_count} signed
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-border-button flex-shrink-0 mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
