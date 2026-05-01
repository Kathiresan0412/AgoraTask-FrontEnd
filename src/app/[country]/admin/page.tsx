"use client";

import React, { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Layers, Settings, ShieldAlert,
  LogOut, Plus, Trash2, Edit2, Check, X, Zap, User,
  ChevronRight, Tag, Grid3X3, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { MessagesPanel } from '@/components/chat/MessagesPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

// ── Types ────────────────────────────────────────────────────────
interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
}

// ── Initial seed data ────────────────────────────────────────────
const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { id: '1', name: 'Plumbing', description: 'Pipe repairs, installations & drainage', icon: '🔧', color: '#3B82F6', active: true },
  { id: '2', name: 'Electrical', description: 'Wiring, installations & repairs', icon: '⚡', color: '#F59E0B', active: true },
  { id: '3', name: 'Cleaning', description: 'Home & office deep cleaning', icon: '🧹', color: '#10B981', active: true },
  { id: '4', name: 'AC Maintenance', description: 'Servicing, repairs & installations', icon: '❄️', color: '#6366F1', active: true },
  { id: '5', name: 'Painting', description: 'Interior & exterior painting', icon: '🎨', color: '#EC4899', active: false },
];

// ── Sidebar nav items ─────────────────────────────────────────────
type Section = 'dashboard' | 'service-types' | 'providers' | 'messages' | 'settings';

const NAV = [
  { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'service-types' as Section, label: 'Service Types', icon: Layers },
  { id: 'providers' as Section, label: 'Providers', icon: Users },
  { id: 'messages' as Section, label: 'Messages', icon: MessageSquare },
  { id: 'settings' as Section, label: 'Settings', icon: Settings },
];

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-b-4`}
      style={{ borderBottomColor: accent }}>
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h3>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { unreadCount } = useMessages();
  const params = useParams();
  const country = params?.country as string || 'lk';
  const router = useRouter();

  const [section, setSection] = useState<Section>('dashboard');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(INITIAL_SERVICE_TYPES);

  // Create-form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [formColor, setFormColor] = useState('#6366F1');
  const [formError, setFormError] = useState('');

  const handleLogout = () => { logout(); router.push(`/${country}/login`); };

  // ── Service type helpers ────────────────────────────────────────
  const openCreate = () => {
    setEditId(null); setFormName(''); setFormDesc('');
    setFormIcon('🔧'); setFormColor('#6366F1'); setFormError('');
    setShowForm(true);
  };

  const openEdit = (st: ServiceType) => {
    setEditId(st.id); setFormName(st.name); setFormDesc(st.description);
    setFormIcon(st.icon); setFormColor(st.color); setFormError('');
    setShowForm(true);
  };

  const saveServiceType = () => {
    if (!formName.trim()) { setFormError('Name is required.'); return; }
    if (editId) {
      setServiceTypes(prev => prev.map(s =>
        s.id === editId ? { ...s, name: formName.trim(), description: formDesc.trim(), icon: formIcon, color: formColor } : s
      ));
    } else {
      setServiceTypes(prev => [...prev, {
        id: Date.now().toString(), name: formName.trim(),
        description: formDesc.trim(), icon: formIcon, color: formColor, active: true,
      }]);
    }
    setShowForm(false);
  };

  const deleteServiceType = (id: string) => setServiceTypes(prev => prev.filter(s => s.id !== id));
  const toggleActive = (id: string) => setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

  // ── Section renderers ───────────────────────────────────────────
  const renderDashboard = () => (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
        Welcome back, {user?.name || 'Admin'} 👋
      </h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value="14,205" accent="#3B82F6" />
        <StatCard label="Active Providers" value="842" accent="#6366F1" />
        <StatCard label="Total Bookings" value="124k" accent="#10B981" />
        <StatCard label="Platform Revenue" value="Rs. 4.2M" accent="#F59E0B" />
      </div>

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
        <ShieldAlert className="text-amber-500 w-5 h-5" /> Pending Provider Approvals
      </h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {['Business Name', 'Category', 'Location', 'Action'].map(h => (
                <th key={h} className="p-4 font-semibold text-sm text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[{ name: 'SafeFix Plumbers Ltd', cat: 'Plumbing', loc: 'Kandy' },
            { name: 'SparkElec Solutions', cat: 'Electrical', loc: 'Colombo 07' }
            ].map(row => (
              <tr key={row.name} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-bold text-slate-900 dark:text-white">{row.name}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{row.cat}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{row.loc}</td>
                <td className="p-4 flex gap-2">
                  <button className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 text-green-600 dark:text-green-400 font-medium px-4 py-1.5 rounded-lg text-sm border border-green-200 dark:border-green-800 transition-colors">Approve</button>
                  <button className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600 dark:text-red-400 font-medium px-4 py-1.5 rounded-lg text-sm border border-red-200 dark:border-red-800 transition-colors">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderServiceTypes = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Service Types</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage the categories available to providers and customers.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Service Type
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            {editId ? 'Edit Service Type' : 'New Service Type'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name *</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Carpentry"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
              <input
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Short description…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Emoji Icon</label>
              <input
                value={formIcon}
                onChange={e => setFormIcon(e.target.value)}
                placeholder="🔧"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Accent Colour</label>
              <div className="flex items-center gap-3">
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-1 bg-white dark:bg-slate-800" />
                <span className="text-sm font-mono text-slate-500">{formColor}</span>
              </div>
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm mt-3">{formError}</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={saveServiceType}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              <Check className="w-4 h-4" /> {editId ? 'Save Changes' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Service types grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceTypes.map(st => (
          <div key={st.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm"
                  style={{ backgroundColor: st.color + '20', border: `1.5px solid ${st.color}40` }}>
                  {st.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{st.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{st.description || '—'}</p>
                </div>
              </div>
              {/* Active pill */}
              <button onClick={() => toggleActive(st.id)}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${st.active
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                {st.active ? 'Active' : 'Inactive'}
              </button>
            </div>
            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => openEdit(st)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => deleteServiceType(st.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-auto">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {serviceTypes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
            <Grid3X3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No service types yet.</p>
            <button onClick={openCreate} className="mt-4 text-sm text-indigo-500 hover:underline">Create one</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProviders = () => (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Manage Providers</h1>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center text-slate-400">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Provider management coming soon.</p>
      </div>
    </div>
  );

  const renderMessages = () => <MessagesPanel />;

  const renderSettings = () => (
    <div>
      <SettingsPanel />
    </div>
  );

  const SECTION_CONTENT: Record<Section, React.ReactNode> = {
    'dashboard': renderDashboard(),
    'service-types': renderServiceTypes(),
    'providers': renderProviders(),
    'messages': renderMessages(),
    'settings': renderSettings(),
  };

  // ── Layout ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-slate-900 dark:bg-slate-950 flex flex-col border-r border-slate-800 min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">AgoraTask</span>
        </div>

        {/* Admin badge */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            const badge = item.id === 'messages' ? unreadCount(user?.email || '') : 0;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
                {active && badge === 0 && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom: user info + logout */}
        <div className="border-t border-slate-800 p-3 space-y-1">
          {/* <button
            onClick={() => router.push(`/${country}/profile`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {user?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{user?.name || 'Admin'}</span>
          </button> */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto min-h-screen">
        {SECTION_CONTENT[section]}
      </main>
    </div>
  );
}
