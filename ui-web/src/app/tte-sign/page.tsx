'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePen, Plus, Download, Send, CheckCircle2, Clock, Users,
  ChevronRight, X, Upload, Eye, Lock, Share2, FileCheck, AlertTriangle, History
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { tteSignService, userGroupService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:             { label: 'Draft',              color: 'bg-slate-100 text-slate-500' },
  waiting_signature: { label: 'Menunggu TTD',       color: 'bg-amber-100 text-amber-700' },
  signed:            { label: 'Selesai Ditandatangani', color: 'bg-emerald-100 text-emerald-700' },
  distributed:       { label: 'Didistribusikan',    color: 'bg-violet-100 text-violet-700' },
};

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [signerIds, setSignerIds] = useState<string[]>([]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-tte'],
    queryFn: () => import('@/lib/api').then(m => m.default.get('/api/v1/users?per_page=100')).then(r => r.data?.data?.data || r.data?.data || []),
    staleTime: 60000,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['user-groups-tte'],
    queryFn: () => userGroupService.list().then(r => r.data.data || []),
    staleTime: 60000,
  });
  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('File wajib diisi');
      if (file.size > 500 * 1024) throw { response: { data: { message: 'Maksimal 500 KB' } } };
      const fd = new FormData();
      fd.append('title', title);
      if (desc) fd.append('description', desc);
      fd.append('file', file);
      signerIds.forEach(id => fd.append('signer_ids[]', id));
      return tteSignService.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tte-sign-requests'] });
      toast.success('Permintaan TTE dibuat!');
      onClose(); setFile(null); setTitle(''); setDesc(''); setSignerIds([]);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal membuat permintaan'),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <FilePen className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Buat Permintaan TTE</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul Dokumen *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="Masukkan judul dokumen" style={{color:"#94a3b8"}} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none"
              placeholder="Deskripsi singkat (opsional)" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">File PDF * <span className="text-slate-400 font-normal">(maks. 500 KB)</span></label>
            <div onClick={() => fileRef.current?.click()}
              className={`mt-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
                ${file ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              {file ? <p className="text-sm font-medium text-violet-700">{file.name}</p>
                : <p className="text-sm text-slate-400">Klik untuk upload PDF</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penandatangan Tambahan</label>
            <p className="text-xs text-slate-400 mt-0.5">Anda otomatis menjadi penandatangan pertama (urutan 1)</p>
            <UserMultiSelect
              users={allUsers.filter((u: any) => u.id !== (user as any)?.id)}
              selected={signerIds}
              onChange={setSignerIds}
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !title || !file}
            className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {mutation.isPending ? 'Membuat...' : 'Buat Permintaan TTE'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function UserMultiSelect({ selected, onChange, users, showOrder = true }: {
  selected: string[]; onChange: (ids: string[]) => void; users: any[]; showOrder?: boolean;
}) {
  const toggle = (uid: string) => onChange(selected.includes(uid) ? selected.filter(id => id !== uid) : [...selected, uid]);
  return (
    <div>
      <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
          {users.map((u: any) => {
            const checked = selected.includes(u.id);
            const idx = selected.indexOf(u.id);
            return (
              <div key={u.id} onClick={() => toggle(u.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all ${checked ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300'}`}>
                  {checked ? (showOrder ? idx + 2 : '✓') : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{u.full_name || u.email}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <div className="px-3 py-4 text-sm text-slate-400 text-center">Tidak ada pengguna</div>}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {selected.map((uid, i) => {
            const u = users.find(u => u.id === uid);
            return (
              <span key={uid} className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                {showOrder ? `${i + 2}. ` : ''}{u?.full_name || uid}
                <button onClick={e => { e.stopPropagation(); onChange(selected.filter(id => id !== uid)); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [passphrase, setPassphrase] = useState('');
  const [showSign, setShowSign]     = useState(false);
  const [showDist, setShowDist]     = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyData, setVerifyData] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [distIds, setDistIds]       = useState<string[]>([]);
  const [distGroupIds, setDistGroupIds] = useState<string[]>([]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-tte'],
    queryFn: () => import('@/lib/api').then(m => m.default.get('/api/v1/users?per_page=100')).then(r => r.data?.data?.data || r.data?.data || []),
    staleTime: 60000,
  });
  const [tab, setTab]               = useState<'info' | 'log'>('info');

  const { data: detail, isLoading } = useQuery({
    queryKey: ['tte-sign-detail', id],
    queryFn: () => tteSignService.show(id).then(r => r.data.data),
    refetchInterval: 5000,
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      await fetch('http://localhost:8000/api/v1/esign/warmup').catch(() => {});
      return tteSignService.sign(id, passphrase);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tte-sign-detail', id] });
      qc.invalidateQueries({ queryKey: ['tte-sign-requests'] });
      toast.success('Dokumen berhasil ditandatangani!');
      setShowSign(false); setPassphrase('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menandatangani'),
  });

  const distMutation = useMutation({
    mutationFn: () => tteSignService.distribute(id, distIds, distGroupIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tte-sign-detail', id] });
      qc.invalidateQueries({ queryKey: ['tte-sign-requests'] });
      toast.success('Dokumen berhasil didistribusikan!');
      setShowDist(false); setDistIds([]); setDistGroupIds([]);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal mendistribusikan'),
  });

  const handleVerify = async () => {
    setVerifyLoading(true);
    try {
      const res = await tteSignService.download(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const fd = new FormData();
      fd.append('file', new File([blob], 'signed.pdf', { type: 'application/pdf' }));
      const vRes = await import('@/lib/api').then(m => m.default.post(`/api/v1/tte-sign-requests/${id}/verify`));
      setVerifyData(vRes.data?.data);
    } catch { toast.error('Gagal verifikasi'); } finally { setVerifyLoading(false); }
  };

  const handleDownload = async () => {
    try {
      const res = await tteSignService.download(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = (detail?.title || 'dokumen') + '.pdf';
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Gagal download'); }
  };

  const ACTION_LABELS: Record<string, string> = {
    created:      'Dokumen dibuat',
    signer_added: 'Penandatangan ditambahkan',
    submitted:    'Dokumen diajukan',
    signed:       'Ditandatangani',
    all_signed:   'Semua penandatangan selesai',
    rejected:     'Ditolak',
    distributed:  'Didistribusikan',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{detail?.title || '...'}</h2>
              {detail?.status && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CONFIG[detail.status]?.color}`}>
                {STATUS_CONFIG[detail.status]?.label}
              </span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex gap-2 border-b border-slate-100">
              {[{ key: 'info', label: 'Info & Penandatangan', icon: Users },
                { key: 'log',  label: 'Audit Trail',          icon: History }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px
                    ${tab === t.key ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <>
                {detail?.description && <p className="text-sm text-slate-500">{detail.description}</p>}

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Urutan Penandatangan</h3>
                  <div className="space-y-2">
                    {detail?.signers?.map((s: any, i: number) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                          ${s.status === 'signed' ? 'bg-emerald-100 text-emerald-700'
                            : s.status === 'rejected' ? 'bg-red-100 text-red-700'
                            : 'bg-slate-200 text-slate-500'}`}>{s.order}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-800">{s.user?.full_name || '-'}</div>
                          {s.signed_at && <div className="text-xs text-slate-400">{formatDate(s.signed_at)}</div>}
                        </div>
                        {s.status === 'signed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {s.status === 'pending' && <Clock className="w-4 h-4 text-amber-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                {detail?.distributions?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Penerima Distribusi</h3>
                    <div className="space-y-1">
                      {detail.distributions.map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                          <Share2 className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-sm text-slate-700">{d.user?.full_name || '-'}</span>
                          <span className="text-xs text-slate-400 ml-auto">{formatDate(d.distributed_at)}</span>
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
                      <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                      {i < detail.logs.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="text-sm font-semibold text-slate-800">{ACTION_LABELS[l.action] || l.action}</div>
                      <div className="text-xs text-slate-400">{l.user?.full_name} · {formatDate(l.created_at)}</div>
                      {l.note && <div className="text-xs text-slate-500 mt-0.5">{l.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <Download className="w-4 h-4" /> Unduh
              </button>

              {detail?.can_sign && !showSign && (
                <button onClick={() => setShowSign(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
                  <Lock className="w-4 h-4" /> Tandatangani
                </button>
              )}

              {detail?.can_distribute && !showDist && (
                <button onClick={() => setShowDist(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                  <Send className="w-4 h-4" /> Distribusikan
                </button>
              )}

              {detail?.status === 'distributed' && (
                <button onClick={() => setShowVerify(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <Eye className="w-4 h-4" /> Verifikasi TTE
                </button>
              )}
            </div>

            {showVerify && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                {!verifyData && (
                  <button onClick={handleVerify} disabled={verifyLoading}
                    className="w-full py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold disabled:opacity-50">
                    {verifyLoading ? 'Memverifikasi...' : 'Cek Tanda Tangan Digital'}
                  </button>
                )}
                {verifyData && (
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${verifyData.conclusion === 'VALID' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${verifyData.conclusion === 'VALID' ? 'text-emerald-500' : 'text-red-500'}`} />
                      <div>
                        <div className={`text-sm font-semibold ${verifyData.conclusion === 'VALID' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {verifyData.conclusion === 'VALID' ? 'Dokumen Valid' : 'Dokumen Tidak Valid'}
                        </div>
                        <div className="text-xs text-slate-400">{verifyData.description}</div>
                      </div>
                    </div>
                    {verifyData.signatureInformations?.map((s: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 text-sm">
                        <div className="font-semibold text-slate-800">{s.signerName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {s.signatureDate ? new Date(s.signatureDate).toLocaleString('id-ID') : '-'} · {s.signatureFormat}
                        </div>
                        <div className="flex gap-2 mt-1.5">
                          {s.integrityValid && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">Integritas OK</span>}
                          {s.certificateTrusted && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">Sertifikat Terpercaya</span>}
                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </div>
            )}

            {showSign && (
              <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 space-y-3">
                <p className="text-sm font-semibold text-violet-800">Masukkan passphrase TTE Anda</p>
                <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-violet-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="Passphrase TTE" />
                <div className="flex gap-2">
                  <button onClick={() => signMutation.mutate()} disabled={signMutation.isPending || !passphrase}
                    className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50">
                    {signMutation.isPending ? 'Menandatangani...' : 'Konfirmasi Tanda Tangan'}
                  </button>
                  <button onClick={() => { setShowSign(false); setPassphrase(''); }}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600">Batal</button>
                </div>
              </div>
            )}

            {showDist && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                <p className="text-sm font-semibold text-emerald-800">Pilih penerima distribusi</p>
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Individu</p>
                 <UserMultiSelect
                   users={allUsers}
                   selected={distIds}
                   onChange={setDistIds}
                   showOrder={false}
                 />
                 {allGroups.length > 0 && (
                   <>
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3">Group</p>
                     <div className="border border-slate-200 rounded-xl overflow-hidden">
                       <div className="max-h-32 overflow-y-auto divide-y divide-slate-50">
                         {allGroups.map((g: any) => {
                           const checked = distGroupIds.includes(g.id);
                           return (
                             <div key={g.id} onClick={() => setDistGroupIds(prev => checked ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                               className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                               <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                                 {checked && <span className="text-[10px] font-bold">✓</span>}
                               </div>
                               <div>
                                 <div className="text-sm font-medium text-slate-800">{g.name}</div>
                                 <div className="text-xs text-slate-400">{g.member_count || 0} anggota</div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                     {distGroupIds.length > 0 && (
                       <div className="flex gap-1.5 flex-wrap mt-1.5">
                         {distGroupIds.map(gid => {
                           const g = allGroups.find((x: any) => x.id === gid);
                           return (
                             <span key={gid} className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                               {g?.name || gid}
                               <button onClick={e => { e.stopPropagation(); setDistGroupIds(prev => prev.filter(x => x !== gid)); }}><X className="w-3 h-3" /></button>
                             </span>
                           );
                         })}
                       </div>
                     )}
                   </>
                 )}
                <div className="flex gap-2">
                  <button onClick={() => distMutation.mutate()} disabled={distMutation.isPending || distIds.length === 0}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                    {distMutation.isPending ? 'Mendistribusikan...' : `Distribusikan ke ${distIds.length + distGroupIds.length} penerima`}
                  </button>
                  <button onClick={() => { setShowDist(false); setDistIds([]); }}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600">Batal</button>
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
  const [detailId, setDetailId]     = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tte-sign-requests'],
    queryFn: () => tteSignService.list().then(r => r.data.data),
    refetchInterval: 10000,
  });

  const requests = Array.isArray(data) ? data : [];

  return (
    <AppLayout>
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {detailId && <DetailModal id={detailId} onClose={() => setDetailId(null)} />}

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-2xl flex items-center justify-center border border-violet-100">
            <FilePen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">TTE Distribusi</h1>
            <p className="text-sm text-slate-400 mt-0.5">Tanda tangan elektronik multi-penandatangan</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Buat Permintaan TTE
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <FilePen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <div className="text-slate-400 text-sm">Belum ada permintaan TTE</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((req: any) => (
            <motion.div key={req.id} layout
              className="bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all p-5 cursor-pointer"
              onClick={() => setDetailId(req.id)}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">{req.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CONFIG[req.status]?.color}`}>
                      {STATUS_CONFIG[req.status]?.label}
                    </span>
                    {req.my_role === 'creator' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Pembuat</span>
                    )}
                    {req.can_sign && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 animate-pulse">Giliran Anda!</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{formatDate(req.created_at)}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {req.signed_count}/{req.signer_count} tandatangan
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
