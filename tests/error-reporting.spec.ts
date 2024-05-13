import { test as base, expect } from '@playwright/test';
import { PlayerPage } from './player-page';

type PlayerFixtures = {
  playerPage: PlayerPage
};

const test = base.extend<PlayerFixtures>({
  playerPage: async ({ page }, use) => {
    const playerPage = new PlayerPage(page);
    await use(playerPage);
  },
});

test('emits player error event on segment timeout', async ({ playerPage, page }) => {
  const cspUrl = `${process.env.CSP_URL}/api/v2/manifests/hls/proxy-master.m3u8`;

  const testVod = 'https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8';
  const corruptionUrl = `${cspUrl}?url=${testVod}&timeout=[{i:1}]`;
  await playerPage.load(new URL(corruptionUrl));
  await playerPage.waitForVideo();

  const msg = await page.waitForEvent('console');
  const error = JSON.parse(msg.text());
  expect(error.category).toEqual('networkError');
});
