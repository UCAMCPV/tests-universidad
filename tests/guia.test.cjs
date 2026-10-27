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
