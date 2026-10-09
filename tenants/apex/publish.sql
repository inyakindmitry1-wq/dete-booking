-- ==============================================================================
-- Tenant Publish Migration: APEX Pitstop (apex)
-- Preserves existing customer bookings, payments, and historical data
-- ==============================================================================
BEGIN;

-- 1. Upsert Tenant
INSERT INTO tenants (
  slug, name, phone, address, city, currency, timezone, accent_color, logo_url, cover_url, business_type, is_preview
) VALUES (
  'apex',
  'APEX Pitstop',
  '+7 (812) 555-44-33',
  'пр. Энергетиков, 14, бокс 2',
  'Санкт-Петербург',
  'RUB',
  'Europe/Moscow',
  '#DC2626',
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
  'service',
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
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'apex';

  -- 2. Upsert Resources
  INSERT INTO resources (id, tenant_id, name, type, description, is_active, sort_order)
  VALUES ('33333333-3333-4333-8333-333333333301', v_tenant_id, 'Подъемник 1 (Двухстоечный)', 'hydraulic_lift', 'Электрогидравлический подъемник г/п 4.0 т для слесарных работ и ТО', true, 1)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO resources (id, tenant_id, name, type, description, is_active, sort_order)
  VALUES ('33333333-3333-4333-8333-333333333302', v_tenant_id, 'Подъемник 2 (Сход-развал)', 'hydraulic_lift', 'Четырехстоечный подъемник со стендом Hunter 3D Hawkeye Elite', true, 2)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;
  INSERT INTO resources (id, tenant_id, name, type, description, is_active, sort_order)
  VALUES ('33333333-3333-4333-8333-333333333303', v_tenant_id, 'Пост диагностики и автоэлектрики', 'diagnostic_bay', 'Стенд мотор-тестера и дилерские сканеры Launch / Autel', true, 3)
  ON CONFLICT (tenant_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

  -- 3. Upsert Services
  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)
  VALUES ('44444444-4444-4444-8444-444444444401', v_tenant_id, 'Регулярное ТО', 'Экспресс-замена моторного масла и фильтров', 'Замена масла аппаратным или классическим методом, замена масляного и воздушного фильтра, осмотр течей.', 45, 15, 2500, true, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80', 1)
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
  VALUES ('44444444-4444-4444-8444-444444444402', v_tenant_id, 'Диагностика', 'Компьютерная диагностика систем', 'Считывание ошибок всех электронных блоков, проверка параметров датчиков в реальном времени, сброс сервисных интервалов.', 40, 10, 2000, true, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80', 2)
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
  VALUES ('44444444-4444-4444-8444-444444444403', v_tenant_id, 'Тормозная система', 'Замена передних/задних колодок и дисков', 'Замена тормозных дисков и колодок, очистка и смазка направляющих суппортов, проверка тормозной жидкости.', 90, 15, 5000, true, 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80', 3)
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
  VALUES ('44444444-4444-4444-8444-444444444404', v_tenant_id, 'Подвеска', 'Регулировка углов установки колес 3D (сход-развал)', 'Высокоточная калибровка развала и схождения обеих осей на лазерном 3D-стенде с распечаткой до/после.', 60, 15, 3500, true, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80', 4)
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
  VALUES ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333303', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333301', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;
  INSERT INTO service_resources (service_id, resource_id, tenant_id)
  VALUES ('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333302', v_tenant_id)
  ON CONFLICT (service_id, resource_id) DO NOTHING;

  -- 5. Working Hours
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 0, '09:00:00', '18:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 1, '08:30:00', '20:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 2, '08:30:00', '20:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 3, '08:30:00', '20:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 4, '08:30:00', '20:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 5, '08:30:00', '20:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_tenant_id, 6, '08:30:00', '19:00:00', false)
  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;

END $$;
COMMIT;
