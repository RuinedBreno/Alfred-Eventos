const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 if(process.env.ALFRED_E2E!=='1')throw Error('Aponte o frontend para o banco de teste e defina ALFRED_E2E=1.');
 const username='nav_'+require('node:crypto').randomUUID().slice(0,8);
 const password=require('node:crypto').randomUUID();
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:5173';
  await page.goto(url+'/cadastro');
  await page.locator('#fullName').fill('Teste Navegador');
  await page.locator('#username').fill(username);
  await page.locator('#email').fill(username+'@example.com');
  await page.locator('#password').fill(password);await page.locator('form button.button-primary').click();
  await page.waitForURL('**/login?registered=1');
  await page.locator('#email').fill(username+'@example.com');await page.locator('#password').fill(password);
  await page.locator('form button.button-primary').click();await page.waitForURL('**/meus-ingressos');
  await page.goto(url+'/cidade');await page.getByText('Com ingressos gratuitos disponíveis').click();
  await page.locator('a[href="/evento/11"].event-card').click();await page.locator('#lot').selectOption('119');
  await page.getByRole('button',{name:'Emitir ingresso gratuito'}).click();await page.waitForURL('**/meus-ingressos');
  await page.getByRole('button',{name:'Exibir ingresso'}).click();await page.getByAltText('QR individual de entrada').waitFor();
  await page.reload();await page.getByText('Confirmado',{exact:true}).waitFor();
  await page.goto(url+'/momentos');await page.getByLabel('Legenda').fill('A apresentação foi ótima!');await page.locator('input[type=file]').setInputFiles({name:'foto.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNkYPjPwMDAxMDAwMDAAAALHwEDmIWXfgAAAABJRU5ErkJggg==','base64')});
  await page.getByRole('button',{name:'Publicar Momento'}).click();
  await page.getByText('A apresentação foi ótima!',{exact:true}).waitFor();
  await page.getByAltText('Foto publicada na comunidade').first().waitFor();
  assert.deepEqual(errors,[]);console.log('Chromium: cadastro, login, Radar gratuito, checkout, QR, persistência e publicação passaram.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
