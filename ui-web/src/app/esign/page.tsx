'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileSignature, Upload, Download, ShieldCheck, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { esignService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { formatDateTime as formatDate, formatBytes as formatSize } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const dict = {
  en: {
    signDocument: 'Sign document',
    pdfDocumentLabel: 'PDF DOCUMENT *',
    clickToUploadPdf: 'Click to upload a PDF',
    max20mb: 'Max 20 MB',
    documentTitleLabel: 'DOCUMENT TITLE',
    titlePlaceholder: 'Optional, defaults to file name',
    passphraseLabel: 'SIGNING PASSPHRASE *',
    passphrasePlaceholder: 'Enter your e-Sign passphrase',
    passphraseNotice: 'Passphrase is never stored. The document will be electronically signed using a certificate issued by BSrE.',
    signing: 'Signing…',
    fileTooLarge: 'File size too large. Maximum 20 MB per document for e-signing.',
    signSuccess: 'Document signed successfully',
    signError: 'Failed to sign document',
    verifySignatureTitle: 'Verify signature',
    signatureValid: 'Signature valid',
    signatureInvalid: 'Signature invalid',
    signerFallback: 'Signer {n}',
    signedAtLabel: 'Signed: {date}',
    verifyFailed: 'Failed to verify document',
    section: 'E-SIGN',
    title: 'e-Sign',
    subtitle: '{total} document{plural} signed',
    nikWarningPrefix: 'NIK not set in your profile. Complete your e-Sign setup in',
    settingsLink: 'Settings',
    nikWarningSuffix: 'to use this feature.',
    statDocumentsSignedTitle: 'Documents Signed',
    statDocumentsSignedSubtitle: 'total signed',
    statVisibleTitle: 'Visible Signatures',
    statVisibleSubtitle: 'with stamp',
    statInvisibleTitle: 'Invisible Signatures',
    statInvisibleSubtitle: 'embedded only',
    statNikTitle: 'NIK Status',
    nikActive: 'Active',
    nikNotSet: 'Not set',
    nikReady: 'ready to sign',
    nikConfigure: 'configure in settings',
    colFile: 'FILE',
    colSigned: 'SIGNED',
    colSignature: 'SIGNATURE',
    colActions: 'ACTIONS',
    emptyTitle: 'No signed documents',
    emptySubtitle: 'Upload a PDF and sign it electronically to see it here',
    visible: 'Visible',
    invisible: 'Invisible',
    verify: 'Verify',
    downloadFailed: 'Failed to download document',
  },
  id: {
    signDocument: 'Tandatangani dokumen',
    pdfDocumentLabel: 'DOKUMEN PDF *',
    clickToUploadPdf: 'Klik untuk mengunggah PDF',
    max20mb: 'Maks 20 MB',
    documentTitleLabel: 'JUDUL DOKUMEN',
    titlePlaceholder: 'Opsional, default ke nama file',
    passphraseLabel: 'PASSPHRASE TANDA TANGAN *',
    passphrasePlaceholder: 'Masukkan passphrase e-Sign Anda',
    passphraseNotice: 'Passphrase tidak pernah disimpan. Dokumen akan ditandatangani secara elektronik menggunakan sertifikat yang diterbitkan oleh BSrE.',
    signing: 'Menandatangani…',
    fileTooLarge: 'Ukuran file terlalu besar. Maksimum 20 MB per dokumen untuk e-Sign.',
    signSuccess: 'Dokumen berhasil ditandatangani',
    signError: 'Gagal menandatangani dokumen',
    verifySignatureTitle: 'Verifikasi tanda tangan',
    signatureValid: 'Tanda tangan valid',
    signatureInvalid: 'Tanda tangan tidak valid',
    signerFallback: 'Penanda Tangan {n}',
    signedAtLabel: 'Ditandatangani: {date}',
    verifyFailed: 'Gagal memverifikasi dokumen',
    section: 'E-SIGN',
    title: 'e-Sign',
    subtitle: '{total} dokumen ditandatangani',
    nikWarningPrefix: 'NIK belum diatur pada profil Anda. Lengkapi pengaturan e-Sign Anda di',
    settingsLink: 'Pengaturan',
    nikWarningSuffix: 'untuk menggunakan fitur ini.',
    statDocumentsSignedTitle: 'Dokumen Ditandatangani',
    statDocumentsSignedSubtitle: 'total ditandatangani',
    statVisibleTitle: 'Tanda Tangan Terlihat',
    statVisibleSubtitle: 'dengan stempel',
    statInvisibleTitle: 'Tanda Tangan Tersembunyi',
    statInvisibleSubtitle: 'hanya tertanam',
    statNikTitle: 'Status NIK',
    nikActive: 'Aktif',
    nikNotSet: 'Belum diatur',
    nikReady: 'siap menandatangani',
    nikConfigure: 'atur di pengaturan',
    colFile: 'FILE',
    colSigned: 'DITANDATANGANI',
    colSignature: 'TANDA TANGAN',
    colActions: 'AKSI',
    emptyTitle: 'Belum ada dokumen yang ditandatangani',
    emptySubtitle: 'Unggah PDF dan tandatangani secara elektronik untuk melihatnya di sini',
    visible: 'Terlihat',
    invisible: 'Tersembunyi',
    verify: 'Verifikasi',
    downloadFailed: 'Gagal mengunduh dokumen',
  },
};

function SignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const t = useT(dict);
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [passphrase, setPassphrase] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', file!);
      if (file && file.size > 20 * 1024 * 1024) {
        throw { response: { data: { message: t('fileTooLarge') } } };
      }
      fd.append('passphrase', passphrase);
      fd.append('tampilan', 'INVISIBLE');
      fd.append('nik', (user as any)?.nik || '');
      if (title) fd.append('title', title);
      return esignService.sign(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esign-docs'] });
      toast.success(t('signSuccess'));
      onClose();
      setFile(null);
      setTitle('');
      setPassphrase('');
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('signError')),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[8px] w-full max-w-md"
      >
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-border-subtle">
          <span className="text-[14px] font-semibold text-navy-900">{t('signDocument')}</span>
          <button onClick={onClose} className="p-[6px] hover:bg-surface-2 rounded-[4px] transition-colors">
            <X className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[14px]">
          {/* File upload */}
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral block mb-[6px]">{t('pdfDocumentLabel')}</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-border-button rounded-[6px] p-[14px] text-center cursor-pointer hover:border-navy-700 hover:bg-info-soft transition-colors"
              style={file ? { borderColor: '#14406a', background: '#eaf1f8' } : {}}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div className="flex items-center gap-[10px] text-left">
                  <div className="w-[36px] h-[36px] bg-danger-soft rounded-[4px] flex items-center justify-center flex-none">
                    <span className="text-[10px] font-bold text-danger-text">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-navy-800 truncate">{file.name}</div>
                    <div className="text-[11px] text-text-placeholder">{formatSize(file.size)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="p-[4px] hover:bg-danger-soft rounded-[4px] text-danger-text"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-[18px] h-[18px] text-text-meta mx-auto mb-[6px]" />
                  <div className="text-[12px] text-text-placeholder">{t('clickToUploadPdf')}</div>
                  <div className="text-[10px] text-text-meta mt-1">{t('max20mb')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral block mb-[6px]">{t('documentTitleLabel')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-[34px] px-[10px] border border-border-button rounded-[6px] text-[12px] text-navy-800 focus:outline-none focus:border-navy-700"
              placeholder={t('titlePlaceholder')}
            />
          </div>

          {/* Passphrase */}
          <div>
            <label className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral block mb-[6px]">
              {t('passphraseLabel')}
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full h-[34px] px-[10px] border border-border-button rounded-[6px] text-[12px] text-navy-800 font-mono focus:outline-none focus:border-navy-700"
              placeholder={t('passphrasePlaceholder')}
            />
          </div>

          {/* Notice */}
          <div className="flex items-start gap-[8px] px-[10px] py-[9px] bg-gold-soft border border-gold-soft rounded-[6px] text-[11px] text-gold-700">
            <AlertTriangle className="w-[13px] h-[13px] flex-none mt-[1px]" />
            {t('passphraseNotice')}
          </div>
        </div>

        <div className="flex gap-[8px] px-[20px] pb-[20px]">
          <button
            onClick={onClose}
            className="flex-1 h-[34px] border border-border-button rounded-[6px] text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !file || !passphrase}
            className="flex-1 h-[34px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold flex items-center justify-center gap-[6px] disabled:opacity-50"
            style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
          >
            <FileSignature className="w-3 h-3" />
            {mutation.isPending ? t('signing') : t('signDocument')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function VerifyModal({ open, doc, onClose }: { open: boolean; doc: any; onClose: () => void }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['esign-verify', doc?.id],
    queryFn: () =>
      esignService.verify(doc.id).then((r) => {
        const d = r.data.data;
        return {
          valid: d?.valid ?? d?.conclusion === 'VALID',
          message: d?.message || d?.description || '',
          signers:
            d?.signers ||
            d?.signatureInformations?.map((s: any) => ({
              name: s.signerName || s.commonName || s.name || '',
              signingTime: s.signatureDate ? new Date(s.signatureDate).toISOString() : null,
            })) ||
            [],
        };
      }),
    enabled: open && !!doc,
  });

  if (!open || !doc) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[8px] w-full max-w-md"
      >
        <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-border-subtle">
          <span className="text-[14px] font-semibold text-navy-900">{t('verifySignatureTitle')}</span>
          <button onClick={onClose} className="p-[6px] hover:bg-surface-2 rounded-[4px] transition-colors">
            <X className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        </div>
        <div className="p-[20px]">
          <p className="text-[11.5px] text-text-tertiary mb-[14px] truncate">{doc.title || doc.original_name}</p>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-border-subtle border-t-brand rounded-full animate-spin" />
            </div>
          ) : data ? (
            <div className="flex flex-col gap-[10px]">
              <div
                className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-[6px] border"
                style={
                  data.valid
                    ? { background: '#e9f4ee', borderColor: '#b3d9c4', color: '#0f6144' }
                    : { background: '#fdeceb', borderColor: '#f5b8b5', color: '#a3231c' }
                }
              >
                {data.valid ? <CheckCircle2 className="w-4 h-4 flex-none" /> : <AlertTriangle className="w-4 h-4 flex-none" />}
                <div>
                  <div className="text-[12.5px] font-semibold">{data.valid ? t('signatureValid') : t('signatureInvalid')}</div>
                  {data.message && <div className="text-[11px] mt-[2px] opacity-75">{data.message}</div>}
                </div>
              </div>
              {data.signers?.map((s: any, i: number) => (
                <div key={i} className="px-[12px] py-[9px] bg-surface-2 rounded-[6px]">
                  <div className="text-[12px] font-semibold text-navy-800">{s.name || t('signerFallback', { n: i + 1 })}</div>
                  <div className="font-mono text-[10.5px] text-text-placeholder mt-[2px]">
                    {t('signedAtLabel', { date: s.signingTime ? formatDate(s.signingTime, locale) : '—' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-text-placeholder text-center py-8">{t('verifyFailed')}</div>
          )}
          <button
            onClick={onClose}
            className="w-full mt-[14px] h-[34px] border border-border-button rounded-[6px] text-[12px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function EsignPage() {
  const t = useT(dict);
  const { locale } = useLocale();
  const { user } = useAuthStore();
  const [signOpen, setSignOpen] = useState(false);
  const [verifyDoc, setVerifyDoc] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['esign-docs'],
    queryFn: () => esignService.list().then((r) => r.data.data),
  });

  const handleDownload = async (doc: any) => {
    try {
      const res = await esignService.download(doc.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'signed_' + (doc.title || doc.original_name || 'document') + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('downloadFailed'));
    }
  };

  const docs = Array.isArray(data) ? data : [];
  const hasNik = !!(user as any)?.nik;
  const total = docs.length;

  return (
    <AppLayout>
      <SignModal open={signOpen} onClose={() => setSignOpen(false)} />
      <VerifyModal open={!!verifyDoc} doc={verifyDoc} onClose={() => setVerifyDoc(null)} />

      <PageHeader
        section={t('section')}
        title={t('title')}
        subtitle={t('subtitle', { total, plural: total !== 1 ? 's' : '' })}
        actions={
          <>
            <button
              onClick={() => setSignOpen(true)}
              disabled={!hasNik}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-[6px] bg-navy-700 text-white text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 1px 2px rgba(180,130,10,.35)' }}
            >
              <FileSignature className="w-3 h-3" strokeWidth={2.5} />
              {t('signDocument')}
            </button>
          </>
        }
      />

      {/* NIK warning */}
      {!hasNik && (
        <div
          className="bg-white border border-border rounded-[6px] px-[15px] py-[11px] flex items-center gap-[12px]"
          style={{ borderLeft: '3px solid #c9971b' }}
        >
          <AlertTriangle className="w-[14px] h-[14px] text-gold-500 flex-none" />
          <span className="text-[12px] text-text-secondary">
            {t('nikWarningPrefix')}{' '}
            <a href="/settings" className="font-semibold text-navy-700 hover:underline">
              {t('settingsLink')}
            </a>{' '}
            {t('nikWarningSuffix')}
          </span>
        </div>
      )}

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          index={0}
          title={t('statDocumentsSignedTitle')}
          value={total}
          subtitle={t('statDocumentsSignedSubtitle')}
          icon={FileSignature}
          color="brand"
          progress={100}
        />
        <StatCard
          index={1}
          title={t('statVisibleTitle')}
          value={docs.filter((d) => d.tampilan === 'VISIBLE').length}
          subtitle={t('statVisibleSubtitle')}
          icon={ShieldCheck}
          color="green"
          progress={total > 0 ? Math.round((docs.filter((d) => d.tampilan === 'VISIBLE').length / total) * 100) : 0}
        />
        <StatCard
          index={2}
          title={t('statInvisibleTitle')}
          value={docs.filter((d) => d.tampilan !== 'VISIBLE').length}
          subtitle={t('statInvisibleSubtitle')}
          icon={FileSignature}
          color="brand"
          progress={total > 0 ? Math.round((docs.filter((d) => d.tampilan !== 'VISIBLE').length / total) * 100) : 0}
        />
        <StatCard
          index={3}
          title={t('statNikTitle')}
          value={hasNik ? t('nikActive') : t('nikNotSet')}
          subtitle={hasNik ? t('nikReady') : t('nikConfigure')}
          icon={ShieldCheck}
          color={hasNik ? 'green' : 'red'}
          progress={hasNik ? 100 : 0}
        />
      </div>

      {/* Document list */}
      <div className="bg-white border border-border rounded-[6px] flex flex-col overflow-hidden">
        {/* Table header */}
        <div
          className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
          style={{ gridTemplateColumns: '1fr 180px 110px 160px' }}
        >
          {[t('colFile'), t('colSigned'), t('colSignature'), t('colActions')].map((h, i) => (
            <div
              key={h}
              className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral"
              style={i === 3 ? { textAlign: 'right' } : {}}
            >
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner />
          </div>
        ) : docs.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={FileSignature}
              title={t('emptyTitle')}
              subtitle={t('emptySubtitle')}
            />
          </div>
        ) : (
          docs.map((doc: any, i: number) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="grid px-[15px] h-[40px] items-center border-b border-border-subtle last:border-b-0 hover:bg-surface-2 transition-colors"
              style={{ gridTemplateColumns: '1fr 180px 110px 160px' }}
            >
              {/* File name */}
              <div className="flex items-center gap-[9px] min-w-0">
                <div className="w-[26px] h-[26px] bg-danger-soft rounded-[3px] flex items-center justify-center flex-none">
                  <span className="text-[9px] font-bold text-danger-text">PDF</span>
                </div>
                <span className="text-[12.5px] font-semibold text-navy-800 truncate">{doc.title || doc.original_name}</span>
              </div>

              {/* Signed at */}
              <div className="font-mono text-[11px] text-text-secondary">{formatDate(doc.signed_at, locale)}</div>

              {/* Visibility */}
              <div>
                <span
                  className="inline-flex items-center h-[20px] px-[7px] rounded-[3px] text-[10.5px] font-semibold"
                  style={
                    doc.tampilan === 'VISIBLE' ? { background: '#e9f4ee', color: '#0f6144' } : { background: '#f1f0ed', color: '#5c6470' }
                  }
                >
                  {doc.tampilan === 'VISIBLE' ? t('visible') : t('invisible')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-[6px]">
                <button
                  onClick={() => setVerifyDoc(doc)}
                  className="h-[26px] flex items-center gap-[5px] px-[9px] border border-border-button rounded-[4px] text-[11px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
                >
                  <ShieldCheck className="w-[11px] h-[11px]" />
                  {t('verify')}
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="h-[26px] flex items-center gap-[5px] px-[9px] border border-border-button rounded-[4px] text-[11px] font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
                >
                  <Download className="w-[11px] h-[11px]" />
                  {t('common.download')}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
