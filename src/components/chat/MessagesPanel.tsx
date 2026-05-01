"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';

export function MessagesPanel() {
  const { user } = useAuth();
  const { getInbox, sendMessage, markRead } = useMessages();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const inbox = user ? getInbox(user.email) : [];
  const conv  = inbox.find(c => c.id === activeConvId);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conv?.messages.length]);
  useEffect(() => { if (conv && user) markRead(conv.id, user.email); }, [activeConvId]);

  const getOtherName = (c: ReturnType<typeof getInbox>[0]) => {
    const other = c.participants.find(p => p !== user?.email);
    return c.messages.find(m => m.from === other)?.fromName || other || 'Unknown';
  };

  const send = () => {
    if (!replyText.trim() || !conv || !user) return;
    const to = conv.participants.find(p => p !== user.email)!;
    sendMessage(user.email, user.name, to, replyText.trim());
    setReplyText('');
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
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {conv.messages.map(m => (
            <div key={m.id} className={`flex ${m.from === user?.email ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.from === user?.email
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm'
              }`}>
                <p>{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.from === user?.email ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
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
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Messages</h1>

      {inbox.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 flex flex-col items-center text-slate-400 shadow-sm">
          <span className="text-4xl mb-3">💬</span>
          <p className="font-medium">No conversations yet.</p>
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
