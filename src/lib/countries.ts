import { normalizeCountryCode } from './locations';

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  locale: string;
  regionLabel: string;
  subRegionLabel: string;
  localityLabel: string;
}

const countryConfigs: Record<string, CountryConfig> = {
  lk: {
    code: 'lk',
    name: 'Sri Lanka',
    currency: 'LKR',
    locale: 'en-LK',
    regionLabel: 'province',
    subRegionLabel: 'district',
    localityLabel: 'city',
  },
  ca: {
    code: 'ca',
    name: 'Canada',
    currency: 'CAD',
    locale: 'en-CA',
    regionLabel: 'province/territory',
    subRegionLabel: 'region',
    localityLabel: 'city',
  },
};

export const getCountryConfig = (country?: string): CountryConfig => {
  const normalized = normalizeCountryCode(country);
  return countryConfigs[normalized];
};

export const formatCurrencyForCountry = (
  value: number,
  country?: string,
  options: Intl.NumberFormatOptions = {}
) => {
  const config = getCountryConfig(country);

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};

export const formatServicePrice = (
  value: number | null | undefined,
  priceType: 'fixed' | 'hourly' | 'quote',
  country?: string
) => {
  if (value === null || value === undefined) return 'Quote';

  const amount = formatCurrencyForCountry(Number(value), country);
  if (priceType === 'hourly') return `${amount} / hr`;
  if (priceType === 'quote') return `From ${amount}`;
  return amount;
};
