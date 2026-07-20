'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, Upload, Download, ShieldCheck, X, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { esignService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes: number) {
  if (!bytes) return '-';
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
  const [tampilan, setTampilan]   = useState<'VISIBLE' | 'INVISIBLE'>('INVISIBLE');

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', file!);
      if (file && file.size > 500 * 1024) {
        throw { response: { data: { message: 'Ukuran file terlalu besar. Maksimal 500 KB per dokumen untuk penandatanganan elektronik.' } } };
      }
      fd.append('passphrase', passphrase);
      fd.append('tampilan', tampilan);
      fd.append('nik', (user as any)?.nik || '');
      if (title) fd.append('title', title);
      return esignService.sign(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esign-docs'] });
      toast.success('Dokumen berhasil ditandatangani!');
      onClose();
      setFile(null); setTitle(''); setPassphrase(''); setTampilan('INVISIBLE');
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menandatangani'),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <FileSignature className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Tandatangani Dokumen</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen PDF *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`mt-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
                ${file ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'}`}>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-500">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{file.name}</div>
                    <div className="text-xs text-slate-400">{formatSize(file.size)}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="p-1 hover:bg-red-100 rounded-lg text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">Klik untuk upload PDF</div>

                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul Dokumen</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
              placeholder="Nama dokumen (opsional, default nama file)" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Passphrase TTE *</label>
            <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
              placeholder="Masukkan passphrase TTE" />
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Passphrase tidak disimpan di sistem. Dokumen akan ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh BSrE.
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !file || !passphrase}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <FileSignature className="w-4 h-4" />
            {mutation.isPending ? 'Menandatangani...' : 'Tandatangani'}
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
      // Normalize BSrE response ke format yang dipakai UI
      return {
        valid: d?.valid ?? (d?.conclusion === 'VALID'),
        message: d?.message || d?.description || '',
        signers: d?.signers || d?.signatureInformations?.map((s: any) => ({
          name: s.signerName || s.commonName || s.name || 'Penandatangan',
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Verifikasi Dokumen</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4 truncate">{doc.title}</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-4 rounded-xl ${data.valid ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
              {data.valid
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                : <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <div>
                <div className={`text-sm font-semibold ${data.valid ? 'text-emerald-700' : 'text-red-700'}`}>
                  {data.valid ? 'Tanda tangan valid' : 'Tanda tangan tidak valid'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{data.message || ''}</div>
              </div>
            </div>
            {data.signers?.map((s: any, i: number) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl text-sm">
                <div className="font-medium text-slate-800">{s.name || s.commonName || 'Penandatangan ' + (i+1)}</div>
                <div className="text-xs text-slate-400 mt-0.5">Ditandatangani: {s.signingTime ? formatDate(s.signingTime) : '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 text-center py-8">Gagal memverifikasi dokumen</div>
        )}
        <button onClick={onClose} className="w-full mt-4 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Tutup</button>
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
      a.download = 'signed_' + (doc.title || doc.original_name || 'dokumen') + '.pdf';
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Gagal download dokumen'); }
  };

  const docs = Array.isArray(data) ? data : [];
  const hasNik = !!(user as any)?.nik;

  return (
    <AppLayout>
      <SignModal open={signOpen} onClose={() => setSignOpen(false)} />
      <VerifyModal open={!!verifyDoc} doc={verifyDoc} onClose={() => setVerifyDoc(null)} />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-2xl flex items-center justify-center border border-violet-100">
            <FileSignature className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">e-Sign Dokumen</h1>
            <p className="text-sm text-slate-400 mt-0.5">Tandatangani dokumen PDF secara elektronik</p>
          </div>
        </div>
        <button onClick={() => setSignOpen(true)} disabled={!hasNik}
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <FileSignature className="w-4 h-4" /> Tandatangani Dokumen
        </button>
      </div>

      {!hasNik && (
        <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>NIK belum diset di profil. Lengkapi data TTE di <a href="/settings" className="font-semibold underline">halaman Settings</a> untuk menggunakan fitur e-Sign.</div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20">
          <FileSignature className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <div className="text-slate-400 text-sm">Belum ada dokumen yang ditandatangani</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc: any) => (
            <motion.div key={doc.id} layout
              className="bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-red-500">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{doc.title || doc.original_name}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">{formatDate(doc.signed_at)}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${doc.tampilan === 'VISIBLE' ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
                    {doc.tampilan === 'VISIBLE' ? 'Visible' : 'Invisible'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setVerifyDoc(doc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verifikasi
                </button>
                <button onClick={() => handleDownload(doc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Unduh
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
