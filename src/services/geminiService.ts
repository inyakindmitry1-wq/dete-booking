import { StudioPreset, ServiceItem } from '@/studios/types';
import { SelectedCar, CreatedAppointment } from '@/context/DemoStoreContext';

export interface BookingCardData {
  bookingId: string;
  accessToken: string;
  serviceName: string;
  dateFormatted: string;
  timeFormatted: string;
  price: number;
  carModel: string;
  currency?: string;
}

export interface AiProcessResult {
  text: string;
  bookingCard?: BookingCardData;
  suggestedPrompts?: string[];
  detectedCar?: SelectedCar;
}

export interface ProcessMessageOptions {
  userMessage: string;
  studio: StudioPreset;
  services: ServiceItem[];
  selectedCar: SelectedCar;
  createAppointment: (params: {
    serviceId?: string;
    serviceName?: string;
    dateStr?: string;
    timeStr?: string;
    price?: number;
    carModel?: string;
    customerName?: string;
    customerPhone?: string;
  }) => Promise<CreatedAppointment>;
  onUpdateSelectedCar?: (car: SelectedCar) => void;
}

const RU_MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/**
 * Intelligent Car Database for auto-recognition from Russian user input
 */
const CAR_DATABASE: Array<{
  keywords: string[];
  name: string;
  category: 'sedan' | 'crossover' | 'suv';
  carClass: 'class_1_sedan' | 'class_2_suv' | 'class_3_xl';
  categoryLabel: string;
}> = [
  // Sedans
  {
    keywords: ['камри', 'camry', 'corolla', 'королл'],
    name: 'Toyota Camry (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  },
  {
    keywords: ['бмв 3', 'bmw 3', 'тройк', 'бмв 5', 'bmw 5', 'пятерк', 'f30', 'g20', 'g30'],
    name: 'BMW 3 / 5 Series (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  },
  {
    keywords: ['солярис', 'solaris', 'рио', 'rio', 'поло', 'polo', 'рапид', 'rapid'],
    name: 'Hyundai Solaris / Kia Rio (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  },
  {
    keywords: ['веста', 'vesta', 'гранта', 'granta', 'приора', 'priora', 'лада', 'lada'],
    name: 'Lada Vesta (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  },
  {
    keywords: ['мерседес с', 'мерс с', 'c-class', 'e-class', 'w205', 'w213', 'мерседес е', 'мерс е'],
    name: 'Mercedes-Benz C/E-Class (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  },
  {
    keywords: ['ауди а4', 'ауди а6', 'audi a4', 'audi a6', 'пассат', 'passat', 'октавия', 'octavia'],
    name: 'Audi A4 / Skoda Octavia (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  },

  // Crossovers
  {
    keywords: ['тигуан', 'tiguan', 'рав4', 'rav4', 'рав 4', 'rav 4', 'сх-5', 'cx-5', 'cx5', 'мазда сх'],
    name: 'VW Tiguan / Toyota RAV4',
    category: 'crossover',
    carClass: 'class_2_suv',
    categoryLabel: 'Кроссовер',
  },
  {
    keywords: ['монжаро', 'monjaro', 'джили', 'geely', 'тугелла', 'tugella', 'атлас', 'atlas', 'кулрей', 'coolray'],
    name: 'Geely Monjaro',
    category: 'crossover',
    carClass: 'class_2_suv',
    categoryLabel: 'Кроссовер',
  },
  {
    keywords: ['чери', 'chery', 'тигго', 'tiggo', 'омода', 'omoda', 'хавал', 'haval', 'джолион', 'jolion', 'f7', 'дарго', 'dargo'],
    name: 'Haval / Chery Tiggo',
    category: 'crossover',
    carClass: 'class_2_suv',
    categoryLabel: 'Кроссовер',
  },
  {
    keywords: ['эксид', 'exeed', 'vx', 'txl', 'rx', 'чанган', 'changan', 'cs55', 'uni-k', 'юник'],
    name: 'Exeed / Changan UNI-K',
    category: 'crossover',
    carClass: 'class_2_suv',
    categoryLabel: 'Кроссовер',
  },
  {
    keywords: ['бмв х3', 'bmw x3', 'bmw x4', 'х3', 'х4', 'audi q5', 'ауди ку5', 'glc', 'мерс глц', 'макан', 'macan'],
    name: 'BMW X3 / Audi Q5',
    category: 'crossover',
    carClass: 'class_2_suv',
    categoryLabel: 'Кроссовер',
  },
  {
    keywords: ['спортейдж', 'sportage', 'туссан', 'tucson', 'кашкай', 'qashqai', 'х-трейл', 'x-trail', 'крета', 'creta'],
    name: 'Kia Sportage / Hyundai Tucson',
    category: 'crossover',
    carClass: 'class_2_suv',
    categoryLabel: 'Кроссовер',
  },

  // Full-size SUVs & XL
  {
    keywords: ['крузак', 'land cruiser', 'ленд крузер', 'prado', 'прадо', 'крузер 200', 'крузер 300', 'lc200', 'lc300'],
    name: 'Toyota Land Cruiser 300',
    category: 'suv',
    carClass: 'class_3_xl',
    categoryLabel: 'Внедорожник',
  },
  {
    keywords: ['бмв х5', 'bmw x5', 'бмв х6', 'bmw x6', 'бмв х7', 'bmw x7', 'х5', 'х6', 'х7', 'g05', 'g07'],
    name: 'BMW X5 / X7',
    category: 'suv',
    carClass: 'class_3_xl',
    categoryLabel: 'Внедорожник',
  },
  {
    keywords: ['гелик', 'гелендваген', 'g-class', 'w463', 'gle', 'gls', 'мерс гле', 'мерс глс'],
    name: 'Mercedes-Benz G/GLS-Class',
    category: 'suv',
    carClass: 'class_3_xl',
    categoryLabel: 'Внедорожник',
  },
  {
    keywords: ['лисян', 'lixiang', 'li l7', 'li l9', 'li auto', 'л7', 'л9', 'зикра', 'зикер', 'zeekr', 'zeekr 001', '001', 'зикр'],
    name: 'Li L9 / Zeekr 001',
    category: 'suv',
    carClass: 'class_3_xl',
    categoryLabel: 'Внедорожник',
  },
  {
    keywords: ['танк', 'tank 300', 'tank 500', 'танк 300', 'танк 500', 'воя', 'voyah', 'voyah free'],
    name: 'Tank 500 / Voyah Free',
    category: 'suv',
    carClass: 'class_3_xl',
    categoryLabel: 'Внедорожник',
  },
  {
    keywords: ['туарег', 'touareg', 'каен', 'кайен', 'cayenne', 'q7', 'q8', 'ауди ку7', 'ауди ку8', 'эскалейд', 'escalade'],
    name: 'Porsche Cayenne / Audi Q7',
    category: 'suv',
    carClass: 'class_3_xl',
    categoryLabel: 'Внедорожник',
  },
  {
    keywords: ['минивэн', 'в-класс', 'v-class', 'мультивен', 'multivan', 'alphard', 'альфард', 'staria', 'стария'],
    name: 'Mercedes V-Class / Multivan',
    category: 'suv',
    carClass: 'class_3_xl',
    categoryLabel: 'Внедорожник / Минивэн',
  },
];

/**
 * Detects if user message contains specific car brand or model
 */
function detectCarFromText(text: string): SelectedCar | null {
  const lower = text.toLowerCase();

  for (const car of CAR_DATABASE) {
    for (const kw of car.keywords) {
      if (lower.includes(kw)) {
        return {
          name: car.name,
          category: car.category,
          carClass: car.carClass,
          categoryLabel: car.categoryLabel,
        };
      }
    }
  }

  // Explicit class mention
  if (lower.includes('седан') || lower.includes('хэтчбек') || lower.includes('купе')) {
    return {
      name: 'Седан / Купе',
      category: 'sedan',
      carClass: 'class_1_sedan',
      categoryLabel: 'Седан',
    };
  }

  if (lower.includes('кроссовер') || lower.includes('паркетник')) {
    return {
      name: 'Компактный кроссовер',
      category: 'crossover',
      carClass: 'class_2_suv',
      categoryLabel: 'Кроссовер',
    };
  }

  if (lower.includes('внедорожник') || lower.includes('джип') || lower.includes('минивэн') || lower.includes('пикап')) {
    return {
      name: 'Полноразмерный внедорожник',
      category: 'suv',
      carClass: 'class_3_xl',
      categoryLabel: 'Внедорожник',
    };
  }

  return null;
}

/**
 * Extracts date from Russian user query
 */
function parseRequestedDate(text: string): { dateStr: string; dateFormatted: string } {
  const lower = text.toLowerCase();
  const now = new Date();

  // 1. "сегодня"
  if (lower.includes('сегодня')) {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      dateFormatted: `Сегодня, ${now.getDate()} ${RU_MONTHS[now.getMonth()]}`,
    };
  }

  // 2. "послезавтра"
  if (lower.includes('послезавтра')) {
    const target = new Date();
    target.setDate(target.getDate() + 2);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      dateFormatted: `${target.getDate()} ${RU_MONTHS[target.getMonth()]}`,
    };
  }

  // 3. "завтра"
  if (lower.includes('завтра')) {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      dateFormatted: `Завтра, ${target.getDate()} ${RU_MONTHS[target.getMonth()]}`,
    };
  }

  // 4. "на выходных", "в эти выходные"
  if (lower.includes('выходн')) {
    const day = now.getDay();
    const diffToSat = (6 - day + 7) % 7 || 7;
    const target = new Date();
    target.setDate(target.getDate() + diffToSat);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      dateFormatted: `В субботу, ${target.getDate()} ${RU_MONTHS[target.getMonth()]}`,
    };
  }

  // 5. Weekdays
  const weekdays: Record<string, number> = {
    воскресень: 0,
    понедельник: 1,
    вторник: 2,
    сред: 3,
    четверг: 4,
    пятниц: 5,
    суббот: 6,
  };

  for (const [key, targetDay] of Object.entries(weekdays)) {
    if (lower.includes(key)) {
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      const target = new Date();
      target.setDate(target.getDate() + diff);
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      return {
        dateStr: `${yyyy}-${mm}-${dd}`,
        dateFormatted: `${target.getDate()} ${RU_MONTHS[target.getMonth()]}`,
      };
    }
  }

  // 6. Specific numeric day + month name or "числа"
  const dayMatch = lower.match(/(\d{1,2})\s*(?:-?го)?\s*(числа|янв|фев|мар|апр|ма[йя]|июн|июл|авг|сен|окт|ноя|дек)?/);
  if (dayMatch && dayMatch[1]) {
    const dayNum = parseInt(dayMatch[1], 10);
    if (dayNum >= 1 && dayNum <= 31) {
      const target = new Date();
      target.setDate(dayNum);
      if (target.getTime() < now.getTime() - 86400000) {
        target.setMonth(target.getMonth() + 1);
      }
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      return {
        dateStr: `${yyyy}-${mm}-${dd}`,
        dateFormatted: `${target.getDate()} ${RU_MONTHS[target.getMonth()]}`,
      };
    }
  }

  // Default: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    dateFormatted: `Завтра, ${tomorrow.getDate()} ${RU_MONTHS[tomorrow.getMonth()]}`,
  };
}

/**
 * Extracts time from Russian user query
 */
function parseRequestedTime(text: string): { timeStr: string; timeFormatted: string } {
  const lower = text.toLowerCase();

  // 1. Explicit HH:MM or HH.MM (e.g. 14:30, 10.00)
  const timeRegex = /(?:в\s*)?([0-2]?\d)[:.]([0-5]\d)/;
  const matchColon = lower.match(timeRegex);
  if (matchColon) {
    const hours = String(parseInt(matchColon[1], 10)).padStart(2, '0');
    const minutes = matchColon[2];
    return { timeStr: `${hours}:${minutes}`, timeFormatted: `${hours}:${minutes}` };
  }

  // 2. "в 14", "в 11 часов", "в 16", "в 9 утра", "в 18 вечера"
  const hourRegex = /(?:в\s*)([0-2]?\d)\s*(?:ч|час|часов|утра|вечера|дня)?\b/;
  const matchHour = lower.match(hourRegex);
  if (matchHour) {
    const val = parseInt(matchHour[1], 10);
    if (val >= 0 && val <= 23) {
      const hours = String(val).padStart(2, '0');
      return { timeStr: `${hours}:00`, timeFormatted: `${hours}:00` };
    }
  }

  // 3. Time of day
  if (lower.includes('утром') || lower.includes('с утра') || lower.includes('пораньше')) {
    return { timeStr: '10:00', timeFormatted: '10:00' };
  }
  if (lower.includes('днем') || lower.includes('в обед')) {
    return { timeStr: '14:00', timeFormatted: '14:00' };
  }
  if (lower.includes('вечером') || lower.includes('после работы') || lower.includes('попозже')) {
    return { timeStr: '18:00', timeFormatted: '18:00' };
  }

  // Default: 14:00
  return { timeStr: '14:00', timeFormatted: '14:00' };
}

/**
 * Finds the best matching service from catalog based on query keywords
 */
function resolveMatchedService(text: string, services: ServiceItem[]): ServiceItem {
  const lower = text.toLowerCase();

  if (lower.includes('керамик') || lower.includes('жидкое стекло') || lower.includes('9h') || lower.includes('кварц')) {
    const found = services.find((s) => s.category.toLowerCase().includes('керамик') || s.name.toLowerCase().includes('керамик'));
    if (found) return found;
  }

  if (lower.includes('пленк') || lower.includes('оклейк') || lower.includes('броня') || lower.includes('бронир') || lower.includes('ppf') || lower.includes('полиуретан')) {
    const found = services.find((s) => s.category.toLowerCase().includes('пленк') || s.name.toLowerCase().includes('оклейк') || s.name.toLowerCase().includes('пленк'));
    if (found) return found;
  }

  if (lower.includes('полировк') || lower.includes('блеск') || lower.includes('царапин') || lower.includes('паутинк')) {
    const found = services.find((s) => s.category.toLowerCase().includes('полировк') || s.name.toLowerCase().includes('полировк'));
    if (found) return found;
  }

  if (lower.includes('химчистк') || lower.includes('салон') || lower.includes('кожа') || lower.includes('пятна') || lower.includes('ткань')) {
    const found = services.find((s) => s.category.toLowerCase().includes('химчист') || s.name.toLowerCase().includes('химчист'));
    if (found) return found;
  }

  if (lower.includes('осмотр') || lower.includes('консультац') || lower.includes('диагностик') || lower.includes('дефектовк') || lower.includes('оцен')) {
    const found = services.find((s) => s.priceType === 'inspection' || s.name.toLowerCase().includes('осмотр'));
    if (found) return found;
  }

  if (lower.includes('мойк') || lower.includes('помыть') || lower.includes('комплекс') || lower.includes('трехфазная') || lower.includes('3-фазная') || lower.includes('стандарт') || lower.includes('премиум')) {
    const found = services.find((s) => s.category.toLowerCase().includes('мойк') || s.name.toLowerCase().includes('мойк'));
    if (found) return found;
  }

  return services[0];
}

/**
 * Returns formatted price text for a service and car class
 */
function formatServicePrice(service: ServiceItem, selectedCar: SelectedCar): string {
  if (service.priceType === 'inspection') {
    return 'Бесплатно (0 ₽)';
  }
  const price = service.prices[selectedCar.carClass] ?? 0;
  if (price === 0) return 'Бесплатно (0 ₽)';
  if (service.priceType === 'from') {
    return `от ${price.toLocaleString('ru-RU')} ₽`;
  }
  return `${price.toLocaleString('ru-RU')} ₽`;
}

/**
 * Autonomous Rule-based Detailing AI Concierge.
 * Complete coverage of all real customer intents, vehicle detection, objection handling, and booking transactions.
 */
export async function processAiMessage(options: ProcessMessageOptions): Promise<AiProcessResult> {
  const { userMessage, studio, services, createAppointment, onUpdateSelectedCar } = options;
  let activeCar = options.selectedCar;
  const lower = userMessage.toLowerCase().trim();

  // 1. Simulate realistic response delay (650 - 950 ms)
  const delayMs = Math.floor(650 + Math.random() * 300);
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  // 2. Intelligent Auto-Detection of Vehicle Brand & Class
  const recognizedCar = detectCarFromText(lower);
  let carRecognitionPill = '';
  if (recognizedCar && recognizedCar.name !== activeCar.name) {
    activeCar = recognizedCar;
    if (onUpdateSelectedCar) {
      onUpdateSelectedCar(recognizedCar);
    }
    carRecognitionPill = `🚗 Переключил класс на: **${recognizedCar.name}** (${recognizedCar.categoryLabel}). Все расчёты ниже рассчитаны под него.\n\n`;
  }

  // -------------------------------------------------------------------------
  // SCENARIO 1: BOOKING & RESERVATION
  // ("запиши", "записать", "бронь", "забронировать", "запишите", "хочу приехать")
  // -------------------------------------------------------------------------
  const isBookingIntent =
    lower.includes('запиш') ||
    lower.includes('записат') ||
    lower.includes('бронь') ||
    lower.includes('забронир') ||
    lower.includes('забронируй') ||
    lower.includes('хочу записаться') ||
    lower.includes('хочу приехать') ||
    lower.includes('назначь');

  if (isBookingIntent) {
    const targetService = resolveMatchedService(lower, services);
    const { dateStr, dateFormatted } = parseRequestedDate(lower);
    const { timeStr, timeFormatted } = parseRequestedTime(lower);

    // Call atomic createAppointment in context
    const appointment = await createAppointment({
      serviceId: targetService.id,
      serviceName: targetService.name,
      dateStr,
      timeStr,
      price: targetService.prices[activeCar.carClass],
      carModel: activeCar.name,
      customerName: 'Клиент (AI-запись)',
      customerPhone: studio.branch.phone || '+7 (999) 000-00-00',
    });

    const priceText =
      appointment.price > 0
        ? `${appointment.price.toLocaleString('ru-RU')} ₽`
        : 'Бесплатно (0 ₽)';

    return {
      text: `${carRecognitionPill}Готово! Бокс успешно забронирован для вашего автомобиля **${activeCar.name}**.\n\n🛠 **Услуга:** ${appointment.serviceName}\n📅 **Дата:** ${dateFormatted}\n⏰ **Время:** ${timeFormatted}\n💰 **Стоимость:** ${priceText}\n📍 **Адрес:** ${studio.branch.city}, ${studio.branch.address}\n\nЭлектронный талон сохранён. Вы можете добавить его в календарь или посмотреть статус во вкладке «Мои записи».`,
      bookingCard: {
        bookingId: appointment.bookingId,
        accessToken: appointment.accessToken,
        serviceName: appointment.serviceName,
        dateFormatted,
        timeFormatted,
        price: appointment.price,
        carModel: activeCar.name,
        currency: 'RUB',
      },
      suggestedPrompts: [
        'Перейти в мои записи',
        'Что входит в эту услугу?',
        'Как к вам проехать?',
        'Есть ли клиентская зона?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 2: CERAMIC COATING & QUARTZ
  // ("керамика", "жидкое стекло", "9h", "кварц", "защита кузова")
  // -------------------------------------------------------------------------
  if (
    lower.includes('керамик') ||
    lower.includes('жидкое стекло') ||
    lower.includes('9h') ||
    lower.includes('кварц')
  ) {
    const ceramicService = services.find((s) => s.category.toLowerCase().includes('керамик') || s.name.toLowerCase().includes('керамик')) || services[0];
    const priceText = formatServicePrice(ceramicService, activeCar);

    return {
      text: `${carRecognitionPill}🛡 **Керамическое покрытие 9H (2 слоя + гидрофобный топкоут):**\n\n• **Что даёт:** мощнейший гидрофобный эффект (грязь и вода не задерживаются), зеркальный мокрый блеск, защиту от птичьего помёта, химических реагентов и УФ-выгорания.\n• **Срок службы:** до 1.5–2 лет при правильном 3-фазном уходе.\n• **Технология:** перед нанесением керамики кузов обязательно проходит мягкую восстановительную полировку и обезжиривание спиртовыми праймерами.\n• **Стоимость для ${activeCar.name}:** **${priceText}**.\n• **Время работы:** ~24 часа (для полной полимеризации первого слоя).\n\nЗаписать ваш автомобиль на керамику?`,
      suggestedPrompts: [
        `Запиши на керамику на ${activeCar.name}`,
        'Нужна ли полировка перед керамикой?',
        'Какая гарантия на керамику?',
        'Прайс на все услуги',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 3: PPF POLYURETHANE FILM
  // ("пленка", "оклейка", "броня", "бронепленка", "ppf", "полиуретан", "зоны риска")
  // -------------------------------------------------------------------------
  if (
    lower.includes('пленк') ||
    lower.includes('оклейк') ||
    lower.includes('броня') ||
    lower.includes('бронир') ||
    lower.includes('ppf') ||
    lower.includes('полиуретан') ||
    lower.includes('зоны риска')
  ) {
    const ppfService = services.find((s) => s.category.toLowerCase().includes('пленк') || s.name.toLowerCase().includes('оклейк') || s.name.toLowerCase().includes('пленк')) || services[0];
    const priceText = formatServicePrice(ppfService, activeCar);

    return {
      text: `${carRecognitionPill}🛡 **Антигравийная полиуретановая плёнка (PPF 190–210 мкм):**\n\n• **Только полиуретан премиум-класса** (не путать с дешевым винилом, который мутнеет и трескается).\n• **Топкоут Top Coat:** функция самозатягивания царапин при нагреве солнцем или тёплой водой.\n• **Комплекс «Зоны риска» включает:** передний бампер, капот целиком, передние крылья, фары и ПТФ, зеркала заднего вида, стойки лобового стекла, полосу над лобовым на крыше, зоны под дверными ручками и полосу погрузки багажника.\n• **Срок службы и гарантия:** 5–7 лет без пожелтения и отслаивания.\n• **Стоимость для ${activeCar.name}:** **${priceText}**.\n\nМожем записать вас на оклейку или бесплатный замер ЛКП.`,
      suggestedPrompts: [
        `Запиши на оклейку на ${activeCar.name}`,
        'Желтеет ли полиуретан со временем?',
        'Сколько длится оклейка?',
        'Осмотр и консультация мастера',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 4: POLISHING & SCRATCH REMOVAL
  // ("полировка", "царапины", "паутинка", "блеск", "лак", "голограммы")
  // -------------------------------------------------------------------------
  if (
    lower.includes('полировк') ||
    lower.includes('царапин') ||
    lower.includes('паутинк') ||
    lower.includes('голограмм') ||
    lower.includes('блеск') ||
    lower.includes('помутнел')
  ) {
    const polishService = services.find((s) => s.category.toLowerCase().includes('полировк') || s.name.toLowerCase().includes('полировк')) || services[0];
    const priceText = formatServicePrice(polishService, activeCar);

    return {
      text: `${carRecognitionPill}✨ **Восстановительная детейлинг-полировка ЛКП:**\n\n• **Безопасность лака:** используем толщиномер до и после работы на каждом элементе. Снимаем всего 2–4 микрона заводского лака (при общем слое лака 35–50 микрон).\n• **Результат:** удаление до 95% мелких царапин, "паутинки" от моек и голограмм. Глубокий зеркальный глянец.\n• **Пасты и круги:** только профессиональные линейки Rupes, Koch Chemie, Menzerna.\n• **Время:** ~6–8 часов.\n• **Стоимость для ${activeCar.name}:** **${priceText}**.\n\nРекомендуем после полировки запечатать лак керамикой или твердым воском. Записать вас?`,
      suggestedPrompts: [
        `Запиши на полировку на завтра`,
        'Не сотрете ли лак?',
        'Сколько держится полировка?',
        'Комплексная детейлинг-мойка',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 5: DRY CLEANING & INTERIOR DETAILING
  // ("химчистка", "салон", "кожа", "пятна", "сиденья", "запах", "потолок")
  // -------------------------------------------------------------------------
  if (
    lower.includes('химчистк') ||
    lower.includes('салон') ||
    lower.includes('кожа') ||
    lower.includes('пятн') ||
    lower.includes('запах') ||
    lower.includes('сидень') ||
    lower.includes('потолок')
  ) {
    const dryService = services.find((s) => s.category.toLowerCase().includes('химчист') || s.name.toLowerCase().includes('химчист')) || services[0];
    const priceText = formatServicePrice(dryService, activeCar);

    return {
      text: `${carRecognitionPill}🧼 **Глубокая детейлинг-химчистка интерьера:**\n\n• **Что входит:** экстракторная чистка ковролина и сидений аппаратом Santoemma, кистевая проработка воздуховодов и стыков аппаратом Tornador, чистка и консервация кожи премиальными бальзамами, озонирование салона.\n• **Главное преимущество:** сушим салон профессиональным автофеном — вы забираете **полностью сухой автомобиль** без запаха прелости и риска плесени!\n• **Устранение запахов:** озонатор уничтожает 99.9% бактерий и въевшиеся запахи табака и животных.\n• **Стоимость для ${activeCar.name}:** **${priceText}**.\n• **Длительность:** ~4–6 часов.`,
      suggestedPrompts: [
        `Запиши на химчистку на ${activeCar.name}`,
        'Отдадите сухую машину?',
        'Уберет ли запах табака?',
        'Прайс на все услуги',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 6: DETAILING WASH & 3-PHASE WASH
  // ("мойка", "помыть", "комплекс", "3 фазы", "трехфазная", "грязная")
  // -------------------------------------------------------------------------
  if (
    lower.includes('мойк') ||
    lower.includes('помыть') ||
    lower.includes('комплекс') ||
    lower.includes('фазн') ||
    lower.includes('грязн') ||
    lower.includes('помыть кузов')
  ) {
    const washService = services.find((s) => s.category.toLowerCase().includes('мойк') || s.name.toLowerCase().includes('мойк')) || services[0];
    const priceText = formatServicePrice(washService, activeCar);

    return {
      text: `${carRecognitionPill}🚿 **Детейлинг-мойка кузова и комплексный уход:**\n\n• **1-я фаза:** бережный бесконтактный состав размягчает дорожную статику без повреждения хрома и пластика.\n• **2-я фаза:** ручная мойка пористой крупноячеистой губкой по системе двух вёдер с пескоотделителями (исключает круговые царапины).\n• **3-я фаза:** нанесение жидкого кварца / консерванта для гидрофоба и глубокого блеска.\n• **Сушка:** бесконтактная турбосушка тёплым воздухом кузова, дисков, зеркал и дверных проёмов.\n• **Интерьер:** бережная уборка салона, очистка стёкол и чернение резины.\n• **Стоимость для ${activeCar.name}:** **${priceText}** (~1.5–2 часа).`,
      suggestedPrompts: [
        `Запиши на мойку на завтра в 14:00`,
        `Запиши на мойку на сегодня`,
        'Сколько стоит полировка?',
        'Есть ли свободные окна?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 7: INSPECTION & MASTER CONSULTATION
  // ("осмотр", "консультация", "диагностика", "посмотреть", "оценить")
  // -------------------------------------------------------------------------
  if (
    lower.includes('осмотр') ||
    lower.includes('консультац') ||
    lower.includes('диагностик') ||
    lower.includes('посмотреть') ||
    lower.includes('дефектовк') ||
    lower.includes('оценить')
  ) {
    return {
      text: `${carRecognitionPill}🔍 **Осмотр и консультация мастера-технолога:**\n\n• **Стоимость: 0 ₽ (абсолютно бесплатно)**.\n• **Длительность:** 20–30 минут.\n• **Что делаем:** замеряем толщину заводского лака толщиномером на всех деталях, определяем перекрашенные элементы, оцениваем глубину царапин и состояние салона, подбираем оптимальный комплекс и составляем точную смету без навязывания лишних работ.\n\nЗаписать вас на осмотр на удобное время?`,
      suggestedPrompts: [
        'Запиши на осмотр на завтра',
        'Запиши на осмотр на сегодня',
        'Где вы находитесь?',
        'Сколько стоит полировка?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 8: PRICING & PRICE LIST
  // ("цена", "прайс", "сколько", "стоимость", "почем", "тариф")
  // -------------------------------------------------------------------------
  const isPriceIntent =
    lower.includes('цен') ||
    lower.includes('прайс') ||
    lower.includes('скольк') ||
    lower.includes('стоим') ||
    lower.includes('почем') ||
    lower.includes('тариф');

  if (isPriceIntent) {
    const list = services
      .slice(0, 6)
      .map((s) => `• **${s.name}:** ${formatServicePrice(s, activeCar)}`)
      .join('\n');

    return {
      text: `${carRecognitionPill}📋 **Актуальный прайс-лист студии ${studio.name} для вашего авто:**\n🚘 **${activeCar.name}** (Класс: ${activeCar.categoryLabel})\n\n${list}\n\n💡 Цены фиксируются при бронировании. Чтобы занять удобный слот, просто напишите, например: «Запиши на мойку на завтра в 15:00».`,
      suggestedPrompts: [
        'Запиши на комплекс на завтра',
        'Сколько стоит керамика?',
        'Сколько стоит полировка?',
        'Есть ли скидки?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 9: DISCOUNTS, PROMOTIONS & GIFTS
  // ("скидки", "акции", "скидка", "подарок", "первый визит", "бонус")
  // -------------------------------------------------------------------------
  if (
    lower.includes('скидк') ||
    lower.includes('акци') ||
    lower.includes('подарок') ||
    lower.includes('бонус') ||
    lower.includes('первый визит') ||
    lower.includes('дешевле')
  ) {
    return {
      text: `${carRecognitionPill}🎁 **Специальные условия для вас:**\n\n1. **Скидка 10% на первый визит** при бронировании любого комплекса через наше онлайн-приложение.\n2. **Подарок:** бесплатная обработка лобового стекла и боковых зеркал гидрофобным составом «Антидождь» при заказе полировки кузова или химчистки.\n3. **Бесплатная диагностика:** замер толщины ЛКП толщиномером на каждом элементе — всегда 0 ₽.\n\nХотите воспользоваться спецпредложением прямо сейчас?`,
      suggestedPrompts: [
        `Запиши со скидкой 10% на завтра`,
        'Сколько стоит полировка со скидкой?',
        'Сколько стоит мойка со скидкой?',
        'Осмотр и консультация мастера',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 10: PAYMENT METHODS & DOCUMENTS
  // ("оплата", "как платить", "картой", "безнал", "счет", "рассрочка", "предоплата")
  // -------------------------------------------------------------------------
  if (
    lower.includes('оплат') ||
    lower.includes('платить') ||
    lower.includes('карт') ||
    lower.includes('безнал') ||
    lower.includes('счет') ||
    lower.includes('юрлиц') ||
    lower.includes('предоплат') ||
    lower.includes('терминал') ||
    lower.includes('сбп')
  ) {
    return {
      text: `💳 **Способы оплаты в студии ${studio.name}:**\n\n• **Никакой предоплаты:** расчёт производится строго по факту выполненных работ после вашей личной проверки и приёмки автомобиля.\n• **Банковские карты:** Visa, MasterCard, МИР через терминал.\n• **СБП (Система быстрых платежей):** моментальная оплата по QR-коду.\n• **Наличный расчёт.**\n• **Безналичный расчёт для юрлиц:** выставляем счёт, предоставляем полный комплект закрывающих документов (акт, УПД, договор).\n\nГотовы забронировать удобный слот?`,
      suggestedPrompts: [
        'Запиши на мойку на завтра',
        'Прайс для моего авто',
        'Где вы находитесь?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 11: WAITING LOUNGE & AMENITIES
  // ("где подождать", "лаунж", "кофе", "диван", "вайфай", "wi-fi", "комната отдыха")
  // -------------------------------------------------------------------------
  if (
    lower.includes('подождать') ||
    lower.includes('лаунж') ||
    lower.includes('кофе') ||
    lower.includes('диван') ||
    lower.includes('wi-fi') ||
    lower.includes('вайфай') ||
    lower.includes('комната отдыха') ||
    lower.includes('зона ожидания')
  ) {
    return {
      text: `☕ **Комфортная клиентская зона в студии ${studio.name}:**\n\nПока ваш автомобиль находится в заботливых руках наших мастеров, вы можете с комфортом отдохнуть в лаунже:\n• Зерновой итальянский кофе, чай и прохладительные напитки.\n• Удобные мягкие кожаные диваны и кондиционирование.\n• Высокоскоростной бесплатный Wi-Fi и рабочие розетки.\n• Игровая приставка PlayStation 5.\n• Мониторы видеонаблюдения с прямой трансляцией из боксов — вы всегда видите процесс работы над своим авто.\n\nЛибо вы можете оставить автомобиль и вернуться к назначенному времени готовности.`,
      suggestedPrompts: [
        'Запиши на завтра в 14:00',
        'Сколько длится детейлинг-мойка?',
        'Где вы находитесь?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 12: MANAGE BOOKINGS / RESCHEDULE / CANCEL
  // ("отменить", "перенести", "мои записи", "где запись", "талон", "опоздаю")
  // -------------------------------------------------------------------------
  if (
    lower.includes('отмен') ||
    lower.includes('перенес') ||
    lower.includes('мои запис') ||
    lower.includes('мой талон') ||
    lower.includes('опозда')
  ) {
    return {
      text: `📲 **Управление вашими записями:**\n\nВсе ваши активные талоны хранятся в разделе **«Мои записи»** (иконка календаря в нижнем меню приложения).\n\nТам вы можете:\n• Посмотреть номер брони, дату и точный адрес студии.\n• Скачать запись в Apple / Google Calendar (файл .ics).\n• Перенести время или отменить визит в 1 клик без необходимости звонить.\n• Показать электронный талон мастеру при сдаче авто.\n\nНажмите кнопку ниже, чтобы открыть ваши записи прямо сейчас:`,
      suggestedPrompts: [
        'Перейти в мои записи',
        'Записаться на другую услугу',
        'Позвонить в студию',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 13: OBJECTIONS & WHY QUALITY MATTERS
  // ("дорого", "почему так дорого", "гарантия", "сотрете лак", "боюсь")
  // -------------------------------------------------------------------------
  if (
    lower.includes('дорог') ||
    lower.includes('почему так') ||
    lower.includes('гаранти') ||
    lower.includes('сотрете лак') ||
    lower.includes('протрете') ||
    lower.includes('боюсь')
  ) {
    return {
      text: `💎 **Почему клиенты доверяют именно нам:**\n\n1. **Опыт и сертификация:** наши мастера имеют опыт от 5 лет и проходят регулярную сертификацию.\n2. **Премиум-химия:** работаем только проверенными составами (Koch Chemie, Rupes, Menzerna, SunTek, Gyeon). Никаких агрессивных щелочных пен, убивающих хром.\n3. **Инструментальный контроль:** перед полировкой замеряем лак толщиномером. Снимаем микроны, сохраняя заводской слой.\n4. **Ответственность:** несём полную материальную ответственность за сохранность авто на всё время пребывания в студии.\n5. **Гарантия:** предоставляем официальную гарантию на плёнку (5–7 лет) и керамику (до 2 лет).\n\nПриезжайте на бесплатный осмотр — мастер всё покажет и объяснит до начала работ!`,
      suggestedPrompts: [
        'Запиши на бесплатный осмотр',
        'Сколько стоит полировка?',
        'Где вы находитесь?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 14: LOCATION & CONTACTS
  // ("где", "адрес", "телефон", "график", "как доехать", "навигатор")
  // -------------------------------------------------------------------------
  if (
    lower.includes('где') ||
    lower.includes('адрес') ||
    lower.includes('находит') ||
    lower.includes('доехать') ||
    lower.includes('проехать') ||
    lower.includes('телефон') ||
    lower.includes('номер') ||
    lower.includes('контакт') ||
    lower.includes('график') ||
    lower.includes('режим') ||
    lower.includes('работаете')
  ) {
    return {
      text: `📍 **Контакты и адрес студии ${studio.name}:**\n\n• **Адрес:** ${studio.branch.city}, ${studio.branch.address}\n• **Телефон:** ${studio.branch.phone}\n• **Режим работы:** ${studio.branch.workingHoursText}\n• **Рейтинг на Яндекс Картах:** ⭐ ${studio.branch.yandexRating || '5.0'} (${studio.branch.badge || 'Хорошее место'})\n\nВ шапке приложения есть кнопка «Карта» для мгновенного построения маршрута в Яндекс Навигаторе.`,
      suggestedPrompts: [
        'Запиши на завтра в 14:00',
        'Прайс для моего авто',
        'Какие услуги есть?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // SCENARIO 15: GREETINGS & SMALL TALK
  // ("привет", "здравствуй", "добрый день", "салют", "хай")
  // -------------------------------------------------------------------------
  if (
    lower.includes('привет') ||
    lower.includes('здравствуй') ||
    lower.includes('добрый день') ||
    lower.includes('доброе утро') ||
    lower.includes('добрый вечер') ||
    lower.includes('салют') ||
    lower.includes('хай')
  ) {
    return {
      text: `${carRecognitionPill}Здравствуйте! Я онлайн-консультант премиальной студии **${studio.name}**.\n\n🚘 Текущий выбранный авто: **${activeCar.name}** (${activeCar.categoryLabel}). Если у вас другая модель, просто напишите её название!\n\nЧем могу помочь?\n• Рассчитать точную стоимость под вашу модель\n• Забронировать бокс на удобный день и час\n• Рассказать про мойку, полировку, керамику, оклейку пленкой или химчистку`,
      suggestedPrompts: [
        'Сколько стоит комплексная мойка?',
        'Прайс на все услуги',
        'Запиши на завтра в 14:00',
        'Есть ли скидка на первый визит?',
      ],
      detectedCar: recognizedCar || undefined,
    };
  }

  // -------------------------------------------------------------------------
  // DEFAULT FALLBACK: SMART CONCIERGE ASSISTANCE
  // -------------------------------------------------------------------------
  return {
    text: `${carRecognitionPill}Я помогу вам с любым вопросом по детейлингу автомобиля **${activeCar.name}**:\n\n• Узнать точную стоимость (мойка, полировка, керамика, оклейка PPF, химчистка)\n• Записаться на свободное время (просто напишите: *«Запиши на комплекс на завтра в 15:00»*)\n• Уточнить технологию работ, используемую химию и гарантию\n• Подсказать адрес (${studio.branch.address}) и график работы\n\nЧто именно вас интересует?`,
    suggestedPrompts: [
      'Прайс для моего авто',
      'Запиши на мойку на завтра',
      'Сколько стоит полировка?',
      'Бесплатный осмотр мастера',
    ],
    detectedCar: recognizedCar || undefined,
  };
}

export const geminiService = {
  processMessage: processAiMessage,
};
