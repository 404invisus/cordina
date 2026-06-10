'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Archive, Plus, X, Search, Filter } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { assetService, userService } from '@/lib/api';
import toast from 'react-hot-toast';

const CONDITION_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  baik:         { label: 'Baik',         bg: 'bg-emerald-50', text: 'text-emerald-600' },
  rusak_ringan: { label: 'Rusak Ringan', bg: 'bg-amber-50',   text: 'text-amber-600' },
  rusak_berat:  { label: 'Rusak Berat',  bg: 'bg-red-50',     text: 'text-red-600' },
};

function formatRupiah(val: any) {
  if (!val) return '-';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function AssetModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name:                editData?.name                || '',
    category:            editData?.category            || '',
    serial_number:       editData?.serial_number       || '',
    condition:           editData?.condition           || 'baik',
    location:            editData?.location            || '',
    acquired_at:         editData?.acquired_at?.slice(0,10) || '',
    value:               editData?.value               || '',
    notes:               editData?.notes               || '',
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.list().then(r => r.data.data?.data || r.data.data || []),
  });
  const users = usersData || [];

  const mutation = useMutation({
    mutationFn: (data: any) => editData ? assetService.update(editData.id, data) : assetService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success(editData ? 'Aset diperbarui' : 'Aset ditambahkan'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Aset' : 'Tambah Aset'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Aset *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Laptop Dell XPS 15"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
              <option value="">Pilih kategori...</option>
              <option value="Perangkat Keras">Perangkat Keras</option>
              <option value="Perangkat Lunak">Perangkat Lunak</option>
              <option value="Furnitur">Furnitur</option>
              <option value="Kendaraan">Kendaraan</option>
              <option value="Jaringan">Jaringan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          {[
            { key: 'serial_number', label: 'Nomor Seri',        type: 'text',   placeholder: 'SN-2024-001' },
            { key: 'location',      label: 'Lokasi',             type: 'text',   placeholder: 'Ruang Server' },
            { key: 'acquired_at',   label: 'Tanggal Perolehan',  type: 'date',   placeholder: '' },
            { key: 'value',         label: 'Nilai (Rp)',         type: 'number', placeholder: '25000000' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074]" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kondisi</label>
            <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="rusak_berat">Rusak Berat</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penanggung Jawab</label>
            <select value={form.responsible_user_id} onChange={e => setForm(f => ({ ...f, responsible_user_id: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
              <option value="">Pilih penanggung jawab...</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.full_name} {u.division ? `(${u.division})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.category}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AssetsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, filterCondition],
    queryFn: () => assetService.list({ search: search || undefined, condition: filterCondition || undefined }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Aset dihapus'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const assets = data?.data || [];

  return (
    <AppLayout>
      <AssetModal open={createOpen || !!editData} onClose={() => { setCreateOpen(false); setEditData(null); }} editData={editData} />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl flex items-center justify-center border border-amber-100">
            <Archive className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Aset & Dokumen</h1>
            <p className="text-sm text-slate-400 mt-0.5">Pencatatan aset fisik organisasi</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Aset
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama aset..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
        </div>
        <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
          <option value="">Semua Kondisi</option>
          <option value="baik">Baik</option>
          <option value="rusak_ringan">Rusak Ringan</option>
          <option value="rusak_berat">Rusak Berat</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Archive className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Belum ada aset tercatat</p>
          <button onClick={() => setCreateOpen(true)} className="mt-3 text-sm text-[#284074] font-semibold hover:underline">Tambah sekarang</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Nama Aset', 'Kategori', 'No. Seri', 'Kondisi', 'Lokasi', 'Nilai', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset: any, i: number) => {
                const cond = CONDITION_CONFIG[asset.condition] || CONDITION_CONFIG.baik;
                return (
                  <motion.tr key={asset.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 text-sm">{asset.name}</div>
                      {asset.notes && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{asset.notes}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{asset.category}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-slate-500">{asset.serial_number || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cond.bg} ${cond.text}`}>{cond.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{asset.location || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{formatRupiah(asset.value)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => setEditData(asset)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => deleteMutation.mutate(asset.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
