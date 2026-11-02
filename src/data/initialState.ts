export type PriceType = 'fixed' | 'from' | 'inspection';

export interface ServiceItem {
  id: string;
  category: string;
  name: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceType: PriceType;
  prices: {
    class_1_sedan: number;
    class_2_suv: number;
    class_3_xl: number;
  };
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

export interface StudioInitialState {
  services: ServiceItem[];
  upsellOffer: UpsellOffer;
}

export const initialServices: ServiceItem[] = [
  {
    id: 'svc-wash-3phase',
    category: 'Мойка и уход',
    name: 'Трехфазная мойка комплекс',
    description:
      '• Деликатная бесконтактная 1-я фаза\n• Ручная мойка пористой губкой с pH-нейтральным шампунем\n• Нано-консервация 3-й фазой для глубокого гидрофоба\n• Очистка колесных дисков и насадок выхлопа\n• Бережная сушка турбосушкой без микроцарапин',
    durationMinutes: 90,
    bufferMinutes: 15,
    priceType: 'from',
    prices: {
      class_1_sedan: 3300,
      class_2_suv: 4000,
      class_3_xl: 4600,
    },
    imageUrl: '/images/services/syndicate-wash.jpg',
    sortOrder: 1,
    isPopular: true,
  },
  {
    id: 'svc-polish-deep',
    category: 'Полировка кузова',
    name: 'Детейлинг полировка лакокрасочного покрытия',
    description:
      'Глубокая восстановительная полировка кузова в 3–4 этапа. Удаление до 95% царапин, паутинки, голограмм и притертостей до глубокого зеркального отражения.',
    durationMinutes: 360,
    bufferMinutes: 30,
    priceType: 'fixed',
    prices: {
      class_1_sedan: 25000,
      class_2_suv: 30000,
      class_3_xl: 35000,
    },
    imageUrl: '/images/services/syndicate-polish.jpg',
    sortOrder: 2,
    isPopular: true,
  },
  {
    id: 'svc-polish-soft',
    category: 'Полировка кузова',
    name: 'Мягкая полировка кузова (в 2 этапа)',
    description:
      'Полировка среднеабразивной и антиголограммной пастами. Идеально для удаления легкой паутинки, возвращения сочного цвета и блеска.',
    durationMinutes: 240,
    bufferMinutes: 20,
    priceType: 'fixed',
    prices: {
      class_1_sedan: 18000,
      class_2_suv: 21500,
      class_3_xl: 25000,
    },
    imageUrl: '/images/services/polishing.jpg',
    sortOrder: 3,
  },
  {
    id: 'svc-dry-clean',
    category: 'Химчистка и салон',
    name: 'Комплексная химчистка салона',
    description:
      'Глубокая очистка интерьера авто: потолок, сиденья, ковролин, багажник, пластик и воздуховоды с последующей сушкой и обработкой кондиционером кожи.',
    durationMinutes: 360,
    bufferMinutes: 30,
    priceType: 'fixed',
    prices: {
      class_1_sedan: 18000,
      class_2_suv: 21500,
      class_3_xl: 25000,
    },
    imageUrl: '/images/services/himchistka.jpg',
    sortOrder: 4,
    isPopular: true,
  },
  {
    id: 'svc-ceramic-krytex',
    category: 'Защитные покрытия',
    name: 'Керамическое покрытие KRYTEX MEGA8',
    description:
      'Нанесение премиальной нанокерамики KRYTEX в 2 слоя. Сверхстойкий гидрофобный щит, защита от химических реагентов и ультрафиолета с карамельным блеском.',
    durationMinutes: 240,
    bufferMinutes: 30,
    priceType: 'from',
    prices: {
      class_1_sedan: 15000,
      class_2_suv: 18000,
      class_3_xl: 21000,
    },
    imageUrl: '/images/services/ceramic.jpg',
    sortOrder: 5,
  },
  {
    id: 'svc-ppf-full',
    category: 'Оклейка и пленки',
    name: 'Полная оклейка авто в пленку (PPF)',
    description:
      'Бронирование кузова полиуретановой антигравийной пленкой премиум-класса с самозатягивающимся верхним слоем Top Coat. Защита от сколов и царапин.',
    durationMinutes: 2880,
    bufferMinutes: 60,
    priceType: 'from',
    prices: {
      class_1_sedan: 250000,
      class_2_suv: 300000,
      class_3_xl: 350000,
    },
    imageUrl: '/images/services/ppf.jpg',
    sortOrder: 6,
  },
  {
    id: 'svc-glass-7h',
    category: 'Защитные покрытия',
    name: 'Жидкое стекло 7H',
    description:
      'Защитный кварцевый состав. Создает гидрофобный слой, насыщает цвет и снижает загрязнение кузова в осенне-зимний период.',
    durationMinutes: 180,
    bufferMinutes: 20,
    priceType: 'fixed',
    prices: {
      class_1_sedan: 12000,
      class_2_suv: 14500,
      class_3_xl: 17000,
    },
    imageUrl: '/images/services/ceramic.jpg',
    sortOrder: 7,
  },
  {
    id: 'svc-antirain',
    category: 'Стекла и свет',
    name: 'Гидрофобное покрытие для стекол «Антидождь»',
    description:
      'Нанесение водоотталкивающего состава на лобовое и боковые стекла. Улучшает обзор в дождь, грязь и слякоть, капли улетают на скорости от 50 км/ч.',
    durationMinutes: 60,
    bufferMinutes: 15,
    priceType: 'fixed',
    prices: {
      class_1_sedan: 4000,
      class_2_suv: 5000,
      class_3_xl: 5500,
    },
    imageUrl: '/images/services/wash-premium.jpg',
    sortOrder: 8,
  },
  {
    id: 'svc-inspection',
    category: 'Консультация',
    name: 'Осмотр и диагностика ЛКП (консультация)',
    description:
      'Бесплатный профессиональный осмотр автомобиля мастером студии с замером толщины ЛКП толщиномером, оценкой повреждений и подбором плана работ.',
    durationMinutes: 30,
    bufferMinutes: 0,
    priceType: 'inspection',
    prices: {
      class_1_sedan: 0,
      class_2_suv: 0,
      class_3_xl: 0,
    },
    imageUrl: '/images/services/cleaning.jpg',
    sortOrder: 9,
  },
];

export const initialUpsellOffer: UpsellOffer = {
  id: 'upsell-antirain-front',
  title: 'Нанопокрытие «Антидождь» на лобовое стекло',
  description: 'Добавьте защиту лобового стекла к вашему заказу со скидкой 40%.',
  originalPrice: 4000,
  discountPrice: 2400,
  durationMinutes: 30,
  imageUrl: '/images/services/syndicate-polish.jpg',
};

export const initialState: StudioInitialState = {
  services: initialServices,
  upsellOffer: initialUpsellOffer,
};

export default initialState;
