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
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminTelegramPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-telegram-users'],
    queryFn: () => adminNotifService.telegramUsers().then((r) => r.data.data),
  });

  const { data: appUsers } = useQuery({
    queryKey: ['admin-users-simple'],
    queryFn: () => adminUserService.list({ per_page: 100 }).then((r) => r.data.data),
  });

  const copy = (chatId: number) => {
    navigator.clipboard.writeText(String(chatId));
    setCopiedId(String(chatId));
    toast.success('Chat ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveToUser = async (userId: string, chatId: number) => {
    setSavingId(userId);
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { telegram_chat_id: String(chatId) });
      toast.success('Chat ID saved to user!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  const telegramUsers = data || [];
  const groups = telegramUsers.filter((u: any) => u.chat_id < 0);
  const chatLogById = new Map(telegramUsers.map((u: any) => [String(u.chat_id), u]));

  // Users who have a telegram_chat_id saved on their profile — the source of truth for
  // "who has set up the bot", independent of whether they show up in the bot's chat log.
  const connectedUsers = (appUsers || []).filter((au: any) => au.telegram_chat_id);
  const connectedChatIds = new Set(connectedUsers.map((au: any) => String(au.telegram_chat_id)));

  // Private chat-log entries not yet linked to any app user.
  const unlinkedChats = telegramUsers.filter((u: any) => u.chat_id > 0 && !connectedChatIds.has(String(u.chat_id)));

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-500/10 to-sky-500/5 rounded-[6px] flex items-center justify-center border border-sky-500/10">
            <MessageCircle className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Telegram Bot</h1>
            <p className="text-sm text-text-placeholder mt-0.5">
              {telegramUsers.length} chat{telegramUsers.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[6px] border border-border text-sm font-semibold text-text-secondary hover:bg-surface-2 transition-all ${isFetching ? 'opacity-50' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-navy-700/20 border-t-navy-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {groups.length > 0 && (
            <div className="bg-white rounded-[6px] border border-border-subtle overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-2">
                <Hash className="w-4 h-4 text-text-placeholder" />
                <h3 className="font-bold text-navy-800 text-sm">Groups ({groups.length})</h3>
              </div>
              <div className="divide-y divide-surface-2">
                {groups.map((u: any) => (
                  <motion.div
                    key={u.chat_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="w-10 h-10 rounded-[6px] bg-success-soft flex items-center justify-center flex-shrink-0">
                      <Hash className="w-5 h-5 text-success-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-navy-800">{u.first_name || 'Grup Telegram'}</div>
                      <div className="text-xs text-text-placeholder font-mono mt-0.5">{u.chat_id}</div>
                    </div>
                    <button
                      onClick={() => copy(u.chat_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      {copiedId === String(u.chat_id) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" /> Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Salin ID
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {connectedUsers.length > 0 && (
            <div className="bg-white rounded-[6px] border border-border-subtle overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-2">
                <Users className="w-4 h-4 text-text-placeholder" />
                <h3 className="font-bold text-navy-800 text-sm">Connected Users ({connectedUsers.length})</h3>
              </div>
              <div className="divide-y divide-surface-2">
                {connectedUsers.map((au: any) => {
                  const chatLog: any = chatLogById.get(String(au.telegram_chat_id));
                  const telegramName = chatLog ? [chatLog.first_name, chatLog.last_name].filter(Boolean).join(' ') : null;
                  return (
                    <motion.div
                      key={au.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <div className="w-10 h-10 rounded-[6px] bg-success-soft flex items-center justify-center flex-shrink-0 text-success-text text-sm font-bold">
                        {getInitials(au.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-navy-800">{au.full_name}</span>
                          {chatLog?.username && <span className="text-xs text-text-placeholder">@{chatLog.username}</span>}
                          <span className="text-[10px] px-2 py-0.5 bg-success-soft text-success-text rounded-full font-semibold">Connected</span>
                        </div>
                        <div className="text-xs text-text-placeholder font-mono mt-0.5">
                          {au.telegram_chat_id}
                          {telegramName && ` · ${telegramName}`}
                        </div>
                      </div>
                      <button
                        onClick={() => copy(Number(au.telegram_chat_id))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
                      >
                        {copiedId === String(au.telegram_chat_id) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-success" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy ID
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {unlinkedChats.length > 0 && (
            <div className="bg-white rounded-[6px] border border-border-subtle overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-text-placeholder" />
                <h3 className="font-bold text-navy-800 text-sm">Unlinked Chats ({unlinkedChats.length})</h3>
              </div>
              <div className="divide-y divide-surface-2">
                {unlinkedChats.map((u: any) => {
                  const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
                  return (
                    <motion.div
                      key={u.chat_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <div className="w-10 h-10 rounded-[6px] bg-info-soft flex items-center justify-center flex-shrink-0 text-info-text text-sm font-bold">
                        {getInitials(fullName || u.username || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-navy-800">{fullName || 'No name'}</span>
                          {u.username && <span className="text-xs text-text-placeholder">@{u.username}</span>}
                        </div>
                        <div className="text-xs text-text-placeholder font-mono mt-0.5">{u.chat_id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {appUsers && (
                          <select
                            onChange={(e) => e.target.value && saveToUser(e.target.value, u.chat_id)}
                            disabled={savingId !== null}
                            className="text-xs px-2 py-1.5 rounded-lg border border-border text-text-secondary focus:outline-none focus:ring-2 focus:ring-navy-700/20 max-w-[140px]"
                          >
                            <option value="">Link to user...</option>
                            {(appUsers as any[])
                              .filter((au: any) => !au.telegram_chat_id)
                              .map((au: any) => (
                                <option key={au.id} value={au.id}>
                                  {au.full_name}
                                </option>
                              ))}
                          </select>
                        )}
                        <button
                          onClick={() => copy(u.chat_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
                        >
                          {copiedId === String(u.chat_id) ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-success" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy ID
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {groups.length === 0 && connectedUsers.length === 0 && unlinkedChats.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[6px] border border-border-subtle">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-border-button" />
              <p className="text-sm text-text-placeholder">Nobody has messaged the bot yet</p>
              <p className="text-xs text-border-button mt-1">Ask team members to message the Telegram bot first</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
