"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BriefcaseBusiness, ChevronDown, Search, ShieldCheck, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryConfig, normalizeCountryCode, type SupportedCountryCode } from '@/lib/countries';
import { getCountryLocations } from '@/lib/locations';
import { serviceTypeApi, type ServiceTypeDto } from '@/lib/api';

const primaryLinks = [
  { label: 'About', path: 'about' },
  { label: 'Blog', path: 'blog' },
  { label: 'FAQ', path: 'faq' },
  { label: 'Browse Services', path: 'services' },
  { label: 'Customer Dashboard', path: 'dashboard' },
  { label: 'Messages', path: 'messages' },
  { label: 'Help', path: 'faq' },
  { label: 'Contact Us', path: 'about' },
  { label: 'Be a Professional', path: 'register?role=provider' },
  { label: 'Provider Dashboard', path: 'provider-dashboard' },
];

const bottomLinks = [
  { label: 'Contact', path: 'about' },
  { label: 'Privacy', path: 'policy' },
  { label: 'Terms', path: 'terms' },
  { label: 'FAQ', path: 'faq' },
  { label: 'Blog', path: 'blog' },
  { label: 'Cancellation Policy', path: 'terms' },
  { label: 'Accessibility Tools', path: 'policy' },
];

const fallbackServices = ['House Cleaning', 'Handyman', 'Plumbing', 'Electrical', 'Moving Help', 'Painting', 'Furniture Assembly'];

const socialLinks = [
  { label: 'Twitter', mark: 'X', path: 'about' },
  { label: 'Facebook', mark: 'f', path: 'about' },
  { label: 'Instagram', mark: 'ig', path: 'about' },
  { label: 'LinkedIn', mark: 'in', path: 'about' },
  { label: 'Reviews', mark: '*', path: '#reviews' },
  { label: 'Chat', mark: 'cb', path: 'messages' },
];

const countryOptions: SupportedCountryCode[] = ['lk', 'ca'];

