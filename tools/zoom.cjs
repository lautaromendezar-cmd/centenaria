const { createRequire } = require('module');
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
const puppeteer = req('puppeteer-core');
const sel = process.argv[2], w = Number(process.argv[3]||390), out = process.argv[4]||'tools/_qc-zoom.png';
(async()=>{
  const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
  const pg=await b.newPage(); await pg.setViewport({width:w,height:900});
  await pg.goto('http://localhost:4740/',{waitUntil:'networkidle0'}); await new Promise(r=>setTimeout(r,2500));
  await pg.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}), sel);
  await new Promise(r=>setTimeout(r,1200));
  const el = await pg.$(sel); await el.screenshot({path: out});
  await b.close(); console.log('ok ->', out);
})();
