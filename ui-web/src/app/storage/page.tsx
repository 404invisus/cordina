'use client';
import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  Upload,
  Download,
  Trash2,
  Search,
  Pencil,
  FolderPlus,
  Folder,
  Lock,
  Users,
  ChevronRight,
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { storageService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: {
    section: 'FILES',
    title: 'Storage',
    subtitle: 'Organize files into folders and control who can see them',
    tabMine: 'My Storage',
    tabShared: 'Internal / Shared',
    newFolder: 'New Folder',
    uploading: 'Uploading…',
    uploadedSuccess: '{name} uploaded successfully',
    uploadFailed: 'Upload failed',
    downloadFailed: 'Download failed',
    fileDeleted: 'File deleted',
    folderDeleted: 'Folder deleted',
    failedToDeleteFile: 'Failed to delete file',
    failedToDeleteFolder: 'Failed to delete folder',
    usedOfQuota: '{used} of {quota} GB used',
    totalFilesCount: '{count} files total',
    searchPlaceholder: 'Search this folder',
    colName: 'NAME',
    colVisibility: 'VISIBILITY',
    colOwner: 'OWNER',
    colDate: 'DATE',
    noItemsTitle: 'This folder is empty',
    dropFileHere: 'Drop your file here',
    uploadOrDrag: 'Upload a file, create a folder, or drag & drop',
    noSharedTitle: 'Nothing shared here yet',
    noSharedSubtitle: 'Internal files from everyone will show up here',
    typeSheet: 'Sheet',
    typePDF: 'PDF',
    typeDoc: 'Doc',
    typeImage: 'Image',
    typeFile: 'File',
    typeFolder: 'Folder',
    showingOfItems: 'Showing {shown} of {total} items',
    deleteFileTitle: 'Delete File?',
    deleteFileMessage: 'This action cannot be undone.',
    deleteFolderTitle: 'Delete Folder?',
    deleteFolderEmptyMessage: 'This action cannot be undone.',
    deleteFolderConfirmContents: 'This folder contains {files} file(s) and {folders} subfolder(s). Deleting it will permanently remove everything inside — this cannot be undone.',
    deleteEverything: 'Delete everything',
    newFolderTitle: 'New Folder',
    folderNameLabel: 'Folder name',
    folderNamePlaceholder: 'e.g. Contracts 2026',
    visibilityLabel: 'Visibility',
    visibilityInherit: 'Inherit from folder',
    visibilityPrivate: 'Private',
    visibilityInternal: 'Internal',
    visibilityHint: 'Files and subfolders inside follow this unless set separately.',
    renameFileTitle: 'Rename File',
    renameFolderTitle: 'Rename Folder',
    nameLabel: 'Name',
    byYou: 'by you',
    byName: 'by {name}',
    movedSuccess: '{name} moved',
    moveFailed: 'Failed to move',
    visibilityUpdated: 'Visibility updated',
    visibilityUpdateFailed: 'Failed to update visibility',
    renamedSuccess: 'Renamed',
    renameFailed: 'Rename failed',
    folderCreated: 'Folder created',
    folderCreateFailed: 'Failed to create folder',
  },
  id: {
    section: 'BERKAS',
    title: 'Penyimpanan',
    subtitle: 'Kelola berkas dalam folder dan atur siapa saja yang bisa melihatnya',
    tabMine: 'Penyimpanan Saya',
    tabShared: 'Internal / Bersama',
    newFolder: 'Folder Baru',
    uploading: 'Mengunggah…',
    uploadedSuccess: '{name} berhasil diunggah',
    uploadFailed: 'Gagal mengunggah',
    downloadFailed: 'Gagal mengunduh',
    fileDeleted: 'Berkas dihapus',
    folderDeleted: 'Folder dihapus',
    failedToDeleteFile: 'Gagal menghapus berkas',
    failedToDeleteFolder: 'Gagal menghapus folder',
    usedOfQuota: '{used} dari {quota} GB terpakai',
    totalFilesCount: '{count} berkas total',
    searchPlaceholder: 'Cari di folder ini',
    colName: 'NAMA',
    colVisibility: 'VISIBILITAS',
    colOwner: 'PEMILIK',
    colDate: 'TANGGAL',
    noItemsTitle: 'Folder ini kosong',
    dropFileHere: 'Lepaskan berkas Anda di sini',
    uploadOrDrag: 'Unggah berkas, buat folder, atau seret & lepas',
    noSharedTitle: 'Belum ada yang dibagikan di sini',
    noSharedSubtitle: 'Berkas internal dari semua pengguna akan muncul di sini',
    typeSheet: 'Lembar',
    typePDF: 'PDF',
    typeDoc: 'Dok',
    typeImage: 'Gambar',
    typeFile: 'Berkas',
    typeFolder: 'Folder',
    showingOfItems: 'Menampilkan {shown} dari {total} item',
    deleteFileTitle: 'Hapus Berkas?',
    deleteFileMessage: 'Tindakan ini tidak dapat dibatalkan.',
    deleteFolderTitle: 'Hapus Folder?',
    deleteFolderEmptyMessage: 'Tindakan ini tidak dapat dibatalkan.',
    deleteFolderConfirmContents: 'Folder ini berisi {files} berkas dan {folders} subfolder. Menghapusnya akan menghapus semua isi di dalamnya secara permanen — tindakan ini tidak dapat dibatalkan.',
    deleteEverything: 'Hapus semuanya',
    newFolderTitle: 'Folder Baru',
    folderNameLabel: 'Nama folder',
    folderNamePlaceholder: 'mis. Kontrak 2026',
    visibilityLabel: 'Visibilitas',
    visibilityInherit: 'Ikuti folder induk',
    visibilityPrivate: 'Privat',
    visibilityInternal: 'Internal',
    visibilityHint: 'Berkas dan subfolder di dalamnya mengikuti ini kecuali diatur terpisah.',
    renameFileTitle: 'Ganti Nama Berkas',
    renameFolderTitle: 'Ganti Nama Folder',
    nameLabel: 'Nama',
    byYou: 'oleh Anda',
    byName: 'oleh {name}',
    movedSuccess: '{name} dipindahkan',
    moveFailed: 'Gagal memindahkan',
    visibilityUpdated: 'Visibilitas diperbarui',
    visibilityUpdateFailed: 'Gagal memperbarui visibilitas',
    renamedSuccess: 'Nama diubah',
    renameFailed: 'Gagal mengubah nama',
    folderCreated: 'Folder dibuat',
    folderCreateFailed: 'Gagal membuat folder',
  },
};

