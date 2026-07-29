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
  const [name, setName] = useState(editData?.name || '');
  const [desc, setDesc] = useState(editData?.description || '');
  const [chatId, setChatId] = useState(editData?.telegram_chat_id || '');
  const [memberIds, setMemberIds] = useState<string[]>(editData?.members?.map((m: any) => m.id) || []);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-groups'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then((r) => r.data.data?.data || r.data.data || []),
    staleTime: 60000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      editData
        ? userGroupService.update(editData.id, { name, description: desc, telegram_chat_id: chatId, member_ids: memberIds })
        : userGroupService.create({ name, description: desc, telegram_chat_id: chatId, member_ids: memberIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success(editData ? 'Group updated' : 'Group created');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const toggle = (id: string) => setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[6px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-700/8 rounded-[6px] flex items-center justify-center">
              <Users className="w-4 h-4 text-navy-700" />
            </div>
            <h2 className="text-lg font-bold text-navy-900">{editData ? 'Edit Group' : 'Create New Group'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border-subtle rounded-[6px]">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Group Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20"
              placeholder="e.g. All Squad, Tech Team"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Description</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-[6px] border border-border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20"
              placeholder="Group description (optional)"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Members <span className="text-navy-700 font-bold">{memberIds.length} selected</span>
            </label>
            <div className="mt-1 border border-border rounded-[6px] overflow-hidden">
              <div className="max-h-48 overflow-y-auto divide-y divide-surface-2">
                {users.map((u: any) => {
                  const checked = memberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggle(u.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-navy-700/8' : 'hover:bg-surface-2'}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-navy-700 border-navy-700' : 'border-border-button'}`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-navy-800 truncate">{u.full_name}</div>
                        <div className="text-xs text-text-placeholder">{u.email}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name}
            className="w-full py-2.5 rounded-[6px] bg-navy-700 text-white text-sm font-semibold hover:bg-navy-900 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Saving...' : editData ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function UserGroupsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => userGroupService.list().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userGroupService.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success('Group deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const groups = Array.isArray(data) ? data : [];

  return (
    <AppLayout>
      <GroupModal
        open={createOpen || !!editData}
        onClose={() => {
          setCreateOpen(false);
          setEditData(null);
        }}
        editData={editData}
      />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-navy-700 to-navy-700 rounded-[6px] flex items-center justify-center border border-navy-700/10">
            <Users className="w-5 h-5 text-navy-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">User Groups</h1>
            <p className="text-sm text-text-placeholder mt-0.5">Manage groups for notifications and calendar invites</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-navy-700 text-white px-4 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-navy-900 transition-colors "
        >
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-border mx-auto mb-3" />
          <div className="text-text-placeholder text-sm">No groups yet</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((g: any) => (
            <motion.div
              key={g.id}
              layout
              className="bg-white rounded-[6px] border border-border-subtle p-5 hover:border-navy-700/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-navy-700/8 rounded-[6px] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-navy-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-900">{g.name}</div>
                    {g.description && <div className="text-xs text-text-placeholder mt-0.5">{g.description}</div>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-text-placeholder flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> {g.member_count || 0} member{(g.member_count || 0) !== 1 ? 's' : ''}
                      </span>
                      {g.telegram_chat_id && <span className="text-xs text-info font-mono">{g.telegram_chat_id}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      userGroupService.show(g.id).then((r) => setEditData(r.data.data));
                    }}
                    className="p-2 hover:bg-border-subtle rounded-[6px]"
                  >
                    <Pencil className="w-4 h-4 text-text-placeholder" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this group?')) deleteMutation.mutate(g.id);
                    }}
                    className="p-2 hover:bg-danger-soft rounded-[6px]"
                  >
                    <Trash2 className="w-4 h-4 text-danger" />
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
