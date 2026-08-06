'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Pencil,
  Trash2,
  X,
  Users,
  TrendingUp,
  ChevronDown,
  Download,
  Check,
  Loader2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { FilteredEmptyState } from '@/components/ui/EmptyState';
import { adminUserService, adminReportExportService, permissionService } from '@/lib/api';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const dict = {
  en: {
    roleAdministrator: 'Administrator',
    roleKepalaBalai: 'Kepala Balai',
    roleKepalaSeksi: 'Kepala Seksi',
    roleProjectManager: 'Project Manager',
    roleScrumMaster: 'Scrum Master',
    roleStaff: 'Staff',
    editUser: 'Edit User',
    addNewUser: 'Add New User',
    editingUser: 'Editing {name}',
    createNewUserAccount: 'Create a new user account',
    fullNameLabel: 'Full Name *',
    fullNamePlaceholder: 'Full name',
    emailLabel: 'Email *',
    passwordLabel: 'Password',
    passwordKeepUnchanged: '(leave empty to keep unchanged)',
    passwordPlaceholder: 'Minimum 8 characters',
    passwordRuleLength: 'At least 8 characters',
    passwordRuleLetter: 'Contains a letter',
    passwordRuleNumber: 'Contains a number',
    roleLabel: 'Role *',
    divisionLabel: 'Division',
    divisionPlaceholder: 'Teknologi',
    positionLabel: 'Position',
    positionPlaceholder: 'Software Engineer',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    createUser: 'Create User',
    userUpdated: 'User updated',
    userCreated: 'User created successfully',
    failed: 'Failed',
    completeRequiredFields: 'Please complete all required fields',
    changeRole: 'Change Role',
    roleUpdated: 'Role updated!',
    managePrivileges: 'Manage Privileges',
    permissionResetToDefault: 'Permission reset to default',
    permTogglesHint: 'Toggle untuk tambah/cabut privilege di luar role default',
    resetToDefault: 'Reset ke default',
    permProjectCreate: 'Create new projects',
    permProjectEdit: 'Edit projects',
    permProjectDelete: 'Delete projects',
    permProjectManageMembers: 'Add/remove project members',
    permSprintManage: 'Create, start, and complete sprints',
    permSprintView: 'View sprint details and backlog',
    permTaskCreate: 'Create new tasks',
    permTaskEditOwn: 'Edit own tasks',
    permTaskEditAll: 'Edit any task',
    permTaskAssign: 'Assign tasks to members',
    permTaskDelete: 'Delete tasks',
    permTaskLogTime: 'Log time on tasks',
    permCrSubmit: 'Submit Change Requests',
    permCrApprove: 'Approve/reject Change Requests',
    permCalendarView: 'View calendar',
    permCalendarCreateOwn: 'Create events for self',
    permCalendarManage: 'Create/edit events for all users',
    permUserManage: 'Manage users, roles, and privileges',
    permReportView: 'View analytics reports',
    permReportExport: 'Export reports to file',
    permAttendanceClock: 'Clock in/out attendance',
    permAttendanceViewOwn: 'View own attendance',
    permAttendanceViewAll: "View all employees' attendance",
    permAssetView: 'View asset list',
    permAssetManage: 'Add/edit/delete assets',
    permDocumentView: 'View documents',
    permDocumentManage: 'Add/edit/delete documents',
    permNotificationManage: 'Manage Telegram notification settings',
    defaultBadge: 'DEFAULT',
    extraBadge: '+EXTRA',
    revokedBadge: 'DICABUT',
    done: 'Selesai',
    editUserAction: 'Edit User',
    changeRoleAction: 'Change Role',
    managePrivilegesAction: 'Manage Privileges',
    deactivate: 'Deactivate',
    activate: 'Activate',
    exportPdf: 'Export PDF',
    manageUsers: 'Manage Users',
    usersRegistered: '{count} user{plural} registered',
    addUser: 'Add User',
    statTotalUsers: 'Total Users',
    statActive: 'Active',
    statInactiveSub: '{count} inactive',
    filterAll: 'All',
    searchByNameOrEmail: 'Search by name or email...',
    reset: 'Reset',
    usersCount: '{count} user',
    colUser: 'User',
    colEmail: 'Email',
    colDivisionPosition: 'Division / Position',
    colRole: 'Role',
    userDeactivated: 'User deactivated',
    userActivated: 'User activated',
    userDeleted: 'User deleted',
    deleteUserTitle: 'Delete User?',
    willBeDeleted: 'will be permanently deleted.',
    deleting: 'Deleting...',
    reportDownloaded: 'Report downloaded successfully',
    failedDownloadReport: 'Failed to download report',
  },
  id: {
    roleAdministrator: 'Administrator',
    roleKepalaBalai: 'Kepala Balai',
    roleKepalaSeksi: 'Kepala Seksi',
    roleProjectManager: 'Manajer Proyek',
    roleScrumMaster: 'Scrum Master',
    roleStaff: 'Staf',
    editUser: 'Ubah Pengguna',
    addNewUser: 'Tambah Pengguna Baru',
    editingUser: 'Mengubah {name}',
    createNewUserAccount: 'Buat akun pengguna baru',
    fullNameLabel: 'Nama Lengkap *',
    fullNamePlaceholder: 'Nama lengkap',
    emailLabel: 'Email *',
    passwordLabel: 'Kata Sandi',
    passwordKeepUnchanged: '(kosongkan jika tidak ingin diubah)',
    passwordPlaceholder: 'Minimal 8 karakter',
    passwordRuleLength: 'Minimal 8 karakter',
    passwordRuleLetter: 'Mengandung huruf',
    passwordRuleNumber: 'Mengandung angka',
    roleLabel: 'Peran *',
    divisionLabel: 'Divisi',
    divisionPlaceholder: 'Teknologi',
    positionLabel: 'Jabatan',
    positionPlaceholder: 'Software Engineer',
    saving: 'Menyimpan...',
    saveChanges: 'Simpan Perubahan',
    createUser: 'Buat Pengguna',
    userUpdated: 'Pengguna berhasil diperbarui',
    userCreated: 'Pengguna berhasil dibuat',
    failed: 'Gagal',
    completeRequiredFields: 'Harap lengkapi semua kolom wajib',
    changeRole: 'Ubah Peran',
    roleUpdated: 'Peran berhasil diperbarui!',
    managePrivileges: 'Kelola Privilege',
    permissionResetToDefault: 'Privilege berhasil direset ke default',
    permTogglesHint: 'Alihkan untuk menambah/mencabut privilege di luar peran default',
    resetToDefault: 'Reset ke default',
    permProjectCreate: 'Membuat proyek baru',
    permProjectEdit: 'Mengubah proyek',
    permProjectDelete: 'Menghapus proyek',
    permProjectManageMembers: 'Menambah/menghapus anggota proyek',
    permSprintManage: 'Membuat, memulai, dan menyelesaikan sprint',
    permSprintView: 'Melihat detail sprint dan backlog',
    permTaskCreate: 'Membuat tugas baru',
    permTaskEditOwn: 'Mengubah tugas sendiri',
    permTaskEditAll: 'Mengubah semua tugas',
    permTaskAssign: 'Menugaskan tugas ke anggota',
    permTaskDelete: 'Menghapus tugas',
    permTaskLogTime: 'Mencatat waktu pada tugas',
    permCrSubmit: 'Mengajukan Change Request',
    permCrApprove: 'Menyetujui/menolak Change Request',
    permCalendarView: 'Melihat kalender',
    permCalendarCreateOwn: 'Membuat acara untuk diri sendiri',
    permCalendarManage: 'Membuat/mengubah acara untuk semua pengguna',
    permUserManage: 'Mengelola pengguna, peran, dan privilege',
    permReportView: 'Melihat laporan analitik',
    permReportExport: 'Mengekspor laporan ke berkas',
    permAttendanceClock: 'Absen masuk/keluar',
    permAttendanceViewOwn: 'Melihat absensi sendiri',
    permAttendanceViewAll: 'Melihat absensi seluruh pegawai',
    permAssetView: 'Melihat daftar aset',
    permAssetManage: 'Menambah/mengubah/menghapus aset',
    permDocumentView: 'Melihat dokumen',
    permDocumentManage: 'Menambah/mengubah/menghapus dokumen',
    permNotificationManage: 'Mengelola pengaturan notifikasi Telegram',
    defaultBadge: 'DEFAULT',
    extraBadge: '+EKSTRA',
    revokedBadge: 'DICABUT',
    done: 'Selesai',
    editUserAction: 'Ubah Pengguna',
    changeRoleAction: 'Ubah Peran',
    managePrivilegesAction: 'Kelola Privilege',
    deactivate: 'Nonaktifkan',
    activate: 'Aktifkan',
    exportPdf: 'Ekspor PDF',
    manageUsers: 'Kelola Pengguna',
    usersRegistered: '{count} pengguna terdaftar',
    addUser: 'Tambah Pengguna',
    statTotalUsers: 'Total Pengguna',
    statActive: 'Aktif',
    statInactiveSub: '{count} tidak aktif',
    filterAll: 'Semua',
    searchByNameOrEmail: 'Cari berdasarkan nama atau email...',
    reset: 'Reset',
    usersCount: '{count} pengguna',
    colUser: 'Pengguna',
    colEmail: 'Email',
    colDivisionPosition: 'Divisi / Jabatan',
    colRole: 'Peran',
    userDeactivated: 'Pengguna dinonaktifkan',
    userActivated: 'Pengguna diaktifkan',
    userDeleted: 'Pengguna berhasil dihapus',
    deleteUserTitle: 'Hapus Pengguna?',
    willBeDeleted: 'akan dihapus secara permanen.',
    deleting: 'Menghapus...',
    reportDownloaded: 'Laporan berhasil diunduh',
    failedDownloadReport: 'Gagal mengunduh laporan',
  },
};

