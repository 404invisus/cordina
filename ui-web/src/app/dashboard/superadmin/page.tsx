'use client';
import { Shield, Settings, Users, Database, Server, Activity, Globe, Lock, Bell, FileText } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';

const dict = {
  en: {
    pageTitle: 'Super Admin',
    pageSubtitle: 'Manage the entire ConnectOne system',
    serviceStatus: 'Service Status',
    comingSoon: 'Coming Soon',
    manageUsers: 'Manage Users',
    section1Title: 'User Management',
    section1Desc: 'Manage all users, roles, and system access',
    section1Item1: 'Create & edit users',
    section1Item2: 'Assign roles',
    section1Item3: 'Deactivate accounts',
    section1Item4: 'Reset passwords',
    section2Title: 'System Configuration',
    section2Desc: 'Configure system parameters and services',
    section2Item1: 'API settings',
    section2Item2: 'Service config',
    section2Item3: 'Environment vars',
    section2Item4: 'Feature flags',
    section3Title: 'Database Management',
    section3Desc: 'Monitor and manage databases per service',
    section3Item1: 'View tables',
    section3Item2: 'Run migrations',
    section3Item3: 'Backup data',
    section3Item4: 'Query explorer',
    section4Title: 'Service Monitor',
    section4Desc: 'Health checks and monitoring for all microservices',
    section4Item1: 'Service health',
    section4Item2: 'Queue monitor',
    section4Item3: 'Log viewer',
    section4Item4: 'Error tracking',
    section5Title: 'Notification Config',
    section5Desc: 'Configure Telegram bot and notification channels',
    section5Item1: 'Bot token',
    section5Item2: 'Channel settings',
    section5Item3: 'Message templates',
    section5Item4: 'Test notifications',
    section6Title: 'Audit Logs',
    section6Desc: 'History of system and user activity',
    section6Item1: 'Login history',
    section6Item2: 'Action logs',
    section6Item3: 'API access logs',
    section6Item4: 'Export report',
  },
  id: {
    pageTitle: 'Admin Utama',
    pageSubtitle: 'Kelola seluruh sistem ConnectOne',
    serviceStatus: 'Status Layanan',
    comingSoon: 'Segera Hadir',
    manageUsers: 'Kelola Pengguna',
    section1Title: 'Manajemen Pengguna',
    section1Desc: 'Kelola semua pengguna, peran, dan akses sistem',
    section1Item1: 'Buat & ubah pengguna',
    section1Item2: 'Tetapkan peran',
    section1Item3: 'Nonaktifkan akun',
    section1Item4: 'Atur ulang kata sandi',
    section2Title: 'Konfigurasi Sistem',
    section2Desc: 'Konfigurasi parameter dan layanan sistem',
    section2Item1: 'Pengaturan API',
    section2Item2: 'Konfigurasi layanan',
    section2Item3: 'Variabel lingkungan',
    section2Item4: 'Feature flags',
    section3Title: 'Manajemen Basis Data',
    section3Desc: 'Pantau dan kelola basis data per layanan',
    section3Item1: 'Lihat tabel',
    section3Item2: 'Jalankan migrasi',
    section3Item3: 'Cadangkan data',
    section3Item4: 'Penjelajah kueri',
    section4Title: 'Pemantau Layanan',
    section4Desc: 'Pemeriksaan kesehatan dan pemantauan seluruh microservice',
    section4Item1: 'Kesehatan layanan',
    section4Item2: 'Pemantau antrean',
    section4Item3: 'Penampil log',
    section4Item4: 'Pelacakan galat',
    section5Title: 'Konfigurasi Notifikasi',
    section5Desc: 'Konfigurasi bot Telegram dan kanal notifikasi',
    section5Item1: 'Token bot',
    section5Item2: 'Pengaturan kanal',
    section5Item3: 'Templat pesan',
    section5Item4: 'Uji notifikasi',
    section6Title: 'Log Audit',
    section6Desc: 'Riwayat aktivitas sistem dan pengguna',
    section6Item1: 'Riwayat masuk',
    section6Item2: 'Log tindakan',
    section6Item3: 'Log akses API',
    section6Item4: 'Ekspor laporan',
  },
};

