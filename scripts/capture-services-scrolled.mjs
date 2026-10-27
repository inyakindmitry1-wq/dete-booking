import { chromium, devices } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/s/sokol/', { waitUntil: 'networkidle' });
  const bookBtn = page.locator('button:has-text("Записаться")').first();
  await bookBtn.click();
  await page.waitForTimeout(800);
  
  // Scroll to химчистка
  const cleanItem = page.locator('h4:has-text("Глубокая химчистка")').first();
  if (await cleanItem.isVisible()) {
    await cleanItem.scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/Users/inyak/.gemini/antigravity/brain/0420e2c0-fae9-4704-a176-0c4d87b991a0/preview_services_scrolled.png' });
  await browser.close();
  console.log('Done');
}

run().catch(console.error);
