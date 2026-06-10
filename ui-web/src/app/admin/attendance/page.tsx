'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Search, Download, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { attendanceService, adminUserService } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  hadir:        { label: 'Hadir',          bg: 'bg-emerald-50', text: 'text-emerald-600' },
  terlambat:    { label: 'Terlambat',      bg: 'bg-amber-50',   text: 'text-amber-600' },
  pulang_cepat: { label: 'Pulang Cepat',   bg: 'bg-orange-50',  text: 'text-orange-600' },
  dinas_luar:   { label: 'Dinas Luar',     bg: 'bg-blue-50',    text: 'text-blue-600' },
  cuti:         { label: 'Cuti',           bg: 'bg-violet-50',  text: 'text-violet-600' },
  wfh:          { label: 'WFH',            bg: 'bg-sky-50',     text: 'text-sky-600' },
  diluar_radius:{ label: 'Di Luar Radius', bg: 'bg-red-50',     text: 'text-red-600' },
};

const WORKMODE_LABEL: Record<string, string> = {
  wfo: 'WFO', wfh: 'WFH', dinas_luar: 'Dinas Luar', cuti: 'Cuti',
};

export default function AdminAttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo]     = useState(today);
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-all'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then(r => r.data.data || []),
  });
  const users = usersData || [];

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['attendance-report', from, to, userId],
    queryFn: () => attendanceService.report({ from, to, user_id: userId || undefined }).then(r => r.data.data),
    enabled: !!from && !!to,
  });

  const records = (reportData || []).filter((r: any) => {
    if (!search) return true;
    const u = users.find((u: any) => u.id === r.user_id);
    return u?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleDownloadFile = async (rec: any) => {
    try {
      const res = await attendanceService.downloadFile(rec.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = rec.file_name || 'surat';
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Gagal download file'); }
  };

  // Summary stats
  const summary = records.reduce((acc: any, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl flex items-center justify-center border border-emerald-100">
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Absensi</h1>
          <p className="text-sm text-slate-400 mt-0.5">Rekap kehadiran seluruh pegawai</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-5">
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dari</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sampai</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pegawai</label>
            <select value={userId} onChange={e => setUserId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#284074]/20">
              <option value="">Semua Pegawai</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama pegawai..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#284074]/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <div key={key} className={`rounded-2xl p-3 ${val.bg} border border-transparent`}>
              <div className={`text-2xl font-extrabold ${val.text}`}>{summary[key] || 0}</div>
              <div className={`text-xs font-semibold ${val.text} mt-0.5`}>{val.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Tidak ada data absensi</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Tanggal', 'Nama Pegawai', 'Mode', 'Jam Masuk', 'Jam Pulang', 'Status Masuk', 'Status Pulang', 'Jarak', 'Surat'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Group by user+date */}
              {Object.entries(
                records.reduce((acc: any, r: any) => {
                  const key = `${r.user_id}|${r.date?.slice(0,10)}`;
                  if (!acc[key]) acc[key] = { user_id: r.user_id, date: r.date, clock_in: null, clock_out: null };
                  if (r.type === 'clock_in') acc[key].clock_in = r;
                  else acc[key].clock_out = r;
                  return acc;
                }, {})
              ).map(([key, row]: any, i: number) => {
                const u = users.find((u: any) => u.id === row.user_id);
                const ci = row.clock_in;
                const co = row.clock_out;
                const scIn  = STATUS_CONFIG[ci?.status] || STATUS_CONFIG.hadir;
                const scOut = STATUS_CONFIG[co?.status];
                return (
                  <motion.tr key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-semibold text-slate-800">{u?.full_name || row.user_id.slice(0,8)}</div>
                      {u?.division && <div className="text-xs text-slate-400">{u.division}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-slate-600">{WORKMODE_LABEL[ci?.work_mode] || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono text-slate-700">{ci?.time?.slice(0,5) || '-'}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-slate-700">{co?.time?.slice(0,5) || '-'}</td>
                    <td className="px-4 py-3.5">
                      {ci && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scIn.bg} ${scIn.text}`}>{scIn.label}</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {co && scOut && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scOut.bg} ${scOut.text}`}>{scOut.label}</span>}
                      {!co && <span className="text-xs text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {ci?.distance_from_office != null ? `${ci.distance_from_office}m` : '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      {ci?.file_path && (
                        <button onClick={() => handleDownloadFile(ci)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#284074] hover:underline">
                          <Download className="w-3 h-3" /> Unduh
                        </button>
                      )}
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
