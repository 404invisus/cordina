'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, LogIn, LogOut, FileText, PenLine, Upload, Package, AlertCircle, Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminActivityService, adminUserService } from '@/lib/api';

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  login:             { label: 'Login',              icon: LogIn,       color: 'text-emerald-600 bg-emerald-50' },
  logout:            { label: 'Logout',             icon: LogOut,      color: 'text-slate-600 bg-slate-100' },
  login_failed:      { label: 'Login Gagal',        icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  'cr.created':      { label: 'Buat CR',            icon: FileText,    color: 'text-blue-600 bg-blue-50' },
  'cr.signed':       { label: 'Tanda Tangan CR',    icon: PenLine,     color: 'text-violet-600 bg-violet-50' },
  'tte.signed':      { label: 'TTE Dokumen',        icon: PenLine,     color: 'text-purple-600 bg-purple-50' },
  'document.uploaded':{ label: 'Upload Dokumen',    icon: Upload,      color: 'text-amber-600 bg-amber-50' },
  'asset.created':   { label: 'Tambah Aset',        icon: Package,     color: 'text-teal-600 bg-teal-50' },
};

export default function AdminActivityPage() {
  const [search, setSearch]     = useState('');
  const [action, setAction]     = useState('');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [userId, setUserId]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity', search, action, from, to, userId],
    queryFn: () => adminActivityService.list({
      ...(search ? { search } : {}),
      ...(action ? { action } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(userId ? { user_id: userId } : {}),
    }).then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-activity'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then(r => r.data.data?.data || r.data.data || []),
    staleTime: 60000,
  });

  const logs = data?.data || [];

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-slate-500/10 to-slate-500/5 rounded-2xl flex items-center justify-center border border-slate-200">
            <Activity className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Riwayat Aktivitas</h1>
            <p className="text-sm text-slate-400 mt-0.5">Log login dan aktivitas pengguna</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
              placeholder="Cari nama, email, atau deskripsi..." />
          </div>
          <select value={action} onChange={e => setAction(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200">
            <option value="">Semua Aksi</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select value={userId} onChange={e => setUserId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200">
            <option value="">Semua Pengguna</option>
            {(usersData || []).map((u: any) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Periode:</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none" />
          <span className="text-xs text-slate-400">s/d</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none" />
          {(from || to || action || userId || search) && (
            <button onClick={() => { setFrom(''); setTo(''); setAction(''); setUserId(''); setSearch(''); }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50">
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Aktivitas', value: data?.total || 0, color: 'text-slate-700' },
          { label: 'Login Hari Ini', value: logs.filter((l: any) => l.action === 'login' && new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: 'text-emerald-600' },
          { label: 'Login Gagal', value: logs.filter((l: any) => l.action === 'login_failed').length, color: 'text-red-600' },
          { label: 'Dokumen Ditanda', value: logs.filter((l: any) => ['cr.signed','tte.signed'].includes(l.action)).length, color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">Belum ada aktivitas</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Waktu', 'Pengguna', 'Aksi', 'Deskripsi', 'IP', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => {
                const conf = ACTION_CONFIG[log.action] || { label: log.action, icon: Activity, color: 'text-slate-600 bg-slate-100' };
                const Icon = conf.icon;
                return (
                  <motion.tr key={log.id} layout className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-800">{log.full_name || '-'}</div>
                      <div className="text-xs text-slate-400">{log.email || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${conf.color}`}>
                        <Icon className="w-3 h-3" />{conf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{log.description}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.ip_address || '-'}</td>
                    <td className="px-4 py-3">
                      {log.success
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-red-500" />}
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
