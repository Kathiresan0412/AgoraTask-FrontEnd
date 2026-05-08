"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowUpDown, ChevronDown, ChevronRight, Crosshair, Filter, ImageIcon, MapPin, SlidersHorizontal, Star, Tag, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { publicServiceApi, serviceTypeApi } from '@/lib/api';
import type { PublicServiceDto, ServiceTypeDto } from '@/lib/api';
import { findNearestLocation, getCitiesByDistrict, getCountryLocations, getDistrictsByProvince, normalizeCountryCode } from '@/lib/locations';
import { formatServicePrice, getCountryConfig } from '@/lib/countries';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE_SIZE = 8;

const isImageSource = (value?: string | null) =>
  Boolean(value && (/^https?:\/\//.test(value) || value.startsWith('/') || value.startsWith('data:image/')));

const getServiceTypeImage = (type: ServiceTypeDto) => type.image_url || type.imageUrl || (isImageSource(type.icon) ? type.icon : null);

function ServiceTypeVisual({ type }: { type: ServiceTypeDto }) {
  const image = getServiceTypeImage(type);

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {image ? (
        <Image src={image} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
      ) : type.icon ? (
        <span className="text-base leading-none">{type.icon}</span>
      ) : (
        <Tag className="h-4 w-4" />
      )}
    </span>
  );
}

function ServiceResultSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-5">
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  disabled,
  children,
  clearLabel,
  onClear,
}: {
  value?: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  children: React.ReactNode;
  clearLabel?: string;
  onClear?: () => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-12 w-full appearance-none rounded-xl border border-slate-200/80 bg-white px-3.5 pr-11 text-sm font-medium text-slate-800 shadow-sm shadow-slate-200/50 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:shadow-none dark:focus:border-slate-600 dark:focus:ring-slate-800/70 dark:disabled:bg-slate-900"
      >
        {children}
      </select>
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-9 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={clearLabel}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export default function ServicesPage() {
  const params = useParams<{ country?: string }>();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const country = params.country || 'lk';
  const countryCode = normalizeCountryCode(country);
  const countryConfig = getCountryConfig(countryCode);
  const countryName = t(`countries.${countryCode}`);
  const isCanada = countryCode === 'ca';
  const locations = getCountryLocations(countryCode);
  const [services, setServices] = useState<PublicServiceDto[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeDto[]>([]);
  const [expandedServiceTypeIds, setExpandedServiceTypeIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const category = searchParams.get('category');
    return category ? [category] : [];
  });
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [cityId, setCityId] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const districts = getDistrictsByProvince(provinceId, countryCode);
  const effectiveDistrictId = isCanada ? districts[0]?.id || '' : districtId;
  const cities = isCanada
    ? districts.flatMap(district => district.cities)
    : getCitiesByDistrict(provinceId, districtId, countryCode);
  const categoryFilter = selectedCategories[0] || undefined;
  const categoryNames = Array.from(new Set([...serviceTypes.map(type => type.name), ...selectedCategories, ...services.flatMap(service => service.categories)])).filter(Boolean);
  const selectedCategory = selectedCategories[0] || '';
  const activeFilterCount = [selectedCategory, provinceId, districtId, cityId].filter(Boolean).length;
  const rootServiceTypes = serviceTypes.filter(type => !type.parent_id);
  const childServiceTypesByParent = serviceTypes.reduce<Record<string, ServiceTypeDto[]>>((groups, type) => {
    if (!type.parent_id) return groups;
    return {
      ...groups,
      [type.parent_id]: [...(groups[type.parent_id] || []), type],
    };
  }, {});

  useEffect(() => {
    const category = searchParams.get('category');
    setSelectedCategories(category ? [category] : []);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const { data } = await serviceTypeApi.list();
        if (!cancelled) {
          const activeTypes = data.filter(type => type.active);
          setServiceTypes(activeTypes);
          const selected = searchParams.get('category');
          const selectedType = activeTypes.find(type => type.name === selected);
          if (selectedType?.parent_id) {
            setExpandedServiceTypeIds(prev => Array.from(new Set([...prev, selectedType.parent_id as string])));
          }
        }
      } catch {
        if (!cancelled) setServiceTypes([]);
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError('');
    try {
      const { data } = await publicServiceApi.list({
        country: countryCode,
        category: categoryFilter,
        provinceId: provinceId || undefined,
        districtId: effectiveDistrictId || undefined,
        cityId: cityId || undefined,
        page: pagination.page,
        limit: PAGE_SIZE,
      });
      setServices(data.data);
      setPagination(data.pagination);
    } catch {
      setServicesError(t('services.loadError'));
    } finally {
      setServicesLoading(false);
    }
  }, [categoryFilter, cityId, countryCode, effectiveDistrictId, pagination.page, provinceId, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadServices, 200);
    return () => window.clearTimeout(timeoutId);
  }, [loadServices]);

  const toggleCategory = (category: string) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedCategories(prev =>
      prev.includes(category) ? [] : [category]
    );
  };

  const toggleServiceTypeGroup = (id: string) => {
    setExpandedServiceTypeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const clearCategory = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedCategories([]);
  };

  const renderServiceTypeOption = (type: ServiceTypeDto, nested = false) => {
    const selected = selectedCategory === type.name;

    return (
      <button
        key={type.id}
        type="button"
        onClick={() => toggleCategory(type.name)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
          selected
            ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950'
            : 'border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
        } ${nested ? 'ml-5 w-[calc(100%-1.25rem)]' : ''}`}
        aria-pressed={selected}
      >
        <ServiceTypeVisual type={type} />
        <span className="min-w-0 flex-1 truncate font-medium">{type.name}</span>
      </button>
    );
  };

  const resetLocation = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setProvinceId('');
    setDistrictId('');
    setCityId('');
    setLocationMessage('');
  };

  const useCurrentLocation = () => {
    setLocationMessage('');

    if (!navigator.geolocation) {
      setLocationMessage(t('services.locationNotSupported'));
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const nearest = findNearestLocation(position.coords.latitude, position.coords.longitude, countryCode);
        if (nearest) {
          setPagination(prev => ({ ...prev, page: 1 }));
          setProvinceId(nearest.provinceId);
          setDistrictId(nearest.districtId);
          setCityId(nearest.cityId);
          setLocationMessage(t('services.locationSet'));
        } else {
          setLocationMessage(t('services.locationNoMatch'));
        }
        setDetectingLocation(false);
      },
      () => {
        setLocationMessage(t('services.locationDenied'));
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fb] font-sans text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <div className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {countryName === `countries.${countryCode}` ? countryConfig.name : countryName}
              </div>
              <h1 className="text-4xl font-black tracking-normal text-slate-950 dark:text-white sm:text-5xl">{t('services.title')}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                {t('services.subtitle')} {countryName === `countries.${countryCode}` ? countryConfig.name : countryName}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-black text-slate-950 dark:text-white">{pagination.total}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('services.results')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-black text-slate-950 dark:text-white">{categoryNames.length}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('services.serviceTypes')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:py-8 lg:flex-row lg:gap-8">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(open => !open)}
            className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:shadow-none"
            aria-expanded={mobileFiltersOpen}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {t('services.filters')}
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white dark:bg-white dark:text-slate-950">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 transition ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <aside className={`w-full shrink-0 lg:block lg:w-72 ${mobileFiltersOpen ? 'block' : 'hidden'}`}>
          <div className="sticky top-24 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-5">
            <h2 className="mb-5 flex items-center justify-between gap-3 text-base font-black">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" /> {t('services.filters')}
              </span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {activeFilterCount}
                </span>
              )}
            </h2>

            <div className="mb-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('services.location')}</h3>
              <div className="space-y-3">
                <SelectField
                  value={provinceId}
                  onChange={e => {
                    setPagination(prev => ({ ...prev, page: 1 }));
                    setProvinceId(e.target.value);
                    setDistrictId('');
                    setCityId('');
                  }}
                  clearLabel={t('services.clearProvince')}
                  onClear={() => { setPagination(prev => ({ ...prev, page: 1 })); setProvinceId(''); setDistrictId(''); setCityId(''); }}
                >
                  <option value="">{countryCode === 'ca' ? t('services.allProvincesTerritories') : t('services.allProvinces')}</option>
                  {locations.map(province => (
                    <option key={province.id} value={province.id}>{province.name}</option>
                  ))}
                </SelectField>

                {!isCanada && (
                  <SelectField
                    value={districtId}
                    onChange={e => {
                      setPagination(prev => ({ ...prev, page: 1 }));
                      setDistrictId(e.target.value);
                      setCityId('');
                    }}
                    disabled={!provinceId}
                    clearLabel={t('services.clearDistrict')}
                    onClear={() => { setPagination(prev => ({ ...prev, page: 1 })); setDistrictId(''); setCityId(''); }}
                  >
                    <option value="">{t('services.allDistricts')}</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </SelectField>
                )}

                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <SelectField
                      value={cityId}
                      onChange={e => {
                        setPagination(prev => ({ ...prev, page: 1 }));
                        setCityId(e.target.value);
                      }}
                      disabled={isCanada ? !provinceId : !districtId}
                      clearLabel={t('services.clearCity')}
                      onClear={() => { setPagination(prev => ({ ...prev, page: 1 })); setCityId(''); }}
                    >
                      <option value="">{t('services.allCities')}</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.sub_name ? `${city.name} - ${city.sub_name}` : city.name}</option>
                      ))}
                    </SelectField>
                  </div>
                  <button type="button" onClick={useCurrentLocation} disabled={detectingLocation} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-200/50 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none dark:hover:border-slate-700 dark:hover:text-white" aria-label={t('services.useCurrentLocation')} title={t('services.useCurrentLocation')}>
                    <Crosshair className={`h-4 w-4 ${detectingLocation ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {locationMessage && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{locationMessage}</p>}
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('services.serviceTypes')}</h3>
                {selectedCategory && (
                  <button type="button" onClick={clearCategory} className="text-xs font-bold text-slate-700 hover:underline dark:text-slate-200">
                    {t('services.clear')}
                  </button>
                )}
              </div>
              <div className="max-h-[23rem] space-y-1.5 overflow-y-auto pr-1">
                {rootServiceTypes.length > 0 ? (
                  rootServiceTypes.map(type => {
                    const children = childServiceTypesByParent[type.id] || [];
                    const expanded = expandedServiceTypeIds.includes(type.id);
                    const childSelected = children.some(child => child.name === selectedCategory);

                    if (!children.length) return renderServiceTypeOption(type);

                    return (
                      <div key={type.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleServiceTypeGroup(type.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                            childSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950'
                              : 'border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70'
                          }`}
                          aria-expanded={expanded}
                        >
                          <ServiceTypeVisual type={type} />
                          <span className="min-w-0 flex-1 truncate font-semibold">{type.name}</span>
                          {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        </button>
                        {expanded && (
                          <div className="space-y-1">
                            {children.map(child => renderServiceTypeOption(child, true))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  categoryNames.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        selectedCategory === category
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                        <Tag className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{category}</span>
                    </button>
                  ))
                )}
                {categoryNames.length === 0 && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    {t('services.noServiceTypes')}
                  </p>
                )}
              </div>
            </div>

            <button onClick={() => { setSelectedCategories([]); resetLocation(); setMobileFiltersOpen(false); }} className="h-11 w-full rounded-xl bg-slate-100 text-sm font-black text-slate-800 transition hover:bg-slate-200 active:scale-[0.99] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              {t('services.resetFilters')}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <span className="px-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('services.showing')} <strong className="text-slate-900 dark:text-white">{services.length}</strong> {t('services.of')} <strong className="text-slate-900 dark:text-white">{pagination.total}</strong> {t('services.results')}
            </span>
            <div className="relative w-full sm:w-64">
              <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800/70">
                <option>{t('services.recommended')}</option>
                <option>{t('services.priceLowHigh')}</option>
                <option>{t('services.priceHighLow')}</option>
                <option>{t('services.highestRated')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {servicesError && (
            <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {servicesError}
            </div>
          )}

          {servicesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5" aria-label={t('services.loadingServices')}>
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <ServiceResultSkeleton key={index} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center font-semibold text-slate-400 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              {t('services.noMatches')}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {services.map(service => (
                <Link href={`/${country}/services/${service.id}`} key={service.id} className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-700 sm:p-5">
                  <div className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-200 dark:border-slate-800">
                      {service.images[0] ? (
                        <Image src={service.images[0]} alt={service.title} width={96} height={96} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <ImageIcon className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="mb-1 flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-500" /> {t('services.new')}
                      </div>
                      <h3 className="mb-1 line-clamp-2 text-lg font-black leading-tight text-slate-950 transition-colors group-hover:text-slate-700 dark:text-white dark:group-hover:text-slate-200">{service.title}</h3>
                      <div className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{service.provider.name}</div>
                      {service.location && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{service.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <span className="min-w-0 truncate text-lg font-black text-slate-950 dark:text-white">{formatServicePrice(service.basePrice, service.priceType, countryCode)}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-white dark:group-hover:text-slate-950">{t('services.viewDetails')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!servicesLoading && pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                {t('services.page')} <strong className="text-slate-900 dark:text-white">{pagination.page}</strong> {t('services.of')} <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={pagination.page <= 1}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('services.previous')}
                </button>
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('services.next')}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
