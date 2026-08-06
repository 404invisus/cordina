'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Plus, Search, ChevronDown, AlertTriangle, Wrench, DollarSign } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { assetService, userService } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n';
import toast from 'react-hot-toast';

const dict = {
  en: {
    conditionGood: 'Good',
    conditionMinor: 'Minor damage',
    conditionMajor: 'Major damage',
    editAssetTitle: 'Edit Asset',
    addAssetTitle: 'Add Asset',
    assetNameLabel: 'Asset Name *',
    assetNamePlaceholder: 'e.g. HSM Thales Luna 7',
    categoryLabel: 'Category *',
    selectEllipsis: 'Select…',
    serialNumberLabel: 'Serial Number',
    serialNumberPlaceholder: 'e.g. HSM-2024-011',
    locationLabel: 'Location',
    locationPlaceholder: 'e.g. Data centre - rack B3',
    acquisitionDateLabel: 'Acquisition Date',
    acquisitionValueLabel: 'Acquisition Value (Rp)',
    conditionLabel: 'Condition',
    custodianLabel: 'Custodian',
    notesLabel: 'Notes',
    saving: 'Saving…',
    assetUpdated: 'Asset updated',
    assetAdded: 'Asset added',
    failedToSave: 'Failed to save',
    deleteAssetTitle: 'Delete Asset',
    deleteAssetMessage: 'This asset record will be permanently removed.',
    assetDeleted: 'Asset deleted',
    failedToDelete: 'Failed to delete',
    addAssetButton: 'Add asset',
    physicalAssets: 'Physical Assets',
    itemsCount: '{count} item{s}',
    bookValueSuffix: '{value} book value',
    needAttention: '{count} need attention',
    totalAssetsTitle: 'Total Assets',
    categoriesCount: '{count} categories',
    bookValueTitle: 'Book Value',
    acquisitionTotal: 'acquisition total',
    minorDamageTitle: 'Minor Damage',
    repairable: 'repairable',
    majorDamageTitle: 'Major Damage',
    disposalReview: 'disposal review',
    searchPlaceholder: 'Search name or serial number',
    conditionAll: 'Condition: All',
    custodianNote: 'Only the custodian and admins can edit an asset',
    colAsset: 'ASSET',
    colSerial: 'SERIAL NO.',
    colAcquisitionValue: 'ACQUISITION VALUE',
    colCondition: 'CONDITION',
    colLocation: 'LOCATION',
    colCustodian: 'CUSTODIAN',
    loadingAssets: 'Loading assets…',
    noAssetsTitle: 'No assets recorded',
    noAssetsSubtitle: 'Add your first physical asset to the inventory.',
    addNow: 'Add now',
    del: 'Del',
    history: 'History',
    showingOf: 'Showing {shown} of {total} · every movement is logged',
    sectionInventory: 'INVENTORY',
  },
  id: {
    conditionGood: 'Baik',
    conditionMinor: 'Rusak ringan',
    conditionMajor: 'Rusak berat',
    editAssetTitle: 'Ubah Aset',
    addAssetTitle: 'Tambah Aset',
    assetNameLabel: 'Nama Aset *',
    assetNamePlaceholder: 'cth. HSM Thales Luna 7',
    categoryLabel: 'Kategori *',
    selectEllipsis: 'Pilih…',
    serialNumberLabel: 'Nomor Seri',
    serialNumberPlaceholder: 'cth. HSM-2024-011',
    locationLabel: 'Lokasi',
    locationPlaceholder: 'cth. Ruang data - rak B3',
    acquisitionDateLabel: 'Tanggal Perolehan',
    acquisitionValueLabel: 'Nilai Perolehan (Rp)',
    conditionLabel: 'Kondisi',
    custodianLabel: 'Penanggung Jawab',
    notesLabel: 'Catatan',
    saving: 'Menyimpan…',
    assetUpdated: 'Aset diperbarui',
    assetAdded: 'Aset ditambahkan',
    failedToSave: 'Gagal menyimpan',
    deleteAssetTitle: 'Hapus Aset',
    deleteAssetMessage: 'Catatan aset ini akan dihapus secara permanen.',
    assetDeleted: 'Aset dihapus',
    failedToDelete: 'Gagal menghapus',
    addAssetButton: 'Tambah aset',
    physicalAssets: 'Aset Fisik',
    itemsCount: '{count} item',
    bookValueSuffix: '{value} nilai buku',
    needAttention: '{count} perlu perhatian',
    totalAssetsTitle: 'Total Aset',
    categoriesCount: '{count} kategori',
    bookValueTitle: 'Nilai Buku',
    acquisitionTotal: 'total perolehan',
    minorDamageTitle: 'Rusak Ringan',
    repairable: 'dapat diperbaiki',
    majorDamageTitle: 'Rusak Berat',
    disposalReview: 'tinjauan penghapusan',
    searchPlaceholder: 'Cari nama atau nomor seri',
    conditionAll: 'Kondisi: Semua',
    custodianNote: 'Hanya penanggung jawab dan admin yang dapat mengubah aset',
    colAsset: 'ASET',
    colSerial: 'NO. SERI',
    colAcquisitionValue: 'NILAI PEROLEHAN',
    colCondition: 'KONDISI',
    colLocation: 'LOKASI',
    colCustodian: 'PENANGGUNG JAWAB',
    loadingAssets: 'Memuat aset…',
    noAssetsTitle: 'Belum ada aset tercatat',
    noAssetsSubtitle: 'Tambahkan aset fisik pertama Anda ke inventaris.',
    addNow: 'Tambah sekarang',
    del: 'Hapus',
    history: 'Riwayat',
    showingOf: 'Menampilkan {shown} dari {total} · setiap pergerakan tercatat',
    sectionInventory: 'INVENTARIS',
  },
};

