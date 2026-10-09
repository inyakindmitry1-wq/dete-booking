import { test, expect } from '@playwright/test';

test.describe('End-to-End Online Booking & Owner Flow', () => {
  test('client completes booking and it appears in owner dashboard', async ({ page }) => {
    // 1. Visit Graphite Detailing client portal
    await page.goto('/s/graphite/');

    // 2. Verify branding and title
    await expect(page).toHaveTitle(/GRAPHITE Detailing/);
    await expect(page.locator('h1')).toContainText('GRAPHITE Detailing');

    // 3. Find and click first "Записаться" button
    const bookButton = page.locator('button:has-text("Записаться")').first();
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    // 4. Booking drawer opens -> Choose slot
    const drawerTitle = page.locator('text=Выбор времени записи');
    await expect(drawerTitle).toBeVisible();

    // Select an available slot button
    const slotButton = page.locator('button:not([disabled])').filter({ hasText: /^\d\d:\d\d$/ }).first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    // Click "Продолжить" to step 2
    const continueButton = page.locator('button:has-text("Продолжить")');
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // 5. Fill customer form
    await expect(page.locator('text=Контактные данные')).toBeVisible();

    await page.fill('#cust-name', 'Алексей Тестовый');
    await page.fill('#cust-phone', '+7 (999) 777-88-99');
    await page.fill('#cust-car', 'Audi RS6');

    // 6. Submit booking
    const submitButton = page.locator('button:has-text("Подтвердить запись")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 7. Verify confirmation screen
    await expect(page.locator('text=Запись подтверждена!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=В календарь (.ics)')).toBeVisible();
    await expect(page.locator('text=Ваша персональная ссылка для проверки записи')).toBeVisible();

    // 8. Open Owner Dashboard
    await page.goto('/s/graphite/owner/');

    // Wait for login form and authenticate
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10000 });
    await page.fill('#email', 'owner@graphite.ru');
    await page.fill('#password', 'secret123');
    await page.click('button:has-text("Войти в панель")');

    // 9. Verify schedule view contains the newly booked car / client
    await expect(page.locator('text=Кабинет')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Алексей Тестовый')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Audi RS6')).toBeVisible({ timeout: 10000 });
  });
});
