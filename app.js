/* ================= محرك الدروس التفاعلية =================
   الفصل الأول: المجموعات — مبادئ الرياضيات لكليات إدارة الأعمال
   ======================================================== */
(function () {
  'use strict';

  /* ---------- التخزين المحلي (آمن) ---------- */
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  var PFX = 'qm1:';

  /* ---------- الوضع الليلي ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var b = document.getElementById('themeBtn');
    if (b) b.innerHTML = (t === 'dark' ? '☀️ <span>وضع نهاري</span>' : '🌙 <span>وضع ليلي</span>');
  }
  var saved = LS.get(PFX + 'theme');
  if (!saved) {
    saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  applyTheme(saved);
  window.addEventListener('DOMContentLoaded', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    var b = document.getElementById('themeBtn');
    if (b) b.addEventListener('click', function () {
      var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      LS.set(PFX + 'theme', t); applyTheme(t);
    });
  });

  /* ---------- تطبيع الإجابات ---------- */
  var AR_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };

  function baseNorm(s) {
    s = String(s == null ? '' : s);
    s = s.replace(/[٠-٩]/g, function (d) { return AR_DIGITS[d]; });
    s = s.replace(/[،؛]/g, ',');
    s = s.replace(/[‎‏‪-‮]/g, '');
    s = s.replace(/\s+/g, '');
    s = s.replace(/[Ø∅]|phi|فاي|فارغة|الخالية|\{\}/gi, '∅');
    s = s.replace(/[ـ]/g, '');
    return s;
  }

  // تقسيم على الفواصل في المستوى الأعلى فقط (يحترم الأقواس)
  function splitTop(s) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '(' || c === '{' || c === '[') depth++;
      if (c === ')' || c === '}' || c === ']') depth--;
      if (c === ',' && depth === 0) { out.push(cur); cur = ''; }
      else cur += c;
    }
    if (cur !== '') out.push(cur);
    return out;
  }

  function normTok(t) {
    t = t.trim();
    // كسور بسيطة إلى صورة موحّدة
    var mfrac = t.match(/^(-?\d+)\/(\d+)$/);
    if (mfrac) {
      var a = parseInt(mfrac[1], 10), b = parseInt(mfrac[2], 10);
      if (b !== 0) {
        var g = (function gcd(x, y) { x = Math.abs(x); y = Math.abs(y); while (y) { var z = x % y; x = y; y = z; } return x || 1; })(a, b);
        return (a / g) + '/' + (b / g);
      }
    }
    if (/^-?\d*\.\d+$/.test(t)) {
      var v = parseFloat(t);
      // 0.5 -> 1/2 عند الإمكان
      for (var d = 2; d <= 12; d++) { if (Math.abs(v * d - Math.round(v * d)) < 1e-9) { var n = Math.round(v * d); var g2 = (function gcd(x, y) { x = Math.abs(x); y = Math.abs(y); while (y) { var z = x % y; x = y; y = z; } return x || 1; })(n, d); if (d / g2 === 1) return String(n / g2); return (n / g2) + '/' + (d / g2); } }
      return String(v);
    }
    if (/^-?\d+$/.test(t)) return String(parseInt(t, 10));
    // أزواج مرتبة (a,b)
    if (/^\(.*\)$/.test(t)) {
      var inner = t.slice(1, -1);
      return '(' + splitTop(inner).map(normTok).join(',') + ')';
    }
    // مجموعة داخلية {..}
    if (/^\{.*\}$/.test(t)) {
      var in2 = t.slice(1, -1);
      if (in2 === '') return '∅';
      var arr = splitTop(in2).map(normTok);
      arr = uniqSort(arr);
      return '{' + arr.join(',') + '}';
    }
    return t.toLowerCase();
  }

  function uniqSort(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) { if (!seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); } }
    out.sort();
    return out;
  }

  // تطبيع مجموعة: يقبل {1,2,3} أو 1,2,3
  function normSet(s) {
    var t = baseNorm(s);
    if (t === '' ) return '';
    if (t === '∅') return '∅';
    if (/^\{.*\}$/.test(t)) t = t.slice(1, -1);
    if (t === '') return '∅';
    var arr = splitTop(t).filter(function (x) { return x !== ''; }).map(normTok);
    if (!arr.length) return '∅';
    return '{' + uniqSort(arr).join(',') + '}';
  }

  function normText(s) {
    var t = baseNorm(s).toLowerCase();
    t = t.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
    t = t.replace(/[.،؟!:؛]/g, '');
    return t;
  }

  function normSym(s) {
    var t = baseNorm(s);
    t = t.replace(/notin|∉|لاينتمي|لا ينتمي/gi, '∉').replace(/in|∈|ينتمي/gi, '∈');
    t = t.replace(/nsubseteq|⊄|⊈|ليست جزئية|ليستجزئيه/gi, '⊈').replace(/subseteq|⊆|⊂|جزئية|جزئيه/gi, '⊆');
    return t;
  }

  /* ---------- الحالة ---------- */
  var LESSON = window.LESSON_ID || 'x';
  var STATE = {};
  (function () {
    var raw = LS.get(PFX + LESSON);
    if (raw) { try { STATE = JSON.parse(raw) || {}; } catch (e) { STATE = {}; } }
  })();
  function save() { LS.set(PFX + LESSON, JSON.stringify(STATE)); }

  /* ---------- بناء الأسئلة ---------- */
  var ALL = [];   // كل الأسئلة القابلة للتقييم في هذه الصفحة

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function buildQuestion(host, q, idx) {
    if (q.type === 'heading') {
      var h = el('h2', null, q.text);
      host.appendChild(h);
      if (q.note) host.appendChild(el('p', 'lead', q.note));
      return null;
    }
    var box = el('div', 'q');
    box.id = 'q_' + q.id;

    var head = el('div', 'q-head');
    head.appendChild(el('div', 'q-num', q.no || String(idx)));
    var txt = el('div', 'q-text', q.text + (q.src ? ' <span class="q-src">— ' + q.src + '</span>' : ''));
    head.appendChild(txt);
    box.appendChild(head);

    if (q.vennFig) { var vf = el('div', 'figure'); vf.innerHTML = window.VENN.diagram(q.vennFig) + (q.cap ? '<figcaption>' + q.cap + '</figcaption>' : ''); box.appendChild(vf); }
    if (q.figure) { var f = el('div', 'figure'); f.innerHTML = q.figure; box.appendChild(f); }

    var body = el('div', 'q-body');
    box.appendChild(body);

    var fb = el('div', 'fb');
    var sol = el('div', 'sol', '<span class="st">الحل</span>' + (q.sol || ''));

    var btns = el('div', 'btns');
    var checkable = q.type !== 'info';
    var bCheck = null;
    if (checkable) { bCheck = el('button', 'btn primary', '✓ تحقق'); btns.appendChild(bCheck); }
    var bSol = el('button', 'btn solve', '💡 إظهار الحل');
    btns.appendChild(bSol);
    if (checkable) { var bRe = el('button', 'btn ghost', '↺ إعادة'); btns.appendChild(bRe); }

    var api = { q: q, box: box, fb: fb, sol: sol };

    /* --- أنواع الأسئلة --- */
    if (q.type === 'mcq' || q.type === 'tf') {
      var opts = q.type === 'tf' ? ['صح', 'خطأ'] : q.options;
      var wrap = el('div', 'opts');
      opts.forEach(function (o, i) {
        var lab = el('label', 'opt');
        lab.innerHTML = '<input type="radio" name="' + q.id + '"><span class="lbl">' +
          (q.type === 'mcq' && q.letters !== false ? '<b>' + 'ABCD'[i] + '.</b> ' : '') + o + '</span>';
        lab.querySelector('input').value = String(i);
        lab.addEventListener('click', function () {
          wrap.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('sel'); });
          lab.classList.add('sel');
        });
        wrap.appendChild(lab);
      });
      body.appendChild(wrap);
      api.read = function () { var c = wrap.querySelector('input:checked'); return c ? parseInt(c.value, 10) : null; };
      api.grade = function (v) { return v === q.answer; };
      api.mark = function (correct) {
        var labs = wrap.querySelectorAll('.opt');
        labs.forEach(function (l, i) {
          l.classList.remove('good', 'wrong');
          if (i === q.answer) l.classList.add('good');
          else if (l.classList.contains('sel') && !correct) l.classList.add('wrong');
        });
      };
      api.reveal = function () { api.mark(true); };
      api.reset = function () { wrap.querySelectorAll('input').forEach(function (i) { i.checked = false; }); wrap.querySelectorAll('.opt').forEach(function (l) { l.classList.remove('sel', 'good', 'wrong'); }); };
      api.restore = function (v) { if (v == null) return; var ins = wrap.querySelectorAll('input'); if (ins[v]) { ins[v].checked = true; ins[v].closest('.opt').classList.add('sel'); } };

    } else if (q.type === 'fill') {
      // حقول متعددة: q.fields = [{pre, answer, mode, placeholder, rtl}]
      var inputs = [];
      q.fields.forEach(function (f, i) {
        var row = el('div', 'inrow');
        if (f.ltr) { row.style.direction = 'ltr'; row.style.justifyContent = 'flex-start'; }
        if (f.pre) row.appendChild(el('span', 'pre', f.pre));
        var inp;
        if (f.options) {
          inp = el('select', 'ans' + (f.rtl ? ' rtl' : ''));
          inp.style.flex = '0 0 auto';
          inp.style.minWidth = '9rem';
          inp.innerHTML = '<option value="">— اختر —</option>' +
            f.options.map(function (o) { return '<option value="' + o + '">' + o + '</option>'; }).join('');
        } else {
          inp = el('input', 'ans' + (f.rtl ? ' rtl' : ''));
          inp.type = 'text';
          inp.setAttribute('autocomplete', 'off');
          inp.placeholder = f.placeholder || (f.mode === 'set' ? 'مثال: {1,2,3}' : 'اكتب إجابتك');
          inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && bCheck) bCheck.click(); });
        }
        if (f.post) { row.appendChild(inp); row.appendChild(el('span', 'pre', f.post)); }
        else row.appendChild(inp);
        inputs.push(inp);
        body.appendChild(row);
      });
      api.read = function () { return inputs.map(function (i) { return i.value; }); };
      api.grade = function (vals) {
        for (var i = 0; i < q.fields.length; i++) {
          if (!matchOne(vals[i], q.fields[i])) return false;
        }
        return true;
      };
      api.mark = function () {
        inputs.forEach(function (inp, i) {
          var ok = matchOne(inp.value, q.fields[i]);
          inp.style.borderColor = inp.value.trim() === '' ? '' : (ok ? 'var(--ok)' : 'var(--bad)');
        });
      };
      api.reveal = function () {
        inputs.forEach(function (inp, i) {
          inp.value = q.fields[i].show || (Array.isArray(q.fields[i].answer) ? q.fields[i].answer[0] : q.fields[i].answer);
          inp.style.borderColor = 'var(--accent)';
        });
      };
      api.reset = function () { inputs.forEach(function (i) { i.value = ''; i.style.borderColor = ''; }); };
      api.restore = function (v) { if (Array.isArray(v)) inputs.forEach(function (i, k) { i.value = v[k] || ''; }); };

    } else if (q.type === 'shade') {
      // تظليل مناطق مخطط ڤن
      var vw = el('div', 'venn-wrap');
      vw.innerHTML = window.VENN.build(q.venn, q.id);
      body.appendChild(vw);
      body.appendChild(el('div', 'venn-legend', 'اضغط على أي منطقة لتظليلها أو لإلغاء تظليلها.'));
      var picked = {};
      var svg = vw.querySelector('svg');
      function paint() {
        vw.querySelectorAll('.rg').forEach(function (r) {
          r.setAttribute('fill-opacity', picked[r.getAttribute('data-r')] ? '0.72' : '0');
        });
      }
      svg.addEventListener('click', function (ev) {
        var pt = svg.createSVGPoint();
        pt.x = ev.clientX; pt.y = ev.clientY;
        var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
        var k = window.VENN.hit(q.venn, loc.x, loc.y);
        if (!k) return;
        if (picked[k]) delete picked[k]; else picked[k] = 1;
        paint();
      });
      api.read = function () { return Object.keys(picked).sort(); };
      api.grade = function (v) { return v.join('|') === q.answer.slice().sort().join('|'); };
      api.mark = function () { };
      api.reveal = function () { picked = {}; q.answer.forEach(function (k) { picked[k] = 1; }); paint(); };
      api.reset = function () { picked = {}; paint(); };
      api.restore = function (v) { if (Array.isArray(v)) { v.forEach(function (k) { picked[k] = 1; }); paint(); } };

    } else { // info
      api.read = function () { return null; };
      api.grade = function () { return true; };
      api.mark = function () { };
      api.reveal = function () { };
      api.reset = function () { };
      api.restore = function () { };
    }

    body.appendChild(fb);
    body.appendChild(sol);
    box.appendChild(btns);
    host.appendChild(box);

    /* --- الأزرار --- */
    if (bCheck) bCheck.addEventListener('click', function () {
      var v = api.read();
      var empty = (v == null) || (Array.isArray(v) && v.join('') === '');
      if (empty) {
        fb.className = 'fb err show';
        fb.innerHTML = '✋ اختر إجابة أو اكتبها أولاً.';
        return;
      }
      var ok = api.grade(v);
      api.mark(ok);
      fb.className = 'fb show ' + (ok ? 'good' : 'err');
      fb.innerHTML = ok ? '✅ إجابة صحيحة. أحسنت!' : '❌ إجابة غير صحيحة — حاول مرة أخرى، أو اضغط «إظهار الحل».';
      box.classList.remove('ok', 'bad');
      box.classList.add(ok ? 'ok' : 'bad');
      var st = STATE[q.id] || {};
      st.v = v; st.done = 1; st.ok = ok ? 1 : 0;
      STATE[q.id] = st; save(); updateScore();
    });

    bSol.addEventListener('click', function () {
      var open = sol.classList.toggle('show');
      bSol.innerHTML = open ? '🙈 إخفاء الحل' : '💡 إظهار الحل';
      if (open) {
        api.reveal();
        var st = STATE[q.id] || {};
        st.rev = 1;
        if (!st.done) { st.done = 1; st.ok = 0; }
        STATE[q.id] = st; save(); updateScore();
        if (!box.classList.contains('ok')) box.classList.add('bad');
      }
    });

    if (checkable) {
      btns.querySelector('.ghost').addEventListener('click', function () {
        api.reset();
        fb.className = 'fb'; sol.classList.remove('show');
        bSol.innerHTML = '💡 إظهار الحل';
        box.classList.remove('ok', 'bad');
        delete STATE[q.id]; save(); updateScore();
      });
    }

    /* --- استعادة الحالة --- */
    var st0 = STATE[q.id];
    if (st0) {
      if (st0.v != null) { api.restore(st0.v); }
      if (st0.done) {
        if (st0.ok) { api.mark(true); box.classList.add('ok'); fb.className = 'fb show good'; fb.innerHTML = '✅ إجابة صحيحة.'; }
        else if (!st0.rev) { api.mark(false); box.classList.add('bad'); }
      }
      if (st0.rev) { sol.classList.add('show'); bSol.innerHTML = '🙈 إخفاء الحل'; api.reveal(); }
    }

    if (checkable) ALL.push(q.id);
    return api;
  }

  function matchOne(val, f) {
    var mode = f.mode || 'set';
    var answers = Array.isArray(f.answer) ? f.answer : [f.answer];
    var v;
    if (mode === 'set') v = normSet(val);
    else if (mode === 'text') v = normText(val);
    else if (mode === 'sym') v = normSym(val);
    else if (mode === 'num') { v = baseNorm(val); v = /^-?\d+(\.\d+)?$/.test(v) ? String(parseFloat(v)) : v; }
    else v = baseNorm(val);
    for (var i = 0; i < answers.length; i++) {
      var a;
      if (mode === 'set') a = normSet(answers[i]);
      else if (mode === 'text') a = normText(answers[i]);
      else if (mode === 'sym') a = normSym(answers[i]);
      else if (mode === 'num') { a = baseNorm(answers[i]); a = /^-?\d+(\.\d+)?$/.test(a) ? String(parseFloat(a)) : a; }
      else a = baseNorm(answers[i]);
      if (v === a && v !== '') return true;
    }
    return false;
  }

  /* ---------- لوحة النتيجة ---------- */
  function updateScore() {
    var total = ALL.length, done = 0, ok = 0, rev = 0;
    ALL.forEach(function (id) {
      var s = STATE[id];
      if (s && s.done) { done++; if (s.ok) ok++; if (s.rev) rev++; }
    });
    var p = total ? Math.round(ok / total * 100) : 0;
    var host = document.getElementById('scorePanel');
    if (host) {
      host.querySelector('.bar-fill').style.width = p + '%';
      host.querySelector('[data-s=ok]').textContent = ok;
      host.querySelector('[data-s=total]').textContent = total;
      host.querySelector('[data-s=pct]').textContent = p + '%';
      host.querySelector('[data-s=done]').textContent = done;
      host.querySelector('[data-s=rev]').textContent = rev;
    }
    // مجموع عام
    var sum = { total: total, ok: ok, done: done, rev: rev, t: Date.now() };
    LS.set(PFX + 'sum:' + LESSON, JSON.stringify(sum));
  }

  function mountScore() {
    var host = document.getElementById('scorePanel');
    if (!host) return;
    host.className = 'score';
    host.innerHTML =
      '<div class="score-row">' +
      '<b>نتيجتك</b>' +
      '<span class="pill ok">صحيحة: <span data-s="ok">0</span>/<span data-s="total">0</span></span>' +
      '<div class="bar-track"><div class="bar-fill"></div></div>' +
      '<span class="pill" data-s="pct">0%</span>' +
      '<span class="pill">مُجاب: <span data-s="done">0</span></span>' +
      '<span class="pill rev">حلول ظاهرة: <span data-s="rev">0</span></span>' +
      '<button class="btn ghost" id="resetAll">↺ تصفير الدرس</button>' +
      '</div>';
    host.querySelector('#resetAll').addEventListener('click', function () {
      if (!confirm('سيتم مسح إجاباتك في هذا الدرس. متابعة؟')) return;
      STATE = {}; save(); location.reload();
    });
  }

  /* ---------- التشغيل ---------- */
  window.QM = {
    render: function (containerId, questions) {
      var host = document.getElementById(containerId);
      if (!host) return;
      var n = 0;
      questions.forEach(function (q) { if (q.type !== 'heading') n++; buildQuestion(host, q, n); });
    },
    start: function () { mountScore(); updateScore(); },
    LS: LS, PFX: PFX,
    normSet: normSet
  };
})();
