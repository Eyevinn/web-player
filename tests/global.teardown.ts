import { test as teardown } from '@playwright/test';
import { Context, removeInstance } from '@osaas/client-core';

teardown('remove chaos stream proxy', async ({}) => {
  /*
  console.log('Remomving Chaos Stream Proxy in Open Source Cloud...');

  const ctx = new Context();
  try {
    const serviceAccessToken = await ctx.getServiceAccessToken(
      'eyevinn-chaos-stream-proxy'
    );
    await removeInstance(
      ctx,
      'eyevinn-chaos-stream-proxy',
      'webplayer',
      serviceAccessToken
    );
  } catch (err) {
    console.error('Failed to remove Chaos Stream Proxy:', err);
  }
  */
});
