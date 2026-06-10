'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, Upload, Download, Trash2, File } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { storageService } from '@/lib/api';
import toast from 'react-hot-toast';

export default function StoragePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => storageService.download('list').then(r => r.data.data).catch(() => []),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storageService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['files'] }); toast.success('File dihapus'); setDeleteId(null); },
    onError: () => toast.error('Gagal menghapus file'),
  });

  return (
    <AppLayout>
      <PageHeader
        title="Storage"
        subtitle="Kelola file dan dokumen project"
        icon={HardDrive}
        actions={
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="btn-primary flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4" />
              {uploading ? 'Mengupload...' : 'Upload File'}
            </button>
          </>
        }
      />

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center mb-6 hover:border-[#284074]/40 hover:bg-[#284074]/5 transition-all cursor-pointer group"
      >
        <Upload className="w-8 h-8 text-slate-300 group-hover:text-[#284074] mx-auto mb-2 transition-colors" />
        <div className="text-sm text-slate-400 group-hover:text-slate-600">Klik atau drag & drop file di sini</div>
        <div className="text-xs text-slate-300 mt-1">PDF, DOC, DOCX, XLS, PNG, JPG</div>
      </div>

      {isLoading ? <LoadingSpinner /> : !files?.length ? (
        <EmptyState icon={HardDrive} title="Belum ada file" subtitle="Upload file pertama kamu" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['File', 'Ukuran', 'Diupload', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {files.map((f: any) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#284074]/10 flex items-center justify-center">
                        <File className="w-4 h-4 text-[#284074]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{f.original_name || f.filename}</div>
                        <div className="text-xs text-slate-400">{f.mime_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{f.size ? `${Math.round(f.size / 1024)}KB` : '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{f.created_at?.slice(0, 10)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <a href={f.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-[#284074] hover:bg-[#284074]/10 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                      <button onClick={() => setDeleteId(f.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus File?" message="File yang dihapus tidak bisa dikembalikan." />
    </AppLayout>
  );
}
