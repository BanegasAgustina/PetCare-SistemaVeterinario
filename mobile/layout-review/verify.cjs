const { chromium } = require('C:/Users/tomat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
for (const [w,h] of [[360,640],[360,800],[390,844],[412,915]]) {
await page.setViewportSize({width:w,height:h});
await page.goto('http://localhost:8085/login', {timeout:120000});
await page.getByText('Bienvenido/a a PetCare').waitFor({timeout:120000});
await page.evaluate(() => document.fonts.ready); await page.waitForLoadState('networkidle'); await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
await page.screenshot({path:'mobile/layout-review/login-'+w+'x'+h+'.png'});
console.log('overflow',await page.evaluate(() => [...document.querySelectorAll('*')].filter(e => ['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e => ({client:e.clientHeight,scroll:e.scrollHeight,overflow:getComputedStyle(e).overflowY})))); console.log(w,h,await page.getByText('Bienvenido/a a PetCare').boundingBox(),await page.getByText('¿Todavía no tenés cuenta?',{exact:false}).first().boundingBox());
}
await page.goto('http://localhost:8085/register');
await page.getByText('Creá tu cuenta').waitFor(); await page.waitForLoadState('networkidle');
await page.screenshot({path:'mobile/layout-review/register-top.png'});
await page.getByText('¿Ya tenés cuenta? Iniciar sesión').scrollIntoViewIfNeeded();
await page.evaluate(() => { for (const el of document.querySelectorAll('*')) if (el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto') el.scrollTop=el.scrollHeight; });
await page.screenshot({path:'mobile/layout-review/register-bottom.png'});
await browser.close();
})();


