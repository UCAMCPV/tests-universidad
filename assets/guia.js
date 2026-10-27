/* ==========================================================
   Motor de guías guiadas — Tests de Universidad
   Uso: definir window.GUIA (datos) y window.GUIA_CONF = { id, img, totalTime }
   antes de cargar este script. Soporta seis tipos de pregunta:
     test / calc  → cuatro opciones, una correcta (a = índice)
     huecos       → párrafo con {{n}} y banco de palabras (a = letras)
     rel          → conceptos y definiciones (a = letras)
     diag         → figura con casillas y banco de palabras (a = letras)
     ord          → elementos con letra que hay que ordenar (a = letras)
   El progreso se guarda por intento (1.º y 2.º) en el navegador.
   ========================================================== */
(function () {
  var G = window.GUIA, C = window.GUIA_CONF || {};
  var root = document.getElementById("guia");
  if (!G || !root) return;

  var KEY = "tu-guia:" + C.id;
  var SUM = "tu-sum:" + C.id;
  var N = G.qs.length;
  var LET = ["a", "b", "c", "d"];
  var DIF = ["fácil", "intermedia", "difícil"];
  var TYPE = { test: "Test", calc: "Cálculo", huecos: "Rellenar huecos", rel: "Relacionar", diag: "Completar diagrama", ord: "Ordenar" };
  var store = window.TUStore || { get: function () { return null; }, set: function () {}, del: function () {} };
  var pokemonPath = new URL("pokemon/", document.currentScript.src).href;
  function clearPokemon() {
    root.querySelectorAll(".g-pokemon-effect").forEach(function (el) { el.remove(); });
  }

  function pokemonHtml(name) {
    return '<img class="g-pokemon" src="' + pokemonPath + name + '.png" width="96" height="96" alt="">';
  }

  function showOutcome(card, ok, top) {
    clearPokemon();
    var effect = document.createElement("div"), h = "";
    effect.className = "g-pokemon-effect g-outcome " + (ok ? "g-outcome-ok" : "g-outcome-ko");
    effect.setAttribute("aria-hidden", "true");
    effect.style.top = Math.max(32, top - 48) + "px";
    if (ok) {
      h = '<div class="g-outcome-party">';
      for (var k = 0; k < 16; k++) h += '<i class="g-confetti" style="--i:' + k + '"></i>';
      h += "</div>" + pokemonHtml("pikachu") + pokemonHtml("eevee");
    } else h = pokemonHtml("gengar");
    effect.innerHTML = h;
    card.appendChild(effect);
    setTimeout(function () { effect.remove(); }, 2800);
  }

  document.addEventListener("visibilitychange", function () { if (document.hidden) clearPokemon(); });

  /* Etapa de cada pregunta */
  var etapaOf = {};
  G.etapas.forEach(function (e) { e.bloques.forEach(function (b) { b.qs.forEach(function (n) { etapaOf[n] = e.n; }); }); });
  function Q(n) { return G.qs[n - 1]; }
  function etapaQs(e) { var r = []; e.bloques.forEach(function (b) { r = r.concat(b.qs); }); return r; }

  /* ---------- Estado ----------
     st.att[e]  intento activo de la etapa (1 o 2)
     st.r[i][n] respuesta actual en el intento i: { v, ok, hits, rev (vista sin responder) }
     st.f[i][n] opciones acertadas en la primera respuesta del intento: es lo que puntúa
     st.doubt[n] pregunta marcada con «?» */
  var st = store.get(KEY);
  function fresh(who) { return { v: 1, att: {}, r: { 1: {}, 2: {} }, f: { 1: {}, 2: {} }, doubt: {}, filter: "all", who: who || {}, start: null, end: null }; }
  if (!st || st.v !== 1) st = fresh();

  /* Cada opción correcta vale un punto: test y cálculo valen 1; huecos, relacionar, diagrama y ordenar, uno por casilla */
  function pts(q) { return q.t === "test" || q.t === "calc" ? 1 : q.a.length; }
  /* Progreso antiguo: st.f guardaba true/false por pregunta */
  [1, 2].forEach(function (i) {
    Object.keys(st.f[i]).forEach(function (n) {
      var f = st.f[i][n], r = st.r[i][n];
      if (typeof f === "boolean") st.f[i][n] = f ? pts(Q(+n)) : r && !r.rev ? r.hits : 0;
    });
  });

  function att(e) { return st.att[e] || 1; }
  function rec(n) { return st.r[att(etapaOf[n])][n]; }

  function counts(e, i) {
    var qs = etapaQs(e), done = 0, ok = 0, max = 0;
    i = i || att(e.n);
    qs.forEach(function (n) {
      var f = st.f[i][n];
      max += pts(Q(n));
      if (f !== undefined) { done++; ok += f; }
    });
    /* total y done cuentan preguntas; ok y max, opciones */
    return { total: qs.length, done: done, ok: ok, max: max };
  }
  function objetivo(e) { return Math.ceil(counts(e, 1).max * 0.8); }
  function globalCounts() {
    var done = 0, ok = 0, max = 0;
    /* De cada etapa cuenta su último intento con respuestas */
    G.etapas.forEach(function (e) { var c = counts(e, 2); if (!c.done) c = counts(e, 1); done += c.done; ok += c.ok; max += c.max; });
    return { done: done, ok: ok, max: max };
  }
  function save() {
    var g = globalCounts();
    if (g.done && !st.start) st.start = Date.now();
    if (g.done === N && !st.end) st.end = Date.now();
    store.set(KEY, st);
    store.set(SUM, { done: g.done, ok: g.ok, total: N });
  }

  /* ---------- Utilidades ---------- */
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function stripTags(h) { var d = document.createElement("div"); d.innerHTML = h; return d.textContent; }
  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }
  function ordinal(i) { return i === 1 ? "1.er" : "2.º"; }
  function img(n, sol) { return C.img + "p" + pad(n) + (sol ? "-sol" : "") + ".webp"; }
  function fmtDate(t) { return t ? new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
  function parseMeta(meta) {
    /* «Tema 1 · 1.1–1.2 · 15 preguntas · P1–P15 · unos 40 min» */
    var p = meta.split(" · ");
    return { temas: p[0] + " · " + p[1], qs: p[2], range: p[3], time: p[4].replace(/^unos /, "") };
  }

  /* Opciones de un desplegable con letras del banco */
  function selectHtml(q, k, pool, label) {
    var h = '<select class="slot" data-k="' + k + '" aria-label="' + esc(label) + '"><option value="">' + esc(label) + "</option>";
    pool.forEach(function (p) { h += '<option value="' + p.l + '">' + p.l + (p.w ? " · " + esc(p.w) : "") + "</option>"; });
    return h + "</select>";
  }
  function bankHtml(q) {
    var h = '<div class="g-bank"><div class="g-bank-h">' + esc(q.bh) + "</div><div class=\"g-chips\">";
    q.b.forEach(function (b) { h += '<span class="g-chip" data-choice="' + b.l + '">' + choiceHtml(b.l, b.w) + "</span>"; });
    return h + "</div></div>";
  }
  function slotPool(q) {
    if (q.t === "rel") return q.df.map(function (d) { return { l: d.l }; });
    if (q.t === "ord") return q.it.map(function (d) { return { l: d.l }; });
    return q.b.map(function (b) { return { l: b.l, w: stripTags(b.w) }; });
  }

  function choiceHtml(letter, text) {
    return '<span class="g-choice-text"><b>' + letter + ".</b> " + text + '</span><span class="g-choice-status" hidden> · En uso</span>';
  }

  function syncChoices(card, selected) {
    if (selected) clearPokemon();
    var slots = Array.from(card.querySelectorAll(".slot"));
    var used = slots.map(function (sel) { return sel.value; }).filter(Boolean);
    slots.forEach(function (sel) {
      Array.from(sel.options).forEach(function (opt) {
        var taken = !!opt.value && opt.value !== sel.value && used.indexOf(opt.value) !== -1;
        opt.disabled = taken;
        opt.hidden = taken;
      });
    });
    card.querySelectorAll("[data-choice]").forEach(function (choice) {
      var letter = choice.getAttribute("data-choice"), taken = used.indexOf(letter) !== -1;
      choice.classList.toggle("g-used", taken);
      choice.querySelector(".g-choice-status").hidden = !taken;
      if (selected && selected.value === letter) {
        var effect = document.createElement("span");
        effect.className = "g-pokemon-effect g-crossout";
        effect.setAttribute("aria-hidden", "true");
        effect.innerHTML = pokemonHtml("pikachu");
        var bounds = choice.getBoundingClientRect();
        if (bounds.bottom < 160 || bounds.top > window.innerHeight) {
          var field = selected.getBoundingClientRect(), question = card.getBoundingClientRect();
          effect.style.inset = "auto";
          effect.style.top = (field.top - question.top) + "px";
          effect.style.left = (field.left - question.left) + "px";
          effect.style.width = field.width + "px";
          effect.style.height = field.height + "px";
          card.appendChild(effect);
        } else choice.appendChild(effect);
        setTimeout(function () { effect.remove(); }, 850);
      }
    });
    var check = card.querySelector("[data-check]");
    if (check) check.disabled = used.length !== slots.length || new Set(used).size !== used.length;
  }

  /* ---------- Tarjeta de pregunta ---------- */
  function qCard(n) {
    var q = Q(n), pool = q.t === "test" || q.t === "calc" ? null : slotPool(q);
    var h = '<article class="q g-q" id="p' + n + '" data-n="' + n + '">';
    h += '<div class="q-top"><span><span class="g-pn d' + q.d + '">P' + n + '</span> <span class="g-leg">' + TYPE[q.t] + " · " + q.m.join(" · ") + " · " + DIF[q.d] + "</span></span>" +
      '<span class="g-top-r"><span class="verdict" aria-live="polite"></span>' +
      '<button type="button" class="g-doubt" data-doubt="' + n + '" aria-pressed="' + (st.doubt[n] ? "true" : "false") + '" title="Marcar como dudosa">?</button></span></div>';

    var paras = q.s.slice();
    if (q.t === "huecos") {
      paras = paras.map(function (p) {
        return p.replace(/\{\{(\d+)\}\}/g, function (m, k) { return selectHtml(q, +k - 1, pool, "(" + k + ")"); });
      });
    }
    h += '<div class="q-text">' + paras.map(function (p, i) { return "<p" + (i ? ' class="g-sub"' : "") + ">" + p + "</p>"; }).join("") + "</div>";

    if (q.t === "test" || q.t === "calc") {
      h += '<fieldset class="opts">';
      q.o.forEach(function (o, k) {
        h += '<label class="opt" data-o="' + k + '"><input type="radio" name="r' + n + '" value="' + k + '"><span class="letter">' + LET[k] + ")</span><span>" + o + "</span></label>";
      });
      h += "</fieldset>";
    } else if (q.t === "huecos") {
      h += bankHtml(q);
    } else if (q.t === "diag") {
      h += '<figure class="figure g-fig"><img src="' + img(n) + '" width="' + q.img[0] + '" height="' + q.img[1] + '" alt="Diagrama de la pregunta P' + n + ' con ' + q.k + ' casillas numeradas" loading="lazy"></figure>';
      h += bankHtml(q);
      h += '<div class="g-grid">';
      for (var k = 0; k < q.k; k++) h += '<label class="g-cell"><span>Casilla ' + (k + 1) + "</span>" + selectHtml(q, k, pool, "—") + "</label>";
      h += "</div>";
    } else if (q.t === "rel") {
      h += '<div class="g-rel"><div class="g-rel-col"><div class="g-col-h">Concepto · Letra</div>';
      q.c.forEach(function (c, k) {
        h += '<label class="g-rel-row"><span class="g-num">' + (k + 1) + ".</span><span class=\"g-rel-c\">" + c + "</span>" + selectHtml(q, k, pool, "—") + "</label>";
      });
      h += '</div><div class="g-rel-col"><div class="g-col-h">Definición</div><ol class="g-defs">';
      q.df.forEach(function (d) { h += '<li data-choice="' + d.l + '">' + choiceHtml(d.l, d.h) + "</li>"; });
      h += "</ol></div></div>";
    } else if (q.t === "ord") {
      h += '<ol class="g-defs g-items">';
      q.it.forEach(function (d) { h += '<li data-choice="' + d.l + '">' + choiceHtml(d.l, d.h) + "</li>"; });
      h += '</ol><div class="g-grid">';
      for (var p = 0; p < q.a.length; p++) h += '<label class="g-cell"><span>Posición ' + (p + 1) + "</span>" + selectHtml(q, p, pool, "—") + "</label>";
      h += "</div>";
    }
    if (q.t !== "test" && q.t !== "calc") {
      h += '<div class="toolbar g-actions"><button type="button" class="btn small primary" data-check="' + n + '" disabled>Comprobar</button>' +
        '<button type="button" class="btn small" data-reveal="' + n + '">Ver solución</button></div>';
    } else {
      h += '<div class="toolbar g-actions"><button type="button" class="btn small" data-reveal="' + n + '">Ver solución</button></div>';
    }
    h += '<div class="explain" hidden></div></article>';
    return h;
  }

  function solutionHtml(n, r) {
    var q = Q(n), h = "";
    var multi = q.t !== "test" && q.t !== "calc";
    if (r.rev) h += '<div class="head">Solución (cuenta como fallada).</div>';
    else if (r.ok) h += '<div class="head">Correcto' + (multi ? " (" + r.hits + "/" + q.a.length + ")" : "") + ".</div>";
    else if (multi) h += '<div class="head">Incorrecto: ' + r.hits + " de " + q.a.length + " bien.</div>";
    else h += '<div class="head">Incorrecto. La respuesta correcta es la ' + LET[q.a] + ").</div>";
    h += '<div class="g-sol"><div class="g-sol-h">Respuesta</div><div class="g-resp">' + q.r.map(function (x) { return "<div>" + x + "</div>"; }).join("") + "</div>";
    h += '<div class="g-sol-h">Por qué</div>' + q.w.map(function (x) { return "<p>" + x + "</p>"; }).join("") + "</div>";
    if (q.t === "diag") h += '<figure class="figure g-fig"><img src="' + img(n, true) + '" width="' + q.simg[0] + '" height="' + q.simg[1] + '" alt="Diagrama de P' + n + ' resuelto" loading="lazy"><figcaption class="figcaption">P' + n + " resuelta</figcaption></figure>";
    return h;
  }

  function paint(n) {
    var card = document.getElementById("p" + n);
    if (!card) return;
    var q = Q(n), r = rec(n);
    card.classList.remove("correct", "wrong");
    var check = card.querySelector("[data-check]"), reveal = card.querySelector("[data-reveal]");
    if (!r) {
      card.querySelector(".verdict").textContent = "";
      card.querySelector(".explain").hidden = true;
      return;
    }
    card.classList.add(r.ok ? "correct" : "wrong");
    card.querySelector(".verdict").textContent = r.rev ? "Vista" : r.ok ? "✓ Correcta" : "✗ Incorrecta";
    if (check) check.hidden = true;
    if (reveal) reveal.hidden = true;
    if (q.t === "test" || q.t === "calc") {
      card.querySelectorAll(".opt").forEach(function (lbl) {
        var o = +lbl.getAttribute("data-o"), inp = lbl.querySelector("input");
        inp.disabled = true; lbl.classList.add("locked");
        if (o === r.v) inp.checked = true;
        if (o === r.v && r.ok) lbl.classList.add("pick-ok");
        else if (o === r.v) lbl.classList.add("pick-ko");
        else if (o === q.a) lbl.classList.add("show-ok");
      });
    } else {
      card.querySelectorAll(".slot").forEach(function (sel) {
        var k = +sel.getAttribute("data-k"), v = r.v ? r.v[k] : "";
        sel.value = v || ""; sel.disabled = true;
        sel.classList.add(v === q.a[k] ? "s-ok" : "s-ko");
        var fix = sel.parentNode.querySelector('.g-fix[data-k="' + k + '"]');
        if (v !== q.a[k] && !fix) sel.insertAdjacentHTML("afterend", '<span class="g-fix" data-k="' + k + '">→ ' + q.a[k] + "</span>");
      });
      syncChoices(card);
    }
    var ex = card.querySelector(".explain");
    ex.hidden = false;
    ex.innerHTML = solutionHtml(n, r);
  }

  function answer(n, v, reveal) {
    var q = Q(n), i = att(etapaOf[n]);
    var card = document.getElementById("p" + n);
    var picked = card.querySelector(".opt input:checked");
    var anchor = picked ? picked.closest(".opt") : card.querySelector(".g-actions");
    var top = anchor.getBoundingClientRect().top - card.getBoundingClientRect().top;
    var r = { v: v };
    if (reveal) { r.ok = false; r.hits = 0; r.rev = true; }
    else if (q.t === "test" || q.t === "calc") { r.ok = v === q.a; r.hits = r.ok ? 1 : 0; }
    else {
      r.hits = 0;
      q.a.forEach(function (a, k) { if (v[k] === a) r.hits++; });
      r.ok = r.hits === q.a.length;
    }
    /* El acierto que puntúa es el de la primera respuesta del intento */
    if (st.f[i][n] === undefined) st.f[i][n] = r.hits;
    st.r[i][n] = r;
    save(); paint(n); update();
    if (!reveal) showOutcome(card, r.ok, top); else clearPokemon();
  }

  /* ---------- Vistas ---------- */
  var view = null;

  function etapaView(e) {
    var m = parseMeta(e.meta), a = att(e.n);
    var h = '<div class="page-head g-head"><span class="eyebrow">Etapa ' + e.n + " de " + G.etapas.length + "</span><h1>" + e.title + '</h1><p class="lead">' + e.meta + "</p></div>";
    h += '<div class="g-box hilo"><div class="g-box-h">🧭 Hilo conductor</div>' + e.hilo.map(function (p) { return "<p>" + p + "</p>"; }).join("") + "</div>";
    h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bloque</th><th>Sección</th><th>Diapositivas</th><th>Preguntas</th></tr></thead><tbody>';
    e.tabla.forEach(function (r, k) {
      h += '<tr><td><a href="#b-' + e.bloques[k].id + '">' + r[0] + "</a></td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td></tr>";
    });
    h += "</tbody></table></div>";

    h += '<div class="test-bar"><div class="row">' +
      '<span class="stats"><b id="sDone">0</b>/' + etapaQs(e).length + "</span>" +
      '<div class="track" aria-hidden="true"><div class="f-ok" id="fOk"></div><div class="f-ko" id="fKo"></div></div>' +
      '<span class="stats ok">✓ <b id="sOk">0</b></span><span class="stats ko">✗ <b id="sKo">0</b></span>' +
      '<span class="g-att">' + ordinal(a) + " intento</span></div></div>";
    h += '<div class="filters" role="group" aria-label="Filtrar preguntas">' +
      '<button class="btn small" data-f="all">Todas</button>' +
      '<button class="btn small" data-f="pending">Pendientes</button>' +
      '<button class="btn small" data-f="wrong">Falladas</button>' +
      '<button class="btn small" data-f="doubt">Dudosas «?»</button></div>';

    e.bloques.forEach(function (b) {
      h += '<section class="cat g-bloque" id="b-' + b.id + '" data-b="' + b.id + '">';
      h += '<h2 class="cat-title">' + b.id + " · " + b.title + ' <span class="cat-score">' + b.range + "</span></h2>";
      h += '<div class="g-box antes"><div class="g-box-h">📘 ' + b.antesHead + "</div>" + b.antes.map(function (p) { return "<p>" + p + "</p>"; }).join("") + "</div>";
      b.qs.forEach(function (n) { h += qCard(n); });
      h += '<details class="g-box idea" data-idea="' + b.id + '"><summary class="g-box-h">🔑 Idea clave del bloque ' + b.id + "</summary><p>" + b.idea + "</p></details>";
      h += "</section>";
    });
    h += '<p class="empty-msg" id="emptyMsg" hidden></p>';
    h += '<div class="g-box retener"><div class="g-box-h">📌 Lo que debes retener</div><ul>' + e.ret.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
    h += '<div id="result"></div>';
    h += '<div class="toolbar" style="margin-top:18px">' +
      '<button class="btn" id="bRetry">Repetir las falladas</button>' +
      '<button class="btn" id="bSecond">' + (a === 1 ? "Empezar el 2.º intento" : "Volver al 1.er intento") + "</button>" +
      '<button class="btn" id="bReset">Reiniciar este intento</button></div>';
    h += '<nav class="g-pager">' +
      (e.n > 1 ? '<a class="btn" href="#etapa-' + (e.n - 1) + '">← Etapa ' + (e.n - 1) + "</a>" : '<a class="btn" href="#inicio">← Inicio</a>') +
      (e.n < G.etapas.length ? '<a class="btn primary" href="#etapa-' + (e.n + 1) + '">Etapa ' + (e.n + 1) + " →</a>" : '<a class="btn primary" href="#repaso">Repaso final →</a>') +
      "</nav>";
    return h;
  }

  function autoevalHtml() {
    var h = '<div class="tbl-wrap"><table class="tbl g-auto"><thead><tr><th>Etapa</th><th>Preguntas</th><th>Opciones</th><th>Objetivo (80 %)</th><th>Aciertos 1.er intento</th><th>Aciertos 2.º intento</th><th>Temas</th></tr></thead><tbody>';
    var t = { q: 0, max: 0, obj: 0, a1: 0, a2: 0, d1: 0, d2: 0 };
    G.etapas.forEach(function (e) {
      var c1 = counts(e, 1), c2 = counts(e, 2), obj = objetivo(e), m = parseMeta(e.meta);
      t.q += c1.total; t.max += c1.max; t.obj += obj; t.a1 += c1.ok; t.a2 += c2.ok; t.d1 += c1.done; t.d2 += c2.done;
      function cell(c) {
        if (!c.done) return '<td class="g-muted">—</td>';
        var cls = c.done === c.total ? (c.ok >= obj ? "g-pass" : "g-fail") : "";
        return '<td class="' + cls + '"><b>' + c.ok + "</b>" + (c.done < c.total ? ' <span class="g-muted">(' + c.done + "/" + c.total + ")</span>" : "") + "</td>";
      }
      h += '<tr><td><a href="#etapa-' + e.n + '">' + e.n + ". " + e.title + "</a></td><td>" + c1.total + "</td><td>" + c1.max + "</td><td>" + obj + "</td>" + cell(c1) + cell(c2) + "<td>" + m.temas + "</td></tr>";
    });
    h += "<tr><td><b>Total</b></td><td>" + t.q + "</td><td>" + t.max + "</td><td>" + t.obj + "</td><td><b>" + (t.d1 ? t.a1 : "—") + "</b></td><td><b>" + (t.d2 ? t.a2 : "—") + "</b></td><td>Temas 1–4</td></tr>";
    return h + "</tbody></table></div>";
  }

  function recorridoHtml() {
    var h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Etapa</th><th>Temas y secciones</th><th>Preguntas</th><th>Numeración</th><th>Tiempo</th><th>Progreso</th></tr></thead><tbody>';
    G.etapas.forEach(function (e) {
      var m = parseMeta(e.meta), c = counts(e);
      h += '<tr><td><a href="#etapa-' + e.n + '">' + e.n + ". " + e.title + "</a></td><td>" + m.temas + "</td><td>" + c.total + "</td><td>" + m.range + "</td><td>" + m.time + "</td>" +
        '<td><span class="progress-pill"><span class="mini"><i style="width:' + (c.done / c.total * 100) + '%"></i></span>' + c.done + "/" + c.total + "</span></td></tr>";
    });
    h += "<tr><td><b>Total</b></td><td>Temas 1–4</td><td><b>" + N + "</b></td><td>P1–P" + N + "</td><td><b>" + C.totalTime + "</b></td><td>" + globalCounts().done + "/" + N + "</td></tr>";
    return h + "</tbody></table></div>";
  }

  function introView() {
    var g = globalCounts();
    var h = document.getElementById("tpl-intro").innerHTML;
    h = h.replace("{{recorrido}}", recorridoHtml()).replace("{{autoeval}}", autoevalHtml())
      .replace("{{global}}", String(g.ok)).replace("{{max}}", String(g.max)).replace("{{start}}", fmtDate(st.start)).replace("{{end}}", fmtDate(st.end))
      .replace("{{solIntro}}", G.solIntro);
    var next = G.etapas.filter(function (e) { var c = counts(e); return c.done < c.total; })[0];
    h = h.replace("{{continuar}}", next ? '<a class="btn primary" href="#etapa-' + next.n + '">' + (g.done ? "Continuar por la etapa " : "Empezar por la etapa ") + next.n + "</a>" : '<a class="btn primary" href="#repaso">Ir al repaso final</a>');
    return h;
  }

  function formularioView() {
    var F = G.formulario;
    var h = '<div class="page-head g-head"><span class="eyebrow">Consulta</span><h1>Formulario</h1><p class="lead">' + F.intro + "</p></div>";
    F.temas.forEach(function (t) {
      h += '<section class="cat"><h2 class="cat-title">' + t.t + '</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fórmula</th><th>Sección</th><th>Diap.</th></tr></thead><tbody>';
      t.rows.forEach(function (r) { h += "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; });
      h += "</tbody></table></div></section>";
    });
    return h;
  }

  function repasoView() {
    var h = '<div class="page-head g-head"><span class="eyebrow">Antes del examen</span><h1>Repaso final</h1></div>';
    h += '<div class="g-box practica"><div class="g-box-h">✓ Buena práctica — Antes del examen</div><p>' + C.buenaPractica + "</p></div>";
    G.etapas.forEach(function (e) {
      h += '<section class="cat"><h2 class="cat-title"><a href="#etapa-' + e.n + '">Etapa ' + e.n + " · " + e.title + "</a></h2>";
      e.bloques.forEach(function (b) { h += '<div class="g-box idea"><div class="g-box-h">🔑 ' + b.id + " · " + b.title + "</div><p>" + b.idea + "</p></div>"; });
      h += '<div class="g-box retener"><div class="g-box-h">📌 Lo que debes retener</div><ul>' + e.ret.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div></section>";
    });
    return h;
  }

  function navHtml(cur) {
    var h = '<nav class="toc g-nav" aria-label="Etapas"><a href="#inicio"' + (cur === "inicio" ? ' aria-current="page"' : "") + ">Inicio</a>";
    G.etapas.forEach(function (e) {
      var c = counts(e), cls = c.done === c.total ? (c.ok >= objetivo(e) ? " g-done-ok" : " g-done-ko") : c.done ? " g-doing" : "";
      h += '<a class="' + cls + '" href="#etapa-' + e.n + '" title="' + esc(e.title) + '"' + (cur === e.n ? ' aria-current="page"' : "") + ">Etapa " + e.n + "</a>";
    });
    h += '<a href="#formulario"' + (cur === "formulario" ? ' aria-current="page"' : "") + ">Formulario</a>";
    h += '<a href="#repaso"' + (cur === "repaso" ? ' aria-current="page"' : "") + ">Repaso final</a></nav>";
    return h;
  }

  function route() {
    var hsh = location.hash.replace(/^#/, ""), m;
    var target = null;
    if ((m = hsh.match(/^etapa-(\d+)$/))) view = +m[1];
    else if ((m = hsh.match(/^p(\d+)$/)) && etapaOf[+m[1]]) { view = etapaOf[+m[1]]; target = hsh; }
    else if ((m = hsh.match(/^b-(\d+)[A-Z]$/))) { view = +m[1]; target = hsh; }
    else if (hsh === "formulario" || hsh === "repaso") view = hsh;
    else view = "inicio";
    if (typeof view === "number" && (view < 1 || view > G.etapas.length)) view = "inicio";
    render();
    var el = target && document.getElementById(target);
    if (el) el.scrollIntoView({ block: "start", behavior: "instant" }); else window.scrollTo({ top: 0, behavior: "instant" });
  }

  function render() {
    clearPokemon();
    var h = navHtml(view);
    if (typeof view === "number") h += etapaView(G.etapas[view - 1]);
    else if (view === "formulario") h += formularioView();
    else if (view === "repaso") h += repasoView();
    else h += introView();
    root.innerHTML = h;
    var cur = root.querySelector('.g-nav [aria-current]');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest", inline: "center" });
    if (typeof view === "number") {
      etapaQs(G.etapas[view - 1]).forEach(paint);
      wireEtapa();
      applyFilter();
      update();
    } else if (view === "inicio") wireIntro();
  }

  function update() {
    if (typeof view !== "number") return;
    var e = G.etapas[view - 1], c = counts(e), ko = 0, nDone = 0, hit = 0, miss = 0;
    etapaQs(e).forEach(function (n) {
      var r = rec(n);
      if (!r) return;
      nDone++; if (!r.ok) ko++;
      hit += r.hits; miss += pts(Q(n)) - r.hits;
    });
    /* El contador cuenta preguntas; ✓, ✗ y la barra, opciones */
    document.getElementById("sDone").textContent = nDone;
    document.getElementById("sOk").textContent = hit;
    document.getElementById("sKo").textContent = miss;
    document.getElementById("fOk").style.width = (hit / c.max * 100) + "%";
    document.getElementById("fKo").style.width = (miss / c.max * 100) + "%";
    document.getElementById("bRetry").disabled = ko === 0;
    e.bloques.forEach(function (b) {
      var all = b.qs.every(function (n) { return rec(n); });
      var d = root.querySelector('[data-idea="' + b.id + '"]');
      if (d && all && !d.hasAttribute("data-auto")) { d.open = true; d.setAttribute("data-auto", ""); }
    });
    var res = document.getElementById("result"), obj = objetivo(e);
    if (c.done === c.total) {
      var pct = Math.round(c.ok / c.max * 100), pass = c.ok >= obj;
      var cls = pass ? "bien" : pct >= 60 ? "aceptable" : "mal";
      res.innerHTML = '<div class="result ' + cls + '"><h2>Resultado de la etapa ' + e.n + " · " + ordinal(att(e.n)) + ' intento</h2><div class="big">' + c.ok + "/" + c.max + " opciones · " + pct + "%</div><p>" +
        (pass ? "Has alcanzado el objetivo (" + obj + " opciones correctas, 80 %). Lee las ideas clave aunque hayas acertado y sigue con la siguiente etapa."
          : "Objetivo: " + obj + " opciones correctas (80 %). Repasa las ideas clave y «Lo que debes retener», y vuelve a responder la etapa dos o tres días después con el 2.º intento.") +
        "</p><p class=\"g-muted\">Cada opción correcta vale un punto (un hueco, una casilla o una relación; las de test y cálculo valen uno). Cuenta la primera respuesta de cada pregunta; «Repetir las falladas» sirve para practicar sin cambiar la nota.</p></div>";
    } else res.innerHTML = "";
  }

  function applyFilter() {
    var f = st.filter || "all", visible = 0;
    root.querySelectorAll("[data-f]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-f") === f ? "true" : "false"); });
    root.querySelectorAll(".g-q").forEach(function (card) {
      var n = +card.getAttribute("data-n"), r = rec(n);
      var show = f === "all" || (f === "pending" && !r) || (f === "wrong" && r && !r.ok) || (f === "doubt" && st.doubt[n]);
      card.hidden = !show;
      if (show) visible++;
    });
    root.querySelectorAll(".g-bloque").forEach(function (sec) {
      sec.hidden = f !== "all" && !sec.querySelector(".g-q:not([hidden])");
    });
    var em = document.getElementById("emptyMsg");
    em.hidden = visible > 0;
    em.textContent = f === "wrong" ? "No tienes preguntas falladas en esta etapa." : f === "pending" ? "No te quedan preguntas pendientes en esta etapa." : f === "doubt" ? "No has marcado ninguna pregunta con «?»." : "";
  }

  function slotsOf(card) {
    var v = [];
    card.querySelectorAll(".slot").forEach(function (s) { v[+s.getAttribute("data-k")] = s.value; });
    return v;
  }

  var resetArmed = null;
  function wireEtapa() {
    var e = G.etapas[view - 1];
    root.querySelectorAll(".opt input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var n = +inp.name.slice(1);
        if (rec(n)) return;
        answer(n, +inp.value);
      });
    });
    root.querySelectorAll(".slot").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var card = sel.closest(".g-q");
        var duplicate = Array.from(card.querySelectorAll(".slot")).some(function (other) { return other !== sel && sel.value && other.value === sel.value; });
        if (duplicate) sel.value = "";
        syncChoices(card, sel);
      });
    });
    root.querySelectorAll("[data-check]").forEach(function (b) {
      b.addEventListener("click", function () { var n = +b.getAttribute("data-check"); if (!rec(n)) answer(n, slotsOf(b.closest(".g-q"))); });
    });
    root.querySelectorAll("[data-reveal]").forEach(function (b) {
      b.addEventListener("click", function () { var n = +b.getAttribute("data-reveal"); if (!rec(n)) answer(n, null, true); });
    });
    root.querySelectorAll("[data-doubt]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = +b.getAttribute("data-doubt");
        if (st.doubt[n]) delete st.doubt[n]; else st.doubt[n] = 1;
        b.setAttribute("aria-pressed", st.doubt[n] ? "true" : "false");
        save();
      });
    });
    root.querySelectorAll("[data-f]").forEach(function (b) {
      b.addEventListener("click", function () { st.filter = b.getAttribute("data-f"); save(); applyFilter(); });
    });
    document.getElementById("bRetry").addEventListener("click", function () {
      var i = att(e.n);
      etapaQs(e).forEach(function (n) {
        /* Se borra la respuesta, pero st.f conserva el primer acierto para la autoevaluación */
        if (st.r[i][n] && !st.r[i][n].ok) delete st.r[i][n];
      });
      st.filter = "pending";
      save(); render();
    });
    document.getElementById("bSecond").addEventListener("click", function () {
      st.att[e.n] = att(e.n) === 1 ? 2 : 1;
      st.filter = "all";
      save(); render(); window.scrollTo(0, 0);
    });
    var bReset = document.getElementById("bReset");
    bReset.addEventListener("click", function () {
      if (!resetArmed) {
        bReset.textContent = "¿Seguro? Pulsa otra vez para borrar";
        resetArmed = setTimeout(function () { bReset.textContent = "Reiniciar este intento"; resetArmed = null; }, 4000);
        return;
      }
      clearTimeout(resetArmed); resetArmed = null;
      etapaQs(e).forEach(function (n) { delete st.r[att(e.n)][n]; delete st.f[att(e.n)][n]; });
      st.filter = "all";
      save(); render(); window.scrollTo(0, 0);
    });
  }

  function wireIntro() {
    root.querySelectorAll("[data-who]").forEach(function (inp) {
      var k = inp.getAttribute("data-who");
      inp.value = st.who[k] || "";
      inp.addEventListener("input", function () { st.who[k] = inp.value; store.set(KEY, st); });
    });
    var bAll = document.getElementById("bResetAll");
    if (bAll) bAll.addEventListener("click", function () {
      if (!resetArmed) {
        bAll.textContent = "¿Seguro? Se borran los dos intentos de las 13 etapas";
        resetArmed = setTimeout(function () { bAll.textContent = "Borrar todo el progreso"; resetArmed = null; }, 4000);
        return;
      }
      clearTimeout(resetArmed); resetArmed = null;
      st = fresh(st.who);
      save(); render();
    });
  }

  window.addEventListener("hashchange", route);
  route();
})();
