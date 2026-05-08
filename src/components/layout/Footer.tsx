"use client";

import type { ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BriefcaseBusiness, ChevronDown, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth, type Role } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryConfig, normalizeCountryCode, type SupportedCountryCode } from '@/lib/countries';

type FooterLink = {
  labelKey: string;
  path: string;
  allowedRoles?: Role[];
};

const primaryLinks: FooterLink[] = [
  { labelKey: 'footer.links.about', path: 'about' },
  { labelKey: 'footer.links.blog', path: 'blog' },
  { labelKey: 'footer.links.faq', path: 'faq' },
  { labelKey: 'footer.links.browseServices', path: 'services' },
  { labelKey: 'footer.links.customerDashboard', path: 'dashboard', allowedRoles: ['customer'] },
  { labelKey: 'footer.links.messages', path: 'messages' },
  { labelKey: 'footer.links.help', path: 'faq' },
  { labelKey: 'footer.links.contactUs', path: 'about' },
  { labelKey: 'footer.links.beProfessional', path: 'register?role=provider' },
  { labelKey: 'footer.links.providerDashboard', path: 'provider-dashboard', allowedRoles: ['provider'] },
];

const bottomLinks = [
  { labelKey: 'footer.links.contact', path: 'about' },
  { labelKey: 'footer.links.privacy', path: 'policy' },
  { labelKey: 'footer.links.terms', path: 'terms' },
  { labelKey: 'footer.links.faq', path: 'faq' },
  { labelKey: 'footer.links.blog', path: 'blog' },
  { labelKey: 'footer.links.cancellationPolicy', path: 'terms' },
  { labelKey: 'footer.links.accessibilityTools', path: 'policy' },
];

const socialLinks = [
  { labelKey: 'footer.social.twitter', iconClass: 'fab fa-x-twitter', path: 'about' },
  { labelKey: 'footer.social.facebook', iconClass: 'fab fa-facebook', path: 'about' },
  { labelKey: 'footer.social.instagram', iconClass: 'fab fa-instagram', path: 'about' },
  { labelKey: 'footer.social.linkedin', iconClass: 'fab fa-linkedin-in', path: 'about' },
  { labelKey: 'footer.social.reviews', iconClass: 'fas fa-star', path: '#reviews' },
  { labelKey: 'footer.social.chat', iconClass: 'fas fa-comments', path: 'messages' },
];

const countryOptions: SupportedCountryCode[] = ['lk', 'ca'];

export function Footer() {
  const { t } = useLanguage();
  const params = useParams<{ country?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const currentCountry = normalizeCountryCode(params?.country);
  const countryConfig = getCountryConfig(currentCountry);
  const visiblePrimaryLinks = primaryLinks.filter(link => !link.allowedRoles || (user && link.allowedRoles.includes(user.role)));

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    router.push(`/${event.target.value}`);
  };

  return (
    <footer className="bg-[#171717] px-4 py-10 text-neutral-400 dark:bg-black">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <Link href={`/${currentCountry}`} className="flex w-fit items-center gap-3 text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-bold tracking-tight">AgoraTask</span>
                <span className="block max-w-md text-sm font-medium leading-6 text-neutral-500">{t('footer.description')}</span>
              </span>
            </Link>

            <div className="w-full max-w-xs lg:w-64">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">{t('footer.locations')}</h2>
              <div className="relative">
                <select
                  value={currentCountry}
                  onChange={handleCountryChange}
                  aria-label={t('footer.selectCountry')}
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
          </div>

          <nav className="grid gap-x-10 gap-y-3 text-sm font-semibold leading-6 text-neutral-100 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" aria-label={t('footer.navigation')}>
            {visiblePrimaryLinks.map(link => (
              <Link key={link.labelKey} href={`/${currentCountry}/${link.path}`} className="transition-colors hover:text-white">
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/${currentCountry}/services`} className="inline-flex h-11 items-center gap-3 rounded-md border border-neutral-700 px-4 text-sm font-semibold text-white transition-colors hover:border-neutral-500">
                <Smartphone className="h-5 w-5" />
                {t('footer.bookServices')}
              </Link>
              <Link href={`/${currentCountry}/register?role=provider`} className="inline-flex h-11 items-center gap-3 rounded-md border border-neutral-700 px-4 text-sm font-semibold text-white transition-colors hover:border-neutral-500">
                <BriefcaseBusiness className="h-5 w-5" />
                {t('footer.joinAsProvider')}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {socialLinks.map(({ labelKey, iconClass, path }) => (
                <Link
                  key={labelKey}
                  href={path.startsWith('#') ? `/${currentCountry}${path}` : `/${currentCountry}/${path}`}
                  aria-label={t(labelKey)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-base text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
                >
                  <i className={iconClass} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-5 border-t border-neutral-700 pt-6 lg:flex-row lg:items-start lg:justify-between">
          <nav className="flex max-w-4xl flex-wrap gap-x-7 gap-y-2 text-sm font-semibold leading-6" aria-label={t('footer.legalLinks')}>
            {bottomLinks.map(link => (
              <Link key={link.labelKey} href={`/${currentCountry}/${link.path}`} className="transition-colors hover:text-white">
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="max-w-md text-sm font-semibold leading-6 text-white lg:ml-auto lg:text-right">
            <p>© {(new Date().getFullYear())} AgoraTask. {t('footer.allRightsReserved')}</p>
            {/* <p>{t('footer.countryMarketplace')} {t('countries.countryConfig.name').replace('{country}', "countries."+countryConfig.name )}</p> */}
                <p>{t('countries.'+ countryConfig.name)} {t('footer.countryMarketplace')} </p>
            <p className="inline-flex items-center gap-2 lg:justify-end">
              <ShieldCheck className="h-4 w-4" />
              {t('footer.verifiedProviders')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
