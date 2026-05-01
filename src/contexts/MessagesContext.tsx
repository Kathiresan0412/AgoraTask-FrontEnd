"use client";

import React, { createContext, useContext, useState } from 'react';

export interface Message {
  id: string;
  from: string;       // email of sender
  fromName: string;
  to: string;         // email of recipient
  text: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;          // sorted pair e.g. "admin@gmail.com|provider@gmail.com"
  participants: string[];
  messages: Message[];
}

interface MessagesContextType {
  conversations: Conversation[];
  sendMessage: (from: string, fromName: string, to: string, text: string) => void;
  getConversation: (emailA: string, emailB: string) => Conversation | undefined;
  getInbox: (email: string) => Conversation[];
  markRead: (convId: string, readerEmail: string) => void;
  unreadCount: (email: string) => number;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

// Seed conversations
const seed = (): Conversation[] => {
  const make = (a: string, aName: string, b: string, bName: string, msgs: { from: string; fromName: string; text: string }[]) => {
    const id = [a, b].sort().join('|');
    return {
      id,
      participants: [a, b],
      messages: msgs.map((m, i) => ({
        id: `${id}-${i}`,
        from: m.from,
        fromName: m.fromName,
        to: m.from === a ? b : a,
        text: m.text,
        timestamp: new Date(Date.now() - (msgs.length - i) * 60000 * 5),
        read: true,
      })),
    };
  };

  return [
    make(
      'customer@gmail.com', 'Customer User',
      'provider@gmail.com', 'Provider User',
      [
        { from: 'customer@gmail.com', fromName: 'Customer User', text: 'Hi, I need a deep clean for my home.' },
        { from: 'provider@gmail.com', fromName: 'Provider User', text: 'Sure! When would you like to schedule it?' },
        { from: 'customer@gmail.com', fromName: 'Customer User', text: 'This Saturday morning works!' },
      ]
    ),
    make(
      'admin@gmail.com', 'Admin User',
      'provider@gmail.com', 'Provider User',
      [
        { from: 'admin@gmail.com', fromName: 'Admin User', text: 'Your account has been verified. Welcome!' },
        { from: 'provider@gmail.com', fromName: 'Provider User', text: 'Thank you! Excited to be on board.' },
      ]
    ),
    make(
      'admin@gmail.com', 'Admin User',
      'customer@gmail.com', 'Customer User',
      [
        { from: 'admin@gmail.com', fromName: 'Admin User', text: 'Welcome to AgoraTask! Let us know if you need help.' },
      ]
    ),
  ];
};

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(seed());

  const getConvId = (a: string, b: string) => [a, b].sort().join('|');

  const sendMessage = (from: string, fromName: string, to: string, text: string) => {
    const id = getConvId(from, to);
    const msg: Message = {
      id: `${id}-${Date.now()}`,
      from, fromName, to, text,
      timestamp: new Date(),
      read: false,
    };
    setConversations(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing) {
        return prev.map(c => c.id === id ? { ...c, messages: [...c.messages, msg] } : c);
      }
      return [...prev, { id, participants: [from, to], messages: [msg] }];
    });
  };

  const getConversation = (a: string, b: string) =>
    conversations.find(c => c.id === getConvId(a, b));

  const getInbox = (email: string) =>
    conversations.filter(c => c.participants.includes(email));

  const markRead = (convId: string, readerEmail: string) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? { ...c, messages: c.messages.map(m => m.to === readerEmail ? { ...m, read: true } : m) }
          : c
      )
    );
  };

  const unreadCount = (email: string) =>
    conversations.reduce((sum, c) =>
      sum + c.messages.filter(m => m.to === email && !m.read).length, 0
    );

  return (
    <MessagesContext.Provider value={{ conversations, sendMessage, getConversation, getInbox, markRead, unreadCount }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
};
