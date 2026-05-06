"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X, ChevronDown, MessageCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicServiceApi, serviceTypeApi } from '@/lib/api';
import type { PublicServiceDto, ServiceTypeDto } from '@/lib/api';
import { formatServicePrice, normalizeCountryCode } from '@/lib/countries';
import Image from 'next/image';

interface BotMsg { role: 'bot' | 'user'; text: string; chips?: string[] }

const SEARCH_ICON = '🔍';
const LINK_PATTERN = /(\/(?:lk|ca)\/services(?:\?category=[^\s]+)?)/g;
const LINK_SEGMENT_PATTERN = /^\/(?:lk|ca)\/services(?:\?category=[^\s]+)?$/;
const isImageIcon = (value?: string | null) =>
  Boolean(value && (/^https?:\/\//.test(value) || value.startsWith('/') || value.startsWith('data:image/')));
const getServiceTypeChip = (type: ServiceTypeDto) =>
  `${type.icon && !isImageIcon(type.icon) ? type.icon : '•'} ${type.name}`;
const getCategoryServicesPath = (country: string, category?: string) =>
  category ? `/${country}/services?category=${encodeURIComponent(category)}` : `/${country}/services`;

function MessageText({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, pi) => {
        const content = part.split(LINK_PATTERN).map((segment, si) =>
          LINK_SEGMENT_PATTERN.test(segment) ? (
            <a
              key={si}
              href={segment}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:opacity-80"
            >
              click here
            </a>
          ) : segment
        );

        return pi % 2 === 1 ? <strong key={pi}>{content}</strong> : <React.Fragment key={pi}>{content}</React.Fragment>;
      })}
    </>
  );
}

