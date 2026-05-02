import canadaLocationsData from '@/data/canada-locations.json';
import sriLankaLocationsData from '@/data/sri-lanka-locations.json';

export interface CityOption {
  id: string;
  name: string;
  name_si: string;
  name_ta: string;
  sub_name: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DistrictOption {
  id: string;
  name: string;
  name_si: string;
  name_ta: string;
  cities: CityOption[];
}

export interface ProvinceOption {
  id: string;
  name: string;
  name_si: string;
  name_ta: string;
  districts: DistrictOption[];
}

export type SupportedCountryCode = 'lk' | 'ca';
export type NearestLocation = {
  provinceId: string;
  districtId: string;
  cityId: string;
  distanceKm: number;
};

export const sriLankaLocations = sriLankaLocationsData as ProvinceOption[];
export const canadaLocations = canadaLocationsData as ProvinceOption[];

const locationsByCountry: Record<SupportedCountryCode, ProvinceOption[]> = {
  lk: sriLankaLocations,
  ca: canadaLocations,
};

export const normalizeCountryCode = (country?: string): SupportedCountryCode =>
  country?.toLowerCase() === 'ca' ? 'ca' : 'lk';

export const getCountryLocations = (country?: string) =>
  locationsByCountry[normalizeCountryCode(country)];

export const getDistrictsByProvince = (provinceId: string, country?: string) =>
  getCountryLocations(country).find(province => province.id === provinceId)?.districts || [];

export const getCitiesByDistrict = (provinceId: string, districtId: string, country?: string) =>
  getDistrictsByProvince(provinceId, country).find(district => district.id === districtId)?.cities || [];

export const getLocationLabel = (provinceId: string, districtId: string, cityId: string, country?: string) => {
  const province = getCountryLocations(country).find(item => item.id === provinceId);
  const district = province?.districts.find(item => item.id === districtId);
  const city = district?.cities.find(item => item.id === cityId);
  const districtName = district?.name === 'All areas' ? null : district?.name;

  return [city?.name, districtName, province?.name].filter(Boolean).join(', ');
};

const toRadians = (value: number) => value * Math.PI / 180;

const getDistanceKm = (latA: number, lonA: number, latB: number, lonB: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearestLocation = (latitude: number, longitude: number, country?: string): NearestLocation | null => {
  let nearest: NearestLocation | null = null;

  getCountryLocations(country).forEach(province => {
    province.districts.forEach(district => {
      district.cities.forEach(city => {
        if (city.latitude === null || city.longitude === null) return;

        const distanceKm = getDistanceKm(latitude, longitude, city.latitude, city.longitude);
        if (!nearest || distanceKm < nearest.distanceKm) {
          nearest = {
            provinceId: province.id,
            districtId: district.id,
            cityId: city.id,
            distanceKm,
          };
        }
      });
    });
  });

  return nearest;
};
