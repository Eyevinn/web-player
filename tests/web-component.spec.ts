import { test, expect } from '@playwright/test';

test('video element with correct attributes are created', async ({ page }) => {
  await page.goto('http://localhost:1234/web-component/index.html');
  await expect(page.locator('eyevinn-video')).toHaveAttribute('muted', '');
  await expect(page.locator('eyevinn-video')).toHaveAttribute('autoplay', '');
  await expect(page.locator('video')).toHaveAttribute('autoplay', '');
  await expect(page.locator('video')).toHaveAttribute('playsinline', '');
});