'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  X,
  Search,
  Download,
  Eye,
  Pencil,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  ChevronDown,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { documentService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

const dict = {
  en: {
    statusExpired: 'Expired {date}',
    statusExpiring: 'Expires in {days} d',
    statusAwaitingSignature: 'Awaiting signature',
    statusValid: 'Valid',
    editDocumentTitle: 'Edit Document',
    uploadDocumentTitle: 'Upload Document',
    documentTitleLabel: 'Document Title *',
    documentTitlePlaceholder: 'e.g. Cooperation Agreement with BSrE',
    categoryLabel: 'Category *',
    selectCategoryPlaceholder: 'Select category…',
    documentNumberLabel: 'Document Number',
    documentNumberPlaceholder: 'e.g. SK/2026/019',
    issueDateLabel: 'Issue Date',
    expiryDateLabel: 'Expiry Date',
    descriptionLabel: 'Description',
    fileLabel: 'File',
    fileLeaveBlank: '(leave blank to keep existing)',
    saving: 'Saving…',
    documentUpdated: 'Document updated',
    documentUploaded: 'Document uploaded',
    failedToSave: 'Failed to save',
    documentDeleted: 'Document deleted',
    failedToDelete: 'Failed to delete',
    downloadFailed: 'Download failed',
    totalDocsCount: '{count} document{s}',
    expiringWithin30: '{count} expire within 30 days',
    alreadyExpired: '{count} already expired',
    deleteDocumentTitle: 'Delete Document',
    deleteDocumentMessage: 'This document and its version history will be permanently removed.',
    sectionRecords: 'RECORDS',
    officialDocuments: 'Official Documents',
    uploadDocumentButton: 'Upload document',
    totalTitle: 'Total',
    documentsSubtitle: 'documents',
    expiringSoonTitle: 'Expiring Soon',
    within30Days: 'within 30 days',
    expiredTitle: 'Expired',
    needsRenewal: 'needs renewal',
    awaitingSignatureTitle: 'Awaiting Signature',
    inESignQueue: 'in e-Sign queue',
    expiresInDays: '{title} expires in {days} days',
    renewalRemindersText: 'Renewal reminders are sent to the document owner at 30, 14 and 3 days before expiry.',
    notificationRulesButton: 'Notification rules',
    startRenewalButton: 'Start renewal',
    searchPlaceholder: 'Search title or document number',
    categoryAllOption: 'Category: All',
    statusAllOption: 'Status: All',
    statusValidOption: 'Valid',
    statusExpiringSoonOption: 'Expiring soon',
    statusExpiredOption: 'Expired',
    colDocument: 'DOCUMENT',
    colCategory: 'CATEGORY',
    colVersion: 'VERSION',
    colStatus: 'STATUS',
    colValidUntil: 'VALID UNTIL',
    colActions: 'ACTIONS',
    loadingDocuments: 'Loading documents…',
    noDocumentsTitle: 'No documents yet',
    noDocumentsSubtitle: 'Upload your first official document.',
    uploadNow: 'Upload now',
    versionHistoryLink: 'history',
    showingOf: 'Showing {shown} of {total} · version history keeps every uploaded file',
  },
  id: {
    statusExpired: 'Kedaluwarsa {date}',
    statusExpiring: 'Kedaluwarsa dalam {days} h',
    statusAwaitingSignature: 'Menunggu tanda tangan',
    statusValid: 'Berlaku',
    editDocumentTitle: 'Ubah Dokumen',
    uploadDocumentTitle: 'Unggah Dokumen',
    documentTitleLabel: 'Judul Dokumen *',
    documentTitlePlaceholder: 'cth. Perjanjian Kerja Sama dengan BSrE',
    categoryLabel: 'Kategori *',
    selectCategoryPlaceholder: 'Pilih kategori…',
    documentNumberLabel: 'Nomor Dokumen',
    documentNumberPlaceholder: 'cth. SK/2026/019',
    issueDateLabel: 'Tanggal Terbit',
    expiryDateLabel: 'Tanggal Kedaluwarsa',
    descriptionLabel: 'Deskripsi',
    fileLabel: 'Berkas',
    fileLeaveBlank: '(biarkan kosong untuk mempertahankan berkas saat ini)',
    saving: 'Menyimpan…',
    documentUpdated: 'Dokumen diperbarui',
    documentUploaded: 'Dokumen diunggah',
    failedToSave: 'Gagal menyimpan',
    documentDeleted: 'Dokumen dihapus',
    failedToDelete: 'Gagal menghapus',
    downloadFailed: 'Gagal mengunduh',
    totalDocsCount: '{count} dokumen',
    expiringWithin30: '{count} kedaluwarsa dalam 30 hari',
    alreadyExpired: '{count} sudah kedaluwarsa',
    deleteDocumentTitle: 'Hapus Dokumen',
    deleteDocumentMessage: 'Dokumen ini beserta riwayat versinya akan dihapus secara permanen.',
    sectionRecords: 'ARSIP',
    officialDocuments: 'Dokumen Resmi',
    uploadDocumentButton: 'Unggah dokumen',
    totalTitle: 'Total',
    documentsSubtitle: 'dokumen',
    expiringSoonTitle: 'Akan Kedaluwarsa',
    within30Days: 'dalam 30 hari',
    expiredTitle: 'Kedaluwarsa',
    needsRenewal: 'perlu diperbarui',
    awaitingSignatureTitle: 'Menunggu Tanda Tangan',
    inESignQueue: 'dalam antrean e-Sign',
    expiresInDays: '{title} kedaluwarsa dalam {days} hari',
    renewalRemindersText: 'Pengingat perpanjangan dikirim ke pemilik dokumen pada 30, 14, dan 3 hari sebelum kedaluwarsa.',
    notificationRulesButton: 'Aturan notifikasi',
    startRenewalButton: 'Mulai perpanjangan',
    searchPlaceholder: 'Cari judul atau nomor dokumen',
    categoryAllOption: 'Kategori: Semua',
    statusAllOption: 'Status: Semua',
    statusValidOption: 'Berlaku',
    statusExpiringSoonOption: 'Akan kedaluwarsa',
    statusExpiredOption: 'Kedaluwarsa',
    colDocument: 'DOKUMEN',
    colCategory: 'KATEGORI',
    colVersion: 'VERSI',
    colStatus: 'STATUS',
    colValidUntil: 'BERLAKU HINGGA',
    colActions: 'TINDAKAN',
    loadingDocuments: 'Memuat dokumen…',
    noDocumentsTitle: 'Belum ada dokumen',
    noDocumentsSubtitle: 'Unggah dokumen resmi pertama Anda.',
    uploadNow: 'Unggah sekarang',
    versionHistoryLink: 'riwayat',
    showingOf: 'Menampilkan {shown} dari {total} · riwayat versi menyimpan setiap berkas yang diunggah',
  },
};

const CATEGORIES = ['Decree', 'SOP', 'Report', 'Circular', 'Contract', 'Minutes', 'Other'];

const CATEGORY_LABELS: Record<'en' | 'id', Record<string, string>> = {
  en: {
    Decree: 'Decree',
    SOP: 'SOP',
    Report: 'Report',
    Circular: 'Circular',
    Contract: 'Contract',
    Minutes: 'Minutes',
    Other: 'Other',
  },
  id: {
    Decree: 'Surat Keputusan',
    SOP: 'SOP',
    Report: 'Laporan',
    Circular: 'Surat Edaran',
    Contract: 'Kontrak',
    Minutes: 'Notulen',
    Other: 'Lainnya',
  },
};

function categoryLabel(cat: string, locale: 'en' | 'id') {
  return CATEGORY_LABELS[locale][cat] ?? cat;
}

function formatSize(bytes: any) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function isExpiringSoon(date: string) {
  if (!date) return false;
  const d = new Date(date);
  return d >= new Date() && d <= new Date(Date.now() + 30 * 86400000);
}

function isExpired(date: string) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function docStatus(doc: any) {
  if (!doc.expires_at) return 'valid';
  if (isExpired(doc.expires_at)) return 'expired';
  if (isExpiringSoon(doc.expires_at)) return 'expiring';
  return 'valid';
}

function StatusBadge({ doc }: { doc: any }) {
  const t = useT(dict);
  const s = docStatus(doc);
  if (s === 'expired') {
    const d = new Date(doc.expires_at);
    return (
      <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-danger-soft text-[10.5px] font-semibold text-danger-text">
        <span className="w-[5px] h-[5px] rounded-full bg-danger flex-shrink-0" />
        {t('statusExpired', { date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) })}
      </span>
    );
  }
  if (s === 'expiring') {
    const days = daysUntil(doc.expires_at);
    return (
      <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-gold-soft text-[10.5px] font-semibold text-gold-700">
        <span className="w-[5px] h-[5px] rounded-full bg-gold-500 flex-shrink-0" />
        {t('statusExpiring', { days })}
      </span>
    );
  }
  if (doc.status === 'awaiting_signature') {
    return (
      <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-gold-soft text-[10.5px] font-semibold text-gold-700">
        <span className="w-[5px] h-[5px] rounded-full bg-gold-500 flex-shrink-0" />
        {t('statusAwaitingSignature')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-success-soft text-[10.5px] font-semibold text-success-text">
      <span className="w-[5px] h-[5px] rounded-full bg-success flex-shrink-0" />
      {t('statusValid')}
    </span>
  );
}

function DocRowIcon({ doc }: { doc: any }) {
  const s = docStatus(doc);
  const cls =
    s === 'expired' ? 'bg-danger-soft text-danger' : s === 'expiring' ? 'bg-danger-soft text-danger' : 'bg-info-soft text-navy-700';
  return (
    <div className={cn('w-[26px] h-[26px] flex-none rounded-[5px] flex items-center justify-center', cls)}>
      <FileText className="w-3.5 h-3.5" />
    </div>
  );
}

function DocModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: editData?.title ?? '',
    category: editData?.category ?? '',
    doc_number: editData?.doc_number ?? '',
    issued_at: editData?.issued_at?.slice(0, 10) ?? '',
    expires_at: editData?.expires_at?.slice(0, 10) ?? '',
    description: editData?.description ?? '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: editData?.title ?? '',
      category: editData?.category ?? '',
      doc_number: editData?.doc_number ?? '',
      issued_at: editData?.issued_at?.slice(0, 10) ?? '',
      expires_at: editData?.expires_at?.slice(0, 10) ?? '',
      description: editData?.description ?? '',
    });
    setFile(null);
  }, [open, editData]);

  const mutation = useMutation({
    mutationFn: (fd: FormData) => (editData ? documentService.update(editData.id, fd) : documentService.create(fd)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success(editData ? t('documentUpdated') : t('documentUploaded'));
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToSave')),
  });

  const handleSubmit = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v as string);
    });
    if (file) fd.append('file', file);
    mutation.mutate(fd);
  };

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
      />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={editData ? t('editDocumentTitle') : t('uploadDocumentTitle')} size="md">
      <div className="space-y-4">
        {field('title', t('documentTitleLabel'), 'text', t('documentTitlePlaceholder'))}

        <div>
          <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{t('categoryLabel')}</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-700/20"
          >
            <option value="">{t('selectCategoryPlaceholder')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c, locale)}
              </option>
            ))}
          </select>
        </div>

        {field('doc_number', t('documentNumberLabel'), 'text', t('documentNumberPlaceholder'))}
        {field('issued_at', t('issueDateLabel'), 'date')}
        {field('expires_at', t('expiryDateLabel'), 'date')}

        <div>
          <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{t('descriptionLabel')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 resize-none focus:outline-none focus:ring-2 focus:ring-navy-700/20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
            {t('fileLabel')} {editData ? t('fileLeaveBlank') : ''}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-info-soft file:text-navy-700 hover:file:bg-navy-700/15"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || !form.title || !form.category}
            className="flex-1 px-4 py-2 rounded-md bg-navy-700 text-white text-sm font-bold hover:bg-navy-900 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? t('saving') : t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function DocumentsPage() {
  const t = useT(dict);
  const { locale } = useLocale();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search],
    queryFn: () => documentService.list({ search: search || undefined }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success(t('documentDeleted'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToDelete')),
  });

  const handleDownload = async (doc: any) => {
    try {
      const res = await documentService.download(doc.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('downloadFailed'));
    }
  };

  const allDocs: any[] = data?.data || [];

  // stats
  const total = allDocs.length;
  const expiring = allDocs.filter((d) => isExpiringSoon(d.expires_at)).length;
  const expired = allDocs.filter((d) => isExpired(d.expires_at)).length;
  const awaitingSig = allDocs.filter((d) => d.status === 'awaiting_signature').length;

  // first expiring doc for banner
  const firstExpiring = allDocs.find((d) => isExpiringSoon(d.expires_at));

  // filtered list
  const docs = allDocs.filter((d) => {
    if (category && d.category !== category) return false;
    if (statusFilter === 'expired' && !isExpired(d.expires_at)) return false;
    if (statusFilter === 'expiring' && !isExpiringSoon(d.expires_at)) return false;
    if (statusFilter === 'valid' && (isExpired(d.expires_at) || isExpiringSoon(d.expires_at))) return false;
    return true;
  });

  const subtitleText = [
    t('totalDocsCount', { count: total, s: total !== 1 ? 's' : '' }),
    expiring ? t('expiringWithin30', { count: expiring }) : null,
    expired ? t('alreadyExpired', { count: expired }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <AppLayout>
      <DocModal
        open={createOpen || !!editData}
        onClose={() => {
          setCreateOpen(false);
          setEditData(null);
        }}
        editData={editData}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        title={t('deleteDocumentTitle')}
        message={t('deleteDocumentMessage')}
        danger
      />

      <PageHeader
        section={t('sectionRecords')}
        title={t('officialDocuments')}
        subtitle={isLoading ? undefined : subtitleText}
        actions={
          <>
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-md bg-navy-700 text-white text-sm font-bold hover:bg-navy-900 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {t('uploadDocumentButton')}
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard title={t('totalTitle')} value={total} subtitle={t('documentsSubtitle')} icon={FileText} color="blue" index={0} progress={100} />
        <StatCard
          title={t('expiringSoonTitle')}
          value={expiring}
          subtitle={t('within30Days')}
          icon={Clock}
          color="orange"
          index={1}
          progress={total ? Math.round((expiring / total) * 100) : 0}
        />
        <StatCard
          title={t('expiredTitle')}
          value={expired}
          subtitle={t('needsRenewal')}
          icon={AlertTriangle}
          color="red"
          index={2}
          progress={total ? Math.round((expired / total) * 100) : 0}
        />
        <StatCard
          title={t('awaitingSignatureTitle')}
          value={awaitingSig}
          subtitle={t('inESignQueue')}
          icon={FileSignature}
          color="orange"
          index={3}
          progress={total ? Math.round((awaitingSig / total) * 100) : 0}
        />
      </div>

      {/* Expiry action banner */}
      {firstExpiring && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3.5 bg-white border border-border border-l-[3px] border-l-accent rounded-md px-[15px] py-[11px] mb-4"
        >
          <div className="w-[30px] h-[30px] flex-none rounded-[5px] bg-gold-soft flex items-center justify-center">
            <Clock className="w-4 h-4 text-gold-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-navy-800 truncate">
              {firstExpiring.doc_number && `${firstExpiring.doc_number} — `}
              {t('expiresInDays', { title: firstExpiring.title, days: daysUntil(firstExpiring.expires_at) })}
            </div>
            <div className="text-[11.5px] text-text-tertiary mt-0.5">{t('renewalRemindersText')}</div>
          </div>
          <button className="h-[34px] flex-none flex items-center px-[13px] border border-border-button rounded-md bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 whitespace-nowrap">
            {t('notificationRulesButton')}
          </button>
          <button className="h-[30px] flex-none flex items-center px-[13px] rounded-md bg-navy-700 text-white text-[11.5px] font-bold hover:bg-navy-900 transition-colors whitespace-nowrap">
            {t('startRenewalButton')}
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white border border-border rounded-md flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-[15px] py-[9px] border-b border-border-subtle flex-wrap">
          <div className="flex items-center gap-2 h-[30px] px-[11px] border border-border-input rounded-md w-[250px] text-text-placeholder text-[12px] bg-white focus-within:border-navy-700 focus-within:ring-1 focus-within:ring-navy-700/20">
            <Search className="w-3 h-3 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 bg-transparent text-text-secondary placeholder:text-text-placeholder focus:outline-none text-[12px]"
            />
          </div>

          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-[30px] pl-3 pr-7 border border-border-input rounded-md bg-white text-[11.5px] font-medium text-text-secondary appearance-none focus:outline-none focus:border-navy-700 cursor-pointer"
            >
              <option value="">{t('categoryAllOption')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c, locale)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-text-placeholder" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[30px] pl-3 pr-7 border border-border-input rounded-md bg-white text-[11.5px] font-medium text-text-secondary appearance-none focus:outline-none focus:border-navy-700 cursor-pointer"
            >
              <option value="">{t('statusAllOption')}</option>
              <option value="valid">{t('statusValidOption')}</option>
              <option value="expiring">{t('statusExpiringSoonOption')}</option>
              <option value="expired">{t('statusExpiredOption')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-text-placeholder" />
          </div>
        </div>

        {/* Column headers */}
        <div
          className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
          style={{ gridTemplateColumns: '1fr 108px 100px 140px 100px 88px' }}
        >
          {[t('colDocument'), t('colCategory'), t('colVersion'), t('colStatus'), t('colValidUntil'), t('colActions')].map((h, i) => (
            <div key={i} className={cn('font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral', i === 5 && 'text-right')}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <LoadingSpinner label={t('loadingDocuments')} />
        ) : docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('noDocumentsTitle')}
            subtitle={t('noDocumentsSubtitle')}
            action={
              <button onClick={() => setCreateOpen(true)} className="text-sm text-navy-700 font-semibold hover:underline">
                {t('uploadNow')}
              </button>
            }
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {docs.map((doc: any) => {
              const canEdit = (user as any)?.id === doc.created_by;
              const validUntil = doc.expires_at
                ? new Date(doc.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '-';
              const s = docStatus(doc);
              const dateColor = s === 'expired' ? 'text-danger' : s === 'expiring' ? 'text-gold-700' : 'text-text-secondary';

              return (
                <div
                  key={doc.id}
                  className="grid px-[15px] h-[38px] items-center border-b border-border-subtle hover:bg-surface-2 transition-colors"
                  style={{ gridTemplateColumns: '1fr 108px 100px 140px 100px 88px' }}
                >
                  {/* Document */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DocRowIcon doc={doc} />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-navy-800 truncate leading-none">{doc.title}</div>
                      <div className="font-mono text-[10px] text-text-placeholder truncate leading-none mt-px">
                        {[doc.doc_number, formatSize(doc.file_size)].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <span className="inline-flex items-center h-5 px-[7px] rounded-[3px] bg-info-soft text-navy-700 text-[10.5px] font-semibold">
                      {categoryLabel(doc.category, locale)}
                    </span>
                  </div>

                  {/* Version */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-navy-700">v{doc.version ?? 1}</span>
                    {(doc.version ?? 1) > 1 && (
                      <span className="text-[10px] text-text-placeholder underline cursor-pointer hover:text-navy-700">{t('versionHistoryLink')}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge doc={doc} />
                  </div>

                  {/* Valid until */}
                  <div className={cn('font-mono text-[11px] font-medium', dateColor)}>{validUntil}</div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    {doc.file_path && (
                      <button
                        onClick={() => handleDownload(doc)}
                        title={t('common.download')}
                        className="text-text-placeholder hover:text-navy-700 transition-colors"
                      >
                        <Download className="w-[13px] h-[13px]" />
                      </button>
                    )}
                    <button title={t('common.view')} className="text-text-placeholder hover:text-navy-700 transition-colors">
                      <Eye className="w-[13px] h-[13px]" />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => setEditData(doc)}
                          title={t('common.edit')}
                          className="text-text-placeholder hover:text-navy-700 transition-colors"
                        >
                          <Pencil className="w-[13px] h-[13px]" />
                        </button>
                        <button
                          onClick={() => setDeleteId(doc.id)}
                          title={t('common.delete')}
                          className="text-text-placeholder hover:text-danger transition-colors"
                        >
                          <X className="w-[13px] h-[13px]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!isLoading && docs.length > 0 && (
          <div className="h-[36px] flex-none flex items-center justify-between px-[15px] border-t border-border-subtle bg-surface-2">
            <span className="text-[11px] text-neutral">{t('showingOf', { shown: docs.length, total })}</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
