export type PriceType = 'fixed' | 'from' | 'inspection';

export interface CarClassPrices {
  class_1_sedan: number;
  class_2_suv: number;
  class_3_xl: number;
}

export interface ServiceItem {
  id: string;
  category: string;
  name: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceType: PriceType;
  prices: CarClassPrices;
  imageUrl: string;
  sortOrder: number;
  isPopular?: boolean;
}

export interface UpsellOffer {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  durationMinutes: number;
  imageUrl: string;
}

export interface StudioBranch {
  address: string;
  city: string;
  phone: string;
  secondaryPhone?: string;
  workingHoursText: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  yandexRating?: string;
  reviewsCount?: number;
  badge?: string;
}

export interface StudioPreset {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  accentColor: string;
  branch: StudioBranch;
  services: ServiceItem[];
  upsellOffer: UpsellOffer;
  addons?: any[];
}
