"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Check, Edit2, RefreshCw, Send, Trash2, X } from 'lucide-react';
import { Button, Input } from 'geist/components';
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
      <div className="flex min-h-[calc(100vh-8rem)] flex-col">
        <div className="flex items-center gap-3 mb-4 min-w-0">
          <Button
            onClick={() => setActiveConvId(null)}
            variant="ghost"
            size="sm"
            className="shrink-0 px-2"
          >
            ← Back
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              {otherName.charAt(0)}
            </div>
            <span className="truncate font-bold text-slate-900 dark:text-white text-sm">{otherName}</span>
          </div>
          <Button
            onClick={refreshConversations}
            variant="secondary"
            size="icon"
            className="ml-auto h-9 w-9"
            aria-label="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
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
                <div className={`group max-w-[88%] break-words px-4 py-2.5 rounded-2xl text-sm leading-relaxed sm:max-w-[78%] ${
                  mine
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm'
                }`}>
                  {editing ? (
                    <div className="space-y-2">
                      <Input
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-9 bg-white text-slate-900 dark:bg-white dark:text-slate-900"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1">
                        <Button onClick={saveEdit} variant="ghost" size="icon" className="h-7 w-7 bg-white/15 text-white hover:bg-white/25 hover:text-white" aria-label="Save message">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button onClick={cancelEdit} variant="ghost" size="icon" className="h-7 w-7 bg-white/15 text-white hover:bg-white/25 hover:text-white" aria-label="Cancel edit">
                          <X className="w-3.5 h-3.5" />
                        </Button>
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
                            <Button onClick={() => startEdit(m.id, m.text)} variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-white/15 text-white hover:bg-white/25 hover:text-white" aria-label="Edit message">
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button onClick={() => removeMessage(m.id)} variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-white/15 text-white hover:bg-white/25 hover:text-white" aria-label="Delete message">
                              <Trash2 className="w-3 h-3" />
                            </Button>
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
          <Input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Message ${otherName}…`}
            className="min-w-0 flex-1"
          />
          <Button
            onClick={send}
            disabled={!replyText.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Inbox list ─────────────────────────────────────────────────
  return (
    <div className="min-w-0">
      <div className="flex flex-col items-stretch justify-between gap-3 mb-6 sm:flex-row sm:items-center">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Messages</h1>
        <Button
          onClick={refreshConversations}
          variant="secondary"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {(error || actionError) && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {actionError || error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_auto] gap-3">
          <Input
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            placeholder="recipient@email.com"
            className="min-w-0"
          />
          <Input
            value={newMessageText}
            onChange={e => setNewMessageText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendNewConversation()}
            placeholder="Start a new message"
            className="min-w-0"
          />
          <Button
            onClick={sendNewConversation}
            disabled={!recipientEmail.trim() || !newMessageText.trim()}
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
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
              <Button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                variant="ghost"
                className="h-auto w-full min-w-0 justify-start gap-3 rounded-none px-4 py-4 text-left shadow-none sm:gap-4 sm:px-5"
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
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
