# Клонирование и ребрендинг студии за 6 минут (CLONE-IN-6-MINUTES.md)

Вся архитектура построена вокруг принципа: **один кодовый билд — бесконечное количество брендов через конфигурацию `business.json`**. 

Вам не нужно переписывать React-компоненты или верстать новые страницы. Вот как запустить систему под нового заказчика за 6 минут:

---

### Минута 1: Клонирование и установка
```bash
git clone <repo-url> auto-booking
cd auto-booking
npm install
```

---

### Минута 2: Создание новой студии в конвейере
```bash
npm run tenant:new royal "ROYAL Detailing"
```
Команда создаст каталог `tenants/royal/` с файлом `business.json`.

---

### Минута 3: Настройка `business.json` и бренд-ассетов
Откройте `tenants/royal/business.json` и настройте параметры бизнеса:
```json
{
  "slug": "royal",
  "name": "ROYAL Detailing",
  "tagline": "Премиальный уход и бронирование авто",
  "phone": "+7 (999) 555-00-11",
  "address": "Кутузовский проспект, 12",
  "city": "Москва",
  "currency": "RUB",
  "timezone": "Europe/Moscow",
  "businessType": "detailing",
  "branding": {
    "accentColor": "#10B981", // Фирменный изумрудный цвет
    "logoUrl": "https://example.com/royal-logo.png",
    "coverUrl": "https://example.com/royal-cover.png",
    "theme": "luxury-dark"
  },
  "resources": [
    {
      "id": "e0000000-0000-4000-8000-000000000001",
      "name": "Бокс 1 (Мойка)",
      "type": "wash_bay",
      "is_active": true,
      "sort_order": 1
    }
  ],
  "services": [
    {
      "id": "f0000000-0000-4000-8000-000000000001",
      "category": "Мойка",
      "name": "Комплекс Royal",
      "description": "3-фазная мойка с консервацией воском",
      "duration_minutes": 90,
      "buffer_minutes": 15,
      "price": 5000,
      "is_active": true,
      "image_url": "https://example.com/service.jpg",
      "sort_order": 1
    }
  ],
  "serviceResources": [
    {
      "serviceId": "f0000000-0000-4000-8000-000000000001",
      "resourceId": "e0000000-0000-4000-8000-000000000001"
    }
  ]
}
```

---

### Минута 4: Автоматическая валидация
```bash
npm run tenant:validate royal
```
Скрипт проверит корректность схемы, наличие обязательных полей и корректность маппинга услуг к ресурсам.

---

### Минута 5: Публикация и генерация базы данных
```bash
npm run tenant:publish royal
```
Конвейер сгенерирует безопасный SQL-скрипт обновления, который можно накатить на Supabase, не затронув предыдущие студии (Graphite, Apex и др.) и сохранив все исторические записи.

---

### Минута 6: Готово!
Запустите приложение:
```bash
npm run dev
```
Откройте браузер по адресу: `http://localhost:5173/s/royal/`

Что произошло автоматически:
1. Загрузился фирменный изумрудный акцент `#10B981` для всех кнопок и фокусов.
2. Подставились логотип, обложка, контакты, расписание и услуги ROYAL Detailing.
3. Сгенерирован изолированный Web App Manifest со своим `start_url` и `id`.
4. Кабинет владельца доступен по адресу `/s/royal/owner/`.
5. Все остальные студии (`/s/graphite/`, `/s/apex/`) продолжают работать без единого конфликта!
