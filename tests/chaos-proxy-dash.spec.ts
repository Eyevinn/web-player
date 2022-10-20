import { test, expect } from '@playwright/test';

  test('player sends error events when loading corrupt dash streams', async ({page }) => {
    const [request] = await Promise.all([
      page.goto('/chaos-proxy/index_dash.html'),

      page.waitForRequest(req => req.url().match('https://sink.epas') && req.method() === 'POST' && req.postDataJSON().event === "error" && req.postDataJSON().payload.message === "418"),
      page.waitForRequest(req => req.url().match('https://sink.epas') && req.method() === 'POST' && req.postDataJSON().event === "error" && req.postDataJSON().payload.message === "400"),
 
    ]);
  }); 

   
  
  



