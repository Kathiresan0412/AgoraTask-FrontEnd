"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Zap, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Service categories for the assistant
const CATEGORIES = [
  { label: 'Cleaning',          emoji: '🧹' },
  { label: 'Plumbing',          emoji: '🔧' },
  { label: 'Electrical',        emoji: '⚡' },
  { label: 'AC Maintenance',    emoji: '❄️' },
  { label: 'Painting',          emoji: '🎨' },
  { label: 'Transport & Moving',emoji: '🚛' },
  { label: 'Food & Catering',   emoji: '🍽️' },
  { label: 'Search by name',    emoji: '🔍' },
];

interface BotMsg { role: 'bot' | 'user'; text: string; chips?: string[] }

const PROVIDER_EMAIL = 'provider@gmail.com';
const PROVIDER_NAME  = 'Provider User';

export default function CustomerAssistant() {
  const { user } = useAuth();
  const { sendMessage } = useMessages();
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<'assistant' | 'inbox'>('assistant');
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<BotMsg[]>([]);

  // Initialize welcome message dynamically on load or language change to support t()
  useEffect(() => {
    if (chat.length === 0) {
      setChat([
        {
          role: 'bot',
          text: t('assistant.greeting'),
          chips: CATEGORIES.map(c => `${c.emoji} ${c.label === 'Search by name' ? t('assistant.searchByName') : c.label}`),
        },
      ]);
    }
  }, [t, chat.length]);
  const [awaitingCategory, setAwaitingCategory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, open]);

  if (!user || user.role !== 'customer') return null;

  const addMsg = (role: BotMsg['role'], text: string, chips?: string[]) =>
    setChat(prev => [...prev, { role, text, chips }]);

  const handleChip = (chip: string) => {
    const label = chip.replace(/^.{1,2}\s/, '');
    addMsg('user', chip);
    setAwaitingCategory(false);

    setTimeout(() => {
      if (label === 'Search by name') {
        addMsg('bot', "Sure! Type the service or provider name you're looking for and I'll help you find them.");
      } else {
        addMsg('bot',
          `Great choice! I'll connect you with top-rated **${label}** providers in your area.\n\nWould you like to:\n• ${t('assistant.bookNow')}\n• ${t('assistant.seeProviders')}\n• ${t('assistant.messageProvider')}`,
          [`📅 ${t('assistant.bookNow')}`, `⭐ ${t('assistant.seeProviders')}`, `💬 ${t('assistant.messageProvider')}`]
        );
      }
    }, 600);
  };

  const handleActionChip = (chip: string) => {
    addMsg('user', chip);
    setTimeout(() => {
      if (chip.includes('Message a provider')) {
        sendMessage(user.email, user.name, PROVIDER_EMAIL, 'Hi! I saw your profile and I\'m interested in your services.');
        addMsg('bot', "✅ I've sent a message to a top provider on your behalf! Switch to your **Inbox** tab to continue the conversation.");
      } else if (chip.includes('Book now')) {
        addMsg('bot', "🗓️ Please visit the Services page to pick an available slot. I'll remind you 24 hours before your booking!");
      } else {
        addMsg('bot', "Here are the top-rated providers in your area. You can tap any to view their full profile and book them.");
      }
    }, 600);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMsg('user', text);
    setAwaitingCategory(false);

    setTimeout(() => {
      // Simple keyword matching
      const lower = text.toLowerCase();
      if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('leak')) {
        addMsg('bot', "I found 5 plumbing experts near you! The highest rated is **CoolTech Plumbing** (4.9 ⭐).",
          ['📅 Book now', '💬 Message a provider']);
      } else if (lower.includes('clean')) {
        addMsg('bot', "I found 8 cleaning services available this week. **Colombo Cleaners** has 47 reviews and a 4.8 rating!",
          ['📅 Book now', '💬 Message a provider']);
      } else if (lower.includes('hello') || lower.includes('hi')) {
        addMsg('bot', "Hello! 😊 What service can I help you find today?", CATEGORIES.map(c => `${c.emoji} ${c.label}`));
      } else {
        addMsg('bot', `Let me search for "${text}" providers…\n\nI found 3 providers matching your request. Would you like to connect with one of them?`,
          ['📅 Book now', '💬 Message a provider', '🔙 Start over']);
      }
    }, 700);
  };

  return (
    <>
      {/* ── Floating trigger ────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#171717] dark:bg-white text-white dark:text-[#171717] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
      </button>

      {/* ── Chat window ─────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] max-h-[580px] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="w-10 h-10 bg-[#171717] dark:bg-white rounded-2xl flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white dark:text-[#171717]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[#171717] dark:text-white">{t('assistant.title')}</p>
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                {t('assistant.status')}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            {(['assistant', 'inbox'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-bold capitalize transition-colors ${
                  tab === t
                    ? 'text-[#171717] dark:text-white border-b-2 border-[#171717] dark:border-white'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {t === 'assistant' ? '🤖 Assistant' : '💬 Inbox'}
              </button>
            ))}
          </div>

          {tab === 'assistant' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-[340px]">
                {chat.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 bg-[#171717] dark:bg-white rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-3.5 h-3.5 text-white dark:text-[#171717]" />
                      </div>
                    )}
                    <div className="max-w-[82%]">
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === 'bot'
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-tl-sm'
                          : 'bg-[#171717] dark:bg-white text-white dark:text-[#171717] rounded-tr-sm'
                      }`}>
                        {msg.text.split('**').map((part, pi) =>
                          pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part
                        )}
                      </div>
                      {/* Chips */}
                      {msg.chips && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.chips.map(chip => (
                            <button
                              key={chip}
                              onClick={() => awaitingCategory ? handleChip(chip) : handleActionChip(chip)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 transition-colors"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-950 rounded-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-800">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={t('assistant.inputPlaceholder')}
                    className="flex-1 bg-transparent text-sm text-neutral-800 dark:text-white placeholder:text-neutral-400 outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-full bg-[#171717] dark:bg-white flex items-center justify-center hover:bg-black dark:hover:bg-neutral-200 transition-colors disabled:opacity-30"
                  >
                    <Send className="w-3.5 h-3.5 text-white dark:text-[#171717]" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-neutral-400 mt-2">{t('assistant.poweredBy')}</p>
              </div>
            </>
          ) : (
            <InboxTab />
          )}
        </div>
      )}
    </>
  );
}

