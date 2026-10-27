const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

test("las preguntas con casillas se pueden resolver sin repetir letras", () => {
  const context = { window: {} };
  runInNewContext(readFileSync(resolve(__dirname, "../ABD/guia-t1-4/data.js"), "utf8"), context);
  const questions = context.window.GUIA.qs.filter(q => Array.isArray(q.a));
  assert(questions.length > 0);
  for (const q of questions) {
    const bank = q.b || q.df || q.it;
    assert.equal(new Set(q.a).size, q.a.length, `P${q.n}: necesita reutilizar letras`);
    assert(q.a.every(letter => bank.some(option => option.l === letter)), `P${q.n}: faltan opciones en el banco`);
  }
});

test("cada diagrama tiene una zona válida por casilla, sin solapamientos", () => {
  const context = { window: {} };
  for (const file of ["data.js", "diagramas.js"]) {
    runInNewContext(readFileSync(resolve(__dirname, "../ABD/guia-t1-4/", file), "utf8"), context);
  }
  const questions = context.window.GUIA.qs.filter(q => q.t === "diag");
  assert.equal(Object.keys(context.window.GUIA_DIAGRAMAS).length, questions.length);
  for (const q of questions) {
    const zones = context.window.GUIA_DIAGRAMAS[q.n];
    assert.equal(zones.length, q.k, `P${q.n}: falta alguna casilla`);
    for (const [i, [x, y, w, h]] of zones.entries()) {
      assert([x, y, w, h].every(Number.isFinite), `P${q.n}: coordenadas inválidas`);
      assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= q.img[0] && y + h <= q.img[1], `P${q.n}: zona fuera de la imagen`);
      for (const [a, b, c, d] of zones.slice(i + 1)) {
        assert(x + w <= a || a + c <= x || y + h <= b || b + d <= y, `P${q.n}: zonas solapadas`);
      }
    }
  }
});
