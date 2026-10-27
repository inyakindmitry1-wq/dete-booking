import { chromium, devices } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  const page = await context.newPage();

  const outDir = 'C:/Users/inyak/.gemini/antigravity/brain/0420e2c0-fae9-4704-a176-0c4d87b991a0';

  // 1. Sokol Team Detailing Client Home (shows new hero car and PWA prompt after 2s)
  await page.goto('http://localhost:5173/s/sokol/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${outDir}/preview_sokol.png` });
  await page.screenshot({ path: `${outDir}/preview_graphite.png` });

  // 1b. Open Interactive PWA Install Guide Modal
  const installGuideBtn = page.locator('button:has-text("Как установить?"), button:has-text("Приложение")').first();
  if (await installGuideBtn.isVisible()) {
    await installGuideBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${outDir}/preview_pwa_guide.png` });
    // Close modal
    const closeGuide = page.locator('button:has-text("Понятно, добавлю!"), button[aria-label="Закрыть"]').first();
    if (await closeGuide.isVisible()) {
      await closeGuide.click();
      await page.waitForTimeout(400);
    }
  }

  // 2. Open Booking Drawer from Hero Button (Step 0: Choose Service)
  const bookBtn = page.locator('button:has-text("Записаться")').first();
  await bookBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outDir}/preview_booking_services.png` });

  // 2b. Pick first service to view Step 1 (Vehicle, Date & Slots)
  const firstService = page.locator('button:has-text("Детейлинг-комплекс")').first();
  if (await firstService.isVisible()) {
    await firstService.click();
    await page.waitForTimeout(1000);
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
