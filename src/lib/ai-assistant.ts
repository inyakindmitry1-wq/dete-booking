import { DbTenant, DbService } from '@/types/database';
import { getServicePriceForClass } from './pricing';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

function getAssistantApiKey(): string {
  const raw = import.meta.env.VITE_LLM_API_KEY || 'QVEuQWI4Uk42SjBRWFpiSC1lRFQxcjFLVmdBMmRzV1B6UGhwVXNWSWRmaERZRGwyNm94RWc=';
  if (typeof atob === 'function' && raw.startsWith('QVEu')) {
    try {
      return atob(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

/**
 * Intelligent domain-specialized AI concierge for Sokol Team Detailing
 * Formulates concise, strict, fact-only answers without fluff.
 */
export async function askStudioAssistant(
  userQuery: string,
  tenant: DbTenant,
  services: DbService[],
  history: ChatMessage[] = []
): Promise<string> {
  const query = userQuery.trim().toLowerCase();

  // 1. Try external LLM API if reachable
  try {
    const systemPrompt = `Ты — профессиональный онлайн-консультант детейлинг-студии "${tenant.name}".
Твоя задача: отвечать СТРОГО ПО ДЕЛУ, коротко, без лишних вступлений и воды.
Информация о студии:
- Адрес: ${tenant.city}, ${tenant.address}.
- Телефон: ${tenant.phone}.
- График: 09:00 - 21:00 ежедневно.
Услуги и цены по классам авто:
1. Детейлинг-комплекс Стандарт: Седан 3 900 ₽, Кроссовер 4 500 ₽, Внедорожник 5 200 ₽ (3-фазная мойка кварц, турбосушка, диски/арки, влажная уборка салона/багажника, стёкла, чернение).
2. Детейлинг-комплекс Премиум: Седан 5 900 ₽, Кроссовер 6 900 ₽, Внедорожник 7 900 ₽ (всё из стандарта + чистка дисков от нагара, чистка петель/проёмов кистями, химчистка салона).
3. Восстановительная полировка: Седан 18 000 ₽, Кроссовер 21 000 ₽, Внедорожник 25 000 ₽ (удаление до 95% царапин).
4. Керамическая защита 9H (2 слоя): Седан 32 000 ₽, Кроссовер 37 000 ₽, Внедорожник 43 000 ₽ (сверхгидрофоб, стойкость 2 года).
5. Антигравийный комплекс (PPF): Седан 75 000 ₽, Кроссовер 85 000 ₽, Внедорожник 95 000 ₽ (полиуретан 200 мкм на ударную часть).
6. Глубокая химчистка салона: Седан 14 000 ₽, Кроссовер 16 500 ₽, Внедорожник 19 000 ₽ (экстрактор, торнадор, уход за кожей, озонирование).

Правила ответа:
- Отвечай только на поставленный вопрос.
- Указывай точные цены в рублях по классам (Седан / Кроссовер / Внедорожник).
- Предлагай нажать кнопку «Записаться» в приложении для бронирования времени.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.vsegpt.ru/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAssistantApiKey()}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: 350,
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        return content.trim();
      }
    }
  } catch {
    // Graceful fallback to deterministic domain engine
  }

  // 2. High-precision Deterministic Knowledge Engine (Strict, fact-only, 0 latency)
  if (query.includes('стандарт') || query.includes('комплекс стандарт')) {
    return `Детейлинг-комплекс Стандарт:
• Седан: 3 900 ₽
• Кроссовер: 4 500 ₽
• Внедорожник: 5 200 ₽
Включает: 3-фазную мойку с кварцем, турбосушку кузова и проемов, мойку арок/дисков/шин, уборку салона и багажника с нишей запаски, консервацию интерьера, пропитку стёкол и чернение резины. Время работы: ~2 часа. Записаться можно через кнопку «Записаться».`;
  }

  if (query.includes('премиум') || query.includes('комплекс премиум')) {
    return `Детейлинг-комплекс Премиум:
• Седан: 5 900 ₽
• Кроссовер: 6 900 ₽
• Внедорожник: 7 900 ₽
Включает всё из стандарта + глубокую чистку дисков от колодочной пыли специальным составом, кистевую чистку дверных петель/проемов и поверхностную химчистку интерьера. Время: ~2 часа.`;
  }

  if (query.includes('полировк') || query.includes('царапин') || query.includes('паутин')) {
    return `Восстановительная полировка кузова:
• Седан: 18 000 ₽
• Кроссовер: 21 000 ₽
• Внедорожник: 25 000 ₽
Удаляет до 95% царапин, паутины и голограмм, возвращает идеальный зеркальный глянец. Длительность: 6 часов в боксе со спецосвещением Scangrip.`;
  }

  if (query.includes('керамик') || query.includes('9h') || query.includes('жидкое стекло') || query.includes('гидрофоб')) {
    return `Керамическая защита 9H (2 слоя):
• Седан: 32 000 ₽
• Кроссовер: 37 000 ₽
• Внедорожник: 43 000 ₽
Сверхгидрофобный эффект, защита лака от химических реагентов, выгорания и дорожного налета. Стойкость до 2 лет.`;
  }

  if (query.includes('пленк') || query.includes('бронепленк') || query.includes('ppf') || query.includes('антигравий')) {
    return `Антигравийная защита (PPF):
• Седан: 75 000 ₽
• Кроссовер: 85 000 ₽
• Внедорожник: 95 000 ₽
Оклейка ударной зоны (бампер, капот целиком, оптика, крылья, зеркала, зоны под ручками) полиуретаном толщиной 200 микрон с функцией самозатягивания от сколов.`;
  }

  if (query.includes('химчистк') || query.includes('салон') || query.includes('сиден') || query.includes('пятн')) {
    return `Глубокая химчистка салона:
• Седан: 14 000 ₽
• Кроссовер: 16 500 ₽
• Внедорожник: 19 000 ₽
Экстракторная чистка ковролина и текстиля, обработка аппаратом Tornador, очистка и кондиционирование кожи составами премиум-класса, озонирование и дезинфекция салона. Время: ~4 часа.`;
  }

  if (query.includes('где') || query.includes('адрес') || query.includes('находит') || query.includes('как доехать') || query.includes('локац')) {
    return `Студия ${tenant.name} находится по адресу: ${tenant.city}, ${tenant.address}.
Телефон: ${tenant.phone}.
График работы: ежедневно с 09:00 до 21:00 (воскресенье с 10:00 до 20:00).
В шапке приложения есть кнопка «Карта» для построения маршрута.`;
  }

  if (query.includes('как записат') || query.includes('окно') || query.includes('свободн') || query.includes('время') || query.includes('когда')) {
    return `Чтобы записаться на удобное время:
1. Нажмите «Записаться» на главной или в каталоге услуг.
2. Выберите класс вашего авто (Седан, Кроссовер или Внедорожник) — приложение сразу рассчитает точную стоимость.
3. Выберите дату и свободное окно.
4. Введите имя и телефон для получения электронного талона.`;
  }

  if (query.includes('цен') || query.includes('прайс') || query.includes('скольк')) {
    return `Прайс-лист Sokol Team Detailing:
• Стандарт мойка: от 3 900 ₽
• Премиум мойка: от 5 900 ₽
• Полировка кузова: от 18 000 ₽
• Керамика 9H (2 слоя): от 32 000 ₽
• Оклейка PPF: от 75 000 ₽
• Химчистка салона: от 14 000 ₽
Цены зависят от класса авто. Выберите услугу в каталоге, чтобы увидеть точную сумму под вашу модель.`;
  }

  return `Здравствуйте! Я официальный онлайн-консультант студии ${tenant.name}.
Отвечаю строго по делу:
• Могу подсказать точную стоимость услуг для вашего класса авто (Седан, Кроссовер, Внедорожник).
• Рассказать о технологии полировки, керамики, бронеплёнки PPF и химчистки.
• Подсказать наш адрес (${tenant.address}) и режим работы.
Какая услуга или вопрос вас интересует?`;
}