const QUOTA_GB = 50;
const DRAG_MIME = 'application/x-connectone-storage-item';

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type FileTypeInfo = { labelKey: string; iconBg: string; iconColor: string; Icon: React.ElementType };

function getFileTypeInfo(mime: string): FileTypeInfo {
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv') || mime?.includes('xlsx')) {
    return { labelKey: 'typeSheet', iconBg: '#e9f4ee', iconColor: '#0f6144', Icon: FileSpreadsheet };
  }
  if (mime === 'application/pdf') {
    return { labelKey: 'typePDF', iconBg: '#fdeceb', iconColor: '#a3231c', Icon: FileText };
  }
  if (mime?.includes('word') || mime?.includes('document') || mime?.includes('docx')) {
    return { labelKey: 'typeDoc', iconBg: '#eaf1f8', iconColor: '#14406a', Icon: FileText };
  }
  if (mime?.includes('image')) {
    return { labelKey: 'typeImage', iconBg: '#fbf3e0', iconColor: '#8a6209', Icon: FileImage };
  }
  return { labelKey: 'typeFile', iconBg: '#f1f0ed', iconColor: '#5c6470', Icon: FileIcon };
}

const VISIBILITY_META: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  private:  { Icon: Lock,  color: '#5c6470', bg: '#f1f0ed' },
  internal: { Icon: Users, color: '#14406a', bg: '#eaf1f8' },
};

function VisibilityBadge({ effective, t }: { effective: string; t: (k: string, v?: any) => string }) {
  const meta = VISIBILITY_META[effective] || VISIBILITY_META.private;
  const Icon = meta.Icon;
  const labelKey = `visibility${effective.charAt(0).toUpperCase()}${effective.slice(1)}`;
  return (
    <span
      className="inline-flex items-center gap-1 h-[20px] px-[7px] rounded-[3px] text-[10.5px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      <Icon className="w-[10px] h-[10px]" />
      {t(labelKey)}
    </span>
  );
}

function VisibilitySelect({
  value,
  onChange,
  t,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  t: (k: string, v?: any) => string;
}) {
  return (
    <select
      value={value ?? ''}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-[24px] px-1.5 rounded-[4px] border border-border-input bg-white text-[10.5px] font-medium text-text-secondary focus:outline-none focus:border-navy-700 cursor-pointer"
    >
      <option value="">{t('visibilityInherit')}</option>
      <option value="private">{t('visibilityPrivate')}</option>
      <option value="internal">{t('visibilityInternal')}</option>
    </select>
  );
}

