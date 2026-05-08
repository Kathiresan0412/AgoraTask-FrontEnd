"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Users, Layers, Settings, ShieldAlert,
  LogOut, Plus, Trash2, Edit2, Check, X, Zap,
  ChevronRight, ChevronDown, Tag, Grid3X3, MessageSquare, Briefcase,
  ClipboardList, Search, RefreshCw, Star, History, Activity, ImagePlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { MessagesPanel } from '@/components/chat/MessagesPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { adminApi, serviceTypeApi } from '@/lib/api';
import type { AdminActivityLogDto, AdminLoginHistoryDto, AdminProviderDto, AdminReviewDto, AdminServiceDto, ServiceTypeDto } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image'; 
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';
import { IMAGE_UPLOAD_TERMS, readImageFileAsDataUrl } from '@/lib/image-upload';

// ── Types ────────────────────────────────────────────────────────
interface ServiceType {
  id: string;
  parentId?: string;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
  color: string;
  active: boolean;
}

// ── Sidebar nav items ─────────────────────────────────────────────
type Section = 'dashboard' | 'services' | 'reviews' | 'service-types' | 'providers' | 'login-history' | 'activity-logs' | 'messages' | 'settings';
const SECTIONS: Section[] = ['dashboard', 'services', 'reviews', 'service-types', 'providers', 'login-history', 'activity-logs', 'messages', 'settings'];
type AdminRejectTarget = { type: 'provider' | 'service'; id: string; name: string } | null;

