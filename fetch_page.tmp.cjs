const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.HOME+'/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
  const page = await browser.newPage({locale:'he-IL'});
  const [url, out] = process.argv.slice(2);
  await page.goto(url, {waitUntil:'domcontentloaded', timeout:60000});
  await page.waitForTimeout(5000);
  const text = await page.innerText('body');
  require('fs').writeFileSync(out, text);
  console.log(out, text.length);
  await browser.close();
})();