// ── Inline Inbox (customer → provider / admin) ───────────────────
function InboxTab() {
  const { user } = useAuth();
  const { getInbox, sendMessage, markRead } = useMessages();
  const { t } = useLanguage();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const inbox = user ? getInbox(user.email) : [];
  const conv  = inbox.find(c => c.id === activeConv);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conv?.messages.length]);
  useEffect(() => { if (conv && user) markRead(conv.id, user.email); }, [activeConv]);

  const send = () => {
    if (!replyText.trim() || !conv || !user) return;
    const to = conv.participants.find(p => p !== user.email)!;
    sendMessage(user.email, user.name, to, replyText.trim());
    setReplyText('');
  };

  const getOtherName = (conv: ReturnType<typeof getInbox>[0]) => {
    const other = conv.participants.find(p => p !== user?.email);
    return conv.messages.find(m => m.from === other)?.fromName || other || 'Unknown';
  };

  if (conv) {
    const otherName = getOtherName(conv);
    return (
      <div className="flex flex-col h-[420px]">
        <button onClick={() => setActiveConv(null)}
          className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800 transition-colors">
          ← Back · <span className="font-bold text-neutral-700 dark:text-neutral-200">{otherName}</span>
        </button>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conv.messages.map(m => (
            <div key={m.id} className={`flex ${m.from === user?.email ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                m.from === user?.email
                  ? 'bg-[#171717] text-white rounded-tr-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-tl-sm'
              }`}>
                <p>{m.text}</p>
                <p className="text-[10px] opacity-50 mt-0.5 text-right">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
            <input value={replyText} onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={t('messages.typeMessage')}
              className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-white text-neutral-800 dark:text-white placeholder:text-neutral-400"
            />
          <button onClick={send} disabled={!replyText.trim()}
            className="w-9 h-9 rounded-full bg-[#171717] dark:bg-white flex items-center justify-center hover:bg-black transition-colors disabled:opacity-30">
            <Send className="w-3.5 h-3.5 text-white dark:text-[#171717]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto max-h-[420px]">
      {inbox.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-neutral-400 text-sm">
          <p>{t('messages.noConversations')}</p>
        </div>
      ) : (
        inbox.map(c => {
          const last = c.messages[c.messages.length - 1];
          const unread = c.messages.filter(m => m.to === user?.email && !m.read).length;
          return (
            <button key={c.id} onClick={() => setActiveConv(c.id)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                {getOtherName(c).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-800 dark:text-white truncate">{getOtherName(c)}</p>
                <p className="text-xs text-neutral-400 truncate">{last?.text}</p>
              </div>
              {unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {unread}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
