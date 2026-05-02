import locations from '@/data/sri-lanka-locations.json';

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

export const sriLankaLocations = locations as ProvinceOption[];

export const getDistrictsByProvince = (provinceId: string) =>
  sriLankaLocations.find(province => province.id === provinceId)?.districts || [];

export const getCitiesByDistrict = (provinceId: string, districtId: string) =>
  getDistrictsByProvince(provinceId).find(district => district.id === districtId)?.cities || [];

export const getLocationLabel = (provinceId: string, districtId: string, cityId: string) => {
  const province = sriLankaLocations.find(item => item.id === provinceId);
  const district = province?.districts.find(item => item.id === districtId);
  const city = district?.cities.find(item => item.id === cityId);

  return [city?.name, district?.name, province?.name].filter(Boolean).join(', ');
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

export const findNearestLocation = (latitude: number, longitude: number) => {
  let nearest:
    | { provinceId: string; districtId: string; cityId: string; distanceKm: number }
    | null = null;

  sriLankaLocations.forEach(province => {
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
