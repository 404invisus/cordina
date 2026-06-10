'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Upload, Download, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { storageService } from '@/lib/api';
import toast from 'react-hot-toast';

const MIME_CONFIG: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  'application/pdf': {
    bg: 'bg-red-50', color: 'text-red-500', label: 'PDF',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  'image/png':  { bg: 'bg-violet-50', color: 'text-violet-500', label: 'PNG', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  'image/jpeg': { bg: 'bg-violet-50', color: 'text-violet-500', label: 'JPG', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'XLSX', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { bg: 'bg-blue-50', color: 'text-blue-500', label: 'DOCX', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
};

function getMimeConf(mime: string) {
  return MIME_CONFIG[mime] || {
    bg: 'bg-slate-100', color: 'text-slate-500', label: mime?.split('/')[1]?.toUpperCase() || 'FILE',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  };
}

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function StoragePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => storageService.list().then(r => r.data.data || []).catch(() => []),
  });

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await storageService.upload(formData);
      qc.invalidateQueries({ queryKey: ['files'] });
      toast.success(`${file.name} berhasil diupload!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storageService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['files'] }); toast.success('File dihapus'); setDeleteId(null); },
    onError: () => toast.error('Gagal menghapus file'),
  });

  const totalSize = files?.reduce((a: number, f: any) => a + (f.file_size || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
              <HardDrive className="w-5 h-5 text-[#284074]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Storage</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {files?.length || 0} file · {formatSize(totalSize)} digunakan
              </p>
            </div>
          </div>
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3060] disabled:opacity-60 transition-all shadow-sm">
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Mengupload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>

        <div
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all overflow-hidden ${dragOver ? 'border-[#284074] bg-[#284074]/8 scale-[1.01]' : 'border-slate-200 hover:border-[#284074]/40 hover:bg-slate-50'}`}
        >
          <div className={`transition-all ${dragOver ? 'scale-110' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-colors ${dragOver ? 'bg-[#284074] text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Upload className="w-6 h-6" />
            </div>
            <p className={`text-sm font-semibold transition-colors ${dragOver ? 'text-[#284074]' : 'text-slate-500'}`}>
              {dragOver ? 'Lepaskan file di sini' : 'Klik atau drag & drop file di sini'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, XLS, PNG, JPG — maks. 10MB</p>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : !files?.length ? (
        <EmptyState icon={HardDrive} title="Belum ada file" subtitle="Upload file pertama kamu menggunakan area di atas" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">File Tersimpan</h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{files.length} file</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['File', 'Tipe', 'Ukuran', 'Diupload', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {files.map((f: any, i: number) => {
                  const conf = getMimeConf(f.mime_type);
                  return (
                    <motion.tr key={f.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${conf.bg} flex items-center justify-center flex-shrink-0 ${conf.color}`}>
                            {conf.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate max-w-xs">{f.original_name || f.filename}</div>
                            <div className="text-xs text-slate-400 font-mono truncate">{f.file_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${conf.bg} ${conf.color}`}>{conf.label}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 font-mono">{formatSize(f.file_size)}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{f.created_at?.slice(0, 10)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={f.url} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-[#284074] hover:bg-[#284074]/8 rounded-lg transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </a>
                          <button onClick={() => setDeleteId(f.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus File?"
        message="File yang dihapus tidak bisa dikembalikan."
      />
    </AppLayout>
  );
}