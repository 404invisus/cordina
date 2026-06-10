'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageCircle, Copy, Check, RefreshCw, Users, Hash } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminNotifService, adminUserService } from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import api from '@/lib/api';

function getInitials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AdminTelegramPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-telegram-users'],
    queryFn: () => adminNotifService.telegramUsers().then(r => r.data.data),
  });

  const { data: appUsers } = useQuery({
    queryKey: ['admin-users-simple'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then(r => r.data.data),
  });

  const copy = (chatId: number) => {
    navigator.clipboard.writeText(String(chatId));
    setCopiedId(String(chatId));
    toast.success('Chat ID disalin!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveToUser = async (userId: string, chatId: number) => {
    setSavingId(userId);
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { telegram_chat_id: String(chatId) });
      toast.success('Chat ID disimpan ke user!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSavingId(null);
    }
  };

  const telegramUsers = data || [];
  const groups = telegramUsers.filter((u: any) => u.chat_id < 0);
  const privates = telegramUsers.filter((u: any) => u.chat_id > 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-500/10 to-sky-500/5 rounded-2xl flex items-center justify-center border border-sky-500/10">
            <MessageCircle className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Telegram Bot</h1>
            <p className="text-sm text-slate-400 mt-0.5">{telegramUsers.length} chat terdaftar</p>
          </div>
        </div>
        <button onClick={() => refetch()}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all ${isFetching ? 'opacity-50' : ''}`}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#284074]/20 border-t-[#284074] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {groups.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-sm">Grup ({groups.length})</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {groups.map((u: any) => (
                  <motion.div key={u.chat_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800">
                        {u.first_name || 'Grup Telegram'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{u.chat_id}</div>
                    </div>
                    <button onClick={() => copy(u.chat_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                      {copiedId === String(u.chat_id)
                        ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Disalin</>
                        : <><Copy className="w-3.5 h-3.5" /> Salin ID</>}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {privates.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-sm">Chat Pribadi ({privates.length})</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {privates.map((u: any) => {
                  const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
                  const linkedUser = (appUsers || []).find((au: any) => au.telegram_chat_id === String(u.chat_id));
                  return (
                    <motion.div key={u.chat_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0 text-sky-700 text-sm font-bold">
                        {getInitials(fullName || u.username || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{fullName || 'Tanpa Nama'}</span>
                          {u.username && <span className="text-xs text-slate-400">@{u.username}</span>}
                          {linkedUser && (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-semibold">
                              {linkedUser.full_name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{u.chat_id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!linkedUser && appUsers && (
                          <select onChange={e => e.target.value && saveToUser(e.target.value, u.chat_id)}
                            disabled={savingId !== null}
                            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#284074]/20 max-w-[140px]">
                            <option value="">Hubungkan ke user...</option>
                            {(appUsers as any[])
                              .filter((au: any) => !au.telegram_chat_id)
                              .map((au: any) => (
                                <option key={au.id} value={au.id}>{au.full_name}</option>
                              ))}
                          </select>
                        )}
                        <button onClick={() => copy(u.chat_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                          {copiedId === String(u.chat_id)
                            ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Disalin</>
                            : <><Copy className="w-3.5 h-3.5" /> Salin ID</>}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {telegramUsers.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">Belum ada yang chat bot</p>
              <p className="text-xs text-slate-300 mt-1">Minta anggota tim untuk chat bot Telegram terlebih dahulu</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
