"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase, Calendar, MessageSquare, DollarSign,
  Settings, Star, CheckCircle, Clock, Zap,
  LogOut, ChevronRight, BarChart2, Plus, MapPin, Save, Crosshair, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { MessagesPanel } from '@/components/chat/MessagesPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { providerApi, serviceTypeApi } from '@/lib/api';
import type { ProviderServiceDto, ServiceTypeDto } from '@/lib/api';
import { findNearestLocation, getCitiesByDistrict, getDistrictsByProvince, getLocationLabel, sriLankaLocations } from '@/lib/locations';

type Section = 'overview' | 'services' | 'bookings' | 'messages' | 'earnings' | 'settings';

const NAV: { id: Section; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'services', label: 'Services', icon: Briefcase },
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
  const [services, setServices] = useState<ProviderServiceDto[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formPriceType, setFormPriceType] = useState<'fixed' | 'hourly' | 'quote'>('fixed');
  const [formDuration, setFormDuration] = useState('');
  const [formServiceTypeId, setFormServiceTypeId] = useState('');
  const [formProvinceId, setFormProvinceId] = useState('');
  const [formDistrictId, setFormDistrictId] = useState('');
  const [formCityId, setFormCityId] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const handleLogout = () => { logout(); router.push(`/${country}/login`); };

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
    if (section === 'services' && !servicesLoaded) {
      loadServicesData();
    }
  }, [loadServicesData, section, servicesLoaded]);

  const providerDistricts = getDistrictsByProvince(formProvinceId);
  const providerCities = getCitiesByDistrict(formProvinceId, formDistrictId);

  const resetServiceForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormPriceType('fixed');
    setFormDuration('');
    setFormServiceTypeId('');
    setFormProvinceId('');
    setFormDistrictId('');
    setFormCityId('');
    setLocationMessage('');
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
        const nearest = findNearestLocation(position.coords.latitude, position.coords.longitude);
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

  const createService = async () => {
    if (!formTitle.trim() || !formServiceTypeId || !formProvinceId || !formDistrictId || !formCityId) {
      setServicesError('Title, service type, province, district, and city are required.');
      return;
    }

    setSavingService(true);
    setServicesError('');
    try {
      const { data } = await providerApi.createService({
        title: formTitle.trim(),
        description: formDescription.trim(),
        base_price: formPrice ? Number(formPrice) : null,
        price_type: formPriceType,
        duration_mins: formDuration ? Number(formDuration) : null,
        service_area: [
          getLocationLabel(formProvinceId, formDistrictId, formCityId),
          `province:${formProvinceId}`,
          `district:${formDistrictId}`,
          `city:${formCityId}`,
        ],
        images: [],
        status: 'active',
        service_type_ids: [formServiceTypeId],
      });

      setServices(prev => [data, ...prev]);
      resetServiceForm();
      setShowServiceForm(false);
    } catch {
      setServicesError('Could not create this service.');
    } finally {
      setSavingService(false);
    }
  };

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

  const renderServices = () => (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Services</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create services and select your exact service city.</p>
        </div>
        <button
          onClick={() => setShowServiceForm(prev => !prev)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {servicesError && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {servicesError}
        </div>
      )}

      {showServiceForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Create Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Service title" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={formServiceTypeId} onChange={e => setFormServiceTypeId(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select service type</option>
              {serviceTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Description" className="md:col-span-2 min-h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={formPrice} onChange={e => setFormPrice(e.target.value)} type="number" min="0" placeholder="Base price" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={formPriceType} onChange={e => setFormPriceType(e.target.value as 'fixed' | 'hourly' | 'quote')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="fixed">Fixed price</option>
              <option value="hourly">Hourly</option>
              <option value="quote">Quote</option>
            </select>
            <input value={formDuration} onChange={e => setFormDuration(e.target.value)} type="number" min="1" placeholder="Duration minutes" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="relative">
              <select value={formProvinceId} onChange={e => { setFormProvinceId(e.target.value); setFormDistrictId(''); setFormCityId(''); }} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select province</option>
                {sriLankaLocations.map(province => <option key={province.id} value={province.id}>{province.name}</option>)}
              </select>
              {formProvinceId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormProvinceId('');
                    setFormDistrictId('');
                    setFormCityId('');
                  }}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Clear province"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <select value={formDistrictId} onChange={e => { setFormDistrictId(e.target.value); setFormCityId(''); }} disabled={!formProvinceId} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                <option value="">Select district</option>
                {providerDistricts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}
              </select>
              {formDistrictId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormDistrictId('');
                    setFormCityId('');
                  }}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Clear district"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <select value={formCityId} onChange={e => setFormCityId(e.target.value)} disabled={!formDistrictId} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                    <option value="">Select city</option>
                    {providerCities.map(city => <option key={city.id} value={city.id}>{city.sub_name ? `${city.name} - ${city.sub_name}` : city.name}</option>)}
                  </select>
                  {formCityId && (
                    <button
                      type="button"
                      onClick={() => setFormCityId('')}
                      className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label="Clear city"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={detectingLocation}
                  className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50 transition-colors flex items-center justify-center"
                  aria-label="Use my current location"
                  title="Use my current location"
                >
                  <Crosshair className={`w-4 h-4 ${detectingLocation ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {locationMessage && <p className="text-xs text-slate-500">{locationMessage}</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={createService} disabled={savingService} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" /> {savingService ? 'Saving...' : 'Create Service'}
            </button>
            <button onClick={() => { resetServiceForm(); setShowServiceForm(false); }} disabled={savingService} className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {servicesLoading && <p className="text-slate-500">Loading services...</p>}
        {!servicesLoading && services.map(service => (
          <div key={service.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{service.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{service.description || 'No description added.'}</p>
              </div>
              <span className="rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-300">{service.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Rs. {service.base_price || 0} · {service.price_type}</span>
              {service.service_area?.[0] && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {service.service_area[0]}</span>}
            </div>
          </div>
        ))}
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
