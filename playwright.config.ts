import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  testDir: "tests/",
  workers: 3,
  use: {
    trace: 'on-first-retry',
    // Necessary to get the media codecs to play video (default 'chromium' doesn't have them) 
    channel: 'chrome'
  },
  webServer: {
    command: 'npm run examples',
    port: 1234,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Don't work with channel set to 'chrome'
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
};
export default config;
