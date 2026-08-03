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
import toast from 'react-hot-toast';

const CATEGORIES = ['Decree', 'SOP', 'Report', 'Circular', 'Contract', 'Minutes', 'Other'];

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
  const s = docStatus(doc);
  if (s === 'expired') {
    const d = new Date(doc.expires_at);
    return (
      <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-danger-soft text-[10.5px] font-semibold text-danger-text">
        <span className="w-[5px] h-[5px] rounded-full bg-danger flex-shrink-0" />
        Expired {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </span>
    );
  }
  if (s === 'expiring') {
    const days = daysUntil(doc.expires_at);
    return (
      <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-gold-soft text-[10.5px] font-semibold text-gold-700">
        <span className="w-[5px] h-[5px] rounded-full bg-gold-500 flex-shrink-0" />
        Expires in {days} d
      </span>
    );
  }
  if (doc.status === 'awaiting_signature') {
    return (
      <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-gold-soft text-[10.5px] font-semibold text-gold-700">
        <span className="w-[5px] h-[5px] rounded-full bg-gold-500 flex-shrink-0" />
        Awaiting signature
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] bg-success-soft text-[10.5px] font-semibold text-success-text">
      <span className="w-[5px] h-[5px] rounded-full bg-success flex-shrink-0" />
      Valid
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
      toast.success(editData ? 'Document updated' : 'Document uploaded');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
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
    <Modal open={open} onClose={onClose} title={editData ? 'Edit Document' : 'Upload Document'} size="md">
      <div className="space-y-4">
        {field('title', 'Document Title *', 'text', 'e.g. Cooperation Agreement with BSrE')}

        <div>
          <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-700/20"
          >
            <option value="">Select category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {field('doc_number', 'Document Number', 'text', 'e.g. SK/2026/019')}
        {field('issued_at', 'Issue Date', 'date')}
        {field('expires_at', 'Expiry Date', 'date')}

        <div>
          <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 resize-none focus:outline-none focus:ring-2 focus:ring-navy-700/20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
            File {editData ? '(leave blank to keep existing)' : ''}
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
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || !form.title || !form.category}
            className="flex-1 px-4 py-2 rounded-md bg-navy-700 text-white text-sm font-bold hover:bg-navy-900 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function DocumentsPage() {
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
      toast.success('Document deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
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
      toast.error('Download failed');
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
    `${total} document${total !== 1 ? 's' : ''}`,
    expiring ? `${expiring} expire within 30 days` : null,
    expired ? `${expired} already expired` : null,
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
        title="Delete Document"
        message="This document and its version history will be permanently removed."
        danger
      />

      <PageHeader
        section="RECORDS"
        title="Official Documents"
        subtitle={isLoading ? undefined : subtitleText}
        actions={
          <>
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-md bg-navy-700 text-white text-sm font-bold hover:bg-navy-900 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Upload document
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard title="Total" value={total} subtitle="documents" icon={FileText} color="blue" index={0} progress={100} />
        <StatCard
          title="Expiring Soon"
          value={expiring}
          subtitle="within 30 days"
          icon={Clock}
          color="orange"
          index={1}
          progress={total ? Math.round((expiring / total) * 100) : 0}
        />
        <StatCard
          title="Expired"
          value={expired}
          subtitle="needs renewal"
          icon={AlertTriangle}
          color="red"
          index={2}
          progress={total ? Math.round((expired / total) * 100) : 0}
        />
        <StatCard
          title="Awaiting Signature"
          value={awaitingSig}
          subtitle="in e-Sign queue"
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
              {firstExpiring.title} expires in {daysUntil(firstExpiring.expires_at)} days
            </div>
            <div className="text-[11.5px] text-text-tertiary mt-0.5">
              Renewal reminders are sent to the document owner at 30, 14 and 3 days before expiry.
            </div>
          </div>
          <button className="h-[34px] flex-none flex items-center px-[13px] border border-border-button rounded-md bg-white text-[12px] font-semibold text-text-secondary hover:bg-surface-2 whitespace-nowrap">
            Notification rules
          </button>
          <button className="h-[30px] flex-none flex items-center px-[13px] rounded-md bg-navy-700 text-white text-[11.5px] font-bold hover:bg-navy-900 transition-colors whitespace-nowrap">
            Start renewal
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
              placeholder="Search title or document number"
              className="flex-1 bg-transparent text-text-secondary placeholder:text-text-placeholder focus:outline-none text-[12px]"
            />
          </div>

          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-[30px] pl-3 pr-7 border border-border-input rounded-md bg-white text-[11.5px] font-medium text-text-secondary appearance-none focus:outline-none focus:border-navy-700 cursor-pointer"
            >
              <option value="">Category: All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
              <option value="">Status: All</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-text-placeholder" />
          </div>
        </div>

        {/* Column headers */}
        <div
          className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
          style={{ gridTemplateColumns: '1fr 108px 100px 140px 100px 88px' }}
        >
          {['DOCUMENT', 'CATEGORY', 'VERSION', 'STATUS', 'VALID UNTIL', 'ACTIONS'].map((h, i) => (
            <div key={h} className={cn('font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral', i === 5 && 'text-right')}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <LoadingSpinner label="Loading documents…" />
        ) : docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            subtitle="Upload your first official document."
            action={
              <button onClick={() => setCreateOpen(true)} className="text-sm text-navy-700 font-semibold hover:underline">
                Upload now
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
                      {doc.category}
                    </span>
                  </div>

                  {/* Version */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-navy-700">v{doc.version ?? 1}</span>
                    {(doc.version ?? 1) > 1 && (
                      <span className="text-[10px] text-text-placeholder underline cursor-pointer hover:text-navy-700">history</span>
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
                        title="Download"
                        className="text-text-placeholder hover:text-navy-700 transition-colors"
                      >
                        <Download className="w-[13px] h-[13px]" />
                      </button>
                    )}
                    <button title="View" className="text-text-placeholder hover:text-navy-700 transition-colors">
                      <Eye className="w-[13px] h-[13px]" />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => setEditData(doc)}
                          title="Edit"
                          className="text-text-placeholder hover:text-navy-700 transition-colors"
                        >
                          <Pencil className="w-[13px] h-[13px]" />
                        </button>
                        <button
                          onClick={() => setDeleteId(doc.id)}
                          title="Delete"
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
            <span className="text-[11px] text-neutral">
              Showing {docs.length} of {total} · version history keeps every uploaded file
            </span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
