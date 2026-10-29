const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const base = resolve(__dirname, '../CalidadSoftware/guia-t1-4');
const ctx = { window: {} };
for (const file of ['data.js', 'diagramas.js']) runInNewContext(readFileSync(resolve(base, file), 'utf8'), ctx);
const g = ctx.window.GUIA;
test('Calidad conserva 300 preguntas, seis tipos y 13 etapas completas', () => {
  assert.equal(g.qs.length, 300);
  assert.equal(g.etapas.length, 13);
  assert.deepEqual(JSON.parse(JSON.stringify(g.etapas.flatMap(e => e.bloques.flatMap(b => b.qs)))), Array.from({length:300}, (_,i) => i+1));
  const counts = {};
  for (const q of g.qs) {
    counts[q.t] = (counts[q.t] || 0) + 1;
    assert.equal(q.n, g.qs.indexOf(q) + 1);
    assert(q.s.length && q.s.every(Boolean), `P${q.n}: enunciado`);
    assert(q.r.length && q.w.length && q.w.every(Boolean), `P${q.n}: solucionario`);
    if (q.t === 'test' || q.t === 'calc') {
      assert.equal(q.o.length, 4);
      assert(q.a >= 0 && q.a < 4);
    } else {
      const bank = q.b || q.df || q.it;
      assert(q.a.length > 0);
      assert.equal(new Set(q.a).size, q.a.length, `P${q.n}: letras repetidas`);
      assert(q.a.every(a => bank.some(b => b.l === a)), `P${q.n}: respuesta sin opción`);
      if (q.t === 'rel') { assert.equal(q.c.length, 7); assert.equal(q.df.length, 9); }
      if (q.t === 'huecos') {
        assert.equal(q.a.length, 7);
        assert.equal(q.b.length, 9);
        assert.equal((q.s.join('').match(/\{\{\d+\}\}/g) || []).length, 7);
      }
    }
  }
  assert.deepEqual(counts, {rel:45, test:90, huecos:60, diag:30, ord:30, calc:45});
  assert.equal(g.formulario.temas.flatMap(t => t.rows).length, 39);
});
test('los 30 diagramas tienen imágenes, soluciones y zonas válidas en orden de casilla', () => {
  const diagrams = g.qs.filter(q => q.t === 'diag');
  assert.equal(Object.keys(ctx.window.GUIA_DIAGRAMAS).length, diagrams.length);
  for (const q of diagrams) {
    const zones = ctx.window.GUIA_DIAGRAMAS[q.n];
    assert.equal(zones.length, q.k, `P${q.n}: casillas`);
    for (const suffix of ['', '-sol']) assert(existsSync(resolve(base, `img/p${String(q.n).padStart(3,'0')}${suffix}.webp`)));
    for (const [i, [x,y,w,h]] of zones.entries()) {
      assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= q.img[0] && y+h <= q.img[1], `P${q.n}: límites`);
      for (const [a,b,c,d] of zones.slice(i+1)) assert(x+w <= a || a+c <= x || y+h <= b || b+d <= y, `P${q.n}: solapamiento`);
    }
  }
});
