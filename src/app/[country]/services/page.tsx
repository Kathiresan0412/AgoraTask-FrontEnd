"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Crosshair, Filter, MapPin, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { publicServiceApi } from '@/lib/api';
import type { PublicServiceDto } from '@/lib/api';
import { findNearestLocation, getCitiesByDistrict, getCountryLocations, getDistrictsByProvince, normalizeCountryCode } from '@/lib/locations';

const FALLBACK_CATEGORIES = ['Cleaning', 'Plumbing', 'Electrical', 'Beauty', 'Repairs'];
const PAGE_SIZE = 8;

const formatPrice = (service: PublicServiceDto) => {
  if (service.basePrice === null || service.basePrice === undefined) return 'Quote';
  const prefix = service.priceType === 'hourly' ? 'Rs. ' : service.priceType === 'quote' ? 'From Rs. ' : 'Rs. ';
  return `${prefix}${Number(service.basePrice).toLocaleString()}`;
};

export default function ServicesPage() {
  const params = useParams<{ country?: string }>();
  const country = params.country || 'lk';
  const countryCode = normalizeCountryCode(country);
  const countryName = countryCode === 'ca' ? 'Canada' : 'Sri Lanka';
  const locations = getCountryLocations(countryCode);
  const [services, setServices] = useState<PublicServiceDto[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [cityId, setCityId] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const districts = getDistrictsByProvince(provinceId, countryCode);
  const cities = getCitiesByDistrict(provinceId, districtId, countryCode);
  const categoryFilter = selectedCategories[0] || undefined;
  const categories = Array.from(new Set([...FALLBACK_CATEGORIES, ...selectedCategories, ...services.flatMap(service => service.categories)])).filter(Boolean);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError('');
    try {
      const { data } = await publicServiceApi.list({
        category: categoryFilter,
        provinceId: provinceId || undefined,
        districtId: districtId || undefined,
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
  }, [categoryFilter, cityId, districtId, pagination.page, provinceId]);

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
          <p className="text-indigo-100 text-lg max-w-2xl">Browse trusted professionals by service category and exact {countryName} location.</p>
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
                    <option value="">{countryCode === 'ca' ? 'All areas' : 'All districts'}</option>
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

                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <select
                      value={cityId}
                      onChange={e => {
                        setPagination(prev => ({ ...prev, page: 1 }));
                        setCityId(e.target.value);
                      }}
                      disabled={!districtId}
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
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-3">
                {categories.map(category => (
                  <label key={category} className="flex items-center gap-3 text-sm cursor-pointer group">
                    <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer" />
                    <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{category}</span>
                  </label>
                ))}
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
                      <img src={service.images[0] || `https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80&auto=format&fit=crop&sig=${service.id}`} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
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
                    <span className="font-extrabold text-lg text-slate-900 dark:text-white">{formatPrice(service)}</span>
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
