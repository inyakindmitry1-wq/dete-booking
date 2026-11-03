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

  // 4. Weekdays: в понедельник, во вторник, в среду, в четверг, в пятницу, в субботу, в воскресенье
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
      if (diff <= 0) diff += 7; // next occurrence
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

  // 5. Specific numeric day + month name or "числа"
  const dayMatch = lower.match(/(\d{1,2})\s*(?:-?го)?\s*(числа|янв|фев|мар|апр|ма[йя]|июн|июл|авг|сен|окт|ноя|дек)?/);
  if (dayMatch && dayMatch[1]) {
    const dayNum = parseInt(dayMatch[1], 10);
    if (dayNum >= 1 && dayNum <= 31) {
      const target = new Date();
      target.setDate(dayNum);
      if (target.getTime() < now.getTime() - 86400000) {
        // If past day in current month, roll to next month
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
  if (lower.includes('утром') || lower.includes('с утра')) {
    return { timeStr: '10:00', timeFormatted: '10:00' };
  }
  if (lower.includes('днем') || lower.includes('в обед')) {
    return { timeStr: '14:00', timeFormatted: '14:00' };
  }
  if (lower.includes('вечером')) {
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

  if (lower.includes('химчистк') || lower.includes('салон') || lower.includes('кожа') || lower.includes('пятна')) {
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
 * Autonomous Rule-based Mock AI Engine running 100% locally in browser without API keys.
 */
export async function processAiMessage(options: ProcessMessageOptions): Promise<AiProcessResult> {
  const { userMessage, studio, services, selectedCar, createAppointment } = options;
  const lower = userMessage.toLowerCase().trim();

  // 1. Simulate realistic response delay (700 - 1000 ms) with typing effect
  const delayMs = Math.floor(700 + Math.random() * 300);
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  // -------------------------------------------------------------------------
  // INTENT 1: BOOKING ("запиши", "записать", "бронь", "забронировать", "запишите")
  // -------------------------------------------------------------------------
  const isBookingIntent =
    lower.includes('запиш') ||
    lower.includes('записат') ||
    lower.includes('бронь') ||
    lower.includes('забронир') ||
    lower.includes('забронируй') ||
    lower.includes('хочу записаться') ||
    lower.includes('назначь');

  if (isBookingIntent) {
    const targetService = resolveMatchedService(lower, services);
    const { dateStr, dateFormatted } = parseRequestedDate(lower);
    const { timeStr, timeFormatted } = parseRequestedTime(lower);

    // Call createAppointment in DemoStoreContext
    const appointment = await createAppointment({
      serviceId: targetService.id,
      serviceName: targetService.name,
      dateStr,
      timeStr,
      price: targetService.prices[selectedCar.carClass],
      carModel: selectedCar.name,
      customerName: 'Клиент (AI-запись)',
      customerPhone: studio.branch.phone || '+7 (999) 000-00-00',
    });

    const priceText =
      appointment.price > 0
        ? `${appointment.price.toLocaleString('ru-RU')} ₽`
        : 'Бесплатно (0 ₽)';

    return {
      text: `Отлично! Я успешно забронировал бокс для вашего автомобиля ${selectedCar.name} на услугу «${appointment.serviceName}».\n\n📅 Дата: ${dateFormatted}\n⏰ Время: ${timeFormatted}\n💰 Стоимость для ${selectedCar.categoryLabel}: ${priceText}\n📍 Адрес студии: ${studio.branch.city}, ${studio.branch.address}.\n\nЭлектронный талон сохранён в разделе «Мои записи».`,
      bookingCard: {
        bookingId: appointment.bookingId,
        accessToken: appointment.accessToken,
        serviceName: appointment.serviceName,
        dateFormatted,
        timeFormatted,
        price: appointment.price,
        carModel: selectedCar.name,
        currency: 'RUB',
      },
    };
  }

  // -------------------------------------------------------------------------
  // INTENT 2: PRICE INQUIRY ("цена", "прайс", "сколько", "стоимость", "почем")
  // -------------------------------------------------------------------------
  const isPriceIntent =
    lower.includes('цен') ||
    lower.includes('прайс') ||
    lower.includes('скольк') ||
    lower.includes('стоим') ||
    lower.includes('почем') ||
    lower.includes('тариф');

  if (isPriceIntent) {
    const isSpecific =
      lower.includes('мойк') ||
      lower.includes('полировк') ||
      lower.includes('керамик') ||
      lower.includes('пленк') ||
      lower.includes('оклейк') ||
      lower.includes('химчист') ||
      lower.includes('осмотр');

    if (isSpecific) {
      const svc = resolveMatchedService(lower, services);
      const priceText = formatServicePrice(svc, selectedCar);
      return {
        text: `Стоимость услуги «${svc.name}» для вашего автомобиля (${selectedCar.name}):\n👉 ${priceText}.\n\nДлительность: ${svc.durationMinutes ? `${Math.round(svc.durationMinutes / 60)} ч.` : 'от 2 часов'}.\n${svc.description}\n\nХотите записаться? Просто напишите, например: «Запиши на ${svc.name.toLowerCase()} на завтра в 14:00»!`,
      };
    }

    // Full Price List for Current Car
    const list = services
      .slice(0, 6)
      .map((s) => `• ${s.name}: ${formatServicePrice(s, selectedCar)}`)
      .join('\n');

    return {
      text: `Актуальный прайс-лист студии ${studio.name} для вашего автомобиля (${selectedCar.name}, класс ${selectedCar.categoryLabel}):\n\n${list}\n\nЦены зафиксированы. Чтобы забронировать свободный бокс, напишите: «Запиши на полировку на завтра в 15:00».`,
    };
  }

  // -------------------------------------------------------------------------
  // INTENT 3: SERVICE INQUIRY ("мойка", "полировка", "керамика", "комплекс", "осмотр")
  // -------------------------------------------------------------------------
  if (
    lower.includes('мойк') ||
    lower.includes('комплекс') ||
    lower.includes('полировк') ||
    lower.includes('керамик') ||
    lower.includes('пленк') ||
    lower.includes('оклейк') ||
    lower.includes('химчист') ||
    lower.includes('осмотр')
  ) {
    const svc = resolveMatchedService(lower, services);
    const priceText = formatServicePrice(svc, selectedCar);
    return {
      text: `Услуга «${svc.name}»:\n• Стоимость для ${selectedCar.name}: ${priceText}\n• Длительность: ${svc.durationMinutes ? `${Math.round(svc.durationMinutes / 60)} ч.` : 'от 2 ч.'}\n• Описание: ${svc.description}\n\nЗаписать вас на удобный день? Напишите, например: «Запиши на завтра в 12:00».`,
    };
  }

  // -------------------------------------------------------------------------
  // INTENT 4: LOCATION & CONTACTS ("где", "адрес", "телефон", "график", "часы")
  // -------------------------------------------------------------------------
  if (
    lower.includes('где') ||
    lower.includes('адрес') ||
    lower.includes('находит') ||
    lower.includes('как доехать') ||
    lower.includes('телефон') ||
    lower.includes('номер') ||
    lower.includes('контакт') ||
    lower.includes('график') ||
    lower.includes('режим') ||
    lower.includes('работаете')
  ) {
    return {
      text: `Студия ${studio.name}:\n📍 Адрес: ${studio.branch.city}, ${studio.branch.address}\n📞 Телефон: ${studio.branch.phone}\n⏰ График работы: ${studio.branch.workingHoursText}\n⭐ Рейтинг: ${studio.branch.yandexRating || '5.0'} (${studio.branch.badge || 'Хорошее место'})\n\nМогу подсказать свободные окна или записать вас прямо сейчас.`,
    };
  }

  // -------------------------------------------------------------------------
  // INTENT 5: GREETING ("привет", "здравствуй", "добрый день", "салют")
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
      text: `Здравствуйте! Я официальный онлайн-консультант студии ${studio.name}.\n\nВаш выбранный автомобиль: ${selectedCar.name} (${selectedCar.categoryLabel}).\n\nЯ знаю точные цены для вашего класса, регламенты работ по мойке, полировке, керамике и химчистке, а также могу мгновенно забронировать свободный бокс без очередей.\n\nКакая услуга или вопрос вас интересует?`,
    };
  }

  // -------------------------------------------------------------------------
  // DEFAULT FALLBACK
  // -------------------------------------------------------------------------
  return {
    text: `Я могу подсказать точные цены для вашего ${selectedCar.name}, рассказать о технологии детейлинга (мойка, полировка, керамика, оклейка пленкой, химчистка) или сразу забронировать бокс.\n\nНапишите, что вас интересует, или просто: «Запиши на комплексную мойку на завтра в 14:00».`,
  };
}

export const geminiService = {
  processMessage: processAiMessage,
};
