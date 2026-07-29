'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive, Upload, Download, Trash2, Folder, Plus, Search,
  File as FileIcon, FileText, FileSpreadsheet, FileImage,
} from 'lucide-react';
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

const FOLDERS = [
  { id: 'all',       label: 'All files' },
  { id: 'task',      label: 'Task attachments' },
  { id: 'cr',        label: 'CR attachments' },
  { id: 'sprint',    label: 'Sprint artefacts' },
  { id: 'signature', label: 'Signature specimens' },
  { id: 'templates', label: 'Templates' },
  { id: 'unsorted',  label: 'Unsorted' },
];

export default function StoragePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [activeFolder, setActiveFolder] = useState('all');
  const [search, setSearch]         = useState('');

  const { data: files = [], isLoading } = useQuery<any[]>({
    queryKey: ['files'],
    queryFn: () => storageService.list().then(r => r.data.data || []),
  });

  const totalBytes  = files.reduce((a, f) => a + (f.file_size || 0), 0);
  const usedGB      = totalBytes / (1024 ** 3);
  const usedPct     = Math.min(100, (usedGB / QUOTA_GB) * 100);
  const usedDisplay = usedGB < 0.01
    ? `${(totalBytes / 1024 / 1024).toFixed(1)} MB`
    : `${usedGB.toFixed(1)} GB`;

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
      const a   = document.createElement('a');
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

  const filtered = files.filter(f => {
    if (!search) return true;
    const name = (f.original_name || f.filename || f.file_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const activeFolderLabel = FOLDERS.find(f => f.id === activeFolder)?.label ?? 'All files';

  return (
    <AppLayout>
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />

      <PageHeader
        section="FILES"
        title="Storage"
        subtitle="Working files only — signed records live in Official Documents"
        actions={
          <>
            <button className="h-[34px] flex items-center gap-[6px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] hover:bg-[#f5f4f2] transition-colors">
              <Plus className="w-3 h-3" />
              New folder
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-accent text-[#12283c] text-[12px] font-bold disabled:opacity-60 transition-opacity"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <Upload className="w-3 h-3" />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </>
        }
      />

      {/* Quota banner */}
      <div className="bg-white border border-[#e6e4df] rounded-[6px] px-[15px] py-[11px] flex items-center gap-4 mb-[14px]">
        <div className="w-[30px] h-[30px] flex-none rounded-[5px] bg-brand-soft flex items-center justify-center">
          <HardDrive className="w-4 h-4 text-brand" />
        </div>
        <div className="min-w-[160px]">
          <div className="text-[12.5px] font-semibold text-[#12283c]">
            {usedDisplay} of {QUOTA_GB} GB used
          </div>
          <div className="text-[11px] text-[#8a8f98]">
            Institution quota · {files.length.toLocaleString()} files
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-[5px]">
          <div className="h-[8px] rounded-full bg-[#eceae4] overflow-hidden flex">
            <div className="h-full bg-brand"   style={{ width: `${usedPct * 0.55}%` }} />
            <div className="h-full bg-accent"  style={{ width: `${usedPct * 0.27}%` }} />
            <div className="h-full bg-success" style={{ width: `${usedPct * 0.11}%` }} />
            <div className="h-full bg-[#8a8f98]" style={{ width: `${usedPct * 0.07}%` }} />
          </div>
          <div className="flex gap-[14px] text-[10.5px] text-[#6b7280]">
            {[
              { color: 'bg-brand',      label: 'Task attachments' },
              { color: 'bg-accent',     label: 'CR attachments' },
              { color: 'bg-success',    label: 'Signature specimens' },
              { color: 'bg-[#8a8f98]', label: 'Other' },
            ].map(s => (
              <span key={s.label} className="flex items-center gap-[5px]">
                <span className={cn('w-2 h-2 rounded-[2px] inline-block', s.color)} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
        <button className="h-[34px] flex items-center gap-[6px] px-[13px] border border-[#d9d6cf] rounded-[6px] bg-white text-[12px] font-semibold text-[#4b5563] flex-none hover:bg-[#f5f4f2] transition-colors">
          Manage quota
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-[14px]" style={{ minHeight: 460 }}>

        {/* Folder panel */}
        <div className="w-[216px] flex-none bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden">
          <div className="h-[40px] flex-none flex items-center px-[15px] border-b border-[#eceae4]">
            <span className="text-[12.5px] font-semibold text-[#0d2b48]">Folders</span>
          </div>
          <div className="p-[8px] flex flex-col gap-[1px]">
            {FOLDERS.map(folder => {
              const isActive = activeFolder === folder.id;
              const count    = folder.id === 'all' ? files.length : undefined;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={cn(
                    'flex items-center gap-[9px] px-[10px] py-[8px] rounded-[5px] w-full text-left transition-colors',
                    isActive ? 'bg-[#eaf1f8]' : 'hover:bg-[#f5f4f2]'
                  )}
                >
                  <Folder
                    className="w-[15px] h-[15px] flex-none"
                    style={{ color: isActive ? '#14406a' : '#8a8f98' }}
                    strokeWidth={1.5}
                  />
                  <span
                    className="flex-1 text-[12px] leading-none"
                    style={{ color: isActive ? '#14406a' : '#4b5563', fontWeight: isActive ? 600 : 500 }}
                  >
                    {folder.label}
                  </span>
                  {count !== undefined && (
                    <span className="font-mono text-[10px] text-[#a6a094]">{count.toLocaleString()}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-auto p-[11px] border-t border-[#eceae4] bg-[#faf9f7]">
            <div className="text-[11px] font-semibold text-[#0d2b48] mb-1">Where does a file belong?</div>
            <div className="text-[10.5px] leading-[1.45] text-[#8a8f98]">
              Storage holds working files. A document with a number, an issue date or an expiry belongs in Official Documents.
            </div>
          </div>
        </div>

        {/* File list panel */}
        <div
          className={cn(
            'flex-1 bg-white border border-[#e6e4df] rounded-[6px] flex flex-col overflow-hidden transition-colors',
            dragOver && 'border-accent bg-accent-soft'
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="flex items-center px-[15px] py-[9px] gap-[10px] border-b border-[#eceae4]">
            <span className="text-[12.5px] font-semibold text-[#0d2b48]">{activeFolderLabel}</span>
            <div className="flex items-center gap-[8px] h-[30px] px-[11px] border border-[#e2e0da] rounded-[6px] w-[200px]">
              <Search className="w-3 h-3 text-[#9ca3af] flex-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search files"
                className="flex-1 text-[12px] outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Column headers */}
          <div
            className="grid px-[15px] h-[30px] items-center border-b border-[#eceae4] bg-[#faf9f7]"
            style={{ gridTemplateColumns: '1fr 132px 108px 108px 60px' }}
          >
            {['FILE', 'TYPE', 'UPLOADED BY', 'DATE', ''].map((h, i) => (
              <div
                key={i}
                className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]"
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
                      className="grid px-[15px] h-[38px] items-center border-b border-[#f2f0ec] group hover:bg-[#faf9f7] transition-colors"
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
                          <div className="text-[12.5px] font-semibold text-[#12283c] truncate">
                            {f.original_name || f.filename || f.file_name}
                          </div>
                          <div className="font-mono text-[10px] text-[#9ca3af] truncate">
                            {formatSize(f.file_size)}
                          </div>
                        </div>
                      </div>

                      {/* Type badge */}
                      <div>
                        <span className="inline-flex items-center h-[20px] px-[7px] rounded-[3px] bg-[#f1f0ed] text-[#5c6470] text-[10.5px] font-semibold">
                          {label}
                        </span>
                      </div>

                      {/* Uploaded by */}
                      <div className="font-mono text-[11px] text-[#4b5563] truncate">
                        {uploaderInitials(uploader)}
                      </div>

                      {/* Date */}
                      <div className="font-mono text-[11px] text-[#4b5563]">
                        {fmtDate(f.created_at)}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end items-center gap-[2px]">
                        <button
                          onClick={() => handleDownload(f)}
                          className="p-1 text-[#8a8f98] hover:text-brand transition-colors"
                          title="Download"
                        >
                          <Download className="w-[13px] h-[13px]" />
                        </button>
                        <button
                          onClick={() => setDeleteId(f.id)}
                          className="p-1 text-[#8a8f98] hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
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
            <div className="h-[36px] flex-none flex items-center justify-between px-[15px] border-t border-[#eceae4] bg-[#faf9f7]">
              <span className="text-[11px] text-[#8a8f98]">
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