const NAV = [
  { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'services' as Section, label: 'Services', icon: Briefcase },
  { id: 'reviews' as Section, label: 'Reviews', icon: Star },
  { id: 'service-types' as Section, label: 'Service Types', icon: Layers },
  { id: 'providers' as Section, label: 'Providers', icon: Users },
  { id: 'login-history' as Section, label: 'Login History', icon: History },
  { id: 'activity-logs' as Section, label: 'Activity Logs', icon: Activity },
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

function ServiceTypeTreeSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading service types">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProviderTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-slate-100 dark:border-slate-800/50">
          <td className="p-4 min-w-72">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
          </td>
          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
          <td className="p-4"><Skeleton className="h-4 w-28" /></td>
          <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
          <td className="p-4">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
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

function serviceStatusClass(status: AdminServiceDto['status']) {
  if (status === 'active') {
    return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
  }
  if (status === 'pending_review') {
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  if (status === 'rejected') {
    return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
}

function formatServiceStatus(status: AdminServiceDto['status']) {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function reviewStatusClass(status: AdminReviewDto['status']) {
  if (status === 'visible') {
    return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
  }
  if (status === 'pending') {
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  if (status === 'hidden') {
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
  return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
}

function formatReviewStatus(status: AdminReviewDto['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function loginStatusClass(success: boolean) {
  return success
    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
    : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
}

function formatActionLabel(action: string) {
  return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatUserAgent(userAgent: string) {
  if (!userAgent) return 'Unknown device';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Postman')) return 'Postman';
  return userAgent.slice(0, 42);
}

function mapServiceType(row: ServiceTypeDto): ServiceType {
  return {
    id: row.id,
    parentId: row.parent_id || undefined,
    name: row.name,
    description: row.description || '',
    icon: row.icon || '🔧',
    imageUrl: row.image_url || row.imageUrl || '',
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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [section, setSection] = useState<Section>(SECTIONS.includes(tabParam as Section) ? tabParam as Section : 'dashboard');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypesLoading, setServiceTypesLoading] = useState(true);
  const [serviceTypesLoaded, setServiceTypesLoaded] = useState(false);
  const [serviceTypesError, setServiceTypesError] = useState('');
  const [savingServiceType, setSavingServiceType] = useState(false);
  const [services, setServices] = useState<AdminServiceDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);
  const [providers, setProviders] = useState<AdminProviderDto[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerStatusFilter, setProviderStatusFilter] = useState('all');
  const [providerCategoryFilter, setProviderCategoryFilter] = useState('all');
  const [providerLocationFilter, setProviderLocationFilter] = useState('all');
  const [updatingProviderId, setUpdatingProviderId] = useState<string | null>(null);
  const [loginHistory, setLoginHistory] = useState<AdminLoginHistoryDto[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginHistoryError, setLoginHistoryError] = useState('');
  const [loginSearch, setLoginSearch] = useState('');
  const [loginSuccessFilter, setLoginSuccessFilter] = useState('all');
  const [loginFromFilter, setLoginFromFilter] = useState('');
  const [loginToFilter, setLoginToFilter] = useState('');
  const [activityLogs, setActivityLogs] = useState<AdminActivityLogDto[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityLogsError, setActivityLogsError] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityActionFilter, setActivityActionFilter] = useState('all');
  const [activityEntityFilter, setActivityEntityFilter] = useState('all');
  const [activityFromFilter, setActivityFromFilter] = useState('');
  const [activityToFilter, setActivityToFilter] = useState('');
  const [expandedServiceTypeIds, setExpandedServiceTypeIds] = useState<string[]>([]);
  const [adminRejectTarget, setAdminRejectTarget] = useState<AdminRejectTarget>(null);

  // Create-form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formColor, setFormColor] = useState('#6366F1');
  const [formParentId, setFormParentId] = useState('');
  const [formError, setFormError] = useState('');
  const serviceTypeImageInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => { logout(); router.push(`/${country}/login`); };
  const selectSection = (nextSection: Section) => {
    setSection(nextSection);
    router.push(`/${country}/admin?tab=${nextSection}`, { scroll: false });
  };

  useEffect(() => {
    if (SECTIONS.includes(tabParam as Section)) {
      setSection(tabParam as Section);
      return;
    }

    setSection('dashboard');
  }, [tabParam]);

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

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError('');
    try {
      const { data } = await adminApi.listServices();
      setServices(data);
      setServicesLoaded(true);
    } catch {
      setServicesError('Could not load services from the database.');
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const { data } = await adminApi.listReviews(reviewStatusFilter);
      setReviews(data);
    } catch {
      setReviewsError('Could not load reviews from the database.');
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewStatusFilter]);

  const loadLoginHistory = useCallback(async () => {
    setLoginHistoryLoading(true);
    setLoginHistoryError('');
    try {
      const { data } = await adminApi.listLoginHistory({
        search: loginSearch.trim() || undefined,
        success: loginSuccessFilter,
        from: loginFromFilter || undefined,
        to: loginToFilter || undefined,
      });
      setLoginHistory(data);
    } catch {
      setLoginHistoryError('Could not load login history from the database.');
    } finally {
      setLoginHistoryLoading(false);
    }
  }, [loginFromFilter, loginSearch, loginSuccessFilter, loginToFilter]);

  const loadActivityLogs = useCallback(async () => {
    setActivityLogsLoading(true);
    setActivityLogsError('');
    try {
      const { data } = await adminApi.listActivityLogs({
        search: activitySearch.trim() || undefined,
        action: activityActionFilter,
        entityType: activityEntityFilter,
        from: activityFromFilter || undefined,
        to: activityToFilter || undefined,
      });
      setActivityLogs(data);
    } catch {
      setActivityLogsError('Could not load activity logs from the database.');
    } finally {
      setActivityLogsLoading(false);
    }
  }, [activityActionFilter, activityEntityFilter, activityFromFilter, activitySearch, activityToFilter]);

  useEffect(() => {
    if (section !== 'service-types' || serviceTypesLoaded) return;

    loadServiceTypes();
  }, [loadServiceTypes, section, serviceTypesLoaded]);

  useEffect(() => {
    if (section !== 'services' || servicesLoaded) return;

    loadServices();
  }, [loadServices, section, servicesLoaded]);

  useEffect(() => {
    if (section !== 'reviews') return;

    loadReviews();
  }, [loadReviews, section]);

  useEffect(() => {
    if (section !== 'providers' && section !== 'dashboard') return;

    const timeoutId = window.setTimeout(() => {
      loadProviders();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadProviders, section]);

  useEffect(() => {
    if (section !== 'login-history') return;

    const timeoutId = window.setTimeout(() => {
      loadLoginHistory();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadLoginHistory, section]);

  useEffect(() => {
    if (section !== 'activity-logs') return;

    const timeoutId = window.setTimeout(() => {
      loadActivityLogs();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadActivityLogs, section]);

  // ── Service type helpers ────────────────────────────────────────
  const openCreate = () => {
    setEditId(null); setFormName(''); setFormDesc('');
    setFormIcon('🔧'); setFormImageUrl(''); setFormColor('#6366F1'); setFormParentId(''); setFormError('');
    setShowForm(true);
  };

  const openEdit = (st: ServiceType) => {
    setEditId(st.id); setFormName(st.name); setFormDesc(st.description);
    setFormIcon(st.icon); setFormImageUrl(st.imageUrl); setFormColor(st.color); setFormParentId(st.parentId || ''); setFormError('');
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
  const activityActions = Array.from(new Set(activityLogs.map(log => log.action).filter(Boolean))).sort();
  const activityEntityTypes = Array.from(new Set(activityLogs.map(log => log.entityType).filter(Boolean))).sort();

  const toggleServiceTypeExpanded = (id: string) => {
    setExpandedServiceTypeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleServiceTypeImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError('');
    try {
      setFormImageUrl(await readImageFileAsDataUrl(file));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not read this service type image.');
    } finally {
      event.target.value = '';
    }
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
        image_url: formImageUrl || null,
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
      setAdminRejectTarget(null);
      toast.success(nextStatus === 'active' ? 'Provider approved.' : 'Provider rejected.');
    } catch {
      setProviders(previousProviders);
      setProvidersError(`Could not ${nextStatus === 'active' ? 'approve' : 'reject'} this provider.`);
      toast.error(`Could not ${nextStatus === 'active' ? 'approve' : 'reject'} this provider.`);
    } finally {
      setUpdatingProviderId(null);
    }
  };

  const updateServiceStatus = async (id: string, nextStatus: 'active' | 'rejected') => {
    const previousServices = services;
    setUpdatingServiceId(id);
    setServicesError('');
    setServices(prev => prev.map(service => (
      service.id === id ? { ...service, status: nextStatus } : service
    )));

    try {
      if (nextStatus === 'active') {
        await adminApi.approveService(id);
      } else {
        await adminApi.rejectService(id);
      }
      await loadServices();
      setAdminRejectTarget(null);
      toast.success(nextStatus === 'active' ? 'Service approved.' : 'Service rejected.');
    } catch {
      setServices(previousServices);
      setServicesError(`Could not ${nextStatus === 'active' ? 'approve' : 'reject'} this service.`);
      toast.error(`Could not ${nextStatus === 'active' ? 'approve' : 'reject'} this service.`);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const updateReviewStatus = async (id: string, nextStatus: AdminReviewDto['status']) => {
    const previousReviews = reviews;
    setUpdatingReviewId(id);
    setReviewsError('');
    setReviews(prev => prev.map(review => (
      review.id === id ? { ...review, status: nextStatus } : review
    )));

    try {
      const { data } = await adminApi.updateReviewStatus(id, nextStatus);
      setReviews(prev => {
        const nextReviews = nextStatus === 'deleted'
          ? prev.filter(review => review.id !== id)
          : prev.map(review => review.id === id ? data : review);
        return reviewStatusFilter === 'all' ? nextReviews : nextReviews.filter(review => review.status === reviewStatusFilter);
      });
    } catch {
      setReviews(previousReviews);
      setReviewsError('Could not update this review.');
    } finally {
      setUpdatingReviewId(null);
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
        {/* <StatCard label="Revenue" value="API required" accent="#F59E0B" /> */}
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
                  <button onClick={() => setAdminRejectTarget({ type: 'provider', id: row.id, name: row.businessName })} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600 dark:text-red-400 font-medium px-4 py-1.5 rounded-lg text-sm border border-red-200 dark:border-red-800 transition-colors">Reject</button>
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
              <div className="w-11 h-11 overflow-hidden rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0"
                style={{ backgroundColor: st.color + '20', border: `1.5px solid ${st.color}40` }}>
                {st.imageUrl ? (
                  <img src={st.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  st.icon
                )}
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
            <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  {formImageUrl ? (
                    <img src={formImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <ImagePlus className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Service type image</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{IMAGE_UPLOAD_TERMS}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => serviceTypeImageInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {formImageUrl ? 'Change image' : 'Upload image'}
                    </button>
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={serviceTypeImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleServiceTypeImageChange} />
                </div>
              </div>
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
        {serviceTypesLoading && <ServiceTypeTreeSkeleton />}

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
    const activeServices = services.filter(service => service.status === 'active').length;
    const pendingServices = services.filter(service => service.status === 'pending_review').length;
    const draftServices = services.filter(service => service.status === 'draft').length;

    return (
      <div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">All Services</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review services created by providers across the marketplace.</p>
          </div>
          <button
            onClick={loadServices}
            disabled={servicesLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${servicesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Services" value={services.length.toString()} accent="#3B82F6" />
          <StatCard label="Active" value={activeServices.toString()} accent="#10B981" />
          <StatCard label="Pending Review" value={pendingServices.toString()} accent="#F59E0B" />
          <StatCard label="Drafts" value={draftServices.toString()} accent="#6366F1" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {servicesError && (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {servicesError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {['Service', 'Provider', 'Categories', 'Price', 'Status', 'Created', 'Actions'].map(header => (
                    <th key={header} className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servicesLoading && Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 min-w-72">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-4 w-44" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-40 rounded-lg" /></td>
                  </tr>
                ))}

                {!servicesLoading && services.map(service => (
                  <tr key={service.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 min-w-72">
                      <div className="flex items-center gap-3">
                        {service.images[0] ? (
                          <img src={service.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{service.title}</p>
                          <p className="text-xs text-slate-500 truncate">{service.description || 'No description added'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{service.provider.name}</p>
                        <p className="text-xs text-slate-500">{service.provider.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {service.serviceTypes.length ? service.serviceTypes.map(type => type.name).join(', ') : 'Unassigned'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {service.basePrice ? `${service.basePrice} ${service.priceType}` : 'Quote'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${serviceStatusClass(service.status)}`}>
                        {formatServiceStatus(service.status)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                      {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateServiceStatus(service.id, 'active')}
                          disabled={updatingServiceId === service.id || service.status === 'active'}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setAdminRejectTarget({ type: 'service', id: service.id, name: service.title })}
                          disabled={updatingServiceId === service.id || service.status === 'rejected'}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!servicesLoading && services.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No services found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
              {providersLoading && <ProviderTableSkeletonRows />}

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
                        onClick={() => setAdminRejectTarget({ type: 'provider', id: provider.id, name: provider.businessName })}
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

  const renderReviews = () => {
    const pendingReviews = reviews.filter(review => review.status === 'pending').length;
    const visibleReviews = reviews.filter(review => review.status === 'visible').length;
    const hiddenReviews = reviews.filter(review => review.status === 'hidden').length;

    return (
      <div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Review Moderation</h1>
            <p className="text-sm text-slate-500 mt-0.5">Approve public feedback before it appears on provider and service pages.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={reviewStatusFilter}
              onChange={event => setReviewStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All reviews</option>
              <option value="pending">Pending</option>
              <option value="visible">Approved</option>
              <option value="hidden">Hidden</option>
            </select>
            <button
              onClick={loadReviews}
              disabled={reviewsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Loaded Reviews" value={reviews.length.toString()} accent="#3B82F6" />
          <StatCard label="Pending" value={pendingReviews.toString()} accent="#F59E0B" />
          <StatCard label="Approved" value={visibleReviews.toString()} accent="#10B981" />
          <StatCard label="Hidden" value={hiddenReviews.toString()} accent="#64748B" />
        </div>

        {reviewsError && (
          <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {reviewsError}
          </div>
        )}

        <div className="grid gap-4">
          {reviewsLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}

          {!reviewsLoading && reviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{review.customerName}</p>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${reviewStatusClass(review.status)}`}>
                      {formatReviewStatus(review.status)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                      <Star className="h-4 w-4 fill-amber-500" /> {review.rating}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {review.customerEmail || 'No email'} · Provider: {review.providerName}{review.serviceTitle ? ` · Service: ${review.serviceTitle}` : ''}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment || 'No written comment.'}</p>
                  <p className="mt-2 text-xs text-slate-400">{review.createdAt ? new Date(review.createdAt).toLocaleString() : 'Unknown date'}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    onClick={() => updateReviewStatus(review.id, 'visible')}
                    disabled={updatingReviewId === review.id || review.status === 'visible'}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => updateReviewStatus(review.id, 'hidden')}
                    disabled={updatingReviewId === review.id || review.status === 'hidden'}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Hide
                  </button>
                  <button
                    onClick={() => updateReviewStatus(review.id, 'deleted')}
                    disabled={updatingReviewId === review.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!reviewsLoading && reviews.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No reviews match this filter.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLoginHistory = () => {
    const successfulLogins = loginHistory.filter(entry => entry.success).length;
    const failedLogins = loginHistory.filter(entry => !entry.success).length;

    return (
      <div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Login History</h1>
            <p className="text-sm text-slate-500 mt-0.5">Audit successful and failed login attempts across user accounts.</p>
          </div>
          <button
            onClick={loadLoginHistory}
            disabled={loginHistoryLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loginHistoryLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Loaded Attempts" value={loginHistory.length.toString()} accent="#3B82F6" />
          <StatCard label="Successful" value={successfulLogins.toString()} accent="#10B981" />
          <StatCard label="Failed" value={failedLogins.toString()} accent="#EF4444" />
          <StatCard label="Unique Emails" value={new Set(loginHistory.map(entry => entry.email)).size.toString()} accent="#6366F1" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_170px_160px_160px] gap-3">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={loginSearch}
                  onChange={event => setLoginSearch(event.target.value)}
                  placeholder="Search by email"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <input
                type="date"
                value={loginFromFilter}
                onChange={event => setLoginFromFilter(event.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Login history start date"
              />
              <input
                type="date"
                value={loginToFilter}
                onChange={event => setLoginToFilter(event.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Login history end date"
              />
            </div>
          </div>

          {loginHistoryError && (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {loginHistoryError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {['Email', 'User', 'Status', 'Reason', 'IP', 'Device', 'Time'].map(header => (
                    <th key={header} className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loginHistoryLoading && Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800/50">
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="p-4"><Skeleton className="h-4 w-28" /></td>
                    ))}
                  </tr>
                ))}

                {!loginHistoryLoading && loginHistory.map(entry => (
                  <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">{entry.email}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {entry.user ? `${entry.user.name || entry.user.email} (${entry.user.role})` : 'Unknown'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${loginStatusClass(entry.success)}`}>
                        {entry.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{entry.failureReason || '-'}</td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{entry.ipAddress || '-'}</td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{formatUserAgent(entry.userAgent)}</td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown'}
                    </td>
                  </tr>
                ))}

                {!loginHistoryLoading && loginHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No login attempts match these filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderActivityLogs = () => (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track admin actions such as provider approvals, service moderation, and review changes.</p>
        </div>
        <button
          onClick={loadActivityLogs}
          disabled={activityLogsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${activityLogsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Loaded Events" value={activityLogs.length.toString()} accent="#3B82F6" />
        <StatCard label="Actions" value={activityActions.length.toString()} accent="#6366F1" />
        <StatCard label="Entity Types" value={activityEntityTypes.length.toString()} accent="#10B981" />
        <StatCard label="Actors" value={new Set(activityLogs.map(entry => entry.actorEmail || entry.actorId).filter(Boolean)).size.toString()} accent="#F59E0B" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_190px_170px_160px_160px] gap-3">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={activitySearch}
                onChange={event => setActivitySearch(event.target.value)}
                placeholder="Search action or entity type"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <select
              value={activityActionFilter}
              onChange={event => setActivityActionFilter(event.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All actions</option>
              {activityActions.map(action => (
                <option key={action} value={action}>{formatActionLabel(action)}</option>
              ))}
            </select>
            <select
              value={activityEntityFilter}
              onChange={event => setActivityEntityFilter(event.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All entities</option>
              {activityEntityTypes.map(entityType => (
                <option key={entityType} value={entityType}>{formatActionLabel(entityType)}</option>
              ))}
            </select>
            <input
              type="date"
              value={activityFromFilter}
              onChange={event => setActivityFromFilter(event.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Activity log start date"
            />
            <input
              type="date"
              value={activityToFilter}
              onChange={event => setActivityToFilter(event.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Activity log end date"
            />
          </div>
        </div>

        {activityLogsError && (
          <div className="mx-5 mt-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {activityLogsError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {['Actor', 'Action', 'Entity', 'Metadata', 'IP', 'Time'].map(header => (
                  <th key={header} className="p-4 font-semibold text-sm text-slate-500 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLogsLoading && Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-slate-100 dark:border-slate-800/50">
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="p-4"><Skeleton className="h-4 w-32" /></td>
                  ))}
                </tr>
              ))}

              {!activityLogsLoading && activityLogs.map(entry => (
                <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <p className="font-semibold text-slate-900 dark:text-white">{entry.actorName || 'System'}</p>
                    <p className="text-xs text-slate-500">{entry.actorEmail || entry.actorRole || 'No actor'}</p>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatActionLabel(entry.action)}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {entry.entityType ? formatActionLabel(entry.entityType) : '-'}
                    {entry.entityId ? <span className="block max-w-40 truncate text-xs text-slate-400">{entry.entityId}</span> : null}
                  </td>
                  <td className="p-4 text-xs text-slate-500 max-w-72 truncate">
                    {Object.keys(entry.metadata || {}).length ? JSON.stringify(entry.metadata) : '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{entry.ipAddress || '-'}</td>
                  <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown'}
                  </td>
                </tr>
              ))}

              {!activityLogsLoading && activityLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No activity logs match these filters.</p>
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
      case 'reviews':
        return renderReviews();
      case 'service-types':
        return renderServiceTypes();
      case 'providers':
        return renderProviders();
      case 'login-history':
        return renderLoginHistory();
      case 'activity-logs':
        return renderActivityLogs();
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
      <ConfirmationDialog
        open={Boolean(adminRejectTarget)}
        title={`Reject this ${adminRejectTarget?.type || 'item'}?`}
        description={adminRejectTarget ? `${adminRejectTarget.name} will be marked as rejected and removed from the active approval flow.` : ''}
        confirmLabel={adminRejectTarget?.type === 'service' ? 'Reject service' : 'Reject provider'}
        cancelLabel="Keep pending"
        loading={Boolean(
          adminRejectTarget?.type === 'provider'
            ? updatingProviderId === adminRejectTarget.id
            : adminRejectTarget?.type === 'service' && updatingServiceId === adminRejectTarget.id
        )}
        onConfirm={() => {
          if (!adminRejectTarget) return;
          if (adminRejectTarget.type === 'provider') {
            updateProviderStatus(adminRejectTarget.id, 'rejected');
            return;
          }
          updateServiceStatus(adminRejectTarget.id, 'rejected');
        }}
        onCancel={() => setAdminRejectTarget(null)}
      />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-slate-900 dark:bg-slate-950 flex flex-col border-r border-slate-800 min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          {/* <div className="bg-indigo-600 p-2 rounded-xl">
            <Zap className="w-5 h-5 text-white" />
          </div> */}
           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm shadow-slate-200/70 ring-1 ring-black/5 dark:border-neutral-800 dark:shadow-none dark:ring-white/10">
                <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" priority />
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
                onClick={() => selectSection(item.id)}
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