const serviceStatus = [
  { name: 'svc-auth', port: 8001, status: 'healthy' },
  { name: 'svc-project', port: 8002, status: 'healthy' },
  { name: 'svc-workload', port: 8003, status: 'healthy' },
  { name: 'svc-notification', port: 8004, status: 'healthy' },
  { name: 'svc-reporting', port: 8005, status: 'healthy' },
  { name: 'svc-storage', port: 8006, status: 'healthy' },
];

export default function SuperAdminDashboard() {
  const t = useT(dict);

  const adminSections = [
    {
      title: t('section1Title'),
      desc: t('section1Desc'),
      icon: Users,
      color: 'bg-info-soft text-info-text',
      items: [t('section1Item1'), t('section1Item2'), t('section1Item3'), t('section1Item4')],
      action: '/admin/users',
      actionLabel: t('manageUsers'),
    },
    {
      title: t('section2Title'),
      desc: t('section2Desc'),
      icon: Settings,
      color: 'bg-navy-700/8 text-navy-700',
      items: [t('section2Item1'), t('section2Item2'), t('section2Item3'), t('section2Item4')],
      action: null,
      actionLabel: t('comingSoon'),
    },
    {
      title: t('section3Title'),
      desc: t('section3Desc'),
      icon: Database,
      color: 'bg-success-soft text-success-text',
      items: [t('section3Item1'), t('section3Item2'), t('section3Item3'), t('section3Item4')],
      action: null,
      actionLabel: t('comingSoon'),
    },
    {
      title: t('section4Title'),
      desc: t('section4Desc'),
      icon: Server,
      color: 'bg-orange-50 text-orange-600',
      items: [t('section4Item1'), t('section4Item2'), t('section4Item3'), t('section4Item4')],
      action: null,
      actionLabel: t('comingSoon'),
    },
    {
      title: t('section5Title'),
      desc: t('section5Desc'),
      icon: Bell,
      color: 'bg-yellow-50 text-yellow-600',
      items: [t('section5Item1'), t('section5Item2'), t('section5Item3'), t('section5Item4')],
      action: null,
      actionLabel: t('comingSoon'),
    },
    {
      title: t('section6Title'),
      desc: t('section6Desc'),
      icon: FileText,
      color: 'bg-danger-soft text-danger-text',
      items: [t('section6Item1'), t('section6Item2'), t('section6Item3'), t('section6Item4')],
      action: null,
      actionLabel: t('comingSoon'),
    },
  ];

  return (
    <AppLayout>
      <PageHeader section="ADMIN" title={t('pageTitle')} subtitle={t('pageSubtitle')} icon={Shield} />

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-text-placeholder" />
          <h3 className="font-display font-600 text-navy-800">{t('serviceStatus')}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {serviceStatus.map((s) => (
            <div key={s.name} className="p-3 rounded-[6px] bg-surface-2 border border-border-subtle text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-text-secondary">{s.name}</span>
              </div>
              <div className="text-xs text-text-placeholder font-mono">:{s.port}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {adminSections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-hover"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center ${section.color}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-600 text-navy-800">{section.title}</h3>
                <p className="text-xs text-text-placeholder mt-0.5">{section.desc}</p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {section.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-text-tertiary">
                  <div className="w-1.5 h-1.5 rounded-full bg-border-button" />
                  {item}
                </li>
              ))}
            </ul>
            {section.action ? (
              <a href={section.action} className="btn-primary w-full text-center text-sm block py-2">
                {section.actionLabel}
              </a>
            ) : (
              <div className="w-full text-center text-sm py-2 rounded-lg bg-border-subtle text-text-placeholder cursor-not-allowed">
                {section.actionLabel}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
