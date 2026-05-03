"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ChevronDown, ChevronRight, Crosshair, Filter, ImageIcon, MapPin, Star, Tag, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { publicServiceApi, serviceTypeApi } from '@/lib/api';
import type { PublicServiceDto, ServiceTypeDto } from '@/lib/api';
import { findNearestLocation, getCitiesByDistrict, getCountryLocations, getDistrictsByProvince, normalizeCountryCode } from '@/lib/locations';
import { formatServicePrice, getCountryConfig } from '@/lib/countries';

const PAGE_SIZE = 8;

const isImageSource = (value?: string | null) =>
  Boolean(value && (/^https?:\/\//.test(value) || value.startsWith('/') || value.startsWith('data:image/')));

const getServiceTypeImage = (type: ServiceTypeDto) => type.image_url || type.imageUrl || (isImageSource(type.icon) ? type.icon : null);

function ServiceTypeVisual({ type }: { type: ServiceTypeDto }) {
  const image = getServiceTypeImage(type);

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
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

export default function ServicesPage() {
  const params = useParams<{ country?: string }>();
  const searchParams = useSearchParams();
  const country = params.country || 'lk';
  const countryCode = normalizeCountryCode(country);
  const countryConfig = getCountryConfig(countryCode);
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

  const districts = getDistrictsByProvince(provinceId, countryCode);
  const effectiveDistrictId = isCanada ? districts[0]?.id || '' : districtId;
  const cities = isCanada
    ? districts.flatMap(district => district.cities)
    : getCitiesByDistrict(provinceId, districtId, countryCode);
  const categoryFilter = selectedCategories[0] || undefined;
  const categoryNames = Array.from(new Set([...serviceTypes.map(type => type.name), ...selectedCategories, ...services.flatMap(service => service.categories)])).filter(Boolean);
  const selectedCategory = selectedCategories[0] || '';
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
      setServicesError('Could not load services from the API.');
    } finally {
      setServicesLoading(false);
    }
  }, [categoryFilter, cityId, effectiveDistrictId, pagination.page, provinceId]);

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
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
          selected
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300'
            : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
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
      setLocationMessage('Location is not supported by this browser.');
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
          setLocationMessage('Location set to nearest city.');
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="bg-indigo-600 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Find Services</h1>
          <p className="text-indigo-100 text-lg max-w-2xl">Browse trusted professionals by service category and exact {countryConfig.name} location.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-12 flex-1 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-72 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-24">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-indigo-600" /> Filters
            </h2>

            <div className="mb-6">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-3">Location</h3>
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={provinceId}
                    onChange={e => {
                      setPagination(prev => ({ ...prev, page: 1 }));
                      setProvinceId(e.target.value);
                      setDistrictId('');
                      setCityId('');
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{countryCode === 'ca' ? 'All provinces/territories' : 'All provinces'}</option>
                    {locations.map(province => (
                      <option key={province.id} value={province.id}>{province.name}</option>
                    ))}
                  </select>
                  {provinceId && (
                    <button type="button" onClick={() => { setPagination(prev => ({ ...prev, page: 1 })); setProvinceId(''); setDistrictId(''); setCityId(''); }} className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Clear province">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!isCanada && (
                  <div className="relative">
                    <select
                      value={districtId}
                      onChange={e => {
                        setPagination(prev => ({ ...prev, page: 1 }));
                        setDistrictId(e.target.value);
                        setCityId('');
                      }}
                      disabled={!provinceId}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">All districts</option>
                      {districts.map(district => (
                        <option key={district.id} value={district.id}>{district.name}</option>
                      ))}
                    </select>
                    {districtId && (
                      <button type="button" onClick={() => { setPagination(prev => ({ ...prev, page: 1 })); setDistrictId(''); setCityId(''); }} className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Clear district">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <select
                      value={cityId}
                      onChange={e => {
                        setPagination(prev => ({ ...prev, page: 1 }));
                        setCityId(e.target.value);
                      }}
                      disabled={isCanada ? !provinceId : !districtId}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">All cities</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.sub_name ? `${city.name} - ${city.sub_name}` : city.name}</option>
                      ))}
                    </select>
                    {cityId && (
                      <button type="button" onClick={() => { setPagination(prev => ({ ...prev, page: 1 })); setCityId(''); }} className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Clear city">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={useCurrentLocation} disabled={detectingLocation} className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50 transition-colors flex items-center justify-center" aria-label="Use my current location" title="Use my current location">
                    <Crosshair className={`w-4 h-4 ${detectingLocation ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {locationMessage && <p className="text-xs text-slate-500">{locationMessage}</p>}
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Service Types</h3>
                {selectedCategory && (
                  <button type="button" onClick={clearCategory} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
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
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                            childSelected
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300'
                              : 'border-transparent text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
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
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
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
                    No service types returned by the API.
                  </p>
                )}
              </div>
            </div>

            <button onClick={() => { setSelectedCategories([]); resetLocation(); }} className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold py-3 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors active:scale-95">
              Reset Filters
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{services.length}</strong> of <strong className="text-slate-900 dark:text-white">{pagination.total}</strong> results
            </span>
            <select className="w-full sm:w-auto px-5 py-3.5 text-[14px] font-medium transition-all outline-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm">
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Highest Rated</option>
            </select>
          </div>

          {servicesError && (
            <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {servicesError}
            </div>
          )}

          {servicesLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400">
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400">
              No services match these filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {services.map(service => (
                <Link href={`/${country}/services/${service.id}`} key={service.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all cursor-pointer group flex flex-col h-full">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                      {service.images[0] ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <ImageIcon className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> New
                      </div>
                      <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{service.title}</h3>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{service.provider.name}</div>
                      {service.location && (
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {service.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-extrabold text-lg text-slate-900 dark:text-white">{formatServicePrice(service.basePrice, service.priceType, countryCode)}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm group-hover:underline">View details</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!servicesLoading && pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Page <strong className="text-slate-900 dark:text-white">{pagination.page}</strong> of <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={pagination.page <= 1}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
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
