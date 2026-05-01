"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase, Calendar, MessageSquare, DollarSign,
  Settings, Star, CheckCircle, Clock, Zap, User,
  LogOut, ChevronRight, BarChart2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { MessagesPanel } from '@/components/chat/MessagesPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

type Section = 'overview' | 'bookings' | 'messages' | 'earnings' | 'settings';

const NAV: { id: Section; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'bookings', label: 'Bookings', icon: Calendar, badge: 3 },
  { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 1 },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + '20', color: accent }}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  const { user, logout } = useAuth();
  const { unreadCount } = useMessages();
  const params = useParams();
  const country = params?.country as string || 'lk';
  const router = useRouter();
  const [section, setSection] = useState<Section>('overview');

  const handleLogout = () => { logout(); router.push(`/${country}/login`); };

  // ── Section content ──────────────────────────────────────────────
  const renderOverview = () => (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
        Welcome back, {user?.name || 'Provider'} 👋
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard label="Monthly Earnings" value="Rs. 124,500" icon={DollarSign} accent="#10B981" />
        <StatCard label="Active Bookings" value="12" icon={Calendar} accent="#3B82F6" />
        <StatCard label="Overall Rating" value="4.8 / 5.0" icon={Star} accent="#F59E0B" />
      </div>

      <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">New Booking Requests</h2>
      <div className="space-y-4">
        {[
          { service: 'Deep House Cleaning', customer: 'Nuwan Perera', time: 'Tomorrow, 10:00 AM' },
          { service: 'Office AC Servicing', customer: 'Kumari Silva', time: 'May 3, 02:00 PM' },
        ].map((req) => (
          <div key={req.service} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white">{req.service}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Requested by <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{req.customer}</span> · {req.time}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Decline
              </button>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-500/20">
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlaceholder = (title: string, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">{title}</h1>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center text-slate-400">
          <Icon className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">{title} coming soon.</p>
        </div>
      </div>
    );
  };

  const CONTENT: Record<Section, React.ReactNode> = {
    overview: renderOverview(),
    bookings: renderPlaceholder('Bookings', Calendar),
    messages: <MessagesPanel />,
    earnings: renderPlaceholder('Earnings', DollarSign),
    settings: <SettingsPanel />,
  };

  // ── Layout ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">AgoraTask</span>
        </div>

        {/* Provider badge */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Provider Menu</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            const msgBadge = item.id === 'messages' ? unreadCount(user?.email || '') : 0;
            const displayBadge = msgBadge > 0 ? msgBadge : item.badge;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {displayBadge ? (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.id === 'messages'
                      ? 'bg-amber-500 text-white'
                      : 'bg-indigo-600 text-white'
                    }`}>
                    {displayBadge}
                  </span>
                ) : (
                  active && <ChevronRight className="w-4 h-4 opacity-40" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: profile + logout */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-1">
          {/* <button
            onClick={() => router.push(`/${country}/profile`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {user?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate flex-1 text-left">{user?.name || 'Provider'}</span>
            <Briefcase className="w-3.5 h-3.5 opacity-40" />
          </button> */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto min-h-screen">
        {CONTENT[section]}
      </main>
    </div>
  );
}