const ROLES = ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff', 'administrator'];

const ROLE_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  administrator: { color: 'text-danger-text', bg: 'bg-danger-soft', dot: 'bg-danger' },
  kepala_balai: { color: 'text-navy-700', bg: 'bg-navy-700/8', dot: 'bg-navy-700' },
  kepala_seksi: { color: 'text-info-text', bg: 'bg-info-soft', dot: 'bg-info' },
  project_manager: { color: 'text-azure-400', bg: 'bg-info-soft', dot: 'bg-azure-400' },
  scrum_master: { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  staff: { color: 'text-text-secondary', bg: 'bg-border-subtle', dot: 'bg-text-placeholder' },
};

const ROLE_LABEL_KEY: Record<string, string> = {
  administrator: 'roleAdministrator',
  kepala_balai: 'roleKepalaBalai',
  kepala_seksi: 'roleKepalaSeksi',
  project_manager: 'roleProjectManager',
  scrum_master: 'roleScrumMaster',
  staff: 'roleStaff',
};

function roleLabel(role: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  return ROLE_LABEL_KEY[role] ? t(ROLE_LABEL_KEY[role]) : role;
}

const GRADIENTS = [
  'from-navy-700 to-navy-700',
  'from-navy-700 to-navy-700',
  'from-success to-teal-600',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-info-text',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
function getGradient(name: string) {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-[6px] border border-border-subtle p-4">
      <div className="text-xs text-text-placeholder mb-1">{label}</div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-text-placeholder mt-0.5">{sub}</div>}
    </div>
  );
}

