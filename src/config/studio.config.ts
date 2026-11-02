export interface StudioConfig {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  workingHoursText: string;
  workingHours: {
    days: string;
    open: string;
    close: string;
  };
  branding: {
    accentColor: string;
    logoUrl: string;
    coverUrl: string;
    badgeText: string;
    theme: string;
  };
  features: {
    yandexRating: string;
    reviewsCount: number;
    badge: string;
  };
}

export const studioConfig: StudioConfig = {
  slug: 'syndicate',
  name: 'Syndicate Detailing',
  shortName: 'Syndicate',
  tagline: 'Премиальный детейлинг, бронирование кузова и защита ЛКП в Самаре',
  description:
    'Детейлинг-студия Syndicate в Самаре. Обладатель официальной награды «Хорошее место» Яндекс Карт с рейтингом 4.9. Комплексная трехфазная мойка, полировка ЛКП, бронепленка (PPF), керамика KRYTEX и профессиональный уход за интерьером.',
  phone: '+7 (987) 955-31-77',
  secondaryPhone: '+7 (846) 205-31-77',
  address: 'ул. Льва Толстого, 97А, корп. 1',
  city: 'Самара',
  coordinates: {
    lat: 53.186852,
    lng: 50.106493,
  },
  workingHoursText: 'Ежедневно с 09:00 до 21:00',
  workingHours: {
    days: 'Ежедневно',
    open: '09:00',
    close: '21:00',
  },
  branding: {
    accentColor: '#fbbf24',
    logoUrl: '/icons/syndicate-logo.png',
    coverUrl: '/images/hero-car.jpg',
    badgeText: 'Хорошее место 2026 • Рейтинг 4.9',
    theme: 'luxury-dark',
  },
  features: {
    yandexRating: '4.9',
    reviewsCount: 91,
    badge: 'Хорошее место 2026',
  },
};

export default studioConfig;
