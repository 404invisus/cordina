'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Plus, X, Search, Download, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { documentService } from '@/lib/api';
import toast from 'react-hot-toast';

function formatSize(bytes: any) {
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isExpiringSoon(date: string) {
  if (!date) return false;
  return new Date(date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function isExpired(date: string) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function DocModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title:       editData?.title       || '',
    category:    editData?.category    || '',
    doc_number:  editData?.doc_number  || '',
    issued_at:   editData?.issued_at?.slice(0,10)  || '',
    expires_at:  editData?.expires_at?.slice(0,10) || '',
    description: editData?.description || '',
  });
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: (fd: FormData) => editData ? documentService.update(editData.id, fd) : documentService.create(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success(editData ? 'Dokumen diperbarui' : 'Dokumen ditambahkan'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const handleSubmit = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (file) fd.append('file', file);
    mutation.mutate(fd);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Dokumen' : 'Tambah Dokumen'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul Dokumen *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="SOP Keamanan Sistem"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
              <option value="">Pilih kategori...</option>
              <option value="SK">Surat Keputusan (SK)</option>
              <option value="SOP">SOP</option>
              <option value="Laporan">Laporan</option>
              <option value="Surat Edaran">Surat Edaran</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Notulensi">Notulensi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          {[
            { key: 'doc_number', label: 'Nomor Dokumen',  type: 'text', placeholder: 'SOP-2024-001' },
            { key: 'issued_at',  label: 'Tanggal Terbit', type: 'date', placeholder: '' },
            { key: 'expires_at', label: 'Berlaku Hingga', type: 'date', placeholder: '' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              File {editData ? '(kosongkan jika tidak diganti)' : ''}
            </label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#284074]/10 file:text-[#284074] hover:file:bg-[#284074]/20" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit} disabled={mutation.isPending || !form.title || !form.category}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterExpiring, setFilterExpiring] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, filterExpiring],
    queryFn: () => documentService.list({
      search: search || undefined,
      expiring: filterExpiring ? '1' : undefined,
    }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Dokumen dihapus'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const handleDownload = async (doc: any) => {
    try {
      const res = await documentService.download(doc.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = doc.file_name || 'dokumen';
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Gagal download file'); }
  };

  const docs = data?.data || [];

  return (
    <AppLayout>
      <DocModal open={createOpen || !!editData} onClose={() => { setCreateOpen(false); setEditData(null); }} editData={editData} />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl flex items-center justify-center border border-blue-100">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dokumen Resmi</h1>
            <p className="text-sm text-slate-400 mt-0.5">SK, SOP, laporan, dan dokumen organisasi</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Dokumen
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari judul dokumen..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
        </div>
        <button onClick={() => setFilterExpiring(!filterExpiring)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
            filterExpiring ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
          }`}>
          <AlertTriangle className="w-4 h-4" />
          Segera Kadaluarsa
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Belum ada dokumen</p>
          <button onClick={() => setCreateOpen(true)} className="mt-3 text-sm text-[#284074] font-semibold hover:underline">Tambah sekarang</button>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc: any, i: number) => {
            const expired = isExpired(doc.expires_at);
            const expiring = !expired && isExpiringSoon(doc.expires_at);
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">{doc.category}</span>
                      {doc.doc_number && <span className="text-xs font-mono text-slate-400">{doc.doc_number}</span>}
                      {doc.version > 1 && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">v{doc.version}</span>}
                      {expired && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">Kadaluarsa</span>}
                      {expiring && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">Segera Kadaluarsa</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                    {doc.description && <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{doc.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                      {doc.issued_at && <span>Terbit: {doc.issued_at.slice(0,10)}</span>}
                      {doc.expires_at && <span className={expired ? 'text-red-500' : expiring ? 'text-amber-500' : ''}>
                        Berlaku s.d: {doc.expires_at.slice(0,10)}
                      </span>}
                      {doc.file_name && <span>{formatSize(doc.file_size)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.file_path && (
                      <button onClick={() => handleDownload(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#284074]/10 text-[#284074] hover:bg-[#284074]/20 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    )}
                    <button onClick={() => setEditData(doc)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deleteMutation.mutate(doc.id)}
                      className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
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
