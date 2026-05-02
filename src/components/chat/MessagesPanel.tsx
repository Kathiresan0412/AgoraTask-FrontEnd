"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Check, Edit2, RefreshCw, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';

export function MessagesPanel() {
  const { user } = useAuth();
  const { deleteMessage, editMessage, error, getInbox, isLoading, markRead, refreshConversations, sendMessage } = useMessages();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [actionError, setActionError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const inbox = user ? getInbox(user.email) : [];
  const conv  = inbox.find(c => c.id === activeConvId);
  const activeUnread = conv && user ? conv.messages.filter(message => message.to === user.email && !message.read).length : 0;

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conv?.messages.length]);
  useEffect(() => {
    if (conv && user && activeUnread > 0) markRead(conv.id, user.email);
  }, [activeUnread, conv, markRead, user]);

  const getOtherName = (c: ReturnType<typeof getInbox>[0]) => {
    const other = c.participants.find(p => p !== user?.email);
    return c.messages.find(m => m.from === other)?.fromName || other || 'Unknown';
  };

  const send = async () => {
    if (!replyText.trim() || !conv || !user) return;
    const to = conv.participants.find(p => p !== user.email)!;
    setActionError('');
    try {
      await sendMessage(user.email, user.name, to, replyText.trim());
    } catch {
      setActionError('Could not send this message.');
      return;
    }
    setReplyText('');
  };

  const sendNewConversation = async () => {
    if (!user || !recipientEmail.trim() || !newMessageText.trim()) return;
    setActionError('');
    try {
      await sendMessage(user.email, user.name, recipientEmail.trim(), newMessageText.trim());
      setRecipientEmail('');
      setNewMessageText('');
    } catch {
      setActionError('Could not start this conversation. Check the recipient email.');
    }
  };

  const startEdit = (messageId: string, text: string) => {
    setEditingMessageId(messageId);
    setEditingText(text);
    setActionError('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    setActionError('');
    try {
      await editMessage(editingMessageId, editingText.trim());
      cancelEdit();
    } catch {
      setActionError('Could not update this message.');
    }
  };

  const removeMessage = async (messageId: string) => {
    setActionError('');
    try {
      await deleteMessage(messageId);
    } catch {
      setActionError('Could not delete this message.');
    }
  };

  // ── Conversation view ──────────────────────────────────────────
  if (conv) {
    const otherName = getOtherName(conv);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setActiveConvId(null)}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              {otherName.charAt(0)}
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{otherName}</span>
          </div>
          <button
            onClick={refreshConversations}
            className="ml-auto w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {(error || actionError) && (
          <div className="mb-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-700 dark:text-red-300">
            {actionError || error}
          </div>
        )}

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {conv.messages.map(m => {
            const mine = m.from === user?.email;
            const editing = editingMessageId === m.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`group max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  mine
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm'
                }`}>
                  {editing ? (
                    <div className="space-y-2">
                      <input
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-full rounded-lg bg-white text-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1">
                        <button onClick={saveEdit} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center" aria-label="Save message">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={cancelEdit} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center" aria-label="Cancel edit">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>{m.text}</p>
                      <div className={`flex items-center gap-2 mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                        <p className={`text-[10px] ${mine ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
                          {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {mine && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(m.id, m.text)} className="w-6 h-6 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center" aria-label="Edit message">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeMessage(m.id)} className="w-6 h-6 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center" aria-label="Delete message">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <div className="flex gap-2 mt-auto">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Message ${otherName}…`}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={send}
            disabled={!replyText.trim()}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // ── Inbox list ─────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Messages</h1>
        <button
          onClick={refreshConversations}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {(error || actionError) && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {actionError || error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_auto] gap-3">
          <input
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            placeholder="recipient@email.com"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={newMessageText}
            onChange={e => setNewMessageText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendNewConversation()}
            placeholder="Start a new message"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={sendNewConversation}
            disabled={!recipientEmail.trim() || !newMessageText.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      {inbox.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 flex flex-col items-center text-slate-400 shadow-sm">
          {isLoading ? (
            <>
              <RefreshCw className="w-8 h-8 mb-3 animate-spin opacity-40" />
              <p className="font-medium">Loading conversations...</p>
            </>
          ) : (
            <>
              <span className="text-4xl mb-3">💬</span>
              <p className="font-medium">No conversations yet.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {inbox.map(c => {
            const last  = c.messages[c.messages.length - 1];
            const unread = c.messages.filter(m => m.to === user?.email && !m.read).length;
            const otherName = getOtherName(c);
            return (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                  {otherName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {otherName}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {last?.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>
                    {last?.from === user?.email ? 'You: ' : ''}{last?.text}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
