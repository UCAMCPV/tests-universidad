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
  await p.goto(url+'#etapa-1');
  const original = await p.locator('#p4 .opt').evaluateAll(items => items.map(x => x.dataset.o));
  await p.locator('#p1 .slot').first().selectOption('A');
  await p.locator('#p5 .opt input').first().check();
  const answered = await p.locator('#p5 .opt').evaluateAll(items => items.map(x => x.dataset.o));
  await p.evaluate(() => { Math.random = () => 0; });
  const nonTests = await p.locator('#p1 .g-defs, #p12 .g-chips, #p16 .g-chips, #p19 .g-defs').evaluateAll(lists => lists.map(list => Array.from(list.children, el => el.dataset.choice)));
  await p.locator('#bShuffle').click();
  assert.deepEqual(await p.locator('#p1 .g-defs, #p12 .g-chips, #p16 .g-chips, #p19 .g-defs').evaluateAll(lists => lists.map(list => Array.from(list.children, el => el.dataset.choice))), nonTests);
  const shuffled = await p.locator('#p4 .opt').evaluateAll(items => items.map(x => x.dataset.o));
  assert.notDeepEqual(shuffled, original);
  assert.deepEqual(await p.locator('#p5 .opt').evaluateAll(items => items.map(x => x.dataset.o)), answered);
  assert.equal(await p.locator('#p1 .slot').first().inputValue(), 'A');
  await p.reload();
  assert.deepEqual(await p.locator('#p4 .opt').evaluateAll(items => items.map(x => x.dataset.o)), shuffled);
  const correct = await p.evaluate(() => window.GUIA.qs[3].a);
  await p.locator('#p4 .opt[data-o="'+correct+'"] input').check();
  assert.match(await p.locator('#p4 .explain .head').innerText(), /^Correcto/);
  await p.evaluate(() => {
   const key = 'tu-guia:cs-guia-t1-4', state = JSON.parse(localStorage.getItem(key));
   state.order[1] = window.GUIA.qs[0].df.map(x => x.l).reverse();
   state.order[16] = window.GUIA.qs[15].b.map(x => x.l).reverse();
   state.order[40] = ['3', '2', '1', '0'];
   localStorage.setItem(key, JSON.stringify(state));
  });
  await p.reload();
  assert.deepEqual(await p.locator('#p1 .g-defs, #p12 .g-chips, #p16 .g-chips, #p19 .g-defs').evaluateAll(lists => lists.map(list => Array.from(list.children, el => el.dataset.choice))), nonTests);
  assert.match(await p.locator('#p4 .explain .head').innerText(), /^Correcto/);
  await p.goto(url+'#etapa-2');
  assert.deepEqual(await p.locator('#p40 .opt').evaluateAll(items => items.map(x => x.dataset.o)), ['0', '1', '2', '3']);
  await p.locator('#bShuffle').click();
  assert.deepEqual(await p.locator('#p40 .opt').evaluateAll(items => items.map(x => x.dataset.o)), ['0', '1', '2', '3']);
  await p.evaluate(() => localStorage.clear());
  await p.reload();

  await p.goto(url+'#etapa-1');
  await p.locator('#p16').evaluate(card => {
   const answers = window.GUIA.qs[15].a.slice().reverse();
   card.querySelectorAll('.slot').forEach((sel,k) => { sel.value=answers[k]; sel.dispatchEvent(new Event('change',{bubbles:true})); });
   card.querySelector('[data-check]').click();
  });
  assert.match(await p.locator('#p16 .explain .head').innerText(), /^Correcto \(7\/7\)/);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.locator('#p16').evaluate(card => {
   const answers = window.GUIA.qs[15].a.slice().reverse(); answers[0] = 'G';
   card.querySelectorAll('.slot').forEach((sel,k) => { sel.value=answers[k]; sel.dispatchEvent(new Event('change',{bubbles:true})); });
   card.querySelector('[data-check]').click();
  });
  assert.match(await p.locator('#p16 .explain .head').innerText(), /6 de 7/);
  assert.equal(await p.locator('#p16 .slot.s-ok').count(), 6);
  await p.evaluate(() => localStorage.clear());
  await p.reload();

  await p.goto(url+'#etapa-2');
  const p36 = p.locator('#p36');
  const targets = await p36.locator('[data-drop]').evaluateAll(els => els.map(el => ({ id: el.dataset.drop, left: parseFloat(el.style.left), top: parseFloat(el.style.top) })));
  const firstRow = targets.slice().sort((a,b) => a.left-b.left).slice(0,2).sort((a,b) => a.left-b.left);
  const lower = targets.filter(t => !firstRow.includes(t)).sort((a,b) => a.top-b.top);
  for (const [letter, target] of [['C', firstRow[0]], ['A', firstRow[1]], ['D', lower[0]], ['E', lower[1]]]) {
   await p36.locator('[data-choice="'+letter+'"]').evaluate(el => el.click());
   await p36.locator('[data-drop="'+target.id+'"]').evaluate(el => el.click());
  }
  await p36.locator('[data-check]').evaluate(el => el.click());
  assert.match(await p36.locator('.explain .head').innerText(), /^Correcto \(4\/4\)/);
  await p.evaluate(() => localStorage.clear());
  await p.reload();

  for (let stage=1; stage<=13; stage++) {
   await p.goto(url+'#etapa-'+stage); await p.locator('.g-q').first().waitFor();
   const before = await p.evaluate(() => Array.from(document.querySelectorAll('.g-q')).filter(card => window.GUIA.qs[+card.dataset.n-1].t !== 'test').map(card => card.querySelector('.opts, .g-chips, .g-defs')?.innerHTML));
   await p.locator('#bShuffle').click();
   const after = await p.evaluate(() => Array.from(document.querySelectorAll('.g-q')).filter(card => window.GUIA.qs[+card.dataset.n-1].t !== 'test').map(card => card.querySelector('.opts, .g-chips, .g-defs')?.innerHTML));
   assert.deepEqual(after, before, 'Etapa '+stage+': opciones no test sin cambios');
   await p.evaluate(() => {
    for (const card of document.querySelectorAll('.g-q')) {
     const q=window.GUIA.qs[+card.dataset.n-1];
     if (Number.isInteger(q.a)) card.querySelector('.opt[data-o="'+q.a+'"] input').click();
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
