'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity,
  LogIn,
  LogOut,
  FileText,
  PenLine,
  Upload,
  Package,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminActivityService, adminUserService } from '@/lib/api';
import { formatDateTime as formatDate } from '@/lib/format';

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  login: { label: 'Login', icon: LogIn, color: 'text-success-text bg-success-soft' },
  logout: { label: 'Logout', icon: LogOut, color: 'text-text-secondary bg-border-subtle' },
  login_failed: { label: 'Login Failed', icon: AlertCircle, color: 'text-danger-text bg-danger-soft' },
  'cr.created': { label: 'Create CR', icon: FileText, color: 'text-info-text bg-info-soft' },
  'cr.signed': { label: 'Sign CR', icon: PenLine, color: 'text-navy-700 bg-navy-700/8' },
  'tte.signed': { label: 'e-Sign Document', icon: PenLine, color: 'text-navy-700 bg-navy-700/8' },
  'document.uploaded': { label: 'Upload Document', icon: Upload, color: 'text-amber-600 bg-amber-50' },
  'asset.created': { label: 'Add Asset', icon: Package, color: 'text-teal-600 bg-teal-50' },
};

export default function AdminActivityPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity', search, action, from, to, userId],
    queryFn: () =>
      adminActivityService
        .list({
          ...(search ? { search } : {}),
          ...(action ? { action } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(userId ? { user_id: userId } : {}),
        })
        .then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-activity'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then((r) => r.data.data?.data || r.data.data || []),
    staleTime: 60000,
  });

  const logs = data?.data || [];

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-text-tertiary/10 to-text-tertiary/5 rounded-[6px] flex items-center justify-center border border-border">
            <Activity className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Activity Log</h1>
            <p className="text-sm text-text-placeholder mt-0.5">User login and activity history</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[6px] border border-border-subtle p-4 mb-5 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-[6px] border border-border bg-surface-2">
            <Search className="w-4 h-4 text-text-placeholder" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-text-secondary placeholder:text-text-placeholder"
              placeholder="Search by name, email, or description..."
            />
          </div>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-3 py-2 rounded-[6px] border border-border text-sm text-text-secondary bg-white focus:outline-none focus:ring-2 focus:ring-border"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="px-3 py-2 rounded-[6px] border border-border text-sm text-text-secondary bg-white focus:outline-none focus:ring-2 focus:ring-border"
          >
            <option value="">All Users</option>
            {(usersData || []).map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-placeholder uppercase tracking-wider">Period:</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-1.5 rounded-[6px] border border-border text-sm text-text-secondary focus:outline-none"
          />
          <span className="text-xs text-text-placeholder">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-1.5 rounded-[6px] border border-border text-sm text-text-secondary focus:outline-none"
          />
          {(from || to || action || userId || search) && (
            <button
              onClick={() => {
                setFrom('');
                setTo('');
                setAction('');
                setUserId('');
                setSearch('');
              }}
              className="px-3 py-1.5 rounded-[6px] border border-border text-xs font-semibold text-text-tertiary hover:bg-surface-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Activity', value: data?.total || 0, color: 'text-text-secondary' },
          {
            label: 'Logins Today',
            value: logs.filter((l: any) => l.action === 'login' && new Date(l.created_at).toDateString() === new Date().toDateString())
              .length,
            color: 'text-success-text',
          },
          { label: 'Failed Logins', value: logs.filter((l: any) => l.action === 'login_failed').length, color: 'text-danger-text' },
          {
            label: 'Documents Signed',
            value: logs.filter((l: any) => ['cr.signed', 'tte.signed'].includes(l.action)).length,
            color: 'text-navy-700',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[6px] border border-border-subtle p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-text-placeholder mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-border border-t-text-secondary rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-text-placeholder text-sm">No activity yet</div>
      ) : (
        <div className="bg-white rounded-[6px] border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-2/50">
                {['Time', 'User', 'Action', 'Description', 'IP', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-placeholder uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => {
                const conf = ACTION_CONFIG[log.action] || {
                  label: log.action,
                  icon: Activity,
                  color: 'text-text-secondary bg-border-subtle',
                };
                const Icon = conf.icon;
                return (
                  <motion.tr key={log.id} layout className="border-b border-surface-2 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-text-tertiary whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-navy-800">{log.full_name || '-'}</div>
                      <div className="text-xs text-text-placeholder">{log.email || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${conf.color}`}>
                        <Icon className="w-3 h-3" />
                        {conf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{log.description}</td>
                    <td className="px-4 py-3 text-xs text-text-placeholder font-mono">{log.ip_address || '-'}</td>
                    <td className="px-4 py-3">
                      {log.success ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-danger" />}
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