const CONDITION: Record<string, { labelKey: string; bg: string; text: string; dot: string }> = {
  baik: { labelKey: 'conditionGood', bg: 'bg-success-soft', text: 'text-success-text', dot: 'bg-success' },
  rusak_ringan: { labelKey: 'conditionMinor', bg: 'bg-gold-soft', text: 'text-gold-700', dot: 'bg-gold-500' },
  rusak_berat: { labelKey: 'conditionMajor', bg: 'bg-danger-soft', text: 'text-danger-text', dot: 'bg-danger' },
};

const ASSET_CATEGORIES = ['Hardware', 'Software', 'Furniture', 'Vehicle', 'Network', 'Other'];

const ASSET_CATEGORY_LABELS: Record<'en' | 'id', Record<string, string>> = {
  en: {
    Hardware: 'Hardware',
    Software: 'Software',
    Furniture: 'Furniture',
    Vehicle: 'Vehicle',
    Network: 'Network',
    Other: 'Other',
  },
  id: {
    Hardware: 'Perangkat Keras',
    Software: 'Perangkat Lunak',
    Furniture: 'Perabotan',
    Vehicle: 'Kendaraan',
    Network: 'Jaringan',
    Other: 'Lainnya',
  },
};

function assetCategoryLabel(cat: string, locale: 'en' | 'id') {
  return ASSET_CATEGORY_LABELS[locale][cat] ?? cat;
}

