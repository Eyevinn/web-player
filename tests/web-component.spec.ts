import { test, expect } from '@playwright/test';

test('video element with correct attributes are created', async ({ page }) => {
  await page.goto('/web-component/index.html');
  await expect(page.locator('eyevinn-video')).toHaveAttribute('muted', '');
  await expect(page.locator('eyevinn-video')).toHaveAttribute('autoplay', '');
  await expect(page.locator('video')).toHaveAttribute('autoplay', '');
  await expect(page.locator('video')).toHaveAttribute('playsinline', '');
  await expect(page.locator('video')).toHaveCSS('width', '1264px');
  await expect(page.locator('video')).toHaveCSS('height', '712px');
});

test('web component sends tracking events when not in incognito mode', async ({ page }) => {
  const [request] = await Promise.all([
    page.waitForRequest(req => req.url().match('https://sink.epas') && req.method() === 'POST'),
    page.goto('/web-component/index.html'),
  ]);
});