'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileSignature, Upload, Download, ShieldCheck, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { esignService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function SignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [title, setTitle]         = useState('');
  const [passphrase, setPassphrase] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', file!);
      if (file && file.size > 500 * 1024) {
        throw { response: { data: { message: 'File size too large. Maximum 500 KB per document for e-signing.' } } };
      }
      fd.append('passphrase', passphrase);
      fd.append('tampilan', 'INVISIBLE');
      fd.append('nik', (user as any)?.nik || '');
      if (title) fd.append('title', title);
      return esignService.sign(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esign-docs'] });
      toast.success('Document signed successfully');
      onClose();
      setFile(null); setTitle(''); setPassphrase('');
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to sign document'),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[8px] shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-[#eceae4]">
          <span className="text-[14px] font-semibold text-[#0d2b48]">Sign document</span>
          <button onClick={onClose} className="p-[6px] hover:bg-[#f5f4f2] rounded-[4px] transition-colors">
            <X className="w-3.5 h-3.5 text-[#6b7280]" />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[14px]">
          {/* File upload */}
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98] block mb-[6px]">PDF DOCUMENT *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-[#d9d6cf] rounded-[6px] p-[14px] text-center cursor-pointer hover:border-brand hover:bg-[#f7fafd] transition-colors"
              style={file ? { borderColor: '#14406a', background: '#f0f6fc' } : {}}>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div className="flex items-center gap-[10px] text-left">
                  <div className="w-[36px] h-[36px] bg-[#fdeceb] rounded-[4px] flex items-center justify-center flex-none">
                    <span className="text-[10px] font-bold text-[#a3231c]">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#12283c] truncate">{file.name}</div>
                    <div className="text-[11px] text-[#9ca3af]">{formatSize(file.size)}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="p-[4px] hover:bg-[#fdeceb] rounded-[4px] text-[#a3231c]">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-[18px] h-[18px] text-[#c0bcb4] mx-auto mb-[6px]" />
                  <div className="text-[12px] text-[#9ca3af]">Click to upload a PDF</div>
                  <div className="text-[10px] text-[#c0bcb4] mt-1">Max 500 KB</div>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98] block mb-[6px]">DOCUMENT TITLE</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full h-[34px] px-[10px] border border-[#d9d6cf] rounded-[6px] text-[12px] text-[#12283c] focus:outline-none focus:border-brand"
              placeholder="Optional — defaults to file name" />
          </div>

          {/* Passphrase */}
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98] block mb-[6px]">SIGNING PASSPHRASE *</label>
            <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
              className="w-full h-[34px] px-[10px] border border-[#d9d6cf] rounded-[6px] text-[12px] text-[#12283c] font-mono focus:outline-none focus:border-brand"
              placeholder="Enter your e-Sign passphrase" />
          </div>

          {/* Notice */}
          <div className="flex items-start gap-[8px] px-[10px] py-[9px] bg-[#fbf3e0] border border-[#f0d68f] rounded-[6px] text-[11px] text-[#8a6209]">
            <AlertTriangle className="w-[13px] h-[13px] flex-none mt-[1px]" />
            Passphrase is never stored. The document will be electronically signed using a certificate issued by BSrE.
          </div>
        </div>

        <div className="flex gap-[8px] px-[20px] pb-[20px]">
          <button onClick={onClose}
            className="flex-1 h-[34px] border border-[#d9d6cf] rounded-[6px] text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
            Cancel
          </button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !file || !passphrase}
            className="flex-1 h-[34px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold flex items-center justify-center gap-[6px] disabled:opacity-50"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}>
            <FileSignature className="w-3 h-3" />
            {mutation.isPending ? 'Signing…' : 'Sign document'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function VerifyModal({ open, doc, onClose }: { open: boolean; doc: any; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['esign-verify', doc?.id],
    queryFn: () => esignService.verify(doc.id).then(r => {
      const d = r.data.data;
      return {
        valid: d?.valid ?? (d?.conclusion === 'VALID'),
        message: d?.message || d?.description || '',
        signers: d?.signers || d?.signatureInformations?.map((s: any) => ({
          name: s.signerName || s.commonName || s.name || 'Signer',
          signingTime: s.signatureDate ? new Date(s.signatureDate).toISOString() : null,
        })) || [],
      };
    }),
    enabled: open && !!doc,
  });

  if (!open || !doc) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[8px] shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-[#eceae4]">
          <span className="text-[14px] font-semibold text-[#0d2b48]">Verify signature</span>
          <button onClick={onClose} className="p-[6px] hover:bg-[#f5f4f2] rounded-[4px] transition-colors">
            <X className="w-3.5 h-3.5 text-[#6b7280]" />
          </button>
        </div>
        <div className="p-[20px]">
          <p className="text-[11.5px] text-[#6b7280] mb-[14px] truncate">{doc.title || doc.original_name}</p>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#eceae4] border-t-brand rounded-full animate-spin" />
            </div>
          ) : data ? (
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-[6px] border"
                style={data.valid
                  ? { background: '#e9f4ee', borderColor: '#b3d9c4', color: '#0f6144' }
                  : { background: '#fdeceb', borderColor: '#f5b8b5', color: '#a3231c' }}>
                {data.valid
                  ? <CheckCircle2 className="w-4 h-4 flex-none" />
                  : <AlertTriangle className="w-4 h-4 flex-none" />}
                <div>
                  <div className="text-[12.5px] font-semibold">
                    {data.valid ? 'Signature valid' : 'Signature invalid'}
                  </div>
                  {data.message && <div className="text-[11px] mt-[2px] opacity-75">{data.message}</div>}
                </div>
              </div>
              {data.signers?.map((s: any, i: number) => (
                <div key={i} className="px-[12px] py-[9px] bg-[#faf9f7] rounded-[6px]">
                  <div className="text-[12px] font-semibold text-[#12283c]">{s.name || 'Signer ' + (i + 1)}</div>
                  <div className="font-mono text-[10.5px] text-[#9ca3af] mt-[2px]">
                    Signed: {s.signingTime ? formatDate(s.signingTime) : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[#9ca3af] text-center py-8">Failed to verify document</div>
          )}
          <button onClick={onClose}
            className="w-full mt-[14px] h-[34px] border border-[#d9d6cf] rounded-[6px] text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function EsignPage() {
  const { user } = useAuthStore();
  const [signOpen, setSignOpen]   = useState(false);
  const [verifyDoc, setVerifyDoc] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['esign-docs'],
    queryFn: () => esignService.list().then(r => r.data.data),
  });

  const handleDownload = async (doc: any) => {
    try {
      const res = await esignService.download(doc.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = 'signed_' + (doc.title || doc.original_name || 'document') + '.pdf';
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download document'); }
  };

  const docs = Array.isArray(data) ? data : [];
  const hasNik = !!(user as any)?.nik;
  const total = docs.length;

  return (
    <AppLayout>
      <SignModal open={signOpen} onClose={() => setSignOpen(false)} />
      <VerifyModal open={!!verifyDoc} doc={verifyDoc} onClose={() => setVerifyDoc(null)} />

      <PageHeader
        section="E-SIGN"
        title="e-Sign"
        subtitle={`${total} document${total !== 1 ? 's' : ''} signed`}
        actions={
          <>
            <button onClick={() => setSignOpen(true)} disabled={!hasNik}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}>
              <FileSignature className="w-3 h-3" strokeWidth={2.5} />Sign document
            </button>
          </>
        }
      />

      {/* NIK warning */}
      {!hasNik && (
        <div className="bg-white border border-[#e6e4df] rounded-[6px] px-[15px] py-[11px] flex items-center gap-[12px]"
          style={{ borderLeft: '3px solid #c9971b' }}>
          <AlertTriangle className="w-[14px] h-[14px] text-[#c9971b] flex-none" />
          <span className="text-[12px] text-[#4b5563]">
            NIK not set in your profile. Complete your e-Sign setup in{' '}
            <a href="/settings" className="font-semibold text-brand hover:underline">Settings</a>{' '}
            to use this feature.
          </span>
        </div>
      )}

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard index={0} title="Documents Signed" value={total} subtitle="total signed"
          icon={FileSignature} color="brand" progress={100} />
        <StatCard index={1} title="Visible Signatures" value={docs.filter(d => d.tampilan === 'VISIBLE').length} subtitle="with stamp"
          icon={ShieldCheck} color="green" progress={total > 0 ? Math.round((docs.filter(d => d.tampilan === 'VISIBLE').length / total) * 100) : 0} />
        <StatCard index={2} title="Invisible Signatures" value={docs.filter(d => d.tampilan !== 'VISIBLE').length} subtitle="embedded only"
          icon={FileSignature} color="brand" progress={total > 0 ? Math.round((docs.filter(d => d.tampilan !== 'VISIBLE').length / total) * 100) : 0} />
        <StatCard index={3} title="NIK Status" value={hasNik ? 'Active' : 'Not set'} subtitle={hasNik ? 'ready to sign' : 'configure in settings'}
          icon={ShieldCheck} color={hasNik ? 'green' : 'red'} progress={hasNik ? 100 : 0} />
      </div>

      {/* Document list */}
      <div className="bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
        {/* Table header */}
        <div className="grid px-[15px] h-[30px] items-center border-b border-[#eceae4] bg-[#faf9f7]"
          style={{ gridTemplateColumns: '1fr 180px 110px 160px' }}>
          {['FILE', 'SIGNED', 'SIGNATURE', 'ACTIONS'].map((h, i) => (
            <div key={h} className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]"
              style={i === 3 ? { textAlign: 'right' } : {}}>
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
        ) : docs.length === 0 ? (
          <div className="py-10">
            <EmptyState icon={FileSignature} title="No signed documents"
              subtitle="Upload a PDF and sign it electronically to see it here" />
          </div>
        ) : (
          docs.map((doc: any, i: number) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="grid px-[15px] h-[40px] items-center border-b border-[#f2f0ec] last:border-b-0 hover:bg-[#faf9f7] transition-colors"
              style={{ gridTemplateColumns: '1fr 180px 110px 160px' }}
            >
              {/* File name */}
              <div className="flex items-center gap-[9px] min-w-0">
                <div className="w-[26px] h-[26px] bg-[#fdeceb] rounded-[3px] flex items-center justify-center flex-none">
                  <span className="text-[9px] font-bold text-[#a3231c]">PDF</span>
                </div>
                <span className="text-[12.5px] font-semibold text-[#12283c] truncate">{doc.title || doc.original_name}</span>
              </div>

              {/* Signed at */}
              <div className="font-mono text-[11px] text-[#4b5563]">{formatDate(doc.signed_at)}</div>

              {/* Visibility */}
              <div>
                <span className="inline-flex items-center h-[20px] px-[7px] rounded-[3px] text-[10.5px] font-semibold"
                  style={doc.tampilan === 'VISIBLE'
                    ? { background: '#e9f4ee', color: '#0f6144' }
                    : { background: '#f1f0ed', color: '#5c6470' }}>
                  {doc.tampilan === 'VISIBLE' ? 'Visible' : 'Invisible'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-[6px]">
                <button onClick={() => setVerifyDoc(doc)}
                  className="h-[26px] flex items-center gap-[5px] px-[9px] border border-[#d9d6cf] rounded-[4px] text-[11px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
                  <ShieldCheck className="w-[11px] h-[11px]" />Verify
                </button>
                <button onClick={() => handleDownload(doc)}
                  className="h-[26px] flex items-center gap-[5px] px-[9px] border border-[#d9d6cf] rounded-[4px] text-[11px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
                  <Download className="w-[11px] h-[11px]" />Download
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
