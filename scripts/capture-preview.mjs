import { chromium, devices } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  const page = await context.newPage();

  const outDir = 'C:/Users/inyak/.gemini/antigravity/brain/0420e2c0-fae9-4704-a176-0c4d87b991a0';

  // 1. Graphite Detailing Client Home
  await page.goto('http://localhost:5173/s/graphite/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}/preview_graphite.png` });

  // 2. Open Booking Drawer from Hero Button (Step 0: Choose Service)
  const bookBtn = page.locator('button:has-text("Записаться")').first();
  await bookBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outDir}/preview_booking_services.png` });

  // 2b. Pick first service to view Step 1 (Vehicle, Date & Slots)
  const firstService = page.locator('button:has-text("Детейлинг-мойка")').first();
  if (await firstService.isVisible()) {
    await firstService.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outDir}/preview_booking.png` });
  }

  // 3. Apex Pitstop (Second Tenant)
  await page.goto('http://localhost:5173/s/apex/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}/preview_apex.png` });

  // 4. Owner Portal
  await page.goto('http://localhost:5173/s/graphite/owner/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.fill('#email', 'owner@graphite.ru');
  await page.fill('#password', 'secret123');
  await page.click('button:has-text("Войти в панель")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/preview_owner.png` });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(console.error);
