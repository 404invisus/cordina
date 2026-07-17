'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, X, Check, UserPlus } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { userGroupService, adminUserService } from '@/lib/api';
import toast from 'react-hot-toast';

function GroupModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: any }) {
  const qc = useQueryClient();
  const [name, setName]       = useState(editData?.name || '');
  const [desc, setDesc]       = useState(editData?.description || '');
  const [chatId, setChatId]   = useState(editData?.telegram_chat_id || '');
  const [memberIds, setMemberIds] = useState<string[]>(editData?.members?.map((m: any) => m.id) || []);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-groups'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then(r => r.data.data?.data || r.data.data || []),
    staleTime: 60000,
  });

  const mutation = useMutation({
    mutationFn: () => editData
      ? userGroupService.update(editData.id, { name, description: desc, telegram_chat_id: chatId, member_ids: memberIds })
      : userGroupService.create({ name, description: desc, telegram_chat_id: chatId, member_ids: memberIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success(editData ? 'Group diperbarui' : 'Group dibuat');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal'),
  });

  const toggle = (id: string) => setMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Group' : 'Buat Group Baru'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Group *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="Contoh: All Squad, Tim Teknis" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="Deskripsi group (opsional)" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telegram Group Chat ID</label>
            <input value={chatId} onChange={e => setChatId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="-1001234567890" />
            <p className="text-xs text-slate-400 mt-1">ID grup Telegram untuk notifikasi ke grup</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Anggota <span className="text-violet-600 font-bold">{memberIds.length} dipilih</span></label>
            <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {users.map((u: any) => {
                  const checked = memberIds.includes(u.id);
                  return (
                    <div key={u.id} onClick={() => toggle(u.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{u.full_name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name}
            className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {mutation.isPending ? 'Menyimpan...' : (editData ? 'Simpan Perubahan' : 'Buat Group')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function UserGroupsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData]     = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => userGroupService.list().then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userGroupService.destroy(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user-groups'] }); toast.success('Group dihapus'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Gagal menghapus'),
  });

  const groups = Array.isArray(data) ? data : [];

  return (
    <AppLayout>
      <GroupModal open={createOpen || !!editData} onClose={() => { setCreateOpen(false); setEditData(null); }} editData={editData} />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-2xl flex items-center justify-center border border-violet-100">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Group Pengguna</h1>
            <p className="text-sm text-slate-400 mt-0.5">Kelola group untuk distribusi & undangan kalender</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Buat Group
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <div className="text-slate-400 text-sm">Belum ada group</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((g: any) => (
            <motion.div key={g.id} layout
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-violet-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{g.name}</div>
                    {g.description && <div className="text-xs text-slate-400 mt-0.5">{g.description}</div>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> {g.member_count || 0} anggota
                      </span>
                      {g.telegram_chat_id && (
                        <span className="text-xs text-blue-500 font-mono">{g.telegram_chat_id}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => {
                    userGroupService.show(g.id).then(r => setEditData(r.data.data));
                  }} className="p-2 hover:bg-slate-100 rounded-xl">
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => { if (confirm('Hapus group ini?')) deleteMutation.mutate(g.id); }}
                    className="p-2 hover:bg-red-50 rounded-xl">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
