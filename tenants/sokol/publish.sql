-- ==============================================================================
-- Tenant Publish Migration: Sokol Team Detailing (sokol)
-- Preserves existing customer bookings, payments, and historical data
-- ==============================================================================
BEGIN;

-- 1. Upsert Tenant
INSERT INTO tenants (
  slug, name, phone, address, city, currency, timezone, accent_color, logo_url, cover_url, business_type, is_preview
) VALUES (
  'sokol',
  'Sokol Team Detailing',
  '+7 (999) 111-22-33',
  'ул. Автозаводская, 23, стр. 7',
  'Москва',
  'RUB',
  'Europe/Moscow',
  '#FFFFFF',
  '/icons/sokol-logo.png',
  '/images/hero-car.png',
  'detailing',
  false
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  currency = EXCLUDED.currency,
  timezone = EXCLUDED.timezone,
  accent_color = EXCLUDED.accent_color,
  logo_url = EXCLUDED.logo_url,
  cover_url = EXCLUDED.cover_url,
  business_type = EXCLUDED.business_type,
  is_preview = EXCLUDED.is_preview;

DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'sokol';

  -- 2. Upsert Resources
  INSERT INTO resources (id, tenant_id, name, type, description, is_active, sort_order)
  VALUES ('11111111-1111-4111-8111-111111111101', v_tenant_id, 'Моечный бокс (Wet Bay)', 'wash_bay', 'Двухпостовая деликатная мойка с системой обратного осмоса', true, 1)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO resources (id, tenant_id, name, type, description, is_active, sort_order)
  VALUES ('11111111-1111-4111-8111-111111111102', v_tenant_id, 'Полировочный бокс (Dry Bay 1)', 'detailing_bay', 'Беспылевая зона со спецосвещением Scangrip', true, 2)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO resources (id, tenant_id, name, type, description, is_active, sort_order)
  VALUES ('11111111-1111-4111-8111-111111111103', v_tenant_id, 'Зона оклейки пленки (Clean Lab)', 'detailing_bay', 'Климат-контроль 22°C и фильтрация воздуха для монтажа полиуретана', true, 3)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

  -- 3. Upsert Services
  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)
  VALUES ('22222222-2222-4222-8222-222222222201', v_tenant_id, 'Мойка и уход', 'Детейлинг-комплекс Премиум', '• Трехфазная мойка с применением кварца
• Чистка дисков от колодочной пыли
• Чистка проёмов и дверных петель
• Сушка кузова и проёмов турбосушкой
• Поверхностная уборка салона составами для химчистки
• Уборка багажника и ниши запасного колеса
• Использование консервирующего состава для интерьера
• Пропитка стекол с обеих сторон', 120, 15, 5900, true, '/images/services/wash-premium.jpg', 1)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    buffer_minutes = EXCLUDED.buffer_minutes,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)
  VALUES ('22222222-2222-4222-8222-222222222206', v_tenant_id, 'Мойка и уход', 'Детейлинг-комплекс Стандарт', '• Трехфазная мойка с применением кварца
• Сушка кузова и проёмов турбосушкой
• Мойка арок, дисков и шин
• Уборка салона и багажника (пылесос, влажная уборка) + ниша запасного колеса
• Использование консервирующего состава для интерьера
• Пропитка стекол с обеих сторон
• Чернение резины (мат/глянец)', 120, 15, 3900, true, '/images/services/wash-standard.jpg', 2)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    buffer_minutes = EXCLUDED.buffer_minutes,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)
  VALUES ('22222222-2222-4222-8222-222222222202', v_tenant_id, 'Кузов', 'Восстановительная полировка', 'Удаление до 95% царапин, паутины и голограмм. Возвращение заводского глянца и глубины цвета.', 360, 30, 18000, true, '/images/services/polishing.jpg', 3)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    buffer_minutes = EXCLUDED.buffer_minutes,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)
  VALUES ('22222222-2222-4222-8222-222222222203', v_tenant_id, 'Кузов', 'Керамическая защита 9H (2 слоя)', 'Сверхгидрофобный эффект, защита от реагентов, птичьего помета и выгорания цвета на солнце. Стойкость до 2 лет.', 480, 60, 32000, true, '/images/services/ceramic.jpg', 4)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    buffer_minutes = EXCLUDED.buffer_minutes,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)
  VALUES ('22222222-2222-4222-8222-222222222204', v_tenant_id, 'Бронепленка', 'Антигравийный комплекс (PPF)', 'Полная оклейка ударной части (капот, бампер, оптика, крылья, зеркала) полиуретаном толщиной 200 микрон с самозатягивающимся слоем.', 1440, 120, 75000, true, '/images/services/ppf.jpg', 5)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    buffer_minutes = EXCLUDED.buffer_minutes,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)
  VALUES ('22222222-2222-4222-8222-222222222205', v_tenant_id, 'Интерьер', 'Глубокая химчистка салона', 'Торнадор, экстракторная чистка ковролина, обработка кожи крем-кондиционером с защитой от трещин и озонирование.', 240, 30, 14000, true, '/images/services/interior.jpg', 6)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    buffer_minutes = EXCLUDED.buffer_minutes,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;

  -- 4. Map Service Resources
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('22222222-2222-4222-8222-222222222206', '11111111-1111-4111-8111-111111111101', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111102', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111103', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('22222222-2222-4222-8222-222222222205', '11111111-1111-4111-8111-111111111102', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;

  -- 5. Working Hours
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 0, '10:00:00', '20:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 1, '09:00:00', '21:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 2, '09:00:00', '21:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 3, '09:00:00', '21:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 4, '09:00:00', '21:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 5, '09:00:00', '21:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 6, '10:00:00', '20:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;

END $$;
COMMIT;
