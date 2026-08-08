'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  ChevronDown,
  ChevronUp,
  Check,
  Pen,
  Paperclip,
  Download,
  Trash2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { changeRequestService, crAttachmentService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDateTime as formatDate } from '@/lib/format';
import { useT, useLocale } from '@/lib/i18n';

const dict = {
  en: {
    statusDraftLabel: 'Draft',
    statusSubmittedLabel: 'Diajukan',
    statusApprovedLabel: 'Disetujui',
    statusRejectedLabel: 'Ditolak',
    statusImplementedLabel: 'Implemented',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityCritical: 'Critical',
    tabAll: 'All',
    tabAwaitingMe: 'Awaiting me',
    tabInFlight: 'In flight',
    tabSubmittedByMe: 'Submitted by me',
    tabClosed: 'Closed',
    noUsersFound: 'No users found',
    crCreatedLabel: 'CR Dibuat',
    signerLabelPrefix: 'Penandatangan: {name}',
    reviewerLabelPrefix: 'Penilai {order}: {name}',
    waitingBadge: 'Menunggu',
    editCRTitle: 'Edit Change Request',
    createCRTitle: 'Create Change Request',
    basicInformation: 'Basic Information',
    titleLabel: 'Title',
    priorityLabel: 'Priority',
    changeTypeLabel: 'Change Type',
    changeTypeNormal: 'Normal',
    changeTypeStandard: 'Standard',
    changeTypeEmergency: 'Emergency',
    plannedChangeDateLabel: 'Planned Change Date',
    changeTitlePlaceholder: 'Change title',
    changeInformation: 'Change Information',
    proposedChangeLabel: 'Proposed Change',
    proposedChangePlaceholder: 'What will be changed?',
    changeDetailsLabel: 'Change Details',
    changeDetailsPlaceholder: 'Step-by-step details of the change',
    backgroundReasonLabel: 'Background / Reason',
    backgroundReasonPlaceholder: 'Why is this change necessary?',
    serviceDependenciesLabel: 'Service Dependencies',
    serviceDependenciesPlaceholder: 'Related services',
    affectedSystemsLabel: 'Affected Information Systems',
    affectedSystemsPlaceholder: 'Information systems impacted',
    riskAnalysis: 'Risk Analysis',
    changeRiskAnalysisLabel: 'Change Risk Analysis',
    changeRiskAnalysisPlaceholder: 'Risks that may occur',
    riskMitigationLabel: 'Risk Mitigation Steps',
    riskMitigationPlaceholder: 'Steps to reduce risk',
    riskIfNotPerformedLabel: 'Risk if Change is Not Performed',
    riskIfNotPerformedPlaceholder: 'Impact if not performed',
    failureHandlingLabel: 'Failure Handling Steps',
    failureHandlingPlaceholder: 'Rollback plan in case of failure',
    personnel: 'Personnel',
    implementersLabel: 'Implementers',
    implementersSectionTitle: 'Implementers',
    implementersEmptyForReviewer: 'Not set yet. As a reviewer, you may assign the implementers for this change request.',
    implementersEmptyForOthers: 'Not set yet. Implementers are assigned by one of the reviewers during review.',
    implementersLockedNote: 'Assigned by {name}. Only the first reviewer to assign them can do so.',
    assignImplementersBtn: 'Assign implementers',
    saveImplementersBtn: 'Save implementers',
    implementersSaved: 'Implementers assigned',
    implementersFailed: 'Failed to assign implementers',
    selectAtLeastOneImplementer: 'Select at least one implementer',
    reviewersLabel: 'Reviewers * (order matches selection)',
    signatoryLabel: 'Signatory * (1 person, signs via e-Sign)',
    selectSignatoryOption: '-- Select signatory --',
    supportingAttachments: 'Supporting Attachments',
    addAttachmentLabel: 'Add Attachment',
    filesUploadedAfterCreate: 'Files will be uploaded after the CR is created',
    selectAtLeastOneReviewer: 'Select at least 1 reviewer',
    selectASignatory: 'Select a signatory',
    crUpdated: 'CR updated',
    crCreatedSuccess: 'CR created successfully',
    failedToSave: 'Failed to save',
    saving: 'Saving...',
    rejectCRTitle: 'Reject Change Request',
    rejectionNotePlaceholder: 'Rejection note (required)',
    processing: 'Processing...',
    rejectCRButton: 'Reject CR',
    crRejected: 'CR rejected',
    failedGeneric: 'Failed',
    signDocumentTitle: 'Sign Document',
    signingAsLabel: 'Signing as:',
    eSignPassphraseLabel: 'e-Sign Passphrase',
    eSignPassphrasePlaceholder: 'Enter your e-Sign passphrase',
    passphraseNotice: 'Passphrase is not stored in the system. The document will be signed electronically using a certificate issued by BSrE.',
    signing: 'Signing...',
    signButton: 'Sign',
    documentSignedSuccess: 'Document signed successfully!',
    failedToSignDocument: 'Failed to sign document',
    actionCreated: 'CR Dibuat',
    actionImplementersSet: 'Pelaksana Ditetapkan',
    actionSubmitted: 'CR Diajukan',
    actionReviewed: 'Ditinjau',
    actionApproved: 'Disetujui',
    actionRejected: 'Ditolak',
    actionImplemented: 'Diimplementasikan',
    actionSigned: 'Ditandatangani (TTE)',
    actionAttachmentAdded: 'Lampiran Ditambahkan',
    actionAttachmentDeleted: 'Lampiran Dihapus',
    loadingLog: 'Loading log...',
    activityHistory: 'Riwayat Aktivitas',
    byActor: 'oleh {name}',
    systemActor: 'sistem',
    attachmentsCountLabel: 'Attachments ({count})',
    uploading: 'Uploading...',
    uploadButton: 'Upload',
    loadingAttachments: 'Loading attachments...',
    noAttachmentsYet: 'No attachments yet',
    deleteAttachmentConfirm: 'Delete this attachment?',
    attachmentUploaded: 'Attachment uploaded',
    failedToUpload: 'Failed to upload',
    crMarkedImplemented: 'CR marked as implemented',
    attachmentDeleted: 'Attachment deleted',
    failedToDelete: 'Failed to delete',
    downloadFailed: 'Download failed',
    yourTurnToSign: 'Your turn to sign this CR document',
    yourTurnToReview: 'Your turn to review this CR',
    downloadSignedDocument: 'Download Signed Document',
    failedToDownloadDocument: 'Failed to download document',
    hideProgress: 'Hide progress',
    viewProgress: 'View progress',
    editButton: 'Edit',
    submitting: 'Submitting...',
    submitButton: 'Submit',
    deleteCRConfirm: 'Delete this CR?',
    deleteButton: 'Delete',
    markAsImplemented: 'Mark as Implemented',
    approveButton: 'Approve',
    rejectButton: 'Reject',
    signActionButton: 'Sign',
    crSubmitted: 'CR submitted',
    failedToSubmit: 'Failed to submit',
    crApproved: 'CR approved',
    failedToApprove: 'Failed to approve',
    crDeleted: 'CR deleted',
    stepXOfY: 'Step {current}/{total}',
    stepsCount: '{total} step',
    sectionGovernance: 'GOVERNANCE',
    changeManagementTitle: 'Change Management',
    requestsSubtitle: '{count} request{s} · {inFlight} in flight · {awaiting} awaiting you',
    newRequestButton: 'New request',
    awaitingApprovalSingle: '{title} ',
    awaitingApprovalMultiple: '{count} requests ',
    awaitingYourApproval: 'awaiting your approval',
    actionRequired: 'Action required',
    resultsCount: '{count} result{s}',
    noChangeRequestsTitle: 'No change requests',
    noRequestsAwaitingMe: 'No requests awaiting your action',
    noRequestsInFlight: 'No requests currently in flight',
    noRequestsSubmittedByMe: 'You have not submitted any requests',
    noClosedRequests: 'No closed requests',
    noChangeRequestsYet: 'No change requests yet',
  },
  id: {
    statusDraftLabel: 'Draf',
    statusSubmittedLabel: 'Diajukan',
    statusApprovedLabel: 'Disetujui',
    statusRejectedLabel: 'Ditolak',
    statusImplementedLabel: 'Diimplementasikan',
    priorityLow: 'Rendah',
    priorityMedium: 'Sedang',
    priorityHigh: 'Tinggi',
    priorityCritical: 'Kritis',
    tabAll: 'Semua',
    tabAwaitingMe: 'Menunggu saya',
    tabInFlight: 'Sedang berjalan',
    tabSubmittedByMe: 'Diajukan oleh saya',
    tabClosed: 'Selesai',
    noUsersFound: 'Pengguna tidak ditemukan',
    crCreatedLabel: 'CR Dibuat',
    signerLabelPrefix: 'Penandatangan: {name}',
    reviewerLabelPrefix: 'Penilai {order}: {name}',
    waitingBadge: 'Menunggu',
    editCRTitle: 'Ubah Permintaan Perubahan',
    createCRTitle: 'Buat Permintaan Perubahan',
    basicInformation: 'Informasi Dasar',
    titleLabel: 'Judul',
    priorityLabel: 'Prioritas',
    changeTypeLabel: 'Jenis Perubahan',
    changeTypeNormal: 'Normal',
    changeTypeStandard: 'Standar',
    changeTypeEmergency: 'Darurat',
    plannedChangeDateLabel: 'Tanggal Perubahan yang Direncanakan',
    changeTitlePlaceholder: 'Judul perubahan',
    changeInformation: 'Informasi Perubahan',
    proposedChangeLabel: 'Perubahan yang Diusulkan',
    proposedChangePlaceholder: 'Apa yang akan diubah?',
    changeDetailsLabel: 'Rincian Perubahan',
    changeDetailsPlaceholder: 'Rincian perubahan langkah demi langkah',
    backgroundReasonLabel: 'Latar Belakang / Alasan',
    backgroundReasonPlaceholder: 'Mengapa perubahan ini diperlukan?',
    serviceDependenciesLabel: 'Dependensi Layanan',
    serviceDependenciesPlaceholder: 'Layanan terkait',
    affectedSystemsLabel: 'Sistem Informasi Terdampak',
    affectedSystemsPlaceholder: 'Sistem informasi yang terdampak',
    riskAnalysis: 'Analisis Risiko',
    changeRiskAnalysisLabel: 'Analisis Risiko Perubahan',
    changeRiskAnalysisPlaceholder: 'Risiko yang mungkin terjadi',
    riskMitigationLabel: 'Langkah Mitigasi Risiko',
    riskMitigationPlaceholder: 'Langkah untuk mengurangi risiko',
    riskIfNotPerformedLabel: 'Risiko jika Perubahan Tidak Dilakukan',
    riskIfNotPerformedPlaceholder: 'Dampak jika tidak dilakukan',
    failureHandlingLabel: 'Langkah Penanganan Kegagalan',
    failureHandlingPlaceholder: 'Rencana pemulihan jika terjadi kegagalan',
    personnel: 'Personel',
    implementersLabel: 'Pelaksana',
    implementersSectionTitle: 'Pelaksana',
    implementersEmptyForReviewer: 'Belum ditetapkan. Sebagai penilai, Anda dapat menetapkan pelaksana permintaan perubahan ini.',
    implementersEmptyForOthers: 'Belum ditetapkan. Pelaksana ditetapkan oleh salah satu penilai pada saat peninjauan.',
    implementersLockedNote: 'Ditetapkan oleh {name}. Hanya penilai pertama yang menetapkan yang dapat mengisinya.',
    assignImplementersBtn: 'Tetapkan pelaksana',
    saveImplementersBtn: 'Simpan pelaksana',
    implementersSaved: 'Pelaksana berhasil ditetapkan',
    implementersFailed: 'Gagal menetapkan pelaksana',
    selectAtLeastOneImplementer: 'Pilih minimal satu pelaksana',
    reviewersLabel: 'Penilai * (urutan sesuai pilihan)',
    signatoryLabel: 'Penandatangan * (1 orang, menandatangani melalui e-Sign)',
    selectSignatoryOption: '-- Pilih penandatangan --',
    supportingAttachments: 'Lampiran Pendukung',
    addAttachmentLabel: 'Tambah Lampiran',
    filesUploadedAfterCreate: 'Berkas akan diunggah setelah CR dibuat',
    selectAtLeastOneReviewer: 'Pilih minimal 1 penilai',
    selectASignatory: 'Pilih seorang penandatangan',
    crUpdated: 'CR diperbarui',
    crCreatedSuccess: 'CR berhasil dibuat',
    failedToSave: 'Gagal menyimpan',
    saving: 'Menyimpan...',
    rejectCRTitle: 'Tolak Permintaan Perubahan',
    rejectionNotePlaceholder: 'Catatan penolakan (wajib)',
    processing: 'Memproses...',
    rejectCRButton: 'Tolak CR',
    crRejected: 'CR ditolak',
    failedGeneric: 'Gagal',
    signDocumentTitle: 'Tandatangani Dokumen',
    signingAsLabel: 'Menandatangani sebagai:',
    eSignPassphraseLabel: 'Kata Sandi e-Sign',
    eSignPassphrasePlaceholder: 'Masukkan kata sandi e-Sign Anda',
    passphraseNotice:
      'Kata sandi tidak disimpan dalam sistem. Dokumen akan ditandatangani secara elektronik menggunakan sertifikat yang diterbitkan oleh BSrE.',
    signing: 'Menandatangani...',
    signButton: 'Tandatangani',
    documentSignedSuccess: 'Dokumen berhasil ditandatangani!',
    failedToSignDocument: 'Gagal menandatangani dokumen',
    actionCreated: 'CR Dibuat',
    actionImplementersSet: 'Pelaksana Ditetapkan',
    actionSubmitted: 'CR Diajukan',
    actionReviewed: 'Ditinjau',
    actionApproved: 'Disetujui',
    actionRejected: 'Ditolak',
    actionImplemented: 'Diimplementasikan',
    actionSigned: 'Ditandatangani (TTE)',
    actionAttachmentAdded: 'Lampiran Ditambahkan',
    actionAttachmentDeleted: 'Lampiran Dihapus',
    loadingLog: 'Memuat log...',
    activityHistory: 'Riwayat Aktivitas',
    byActor: 'oleh {name}',
    systemActor: 'sistem',
    attachmentsCountLabel: 'Lampiran ({count})',
    uploading: 'Mengunggah...',
    uploadButton: 'Unggah',
    loadingAttachments: 'Memuat lampiran...',
    noAttachmentsYet: 'Belum ada lampiran',
    deleteAttachmentConfirm: 'Hapus lampiran ini?',
    attachmentUploaded: 'Lampiran diunggah',
    failedToUpload: 'Gagal mengunggah',
    crMarkedImplemented: 'CR ditandai sebagai diimplementasikan',
    attachmentDeleted: 'Lampiran dihapus',
    failedToDelete: 'Gagal menghapus',
    downloadFailed: 'Gagal mengunduh',
    yourTurnToSign: 'Giliran Anda menandatangani dokumen CR ini',
    yourTurnToReview: 'Giliran Anda meninjau CR ini',
    downloadSignedDocument: 'Unduh Dokumen yang Ditandatangani',
    failedToDownloadDocument: 'Gagal mengunduh dokumen',
    hideProgress: 'Sembunyikan progres',
    viewProgress: 'Lihat progres',
    editButton: 'Ubah',
    submitting: 'Mengirimkan...',
    submitButton: 'Kirim',
    deleteCRConfirm: 'Hapus CR ini?',
    deleteButton: 'Hapus',
    markAsImplemented: 'Tandai sebagai Diimplementasikan',
    approveButton: 'Setujui',
    rejectButton: 'Tolak',
    signActionButton: 'Tandatangani',
    crSubmitted: 'CR diajukan',
    failedToSubmit: 'Gagal mengajukan',
    crApproved: 'CR disetujui',
    failedToApprove: 'Gagal menyetujui',
    crDeleted: 'CR dihapus',
    stepXOfY: 'Langkah {current}/{total}',
    stepsCount: '{total} langkah',
    sectionGovernance: 'TATA KELOLA',
    changeManagementTitle: 'Manajemen Perubahan',
    requestsSubtitle: '{count} permintaan · {inFlight} sedang berjalan · {awaiting} menunggu Anda',
    newRequestButton: 'Permintaan baru',
    awaitingApprovalSingle: '{title} ',
    awaitingApprovalMultiple: '{count} permintaan ',
    awaitingYourApproval: 'menunggu persetujuan Anda',
    actionRequired: 'Perlu tindakan',
    resultsCount: '{count} hasil',
    noChangeRequestsTitle: 'Tidak ada permintaan perubahan',
    noRequestsAwaitingMe: 'Tidak ada permintaan yang menunggu tindakan Anda',
    noRequestsInFlight: 'Tidak ada permintaan yang sedang berjalan',
    noRequestsSubmittedByMe: 'Anda belum mengajukan permintaan apa pun',
    noClosedRequests: 'Tidak ada permintaan yang selesai',
    noChangeRequestsYet: 'Belum ada permintaan perubahan',
  },
};

