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
import toast from 'react-hot-toast';

const CONDITION: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  baik:         { label: 'Good',         bg: 'bg-success-soft', text: 'text-emerald-700', dot: 'bg-success'  },
  rusak_ringan: { label: 'Minor damage', bg: 'bg-accent-soft',  text: 'text-accent-dim',  dot: 'bg-accent'   },
  rusak_berat:  { label: 'Major damage', bg: 'bg-danger-soft',  text: 'text-red-700',     dot: 'bg-danger'   },
};

const ASSET_CATEGORIES = [
  'Hardware', 'Software', 'Furniture', 'Vehicle', 'Network', 'Other',
];

function formatRupiah(val: any) {
  if (!val) return '—';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function formatBookValue(assets: any[]) {
  const total = assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  if (total >= 1_000_000_000) return `Rp ${(total / 1_000_000_000).toFixed(2)} bn`;
  if (total >= 1_000_000) return `Rp ${(total / 1_000_000).toFixed(1)} M`;
  return formatRupiah(total);
}

function CondBadge({ condition }: { condition: string }) {
  const c = CONDITION[condition] ?? CONDITION.baik;
  return (
    <span className={cn('inline-flex items-center gap-[5px] h-[21px] px-2 rounded-[3px] text-[10.5px] font-semibold', c.bg, c.text)}>
      <span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', c.dot)} />
      {c.label}
    </span>
  );
}

function AssetModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name:                editData?.name                ?? '',
    category:            editData?.category            ?? '',
    serial_number:       editData?.serial_number       ?? '',
    condition:           editData?.condition           ?? 'baik',
    location:            editData?.location            ?? '',
    acquired_at:         editData?.acquired_at?.slice(0, 10) ?? '',
    value:               editData?.value               ?? '',
    notes:               editData?.notes               ?? '',
    responsible_user_id: editData?.responsible_user_id ?? '',
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.list().then(r => r.data.data?.data || r.data.data || []),
  });
  const users: any[] = usersData || [];

  const mutation = useMutation({
    mutationFn: (data: any) => editData ? assetService.update(editData.id, data) : assetService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success(editData ? 'Asset updated' : 'Asset added');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
  });

  const inp = (key: string, label: string, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
    </div>
  );

  const sel = (key: string, label: string, options: { value: string; label: string }[]) => (
    <div key={key}>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <select value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20">
        <option value="">Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={editData ? 'Edit Asset' : 'Add Asset'} size="md">
      <div className="space-y-4">
        {inp('name', 'Asset Name *', 'text', 'e.g. HSM Thales Luna 7')}
        {sel('category', 'Category *', ASSET_CATEGORIES.map(c => ({ value: c, label: c })))}
        {inp('serial_number', 'Serial Number', 'text', 'e.g. HSM-2024-011')}
        {inp('location', 'Location', 'text', 'e.g. Data centre — rack B3')}
        {inp('acquired_at', 'Acquisition Date', 'date')}
        {inp('value', 'Acquisition Value (Rp)', 'number', '1240000000')}
        {sel('condition', 'Condition', [
          { value: 'baik', label: 'Good' },
          { value: 'rusak_ringan', label: 'Minor damage' },
          { value: 'rusak_berat', label: 'Major damage' },
        ])}
        {sel('responsible_user_id', 'Custodian',
          users.map(u => ({ value: u.id, label: `${u.full_name}${u.division ? ` (${u.division})` : ''}` }))
        )}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-md border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.category}
            className="flex-1 px-4 py-2 rounded-md bg-accent text-[#12283c] text-sm font-bold hover:bg-amber-500 disabled:opacity-50 transition-colors">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AssetsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [createOpen,  setCreateOpen]  = useState(false);
  const [editData,    setEditData]    = useState<any>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [condFilter,  setCondFilter]  = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, condFilter],
    queryFn: () => assetService.list({ search: search || undefined, condition: condFilter || undefined }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const assets: any[] = data?.data || [];
  const total       = assets.length;
  const minorDamage = assets.filter(a => a.condition === 'rusak_ringan').length;
  const majorDamage = assets.filter(a => a.condition === 'rusak_berat').length;
  const bookValue   = formatBookValue(assets);

  const subtitle = isLoading ? undefined : [
    `${total} item${total !== 1 ? 's' : ''}`,
    bookValue !== 'Rp 0' ? `${bookValue} book value` : null,
    (minorDamage + majorDamage) > 0 ? `${minorDamage + majorDamage} need attention` : null,
  ].filter(Boolean).join(' · ');

  return (
    <AppLayout>
      <AssetModal key={editData?.id ?? 'new'} open={createOpen || !!editData}
        onClose={() => { setCreateOpen(false); setEditData(null); }} editData={editData} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
        title="Delete Asset" message="This asset record will be permanently removed." danger />

      <PageHeader
        section="INVENTORY"
        title="Physical Assets"
        subtitle={subtitle}
        actions={
          <>
            <button className="h-[34px] flex items-center gap-1.5 px-[13px] border border-[#d9d6cf] rounded-md bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Export register
            </button>
            <button className="h-[34px] flex items-center gap-1.5 px-[13px] border border-[#d9d6cf] rounded-md bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Record movement
            </button>
            <button onClick={() => setCreateOpen(true)}
              className="h-[34px] flex items-center gap-[6px] px-[14px] rounded-md bg-accent text-[#12283c] text-sm font-bold shadow-sm hover:bg-amber-500 transition-colors">
              <Plus className="w-3 h-3" />
              Add asset
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard title="Total Assets"  value={total}       subtitle={`${new Set(assets.map(a => a.category)).size} categories`} icon={Archive}        color="blue"   index={0} progress={100} />
        <StatCard title="Book Value"    value={bookValue}   subtitle="acquisition total"                                          icon={DollarSign}    color="blue"   index={1} progress={100} />
        <StatCard title="Minor Damage"  value={minorDamage} subtitle="repairable"                                                 icon={Wrench}        color="orange" index={2} progress={total ? Math.round(minorDamage / total * 100) : 0} />
        <StatCard title="Major Damage"  value={majorDamage} subtitle="disposal review"                                            icon={AlertTriangle} color="red"    index={3} progress={total ? Math.round(majorDamage / total * 100) : 0} />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e6e4df] rounded-md flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-[15px] py-[9px] border-b border-[#eceae4] flex-wrap">
          <div className="flex items-center gap-2 h-[30px] px-[11px] border border-[#e2e0da] rounded-md w-[240px] bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20">
            <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or serial number"
              className="flex-1 bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none text-[12px]" />
          </div>

          <div className="relative">
            <select value={condFilter} onChange={e => setCondFilter(e.target.value)}
              className="h-[30px] pl-3 pr-7 border border-[#e2e0da] rounded-md bg-white text-[11.5px] font-medium text-slate-600 appearance-none focus:outline-none focus:border-brand cursor-pointer">
              <option value="">Condition: All</option>
              <option value="baik">Good</option>
              <option value="rusak_ringan">Minor damage</option>
              <option value="rusak_berat">Major damage</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-slate-400" />
          </div>

          <span className="ml-auto text-[11px] text-[#8a8f98]">Only the custodian and admins can edit an asset</span>
        </div>

        {/* Column headers */}
        <div className="grid px-[15px] h-[30px] items-center border-b border-[#eceae4] bg-[#faf9f7]"
          style={{ gridTemplateColumns: '1fr 118px 140px 120px 140px 120px 60px' }}>
          {['ASSET', 'SERIAL NO.', 'ACQUISITION VALUE', 'CONDITION', 'LOCATION', 'CUSTODIAN', ''].map((h, i) => (
            <div key={i} className={cn('font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#8a8f98]', i === 6 && 'text-right')}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <LoadingSpinner label="Loading assets…" />
        ) : assets.length === 0 ? (
          <EmptyState icon={Archive} title="No assets recorded" subtitle="Add your first physical asset to the inventory."
            action={<button onClick={() => setCreateOpen(true)} className="text-sm text-brand font-semibold hover:underline">Add now</button>} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {assets.map((asset: any) => {
              const canEdit = (user as any)?.id === asset.created_by;
              const custodian = asset.responsible_user?.full_name ?? asset.responsible_user_name ?? '';
              const initials  = custodian ? getInitials(custodian) : '';
              const lastName  = custodian.split(' ').slice(-1)[0] ?? '';

              return (
                <div key={asset.id}
                  className="grid px-[15px] h-[38px] items-center border-b border-[#f2f0ec] hover:bg-[#faf9f7] transition-colors"
                  style={{ gridTemplateColumns: '1fr 118px 140px 120px 140px 120px 60px' }}>

                  {/* Asset name + category */}
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-[#12283c] truncate leading-none">{asset.name}</div>
                    {asset.category && (
                      <div className="font-mono text-[10px] text-slate-400 truncate leading-none mt-px">{asset.category}</div>
                    )}
                  </div>

                  {/* Serial */}
                  <div className="font-mono text-[11px] text-slate-600 truncate">{asset.serial_number || '—'}</div>

                  {/* Value */}
                  <div className="font-mono text-[11.5px] font-medium text-[#12283c]">{formatRupiah(asset.value)}</div>

                  {/* Condition */}
                  <div><CondBadge condition={asset.condition} /></div>

                  {/* Location */}
                  <div className="text-[12px] text-slate-600 truncate">{asset.location || '—'}</div>

                  {/* Custodian */}
                  <div className="flex items-center gap-[7px]">
                    {initials && (
                      <div className="w-[22px] h-[22px] rounded-full bg-brand-soft text-brand flex items-center justify-content-center flex-shrink-0 flex items-center justify-center font-bold text-[9px]">
                        {initials}
                      </div>
                    )}
                    <span className="text-[11.5px] text-slate-600 truncate">{lastName || '—'}</span>
                  </div>

                  {/* History / actions */}
                  <div className="flex items-center justify-end gap-2">
                    {canEdit && (
                      <>
                        <button onClick={() => setEditData(asset)}
                          className="text-[10.5px] font-medium text-brand underline hover:text-brand-light transition-colors">
                          Edit
                        </button>
                        <button onClick={() => setDeleteId(asset.id)}
                          className="text-[10.5px] font-medium text-danger hover:text-red-700 transition-colors">
                          Del
                        </button>
                      </>
                    )}
                    {!canEdit && (
                      <span className="text-[10.5px] font-medium text-brand underline cursor-pointer hover:text-brand-light">History</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!isLoading && assets.length > 0 && (
          <div className="h-[36px] flex-none flex items-center justify-between px-[15px] border-t border-[#eceae4] bg-[#faf9f7]">
            <span className="text-[11px] text-[#8a8f98]">
              Showing {assets.length} of {total} · every movement is logged
            </span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
