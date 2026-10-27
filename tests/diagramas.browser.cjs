const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const url = (process.env.TEST_URL || 'http://127.0.0.1:8000') + '/ABD/abd-guia-t1-4.html';
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const ctx=await browser.newContext({viewport:{width:1280,height:1100},colorScheme:'dark'});
  await ctx.addInitScript(()=>sessionStorage.setItem('tu-gate','1'));
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'#p1');
  const card=p.locator('#p1');
  await card.locator('img').first().waitFor();
  await p.waitForFunction(()=>document.querySelector('#p1 .g-diagram-canvas img').naturalWidth>0);
  for (const theme of ['light','dark']) {
   await p.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
   assert(await card.locator('[data-drop]').evaluateAll(els=>els.every(el=>{
    const style=getComputedStyle(el);
    return !el.textContent && !!el.getAttribute('aria-label') && style.backgroundColor==='rgba(0, 0, 0, 0)' && style.borderStyle==='dashed';
   })),theme+' empty zones are transparent, dashed and accessible without a visible label');
  }
  await card.locator('[data-choice="B"]').dragTo(card.locator('[data-drop="0"]'));
  assert.equal(await card.locator('.slot[data-k="0"]').inputValue(),'B','mouse drag places letter');
  assert(await card.locator('[data-choice="B"]').isDisabled());
  assert(await card.locator('[data-choice="B"]').evaluate(e=>e.classList.contains('g-used')));
  await card.locator('[data-choice="C"]').click();
  assert.equal(await card.locator('[data-drop="1"]').evaluate(el=>getComputedStyle(el).borderStyle),'dashed','ready target remains dashed');
  await card.locator('[data-drop="1"]').click();
  await card.locator('[data-drop="0"]').dragTo(card.locator('[data-drop="1"]'));
  assert.equal(await card.locator('.slot[data-k="0"]').inputValue(),'');
  assert.equal(await card.locator('.slot[data-k="1"]').inputValue(),'B');
  assert(!(await card.locator('[data-choice="C"]').isDisabled()),'replaced option released');
  await card.locator('[data-drop="1"]').click();
  assert.equal(await card.locator('.slot[data-k="1"]').inputValue(),'','click clears');
  await card.locator('[data-choice="D"]').focus(); await p.keyboard.press('Enter');
  await card.locator('[data-drop="0"]').focus(); await p.keyboard.press('Enter');
  assert.equal(await card.locator('.slot[data-k="0"]').inputValue(),'D','keyboard places');
  await card.locator('[data-choice="B"]').click(); await p.keyboard.press('Escape');
  assert.equal(await card.getAttribute('data-diagram-choice'),null);
  await card.locator('[data-choice="B"]').dragTo(card.locator('.q-text'));
  assert.equal(await p.locator('.g-drag-ghost').count(),0,'invalid drop cleaned');
  assert.equal(await card.locator('.slot[data-k="0"]').inputValue(),'D','invalid drop preserves');
  await card.locator('summary').click();
  await card.locator('.slot[data-k="0"]').selectOption('A');
  assert.equal(await card.locator('[data-drop="0"]').getAttribute('data-value'),'A','select syncs target');
  assert(!(await card.locator('[data-choice="D"]').isDisabled()));
  // Inspect every image/zone combination, then answer using the same click-to-place flow.
  const diagrams=await p.evaluate(()=>GUIA.qs.filter(q=>q.t==='diag').map(q=>({n:q.n,a:q.a,k:q.k})));
  for(const q of diagrams) {
   await p.goto(url+'#p'+q.n);
   const c=p.locator('#p'+q.n);
   await c.locator('.g-diagram-scroll').scrollIntoViewIfNeeded();
   await p.waitForFunction(n=>document.querySelector('#p'+n+' .g-diagram-canvas img').naturalWidth>0,q.n);
   assert.equal(await c.locator('[data-drop]').count(),q.k);
   await c.evaluate(el=>{
    for(const s of el.querySelectorAll('.slot')) {s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));}
   });
   for(let i=0;i<q.a.length;i++) {
    await c.locator('[data-choice="'+q.a[i]+'"]').evaluate(el=>el.click());
    await c.locator('[data-drop="'+i+'"]').evaluate(el=>el.click());
   }
   assert(await c.locator('[data-check]').isEnabled(),'P'+q.n+' complete');
   assert.deepEqual(await c.locator('.slot').evaluateAll(els=>els.map(e=>e.value)),q.a);
   await c.locator('[data-check]').evaluate(el=>el.click());
   assert(await c.evaluate(el=>el.classList.contains('correct')),'P'+q.n+' grading');
   assert.equal(await c.locator('.g-drop.s-ok:disabled').count(),q.k);
   assert(await c.locator('[data-drop]').evaluateAll(els=>els.every(el=>getComputedStyle(el).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(el).borderStyle==='dashed')),'P'+q.n+' graded zones stay transparent and dashed');
  }
  await p.reload();
  assert.equal(await p.locator('#p294 .g-drop.s-ok:disabled').count(),6,'restored targets locked');
  assert.equal(await p.locator('.g-pokemon-effect').count(),0,'no replay');
  console.log('60 diagrams: targets, click placement, grades, locked state, restore OK');
  await p.goto(url+'#p1');
  await p.evaluate(()=>{sessionStorage.setItem('tu-gate','1');localStorage.removeItem('tu-guia:abd-guia-t1-4')});
  await p.reload();
  // A wrong answer keeps the diagram in sync and invokes Gengar.
  for(let k=0;k<5;k++) {
   await card.locator('[data-choice="'+['A','B','C','D','E'][k]+'"]').evaluate(el=>el.click());
   await card.locator('[data-drop="'+k+'"]').evaluate(el=>el.click());
  }
  await card.locator('[data-check]').click();
  assert(await card.locator('.g-outcome-ko img').getAttribute('src').then(s=>s.endsWith('/gengar.png')));
  assert(await card.locator('.g-drop.s-ko').count());
  // Mouse cancellation and navigation must release pointer capture and the drag ghost.
  await p.goto(url+'#p4');
  const source=p.locator('#p4 [data-choice="A"]');await source.scrollIntoViewIfNeeded();
  const sb=await source.boundingBox();await p.mouse.move(sb.x+sb.width/2,sb.y+sb.height/2);await p.mouse.down();await p.mouse.move(sb.x+sb.width/2+20,sb.y+sb.height/2+10);
  assert.equal(await p.locator('.g-drag-ghost').count(),1);
  await p.keyboard.press('Escape');assert.equal(await p.locator('.g-drag-ghost').count(),0);await p.mouse.up();
  const mctx=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,colorScheme:'dark',reducedMotion:'reduce'});
  await mctx.addInitScript(()=>sessionStorage.setItem('tu-gate','1'));
  const m=await mctx.newPage();m.on('pageerror',e=>errors.push(e.message));await m.goto(url+'#p1');
  await m.locator('#p1 [data-choice="B"]').tap();
  await m.locator('#p1 [data-drop="0"]').tap();
  assert.equal(await m.locator('#p1 .slot[data-k="0"]').inputValue(),'B','touch tap places');
  assert(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page no horizontal overflow');
  // Trusted touch sequence exercises placement and cancellation on mobile.
  await m.locator('#p1 .g-diagram-scroll').evaluate(e=>e.scrollLeft=0);
  const ms=m.locator('#p1 [data-choice="A"]');await ms.scrollIntoViewIfNeeded();
  const cdps=await mctx.newCDPSession(m);
  await m.evaluate(() => {const r=document.querySelector('#p1 [data-choice="A"]').getBoundingClientRect();window.scrollBy(0,r.top-220)});
  const sourceBox=await ms.boundingBox(), targetBox=await m.locator('#p1 [data-drop="4"]').boundingBox();
  const startX=sourceBox.x+sourceBox.width/2,startY=sourceBox.y+sourceBox.height/2;
  const endX=targetBox.x+targetBox.width/2,endY=targetBox.y+targetBox.height/2;
  await cdps.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:startX,y:startY}]});
  for(let i=1;i<=8;i++) await cdps.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:startX+(endX-startX)*i/8,y:startY+(endY-startY)*i/8}]});
  assert.equal(await m.locator('.g-drag-ghost').count(),1,'touch dragging starts');
  await cdps.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await m.locator('#p1 .slot[data-k="4"]').inputValue(),'A','touch drag places');
  assert.equal(await m.locator('.g-drag-ghost').count(),0,'touch end cleans ghost');
  const cancelSource=m.locator('#p1 [data-choice="C"]');await cancelSource.scrollIntoViewIfNeeded();const cb=await cancelSource.boundingBox();
  await cdps.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cb.x+cb.width/2,y:cb.y+cb.height/2}]});
  await cdps.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cb.x+cb.width/2+25,y:cb.y+cb.height/2+20}]});
  assert.equal(await m.locator('.g-drag-ghost').count(),1);
  await cdps.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await m.locator('.g-drag-ghost').count(),0,'touch cancel cleans ghost');
  assert.equal(await m.locator('#p1 .slot[data-k="0"]').inputValue(),'B','cancel preserves answer');
  // Image failures expose the existing select alternative.
  const f=await ctx.newPage();await f.route('**/p001.webp',r=>r.abort());await f.goto(url+'#p1');
  await f.waitForFunction(()=>document.querySelector('#p1 .g-diagram-inputs').open);
  assert(await f.locator('#p1 .g-diagram-scroll').isHidden());
  assert.match(await f.locator('#p1 .g-diagram-status').textContent(),/No se pudo cargar/);
  for (const theme of ['light','dark']) {
   await p.goto(url+'#p2');
   await p.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
   await p.waitForTimeout(200);
   const contrast=await p.evaluate(()=>{
    function rgb(s){return (s.match(/[0-9.]+/g)||[]).map(Number)}
    function lum(c){return c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
    let min=100;const failures=[];
    for(const el of document.querySelectorAll('body *')) {
     if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()) || !el.getClientRects().length || ['SCRIPT','STYLE','OPTION'].includes(el.tagName))continue;
     let bg=el;while(bg&&rgb(getComputedStyle(bg).backgroundColor)[3]===0)bg=bg.parentElement;
     if(!bg)continue;
     const s=getComputedStyle(el), a=lum(rgb(s.color)),b=lum(rgb(getComputedStyle(bg).backgroundColor));
     const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);min=Math.min(min,ratio);
     const large=parseFloat(s.fontSize)>=24 || (parseFloat(s.fontSize)>=18.66 && Number(s.fontWeight)>=700);
     if(ratio<(large?3:4.5))failures.push({tag:el.tagName,cls:el.className,color:s.color,bg:getComputedStyle(bg).backgroundColor,ratio});
    }
    return {min,failures};
   });
   assert.deepEqual(contrast.failures,[],theme+' text contrast');console.log(theme+' computed text contrast minimum '+contrast.min.toFixed(2)+':1');
  }
  assert.deepEqual(errors,[]);
  console.log('Mouse drag/move/replace/clear/invalid drop/keyboard/Escape/touch/cancel/mobile/image failure: OK');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
