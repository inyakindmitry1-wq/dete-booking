import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const slugArg = process.argv[2];
const nameArg = process.argv[3] || 'Новая Студия';

if (!slugArg) {
  console.log('Usage: npm run tenant:new <slug> [name]');
  console.log('Example: npm run tenant:new turbo "TURBO Tuning"');
  process.exit(1);
}

const slug = slugArg.toLowerCase().replace(/[^a-z0-9-]/g, '-');
const tenantsDir = path.resolve(process.cwd(), 'tenants', slug);

if (fs.existsSync(tenantsDir)) {
  console.error(`❌ Tenant "${slug}" already exists at ${tenantsDir}`);
  process.exit(1);
}

fs.mkdirSync(tenantsDir, { recursive: true });
fs.mkdirSync(path.join(tenantsDir, 'assets'), { recursive: true });

const resId1 = randomUUID();
const srvId1 = randomUUID();

const templateConfig = {
  slug: slug,
  name: nameArg,
  tagline: "Профессиональный автосервис и уход",
  description: "Качественные услуги для вашего автомобиля с гарантией и вниманием к деталям.",
  phone: "+7 (900) 000-00-00",
  address: "ул. Примерная, 1",
  city: "Москва",
  currency: "RUB",
  timezone: "Europe/Moscow",
  businessType: "detailing",
  isPreview: true,
  branding: {
    accentColor: "#3B82F6",
    logoUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=80",
    theme: "dark"
  },
  resources: [
    {
      id: resId1,
      name: "Пост 1",
      type: "detailing_bay",
      description: "Основной рабочий пост",
      is_active: true,
      sort_order: 1
    }
  ],
  services: [
    {
      id: srvId1,
      category: "Основное",
      name: "Базовая услуга",
      description: "Описание услуги",
      duration_minutes: 60,
      buffer_minutes: 15,
      price: 3000,
      is_active: true,
      image_url: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
      sort_order: 1
    }
  ],
  serviceResources: [
    {
      serviceId: srvId1,
      resourceId: resId1
    }
  ],
  workingHours: [
    { day_of_week: 0, open_time: "10:00:00", close_time: "19:00:00", is_closed: false },
    { day_of_week: 1, open_time: "09:00:00", close_time: "20:00:00", is_closed: false },
    { day_of_week: 2, open_time: "09:00:00", close_time: "20:00:00", is_closed: false },
    { day_of_week: 3, open_time: "09:00:00", close_time: "20:00:00", is_closed: false },
    { day_of_week: 4, open_time: "09:00:00", close_time: "20:00:00", is_closed: false },
    { day_of_week: 5, open_time: "09:00:00", close_time: "20:00:00", is_closed: false },
    { day_of_week: 6, open_time: "10:00:00", close_time: "19:00:00", is_closed: false }
  ],
  scheduleExceptions: []
};

const configPath = path.join(tenantsDir, 'business.json');
fs.writeFileSync(configPath, JSON.stringify(templateConfig, null, 2), 'utf-8');

console.log(`🎉 Successfully created new tenant "${nameArg}" (${slug})!`);
console.log(`📁 Config: ${configPath}`);
console.log(`Run 'npm run tenant:validate ${slug}' to check.`);
