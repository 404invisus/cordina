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

const ROLES = ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff', 'administrator'];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  administrator: { label: 'Administrator', color: 'text-danger-text', bg: 'bg-danger-soft', dot: 'bg-danger' },
  kepala_balai: { label: 'Kepala Balai', color: 'text-navy-700', bg: 'bg-navy-700/8', dot: 'bg-navy-700' },
  kepala_seksi: { label: 'Kepala Seksi', color: 'text-info-text', bg: 'bg-info-soft', dot: 'bg-info' },
  project_manager: { label: 'Project Manager', color: 'text-azure-400', bg: 'bg-info-soft', dot: 'bg-azure-400' },
  scrum_master: { label: 'Scrum Master', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  staff: { label: 'Staff', color: 'text-text-secondary', bg: 'bg-border-subtle', dot: 'bg-text-placeholder' },
};

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
      toast.success(isEdit ? 'User updated' : 'User created successfully');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const handleSubmit = () => {
    if (!form.full_name || !form.email || (!isEdit && !form.password)) {
      toast.error('Please complete all required fields');
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
            <h2 className="font-bold text-navy-900">{isEdit ? 'Edit User' : 'Add New User'}</h2>
            <p className="text-xs text-text-placeholder mt-0.5">{isEdit ? `Editing ${editUser.full_name}` : 'Create a new user account'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors">
            <X className="w-4 h-4 text-text-placeholder" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">Full Name *</label>
              <input
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder="Full name"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">Email *</label>
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
                Password {isEdit && <span className="font-normal text-text-placeholder">(leave empty to keep unchanged)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder={isEdit ? '••••••••' : 'Minimum 8 characters'}
              />
              {form.password && (
                <div className="mt-2 space-y-1">
                  {[
                    { ok: form.password.length >= 8, label: 'At least 8 characters' },
                    { ok: /[a-zA-Z]/.test(form.password), label: 'Contains a letter' },
                    { ok: /[0-9]/.test(form.password), label: 'Contains a number' },
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
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">Role *</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all pr-8"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r]?.label || r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">Division</label>
              <input
                value={form.division}
                onChange={(e) => set('division', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder="Teknologi"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-tertiary mb-1.5 block">Position</label>
              <input
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-all"
                placeholder="Software Engineer"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RoleModal({ user, onClose }: { user: any; onClose: () => void }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (role: string) => adminUserService.updateRole(user.id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Role updated!');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
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
            <h2 className="font-bold text-navy-900">Change Role</h2>
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
                  <span className={`font-semibold ${isActive ? conf.color : 'text-text-secondary'}`}>{conf.label}</span>
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

function PermissionModal({ user, onClose }: any) {
  const qc = useQueryClient();
  const { data: permData, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: () => permissionService.getUserPermissions(user.id).then((r) => r.data.data),
    enabled: !!user,
  });

  const setMutation = useMutation({
    mutationFn: ({ permission, granted }: any) => permissionService.setPermission(user.id, permission, granted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-permissions', user?.id] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const resetMutation = useMutation({
    mutationFn: () => permissionService.resetPermissions(user.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-permissions', user?.id] });
      toast.success('Permission reset to default');
    },
  });

  if (!user) return null;

  const effective: string[] = permData?.effective || [];
  const defaults: string[] = permData?.default || [];
  const extras = permData?.extra || [];

  const ALL_PERMISSIONS: Record<string, string> = {
    'project.create': 'Create new projects',
    'project.edit': 'Edit projects',
    'project.delete': 'Delete projects',
    'project.manage_members': 'Add/remove project members',
    'sprint.manage': 'Create, start, and complete sprints',
    'sprint.view': 'View sprint details and backlog',
    'task.create': 'Create new tasks',
    'task.edit_own': 'Edit own tasks',
    'task.edit_all': 'Edit any task',
    'task.assign': 'Assign tasks to members',
    'task.delete': 'Delete tasks',
    'task.log_time': 'Log time on tasks',
    'cr.submit': 'Submit Change Requests',
    'cr.approve': 'Approve/reject Change Requests',
    'calendar.view': 'View calendar',
    'calendar.create_own': 'Create events for self',
    'calendar.manage': 'Create/edit events for all users',
    'user.manage': 'Manage users, roles, and privileges',
    'report.view': 'View analytics reports',
    'report.export': 'Export reports to file',
    'attendance.clock': 'Clock in/out attendance',
    'attendance.view_own': 'View own attendance',
    'attendance.view_all': "View all employees' attendance",
    'asset.view': 'View asset list',
    'asset.manage': 'Add/edit/delete assets',
    'document.view': 'View documents',
    'document.manage': 'Add/edit/delete documents',
    'notification.manage': 'Manage Telegram notification settings',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Manage Privileges</h2>
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
            <p className="text-xs text-text-placeholder">Toggle untuk tambah/cabut privilege di luar role default</p>
            <button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="text-xs font-semibold text-danger hover:underline disabled:opacity-50"
            >
              Reset ke default
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
            </div>
          ) : (
            Object.entries(ALL_PERMISSIONS).map(([key, label]) => {
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
                      <span className="text-sm font-semibold text-text-secondary">{label}</span>
                      {isDefault && !isOverridden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-border text-text-tertiary font-semibold">DEFAULT</span>
                      )}
                      {isOverridden && extraEntry?.granted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success-text font-semibold">+EXTRA</span>
                      )}
                      {isOverridden && !extraEntry?.granted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-soft text-danger font-semibold">DICABUT</span>
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
            Selesai
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ActionMenu({ user, position, menuRef, onEdit, onRole, onToggle, onDelete, onPermission, onClose }: any) {
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
        <Pencil className="w-3.5 h-3.5" /> Edit User
      </button>
      <button
        onClick={() => {
          onRole();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
      >
        <Shield className="w-3.5 h-3.5" /> Change Role
      </button>
      <button
        onClick={() => {
          onPermission();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-700/8 transition-colors"
      >
        <Shield className="w-3.5 h-3.5" /> Manage Privileges
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
        {user.is_active ? 'Deactivate' : 'Activate'}
      </button>
      <div className="h-px bg-border-subtle mx-2" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-text hover:bg-danger-soft transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
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
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Failed to download report');
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
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUserService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('User deleted');
      setDeleteUser(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
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
            <h1 className="text-2xl font-bold text-navy-900">Manage Users</h1>
            <p className="text-sm text-text-placeholder mt-0.5">
              {stats?.total_users || 0} user{stats?.total_users !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-40"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Users" value={stats.total_users} color="text-navy-900" />
          <StatCard label="Active" value={stats.active_users} sub={`${stats.inactive_users} inactive`} color="text-success-text" />
          {Object.entries(stats.by_role || {})
            .slice(0, 2)
            .map(([role, count]: any) => (
              <StatCard
                key={role}
                label={ROLE_CONFIG[role]?.label || role}
                value={count}
                color={ROLE_CONFIG[role]?.color || 'text-text-secondary'}
              />
            ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setRoleFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!roleFilter ? 'bg-navy-700 text-white' : 'bg-white border border-border text-text-tertiary hover:border-border-button'}`}
        >
          All
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
              {conf.label} · {count}
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
                placeholder="Search by name or email..."
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
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
            <span className="ml-auto font-mono text-[11px] text-text-muted flex-none">{users.length} user</span>
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
              header: 'User',
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
              header: 'Email',
              width: 'minmax(0,1.6fr)',
              render: (u) => <span className="text-text-tertiary">{u.email}</span>,
            },
            {
              key: 'division',
              header: 'Division / Position',
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
              header: 'Role',
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
                        {conf.label}
                      </span>
                    );
                  })}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              width: '110px',
              render: (u) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                  {u.is_active ? 'Active' : 'Inactive'}
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
              <h3 className="font-bold text-navy-900 mb-1">Delete User?</h3>
              <p className="text-sm text-text-tertiary mb-5">
                <span className="font-semibold text-text-secondary">{deleteUser.full_name}</span> will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteUser.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[6px] bg-danger text-white text-sm font-semibold hover:bg-danger-text disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
