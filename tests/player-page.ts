import type { Page } from '@playwright/test';

export class PlayerPage {

  constructor(public readonly page: Page) {
  }

  async load(videoUrl: URL) {
    await this.page.goto('/player/index.html');
    await this.page.locator('#manifest-input').fill(videoUrl.toString());
    await this.page.locator('#load-button').click();
  }

  async waitForVideo() {
    await this.page.locator('video').waitFor();
  }

  async waitForPlaying(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }
}