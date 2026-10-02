// QA local: JWT real de un CLIENT existente, solo lecturas de negocio. Nunca guarda secretos.
const path=require('node:path');
const {createRequire}=require('node:module');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const backend=path.resolve(__dirname,'../../backend');
const requireBackend=createRequire(path.join(backend,'package.json'));
requireBackend('dotenv').config({path:path.join(backend,'.env'),quiet:true});
const mysql=requireBackend('mysql2/promise');
const jwt=requireBackend('jsonwebtoken');
const {chromium}=require('C:/Users/tomat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function main(){
 const connection=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
 let browser;
 try{
  const [users]=await connection.execute("SELECT u.id,u.session_version FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code='CLIENT' AND u.is_active=1 AND u.email_verified_at IS NOT NULL LIMIT 1");
  assert.ok(users.length,'QA requiere un CLIENT real verificado.');
  const token=jwt.sign({sessionVersion:Number(users[0].session_version)},process.env.JWT_ACCESS_SECRET,{algorithm:'HS256',subject:String(users[0].id),issuer:process.env.JWT_ISSUER||'petcare-api',audience:process.env.JWT_AUDIENCE||'petcare-mobile',expiresIn:900});
  const me=await fetch('http://localhost:3097/api/auth/me',{headers:{Authorization:`Bearer ${token}`}});assert.equal(me.status,200);const user=(await me.json()).data.user;
  const petsResponse=await fetch('http://localhost:3097/api/client/pets',{headers:{Authorization:`Bearer ${token}`}});const pets=(await petsResponse.json()).data;
  await fs.mkdir(path.join(__dirname,'client'),{recursive:true});
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const results=[];const errors=[];
  for(const theme of ['dark','light']){
   const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme});const page=await context.newPage();
   page.on('pageerror',error=>{errors.push(error.message);console.error('JS_ERROR',error.message.replace(/Bearer\s+\S+/g,'Bearer [oculto]'));});
   page.on('console',message=>{if(message.type()==='error'&&/Unexpected text node|Maximum update depth/.test(message.text()))errors.push(message.text());});
   // Solo se prepara la sesión de QA; /me y todo dato de negocio se consultan a la API real.
   await page.route('**/auth/login',async route=>route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({success:true,data:{user,accessToken:token,tokenType:'Bearer',expiresIn:900}})}));
   await page.goto('http://localhost:8087/login',{timeout:180000});
   await page.getByLabel('Correo electrónico',{exact:true}).fill(user.email);
   await page.getByLabel('Contraseña',{exact:true}).fill('Solo-QA!123');
   await page.getByRole('button',{name:'INICIAR SESIÓN',exact:true}).click();
   await page.getByText(`¡Hola, ${user.firstName}!`,{exact:true}).waitFor({timeout:120000});
   for(const [width,height] of [[360,640],[360,800],[390,844],[412,915]]){
    await page.setViewportSize({width,height});
    const targets=[['home',`¡Hola, ${user.firstName}!`,null],['pets','Mis mascotas','Mascotas'],['appointments','Turnos','Turnos'],['store','Tienda','Tienda'],['profile','Mi perfil','Perfil']];
    for(const [name,title,tab] of targets){
     if(tab)await page.getByRole('tab',{name:tab,exact:false}).click();else if(name==='home')await page.getByRole('tab',{name:'Inicio',exact:false}).click();
     await page.getByText(title,{exact:true}).filter({visible:true}).first().waitFor();
     await page.waitForFunction(()=>![...document.querySelectorAll('div')].some(el=>el.textContent==='Consultando PetCare…'&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility!=='hidden'),{},{timeout:45000});
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${theme} ${name} ${width}: scroll horizontal`);
     const tabs=page.getByRole('tab');assert.equal(await tabs.count(),5);
     for(const t of await tabs.all()){const box=await t.boundingBox();assert.ok(box&&box.x>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Pestaña fuera de pantalla');}
     await page.screenshot({path:path.join(__dirname,'client',`${name}-${theme}-${width}x${height}.png`)});
     results.push({screen:name,theme,width,height,overflow:false});
    }
   }
   // Navegación real por CTA, conservando la sesión en memoria del navegador.
   await page.getByRole('tab',{name:'Inicio',exact:false}).click();
   for(const title of ['Historial médico','Vacunas','Recetas','Recomendaciones']){
    await page.getByText(title,{exact:true}).filter({visible:true}).first().click();await page.getByText(title,{exact:true}).filter({visible:true}).first().waitFor();await page.waitForTimeout(800);await page.getByRole('button',{name:'Volver',exact:true}).click();
   }
   await page.getByRole('tab',{name:'Mascotas',exact:false}).click();await page.getByRole('button',{name:'Agregar mascota',exact:true}).click();await page.waitForURL('**/client/pets/new');await page.waitForFunction(()=>![...document.querySelectorAll('div')].some(el=>el.textContent==='Consultando PetCare…'&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility!=='hidden'),{},{timeout:45000});assert.ok(await page.getByLabel('Nombre',{exact:true}).count()||await page.getByText('No hay especies disponibles',{exact:true}).count(),'Formulario o catálogo vacío deben ser visibles');await page.screenshot({path:path.join(__dirname,'client',`pet-editor-${theme}.png`)});await page.getByRole('button',{name:'Volver',exact:true}).click();
   if(pets.length){await page.getByRole('button',{name:'Ver ficha',exact:true}).first().click();await page.getByRole('button',{name:'Editar datos',exact:true}).waitFor();await page.screenshot({path:path.join(__dirname,'client',`pet-detail-${theme}.png`)});await page.getByRole('button',{name:'Volver',exact:true}).click();}
   await page.getByRole('tab',{name:'Turnos',exact:false}).click();await page.getByRole('button',{name:'Solicitar turno',exact:true}).click();await page.waitForURL('**/client/appointments/request');await page.getByText('Solicitar turno',{exact:true}).filter({visible:true}).first().waitFor();await page.screenshot({path:path.join(__dirname,'client',`appointment-request-${theme}.png`)});await page.getByRole('button',{name:'Volver',exact:true}).click();
   await page.getByRole('tab',{name:'Tienda',exact:false}).click();await page.getByRole('button',{name:'Carrito',exact:true}).click();await page.getByText('Tu carrito',{exact:true}).filter({visible:true}).first().waitFor();await page.waitForTimeout(1000);await page.screenshot({path:path.join(__dirname,'client',`cart-${theme}.png`)});await page.getByRole('button',{name:'Mis pedidos',exact:true}).click();await page.waitForURL('**/client/orders');await page.getByText('Mis pedidos',{exact:true}).filter({visible:true}).first().waitFor();await page.waitForTimeout(1000);await page.screenshot({path:path.join(__dirname,'client',`orders-${theme}.png`)});await page.getByRole('button',{name:'Volver',exact:true}).click();await page.getByRole('button',{name:'Volver',exact:true}).click();
   await page.getByRole('tab',{name:'Perfil',exact:false}).click();await page.getByText('Notificaciones',{exact:true}).filter({visible:true}).first().click();await page.waitForURL('**/client/notifications');await page.getByText('Notificaciones',{exact:true}).filter({visible:true}).first().waitFor();await page.waitForTimeout(1000);await page.screenshot({path:path.join(__dirname,'client',`notifications-${theme}.png`)});await page.getByRole('button',{name:'Volver',exact:true}).click();
   await context.close();
  }
  assert.deepEqual(errors,[],'Errores JS en el navegador');await fs.writeFile(path.join(__dirname,'client','results.json'),JSON.stringify({results,errors,source:'MySQL/API real; sesión preparada para QA, sin probar contraseña de login'},null,2));console.info(`QA visual: ${results.length} combinaciones, sin overflow ni errores JS.`);
 }finally{if(browser)await browser.close();await connection.end();}
}
main().catch(error=>{console.error('QA visual falló:',error.message.replace(/Bearer\s+\S+/g,'Bearer [oculto]'));process.exitCode=1;});