export default function CustomerAssistant({ allowGuest = false }: { allowGuest?: boolean }) {
  const params = useParams<{ country?: string }>();
  const { user } = useAuth();
  const { getInbox } = useMessages();
  const { t } = useLanguage();
  const country = normalizeCountryCode(params.country);
  const servicesPath = `/${country}/services`;

  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<'assistant' | 'inbox'>('assistant');
  const [input, setInput] = useState('');
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeDto[]>([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [chat, setChat] = useState<BotMsg[]>(() => [
    {
      role: 'bot',
      text: t('assistant.greeting'),
    },
  ]);
  const [awaitingCategory, setAwaitingCategory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const unreadCount = user
    ? getInbox(user.email).reduce((total, conversation) => (
      total + conversation.messages.filter(message => message.to === user.email && !message.read).length
    ), 0)
    : 0;
  const searchChip = `${SEARCH_ICON} ${t('assistant.searchByName')}`;
  const initialChips = useMemo(
    () => [...serviceTypes.map(getServiceTypeChip), searchChip],
    [searchChip, serviceTypes]
  );

  const describeServices = (services: PublicServiceDto[], intro: string, category?: string) => {
    const browsePath = getCategoryServicesPath(country, category);

    if (!services.length) {
      return `${intro}\n\nThere are no active provider services available in the database right now. You can browse Services here: ${browsePath}`;
    }

    const serviceLines = services.slice(0, 3).map((service, index) => {
      const price = formatServicePrice(service.basePrice, service.priceType, country);
      const location = service.location ? ` · ${service.location}` : '';
      return `${index + 1}. ${service.title} by ${service.provider.name} · ${price}${location}`;
    });

    return `${intro}\n\n${serviceLines.join('\n')}\n\nOpen Services to view profiles, reviews, availability, and booking details: ${browsePath}`;
  };

  useEffect(() => {
    let cancelled = false;

    const loadServiceTypes = async () => {
      setLoadingServiceTypes(true);
      try {
        const { data } = await serviceTypeApi.list();
        if (!cancelled) setServiceTypes(data.filter(type => type.active).slice(0, 8));
      } catch {
        if (!cancelled) setServiceTypes([]);
      } finally {
        if (!cancelled) setLoadingServiceTypes(false);
      }
    };

    loadServiceTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setChat(prev => {
      if (prev.length !== 1 || prev[0].role !== 'bot') return prev;

      return [{
        ...prev[0],
        text: t('assistant.greeting'),
        chips: loadingServiceTypes ? undefined : initialChips,
      }];
    });
  }, [initialChips, loadingServiceTypes, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, open]);

  if (!allowGuest && (!user || user.role !== 'customer')) return null;
  if (user && user.role !== 'customer') return null;

  const availableTabs: Array<'assistant' | 'inbox'> = user ? ['assistant', 'inbox'] : ['assistant'];

  const addMsg = (role: BotMsg['role'], text: string, chips?: string[]) =>
    setChat(prev => [...prev, { role, text, chips }]);

  const handleChip = async (chip: string) => {
    const matchedType = serviceTypes.find(type => chip === getServiceTypeChip(type));
    const label = matchedType?.name || chip.replace(`${SEARCH_ICON} `, '').replace(/^•\s/, '');
    addMsg('user', chip);
    setAwaitingCategory(false);
    setSelectedCategory(matchedType?.name || '');

    if (chip === searchChip) {
      addMsg('bot', "Sure! Type the service or provider name you're looking for and I'll search the live service records.");
      return;
    }

    addMsg('bot', `Searching active ${label} services from the database...`);

    try {
      const { data } = await publicServiceApi.list({ country, category: label, page: 1, limit: 3 });
      const services = data.data;

      if (!services.length) {
        const { data: fallbackData } = await publicServiceApi.list({ country, page: 1, limit: 3 });
        addMsg('bot',
          fallbackData.data.length
            ? describeServices(fallbackData.data, `I could not find active ${label} providers yet, but these active services are available in the database.`)
            : describeServices([], `I could not find active ${label} providers yet.`, label),
          fallbackData.data.length ? [`⭐ ${t('assistant.seeProviders')}`, '🔙 Start over'] : ['🔙 Start over']
        );
        return;
      }

      const intro = data.pagination.total === 1
        ? `I found 1 active ${label} service in the database.`
        : `I found ${data.pagination.total} active ${label} services in the database.`;
      addMsg('bot',
        describeServices(services, intro, label),
        [`📅 ${t('assistant.bookNow')}`, `⭐ ${t('assistant.seeProviders')}`, `💬 ${t('assistant.messageProvider')}`]
      );
    } catch {
      addMsg('bot', `I could not load ${label} providers from the database right now. Please try again or open Services: ${servicesPath}`);
    }
  };

  const handleActionChip = (chip: string) => {
    addMsg('user', chip);

    setTimeout(async () => {
      if (chip.includes(t('assistant.messageProvider'))) {
        addMsg('bot', "Open a provider profile from the Services page and send your message there.");
      } else if (chip.includes(t('assistant.bookNow'))) {
        addMsg('bot', `Please open Services, choose an available provider, and book from the service profile: ${servicesPath}`);
      } else if (chip.includes('Start over')) {
        setAwaitingCategory(true);
        setSelectedCategory('');
        addMsg('bot', t('assistant.greeting'), initialChips);
      } else {
        try {
          const { data } = await publicServiceApi.list({
            country,
            category: selectedCategory || undefined,
            page: 1,
            limit: 3,
          });
          addMsg('bot', describeServices(data.data, `Here are live provider services from the database${selectedCategory ? ` for ${selectedCategory}` : ''}.`, selectedCategory || undefined));
        } catch {
          addMsg('bot', `I could not load providers from the database right now. Please open Services and try again: ${servicesPath}`);
        }
      }
    }, 600);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMsg('user', text);
    setAwaitingCategory(false);
    addMsg('bot', `Searching the database for "${text}"...`);

    try {
      const lower = text.toLowerCase();
      if (['hello', 'hi', 'hey'].includes(lower)) {
        setAwaitingCategory(true);
        addMsg('bot', "Hello! What service can I help you find today?", initialChips);
        return;
      }

      const matchedType = serviceTypes.find(type =>
        type.name.toLowerCase().includes(lower) || lower.includes(type.name.toLowerCase())
      );
      const { data } = await publicServiceApi.list({
        country,
        category: matchedType?.name,
        page: 1,
        limit: matchedType ? 3 : 50,
      });

      const matches = matchedType
        ? data.data
        : data.data.filter(service => {
          const searchable = [
            service.title,
            service.description,
            service.provider.name,
            service.location,
            ...service.categories,
            ...service.serviceTypes.map(type => type.name),
          ].filter(Boolean).join(' ').toLowerCase();

          return searchable.includes(lower);
        }).slice(0, 3);

      if (matches.length) {
        addMsg('bot',
          describeServices(matches, `I found ${matches.length} matching service${matches.length === 1 ? '' : 's'} in the database.`, matchedType?.name),
          [`📅 ${t('assistant.bookNow')}`, `💬 ${t('assistant.messageProvider')}`, '🔙 Start over']
        );
      } else if (data.data.length) {
        addMsg('bot',
          describeServices(data.data.slice(0, 3), `I could not find an exact database match for "${text}", but these active services are available.`),
          [`⭐ ${t('assistant.seeProviders')}`, '🔙 Start over']
        );
      } else {
        addMsg('bot', `I could not find active services matching "${text}" in the database. Try another service name or browse all services: ${servicesPath}`, ['🔙 Start over']);
      }
    } catch {
      addMsg('bot', `I could not search services from the database right now. Please try again or open Services: ${servicesPath}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#171717] text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 dark:bg-white dark:text-[#171717]"
        aria-label={open ? 'Close assistant messages' : 'Open assistant messages'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm dark:border-neutral-950">
            {unreadCount > 0 ? Math.min(unreadCount, 9) : ''}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] max-h-[580px] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">

          <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            {/* <div className="w-10 h-10 bg-[#171717] dark:bg-white rounded-2xl flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white dark:text-[#171717]" />
            </div> */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm shadow-slate-200/70 ring-1 ring-black/5 dark:border-neutral-800 dark:shadow-none dark:ring-white/10">
                            <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" priority />
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

          <div className="flex border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            {availableTabs.map(t => (
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-[340px]">
                {chat.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && (
                      // <div className="w-7 h-7 bg-[#171717] dark:bg-white rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      //   <Zap className="w-3.5 h-3.5 text-white dark:text-[#171717]" />
                      // </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm shadow-slate-200/70 ring-1 ring-black/5 dark:border-neutral-800 dark:shadow-none dark:ring-white/10">
                                      <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" priority />
                                    </div>
                    )}
                    <div className="max-w-[82%]">
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === 'bot'
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-tl-sm'
                          : 'bg-[#171717] dark:bg-white text-white dark:text-[#171717] rounded-tr-sm'
                      }`}>
                        <MessageText text={msg.text} />
                      </div>
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
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const inbox = user ? getInbox(user.email) : [];
  const conv  = inbox.find(c => c.id === activeConv);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conv?.messages.length]);
  useEffect(() => {
    const unread = conv && user ? conv.messages.some(m => m.to === user.email && !m.read) : false;
    if (conv && user && unread) markRead(conv.id, user.email);
  }, [conv, markRead, user]);

  const send = async () => {
    if (!replyText.trim() || !conv || !user || isSending) return;
    const to = conv.participants.find(p => p !== user.email)!;
    const lastOtherMessage = conv.messages.slice().reverse().find(message => message.from !== user.email || message.to !== user.email);
    const toUserId = lastOtherMessage
      ? lastOtherMessage.from === user.email
        ? lastOtherMessage.toUserId
        : lastOtherMessage.fromUserId
      : conv.participantIds.find(id => id !== user.id);
    setIsSending(true);
    try {
      await sendMessage(user.email, user.name, to, replyText.trim(), toUserId);
      setReplyText('');
    } finally {
      setIsSending(false);
    }
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
              onKeyDown={e => {
                if (e.key === 'Enter') send();
              }}
              placeholder={t('messages.typeMessage')}
              className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-white text-neutral-800 dark:text-white placeholder:text-neutral-400"
            />
          <button onClick={send} disabled={!replyText.trim() || isSending}
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
