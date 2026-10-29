const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const p = await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[]; p.on('pageerror', e=>errors.push(e.message));
  await p.addInitScript(()=>sessionStorage.setItem('tu-gate','1'));
  const url=(process.env.TEST_URL || 'http://127.0.0.1:8765')+'/CalidadSoftware/cs-guia-t1-4.html';
  await p.goto(url); await p.locator('.g-auto').waitFor();
  await p.screenshot({path:'/tmp/calidad-desktop.png',fullPage:true});
  for (let stage=1; stage<=13; stage++) {
   await p.goto(url+'#etapa-'+stage); await p.locator('.g-q').first().waitFor();
   await p.evaluate(() => {
    for (const card of document.querySelectorAll('.g-q')) {
     const q=window.GUIA.qs[+card.dataset.n-1];
     if (Number.isInteger(q.a)) card.querySelectorAll('input[type=radio]')[q.a].click();
     else {
      card.querySelectorAll('.slot').forEach((sel,k)=>{sel.value=q.a[k];sel.dispatchEvent(new Event('change',{bubbles:true}));});
      card.querySelector('[data-check]').click();
     }
    }
   });
   const solved=await p.locator('.g-q').evaluateAll(cards=>cards.every(c=>!c.querySelector('.explain').hidden && c.querySelector('.explain .head').textContent.startsWith('Correcto')));
   assert(solved, 'Etapa '+stage+': corrección de todas las preguntas');
   await p.locator('.g-q .g-sol').last().waitFor();
   await p.locator('.g-q img').evaluateAll(async images => { await Promise.all(images.map(im => { im.loading='eager'; return im.decode(); })); });
   console.log('Etapa '+stage+' comprobada');
  }
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('tu-sum:cs-guia-t1-4')).done),300);
  await p.reload(); assert(await p.locator('.g-q .explain').first().isVisible(), 'recarga conserva progreso');
  await p.goto(url+'#inicio'); assert.match(await p.locator('.g-auto').innerText(),/300/);
  await p.goto(url+'#formulario'); assert.equal(await p.locator('tbody tr').count(),39);
  await p.goto(url+'#repaso'); assert.equal(await p.locator('.retener').count(),13);
  await p.goto(url+'#etapa-1'); await p.locator('#bSecond').click();
  assert.equal(await p.locator('.g-q .explain:visible').count(),0);
  // Real click placement in a diagram, with mouse, then keyboard.
  const d=p.locator('#p16');
  const a=await p.evaluate(()=>window.GUIA.qs[15].a);
  await d.locator(`[data-choice="${a[0]}"]`).click(); await d.locator('[data-drop="0"]').click();
  assert.equal(await d.locator('.slot[data-k="0"]').inputValue(),a[0]);
  await d.locator(`[data-choice="${a[1]}"]`).focus(); await p.keyboard.press('Enter');
  await d.locator('[data-drop="1"]').focus(); await p.keyboard.press('Enter');
  assert.equal(await d.locator('.slot[data-k="1"]').inputValue(),a[1]);
  await p.setViewportSize({width:390,height:844});
  await p.goto(url+'#p16'); await p.locator('#p16').scrollIntoViewIfNeeded();
  await p.screenshot({path:'/tmp/calidad-mobile.png'});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'sin desbordamiento de página móvil');
  await p.goto(url+'#b-1D'); assert.match(await p.locator('h1').innerText(),/Qué es la calidad/);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('OK: 300 correcciones, imágenes, persistencia, formulario, repaso, segundo intento, diagramas, teclado y móvil');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
