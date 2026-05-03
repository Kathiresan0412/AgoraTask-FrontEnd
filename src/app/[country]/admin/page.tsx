"use client";

import React, { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Layers, Settings, ShieldAlert,
  LogOut, Plus, Trash2, Edit2, Check, X, Zap,
  ChevronRight, ChevronDown, Tag, Grid3X3, MessageSquare, Briefcase,
  ClipboardList, Search, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { MessagesPanel } from '@/components/chat/MessagesPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { adminApi, serviceTypeApi } from '@/lib/api';
import type { AdminProviderDto, ServiceTypeDto } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────
interface ServiceType {
  id: string;
  parentId?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
}

// ── Sidebar nav items ─────────────────────────────────────────────
type Section = 'dashboard' | 'services' | 'service-types' | 'providers' | 'messages' | 'settings';

const NAV = [
  { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'services' as Section, label: 'Services', icon: Briefcase },
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

function providerStatusClass(status: AdminProviderDto['status']) {
  if (status === 'active') {
    return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
  }
  if (status === 'pending') {
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
}

function formatProviderStatus(status: AdminProviderDto['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function mapServiceType(row: ServiceTypeDto): ServiceType {
  return {
    id: row.id,
    parentId: row.parent_id || undefined,
    name: row.name,
    description: row.description || '',
    icon: row.icon || '🔧',
    color: row.color || '#6366F1',
    active: row.active,
  };
}

function makeServiceTypeSlug(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'service-type'}-${Date.now()}`;
}

// ══════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { unreadCount } = useMessages();
  const params = useParams();
  const country = params?.country as string || 'lk';
  const router = useRouter();

  const [section, setSection] = useState<Section>('dashboard');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypesLoading, setServiceTypesLoading] = useState(true);
  const [serviceTypesLoaded, setServiceTypesLoaded] = useState(false);
  const [serviceTypesError, setServiceTypesError] = useState('');
  const [savingServiceType, setSavingServiceType] = useState(false);
  const [providers, setProviders] = useState<AdminProviderDto[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerStatusFilter, setProviderStatusFilter] = useState('all');
  const [providerCategoryFilter, setProviderCategoryFilter] = useState('all');
  const [providerLocationFilter, setProviderLocationFilter] = useState('all');
  const [updatingProviderId, setUpdatingProviderId] = useState<string | null>(null);
  const [expandedServiceTypeIds, setExpandedServiceTypeIds] = useState<string[]>([]);

  // Create-form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [formColor, setFormColor] = useState('#6366F1');
  const [formParentId, setFormParentId] = useState('');
  const [formError, setFormError] = useState('');

  const handleLogout = () => { logout(); router.push(`/${country}/login`); };

  const loadServiceTypes = useCallback(async () => {
    setServiceTypesLoading(true);
    setServiceTypesError('');
    try {
      const { data } = await serviceTypeApi.list();
      setServiceTypes(data.map(mapServiceType));
      setServiceTypesLoaded(true);
    } catch {
      setServiceTypesError('Could not load service types from the database.');
    } finally {
      setServiceTypesLoading(false);
    }
  }, []);

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError('');
    try {
      const { data } = await adminApi.listProviders({
        search: providerSearch.trim() || undefined,
        status: providerStatusFilter,
        category: providerCategoryFilter,
        location: providerLocationFilter,
      });
      setProviders(data);
    } catch {
      setProvidersError('Could not load providers from the database.');
    } finally {
      setProvidersLoading(false);
    }
  }, [providerCategoryFilter, providerLocationFilter, providerSearch, providerStatusFilter]);

  useEffect(() => {
    if (section !== 'service-types' || serviceTypesLoaded) return;

    loadServiceTypes();
  }, [loadServiceTypes, section, serviceTypesLoaded]);

  useEffect(() => {
    if (section !== 'providers' && section !== 'dashboard') return;

    const timeoutId = window.setTimeout(() => {
      loadProviders();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadProviders, section]);

  // ── Service type helpers ────────────────────────────────────────
  const openCreate = () => {
    setEditId(null); setFormName(''); setFormDesc('');
    setFormIcon('🔧'); setFormColor('#6366F1'); setFormParentId(''); setFormError('');
    setShowForm(true);
  };

  const openEdit = (st: ServiceType) => {
    setEditId(st.id); setFormName(st.name); setFormDesc(st.description);
    setFormIcon(st.icon); setFormColor(st.color); setFormParentId(st.parentId || ''); setFormError('');
    setShowForm(true);
  };

  const getChildTypes = (parentId?: string) =>
    serviceTypes.filter(type => (type.parentId || '') === (parentId || ''));

  const getDescendantIds = (id: string): string[] => {
    const children = getChildTypes(id);
    return children.flatMap(child => [child.id, ...getDescendantIds(child.id)]);
  };

  const getServiceTypeLevel = (type: ServiceType): number => {
    let level = 0;
    let currentParent = type.parentId;
    while (currentParent) {
      const parent = serviceTypes.find(item => item.id === currentParent);
      if (!parent) break;
      level += 1;
      currentParent = parent.parentId;
    }
    return level;
  };

  const parentOptions = serviceTypes.filter(type => {
    if (!editId) return true;
    return type.id !== editId && !getDescendantIds(editId).includes(type.id);
  });

  const providerCategories = Array.from(new Set(providers.map(provider => provider.category).filter(Boolean))).sort();
  const providerLocations = Array.from(new Set(providers.map(provider => provider.location).filter(Boolean))).sort();
  const pendingProviders = providers.filter(provider => provider.status === 'pending').length;
  const activeProviders = providers.filter(provider => provider.status === 'active').length;
  const rejectedProviders = providers.filter(provider => provider.status === 'rejected').length;

  const toggleServiceTypeExpanded = (id: string) => {
    setExpandedServiceTypeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const saveServiceType = async () => {
    if (!formName.trim()) { setFormError('Name is required.'); return; }
    setSavingServiceType(true);
    setFormError('');

    try {
      const payload = {
        parent_id: formParentId || null,
        name: formName.trim(),
        description: formDesc.trim(),
        icon: formIcon,
        color: formColor,
      };

      if (editId) {
        const { data } = await serviceTypeApi.update(editId, payload);
        setServiceTypes(prev => prev.map(s => (s.id === editId ? mapServiceType(data) : s)));
      } else {
        const { data } = await serviceTypeApi.create({
          ...payload,
          slug: makeServiceTypeSlug(formName),
          active: true,
          sort_order: serviceTypes.length + 1,
        });
        setServiceTypes(prev => [...prev, mapServiceType(data)]);
      }
      setShowForm(false);
    } catch {
      setFormError('Could not save this service type. Please try again.');
    } finally {
      setSavingServiceType(false);
    }
  };

  const deleteServiceType = async (id: string) => {
    const deleteIds = [id, ...getDescendantIds(id)];
    const previousServiceTypes = serviceTypes;
    const previousExpandedIds = expandedServiceTypeIds;

    setServiceTypes(prev => prev.filter(s => !deleteIds.includes(s.id)));
    setExpandedServiceTypeIds(prev => prev.filter(item => !deleteIds.includes(item)));
    setServiceTypesError('');

    try {
      await serviceTypeApi.delete(id);
    } catch {
      setServiceTypes(previousServiceTypes);
      setExpandedServiceTypeIds(previousExpandedIds);
      setServiceTypesError('Could not delete this service type.');
    }
  };
  const toggleActive = async (id: string) => {
    const current = serviceTypes.find(s => s.id === id);
    if (!current) return;

    setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    setServiceTypesError('');

    try {
      const { data } = await serviceTypeApi.updateStatus(id, !current.active);
      setServiceTypes(prev => prev.map(s => s.id === id ? mapServiceType(data) : s));
    } catch {
      setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, active: current.active } : s));
      setServiceTypesError('Could not update service type status.');
    }
  };

  const updateProviderStatus = async (id: string, nextStatus: 'active' | 'rejected') => {
    const previousProviders = providers;
    setUpdatingProviderId(id);
    setProvidersError('');
    setProviders(prev => prev.map(provider => (
      provider.id === id ? { ...provider, status: nextStatus } : provider
    )));

    try {
      if (nextStatus === 'active') {
        await adminApi.approveProvider(id);
      } else {
        await adminApi.rejectProvider(id);
      }
      await loadProviders();
    } catch {
      setProviders(previousProviders);
      setProvidersError(`Could not ${nextStatus === 'active' ? 'approve' : 'reject'} this provider.`);
    } finally {
      setUpdatingProviderId(null);
    }
  };

  // ── Section renderers ───────────────────────────────────────────
  const renderDashboard = () => (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
        Welcome back, {user?.name || 'Admin'} 👋
      </h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Providers Loaded" value={String(providers.length)} accent="#3B82F6" />
        <StatCard label="Active Providers" value={String(providers.filter(provider => provider.status === 'active').length)} accent="#6366F1" />
        <StatCard label="Pending Providers" value={String(providers.filter(provider => provider.status === 'pending').length)} accent="#10B981" />
        <StatCard label="Revenue" value="API required" accent="#F59E0B" />
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
            {providers.filter(provider => provider.status === 'pending').map(row => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-bold text-slate-900 dark:text-white">{row.businessName}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{row.category}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{row.location}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => updateProviderStatus(row.id, 'active')} className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 text-green-600 dark:text-green-400 font-medium px-4 py-1.5 rounded-lg text-sm border border-green-200 dark:border-green-800 transition-colors">Approve</button>
                  <button onClick={() => updateProviderStatus(row.id, 'rejected')} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600 dark:text-red-400 font-medium px-4 py-1.5 rounded-lg text-sm border border-red-200 dark:border-red-800 transition-colors">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderServiceTypeNode = (st: ServiceType, level = 0): React.ReactNode => {
    const children = getChildTypes(st.id);
    const isExpanded = expandedServiceTypeIds.includes(st.id);
    const levelLabel = level === 0 ? 'Parent' : level === 1 ? 'Child' : 'Sub-child';

    return (
      <div key={st.id} className="space-y-3">
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
          style={{ marginLeft: level ? Math.min(level * 28, 84) : 0 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {children.length > 0 ? (
                <button
                  onClick={() => toggleServiceTypeExpanded(st.id)}
                  className="mt-1 w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
                  aria-label={isExpanded ? `Collapse ${st.name}` : `Expand ${st.name}`}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="mt-1 w-8 h-8 shrink-0" />
              )}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0"
                style={{ backgroundColor: st.color + '20', border: `1.5px solid ${st.color}40` }}>
                {st.icon}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900 dark:text-white">{st.name}</p>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {levelLabel}
                  </span>
                  {children.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {children.length} child{children.length === 1 ? '' : 'ren'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{st.description || 'No description added.'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleActive(st.id)}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${st.active
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                {st.active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => openEdit(st)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => deleteServiceType(st.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>

        {children.length > 0 && isExpanded && (
          <div className="space-y-3">
            {children.map(child => renderServiceTypeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderServiceTypes = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Service Types</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage parent, child, and sub-child service types for every kind of provider.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={serviceTypesLoading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Service Type
        </button>
      </div>

      {serviceTypesError && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {serviceTypesError}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            {editId ? 'Edit Service Type' : 'New Service Type'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Parent Type</label>
              <select
                value={formParentId}
                onChange={e => setFormParentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No parent - top level service type</option>
                {parentOptions.map(type => (
                  <option key={type.id} value={type.id}>
                    {'— '.repeat(getServiceTypeLevel(type))}{type.name}
                  </option>
                ))}
              </select>
            </div>
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
              disabled={savingServiceType}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              <Check className="w-4 h-4" /> {savingServiceType ? 'Saving...' : editId ? 'Save Changes' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)}
              disabled={savingServiceType}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Parent Types" value={getChildTypes().length.toString()} accent="#3B82F6" />
        <StatCard label="Total Types" value={serviceTypes.length.toString()} accent="#6366F1" />
        <StatCard label="Sub Types" value={serviceTypes.filter(type => type.parentId).length.toString()} accent="#10B981" />
        <StatCard label="Active Types" value={serviceTypes.filter(type => type.active).length.toString()} accent="#F59E0B" />
      </div>

      

      {/* Service type hierarchy */}
      <div className="space-y-4">
        {serviceTypesLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Grid3X3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Loading service types...</p>
          </div>
        )}

        {getChildTypes().map(st => (
          <div key={st.id}
            className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="space-y-3">
              {renderServiceTypeNode(st)}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!serviceTypesLoading && serviceTypes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
            <Grid3X3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No service types yet.</p>
            <button onClick={openCreate} className="mt-4 text-sm text-indigo-500 hover:underline">Create one</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderServices = () => {
    return (
      <div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">All Services</h1>
            <p className="text-sm text-slate-500 mt-0.5">Service administration needs a production API endpoint before records can be shown here.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="font-medium">No service records are rendered from static data.</p>
          <p className="mt-2 text-sm">Add an admin services API to enable this production view.</p>
        </div>
      </div>
    );
  };

  const renderProviders = () => (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Manage Providers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Search, filter, approve, and reject provider accounts.</p>
        </div>
        <button
          onClick={loadProviders}
          disabled={providersLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${providersLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Providers" value={providers.length.toString()} accent="#3B82F6" />
        <StatCard label="Active" value={activeProviders.toString()} accent="#10B981" />
        <StatCard label="Pending" value={pendingProviders.toString()} accent="#F59E0B" />
        <StatCard label="Rejected" value={rejectedProviders.toString()} accent="#EF4444" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_180px] gap-3">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={providerSearch}
                onChange={e => setProviderSearch(e.target.value)}
                placeholder="Search business, category, or location"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <select
              value={providerStatusFilter}
              onChange={e => setProviderStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={providerCategoryFilter}
              onChange={e => setProviderCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All categories</option>
              {providerCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={providerLocationFilter}
              onChange={e => setProviderLocationFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All locations</option>
              {providerLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>

        {providersError && (
          <div className="mx-5 mt-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {providersError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {['Provider', 'Category', 'Location', 'Status', 'Joined', 'Actions'].map(header => (
                  <th key={header} className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providersLoading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
                    <p className="font-medium">Loading providers...</p>
                  </td>
                </tr>
              )}

              {!providersLoading && providers.map(provider => (
                <tr key={provider.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 min-w-72">
                    <div className="flex items-center gap-3">
                      {provider.profileImage ? (
                        <img src={provider.profileImage} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{provider.businessName}</p>
                        <p className="text-xs text-slate-500 truncate">{provider.email || provider.ownerName || 'No contact added'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{provider.category || 'Unassigned'}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{provider.location || 'Not set'}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${providerStatusClass(provider.status)}`}>
                      {formatProviderStatus(provider.status)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                    {provider.createdAt ? new Date(provider.createdAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateProviderStatus(provider.id, 'active')}
                        disabled={updatingProviderId === provider.id || provider.status === 'active'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => updateProviderStatus(provider.id, 'rejected')}
                        disabled={updatingProviderId === provider.id || provider.status === 'rejected'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!providersLoading && providers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No providers match these filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => <MessagesPanel />;

  const renderSettings = () => (
    <div>
      <SettingsPanel />
    </div>
  );

  const renderSectionContent = () => {
    switch (section) {
      case 'dashboard':
        return renderDashboard();
      case 'services':
        return renderServices();
      case 'service-types':
        return renderServiceTypes();
      case 'providers':
        return renderProviders();
      case 'messages':
        return renderMessages();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
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
        {renderSectionContent()}
      </main>
    </div>
  );
}