const STATUS_CONFIG: Record<string, { labelKey: string; bg: string; text: string; icon: any }> = {
  draft: { labelKey: 'statusDraftLabel', bg: 'bg-border-subtle', text: 'text-text-secondary', icon: FileEdit },
  submitted: { labelKey: 'statusSubmittedLabel', bg: 'bg-info-soft', text: 'text-info-text', icon: Clock },
  approved: { labelKey: 'statusApprovedLabel', bg: 'bg-success-soft', text: 'text-success-text', icon: CheckCircle2 },
  rejected: { labelKey: 'statusRejectedLabel', bg: 'bg-danger-soft', text: 'text-danger-text', icon: AlertTriangle },
  implemented: { labelKey: 'statusImplementedLabel', bg: 'bg-navy-700/8', text: 'text-navy-700', icon: Pen },
};

const PRIORITY_CONFIG: Record<string, { labelKey: string; bg: string; text: string }> = {
  low: { labelKey: 'priorityLow', bg: 'bg-border-subtle', text: 'text-text-tertiary' },
  medium: { labelKey: 'priorityMedium', bg: 'bg-info-soft', text: 'text-info-text' },
  high: { labelKey: 'priorityHigh', bg: 'bg-amber-50', text: 'text-amber-600' },
  critical: { labelKey: 'priorityCritical', bg: 'bg-danger-soft', text: 'text-danger-text' },
};

