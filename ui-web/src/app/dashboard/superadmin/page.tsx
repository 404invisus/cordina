'use client';
import { Shield, Settings, Users, Database, Server, Activity, Globe, Lock, Bell, FileText } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';

const adminSections = [
  {
    title: 'User Management',
    desc: 'Manage all users, roles, and system access',
    icon: Users,
    color: 'bg-info-soft text-info-text',
    items: ['Create & edit users', 'Assign roles', 'Deactivate accounts', 'Reset passwords'],
    action: '/admin/users',
    actionLabel: 'Manage Users',
  },
  {
    title: 'System Configuration',
    desc: 'Configure system parameters and services',
    icon: Settings,
    color: 'bg-navy-700/8 text-navy-700',
    items: ['API settings', 'Service config', 'Environment vars', 'Feature flags'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Database Management',
    desc: 'Monitor and manage databases per service',
    icon: Database,
    color: 'bg-success-soft text-success-text',
    items: ['View tables', 'Run migrations', 'Backup data', 'Query explorer'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Service Monitor',
    desc: 'Health checks and monitoring for all microservices',
    icon: Server,
    color: 'bg-orange-50 text-orange-600',
    items: ['Service health', 'Queue monitor', 'Log viewer', 'Error tracking'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Notification Config',
    desc: 'Configure Telegram bot and notification channels',
    icon: Bell,
    color: 'bg-yellow-50 text-yellow-600',
    items: ['Bot token', 'Channel settings', 'Message templates', 'Test notifications'],
    action: null,
    actionLabel: 'Coming Soon',
  },
  {
    title: 'Audit Logs',
    desc: 'History of system and user activity',
    icon: FileText,
    color: 'bg-danger-soft text-danger-text',
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
      <PageHeader section="ADMIN" title="Super Admin" subtitle="Manage the entire ConnectOne system" icon={Shield} />

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-text-placeholder" />
          <h3 className="font-display font-600 text-navy-800">Service Status</h3>
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
