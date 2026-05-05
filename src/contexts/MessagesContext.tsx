"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { messageApi } from '@/lib/api';
import type { ConversationDto, MessageDto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: string[];
  participantNames: string[];
  messages: Message[];
}

interface MessagesContextType {
  conversations: Conversation[];
  isLoading: boolean;
  error: string;
  refreshConversations: (options?: { silent?: boolean }) => Promise<void>;
  sendMessage: (from: string, fromName: string, to: string, text: string, toUserId?: string) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  getConversation: (emailA: string, emailB: string) => Conversation | undefined;
  getInbox: (email: string) => Conversation[];
  markRead: (convId: string, readerEmail: string) => Promise<void>;
  unreadCount: (email: string) => number;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

const mapMessage = (message: MessageDto): Message => ({
  ...message,
  timestamp: new Date(message.timestamp),
});

const mapConversation = (conversation: ConversationDto): Conversation => ({
  ...conversation,
  messages: conversation.messages.map(mapMessage),
});

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingSendKeys = useRef(new Set<string>());

  const refreshConversations = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!user) {
      setConversations([]);
      return;
    }

    if (options.silent && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    if (!options.silent) setIsLoading(true);
    setError('');
    try {
      const { data } = await messageApi.listConversations();
      setConversations(data.map(mapConversation));
    } catch {
      setError('Could not load messages.');
    } finally {
      if (!options.silent) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    refreshConversations();
    const syncTimer = window.setInterval(() => {
      refreshConversations({ silent: true });
    }, 15000);

    return () => window.clearInterval(syncTimer);
  }, [refreshConversations, user]);

  const getConvId = (a: string, b: string) => [a, b].sort().join('|');

  const sendMessage = useCallback(async (_from: string, _fromName: string, to: string, text: string, toUserId?: string) => {
    const trimmedText = text.trim();
    const sendKey = `${toUserId || to}:${trimmedText}`;

    if (pendingSendKeys.current.has(sendKey)) return;
    pendingSendKeys.current.add(sendKey);

    try {
      const { data } = await messageApi.send(toUserId ? { toUserId, text: trimmedText } : { toEmail: to, text: trimmedText });
      const message = mapMessage(data);

      setConversations(prev => {
        const existing = prev.find(conversation => conversation.id === message.conversationId);
        if (existing) {
          return prev.map(conversation => (
            conversation.id === message.conversationId
              ? {
                  ...conversation,
                  messages: conversation.messages.some(item => item.id === message.id)
                    ? conversation.messages.map(item => item.id === message.id ? message : item)
                    : [...conversation.messages, message],
                }
              : conversation
          ));
        }

        return [
          {
            id: message.conversationId,
            participantIds: [message.fromUserId, message.toUserId],
            participants: [message.from, message.to],
            participantNames: [message.fromName, message.toName],
            messages: [message],
          },
          ...prev,
        ];
      });
    } finally {
      pendingSendKeys.current.delete(sendKey);
    }
  }, []);

  const editMessage = useCallback(async (messageId: string, text: string) => {
    const { data } = await messageApi.update(messageId, text);
    const updated = mapMessage(data);

    setConversations(prev => prev.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(message => (
        message.id === messageId ? updated : message
      )),
    })));
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    await messageApi.delete(messageId);

    setConversations(prev => prev
      .map(conversation => ({
        ...conversation,
        messages: conversation.messages.filter(message => message.id !== messageId),
      }))
      .filter(conversation => conversation.messages.length > 0)
    );
  }, []);

  const getConversation = (a: string, b: string) =>
    conversations.find(conversation => conversation.participants.slice().sort().join('|') === getConvId(a, b));

  const getInbox = (email: string) =>
    conversations.filter(conversation => conversation.participants.includes(email));

  const markRead = useCallback(async (convId: string, readerEmail: string) => {
    setConversations(prev =>
      prev.map(conversation =>
        conversation.id === convId
          ? { ...conversation, messages: conversation.messages.map(message => message.to === readerEmail ? { ...message, read: true } : message) }
          : conversation
      )
    );

    try {
      await messageApi.markRead(convId);
    } catch {
      refreshConversations();
    }
  }, [refreshConversations]);

  const unreadCount = (email: string) =>
    conversations.reduce((sum, conversation) =>
      sum + conversation.messages.filter(message => message.to === email && !message.read).length, 0
    );

  return (
    <MessagesContext.Provider value={{ conversations, isLoading, error, refreshConversations, sendMessage, editMessage, deleteMessage, getConversation, getInbox, markRead, unreadCount }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
};
