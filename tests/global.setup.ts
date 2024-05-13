import { test as setup } from '@playwright/test';
import { Context, createInstance } from '@osaas/client-core';

const delay = ms => new Promise(res => setTimeout(res, ms));

setup('create a chaos stream proxy', async ({}) => {
  console.log('Creating Chaos Stream Proxy in Open Source Cloud...');

  const ctx = new Context();
  try {
    const serviceAccessToken = await ctx.getServiceAccessToken(
      'eyevinn-chaos-stream-proxy'
    );
    const instance = await createInstance(
      ctx,
      'eyevinn-chaos-stream-proxy',
      serviceAccessToken, 
      {
        name: 'webplayer'
      },
    );
    await delay(5000);
    process.env.CSP_URL = instance.url;
  } catch (err) {
    console.error('Failed to create Chaos Stream Proxy:', err);
  }
});
