"use client";

import React, { createContext, useCallback, useContext, useState } from 'react';
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
  refreshConversations: () => Promise<void>;
  sendMessage: (from: string, fromName: string, to: string, text: string) => Promise<void>;
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

  const refreshConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { data } = await messageApi.listConversations();
      setConversations(data.map(mapConversation));
    } catch {
      setError('Could not load messages.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getConvId = (a: string, b: string) => [a, b].sort().join('|');

  const sendMessage = useCallback(async (_from: string, _fromName: string, to: string, text: string) => {
    const { data } = await messageApi.send({ toEmail: to, text });
    const message = mapMessage(data);

    setConversations(prev => {
      const existing = prev.find(conversation => conversation.id === message.conversationId);
      if (existing) {
        return prev.map(conversation => (
          conversation.id === message.conversationId
            ? { ...conversation, messages: [...conversation.messages, message] }
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
