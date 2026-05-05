"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit2,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  Search,
  Send,
  Trash2,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MEDIA_PREFIX = '__AGORATASK_MEDIA__:';
const CALL_PREFIX = '__AGORATASK_CALL__:';
const MAX_MEDIA_SIZE = 7 * 1024 * 1024;

type MediaPayload = {
  type: 'media';
  mediaType: 'image' | 'video';
  name: string;
  mime: string;
  dataUrl: string;
};

type CallSignalPayload =
  | { type: 'call'; action: 'offer'; callId: string; mode: 'voice' | 'video'; sdp: RTCSessionDescriptionInit }
  | { type: 'call'; action: 'answer'; callId: string; mode: 'voice' | 'video'; sdp: RTCSessionDescriptionInit }
  | { type: 'call'; action: 'ice'; callId: string; mode: 'voice' | 'video'; candidate: RTCIceCandidateInit }
  | { type: 'call'; action: 'end'; callId: string; mode: 'voice' | 'video' };

type CallState = {
  callId: string;
  mode: 'voice' | 'video';
  status: 'calling' | 'incoming' | 'connected';
  offer?: RTCSessionDescriptionInit;
  isMuted: boolean;
  isCameraOff: boolean;
};

const parseMediaPayload = (text: string): MediaPayload | null => {
  if (!text.startsWith(MEDIA_PREFIX)) return null;

  try {
    const payload = JSON.parse(text.slice(MEDIA_PREFIX.length)) as MediaPayload;
    return payload.type === 'media' ? payload : null;
  } catch {
    return null;
  }
};

const parseCallSignal = (text: string): CallSignalPayload | null => {
  if (!text.startsWith(CALL_PREFIX)) return null;

  try {
    const payload = JSON.parse(text.slice(CALL_PREFIX.length)) as CallSignalPayload;
    return payload.type === 'call' ? payload : null;
  } catch {
    return null;
  }
};

const getMessagePreview = (text?: string) => {
  if (!text) return '';

  const media = parseMediaPayload(text);
  if (media) return media.mediaType === 'image' ? 'Photo' : 'Video';

  const call = parseCallSignal(text);
  if (call) return `${call.mode === 'video' ? 'Video' : 'Voice'} call`;

  return text;
};

