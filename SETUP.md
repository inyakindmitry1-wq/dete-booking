# Руководство по локальному запуску и развертыванию (SETUP.md)

Это руководство описывает полный цикл работы с многоарендной PWA онлайн-записи: локальный запуск, запуск тестов, настройка Supabase, Edge Functions, Cron-задач и публикация на Cloudflare Pages.

---

## 1. Системные требования
- **Node.js**: 20+ (рекомендуется v24+)
- **npm**: 10+
- **Git**

---

## 2. Быстрый локальный старт (за 1 минуту)

Для локального запуска не требуются внешние платные аккаунты — в проекте предусмотрен встроенный runtime-движок с сидами студий:

```bash
# 1. Установка зависимостей (lockfile зафиксирован)
npm install

# 2. Подготовка окружения
cp .env.example .env

# 3. Запуск dev-сервера
npm run dev
```

Приложение доступно по адресам:
- **Клиентский портал GRAPHITE Detailing**: `http://localhost:5173/s/graphite/`
- **Клиентский портал APEX Pitstop**: `http://localhost:5173/s/apex/`
- **Кабинет владельца GRAPHITE**: `http://localhost:5173/s/graphite/owner/`
- **Кабинет владельца APEX**: `http://localhost:5173/s/apex/owner/`

---

## 3. Запуск автоматических проверок и тестов

```bash
# Проверка типов TypeScript (strict mode)
npm run typecheck

# Модульные тесты (слоты, RFC 5545 iCalendar, crypto-токены, фин. статистика)
npm run test

# Интеграционные тесты (атомарные транзакции, EXCLUDE constraint, изоляция RLS, Outbox leases, AI tools)
npm run test:integration

# End-to-End тестирование в реальном браузере (Playwright)
npm run test:e2e

# Производственная сборка (Vite + Workbox Service Worker PWA)
npm run build
```

---

## 4. Конвейер управления бизнесами (Tenant Pipeline)

Конфигурации бизнесов хранятся в папке `tenants/<slug>/business.json`.

### 4.1 Создание новой студии
```bash
npm run tenant:new <slug> "<Название Студии>"
# Пример:
npm run tenant:new turbo "TURBO Tuning"
```
Команда создаст папку `tenants/turbo/` с валидным шаблоном `business.json`.

### 4.2 Валидация конфигураций
```bash
# Проверить все студии
npm run tenant:validate

# Или проверить конкретную студию
npm run tenant:validate graphite
```
Проверяет Zod-схему, наличие ресурсов, привязку услуг к постам и 7-дневный рабочий график.

### 4.3 Публикация и генерация миграций
```bash
npm run tenant:publish
```
Генерирует идемпотентные SQL-скрипты `publish.sql` и обновляет `supabase/seed.sql`.
> **Важно**: перепубликация сохраняет все ранее созданные клиентами записи, платежи и историю!

### 4.4 Проверка целостности
```bash
npm run tenant:verify
```

---

## 5. Развертывание в Supabase (Postgres, Auth, Storage, Edge Functions)

### 5.1 Инициализация базы данных
1. Создайте проект в [Supabase](https://supabase.com).
2. Выполните миграции из папки `supabase/migrations/` в SQL Editor:
   - `20261010000000_init_schema.sql` (таблицы, индексы, расширения `btree_gist`, EXCLUDE constraints)
   - `20261010000001_atomic_functions.sql` (атомарные функции бронирования, переноса, отмены, RLS)
3. Выполните сидирование из `supabase/seed.sql`.

### 5.2 Секреты для Edge Functions
В панели управления Supabase (`Settings` -> `Edge Functions` -> `Secrets`) добавьте:
```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_SUBJECT=mailto:admin@yourdomain.com
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=<your-openai-or-groq-key>
LLM_MODEL=gpt-4o-mini
LLM_MAX_TURNS=3
```

### 5.3 Настройка Supabase Cron (Outbox Notifications)
Для периодической обработки очереди уведомлений `notification_jobs` настройте cron расширение `pg_cron` в Supabase SQL Editor:

```sql
-- Запуск воркера уведомлений каждую минуту
SELECT cron.schedule(
  'process-notifications-every-minute',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://<your-project>.supabase.co/functions/v1/notifications-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <your-service-role-key>'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

---

## 6. Развертывание Frontend на Cloudflare Pages

1. Подключите Git-репозиторий в Cloudflare Pages.
2. Параметры сборки:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Переменные окружения (Environment Variables):
   - `VITE_SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>`
   - `VITE_DEFAULT_TENANT` = `graphite`
   - `VITE_VAPID_PUBLIC_KEY` = `<your-vapid-public-key>`