type NameModalState = { kind: 'file' | 'folder'; id: string; name: string } | null;
type DeleteState = { kind: 'file' | 'folder'; id: string; name: string } | null;

export default function StoragePage() {
  const t = useT(dict);
  const { locale } = useLocale();
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderVisibility, setNewFolderVisibility] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<NameModalState>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteState>(null);
  const [deleteConflict, setDeleteConflict] = useState<{ files: number; folders: number } | null>(null);

  const changeTab = (next: 'mine' | 'shared') => {
    setTab(next);
    setFolderId(null);
    setSearch('');
  };

  const { data, isLoading } = useQuery({
    queryKey: ['storage', tab, folderId],
    queryFn: () => (tab === 'mine' ? storageService.list(folderId) : storageService.shared(folderId)).then((r) => r.data.data),
  });

  const { data: usage } = useQuery({
    queryKey: ['storage-usage'],
    queryFn: () => storageService.usage().then((r) => r.data.data),
    enabled: tab === 'mine',
  });

  const folders: any[] = data?.folders || [];
  const files: any[] = data?.files || [];
  const breadcrumb: any[] = data?.breadcrumb || [];

  // Internal folders are collaborative: anyone signed in can upload/create subfolders
  // inside them. "My Storage" root and any folder you own are always writable; in the
  // Shared tab, being inside a folder at all means it's internal (and thus writable) —
  // there's just no single target to write into at the aggregated shared root.
  const canWriteHere = tab === 'mine' || folderId !== null;
  const isOwnFolder = (f: any) => f.owner_id === currentUserId;
  const isOwnFile = (f: any) => f.user_id === currentUserId;

  const invalidate = () => qc.invalidateQueries({ queryKey: ['storage'] });

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (folderId) fd.append('folder_id', folderId);
      await storageService.upload(fd);
      await invalidate();
      await qc.invalidateQueries({ queryKey: ['storage-usage'] });
      toast.success(t('uploadedSuccess', { name: file.name }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('uploadFailed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
  };

  const handlePanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!canWriteHere) return;
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  const handleDownload = async (file: any) => {
    try {
      const res = await storageService.download(file.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t('downloadFailed'));
    }
  };

  const createFolderMutation = useMutation({
    mutationFn: () => storageService.createFolder({ name: newFolderName, parent_id: folderId, visibility: newFolderVisibility }),
    onSuccess: async () => {
      await invalidate();
      toast.success(t('folderCreated'));
      setNewFolderOpen(false);
      setNewFolderName('');
      setNewFolderVisibility(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('folderCreateFailed')),
  });

  const updateFileVisibility = useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: string | null }) => storageService.updateFile(id, { visibility }),
    onSuccess: () => {
      invalidate();
      toast.success(t('visibilityUpdated'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('visibilityUpdateFailed')),
  });

  const updateFolderVisibility = useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: string | null }) => storageService.updateFolder(id, { visibility }),
    onSuccess: () => {
      invalidate();
      toast.success(t('visibilityUpdated'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('visibilityUpdateFailed')),
  });

  const renameMutation = useMutation({
    mutationFn: () => {
      if (!renameTarget) throw new Error('no rename target');
      return renameTarget.kind === 'file'
        ? storageService.updateFile(renameTarget.id, { file_name: renameValue })
        : storageService.updateFolder(renameTarget.id, { name: renameValue });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(t('renamedSuccess'));
      setRenameTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('renameFailed')),
  });

  const moveMutation = useMutation({
    mutationFn: ({ kind, id, name, targetFolderId }: { kind: 'file' | 'folder'; id: string; name: string; targetFolderId: string }) =>
      (kind === 'file' ? storageService.updateFile(id, { folder_id: targetFolderId }) : storageService.updateFolder(id, { parent_id: targetFolderId })).then(
        () => name,
      ),
    onSuccess: async (name) => {
      await invalidate();
      toast.success(t('movedSuccess', { name }));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('moveFailed')),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => storageService.delete(id),
    onSuccess: async () => {
      await invalidate();
      await qc.invalidateQueries({ queryKey: ['storage-usage'] });
      toast.success(t('fileDeleted'));
      setDeleteTarget(null);
    },
    onError: () => toast.error(t('failedToDeleteFile')),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force: boolean }) => storageService.deleteFolder(id, force),
    onSuccess: async () => {
      await invalidate();
      await qc.invalidateQueries({ queryKey: ['storage-usage'] });
      toast.success(t('folderDeleted'));
      setDeleteTarget(null);
      setDeleteConflict(null);
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        const match = String(err.response.data?.message || '').match(/(\d+).*?(\d+)/);
        setDeleteConflict({ files: Number(match?.[1] ?? 0), folders: Number(match?.[2] ?? 0) });
        return;
      }
      toast.error(t('failedToDeleteFolder'));
    },
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'file') deleteFileMutation.mutate(deleteTarget.id);
    else deleteFolderMutation.mutate({ id: deleteTarget.id, force: !!deleteConflict });
  };

  const handleRowDragStart = (e: React.DragEvent, kind: 'file' | 'folder', id: string) => {
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ kind, id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFolderRowDrop = (e: React.DragEvent, targetFolder: any) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;
    const { kind, id } = JSON.parse(raw);
    if (kind === 'folder' && id === targetFolder.id) return;
    const name = kind === 'folder' ? folders.find((f) => f.id === id)?.name : files.find((f) => f.id === id)?.file_name;
    moveMutation.mutate({ kind, id, name, targetFolderId: targetFolder.id });
  };

  const searchLower = search.toLowerCase();
  const filteredFolders = folders.filter((f) => !searchLower || f.name.toLowerCase().includes(searchLower));
  const filteredFiles = files.filter((f) => !searchLower || f.file_name.toLowerCase().includes(searchLower));
  const totalItems = folders.length + files.length;
  const shownItems = filteredFolders.length + filteredFiles.length;

  const usedBytes = usage?.total_bytes || 0;
  const usedGB = usedBytes / 1024 ** 3;
  const usedPct = Math.min(100, (usedGB / QUOTA_GB) * 100);
  const usedDisplay = usedGB < 0.01 ? `${(usedBytes / 1024 / 1024).toFixed(1)} MB` : `${usedGB.toFixed(1)} GB`;

  const gridCols = '1fr 150px 140px 100px 80px';

  return (
    <AppLayout>
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />

      <PageHeader
        section={t('section')}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          canWriteHere ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNewFolderOpen(true)}
                className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] border border-border-button bg-white text-[12px] font-bold text-text-secondary hover:bg-surface-2 transition-colors"
              >
                <FolderPlus className="w-3 h-3" />
                {t('newFolder')}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-60 transition-opacity"
                style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
              >
                <Upload className="w-3 h-3" />
                {uploading ? t('uploading') : t('common.upload')}
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="flex items-center justify-between mb-[14px]">
        <SegmentedControl
          options={[
            { value: 'mine', label: t('tabMine') },
            { value: 'shared', label: t('tabShared') },
          ]}
          value={tab}
          onChange={changeTab}
        />
      </div>

      {tab === 'mine' && (
        <div className="bg-white border border-border rounded-[6px] px-[15px] py-[11px] flex items-center gap-4 mb-[14px]">
          <div className="w-[30px] h-[30px] flex-none rounded-[5px] bg-info-soft flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-navy-700" />
          </div>
          <div className="min-w-[160px]">
            <div className="text-[12.5px] font-semibold text-navy-800">{t('usedOfQuota', { used: usedDisplay, quota: QUOTA_GB })}</div>
            <div className="text-[11px] text-neutral">{t('totalFilesCount', { count: (usage?.file_count ?? 0).toLocaleString() })}</div>
          </div>
          <div className="flex-1">
            <div className="h-[8px] rounded-full bg-border-subtle overflow-hidden">
              <div className="h-full bg-navy-700" style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-[10px] text-[12px] font-medium">
        <button
          onClick={() => setFolderId(null)}
          className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] hover:bg-surface-2 transition-colors',
            folderId === null ? 'text-navy-800 font-semibold' : 'text-text-tertiary',
          )}
        >
          <HardDrive className="w-3 h-3" />
          {tab === 'mine' ? t('tabMine') : t('tabShared')}
        </button>
        {breadcrumb.map((b, i) => (
          <span key={b.id} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-text-placeholder" />
            <button
              onClick={() => setFolderId(b.id)}
              className={cn(
                'px-1.5 py-0.5 rounded-[4px] hover:bg-surface-2 transition-colors',
                i === breadcrumb.length - 1 ? 'text-navy-800 font-semibold' : 'text-text-tertiary',
              )}
            >
              {b.name}
            </button>
          </span>
        ))}
      </div>

      <div style={{ minHeight: 460 }} className="flex flex-col">
        <div
          className={cn(
            'flex-1 bg-white border border-border rounded-[6px] flex flex-col overflow-hidden transition-colors',
            dragOver && 'border-gold-500 bg-gold-soft',
          )}
          onDragOver={(e) => {
            if (!canWriteHere) return;
            e.preventDefault();
            if (!e.dataTransfer.types.includes(DRAG_MIME)) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handlePanelDrop}
        >
          <div className="flex items-center px-[15px] py-[9px] gap-[10px] border-b border-border-subtle">
            <div className="flex items-center gap-[8px] h-[30px] px-[11px] border border-border-input rounded-[6px] w-[220px]">
              <Search className="w-3 h-3 text-text-placeholder flex-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 text-[12px] outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2" style={{ gridTemplateColumns: gridCols }}>
            <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('colName')}</div>
            <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('colVisibility')}</div>
            <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('colOwner')}</div>
            <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral">{t('colDate')}</div>
            <div />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : !shownItems ? (
              <EmptyState
                icon={tab === 'mine' ? HardDrive : Users}
                title={tab === 'mine' ? t('noItemsTitle') : t('noSharedTitle')}
                subtitle={tab === 'mine' ? (dragOver ? t('dropFileHere') : t('uploadOrDrag')) : t('noSharedSubtitle')}
              />
            ) : (
              <AnimatePresence>
                {filteredFolders.map((folder, i) => {
                  const own = isOwnFolder(folder);
                  return (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      draggable={own}
                      onDragStart={(e: any) => handleRowDragStart(e, 'folder', folder.id)}
                      onDragOver={(e) => {
                        if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
                        e.preventDefault();
                        setDragOverFolderId(folder.id);
                      }}
                      onDragLeave={() => setDragOverFolderId((cur) => (cur === folder.id ? null : cur))}
                      onDrop={(e) => handleFolderRowDrop(e, folder)}
                      onClick={() => setFolderId(folder.id)}
                      className={cn(
                        'grid px-[15px] h-[38px] items-center border-b border-border-subtle group hover:bg-surface-2 transition-colors cursor-pointer',
                        dragOverFolderId === folder.id && 'bg-gold-soft',
                      )}
                      style={{ gridTemplateColumns: gridCols }}
                    >
                      <div className="flex items-center gap-[10px] min-w-0">
                        <div className="w-[26px] h-[26px] flex-none rounded-[5px] flex items-center justify-center bg-navy-700/10">
                          <Folder className="w-[14px] h-[14px] text-navy-700" strokeWidth={1.5} />
                        </div>
                        <div className="text-[12.5px] font-semibold text-navy-800 truncate">{folder.name}</div>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        {own ? (
                          <VisibilitySelect
                            value={folder.visibility}
                            onChange={(v) => updateFolderVisibility.mutate({ id: folder.id, visibility: v })}
                            t={t}
                          />
                        ) : (
                          <VisibilityBadge effective={folder.effective_visibility} t={t} />
                        )}
                      </div>

                      <div className="font-mono text-[11px] text-text-secondary truncate">
                        {own ? t('byYou') : folder.owner_name || '—'}
                      </div>

                      <div className="font-mono text-[11px] text-text-secondary">{formatDate(folder.created_at, locale)}</div>

                      <div className="flex justify-end items-center gap-[2px]" onClick={(e) => e.stopPropagation()}>
                        {own && (
                          <>
                            <button
                              onClick={() => {
                                setRenameTarget({ kind: 'folder', id: folder.id, name: folder.name });
                                setRenameValue(folder.name);
                              }}
                              className="p-1 text-neutral hover:text-navy-700 transition-colors opacity-0 group-hover:opacity-100"
                              title={t('common.edit')}
                            >
                              <Pencil className="w-[13px] h-[13px]" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ kind: 'folder', id: folder.id, name: folder.name })}
                              className="p-1 text-neutral hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-[13px] h-[13px]" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {filteredFiles.map((f, i) => {
                  const { labelKey, iconBg, iconColor, Icon } = getFileTypeInfo(f.mime_type);
                  const own = isOwnFile(f);
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (filteredFolders.length + i) * 0.02 }}
                      draggable={own}
                      onDragStart={(e: any) => handleRowDragStart(e, 'file', f.id)}
                      className="grid px-[15px] h-[38px] items-center border-b border-border-subtle group hover:bg-surface-2 transition-colors"
                      style={{ gridTemplateColumns: gridCols }}
                    >
                      <div className="flex items-center gap-[10px] min-w-0">
                        <div className="w-[26px] h-[26px] flex-none rounded-[5px] flex items-center justify-center" style={{ background: iconBg }}>
                          <Icon className="w-[14px] h-[14px]" style={{ color: iconColor }} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col gap-[1px] min-w-0">
                          <div className="text-[12.5px] font-semibold text-navy-800 truncate">{f.file_name}</div>
                          <div className="font-mono text-[10px] text-text-placeholder truncate">
                            {t(labelKey)} · {formatSize(f.file_size)}
                          </div>
                        </div>
                      </div>

                      <div>
                        {own ? (
                          <VisibilitySelect
                            value={f.visibility}
                            onChange={(v) => updateFileVisibility.mutate({ id: f.id, visibility: v })}
                            t={t}
                          />
                        ) : (
                          <VisibilityBadge effective={f.effective_visibility} t={t} />
                        )}
                      </div>

                      <div className="font-mono text-[11px] text-text-secondary truncate">
                        {own ? t('byYou') : f.owner_name || '—'}
                      </div>

                      <div className="font-mono text-[11px] text-text-secondary">{formatDate(f.created_at, locale)}</div>

                      <div className="flex justify-end items-center gap-[2px]">
                        <button
                          onClick={() => handleDownload(f)}
                          className="p-1 text-neutral hover:text-navy-700 transition-colors"
                          title={t('common.download')}
                        >
                          <Download className="w-[13px] h-[13px]" />
                        </button>
                        {own && (
                          <>
                            <button
                              onClick={() => {
                                setRenameTarget({ kind: 'file', id: f.id, name: f.file_name });
                                setRenameValue(f.file_name);
                              }}
                              className="p-1 text-neutral hover:text-navy-700 transition-colors opacity-0 group-hover:opacity-100"
                              title={t('common.edit')}
                            >
                              <Pencil className="w-[13px] h-[13px]" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ kind: 'file', id: f.id, name: f.file_name })}
                              className="p-1 text-neutral hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-[13px] h-[13px]" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {!isLoading && shownItems > 0 && (
            <div className="h-[36px] flex-none flex items-center justify-between px-[15px] border-t border-border-subtle bg-surface-2">
              <span className="text-[11px] text-neutral">{t('showingOfItems', { shown: shownItems, total: totalItems })}</span>
            </div>
          )}
        </div>
      </div>

      {/* New folder modal */}
      <Modal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} title={t('newFolderTitle')} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{t('folderNameLabel')}</label>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={t('folderNamePlaceholder')}
              className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{t('visibilityLabel')}</label>
            <select
              value={newFolderVisibility ?? ''}
              onChange={(e) => setNewFolderVisibility(e.target.value || null)}
              className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-700/20"
            >
              <option value="">{t('visibilityInherit')}</option>
              <option value="private">{t('visibilityPrivate')}</option>
              <option value="internal">{t('visibilityInternal')}</option>
            </select>
            <p className="text-[11px] text-text-placeholder mt-1.5">{t('visibilityHint')}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setNewFolderOpen(false)}
              className="flex-1 h-[34px] rounded-[6px] border border-border-button text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => createFolderMutation.mutate()}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              className="flex-1 h-[34px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-50 transition-opacity"
            >
              {t('common.create')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={renameTarget?.kind === 'folder' ? t('renameFolderTitle') : t('renameFileTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{t('nameLabel')}</label>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setRenameTarget(null)}
              className="flex-1 h-[34px] rounded-[6px] border border-border-button text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => renameMutation.mutate()}
              disabled={!renameValue.trim() || renameMutation.isPending}
              className="flex-1 h-[34px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-50 transition-opacity"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget && !deleteConflict}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.kind === 'folder' ? t('deleteFolderTitle') : t('deleteFileTitle')}
        message={deleteTarget?.kind === 'folder' ? t('deleteFolderEmptyMessage') : t('deleteFileMessage')}
      />

      <ConfirmDialog
        open={!!deleteConflict}
        onClose={() => {
          setDeleteConflict(null);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title={t('deleteFolderTitle')}
        message={deleteConflict ? t('deleteFolderConfirmContents', { files: deleteConflict.files, folders: deleteConflict.folders }) : ''}
        confirmLabel={t('deleteEverything')}
        typedConfirmation={deleteTarget?.name}
      />
    </AppLayout>
  );
}