type TabFilter = 'all' | 'awaiting_me' | 'in_flight' | 'submitted_by_me' | 'closed';

const TABS: { id: TabFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'tabAll' },
  { id: 'awaiting_me', labelKey: 'tabAwaitingMe' },
  { id: 'in_flight', labelKey: 'tabInFlight' },
  { id: 'submitted_by_me', labelKey: 'tabSubmittedByMe' },
  { id: 'closed', labelKey: 'tabClosed' },
];

function isMyTurnFn(cr: any, userId: string): boolean {
  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;
  const myApproval = approvals.find((a: any) => a.approver_id === userId && a.order === currentStep && a.status === 'pending');
  return !!myApproval && cr.status === 'submitted';
}

function UserMultiSelect({
  label,
  users,
  selected,
  onChange,
  exclude = [],
}: {
  label: string;
  users: any[];
  selected: string[];
  onChange: (ids: string[]) => void;
  exclude?: string[];
}) {
  const t = useT(dict);
  const toggle = (uid: string) => onChange(selected.includes(uid) ? selected.filter((id) => id !== uid) : [...selected, uid]);
  const filtered = users.filter((u) => !exclude.includes(u.id));
  return (
    <div>
      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{label}</label>
      <div className="mt-1 border border-border rounded-[6px] overflow-hidden">
        <div className="max-h-32 overflow-y-auto divide-y divide-surface-2">
          {filtered.map((u: any) => {
            const checked = selected.includes(u.id);
            const idx = selected.indexOf(u.id);
            return (
              <div
                key={u.id}
                onClick={() => toggle(u.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-navy-700/5' : 'hover:bg-surface-2'}`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all ${checked ? 'bg-navy-700 border-navy-700 text-white' : 'border-border-button'}`}
                >
                  {checked ? idx + 1 : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate">{u.full_name || u.email}</div>
                  <div className="text-xs text-text-placeholder">{u.roles?.[0] || u.email}</div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="px-3 py-4 text-sm text-text-placeholder text-center">{t('noUsersFound')}</div>}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {selected.map((uid, i) => {
            const u = users.find((u) => u.id === uid);
            return (
              <span
                key={uid}
                className="inline-flex items-center gap-1 text-xs bg-navy-700/10 text-navy-700 px-2 py-0.5 rounded-full font-medium"
              >
                {i + 1}. {u?.full_name || uid}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(selected.filter((id) => id !== uid));
                  }}
                  className="hover:text-danger"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CRTimeline({ cr, usersMap }: { cr: any; usersMap: Record<string, string> }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;

  const steps = [
    { label: t('crCreatedLabel'), role: 'creator', order: 0, status: 'done', actedAt: cr.created_at, note: null },
    ...approvals.map((a: any) => ({
      label:
        a.role === 'signer'
          ? t('signerLabelPrefix', { name: usersMap?.[a.approver_id] || '...' })
          : t('reviewerLabelPrefix', { order: a.order, name: usersMap?.[a.approver_id] || '...' }),
      role: a.role,
      order: a.order,
      status:
        a.status === 'approved'
          ? 'done'
          : a.status === 'rejected'
            ? 'rejected'
            : a.order === currentStep && cr.status === 'submitted'
              ? 'active'
              : 'pending',
      actedAt: a.acted_at,
      note: a.note,
      approver_id: a.approver_id,
    })),
  ];

  return (
    <div className="relative pl-7 mt-4 space-y-0">
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border-subtle rounded-full" />
      {steps.map((step, i) => (
        <div key={i} className="relative pb-5 last:pb-0">
          <div
            className={`absolute -left-7 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center
 ${
   step.status === 'done'
     ? 'bg-success border-success'
     : step.status === 'rejected'
       ? 'bg-danger border-danger'
       : step.status === 'active'
         ? 'bg-info border-info ring-4 ring-info-soft'
         : 'bg-white border-border'
 }`}
          >
            {step.status === 'done' && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'rejected' && <X className="w-3 h-3 text-white" strokeWidth={3} />}
            {step.status === 'active' && <Clock className="w-2.5 h-2.5 text-white" />}
            {step.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-border-button" />}
          </div>
          <div className={`ml-1 ${step.status === 'pending' ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold
 ${
   step.status === 'done'
     ? 'text-success-text'
     : step.status === 'rejected'
       ? 'text-danger-text'
       : step.status === 'active'
         ? 'text-info-text'
         : 'text-text-placeholder'
 }`}
              >
                {step.label}
              </span>
              {step.role === 'signer' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-navy-700/8 text-navy-700">TTE</span>
              )}
              {step.status === 'active' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-info-soft text-info-text animate-pulse">{t('waitingBadge')}</span>
              )}
            </div>
            {step.actedAt && <div className="text-xs text-text-placeholder mt-0.5">{formatDate(step.actedAt, locale)}</div>}
            {step.note && <div className="text-xs text-text-tertiary mt-1 bg-surface-2 rounded-lg px-2 py-1.5 italic">"{step.note}"</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  title: '',
  description: '',
  reason: '',
  impact: '',
  priority: 'medium',
  change_type: 'normal',
  rincian: '',
  rencana_waktu: '',
  dependensi_layanan: '',
  si_terdampak: '',
  langkah_mitigasi: '',
  risiko_tidak_dilakukan: '',
  langkah_penanganan_kegagalan: '',
};

function CRModal({
  open,
  onClose,
  editData,
  pendingFiles,
  setPendingFiles,
}: {
  open: boolean;
  onClose: () => void;
  editData?: any;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const t = useT(dict);
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [signerId, setSignerId] = useState('');

  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({ ...EMPTY_FORM, ...editData });
      } else {
        setForm(EMPTY_FORM);
        setReviewerIds([]);
        setSignerId('');
      }
    }
  }, [editData, open]);

  const { data: usersData } = useQuery({
    queryKey: ['all-users-cr'],
    queryFn: () => api.get('/api/v1/users', { params: { per_page: 100 } }).then((r) => r.data.data),
    enabled: open,
  });
  const users: any[] = usersData || [];

  const f = (key: string) => (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.value }));
  const ta = (key: string) => (e: any) => setForm((p: any) => ({ ...p, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: any) => (editData ? changeRequestService.update(editData.id, data) : changeRequestService.create(data)),
    onSuccess: async (res: any) => {
      const crId = res.data?.data?.id;
      if (crId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          try {
            await crAttachmentService.upload(crId, file);
          } catch {}
        }
      }
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(editData ? t('crUpdated') : t('crCreatedSuccess'));
      setPendingFiles([]);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToSave')),
  });

  const handleSubmit = () => {
    if (!editData && reviewerIds.length === 0) return toast.error(t('selectAtLeastOneReviewer'));
    if (!editData && !signerId) return toast.error(t('selectASignatory'));
    const payload = editData
      ? { ...form }
      : { ...form, reviewer_ids: reviewerIds, signer_id: signerId };
    mutation.mutate(payload);
  };

  if (!open) return null;

  const inputCls =
    'mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700';
  const taCls = inputCls + ' resize-none';
  const lbl = (label: string, req = false) => (
    <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
      {label}
      {req && <span className="text-danger ml-0.5">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-navy-900">{editData ? t('editCRTitle') : t('createCRTitle')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-border-subtle rounded-[6px]">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">{t('basicInformation')}</div>
            <div>
              {lbl(t('titleLabel'), true)}
              <input value={form.title} onChange={f('title')} className={inputCls} placeholder={t('changeTitlePlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {lbl(t('priorityLabel'))}
                <select value={form.priority} onChange={f('priority')} className={inputCls}>
                  <option value="low">{t('priorityLow')}</option>
                  <option value="medium">{t('priorityMedium')}</option>
                  <option value="high">{t('priorityHigh')}</option>
                  <option value="critical">{t('priorityCritical')}</option>
                </select>
              </div>
              <div>
                {lbl(t('changeTypeLabel'))}
                <select value={form.change_type} onChange={f('change_type')} className={inputCls}>
                  <option value="normal">{t('changeTypeNormal')}</option>
                  <option value="standard">{t('changeTypeStandard')}</option>
                  <option value="emergency">{t('changeTypeEmergency')}</option>
                </select>
              </div>
            </div>
            <div>
              {lbl(t('plannedChangeDateLabel'))}
              <input type="date" value={form.rencana_waktu} onChange={f('rencana_waktu')} className={inputCls} />
            </div>
          </div>

          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">{t('changeInformation')}</div>
            <div>
              {lbl(t('proposedChangeLabel'), true)}
              <textarea
                value={form.description}
                onChange={ta('description')}
                rows={3}
                className={taCls}
                placeholder={t('proposedChangePlaceholder')}
              />
            </div>
            <div>
              {lbl(t('changeDetailsLabel'))}
              <textarea
                value={form.rincian}
                onChange={ta('rincian')}
                rows={3}
                className={taCls}
                placeholder={t('changeDetailsPlaceholder')}
              />
            </div>
            <div>
              {lbl(t('backgroundReasonLabel'), true)}
              <textarea
                value={form.reason}
                onChange={ta('reason')}
                rows={2}
                className={taCls}
                placeholder={t('backgroundReasonPlaceholder')}
              />
            </div>
            <div>
              {lbl(t('serviceDependenciesLabel'))}
              <textarea
                value={form.dependensi_layanan}
                onChange={ta('dependensi_layanan')}
                rows={2}
                className={taCls}
                placeholder={t('serviceDependenciesPlaceholder')}
              />
            </div>
            <div>
              {lbl(t('affectedSystemsLabel'))}
              <textarea
                value={form.si_terdampak}
                onChange={ta('si_terdampak')}
                rows={2}
                className={taCls}
                placeholder={t('affectedSystemsPlaceholder')}
              />
            </div>
          </div>

          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">{t('riskAnalysis')}</div>
            <div>
              {lbl(t('changeRiskAnalysisLabel'))}
              <textarea value={form.impact} onChange={ta('impact')} rows={2} className={taCls} placeholder={t('changeRiskAnalysisPlaceholder')} />
            </div>
            <div>
              {lbl(t('riskMitigationLabel'))}
              <textarea
                value={form.langkah_mitigasi}
                onChange={ta('langkah_mitigasi')}
                rows={2}
                className={taCls}
                placeholder={t('riskMitigationPlaceholder')}
              />
            </div>
            <div>
              {lbl(t('riskIfNotPerformedLabel'))}
              <textarea
                value={form.risiko_tidak_dilakukan}
                onChange={ta('risiko_tidak_dilakukan')}
                rows={2}
                className={taCls}
                placeholder={t('riskIfNotPerformedPlaceholder')}
              />
            </div>
            <div>
              {lbl(t('failureHandlingLabel'))}
              <textarea
                value={form.langkah_penanganan_kegagalan}
                onChange={ta('langkah_penanganan_kegagalan')}
                rows={2}
                className={taCls}
                placeholder={t('failureHandlingPlaceholder')}
              />
            </div>
          </div>

          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">{t('personnel')}</div>
            {!editData && (
              <>
                <UserMultiSelect
                  label={t('reviewersLabel')}
                  users={users}
                  selected={reviewerIds}
                  onChange={setReviewerIds}
                  exclude={[signerId].filter(Boolean)}
                />
                <div>
                  {lbl(t('signatoryLabel'))}
                  <select
                    value={signerId}
                    onChange={(e) => {
                      setSignerId(e.target.value);
                      setReviewerIds((prev) => prev.filter((id) => id !== e.target.value));
                    }}
                    className={inputCls}
                  >
                    <option value="">{t('selectSignatoryOption')}</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="bg-surface-2 rounded-[6px] p-4 space-y-3">
            <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider">{t('supportingAttachments')}</div>
            <label className="flex items-center gap-2 text-sm text-text-secondary border border-border px-3 py-2 rounded-[6px] hover:bg-white transition-colors cursor-pointer">
              <Paperclip className="w-4 h-4" /> {t('addAttachmentLabel')}
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar,.txt,.csv"
                onChange={(e) => {
                  if (e.target.files) setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  (e.target as HTMLInputElement).value = '';
                }}
              />
            </label>
            {pendingFiles.length > 0 && (
              <div className="space-y-1.5">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-border-subtle">
                    <Paperclip className="w-3.5 h-3.5 text-text-placeholder flex-shrink-0" />
                    <span className="text-xs text-text-secondary flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-text-placeholder">{(file.size / 1024).toFixed(1)} KB</span>
                    <button
                      onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 hover:bg-danger-soft rounded text-text-placeholder hover:text-danger"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-text-placeholder">{t('filesUploadedAfterCreate')}</p>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0 sticky bottom-0 bg-white border-t border-border-subtle">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || !form.title || !form.description || !form.reason}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50"
          >
            {mutation.isPending ? t('saving') : t('common.save')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RejectModal({ open, crId, onClose }: { open: boolean; crId: string; onClose: () => void }) {
  const t = useT(dict);
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const mutation = useMutation({
    mutationFn: () => changeRequestService.reject(crId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('crRejected'));
      onClose();
      setNote('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedGeneric')),
  });
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-md p-6"
      >
        <h2 className="text-lg font-bold text-navy-900 mb-4">{t('rejectCRTitle')}</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger resize-none"
          placeholder={t('rejectionNotePlaceholder')}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !note.trim()}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-danger text-white text-sm font-semibold hover:bg-danger-text disabled:opacity-50"
          >
            {mutation.isPending ? t('processing') : t('rejectCRButton')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SignModal({ open, cr, onClose }: { open: boolean; cr: any; onClose: () => void }) {
  const t = useT(dict);
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [passphrase, setPassphrase] = useState('');
  const mutation = useMutation({
    mutationFn: async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/esign/warmup`).catch(() => {});
      return api.post(`/api/v1/change-requests/${cr?.id}/sign`, { passphrase });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('documentSignedSuccess'));
      onClose();
      setPassphrase('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToSignDocument')),
  });
  if (!open || !cr) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-md p-6"
      >
        <h2 className="text-lg font-bold text-navy-900 mb-1">{t('signDocumentTitle')}</h2>
        <p className="text-sm text-text-placeholder mb-4">{cr.title}</p>
        <div className="flex items-center gap-2 mb-4 p-3 bg-surface-2 rounded-[6px] text-sm text-text-secondary">
          <span className="font-medium">{t('signingAsLabel')}</span> {user?.full_name}
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('eSignPassphraseLabel')}</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 font-mono focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
            placeholder={t('eSignPassphrasePlaceholder')}
          />
        </div>
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-[6px] mb-4 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {t('passphraseNotice')}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !passphrase}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Pen className="w-3.5 h-3.5" />
            {mutation.isPending ? t('signing') : t('signButton')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const ACTION_CONFIG: Record<string, { labelKey: string; color: string }> = {
  created: { labelKey: 'actionCreated', color: 'text-text-tertiary' },
  submitted: { labelKey: 'actionSubmitted', color: 'text-info-text' },
  reviewed: { labelKey: 'actionReviewed', color: 'text-success-text' },
  approved: { labelKey: 'actionApproved', color: 'text-success-text' },
  rejected: { labelKey: 'actionRejected', color: 'text-danger-text' },
  implemented: { labelKey: 'actionImplemented', color: 'text-navy-700' },
  signed: { labelKey: 'actionSigned', color: 'text-navy-700' },
  implementers_set: { labelKey: 'actionImplementersSet', color: 'text-navy-700' },
  attachment_added: { labelKey: 'actionAttachmentAdded', color: 'text-text-tertiary' },
  attachment_deleted: { labelKey: 'actionAttachmentDeleted', color: 'text-danger' },
};

function CRAuditLog({ crId, usersMap }: { crId: string; usersMap: Record<string, string> }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['cr-logs', crId],
    queryFn: () => changeRequestService.logs(crId).then((r) => r.data.data),
  });

  const logs: any[] = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="text-xs text-text-placeholder py-2 mt-3 border-t border-border-subtle pt-3">{t('loadingLog')}</div>;
  if (logs.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <div className="text-xs font-semibold text-text-tertiary mb-2">{t('activityHistory')}</div>
      <div className="space-y-2">
        {logs.map((log: any) => {
          const cfg = ACTION_CONFIG[log.action];
          const label = cfg ? t(cfg.labelKey) : log.action;
          const color = cfg?.color ?? 'text-text-tertiary';
          return (
            <div key={log.id} className="flex items-start gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-border-button flex-shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <span className={`font-semibold ${color}`}>{label}</span>
                {log.actor_id && (
                  <span className="text-text-placeholder"> {t('byActor', { name: usersMap[log.actor_id] || t('systemActor') })}</span>
                )}
                {log.note && <span className="text-text-placeholder italic">, {log.note}</span>}
                <div className="text-border-button mt-0.5">{formatDate(log.created_at, locale)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CRAttachments({ crId, canUpload }: { crId: string; canUpload: boolean }) {
  const t = useT(dict);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cr-attachments', crId],
    queryFn: () => crAttachmentService.list(crId).then((r) => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => crAttachmentService.upload(crId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cr-attachments', crId] });
      toast.success(t('attachmentUploaded'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToUpload')),
  });

  const implementMutation = useMutation({
    mutationFn: () => changeRequestService.implement(crId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('crMarkedImplemented'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedGeneric')),
  });

  const deleteMutation = useMutation({
    mutationFn: (attachId: string) => crAttachmentService.delete(crId, attachId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cr-attachments', crId] });
      toast.success(t('attachmentDeleted'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToDelete')),
  });

  const handleDownload = async (attach: any) => {
    try {
      const res = await crAttachmentService.download(crId, attach.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = attach.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('downloadFailed'));
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';

  const attachments: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" /> {t('attachmentsCountLabel', { count: attachments.length })}
        </span>
        {canUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar,.txt,.csv"
              onChange={(e) => {
                if (e.target.files?.[0]) uploadMutation.mutate(e.target.files[0]);
                if (fileRef.current) fileRef.current.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:bg-surface-2 flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> {uploadMutation.isPending ? t('uploading') : t('uploadButton')}
            </button>
          </>
        )}
      </div>
      {isLoading ? (
        <div className="text-xs text-text-placeholder py-2">{t('loadingAttachments')}</div>
      ) : attachments.length === 0 ? (
        <div className="text-xs text-text-placeholder py-1">{t('noAttachmentsYet')}</div>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((a: any) => (
            <div key={a.id} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
              <Paperclip className="w-3.5 h-3.5 text-text-placeholder flex-shrink-0" />
              <span className="text-xs text-text-secondary flex-1 truncate">{a.file_name}</span>
              <span className="text-xs text-text-placeholder">{formatSize(a.file_size)}</span>
              <button
                onClick={() => handleDownload(a)}
                className="p-1 hover:bg-border rounded text-text-tertiary hover:text-text-secondary"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {canUpload && (
                <button
                  onClick={() => {
                    if (confirm(t('deleteAttachmentConfirm'))) deleteMutation.mutate(a.id);
                  }}
                  className="p-1 hover:bg-danger-soft rounded text-text-placeholder hover:text-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Pelaksana CR ditetapkan oleh penilai, bukan oleh pengaju. Penilai mana pun
 * boleh mengisinya, namun hanya sekali: setelah terisi, panel berubah menjadi
 * daftar baca-saja bagi semua orang, termasuk penilai berikutnya.
 */
function CRImplementers({ cr, userId, usersMap }: { cr: any; userId: string; usersMap: Record<string, string> }) {
  const t = useT(dict);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const { data: users = [] } = useQuery({
    queryKey: ['cr-users'],
    queryFn: () => changeRequestService.getUsers().then((r: any) => r.data.data?.data || r.data.data || []),
    staleTime: 60000,
  });

  const approvals: any[] = cr.approvals || [];
  const isReviewer = approvals.some((a: any) => a.role === 'reviewer' && a.approver_id === userId);
  const alreadySet = !!cr.pelaksana_set_by;
  const canAssign = isReviewer && !alreadySet && cr.status === 'submitted';
  const ids: string[] = cr.pelaksana_ids || [];

  const mutation = useMutation({
    mutationFn: () => changeRequestService.setImplementers(cr.id, picked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('implementersSaved'));
      setEditing(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('implementersFailed')),
  });

  return (
    <div className="px-5 pt-4 pb-4 mt-4 border-t border-border-subtle">
      <div className="text-xs font-bold text-text-placeholder uppercase tracking-wider mb-2">
        {t('implementersSectionTitle')}
      </div>

      {ids.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {ids.map((uid) => (
              <span
                key={uid}
                className="inline-flex items-center text-xs bg-navy-700/10 text-navy-700 px-2 py-0.5 rounded-full font-medium"
              >
                {usersMap?.[uid] || uid}
              </span>
            ))}
          </div>
          {alreadySet && (
            <p className="text-[11px] text-text-placeholder mt-1.5">
              {t('implementersLockedNote', { name: usersMap?.[cr.pelaksana_set_by] || '...' })}
            </p>
          )}
        </>
      ) : editing ? (
        <div className="space-y-2">
          <UserMultiSelect label={t('implementersLabel')} users={users} selected={picked} onChange={setPicked} />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-2"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => (picked.length ? mutation.mutate() : toast.error(t('selectAtLeastOneImplementer')))}
              disabled={mutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-700 text-white hover:bg-navy-900 disabled:opacity-50"
            >
              {mutation.isPending ? t('saving') : t('saveImplementersBtn')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-placeholder">
            {canAssign ? t('implementersEmptyForReviewer') : t('implementersEmptyForOthers')}
          </p>
          {canAssign && (
            <button
              onClick={() => setEditing(true)}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-700 text-white hover:bg-navy-900"
            >
              {t('assignImplementersBtn')}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function CRCard({
  cr,
  onEdit,
  onReject,
  onSign,
  onImplement,
  userId,
  usersMap,
}: {
  cr: any;
  onEdit: (cr: any) => void;
  onReject: (id: string) => void;
  onSign: (cr: any) => void;
  onImplement: (id: string) => void;
  userId: string;
  usersMap: Record<string, string>;
}) {
  const t = useT(dict);
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[cr.status] || STATUS_CONFIG.draft;
  const pc = PRIORITY_CONFIG[cr.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = sc.icon;

  const approvals: any[] = cr.approvals || [];
  const currentStep: number = cr.current_step || 0;
  const myApproval = approvals.find((a: any) => a.approver_id === userId && a.order === currentStep && a.status === 'pending');
  const isMyTurn = !!myApproval && cr.status === 'submitted';
  const isSigner = myApproval?.role === 'signer';

  const submitMutation = useMutation({
    mutationFn: () => changeRequestService.submit(cr.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('crSubmitted'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToSubmit')),
  });

  const approveMutation = useMutation({
    mutationFn: () => changeRequestService.approve(cr.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('crApproved'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToApprove')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => changeRequestService.delete(cr.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('crDeleted'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToDelete')),
  });

  return (
    <motion.div
      layout
      className="bg-white rounded-[6px] border border-border-subtle hover:border-navy-700/20 transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-navy-900 text-base leading-snug">{cr.title}</h3>
            <p className="text-xs text-text-placeholder mt-0.5">{formatDate(cr.created_at, locale)}</p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} flex-shrink-0`}
          >
            <StatusIcon className="w-3 h-3" />
            {t(sc.labelKey)}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{t(pc.labelKey)}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-border-subtle text-text-tertiary capitalize">
            {cr.change_type}
          </span>
          {cr.rencana_waktu && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-border-subtle text-text-tertiary">
              {new Date(cr.rencana_waktu).toLocaleDateString('en-GB')}
            </span>
          )}
          {cr.total_steps > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-navy-700/8 text-navy-700">
              {currentStep > 0 ? t('stepXOfY', { current: currentStep, total: cr.total_steps }) : t('stepsCount', { total: cr.total_steps })}
            </span>
          )}
        </div>

        {isMyTurn && (
          <div className="mb-3 flex items-center gap-2 bg-info-soft text-info-text text-xs font-semibold px-3 py-2 rounded-[6px]">
            <Clock className="w-3.5 h-3.5" />
            {isSigner ? t('yourTurnToSign') : t('yourTurnToReview')}
          </div>
        )}

        {cr.status === 'approved' && cr.signed_document_id && (
          <button
            onClick={async () => {
              try {
                const res = await api.get(`/api/v1/change-requests/${cr.id}/document`, { responseType: 'blob' });
                const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `CR_${cr.id}_signed.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                toast.error(t('failedToDownloadDocument'));
              }
            }}
            className="mb-3 flex items-center gap-2 bg-navy-700/8 text-navy-900 text-xs font-semibold px-3 py-2 rounded-[6px] hover:bg-navy-700/10 transition-colors"
          >
            <Pen className="w-3.5 h-3.5" /> {t('downloadSignedDocument')}
          </button>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-placeholder hover:text-text-secondary transition-colors mb-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? t('hideProgress') : t('viewProgress')}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <CRTimeline cr={cr} usersMap={usersMap} />
              <CRImplementers cr={cr} userId={userId} usersMap={usersMap} />
              <CRAttachments crId={cr.id} canUpload={isMyTurn || (cr.requester_id === userId && cr.status === 'draft')} />
              <CRAuditLog crId={cr.id} usersMap={usersMap} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2 px-5 pb-4 flex-wrap">
        {cr.requester_id === userId && cr.status === 'draft' && (
          <>
            <button
              onClick={() => onEdit(cr)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-2"
            >
              {t('editButton')}
            </button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-700 text-white hover:bg-navy-900 disabled:opacity-50"
            >
              {submitMutation.isPending ? t('submitting') : t('submitButton')}
            </button>
            <button
              onClick={() => {
                if (confirm(t('deleteCRConfirm'))) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger-soft"
            >
              {t('deleteButton')}
            </button>
          </>
        )}
        {cr.requester_id === userId && cr.status === 'approved' && (
          <button
            onClick={() => onImplement(cr.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-success-text text-white hover:bg-success-text disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('markAsImplemented')}
          </button>
        )}
        {isMyTurn && !isSigner && (
          <>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-success text-white hover:bg-success-text disabled:opacity-50"
            >
              {approveMutation.isPending ? t('processing') : t('approveButton')}
            </button>
            <button
              onClick={() => onReject(cr.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger-soft"
            >
              {t('rejectButton')}
            </button>
          </>
        )}
        {isMyTurn && isSigner && (
          <button
            onClick={() => onSign(cr)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-700 text-white hover:bg-navy-900 flex items-center gap-1.5"
          >
            <Pen className="w-3 h-3" /> {t('signActionButton')}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ChangeManagementPage() {
  const t = useT(dict);
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [signCr, setSignCr] = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [tab, setTab] = useState<TabFilter>('all');

  const { data: usersData } = useQuery({
    queryKey: ['all-users-directory'],
    queryFn: () => api.get('/api/v1/users', { params: { per_page: 100 } }).then((r) => r.data.data),
  });
  const usersMap: Record<string, string> = useMemo(
    () => Object.fromEntries((usersData || []).map((u: any) => [u.id, u.full_name || u.email])),
    [usersData],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['change-requests'],
    queryFn: () => changeRequestService.list({}).then((r) => r.data.data),
  });

  const crs: any[] = data?.data || [];
  const qc = useQueryClient();
  const implementCrMutation = useMutation({
    mutationFn: (id: string) => changeRequestService.implement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success(t('crMarkedImplemented'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedGeneric')),
  });

  const awaitingMe = useMemo(() => crs.filter((cr) => isMyTurnFn(cr, user?.id || '')), [crs, user?.id]);

  const filtered = useMemo(() => {
    switch (tab) {
      case 'awaiting_me':
        return crs.filter((cr) => isMyTurnFn(cr, user?.id || ''));
      case 'in_flight':
        return crs.filter((cr) => ['submitted', 'approved'].includes(cr.status));
      case 'submitted_by_me':
        return crs.filter((cr) => cr.requester_id === user?.id);
      case 'closed':
        return crs.filter((cr) => ['rejected', 'implemented'].includes(cr.status));
      default:
        return crs;
    }
  }, [crs, tab, user?.id]);

  const inFlight = crs.filter((cr) => ['submitted', 'approved'].includes(cr.status)).length;

  return (
    <AppLayout>
      <CRModal
        open={createOpen || !!editData}
        onClose={() => {
          setCreateOpen(false);
          setEditData(null);
          setPendingFiles([]);
        }}
        editData={editData}
        pendingFiles={pendingFiles}
        setPendingFiles={setPendingFiles}
      />
      <RejectModal open={!!rejectId} crId={rejectId || ''} onClose={() => setRejectId(null)} />
      <SignModal open={!!signCr} cr={signCr} onClose={() => setSignCr(null)} />

      <PageHeader
        section={t('sectionGovernance')}
        title={t('changeManagementTitle')}
        subtitle={t('requestsSubtitle', { count: crs.length, s: crs.length !== 1 ? 's' : '', inFlight, awaiting: awaitingMe.length })}
        actions={
          <>
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              {t('newRequestButton')}
            </button>
          </>
        }
      />

      {/* Priority banner */}
      {awaitingMe.length > 0 && (
        <div
          className="bg-white border border-border rounded-[6px] px-[15px] py-[11px] flex items-center gap-[12px]"
          style={{ borderLeft: '3px solid #c9971b' }}
        >
          <AlertTriangle className="w-[14px] h-[14px] text-gold-500 flex-none" />
          <div className="flex-1 min-w-0">
            <span className="text-[12.5px] font-semibold text-navy-800">
              {awaitingMe.length === 1
                ? t('awaitingApprovalSingle', { title: awaitingMe[0].title })
                : t('awaitingApprovalMultiple', { count: awaitingMe.length })}
            </span>
            <span className="text-[12px] text-text-tertiary">{t('awaitingYourApproval')}</span>
          </div>
          <span className="inline-flex items-center h-[21px] px-[8px] rounded-[3px] text-[10.5px] font-semibold bg-gold-soft text-gold-700">
            {t('actionRequired')}
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border border-border rounded-[6px] flex items-center px-[15px] py-[9px] gap-[5px]">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className="h-[26px] px-[10px] rounded-[4px] text-[11.5px] transition-colors flex items-center gap-[5px]"
            style={tab === tabItem.id ? { background: '#14406a', color: '#fff', fontWeight: 600 } : { color: '#6b7280', fontWeight: 500 }}
          >
            {t(tabItem.labelKey)}
            {tabItem.id === 'awaiting_me' && awaitingMe.length > 0 && (
              <span
                className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full text-[9px] font-bold"
                style={{
                  background: tab === tabItem.id ? 'rgba(255,255,255,0.25)' : '#fdeceb',
                  color: tab === tabItem.id ? '#fff' : '#a3231c',
                }}
              >
                {awaitingMe.length}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto font-mono text-[9.5px] text-text-meta">
          {t('resultsCount', { count: filtered.length, s: filtered.length !== 1 ? 's' : '' })}
        </span>
      </div>

      {/* CR list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GitMerge}
          title={t('noChangeRequestsTitle')}
          subtitle={
            tab === 'awaiting_me'
              ? t('noRequestsAwaitingMe')
              : tab === 'in_flight'
                ? t('noRequestsInFlight')
                : tab === 'submitted_by_me'
                  ? t('noRequestsSubmittedByMe')
                  : tab === 'closed'
                    ? t('noClosedRequests')
                    : t('noChangeRequestsYet')
          }
        />
      ) : (
        <div className="flex flex-col gap-[8px]">
          {filtered.map((cr: any) => (
            <CRCard
              key={cr.id}
              cr={cr}
              userId={user?.id || ''}
              onEdit={setEditData}
              onReject={setRejectId}
              onSign={setSignCr}
              onImplement={(id: string) => implementCrMutation.mutate(id)}
              usersMap={usersMap}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
