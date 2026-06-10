'use client';
import { Shield, Settings, Users, Database, Server, Activity, Globe, Lock, Bell, FileText } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';

const adminSections = [
  {
    title: 'User Management',
    desc: 'Kelola semua pengguna, role, dan akses sistem',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    items: ['Buat & edit user', 'Assign role', 'Nonaktifkan akun', 'Reset password'],
    action: '/admin/users',
    actionLabel: 'Kelola Users',
  },
  {
    title: 'System Configuration',
    desc: 'Konfigurasi parameter sistem dan service',
    icon: Settings,
    color: 'bg-purple-50 text-purple-600',
    items: ['API settings', 'Service config', 'Environment vars', 'Feature flags'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Database Management',
    desc: 'Monitor dan kelola database per service',
    icon: Database,
    color: 'bg-green-50 text-green-600',
    items: ['View tables', 'Run migrations', 'Backup data', 'Query explorer'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Service Monitor',
    desc: 'Health check dan monitoring semua microservices',
    icon: Server,
    color: 'bg-orange-50 text-orange-600',
    items: ['Service health', 'Queue monitor', 'Log viewer', 'Error tracking'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Notification Config',
    desc: 'Konfigurasi Telegram bot dan channel notifikasi',
    icon: Bell,
    color: 'bg-yellow-50 text-yellow-600',
    items: ['Bot token', 'Channel settings', 'Template pesan', 'Test notif'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Audit Logs',
    desc: 'Riwayat aktivitas sistem dan pengguna',
    icon: FileText,
    color: 'bg-red-50 text-red-600',
    items: ['Login history', 'Action logs', 'API access logs', 'Export report'],
    action: null,
    actionLabel: 'Coming Soon',
  },
];

const serviceStatus = [
  { name: 'svc-auth', port: 8001, status: 'healthy' },
  { name: 'svc-project', port: 8002, status: 'healthy' },
  { name: 'svc-workload', port: 8003, status: 'healthy' },
  { name: 'svc-notification', port: 8004, status: 'healthy' },
  { name: 'svc-reporting', port: 8005, status: 'healthy' },
  { name: 'svc-storage', port: 8006, status: 'healthy' },
];

export default function SuperAdminDashboard() {
  return (
    <AppLayout>
      <PageHeader
        title="Super Admin"
        subtitle="Kelola keseluruhan sistem Agrawork"
        icon={Shield}
      />

      {/* Service Status */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-slate-400" />
          <h3 className="font-display font-600 text-slate-800">Service Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {serviceStatus.map(s => (
            <div key={s.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-600">{s.name}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">:{s.port}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin sections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {adminSections.map((section, i) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="card-hover">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-600 text-slate-800">{section.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{section.desc}</p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {section.items.map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {item}
                </li>
              ))}
            </ul>
            {section.action ? (
              <a href={section.action} className="btn-primary w-full text-center text-sm block py-2">
                {section.actionLabel}
              </a>
            ) : (
              <div className="w-full text-center text-sm py-2 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed">
                {section.actionLabel}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
