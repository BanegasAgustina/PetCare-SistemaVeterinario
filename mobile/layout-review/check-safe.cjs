const { chromium } = require('C:/Users/tomat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=> {
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const p=await b.newPage({viewport:{width:360,height:592}});
await p.goto('http://localhost:8085/login');
await p.getByText('Bienvenido/a a PetCare').waitFor();
await p.waitForLoadState('networkidle');
await p.screenshot({path:'mobile/layout-review/login-360x592-safe-space.png'});
console.log('safe-space',await p.getByText('Correo electrónico',{exact:true}).boundingBox(),await p.getByText('¿Todavía no tenés cuenta?',{exact:false}).first().boundingBox());
await p.setViewportSize({width:390,height:844});
await p.getByRole('button',{name:'Usar modo oscuro'}).click();
await p.screenshot({path:'mobile/layout-review/login-dark-390x844.png'});
const before=await p.getByText('Bienvenido/a a PetCare').boundingBox();
await p.mouse.move(200,400); await p.mouse.wheel(0,500);
const after=await p.getByText('Bienvenido/a a PetCare').boundingBox();
console.log('closed-keyboard-scroll',before.y,after.y);
await b.close();
})();
