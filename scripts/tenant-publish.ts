import fs from 'node:fs';
import path from 'node:path';
import { validateTenantFile } from './tenant-validate';
import { BusinessConfig } from './tenant-schema';

export function generateTenantSql(config: BusinessConfig): string {
  const lines: string[] = [];
  lines.push(`-- ==============================================================================`);
  lines.push(`-- Tenant Publish Migration: ${config.name} (${config.slug})`);
  lines.push(`-- Preserves existing customer bookings, payments, and historical data`);
  lines.push(`-- ==============================================================================`);
  lines.push(`BEGIN;`);
  lines.push(``);

  // 1. Upsert Tenant
  lines.push(`-- 1. Upsert Tenant`);
  lines.push(`INSERT INTO tenants (`);
  lines.push(`  slug, name, phone, address, city, currency, timezone, accent_color, logo_url, cover_url, business_type, is_preview`);
  lines.push(`) VALUES (`);
  lines.push(`  '${config.slug}',`);
  lines.push(`  '${config.name.replace(/'/g, "''")}',`);
  lines.push(`  '${config.phone.replace(/'/g, "''")}',`);
  lines.push(`  '${config.address.replace(/'/g, "''")}',`);
  lines.push(`  '${config.city.replace(/'/g, "''")}',`);
  lines.push(`  '${config.currency}',`);
  lines.push(`  '${config.timezone}',`);
  lines.push(`  '${config.branding.accentColor}',`);
  lines.push(`  '${config.branding.logoUrl}',`);
  lines.push(`  '${config.branding.coverUrl}',`);
  lines.push(`  '${config.businessType}',`);
  lines.push(`  ${Boolean(config.isPreview)}`);
  lines.push(`) ON CONFLICT (slug) DO UPDATE SET`);
  lines.push(`  name = EXCLUDED.name,`);
  lines.push(`  phone = EXCLUDED.phone,`);
  lines.push(`  address = EXCLUDED.address,`);
  lines.push(`  city = EXCLUDED.city,`);
  lines.push(`  currency = EXCLUDED.currency,`);
  lines.push(`  timezone = EXCLUDED.timezone,`);
  lines.push(`  accent_color = EXCLUDED.accent_color,`);
  lines.push(`  logo_url = EXCLUDED.logo_url,`);
  lines.push(`  cover_url = EXCLUDED.cover_url,`);
  lines.push(`  business_type = EXCLUDED.business_type,`);
  lines.push(`  is_preview = EXCLUDED.is_preview;`);
  lines.push(``);

  // Helper variable for tenant_id
  lines.push(`DO $$`);
  lines.push(`DECLARE`);
  lines.push(`  v_tenant_id uuid;`);
  lines.push(`BEGIN`);
  lines.push(`  SELECT id INTO v_tenant_id FROM tenants WHERE slug = '${config.slug}';`);
  lines.push(``);

  // 2. Upsert Resources
  lines.push(`  -- 2. Upsert Resources`);
  for (const r of config.resources) {
    const desc = r.description ? `'${r.description.replace(/'/g, "''")}'` : 'NULL';
    lines.push(`  INSERT INTO resources (id, tenant_id, name, type, description, is_active, sort_order)`);
    lines.push(`  VALUES ('${r.id}', v_tenant_id, '${r.name.replace(/'/g, "''")}', '${r.type}', ${desc}, ${r.is_active}, ${r.sort_order})`);
    lines.push(`  ON CONFLICT (tenant_id, id) DO UPDATE SET`);
    lines.push(`    name = EXCLUDED.name,`);
    lines.push(`    type = EXCLUDED.type,`);
    lines.push(`    description = EXCLUDED.description,`);
    lines.push(`    is_active = EXCLUDED.is_active,`);
    lines.push(`    sort_order = EXCLUDED.sort_order;`);
  }
  lines.push(``);

  // 3. Upsert Services
  lines.push(`  -- 3. Upsert Services`);
  for (const s of config.services) {
    lines.push(`  INSERT INTO services (id, tenant_id, category, name, description, duration_minutes, buffer_minutes, price, is_active, image_url, sort_order)`);
    lines.push(`  VALUES ('${s.id}', v_tenant_id, '${s.category.replace(/'/g, "''")}', '${s.name.replace(/'/g, "''")}', '${s.description.replace(/'/g, "''")}', ${s.duration_minutes}, ${s.buffer_minutes}, ${s.price}, ${s.is_active}, '${s.image_url}', ${s.sort_order})`);
    lines.push(`  ON CONFLICT (tenant_id, id) DO UPDATE SET`);
    lines.push(`    category = EXCLUDED.category,`);
    lines.push(`    name = EXCLUDED.name,`);
    lines.push(`    description = EXCLUDED.description,`);
    lines.push(`    duration_minutes = EXCLUDED.duration_minutes,`);
    lines.push(`    buffer_minutes = EXCLUDED.buffer_minutes,`);
    lines.push(`    price = EXCLUDED.price,`);
    lines.push(`    is_active = EXCLUDED.is_active,`);
    lines.push(`    image_url = EXCLUDED.image_url,`);
    lines.push(`    sort_order = EXCLUDED.sort_order;`);
  }
  lines.push(``);

  // 4. Map Service Resources
  lines.push(`  -- 4. Map Service Resources`);
  for (const sr of config.serviceResources) {
    lines.push(`  INSERT INTO service_resources (service_id, resource_id, tenant_id)`);
    lines.push(`  VALUES ('${sr.serviceId}', '${sr.resourceId}', v_tenant_id)`);
    lines.push(`  ON CONFLICT (service_id, resource_id) DO NOTHING;`);
  }
  lines.push(``);

  // 5. Working Hours
  lines.push(`  -- 5. Working Hours`);
  for (const wh of config.workingHours) {
    lines.push(`  INSERT INTO working_hours (tenant_id, day_of_week, open_time, close_time, is_closed)`);
    lines.push(`  VALUES (v_tenant_id, ${wh.day_of_week}, '${wh.open_time}', '${wh.close_time}', ${wh.is_closed})`);
    lines.push(`  ON CONFLICT (tenant_id, day_of_week) DO UPDATE SET`);
    lines.push(`    open_time = EXCLUDED.open_time,`);
    lines.push(`    close_time = EXCLUDED.close_time,`);
    lines.push(`    is_closed = EXCLUDED.is_closed;`);
  }
  lines.push(``);

  lines.push(`END $$;`);
  lines.push(`COMMIT;`);
  lines.push(``);

  return lines.join('\n');
}