function formatRupiah(val: any) {
  if (!val) return '-';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function formatBookValue(assets: any[]) {
  const total = assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  if (total >= 1_000_000_000) return `Rp ${(total / 1_000_000_000).toFixed(2)} bn`;
  if (total >= 1_000_000) return `Rp ${(total / 1_000_000).toFixed(1)} M`;
  return formatRupiah(total);
}

function CondBadge({ condition }: { condition: string }) {
  const t = useT(dict);
  const c = CONDITION[condition] ?? CONDITION.baik;
  return (
    <span className={cn('inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] text-[10.5px] font-semibold', c.bg, c.text)}>
      <span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', c.dot)} />
      {t(c.labelKey)}
    </span>
  );
}

function AssetModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const t = useT(dict);
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: editData?.name ?? '',
    category: editData?.category ?? '',
    serial_number: editData?.serial_number ?? '',
    condition: editData?.condition ?? 'baik',
    location: editData?.location ?? '',
    acquired_at: editData?.acquired_at?.slice(0, 10) ?? '',
    value: editData?.value ?? '',
    notes: editData?.notes ?? '',
    responsible_user_id: editData?.responsible_user_id ?? '',
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.list().then((r) => r.data.data?.data || r.data.data || []),
  });
  const users: any[] = usersData || [];

  const mutation = useMutation({
    mutationFn: (data: any) => (editData ? assetService.update(editData.id, data) : assetService.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success(editData ? t('assetUpdated') : t('assetAdded'));
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToSave')),
  });

  const inp = (key: string, label: string, type = 'text', placeholder = '') => (
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

  const sel = (key: string, label: string, options: { value: string; label: string }[]) => (
    <div key={key}>
      <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{label}</label>
      <select
        value={(form as any)[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-700/20"
      >
        <option value="">{t('selectEllipsis')}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={editData ? t('editAssetTitle') : t('addAssetTitle')} size="md">
      <div className="space-y-4">
        {inp('name', t('assetNameLabel'), 'text', t('assetNamePlaceholder'))}
        {sel(
          'category',
          t('categoryLabel'),
          ASSET_CATEGORIES.map((c) => ({ value: c, label: assetCategoryLabel(c, locale) })),
        )}
        {inp('serial_number', t('serialNumberLabel'), 'text', t('serialNumberPlaceholder'))}
        {inp('location', t('locationLabel'), 'text', t('locationPlaceholder'))}
        {inp('acquired_at', t('acquisitionDateLabel'), 'date')}
        {inp('value', t('acquisitionValueLabel'), 'number', '1240000000')}
        {sel('condition', t('conditionLabel'), [
          { value: 'baik', label: t('conditionGood') },
          { value: 'rusak_ringan', label: t('conditionMinor') },
          { value: 'rusak_berat', label: t('conditionMajor') },
        ])}
        {sel(
          'responsible_user_id',
          t('custodianLabel'),
          users.map((u) => ({ value: u.id, label: `${u.full_name}${u.division ? ` (${u.division})` : ''}` })),
        )}
        <div>
          <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{t('notesLabel')}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-border text-sm text-navy-900 resize-none focus:outline-none focus:ring-2 focus:ring-navy-700/20"
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
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.name || !form.category}
            className="flex-1 px-4 py-2 rounded-md bg-navy-700 text-white text-sm font-bold hover:bg-navy-900 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? t('saving') : t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AssetsPage() {
  const t = useT(dict);
  const { locale } = useLocale();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [condFilter, setCondFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, condFilter],
    queryFn: () => assetService.list({ search: search || undefined, condition: condFilter || undefined }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success(t('assetDeleted'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failedToDelete')),
  });

  const assets: any[] = data?.data || [];
  const total = assets.length;
  const minorDamage = assets.filter((a) => a.condition === 'rusak_ringan').length;
  const majorDamage = assets.filter((a) => a.condition === 'rusak_berat').length;
  const bookValue = formatBookValue(assets);

  const subtitle = isLoading
    ? undefined
    : [
        t('itemsCount', { count: total, s: total !== 1 ? 's' : '' }),
        bookValue !== 'Rp 0' ? t('bookValueSuffix', { value: bookValue }) : null,
        minorDamage + majorDamage > 0 ? t('needAttention', { count: minorDamage + majorDamage }) : null,
      ]
        .filter(Boolean)
        .join(' · ');

  return (
    <AppLayout>
      <AssetModal
        key={editData?.id ?? 'new'}
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
        title={t('deleteAssetTitle')}
        message={t('deleteAssetMessage')}
        danger
      />

      <PageHeader
        section={t('sectionInventory')}
        title={t('physicalAssets')}
        subtitle={subtitle}
        actions={
          <>
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-md bg-navy-700 text-white text-sm font-bold hover:bg-navy-900 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {t('addAssetButton')}
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard
          title={t('totalAssetsTitle')}
          value={total}
          subtitle={t('categoriesCount', { count: new Set(assets.map((a) => a.category)).size })}
          icon={Archive}
          color="blue"
          index={0}
          progress={100}
        />
        <StatCard
          title={t('bookValueTitle')}
          value={bookValue}
          subtitle={t('acquisitionTotal')}
          icon={DollarSign}
          color="blue"
          index={1}
          progress={100}
        />
        <StatCard
          title={t('minorDamageTitle')}
          value={minorDamage}
          subtitle={t('repairable')}
          icon={Wrench}
          color="orange"
          index={2}
          progress={total ? Math.round((minorDamage / total) * 100) : 0}
        />
        <StatCard
          title={t('majorDamageTitle')}
          value={majorDamage}
          subtitle={t('disposalReview')}
          icon={AlertTriangle}
          color="red"
          index={3}
          progress={total ? Math.round((majorDamage / total) * 100) : 0}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-md flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-[15px] py-[9px] border-b border-border-subtle flex-wrap">
          <div className="flex items-center gap-2 h-[30px] px-[11px] border border-border-input rounded-md w-[240px] bg-white focus-within:border-navy-700 focus-within:ring-1 focus-within:ring-navy-700/20">
            <Search className="w-3 h-3 text-text-placeholder flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 bg-transparent text-text-secondary placeholder:text-text-placeholder focus:outline-none text-[12px]"
            />
          </div>

          <div className="relative">
            <select
              value={condFilter}
              onChange={(e) => setCondFilter(e.target.value)}
              className="h-[30px] pl-3 pr-7 border border-border-input rounded-md bg-white text-[11.5px] font-medium text-text-secondary appearance-none focus:outline-none focus:border-navy-700 cursor-pointer"
            >
              <option value="">{t('conditionAll')}</option>
              <option value="baik">{t('conditionGood')}</option>
              <option value="rusak_ringan">{t('conditionMinor')}</option>
              <option value="rusak_berat">{t('conditionMajor')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-text-placeholder" />
          </div>

          <span className="ml-auto text-[11px] text-neutral">{t('custodianNote')}</span>
        </div>

        {/* Column headers */}
        <div
          className="grid px-[15px] h-[30px] items-center border-b border-border-subtle bg-surface-2"
          style={{ gridTemplateColumns: '1fr 118px 140px 120px 140px 120px 60px' }}
        >
          {[t('colAsset'), t('colSerial'), t('colAcquisitionValue'), t('colCondition'), t('colLocation'), t('colCustodian'), ''].map((h, i) => (
            <div key={i} className={cn('font-mono text-[9.5px] font-semibold tracking-[0.1em] text-neutral', i === 6 && 'text-right')}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <LoadingSpinner label={t('loadingAssets')} />
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Archive}
            title={t('noAssetsTitle')}
            subtitle={t('noAssetsSubtitle')}
            action={
              <button onClick={() => setCreateOpen(true)} className="text-sm text-navy-700 font-semibold hover:underline">
                {t('addNow')}
              </button>
            }
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {assets.map((asset: any) => {
              const canEdit = (user as any)?.id === asset.created_by;
              const custodian = asset.responsible_user?.full_name ?? asset.responsible_user_name ?? '';
              const initials = custodian ? getInitials(custodian) : '';
              const lastName = custodian.split(' ').slice(-1)[0] ?? '';

              return (
                <div
                  key={asset.id}
                  className="grid px-[15px] h-[38px] items-center border-b border-border-subtle hover:bg-surface-2 transition-colors"
                  style={{ gridTemplateColumns: '1fr 118px 140px 120px 140px 120px 60px' }}
                >
                  {/* Asset name + category */}
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-navy-800 truncate leading-none">{asset.name}</div>
                    {asset.category && (
                      <div className="font-mono text-[10px] text-text-placeholder truncate leading-none mt-px">
                        {assetCategoryLabel(asset.category, locale)}
                      </div>
                    )}
                  </div>

                  {/* Serial */}
                  <div className="font-mono text-[11px] text-text-secondary truncate">{asset.serial_number || '-'}</div>

                  {/* Value */}
                  <div className="font-mono text-[11.5px] font-medium text-navy-800">{formatRupiah(asset.value)}</div>

                  {/* Condition */}
                  <div>
                    <CondBadge condition={asset.condition} />
                  </div>

                  {/* Location */}
                  <div className="text-[12px] text-text-secondary truncate">{asset.location || '-'}</div>

                  {/* Custodian */}
                  <div className="flex items-center gap-[7px]">
                    {initials && (
                      <div className="w-[22px] h-[22px] rounded-full bg-info-soft text-navy-700 flex items-center justify-content-center flex-shrink-0 flex items-center justify-center font-bold text-[9px]">
                        {initials}
                      </div>
                    )}
                    <span className="text-[11.5px] text-text-secondary truncate">{lastName || '-'}</span>
                  </div>

                  {/* History / actions */}
                  <div className="flex items-center justify-end gap-2">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => setEditData(asset)}
                          className="text-[10.5px] font-medium text-navy-700 underline hover:text-navy-900 transition-colors"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => setDeleteId(asset.id)}
                          className="text-[10.5px] font-medium text-danger hover:text-danger-text transition-colors"
                        >
                          {t('del')}
                        </button>
                      </>
                    )}
                    {!canEdit && (
                      <span className="text-[10.5px] font-medium text-navy-700 underline cursor-pointer hover:text-navy-900">{t('history')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!isLoading && assets.length > 0 && (
          <div className="h-[36px] flex-none flex items-center justify-between px-[15px] border-t border-border-subtle bg-surface-2">
            <span className="text-[11px] text-neutral">{t('showingOf', { shown: assets.length, total })}</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
