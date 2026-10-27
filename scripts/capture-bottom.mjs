import { chromium, devices } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/s/sokol/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const dialog = page.locator('[role="dialog"]').first();
  await dialog.evaluate((el) => {
    el.scrollTop = 1000;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'C:/Users/inyak/.gemini/antigravity/brain/0420e2c0-fae9-4704-a176-0c4d87b991a0/preview_pwa_onboarding_bottom.png' });
  await browser.close();
}

run().catch(console.error);