function UserFormModal({ open, onClose, editUser }: { open: boolean; onClose: () => void; editUser?: any }) {
  const qc = useQueryClient();
  const t = useT(dict);
  const isEdit = !!editUser;

  const [form, setForm] = useState({
    full_name: editUser?.full_name || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.roles?.[0] || 'staff',
    division: editUser?.division || '',
    position: editUser?.position || '',
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: any) => (isEdit ? adminUserService.update(editUser.id, data) : adminUserService.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success(isEdit ? t('userUpdated') : t('userCreated'));
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  const handleSubmit = () => {
    if (!form.full_name || !form.email || (!isEdit && !form.password)) {
      toast.error(t('completeRequiredFields'));
      return;
    }
    const payload: any = { ...form };
    if (isEdit && !payload.password) delete payload.password;
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-[6px] w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="font-bold text-navy-900">{isEdit ? t('editUser') : t('addNewUser')}</h2>
            <p className="text-xs text-text-placeholder mt-0.5">
              {isEdit ? t('editingUser', { name: editUser.full_name }) : t('createNewUserAccount')}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
            <X className="w-4 h-4 text-text-placeholder" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('fullNameLabel')}</label>
              <input
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder={t('fullNamePlaceholder')}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('emailLabel')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder="email@domain.com"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">
                {t('passwordLabel')}{' '}
                {isEdit && <span className="font-normal text-text-placeholder">{t('passwordKeepUnchanged')}</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder={isEdit ? '••••••••' : t('passwordPlaceholder')}
              />
              {form.password && (
                <div className="mt-2 space-y-1">
                  {[
                    { ok: form.password.length >= 8, label: t('passwordRuleLength') },
                    { ok: /[a-zA-Z]/.test(form.password), label: t('passwordRuleLetter') },
                    { ok: /[0-9]/.test(form.password), label: t('passwordRuleNumber') },
                  ].map((r, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-success-text' : 'text-text-placeholder'}`}>
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-success-soft' : 'bg-border-subtle'}`}
                      >
                        {r.ok ? <Check className="w-2.5 h-2.5" /> : <span className="w-1 h-1 rounded-full bg-text-placeholder" />}
                      </span>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('roleLabel')}</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all pr-8"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r, t)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('divisionLabel')}</label>
              <input
                value={form.division}
                onChange={(e) => set('division', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder={t('divisionPlaceholder')}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">{t('positionLabel')}</label>
              <input
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder={t('positionPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? t('saving') : isEdit ? t('saveChanges') : t('createUser')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RoleModal({ user, onClose }: { user: any; onClose: () => void }) {
  const qc = useQueryClient();
  const t = useT(dict);
  const mutation = useMutation({
    mutationFn: (role: string) => adminUserService.updateRole(user.id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success(t('roleUpdated'));
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-[6px] w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <h2 className="font-bold text-navy-900">{t('changeRole')}</h2>
            <p className="text-xs text-text-placeholder">{user.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
            <X className="w-4 h-4 text-text-placeholder" />
          </button>
        </div>
        <div className="p-4 space-y-1.5">
          {ROLES.map((role) => {
            const conf = ROLE_CONFIG[role];
            const isActive = user.roles?.includes(role);
            return (
              <motion.button
                key={role}
                whileTap={{ scale: 0.98 }}
                onClick={() => mutation.mutate(role)}
                disabled={mutation.isPending}
                className={`w-full flex items-center justify-between p-3.5 rounded-[6px] border text-sm transition-all ${
                  isActive ? `border-current ${conf.bg} ${conf.color}` : 'border-border hover:border-border-button hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${conf.dot}`} />
                  <span className={`font-semibold ${isActive ? conf.color : 'text-text-secondary'}`}>{roleLabel(role, t)}</span>
                </div>
                {isActive && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

const PERMISSION_LABEL_KEY: Record<string, string> = {
  'project.create': 'permProjectCreate',
  'project.edit': 'permProjectEdit',
  'project.delete': 'permProjectDelete',
  'project.manage_members': 'permProjectManageMembers',
  'sprint.manage': 'permSprintManage',
  'sprint.view': 'permSprintView',
  'task.create': 'permTaskCreate',
  'task.edit_own': 'permTaskEditOwn',
  'task.edit_all': 'permTaskEditAll',
  'task.assign': 'permTaskAssign',
  'task.delete': 'permTaskDelete',
  'task.log_time': 'permTaskLogTime',
  'cr.submit': 'permCrSubmit',
  'cr.approve': 'permCrApprove',
  'calendar.view': 'permCalendarView',
  'calendar.create_own': 'permCalendarCreateOwn',
  'calendar.manage': 'permCalendarManage',
  'user.manage': 'permUserManage',
  'report.view': 'permReportView',
  'report.export': 'permReportExport',
  'attendance.clock': 'permAttendanceClock',
  'attendance.view_own': 'permAttendanceViewOwn',
  'attendance.view_all': 'permAttendanceViewAll',
  'asset.view': 'permAssetView',
  'asset.manage': 'permAssetManage',
  'document.view': 'permDocumentView',
  'document.manage': 'permDocumentManage',
  'notification.manage': 'permNotificationManage',
};

function PermissionModal({ user, onClose }: any) {
  const qc = useQueryClient();
  const t = useT(dict);
  const { data: permData, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: () => permissionService.getUserPermissions(user.id).then((r) => r.data.data),
    enabled: !!user,
  });

  const setMutation = useMutation({
    mutationFn: ({ permission, granted }: any) => permissionService.setPermission(user.id, permission, granted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-permissions', user?.id] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  const resetMutation = useMutation({
    mutationFn: () => permissionService.resetPermissions(user.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-permissions', user?.id] });
      toast.success(t('permissionResetToDefault'));
    },
  });

  if (!user) return null;

  const effective: string[] = permData?.effective || [];
  const defaults: string[] = permData?.default || [];
  const extras = permData?.extra || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-bold text-navy-900">{t('managePrivileges')}</h2>
            <p className="text-sm text-text-placeholder mt-0.5">
              {user.full_name} · <span className="capitalize">{user.roles?.[0]?.replace('_', ' ')}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border-subtle rounded-[6px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-tertiary">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-text-placeholder">{t('permTogglesHint')}</p>
            <button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="text-xs font-semibold text-danger hover:underline disabled:opacity-50"
            >
              {t('resetToDefault')}
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
            </div>
          ) : (
            Object.entries(PERMISSION_LABEL_KEY).map(([key, labelKey]) => {
              const isDefault = defaults.includes(key);
              const isEffective = effective.includes(key);
              const extraEntry = extras.find((e: any) => e.permission === key);
              const isOverridden = !!extraEntry;

              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-[6px] border transition-colors ${
                    isEffective ? 'bg-success-soft/50 border-success-soft' : 'bg-surface-2 border-border-subtle'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-secondary">{t(labelKey)}</span>
                      {isDefault && !isOverridden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-border text-text-tertiary font-semibold">{t('defaultBadge')}</span>
                      )}
                      {isOverridden && extraEntry?.granted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success-text font-semibold">{t('extraBadge')}</span>
                      )}
                      {isOverridden && !extraEntry?.granted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-soft text-danger font-semibold">{t('revokedBadge')}</span>
                      )}
                    </div>
                    <span className="text-xs text-text-placeholder font-mono">{key}</span>
                  </div>
                  <button
                    onClick={() => setMutation.mutate({ permission: key, granted: !isEffective })}
                    disabled={setMutation.isPending}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      isEffective ? 'bg-success' : 'bg-border-button'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isEffective ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-[6px] bg-border-subtle text-text-secondary text-sm font-semibold hover:bg-border transition-colors"
          >
            {t('done')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ActionMenu({ user, position, menuRef, onEdit, onRole, onToggle, onDelete, onPermission, onClose }: any) {
  const t = useT(dict);
  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      style={{ position: 'fixed', top: position.top, left: position.left }}
      className="w-44 bg-white rounded-[6px] border border-border-subtle shadow-[0_8px_24px_rgba(13,43,72,0.16)] overflow-hidden z-50"
    >
      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" /> {t('editUserAction')}
      </button>
      <button
        onClick={() => {
          onRole();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
      >
        <Shield className="w-3.5 h-3.5" /> {t('changeRoleAction')}
      </button>
      <button
        onClick={() => {
          onPermission();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-700/8 transition-colors"
      >
        <Shield className="w-3.5 h-3.5" /> {t('managePrivilegesAction')}
      </button>
      <button
        onClick={() => {
          onToggle();
          onClose();
        }}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
          user.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-success-text hover:bg-success-soft'
        }`}
      >
        {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
        {user.is_active ? t('deactivate') : t('activate')}
      </button>
      <div className="h-px bg-border-subtle mx-2" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-text hover:bg-danger-soft transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
      </button>
    </motion.div>
  );
}

const ACTION_MENU_WIDTH = 176; // w-44

function UserRowActions({ user, openMenu, setOpenMenu, onEdit, onRole, onToggle, onDelete, onPermission }: any) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const isOpen = openMenu === user.id;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setOpenMenu]);

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: Math.max(8, rect.right - ACTION_MENU_WIDTH) });
    }
    setOpenMenu(isOpen ? null : user.id);
  };

  return (
    <div className="relative inline-block">
      <button ref={btnRef} onClick={handleToggle} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
        <MoreVertical className="w-4 h-4 text-text-placeholder" />
      </button>
      {isOpen &&
        position &&
        createPortal(
          <AnimatePresence>
            <ActionMenu
              user={user}
              position={position}
              menuRef={menuRef}
              onEdit={onEdit}
              onRole={onRole}
              onToggle={onToggle}
              onDelete={onDelete}
              onPermission={onPermission}
              onClose={() => setOpenMenu(null)}
            />
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const t = useT(dict);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminReportExportService.users();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'laporan_pengguna.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('reportDownloaded'));
    } catch {
      toast.error(t('failedDownloadReport'));
    } finally {
      setExporting(false);
    }
  };
  const [editUser, setEditUser] = useState<any>(null);
  const [roleUser, setRoleUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [permissionUser, setPermissionUser] = useState<any>(null);

  // Render permission modal
  const permissionModal = permissionUser ? <PermissionModal user={permissionUser} onClose={() => setPermissionUser(null)} /> : null;

  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminUserService.stats().then((r) => r.data.data),
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () =>
      adminUserService.list({ ...(search && { search }), ...(roleFilter && { role: roleFilter }), per_page: 50 }).then((r) => r.data),
  });

  const users = usersData?.data || [];

  const toggleStatus = useMutation({
    mutationFn: (u: any) => adminUserService.updateStatus(u.id, !u.is_active),
    onSuccess: (_, u) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success(u.is_active ? t('userDeactivated') : t('userActivated'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUserService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success(t('userDeleted'));
      setDeleteUser(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('failed')),
  });

  return (
    <AppLayout>
      {permissionModal}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-navy-700/10 to-navy-700/5 rounded-[6px] flex items-center justify-center border border-navy-700/10">
            <Users className="w-5 h-5 text-navy-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{t('manageUsers')}</h1>
            <p className="text-sm text-text-placeholder mt-0.5">
              {t('usersRegistered', { count: stats?.total_users || 0, plural: stats?.total_users !== 1 ? 's' : '' })}
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-40"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t('exportPdf')}
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> {t('addUser')}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label={t('statTotalUsers')} value={stats.total_users} color="text-navy-900" />
          <StatCard
            label={t('statActive')}
            value={stats.active_users}
            sub={t('statInactiveSub', { count: stats.inactive_users })}
            color="text-success-text"
          />
          {Object.entries(stats.by_role || {})
            .slice(0, 2)
            .map(([role, count]: any) => (
              <StatCard key={role} label={roleLabel(role, t)} value={count} color={ROLE_CONFIG[role]?.color || 'text-text-secondary'} />
            ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setRoleFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!roleFilter ? 'bg-navy-700 text-white' : 'bg-white border border-border text-text-tertiary hover:border-border-button'}`}
        >
          {t('filterAll')}
        </button>
        {ROLES.map((role) => {
          const conf = ROLE_CONFIG[role];
          const count = stats?.by_role?.[role] || 0;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role === roleFilter ? '' : role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === role
                  ? `${conf.bg} ${conf.color} border border-current`
                  : 'bg-white border border-border text-text-tertiary hover:border-border-button'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
              {roleLabel(role, t)} · {count}
            </button>
          );
        })}
      </div>

      <DataTable<any>
        loading={isLoading}
        rowKey={(u) => u.id}
        data={users}
        titleActions={
          <div className="w-full flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 h-[30px] rounded-[6px] border border-border-input text-[12px] text-text-secondary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all w-full"
                placeholder={t('searchByNameOrEmail')}
              />
            </div>
            {(search || roleFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                }}
                className="text-xs text-text-placeholder hover:text-text-secondary flex items-center gap-1 flex-none"
              >
                <X className="w-3.5 h-3.5" /> {t('reset')}
              </button>
            )}
            <span className="ml-auto font-mono text-[11px] text-text-muted flex-none">{t('usersCount', { count: users.length })}</span>
          </div>
        }
        emptyState={
          <FilteredEmptyState
            onClearFilters={() => {
              setSearch('');
              setRoleFilter('');
            }}
          />
        }
        columns={
          [
            {
              key: 'user',
              header: t('colUser'),
              width: 'minmax(0,2.2fr)',
              render: (u) => (
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-[6px] bg-gradient-to-br ${getGradient(u.full_name)} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
                  >
                    {getInitials(u.full_name)}
                  </div>
                  <span className="text-sm font-semibold text-navy-800">{u.full_name}</span>
                </div>
              ),
            },
            {
              key: 'email',
              header: t('colEmail'),
              width: 'minmax(0,1.6fr)',
              render: (u) => <span className="text-text-tertiary">{u.email}</span>,
            },
            {
              key: 'division',
              header: t('colDivisionPosition'),
              width: 'minmax(0,1.6fr)',
              render: (u) => (
                <div>
                  <div className="text-text-secondary">{u.division || '-'}</div>
                  {u.position && <div className="text-xs text-text-placeholder mt-0.5">{u.position}</div>}
                </div>
              ),
            },
            {
              key: 'role',
              header: t('colRole'),
              width: 'minmax(0,1.4fr)',
              render: (u) => (
                <div className="flex gap-1.5 flex-wrap">
                  {u.roles?.map((r: string) => {
                    const conf = ROLE_CONFIG[r] || ROLE_CONFIG.staff;
                    return (
                      <span
                        key={r}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${conf.bg} ${conf.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                        {roleLabel(r, t)}
                      </span>
                    );
                  })}
                </div>
              ),
            },
            {
              key: 'status',
              header: t('common.status'),
              width: '110px',
              render: (u) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                  {u.is_active ? t('common.active') : t('common.inactive')}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              width: '40px',
              align: 'right',
              shrink: true,
              render: (u) => (
                <UserRowActions
                  user={u}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                  onEdit={() => setEditUser(u)}
                  onRole={() => setRoleUser(u)}
                  onToggle={() => toggleStatus.mutate(u)}
                  onDelete={() => setDeleteUser(u)}
                  onPermission={() => setPermissionUser(u)}
                />
              ),
            },
          ] as DataTableColumn<any>[]
        }
      />

      <AnimatePresence>
        {(showCreate || editUser) && (
          <UserFormModal
            open={true}
            onClose={() => {
              setShowCreate(false);
              setEditUser(null);
            }}
            editUser={editUser}
          />
        )}
        {roleUser && <RoleModal user={roleUser} onClose={() => setRoleUser(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {deleteUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-[6px] w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <h3 className="font-bold text-navy-900 mb-1">{t('deleteUserTitle')}</h3>
              <p className="text-sm text-text-tertiary mb-5">
                <span className="font-semibold text-text-secondary">{deleteUser.full_name}</span> {t('willBeDeleted')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteUser.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[6px] bg-danger text-white text-sm font-semibold hover:bg-danger-text disabled:opacity-50"
                >
                  {deleteMutation.isPending ? t('deleting') : t('common.delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