export function MessagesPanel() {
  const { user } = useAuth();
  const { deleteMessage, editMessage, error, getInbox, isLoading, markRead, sendMessage } = useMessages();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [actionError, setActionError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isSendingNewConversation, setIsSendingNewConversation] = useState(false);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const processedSignalIds = useRef(new Set<string>());

  const inbox = user ? getInbox(user.email) : [];
  const conv = inbox.find(c => c.id === activeConvId);
  const activeUnread = conv && user ? conv.messages.filter(message => message.to === user.email && !message.read).length : 0;
  const canStartByEmail = user?.role === 'admin';

  const getOtherName = (conversation: ReturnType<typeof getInbox>[0]) => {
    const other = conversation.participants.find(participant => participant !== user?.email);
    return conversation.messages.find(message => message.from === other)?.fromName || other || 'Unknown';
  };

  const visibleMessages = useMemo(
    () => conv?.messages.filter(message => !parseCallSignal(message.text)) || [],
    [conv?.messages]
  );

  const filteredInbox = inbox.filter(conversation => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;

    const last = conversation.messages[conversation.messages.length - 1];
    return getOtherName(conversation).toLowerCase().includes(query) || getMessagePreview(last?.text).toLowerCase().includes(query);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  useEffect(() => {
    if (conv && user && activeUnread > 0) markRead(conv.id, user.email);
  }, [activeUnread, conv, markRead, user]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
  }, [callState]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const getRecipient = () => {
    if (!conv || !user) return null;

    const to = conv.participants.find(participant => participant !== user.email);
    const lastOtherMessage = conv.messages.slice().reverse().find(message => message.from !== user.email || message.to !== user.email);
    const toUserId = lastOtherMessage
      ? lastOtherMessage.from === user.email
        ? lastOtherMessage.toUserId
        : lastOtherMessage.fromUserId
      : conv.participantIds.find(id => id !== user.id);

    if (!to || !toUserId) return null;
    return { to, toUserId };
  };

  const sendRawMessage = async (text: string) => {
    if (!user) return;

    const recipient = getRecipient();
    if (!recipient) return;

    await sendMessage(user.email, user.name, recipient.to, text, recipient.toUserId);
  };

  const sendCallSignal = async (payload: CallSignalPayload) => {
    await sendRawMessage(`${CALL_PREFIX}${JSON.stringify(payload)}`);
  };

  const closePeerConnection = () => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setRemoteStream(null);
  };

  const createPeerConnection = (callId: string, mode: 'voice' | 'video') => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        sendCallSignal({ type: 'call', action: 'ice', callId, mode, candidate: event.candidate.toJSON() });
      }
    };

    peerConnection.ontrack = event => {
      setRemoteStream(event.streams[0]);
      setCallState(current => current ? { ...current, status: 'connected' } : current);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const openLocalStream = async (mode: 'voice' | 'video') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Calls are not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video',
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  useEffect(() => {
    if (!conv || !user) return;

    conv.messages.forEach(message => {
      if (processedSignalIds.current.has(message.id) || message.from === user.email) return;

      const signal = parseCallSignal(message.text);
      if (!signal) return;

      processedSignalIds.current.add(message.id);

      if (signal.action === 'offer') {
        if (!callState) {
          setMediaError('');
          setCallState({
            callId: signal.callId,
            mode: signal.mode,
            status: 'incoming',
            offer: signal.sdp,
            isMuted: false,
            isCameraOff: false,
          });
        }
        return;
      }

      if (signal.action === 'answer' && callState?.callId === signal.callId) {
        peerConnectionRef.current?.setRemoteDescription(signal.sdp);
        setCallState(current => current ? { ...current, status: 'connected' } : current);
        return;
      }

      if (signal.action === 'ice' && callState?.callId === signal.callId) {
        peerConnectionRef.current?.addIceCandidate(signal.candidate);
        return;
      }

      if (signal.action === 'end' && callState?.callId === signal.callId) {
        closePeerConnection();
        setCallState(null);
      }
    });
  }, [callState, conv, user]);

  const send = async () => {
    if (!replyText.trim() || !conv || !user || isSendingReply) return;

    const recipient = getRecipient();
    if (!recipient) return;

    setActionError('');
    setIsSendingReply(true);
    try {
      await sendMessage(user.email, user.name, recipient.to, replyText.trim(), recipient.toUserId);
      setReplyText('');
    } catch {
      setActionError('Could not send this message.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const sendMedia = async (file: File) => {
    if (!user || !conv) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setActionError('Only image and video files can be sent.');
      return;
    }

    if (file.size > MAX_MEDIA_SIZE) {
      setActionError('Media must be smaller than 7 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      const payload: MediaPayload = {
        type: 'media',
        mediaType: file.type.startsWith('image/') ? 'image' : 'video',
        name: file.name,
        mime: file.type,
        dataUrl,
      };

      setActionError('');
      try {
        await sendRawMessage(`${MEDIA_PREFIX}${JSON.stringify(payload)}`);
      } catch {
        setActionError('Could not send this media.');
      }
    };
    reader.onerror = () => setActionError('Could not read this media file.');
    reader.readAsDataURL(file);
  };

  const startCall = async (mode: 'voice' | 'video') => {
    if (!conv || !user || callState) return;

    const callId = crypto.randomUUID();
    setMediaError('');
    setCallState({ callId, mode, status: 'calling', isMuted: false, isCameraOff: false });

    try {
      const stream = await openLocalStream(mode);
      const peerConnection = createPeerConnection(callId, mode);
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await sendCallSignal({ type: 'call', action: 'offer', callId, mode, sdp: offer });
    } catch (error) {
      closePeerConnection();
      setCallState(null);
      setMediaError(error instanceof Error ? error.message : 'Could not start this call.');
    }
  };

  const acceptCall = async () => {
    if (!callState?.offer || !user) return;

    try {
      const stream = await openLocalStream(callState.mode);
      const peerConnection = createPeerConnection(callState.callId, callState.mode);
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      await peerConnection.setRemoteDescription(callState.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await sendCallSignal({ type: 'call', action: 'answer', callId: callState.callId, mode: callState.mode, sdp: answer });
      setCallState(current => current ? { ...current, status: 'connected' } : current);
    } catch (error) {
      closePeerConnection();
      setCallState(null);
      setMediaError(error instanceof Error ? error.message : 'Could not answer this call.');
    }
  };

  const endCall = async () => {
    if (callState) {
      await sendCallSignal({ type: 'call', action: 'end', callId: callState.callId, mode: callState.mode });
    }
    closePeerConnection();
    setCallState(null);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setCallState(current => current ? { ...current, isMuted: !audioTrack.enabled } : current);
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCallState(current => current ? { ...current, isCameraOff: !videoTrack.enabled } : current);
  };

  const sendNewConversation = async () => {
    if (!user || !canStartByEmail || !recipientEmail.trim() || !newMessageText.trim() || isSendingNewConversation) return;

    setActionError('');
    setIsSendingNewConversation(true);
    try {
      await sendMessage(user.email, user.name, recipientEmail.trim(), newMessageText.trim());
      setRecipientEmail('');
      setNewMessageText('');
    } catch {
      setActionError('Could not start this conversation. Check the recipient email.');
    } finally {
      setIsSendingNewConversation(false);
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

  const otherName = conv ? getOtherName(conv) : '';

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={cn(
          'flex h-full min-h-0 w-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:w-[360px] md:flex-none',
          conv && 'hidden md:flex'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h1 className="text-lg font-bold">Messages</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Auto sync is on</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            {user?.name?.charAt(0) || 'A'}
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
          <label className="flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <Search className="h-4 w-4" />
            <input
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
              placeholder="Search chats"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </label>
        </div>

        {(error || actionError) && (
          <div className="mx-3 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {actionError || error}
          </div>
        )}

        {canStartByEmail && (
          <form
            className="space-y-2 border-b border-slate-100 p-3 dark:border-slate-800"
            onSubmit={event => {
              event.preventDefault();
              sendNewConversation();
            }}
          >
            <input
              value={recipientEmail}
              onChange={event => setRecipientEmail(event.target.value)}
              placeholder="recipient@email.com"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-800 dark:bg-slate-900"
            />
            <div className="flex gap-2">
              <input
                value={newMessageText}
                onChange={event => setNewMessageText(event.target.value)}
                placeholder="Start a new message"
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-800 dark:bg-slate-900"
              />
              <button
                type="submit"
                disabled={!recipientEmail.trim() || !newMessageText.trim() || isSendingNewConversation}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                aria-label="Send new message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {inbox.length === 0 && isLoading ? (
            <div aria-label="Loading conversations">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInbox.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-400">
              <MessageCircle className="mb-3 h-10 w-10" />
              <p className="font-medium">No conversations yet.</p>
            </div>
          ) : (
            filteredInbox.map(conversation => {
              const last = conversation.messages[conversation.messages.length - 1];
              const unread = conversation.messages.filter(message => message.to === user?.email && !message.read).length;
              const name = getOtherName(conversation);
              const active = conversation.id === activeConvId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConvId(conversation.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900',
                    active && 'bg-emerald-50 dark:bg-emerald-950/20'
                  )}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('truncate text-sm', unread > 0 ? 'font-bold' : 'font-semibold')}>{name}</p>
                      <span className={cn('shrink-0 text-[11px]', unread > 0 ? 'font-bold text-emerald-600' : 'text-slate-400')}>
                        {last?.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className={cn('truncate text-xs', unread > 0 ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500')}>
                        {last?.from === user?.email ? 'You: ' : ''}{getMessagePreview(last?.text)}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={cn('relative hidden h-full min-w-0 flex-1 flex-col bg-[#efeae2] dark:bg-slate-950 md:flex', conv && 'flex')}>
        {conv ? (
          <>
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setActiveConvId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
                aria-label="Back to chats"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {otherName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{otherName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Messages sync automatically</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startCall('voice')}
                  disabled={Boolean(callState)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 dark:text-emerald-300 dark:hover:bg-emerald-950"
                  aria-label="Start voice call"
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => startCall('video')}
                  disabled={Boolean(callState)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 dark:text-emerald-300 dark:hover:bg-emerald-950"
                  aria-label="Start video call"
                >
                  <Video className="h-5 w-5" />
                </button>
              </div>
            </div>

            {mediaError && (
              <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {mediaError}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
              <div className="mx-auto flex max-w-4xl flex-col gap-2">
                {visibleMessages.map(message => {
                  const mine = message.from === user?.email;
                  const editing = editingMessageId === message.id;
                  const media = parseMediaPayload(message.text);

                  return (
                    <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'group max-w-[86%] rounded-lg px-3 py-2 text-sm shadow-sm sm:max-w-[70%]',
                          mine
                            ? 'rounded-tr-sm bg-[#d9fdd3] text-slate-900 dark:bg-emerald-900 dark:text-white'
                            : 'rounded-tl-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                        )}
                      >
                        {editing ? (
                          <div className="space-y-2">
                            <input
                              value={editingText}
                              onChange={event => setEditingText(event.target.value)}
                              onKeyDown={event => {
                                if (event.key === 'Enter') saveEdit();
                                if (event.key === 'Escape') cancelEdit();
                              }}
                              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                              autoFocus
                            />
                            <div className="flex justify-end gap-1">
                              <button onClick={saveEdit} className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700" aria-label="Save message">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={cancelEdit} className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300" aria-label="Cancel edit">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {media ? (
                              <div className="space-y-2">
                                {media.mediaType === 'image' ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={media.dataUrl}
                                    alt={media.name}
                                    className="max-h-80 w-full rounded-md object-contain"
                                  />
                                ) : (
                                  <video
                                    src={media.dataUrl}
                                    controls
                                    className="max-h-80 w-full rounded-md bg-black"
                                  />
                                )}
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  <span className="truncate">{media.name}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                            )}
                            <div className="mt-1 flex items-center justify-end gap-2">
                              <span className="text-[10px] text-slate-500 dark:text-slate-300">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {mine && !media && (
                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                  <button onClick={() => startEdit(message.id, message.text)} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-black/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" aria-label="Edit message">
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => removeMessage(message.id)} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-black/10 hover:text-red-600 dark:text-slate-300" aria-label="Delete message">
                                    <Trash2 className="h-3 w-3" />
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
            </div>

            <form
              className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-slate-100 px-3 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5"
              onSubmit={event => {
                event.preventDefault();
                send();
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) sendMedia(file);
                  event.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Attach image or video"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea
                value={replyText}
                onChange={event => setReplyText(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={`Message ${otherName}...`}
                className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-transparent bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSendingReply}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            {callState && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
                <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                  <div className="bg-slate-950 p-4 text-white">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{otherName}</p>
                        <p className="text-xs capitalize text-slate-300">
                          {callState.status === 'incoming' ? 'Incoming' : callState.status} {callState.mode} call
                        </p>
                      </div>
                      {callState.mode === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
                      {callState.mode === 'video' && remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center">
                          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold">
                            {otherName.charAt(0)}
                          </div>
                          <p className="text-sm text-slate-300">
                            {callState.status === 'incoming' ? 'Waiting for you to answer' : 'Waiting for connection'}
                          </p>
                        </div>
                      )}

                      {callState.mode === 'video' && localStreamRef.current && (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="absolute bottom-3 right-3 h-24 w-32 rounded-lg border border-white/20 bg-black object-cover"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 p-4">
                    {callState.status === 'incoming' ? (
                      <>
                        <button
                          type="button"
                          onClick={acceptCall}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                          aria-label="Accept call"
                        >
                          <Phone className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={endCall}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                          aria-label="Reject call"
                        >
                          <PhoneOff className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={toggleMute}
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-full text-white',
                            callState.isMuted ? 'bg-slate-700' : 'bg-slate-500 hover:bg-slate-600'
                          )}
                          aria-label={callState.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                        >
                          {callState.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                        {callState.mode === 'video' && (
                          <button
                            type="button"
                            onClick={toggleCamera}
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-full text-white',
                              callState.isCameraOff ? 'bg-slate-700' : 'bg-slate-500 hover:bg-slate-600'
                            )}
                            aria-label={callState.isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                          >
                            {callState.isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={endCall}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                          aria-label="End call"
                        >
                          <PhoneOff className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-slate-50 px-8 text-center dark:bg-slate-950">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold">Select a chat</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Pick a conversation from the left to continue messaging.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
