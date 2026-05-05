"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase, Calendar, MessageSquare, DollarSign,
  Settings, Star, Zap,
  LogOut, ChevronRight, ChevronDown, BarChart2, Plus, MapPin, Save, Crosshair, X, Menu, Check, Tag, Edit3, Trash2, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { MessagesPanel } from '@/components/chat/MessagesPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button, Combobox, Input, Textarea } from 'geist/components';
import { providerApi, reviewApi, serviceTypeApi } from '@/lib/api';
import type { ProviderServiceDto, ReviewDto, ServiceTypeDto } from '@/lib/api';
import { findNearestLocation, getCitiesByDistrict, getCountryLocations, getDistrictsByProvince, getLocationLabel, normalizeCountryCode } from '@/lib/locations';
import { formatServicePrice } from '@/lib/countries';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

type Section = 'overview' | 'services' | 'bookings' | 'messages' | 'earnings' | 'settings';

const SECTIONS: Section[] = ['overview', 'services', 'bookings', 'messages', 'earnings', 'settings'];

const NAV: { id: Section; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'bookings', label: 'Bookings', icon: Calendar, badge: 3 },
  { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 1 },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const isImageSource = (value?: string | null) =>
  Boolean(value && (/^https?:\/\//.test(value) || value.startsWith('/') || value.startsWith('data:image/')));

const getServiceTypeImage = (type: ServiceTypeDto) => type.image_url || type.imageUrl || (isImageSource(type.icon) ? type.icon : null);

const formatReviewDate = (value: string) => new Date(value).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function ServiceTypeVisual({ type, selected = false }: { type: ServiceTypeDto; selected?: boolean }) {
  const image = getServiceTypeImage(type);

  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-slate-500 ${
      selected
        ? 'border-white/15 bg-white/10 text-white'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }`}>
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : type.icon ? (
        <span className="text-base leading-none">{type.icon}</span>
      ) : (
        <Tag className="h-4 w-4" />
      )}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + '20', color: accent }}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function ProviderServiceSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  const { user, logout } = useAuth();
  const { unreadCount } = useMessages();
  const params = useParams();
  const country = params?.country as string || 'lk';
  const countryCode = normalizeCountryCode(country);
  const isCanada = countryCode === 'ca';
  const locations = getCountryLocations(countryCode);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [section, setSection] = useState<Section>(SECTIONS.includes(tabParam as Section) ? tabParam as Section : 'overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [services, setServices] = useState<ProviderServiceDto[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formPriceType, setFormPriceType] = useState<'fixed' | 'hourly' | 'quote'>('fixed');
  const [formDuration, setFormDuration] = useState('');
  const [formStatus, setFormStatus] = useState<ProviderServiceDto['status']>('active');
  const [formServiceTypeIds, setFormServiceTypeIds] = useState<string[]>([]);
  const [expandedServiceTypeIds, setExpandedServiceTypeIds] = useState<string[]>([]);
  const [formProvinceId, setFormProvinceId] = useState('');
  const [formDistrictId, setFormDistrictId] = useState('');
  const [formCityId, setFormCityId] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [serviceReviews, setServiceReviews] = useState<Record<string, ReviewDto[]>>({});
  const [reviewPanelsOpen, setReviewPanelsOpen] = useState<string[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<Record<string, boolean>>({});
  const [reviewsError, setReviewsError] = useState<Record<string, string>>({});
  const priceTypeComboboxId = React.useId();
  const statusComboboxId = React.useId();
  const provinceComboboxId = React.useId();
  const districtComboboxId = React.useId();
  const cityComboboxId = React.useId();

  const handleLogout = () => { logout(); router.push(`/${country}/login`); };
  const selectSection = (nextSection: Section) => {
    setSection(nextSection);
    setMobileNavOpen(false);
    router.push(`/${country}/provider-dashboard?tab=${nextSection}`, { scroll: false });
  };

  useEffect(() => {
    if (SECTIONS.includes(tabParam as Section)) {
      setSection(tabParam as Section);
      return;
    }

    setSection('overview');
  }, [tabParam]);

  const loadServicesData = useCallback(async () => {
    setServicesLoading(true);
    setServicesError('');
    try {
      const [servicesResponse, typesResponse] = await Promise.all([
        providerApi.listServices(),
        serviceTypeApi.list(),
      ]);
      setServices(servicesResponse.data);
      setServiceTypes(typesResponse.data.filter(type => type.active));
      setServicesLoaded(true);
    } catch {
      setServicesError('Could not load your services.');
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if ((section === 'overview' || section === 'services') && !servicesLoaded) {
      loadServicesData();
    }
  }, [loadServicesData, section, servicesLoaded]);

  const providerDistricts = getDistrictsByProvince(formProvinceId, countryCode);
  const effectiveFormDistrictId = isCanada ? providerDistricts[0]?.id || '' : formDistrictId;
  const providerCities = isCanada
    ? providerDistricts.flatMap(district => district.cities)
    : getCitiesByDistrict(formProvinceId, formDistrictId, countryCode);
  const rootServiceTypes = serviceTypes.filter(type => !type.parent_id);
  const childServiceTypesByParent = serviceTypes.reduce<Record<string, ServiceTypeDto[]>>((groups, type) => {
    if (!type.parent_id) return groups;
    return {
      ...groups,
      [type.parent_id]: [...(groups[type.parent_id] || []), type],
    };
  }, {});

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormPriceType('fixed');
    setFormDuration('');
    setFormStatus('active');
    setFormServiceTypeIds([]);
    setExpandedServiceTypeIds([]);
    setFormProvinceId('');
    setFormDistrictId('');
    setFormCityId('');
    setLocationMessage('');
  };

  const toggleServiceTypeGroup = (id: string) => {
    setExpandedServiceTypeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleServiceType = (id: string) => {
    setFormServiceTypeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const useCurrentLocation = () => {
    setLocationMessage('');

    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const nearest = findNearestLocation(position.coords.latitude, position.coords.longitude, countryCode);
        if (nearest) {
          setFormProvinceId(nearest.provinceId);
          setFormDistrictId(nearest.districtId);
          setFormCityId(nearest.cityId);
          setLocationMessage('Service city set from your location.');
        } else {
          setLocationMessage('Could not match your location to a city.');
        }
        setDetectingLocation(false);
      },
      () => {
        setLocationMessage('Allow location access to set your city.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const openCreateServiceForm = () => {
    resetServiceForm();
    setShowServiceForm(true);
  };

  const editService = (service: ProviderServiceDto) => {
    const area = service.service_area || [];
    const provinceId = area.find(item => item.startsWith('province:'))?.replace('province:', '') || '';
    const districtId = area.find(item => item.startsWith('district:'))?.replace('district:', '') || '';
    const cityId = area.find(item => item.startsWith('city:'))?.replace('city:', '') || '';

    setEditingServiceId(service.id);
    setFormTitle(service.title);
    setFormDescription(service.description || '');
    setFormPrice(service.base_price === null || service.base_price === undefined ? '' : String(service.base_price));
    setFormPriceType(service.price_type);
    setFormDuration(service.duration_mins ? String(service.duration_mins) : '');
    setFormStatus(service.status);
    setFormServiceTypeIds(service.service_types.map(type => type.id));
    setExpandedServiceTypeIds(Array.from(new Set(service.service_types.map(type => type.parent_id).filter(Boolean) as string[])));
    setFormProvinceId(provinceId);
    setFormDistrictId(districtId);
    setFormCityId(cityId);
    setLocationMessage('');
    setServicesError('');
    setShowServiceForm(true);
  };

  const saveService = async () => {
    if (!formTitle.trim() || formServiceTypeIds.length === 0 || !formProvinceId || !effectiveFormDistrictId || !formCityId) {
      setServicesError(isCanada
        ? 'Title, at least one service type, province/territory, and city are required.'
        : 'Title, at least one service type, province, district, and city are required.'
      );
      return;
    }

    setSavingService(true);
    setServicesError('');
    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        base_price: formPrice ? Number(formPrice) : null,
        price_type: formPriceType,
        duration_mins: formDuration ? Number(formDuration) : null,
        service_area: [
          getLocationLabel(formProvinceId, effectiveFormDistrictId, formCityId, countryCode),
          `province:${formProvinceId}`,
          `district:${effectiveFormDistrictId}`,
          `city:${formCityId}`,
        ],
        images: [],
        status: formStatus,
        service_type_ids: formServiceTypeIds,
      };

      const { data } = editingServiceId
        ? await providerApi.updateService(editingServiceId, payload)
        : await providerApi.createService(payload);

      setServices(prev => editingServiceId
        ? prev.map(service => service.id === data.id ? data : service)
        : [data, ...prev]
      );
      resetServiceForm();
      setShowServiceForm(false);
    } catch {
      setServicesError(editingServiceId ? 'Could not update this service.' : 'Could not create this service.');
    } finally {
      setSavingService(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;

    setServicesError('');
    try {
      await providerApi.deleteService(serviceId);
      setServices(prev => prev.filter(service => service.id !== serviceId));
      setServiceReviews(prev => {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });
      setReviewPanelsOpen(prev => prev.filter(id => id !== serviceId));
    } catch {
      setServicesError('Could not delete this service.');
    }
  };

  const loadServiceReviews = async (serviceId: string) => {
    setReviewsLoading(prev => ({ ...prev, [serviceId]: true }));
    setReviewsError(prev => ({ ...prev, [serviceId]: '' }));
    try {
      const { data } = await reviewApi.listService(serviceId);
      setServiceReviews(prev => ({ ...prev, [serviceId]: data }));
    } catch {
      setReviewsError(prev => ({ ...prev, [serviceId]: 'Could not load reviews for this service.' }));
    } finally {
      setReviewsLoading(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const toggleReviews = async (serviceId: string) => {
    const isOpen = reviewPanelsOpen.includes(serviceId);
    setReviewPanelsOpen(prev => isOpen ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);

    if (!isOpen && !serviceReviews[serviceId]) {
      await loadServiceReviews(serviceId);
    }
  };

  const getReviewAverage = (reviews: ReviewDto[]) => {
    if (!reviews.length) return '0.0';
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  };

  // ── Section content ──────────────────────────────────────────────
  const renderOverview = () => (
    <div>
      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
        Welcome back, {user?.name || 'Provider'} 👋
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <StatCard label="Published Services" value={String(services.filter(service => service.status === 'active').length)} icon={Briefcase} accent="#10B981" />
        <StatCard label="Draft Services" value={String(services.filter(service => service.status === 'draft').length)} icon={Calendar} accent="#3B82F6" />
        <StatCard label="Reviews" value="API required" icon={Star} accent="#F59E0B" />
      </div>

      <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Service Activity</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {servicesLoading ? (
          <div className="space-y-3" aria-label="Loading services">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <p>No provider services were returned by the API.</p>
        ) : (
          <div className="space-y-3">
            {services.slice(0, 4).map(service => (
              <div key={service.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">{service.title}</p>
                  <p>{service.status}</p>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 sm:text-right">{formatServicePrice(service.base_price, service.price_type, countryCode)}</p>
              </div>
            ))}
          </div>
        )}
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

  const renderServiceTypeOption = (type: ServiceTypeDto) => {
    const selected = formServiceTypeIds.includes(type.id);

    return (
      <button
        key={type.id}
        type="button"
        onClick={() => toggleServiceType(type.id)}
        className={`flex min-h-[4.75rem] w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 dark:focus-visible:ring-white/15 ${
          selected
            ? 'border-slate-950 bg-slate-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950'
            : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-slate-600 dark:hover:bg-slate-900'
        }`}
        aria-pressed={selected}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? 'border-white bg-white text-slate-950 dark:border-slate-950 dark:bg-slate-950 dark:text-white'
            : 'border-slate-300 text-slate-400 dark:border-slate-600'
        }`}>
          {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
        <ServiceTypeVisual type={type} selected={selected} />
        <span className="min-w-0 flex-1 leading-5">{type.name}</span>
      </button>
    );
  };

  const renderServiceTypePicker = () => (
    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Service Types</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Choose every type that fits this service.</p>
        </div>
        {formServiceTypeIds.length > 0 && (
          <button
            type="button"
            onClick={() => setFormServiceTypeIds([])}
            className="w-fit text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Clear selected ({formServiceTypeIds.length})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {rootServiceTypes.length > 0 ? (
          rootServiceTypes.map(type => {
            const children = childServiceTypesByParent[type.id] || [];
            const expanded = expandedServiceTypeIds.includes(type.id);
            const childSelectedCount = children.filter(child => formServiceTypeIds.includes(child.id)).length;
            const selected = formServiceTypeIds.includes(type.id);

            if (!children.length) return renderServiceTypeOption(type);

            return (
              <div key={type.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => toggleServiceTypeGroup(type.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  aria-expanded={expanded}
                >
                  <ServiceTypeVisual type={type} selected={selected} />
                  <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">{type.name}</span>
                  {childSelectedCount > 0 && (
                    <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                      {childSelectedCount}
                    </span>
                  )}
                  {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />}
                </button>
                {expanded && (
                  <div className="grid gap-3 border-t border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-2">
                    {children.map(child => renderServiceTypeOption(child))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No service types returned by the API.
          </p>
        )}
      </div>
    </div>
  );

  const renderServices = () => (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">My Services</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create services and select your exact service city.</p>
        </div>
        <Button
          onClick={() => showServiceForm ? setShowServiceForm(false) : openCreateServiceForm()}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      {servicesError && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {servicesError}
        </div>
      )}

      {showServiceForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">{editingServiceId ? 'Edit Service' : 'Create Service'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Service title" />
            <Input value={formDuration} onChange={e => setFormDuration(e.target.value)} type="number" min="1" placeholder="Duration minutes" />
            {renderServiceTypePicker()}
            <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Description" className="md:col-span-2" />
            <Input value={formPrice} onChange={e => setFormPrice(e.target.value)} type="number" min="0" placeholder="Base price" />
            <Combobox
              id={priceTypeComboboxId}
              value={formPriceType}
              onValueChange={value => setFormPriceType(value as 'fixed' | 'hourly' | 'quote')}
              placeholder="Select price type"
            >
              <Combobox.Input />
              <Combobox.List>
                <Combobox.Option value="fixed">Fixed price</Combobox.Option>
                <Combobox.Option value="hourly">Hourly</Combobox.Option>
                <Combobox.Option value="quote">Quote</Combobox.Option>
              </Combobox.List>
            </Combobox>
            <Combobox
              id={statusComboboxId}
              value={formStatus}
              onValueChange={value => setFormStatus(value as ProviderServiceDto['status'])}
              placeholder="Select status"
            >
              <Combobox.Input />
              <Combobox.List>
                <Combobox.Option value="active">Active</Combobox.Option>
                <Combobox.Option value="draft">Draft</Combobox.Option>
                <Combobox.Option value="paused">Paused</Combobox.Option>
                <Combobox.Option value="pending_review">Pending review</Combobox.Option>
              </Combobox.List>
            </Combobox>
            <div className="relative">
              <Combobox
                id={provinceComboboxId}
                value={formProvinceId}
                onValueChange={value => {
                  setFormProvinceId(value);
                  setFormDistrictId('');
                  setFormCityId('');
                }}
                placeholder={countryCode === 'ca' ? 'Select province/territory' : 'Select province'}
              >
                <Combobox.Input />
                <Combobox.List>
                  {locations.map(province => <Combobox.Option key={province.id} value={province.id}>{province.name}</Combobox.Option>)}
                </Combobox.List>
              </Combobox>
              {formProvinceId && (
                <Button
                  type="button"
                  onClick={() => {
                    setFormProvinceId('');
                    setFormDistrictId('');
                    setFormCityId('');
                  }}
                  variant="ghost"
                  size="icon"
                  className="absolute right-9 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-400"
                  aria-label="Clear province"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {!isCanada && (
              <div className="relative">
                <Combobox
                  id={districtComboboxId}
                  value={formDistrictId}
                  onValueChange={value => {
                    setFormDistrictId(value);
                    setFormCityId('');
                  }}
                  disabled={!formProvinceId}
                  placeholder="Select district"
                >
                  <Combobox.Input />
                  <Combobox.List>
                    {providerDistricts.map(district => <Combobox.Option key={district.id} value={district.id}>{district.name}</Combobox.Option>)}
                  </Combobox.List>
                </Combobox>
                {formDistrictId && (
                  <Button
                    type="button"
                    onClick={() => {
                      setFormDistrictId('');
                      setFormCityId('');
                    }}
                    variant="ghost"
                    size="icon"
                    className="absolute right-9 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-400"
                    aria-label="Clear district"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Combobox
                    id={cityComboboxId}
                    value={formCityId}
                    onValueChange={setFormCityId}
                    disabled={isCanada ? !formProvinceId : !formDistrictId}
                    placeholder="Select city"
                  >
                    <Combobox.Input />
                    <Combobox.List>
                      {providerCities.map(city => <Combobox.Option key={city.id} value={city.id}>{city.sub_name ? `${city.name} - ${city.sub_name}` : city.name}</Combobox.Option>)}
                    </Combobox.List>
                  </Combobox>
                  {formCityId && (
                    <Button
                      type="button"
                      onClick={() => setFormCityId('')}
                      variant="ghost"
                      size="icon"
                      className="absolute right-9 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-400"
                      aria-label="Clear city"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={detectingLocation}
                  variant="secondary"
                  size="icon"
                  aria-label="Use my current location"
                  title="Use my current location"
                >
                  <Crosshair className={`w-4 h-4 ${detectingLocation ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {locationMessage && <p className="text-xs text-slate-500">{locationMessage}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-5 sm:flex-row">
            <Button onClick={saveService} disabled={savingService}>
              <Save className="w-4 h-4" /> {savingService ? 'Saving...' : editingServiceId ? 'Update Service' : 'Create Service'}
            </Button>
            <Button onClick={() => { resetServiceForm(); setShowServiceForm(false); }} disabled={savingService} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {servicesLoading && Array.from({ length: 4 }).map((_, index) => <ProviderServiceSkeleton key={index} />)}
        {!servicesLoading && services.map(service => {
          const reviews = serviceReviews[service.id] || [];
          const reviewsOpen = reviewPanelsOpen.includes(service.id);
          const reviewCount = reviews.length;

          return (
          <div key={service.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white">{service.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{service.description || 'No description added.'}</p>
              </div>
              <span className="w-fit rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-300">{service.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>{formatServicePrice(service.base_price, service.price_type, countryCode)} · {service.price_type}</span>
              {service.service_area?.[0] && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {service.service_area[0]}</span>}
            </div>
            {service.service_types.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {service.service_types.map(type => (
                  <span key={type.id} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {type.name}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => toggleReviews(service.id)}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Eye className="h-4 w-4" />
                {reviewsOpen ? 'Hide reviews' : 'View reviews'}
                {reviewCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-500" /> {getReviewAverage(reviews)} ({reviewCount})
                  </span>
                )}
              </button>
              <div className="flex gap-2">
                <Button type="button" onClick={() => editService(service)} variant="secondary" size="icon" aria-label={`Edit ${service.title}`} title="Edit service">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button type="button" onClick={() => deleteService(service.id)} variant="destructive" size="icon" aria-label={`Delete ${service.title}`} title="Delete service">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {reviewsOpen && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                {reviewsLoading[service.id] ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : reviewsError[service.id] ? (
                  <p className="text-sm text-red-600 dark:text-red-300">{reviewsError[service.id]}</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No reviews for this service yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{review.customerName}</p>
                            <p className="text-xs text-slate-500">{formatReviewDate(review.updatedAt || review.createdAt)}</p>
                          </div>
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            <Star className="h-3.5 w-3.5 fill-amber-500" /> {review.rating}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment || 'No written comment.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
        {!servicesLoading && services.length === 0 && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center text-slate-400">
            <Briefcase className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No services yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  const CONTENT: Record<Section, React.ReactNode> = {
    overview: renderOverview(),
    services: renderServices(),
    bookings: renderPlaceholder('Bookings', Calendar),
    messages: <MessagesPanel />,
    earnings: renderPlaceholder('Earnings', DollarSign),
    settings: <SettingsPanel />,
  };

  const renderNavButton = (item: typeof NAV[number], variant: 'full' | 'rail' = 'full') => {
    const Icon = item.icon;
    const active = section === item.id;
    const msgBadge = item.id === 'messages' ? unreadCount(user?.email || '') : 0;
    const displayBadge = msgBadge > 0 ? msgBadge : item.badge;

    if (variant === 'rail') {
      return (
        <Button
          key={item.id}
          onClick={() => selectSection(item.id)}
          variant="ghost"
          size="icon"
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${active
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          aria-label={item.label}
          title={item.label}
        >
          <Icon className="h-5 w-5" />
          {displayBadge ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
              {displayBadge}
            </span>
          ) : null}
        </Button>
      );
    }

    return (
      <Button
        key={item.id}
        onClick={() => selectSection(item.id)}
        variant="ghost"
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
      </Button>
    );
  };

  // ── Layout ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 lg:flex">

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        <div className="flex items-center gap-2.5">
          {/* <div className="rounded-xl bg-indigo-600 p-2">
            <Zap className="h-5 w-5 text-white" />
          </div> */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm shadow-slate-200/70 ring-1 ring-black/5 dark:border-neutral-800 dark:shadow-none dark:ring-white/10">
                      <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" priority />
                    </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">AgoraTask</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            variant="secondary"
            size="icon"
            aria-label="Open provider menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 lg:flex flex-col min-h-screen">
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
          {NAV.map(item => renderNavButton(item))}
        </nav>

        {/* Bottom: profile + logout */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl px-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between rounded-xl px-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Language</span>
            <LanguageSwitcher />
          </div>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </Button>
        </div>
      </aside>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-900 md:flex lg:hidden">
        <div className="mb-6 rounded-xl bg-indigo-600 p-2.5">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {NAV.map(item => renderNavButton(item, 'rail'))}
        </nav>
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="icon"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            className="absolute inset-0 h-auto rounded-none border-0 bg-slate-950/40 p-0 shadow-none hover:bg-slate-950/40"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close provider menu"
          />
          <aside className="relative flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-indigo-600 p-2">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">AgoraTask</span>
              </div>
              <Button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500"
                aria-label="Close provider menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-5 pt-5 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Provider Menu</span>
            </div>
            <nav className="flex-1 space-y-1 px-3">
              {NAV.map(item => renderNavButton(item))}
            </nav>
            <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between rounded-xl px-1">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between rounded-xl px-1">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Language</span>
                <LanguageSwitcher />
              </div>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:ml-20 lg:ml-0 lg:min-h-screen lg:p-8">
        <div className="mb-4 hidden justify-end gap-3 md:flex lg:hidden">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        {CONTENT[section]}
      </main>
    </div>
  );
}
