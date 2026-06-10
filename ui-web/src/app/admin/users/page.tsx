'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MoreVertical, UserCheck, UserX, Shield,
  Pencil, Trash2, X, Users, TrendingUp, ChevronDown,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminUserService, permissionService } from '@/lib/api';
import toast from 'react-hot-toast';

const ROLES = ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff', 'administrator'];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  administrator:   { label: 'Administrator',   color: 'text-red-700',     bg: 'bg-red-50',     dot: 'bg-red-500' },
  kepala_balai:    { label: 'Kepala Balai',    color: 'text-[#284074]',   bg: 'bg-[#284074]/8',dot: 'bg-[#284074]' },
  kepala_seksi:    { label: 'Kepala Seksi',    color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  project_manager: { label: 'Project Manager', color: 'text-violet-700',  bg: 'bg-violet-50',  dot: 'bg-violet-500' },
  scrum_master:    { label: 'Scrum Master',    color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500' },
  staff:           { label: 'Staff',           color: 'text-slate-600',   bg: 'bg-slate-100',  dot: 'bg-slate-400' },
};

const GRADIENTS = [
  'from-[#284074] to-[#3d5a9e]', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',    'from-cyan-500 to-blue-600',
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function getGradient(name: string) {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function UserFormModal({
  open, onClose, editUser,
}: { open: boolean; onClose: () => void; editUser?: any }) {
  const qc = useQueryClient();
  const isEdit = !!editUser;

  const [form, setForm] = useState({
    full_name: editUser?.full_name || '',
    email:     editUser?.email     || '',
    password:  '',
    role:      editUser?.roles?.[0] || 'staff',
    division:  editUser?.division  || '',
    position:  editUser?.position  || '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? adminUserService.update(editUser.id, data)
      : adminUserService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success(isEdit ? 'User diperbarui!' : 'User berhasil dibuat!');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const handleSubmit = () => {
    if (!form.full_name || !form.email || (!isEdit && !form.password)) {
      toast.error('Lengkapi semua field wajib');
      return;
    }
    const payload: any = { ...form };
    if (isEdit && !payload.password) delete payload.password;
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">{isEdit ? 'Edit User' : 'Tambah User Baru'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Mengedit ${editUser.full_name}` : 'Buat akun pengguna baru'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap *</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
                placeholder="Nama lengkap" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
                placeholder="email@domain.com" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Password {isEdit && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
              </label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
                placeholder={isEdit ? '••••••••' : 'Minimal 8 karakter'} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Role *</label>
              <div className="relative">
                <select value={form.role} onChange={e => set('role', e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all pr-8">
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Divisi</label>
              <input value={form.division} onChange={e => set('division', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
                placeholder="Teknologi" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jabatan</label>
              <input value={form.position} onChange={e => set('position', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all"
                placeholder="Software Engineer" />
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#284074] text-white text-sm font-semibold hover:bg-[#1e3260] transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat User')}
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
      toast.success('Role diperbarui!');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Ubah Role</h2>
            <p className="text-xs text-slate-400">{user.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-4 space-y-1.5">
          {ROLES.map(role => {
            const conf = ROLE_CONFIG[role];
            const isActive = user.roles?.includes(role);
            return (
              <motion.button key={role} whileTap={{ scale: 0.98 }}
                onClick={() => mutation.mutate(role)}
                disabled={mutation.isPending}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all ${
                  isActive ? `border-current ${conf.bg} ${conf.color}` : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${conf.dot}`} />
                  <span className={`font-semibold ${isActive ? conf.color : 'text-slate-700'}`}>{conf.label}</span>
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
    queryFn: () => permissionService.getUserPermissions(user.id).then(r => r.data.data),
    enabled: !!user,
  });

  const setMutation = useMutation({
    mutationFn: ({ permission, granted }: any) =>
      permissionService.setPermission(user.id, permission, granted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-permissions', user?.id] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const resetMutation = useMutation({
    mutationFn: () => permissionService.resetPermissions(user.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user-permissions', user?.id] }); toast.success('Permission direset ke default'); },
  });

  if (!user) return null;

  const effective: string[] = permData?.effective || [];
  const defaults: string[] = permData?.default || [];
  const extras = permData?.extra || [];

  const ALL_PERMISSIONS: Record<string, string> = {
    'project.create':         'Membuat project baru',
    'project.edit':           'Mengedit project',
    'project.delete':         'Menghapus project',
    'project.manage_members': 'Tambah/hapus anggota project',
    'sprint.manage':          'Buat, mulai, selesaikan sprint',
    'sprint.view':            'Lihat detail sprint dan backlog',
    'task.create':            'Membuat task baru',
    'task.edit_own':          'Edit task milik sendiri',
    'task.edit_all':          'Edit task milik siapapun',
    'task.assign':            'Assign task ke anggota',
    'task.delete':            'Hapus task',
    'task.log_time':          'Log waktu pengerjaan',
    'cr.submit':              'Mengajukan Change Request',
    'cr.approve':             'Menyetujui/menolak Change Request',
    'calendar.view':          'Lihat kalender',
    'calendar.create_own':    'Buat event untuk diri sendiri',
    'calendar.manage':        'Buat/edit event untuk semua user',
    'user.manage':            'Kelola user, role, dan privilege',
    'report.view':            'Lihat laporan analitik',
    'report.export':          'Export laporan ke file',
    'attendance.clock':       'Clock-in/out absensi',
    'attendance.view_own':    'Lihat absensi sendiri',
    'attendance.view_all':    'Lihat absensi semua pegawai',
    'asset.view':             'Lihat daftar aset',
    'asset.manage':           'Tambah/edit/hapus aset',
    'document.view':          'Lihat dokumen',
    'document.manage':        'Tambah/edit/hapus dokumen',
    'notification.manage':    'Kelola konfigurasi notifikasi Telegram',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Kelola Privilege</h2>
            <p className="text-sm text-slate-400 mt-0.5">{user.full_name} · <span className="capitalize">{user.roles?.[0]?.replace('_', ' ')}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400">Toggle untuk tambah/cabut privilege di luar role default</p>
            <button onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}
              className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50">
              Reset ke default
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
            </div>
          ) : Object.entries(ALL_PERMISSIONS).map(([key, label]) => {
            const isDefault  = defaults.includes(key);
            const isEffective = effective.includes(key);
            const extraEntry = extras.find((e: any) => e.permission === key);
            const isOverridden = !!extraEntry;

            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                isEffective ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    {isDefault && !isOverridden && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-semibold">DEFAULT</span>
                    )}
                    {isOverridden && extraEntry?.granted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-semibold">+EXTRA</span>
                    )}
                    {isOverridden && !extraEntry?.granted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-500 font-semibold">DICABUT</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{key}</span>
                </div>
                <button
                  onClick={() => setMutation.mutate({ permission: key, granted: !isEffective })}
                  disabled={setMutation.isPending}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    isEffective ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                    isEffective ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-6 pt-0">
          <button onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
            Selesai
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ActionMenu({ user, onEdit, onRole, onToggle, onDelete, onPermission, onClose }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20">
      <button onClick={() => { onEdit(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
        <Pencil className="w-3.5 h-3.5" /> Edit User
      </button>
      <button onClick={() => { onRole(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
        <Shield className="w-3.5 h-3.5" /> Ubah Role
      </button>
      <button onClick={() => { onPermission(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-violet-600 hover:bg-violet-50 transition-colors">
        <Shield className="w-3.5 h-3.5" /> Kelola Privilege
      </button>
      <button onClick={() => { onToggle(); onClose(); }}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
          user.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
        }`}>
        {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
        {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
      <div className="h-px bg-slate-100 mx-2" />
      <button onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
        <Trash2 className="w-3.5 h-3.5" /> Hapus
      </button>
    </motion.div>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [openMenu, setOpenMenu]     = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser]     = useState<any>(null);
  const [roleUser, setRoleUser]     = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [permissionUser, setPermissionUser] = useState<any>(null);

  // Render permission modal
  const permissionModal = permissionUser ? <PermissionModal user={permissionUser} onClose={() => setPermissionUser(null)} /> : null;

  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminUserService.stats().then(r => r.data.data),
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => adminUserService.list({ ...(search && {search}), ...(roleFilter && {role: roleFilter}), per_page: 50 }).then(r => r.data),
  });

  const users = usersData?.data || [];

  const toggleStatus = useMutation({
    mutationFn: (u: any) => adminUserService.updateStatus(u.id, !u.is_active),
    onSuccess: (_, u) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success(u.is_active ? 'User dinonaktifkan' : 'User diaktifkan');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUserService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('User dihapus');
      setDeleteUser(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  return (
    <AppLayout>
      {permissionModal}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#284074]/10 to-[#284074]/5 rounded-2xl flex items-center justify-center border border-[#284074]/10">
            <Users className="w-5 h-5 text-[#284074]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola User</h1>
            <p className="text-sm text-slate-400 mt-0.5">{stats?.total_users || 0} pengguna terdaftar</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#284074] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3260] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total User" value={stats.total_users} color="text-slate-900" />
          <StatCard label="Aktif" value={stats.active_users} sub={`${stats.inactive_users} nonaktif`} color="text-emerald-600" />
          {Object.entries(stats.by_role || {}).slice(0, 2).map(([role, count]: any) => (
            <StatCard key={role} label={ROLE_CONFIG[role]?.label || role} value={count} color={ROLE_CONFIG[role]?.color || 'text-slate-700'} />
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setRoleFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!roleFilter ? 'bg-[#284074] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
          Semua
        </button>
        {ROLES.map(role => {
          const conf = ROLE_CONFIG[role];
          const count = stats?.by_role?.[role] || 0;
          return (
            <button key={role} onClick={() => setRoleFilter(role === roleFilter ? '' : role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === role ? `${conf.bg} ${conf.color} border border-current` : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
              {conf.label} · {count}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 focus:border-[#284074] transition-all w-full"
              placeholder="Cari nama atau email..." />
          </div>
          {(search || roleFilter) && (
            <button onClick={() => { setSearch(''); setRoleFilter(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{users.length} user</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {['Pengguna', 'Email', 'Divisi / Jabatan', 'Role', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {users.map((u: any, i: number) => (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group relative">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(u.full_name)} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          {getInitials(u.full_name)}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-slate-700">{u.division || '—'}</div>
                      {u.position && <div className="text-xs text-slate-400 mt-0.5">{u.position}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {u.roles?.map((r: string) => {
                          const conf = ROLE_CONFIG[r] || ROLE_CONFIG.staff;
                          return (
                            <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${conf.bg} ${conf.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                              {conf.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 relative">
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        <AnimatePresence>
                          {openMenu === u.id && (
                            <ActionMenu user={u}
                              onEdit={() => setEditUser(u)}
                              onRole={() => setRoleUser(u)}
                              onToggle={() => toggleStatus.mutate(u)}
                              onDelete={() => setDeleteUser(u)}
                              onPermission={() => setPermissionUser(u)}
                              onClose={() => setOpenMenu(null)} />
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {(showCreate || editUser) && (
          <UserFormModal open={true}
            onClose={() => { setShowCreate(false); setEditUser(null); }}
            editUser={editUser} />
        )}
        {roleUser && <RoleModal user={roleUser} onClose={() => setRoleUser(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {deleteUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteUser(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Hapus User?</h3>
              <p className="text-sm text-slate-500 mb-5">
                <span className="font-semibold text-slate-700">{deleteUser.full_name}</span> akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Batal
                </button>
                <button onClick={() => deleteMutation.mutate(deleteUser.id)} disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
