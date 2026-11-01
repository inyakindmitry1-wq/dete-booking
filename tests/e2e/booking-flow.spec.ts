import { test, expect } from '@playwright/test';

test.describe('End-to-End Online Booking & Owner Flow', () => {
  test('client completes booking and it appears in owner dashboard', async ({ page }) => {
    // 1. Visit Graphite Detailing client portal
    await page.goto('/s/graphite/');

    // 2. Verify branding and title
    await expect(page).toHaveTitle(/Sokol Team Detailing/);
    await expect(page.locator('h1')).toContainText('Sokol Team Detailing');

    // If first-visit PWA onboarding is shown, click continue in browser
    const continueBrowser = page.locator('button:has-text("Продолжить в браузере")');
    if (await continueBrowser.isVisible({ timeout: 1500 }).catch(() => false)) {
      await continueBrowser.click();
    }

    // 3. Find and click first "Записаться" button
    const bookButton = page.locator('button:has-text("Записаться")').first();
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    // 4. Booking drawer opens: if on Step 0 (Select Service), pick the desired service
    const serviceItem = page.locator('button:has-text("Детейлинг-комплекс")').first();
    if (await serviceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await serviceItem.click();
    }

    // Now on Step 2 (Photo 1): "Дата и время"
    const drawerTitle = page.locator('text=/Дата и время|Выбор времени записи/');
    await expect(drawerTitle).toBeVisible();

    // Select an available slot button
    const slotButton = page.locator('button:not([disabled])').filter({ hasText: /^\d\d:\d\d$/ }).first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    // Click "Продолжить" to Step 3 (Photo 2)
    const continueButton = page.locator('button:has-text("Продолжить")');
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // 5. Fill customer form (Photo 2: "Ваш автомобиль")
    await expect(page.locator('text=/Ваш автомобиль|Контактные данные/')).toBeVisible();

    await page.fill('#cust-name', 'Алексей Тестовый');
    await page.fill('#cust-phone', '+7 (999) 777-88-99');
    await page.fill('#cust-car', 'Audi RS6');

    // 6. Submit booking (Photo 2: "Оформить запись")
    const submitButton = page.locator('button:has-text("Оформить запись"), button:has-text("Подтвердить запись")').first();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 7. Verify confirmation screen (Photo 3: "Моя запись" & "Подтверждена")
    await expect(page.locator('text=Моя запись').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Подтверждена').first()).toBeVisible();
    await expect(page.locator('text=В календарь').first()).toBeVisible();

    // 8. Open Owner Dashboard (direct access without email/password)
    await page.goto('/s/graphite/owner/');

    // 9. Verify schedule view contains the newly booked car / client
    await expect(page.locator('text=/Расписание|Кабинет/').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Алексей Тестовый')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Audi RS6')).toBeVisible({ timeout: 10000 });
  });
});
