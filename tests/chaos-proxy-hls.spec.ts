import { test, expect } from '@playwright/test';

  test('player sends error events when loading corrupt hls streams', async ({page }) => {
    const [request] = await Promise.all([
      page.goto('/chaos-proxy/index_hls.html'),
      page.waitForRequest(req => req.url().match('https://sink.epas') && req.method() === 'POST' && req.postDataJSON().event === "warning" && req.postDataJSON().payload.code === "400"),
      page.waitForRequest(req => req.url().match('https://sink.epas') && req.method() === 'POST' && req.postDataJSON().event === "warning" && req.postDataJSON().payload.code === "404"),
      
    ]);
   }); 
   
  
  



