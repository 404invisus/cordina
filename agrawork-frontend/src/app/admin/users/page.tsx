'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Shield } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { userService } from '@/lib/api';
import { getRoleBadgeColor, getRoleLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const ROLES = ['kepala_balai', 'kepala_seksi', 'project_manager', 'scrum_master', 'staff'];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then(r => r.data.data),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userService.assignRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Role berhasil diperbarui!'); setSelectedUser(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const filtered = users?.filter((u: any) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AppLayout>
      <PageHeader
        title="Manajemen User"
        subtitle={`${users?.length || 0} pengguna terdaftar`}
        icon={Users}
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-48 text-sm" placeholder="Cari user..." />
          </div>
        }
      />

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Pengguna', 'Email', 'Divisi', 'Jabatan', 'Role', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#284074] text-white text-xs font-600 flex items-center justify-center">
                        {u.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{u.division || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{u.position || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {u.roles?.map((r: string) => (
                        <span key={r} className={`badge ${getRoleBadgeColor(r)}`}>{getRoleLabel(r)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setSelectedUser(u)} className="text-sm text-[#284074] font-medium flex items-center gap-1 hover:gap-2 transition-all">
                      <Shield className="w-3.5 h-3.5" /> Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Assign Role" size="sm">
        {selectedUser && (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-[#284074] text-white flex items-center justify-center font-600">
                {selectedUser.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-slate-800">{selectedUser.full_name}</div>
                <div className="text-xs text-slate-400">{selectedUser.email}</div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-3">Pilih role untuk user ini:</p>
            <div className="space-y-2">
              {ROLES.map(role => (
                <button key={role} onClick={() => assignRoleMutation.mutate({ id: selectedUser.id, role })}
                  disabled={assignRoleMutation.isPending}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all hover:border-[#284074] hover:bg-[#284074]/5 ${selectedUser.roles?.includes(role) ? 'border-[#284074] bg-[#284074]/5' : 'border-slate-200'}`}>
                  <span className={`font-medium ${selectedUser.roles?.includes(role) ? 'text-[#284074]' : 'text-slate-700'}`}>{getRoleLabel(role)}</span>
                  {selectedUser.roles?.includes(role) && <span className="text-xs text-[#284074]">✓ Current</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
