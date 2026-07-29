'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Upload, Download, Trash2, Search, File as FileIcon, FileText, FileSpreadsheet, FileImage } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { storageService } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function uploaderInitials(name: string) {
  if (!name || name === '—') return '—';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type FileTypeInfo = { label: string; iconBg: string; iconColor: string; Icon: React.ElementType };

function getFileTypeInfo(mime: string): FileTypeInfo {
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv') || mime?.includes('xlsx')) {
    return { label: 'Sheet', iconBg: '#e9f4ee', iconColor: '#0f6144', Icon: FileSpreadsheet };
  }
  if (mime === 'application/pdf') {
    return { label: 'PDF', iconBg: '#fdeceb', iconColor: '#a3231c', Icon: FileText };
  }
  if (mime?.includes('word') || mime?.includes('document') || mime?.includes('docx')) {
    return { label: 'Doc', iconBg: '#eaf1f8', iconColor: '#14406a', Icon: FileText };
  }
  if (mime?.includes('image')) {
    return { label: 'Image', iconBg: '#fbf3e0', iconColor: '#8a6209', Icon: FileImage };
  }
  return { label: 'File', iconBg: '#f1f0ed', iconColor: '#5c6470', Icon: FileIcon };
}

const QUOTA_GB = 50;

export default function StoragePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState('');

  const { data: files = [], isLoading } = useQuery<any[]>({
    queryKey: ['files'],
    queryFn: () => storageService.list().then((r) => r.data.data || []),
  });

  const totalBytes = files.reduce((a, f) => a + (f.file_size || 0), 0);
  const usedGB = totalBytes / 1024 ** 3;
  const usedPct = Math.min(100, (usedGB / QUOTA_GB) * 100);
  const usedDisplay = usedGB < 0.01 ? `${(totalBytes / 1024 / 1024).toFixed(1)} MB` : `${usedGB.toFixed(1)} GB`;

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await storageService.upload(fd);
      await qc.invalidateQueries({ queryKey: ['files'] });
      await qc.refetchQueries({ queryKey: ['files'] });
      toast.success(`${file.name} uploaded successfully`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  const handleDownload = async (file: any) => {
    try {
      const res = await storageService.download(file.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name || file.file_name || file.filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storageService.delete(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['files'] });
      await qc.refetchQueries({ queryKey: ['files'] });
      toast.success('File deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const filtered = files.filter((f) => {
    if (!search) return true;
    const name = (f.original_name || f.filename || f.file_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <AppLayout>
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />

      <PageHeader
        section="FILES"
        title="Storage"
        subtitle="Working files only — signed records live in Official Documents"
        actions={
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-60 transition-opacity"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <Upload className="w-3 h-3" />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </>
        }
      />

      {/* Quota banner */}
      <div className="bg-white border border-border rounded-[6px] px-[15px] py-[11px] flex items-center gap-4 mb-[14px]">
        <div className="w-[30px] h-[30px] flex-none rounded-[5px] bg-info-soft flex items-center justify-center">
          <HardDrive className="w-4 h-4 text-navy-700" />
        </div>
        <div className="min-w-[160px]">
          <div className="text-[12.5px] font-semibold text-navy-800">
            {usedDisplay} of {QUOTA_GB} GB used
          </div>
          <div className="text-[11px] text-neutral">Institution quota · {files.length.toLocaleString()} files</div>
        </div>
        <div className="flex-1 flex flex-col gap-[5px]">
          <div className="h-[8px] rounded-full bg-border-subtle overflow-hidden flex">
            <div className="h-full bg-navy-700" style={{ width: `${usedPct * 0.55}%` }} />
            <div className="h-full bg-gold-500" style={{ width: `${usedPct * 0.27}%` }} />
            <div className="h-full bg-success" style={{ width: `${usedPct * 0.11}%` }} />
            <div className="h-full bg-neutral" style={{ width: `${usedPct * 0.07}%` }} />
          </div>
          <div className="flex gap-[14px] text-[10.5px] text-text-tertiary">
            {[
              { color: 'bg-navy-700', label: 'Task attachments' },
              { color: 'bg-gold-500', label: 'CR attachments' },
              { color: 'bg-success', label: 'Signature specimens' },
              { color: 'bg-neutral', label: 'Other' },
            ].map((s) => (
              <span key={s.label} className="flex items-center gap-[5px]">
                <span className={cn('w-2 h-2 rounded-[2px] inline-block', s.color)} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* File list panel */}
      <div style={{ minHeight: 460 }} className="flex flex-col">
        <div
          className={cn(
            'flex-1 bg-white border border-border rounded-[6px] flex flex-col overflow-hidden transition-colors',
            dragOver && 'border-gold-500 bg-gold-soft',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="flex items-center px-[15px] py-[9px] gap-[10px] border-b border-border-subtle">
            <span className="text-[12.5px] font-semibold text-navy-900">All files</span>
            <div className="flex items-center gap-[8px] h-[30px] px-[11px] border border-border-input rounded-[6px] w-[200px]">
              <Search className="w-3 h-3 text-text-placeholder flex-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files"
                className="flex-1 text-[12px] outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Column headers */}
          <div
            className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
            style={{ gridTemplateColumns: '1fr 132px 108px 108px 60px' }}
          >
            {['FILE', 'TYPE', 'UPLOADED BY', 'DATE', ''].map((h, i) => (
              <div
                key={i}
                className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral"
                style={i === 4 ? { textAlign: 'right' } : {}}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : !filtered.length ? (
              <EmptyState
                icon={HardDrive}
                title="No files yet"
                subtitle={dragOver ? 'Drop your file here' : 'Upload a file or drag & drop it onto this panel'}
              />
            ) : (
              <AnimatePresence>
                {filtered.map((f, i) => {
                  const { label, iconBg, iconColor, Icon } = getFileTypeInfo(f.mime_type);
                  const uploader = f.uploader_name || f.uploaded_by || f.user_name || '—';
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.025 }}
                      className="grid px-[15px] h-[38px] items-center border-b border-border-subtle group hover:bg-surface-2 transition-colors"
                      style={{ gridTemplateColumns: '1fr 132px 108px 108px 60px' }}
                    >
                      {/* File name + icon */}
                      <div className="flex items-center gap-[10px] min-w-0">
                        <div
                          className="w-[26px] h-[26px] flex-none rounded-[5px] flex items-center justify-center"
                          style={{ background: iconBg }}
                        >
                          <Icon className="w-[14px] h-[14px]" style={{ color: iconColor }} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col gap-[1px] min-w-0">
                          <div className="text-[12.5px] font-semibold text-navy-800 truncate">
                            {f.original_name || f.filename || f.file_name}
                          </div>
                          <div className="font-mono text-[10px] text-text-placeholder truncate">{formatSize(f.file_size)}</div>
                        </div>
                      </div>

                      {/* Type badge */}
                      <div>
                        <span className="inline-flex items-center h-[20px] px-[7px] rounded-[3px] bg-neutral-soft text-neutral-text text-[10.5px] font-semibold">
                          {label}
                        </span>
                      </div>

                      {/* Uploaded by */}
                      <div className="font-mono text-[11px] text-text-secondary truncate">{uploaderInitials(uploader)}</div>

                      {/* Date */}
                      <div className="font-mono text-[11px] text-text-secondary">{fmtDate(f.created_at)}</div>

                      {/* Actions */}
                      <div className="flex justify-end items-center gap-[2px]">
                        <button
                          onClick={() => handleDownload(f)}
                          className="p-1 text-neutral hover:text-navy-700 transition-colors"
                          title="Download"
                        >
                          <Download className="w-[13px] h-[13px]" />
                        </button>
                        <button
                          onClick={() => setDeleteId(f.id)}
                          className="p-1 text-neutral hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-[13px] h-[13px]" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {!isLoading && filtered.length > 0 && (
            <div className="h-[36px] flex-none flex items-center justify-between px-[15px] border-t border-border-subtle bg-surface-2">
              <span className="text-[11px] text-neutral">
                Showing {filtered.length} of {files.length} files
              </span>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete File?"
        message="This action cannot be undone."
      />
    </AppLayout>
  );
}