// Run CLI
if (process.argv[1]?.includes('tenant-publish')) {
  const tenantsDir = path.resolve(process.cwd(), 'tenants');
  const specifiedTenant = process.argv[2];

  const tenantFolders = specifiedTenant
    ? [specifiedTenant]
    : fs.readdirSync(tenantsDir).filter((f) => fs.statSync(path.join(tenantsDir, f)).isDirectory());

  const fullSeedSql: string[] = [];

  for (const folder of tenantFolders) {
    const configPath = path.join(tenantsDir, folder, 'business.json');
    if (!fs.existsSync(configPath)) continue;

    const isValid = validateTenantFile(configPath);
    if (!isValid) {
      console.error(`Cannot publish invalid tenant config: ${folder}`);
      process.exit(1);
    }

    const config: BusinessConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const sql = generateTenantSql(config);

    const publishSqlPath = path.join(tenantsDir, folder, 'publish.sql');
    fs.writeFileSync(publishSqlPath, sql, 'utf-8');
    fullSeedSql.push(sql);

    console.log(`🚀 Published SQL generated for ${config.name} -> ${publishSqlPath}`);
  }

  // Also write/update supabase/seed.sql
  const supabaseDir = path.resolve(process.cwd(), 'supabase');
  if (!fs.existsSync(supabaseDir)) {
    fs.mkdirSync(supabaseDir, { recursive: true });
  }

  const seedPath = path.join(supabaseDir, 'seed.sql');
  fs.writeFileSync(seedPath, fullSeedSql.join('\n\n'), 'utf-8');
  console.log(`\n📦 Unified seed updated -> ${seedPath}`);
}
