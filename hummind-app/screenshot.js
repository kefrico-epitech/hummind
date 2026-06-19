const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'home-page.png', fullPage: true });
  console.log('Screenshot saved: home-page.png');
  await browser.close();
})();
