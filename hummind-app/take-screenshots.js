const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    
    // Mobile screenshot
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await mobilePage.goto('http://localhost:5000', { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: 'mobile-home.png' });
    console.log('Mobile screenshot saved');
    await mobilePage.close();
    
    // Desktop screenshot
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktopPage.goto('http://localhost:5000', { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: 'desktop-home.png' });
    console.log('Desktop screenshot saved');
    
    // Demo page desktop
    await desktopPage.goto('http://localhost:5000/demo', { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: 'desktop-demo.png' });
    console.log('Demo page screenshot saved');
    
    await desktopPage.close();
    await browser.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