export function Footer() {
  const { t } = useLanguage();
  const params = useParams<{ country?: string }>();
  const router = useRouter();
  const currentCountry = normalizeCountryCode(params?.country);
  const countryConfig = getCountryConfig(currentCountry);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeDto[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadServiceTypes = async () => {
      try {
        const { data } = await serviceTypeApi.list();
        if (!cancelled) {
          setServiceTypes(data.filter(serviceType => serviceType.active).slice(0, 7));
        }
      } catch {
        if (!cancelled) setServiceTypes([]);
      }
    };

    loadServiceTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  const locations = useMemo(() => {
    const seen = new Set<string>();

    return getCountryLocations(currentCountry)
      .flatMap(province =>
        province.districts.flatMap(district =>
          district.cities.map(city => ({
            id: city.id,
            label: city.name,
            href: `/${currentCountry}/services?provinceId=${province.id}&districtId=${district.id}&cityId=${city.id}`,
          }))
        )
      )
      .filter(location => {
        const normalized = location.label.toLowerCase();
        if (normalized.includes('all areas') || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .slice(0, 8);
  }, [currentCountry]);

  const popularServices = serviceTypes.length > 0
    ? serviceTypes.map(serviceType => serviceType.name)
    : fallbackServices;

  const otherSearches = useMemo(() => {
    const locationNames = locations.slice(0, 4).map(location => location.label);
    const serviceNames = popularServices.slice(0, 4);

    return [
      ...serviceNames.flatMap(serviceName =>
        locationNames.slice(0, 2).map(locationName => `${serviceName.toLowerCase()} in ${locationName}`)
      ),
      ...serviceNames.map(serviceName => `${serviceName.toLowerCase()} near me`),
    ].slice(0, 9);
  }, [locations, popularServices]);

  const serviceHref = (serviceName: string) =>
    `/${currentCountry}/services?category=${encodeURIComponent(serviceName)}`;

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/${event.target.value}`);
  };

  return (
    <footer className="bg-[#171717] px-4 py-14 text-neutral-400 dark:bg-black">
      <div className="container mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr_1fr]">
          <div className="space-y-8">
            <Link href={`/${currentCountry}`} className="flex w-fit items-center gap-3 text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" />
              </span>
              <span>
                <span className="block text-xl font-bold tracking-tight">AgoraTask</span>
                <span className="block text-sm font-medium text-neutral-500">{t('footer.description')}</span>
              </span>
            </Link>

            <nav className="grid max-w-md gap-3 text-sm font-semibold text-neutral-100 sm:grid-cols-2" aria-label="Footer navigation">
              {primaryLinks.map(link => (
                <Link key={link.label} href={`/${currentCountry}/${link.path}`} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-wrap gap-3">
              <Link href={`/${currentCountry}/services`} className="inline-flex h-12 items-center gap-3 rounded-md border border-neutral-700 px-4 text-sm font-semibold text-white transition-colors hover:border-neutral-500">
                <Smartphone className="h-5 w-5" />
                Book services
              </Link>
              <Link href={`/${currentCountry}/register?role=provider`} className="inline-flex h-12 items-center gap-3 rounded-md border border-neutral-700 px-4 text-sm font-semibold text-white transition-colors hover:border-neutral-500">
                <BriefcaseBusiness className="h-5 w-5" />
                Join as provider
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ label, mark, path }) => (
                <Link
                  key={label}
                  href={path.startsWith('#') ? `/${currentCountry}${path}` : `/${currentCountry}/${path}`}
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-700 text-xs font-black uppercase text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
                >
                  {mark}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-500">Locations</h2>
            <div className="grid gap-3 text-sm font-semibold">
              {locations.map(location => (
                <Link key={location.id} href={location.href} className="transition-colors hover:text-white">
                  {location.label}
                </Link>
              ))}
              <Link href={`/${currentCountry}/services`} className="transition-colors hover:text-white">See all locations</Link>
            </div>
            <div className="relative mt-4 w-48">
              <select
                value={currentCountry}
                onChange={handleCountryChange}
                aria-label="Select country"
                className="h-11 w-full appearance-none rounded-md border border-neutral-600 bg-transparent px-3 pr-10 text-sm font-semibold text-neutral-300 outline-none transition-colors hover:border-neutral-400 focus:border-white"
              >
                {countryOptions.map(countryCode => (
                  <option key={countryCode} value={countryCode} className="bg-[#171717] text-white">
                    {getCountryConfig(countryCode).name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-500">Popular Services</h2>
            <div className="grid gap-3 text-sm font-semibold">
              {popularServices.map(serviceName => (
                <Link key={serviceName} href={serviceHref(serviceName)} className="transition-colors hover:text-white">
                  {serviceName}
                </Link>
              ))}
              <Link href={`/${currentCountry}/services`} className="transition-colors hover:text-white">See all services</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-700 pt-8">
          <h2 className="mb-6 text-sm font-bold text-white">Other AgoraTask Services</h2>
          <div className="grid gap-x-12 gap-y-4 text-sm font-semibold md:grid-cols-3">
            {otherSearches.map(search => (
              <Link key={search} href={`/${currentCountry}/services?search=${encodeURIComponent(search)}`} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                <Search className="h-3.5 w-3.5" />
                {search}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-neutral-700 pt-6 lg:flex-row lg:items-start lg:justify-between">
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold" aria-label="Legal links">
            {bottomLinks.map(link => (
              <Link key={link.label} href={`/${currentCountry}/${link.path}`} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="max-w-sm text-sm font-semibold leading-6 text-white lg:text-right">
            <p>© {(new Date().getFullYear())} AgoraTask. {t('footer.allRightsReserved')}</p>
            <p>{countryConfig.name} service marketplace.</p>
            <p className="inline-flex items-center gap-2 lg:justify-end">
              <ShieldCheck className="h-4 w-4" />
              Verified providers and customer reviews
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
