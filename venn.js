/* ============ مولّد مخططات ڤن (SVG) — ثابتة وتفاعلية ============ */
(function () {
  'use strict';
  var uid = 0;

  var LAYOUTS = {
    three: {
      vb: '0 0 440 350', omega: { x: 14, y: 14, w: 412, h: 322 },
      circles: { A: { cx: 168, cy: 148, r: 92 }, B: { cx: 272, cy: 148, r: 92 }, C: { cx: 220, cy: 236, r: 92 } },
      labels: { A: { x: 92, y: 78 }, B: { x: 348, y: 78 }, C: { x: 306, y: 324 } },
      anchors: { A: [122, 118], B: [318, 118], C: [220, 292], AB: [220, 112], AC: [160, 214], BC: [280, 214], ABC: [220, 178], U: [52, 316] },
      regions: ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC', 'U']
    },
    two: {
      vb: '0 0 430 285', omega: { x: 12, y: 12, w: 406, h: 261 },
      circles: { A: { cx: 165, cy: 142, r: 100 }, B: { cx: 265, cy: 142, r: 100 } },
      labels: { A: { x: 74, y: 62 }, B: { x: 356, y: 62 } },
      anchors: { A: [108, 142], B: [322, 142], AB: [215, 142], U: [46, 254] },
      regions: ['A', 'B', 'AB', 'U']
    },
    disjoint: {
      vb: '0 0 430 250', omega: { x: 12, y: 12, w: 406, h: 226 },
      circles: { A: { cx: 128, cy: 125, r: 82 }, B: { cx: 306, cy: 125, r: 82 } },
      labels: { A: { x: 128, y: 30 }, B: { x: 306, y: 30 } },
      anchors: { A: [128, 128], B: [306, 128], AB: [217, 125], U: [46, 222] },
      regions: ['A', 'B', 'U']
    },
    nested: { /* B ⊆ A ⊆ Ω */
      vb: '0 0 430 265', omega: { x: 12, y: 12, w: 406, h: 241 },
      circles: { A: { cx: 218, cy: 130, rx: 122, ry: 88 }, B: { cx: 258, cy: 130, r: 50 } },
      labels: { A: { x: 112, y: 134 }, B: { x: 205, y: 134 } },
      anchors: { A: [150, 130], B: [258, 133], AB: [258, 133], U: [48, 236] },
      regions: ['A', 'AB', 'U']
    }
  };

  function shp(c, extra) {
    if (c.rx != null) return '<ellipse cx="' + c.cx + '" cy="' + c.cy + '" rx="' + c.rx + '" ry="' + c.ry + '" ' + (extra || '') + '/>';
    return '<circle cx="' + c.cx + '" cy="' + c.cy + '" r="' + c.r + '" ' + (extra || '') + '/>';
  }

  // ينشئ عناصر التظليل لمنطقة معينة
  function regionEls(L, key, id, color, opacity, cls, dataAttr) {
    var names = Object.keys(L.circles);
    var inc = key === 'U' ? [] : key.split('');
    var exc = names.filter(function (n) { return inc.indexOf(n) < 0; });
    var o = opacity == null ? 0.72 : opacity;
    var rectFull = '<rect x="0" y="0" width="9999" height="9999" fill="' + color + '"';
    var out = '';
    var maskId = '';
    if (exc.length) {
      maskId = 'mk' + id + key;
      out += '<mask id="' + maskId + '"><rect x="0" y="0" width="9999" height="9999" fill="#fff"/>' +
        exc.map(function (n) { return shp(L.circles[n], 'fill="#000"'); }).join('') + '</mask>';
    }
    var body;
    if (key === 'U') {
      body = '<rect x="' + L.omega.x + '" y="' + L.omega.y + '" width="' + L.omega.w + '" height="' + L.omega.h + '" fill="' + color + '"' +
        (maskId ? ' mask="url(#' + maskId + ')"' : '') + ' fill-opacity="' + o + '" class="' + (cls || '') + '" ' + (dataAttr || '') + '/>';
    } else {
      // تقاطع الدوائر المضمّنة عبر clipPath متداخلة
      var clipIds = [];
      inc.forEach(function (n, i) {
        var cid = 'cp' + id + key + i;
        out += '<clipPath id="' + cid + '"' + (i > 0 ? ' clip-path="url(#' + clipIds[i - 1] + ')"' : '') + '>' +
          shp(L.circles[n]) + '</clipPath>';
        clipIds.push(cid);
      });
      body = '<g clip-path="url(#' + clipIds[clipIds.length - 1] + ')">' +
        rectFull + (maskId ? ' mask="url(#' + maskId + ')"' : '') + ' fill-opacity="' + o + '" class="' + (cls || '') + '" ' + (dataAttr || '') + '/></g>';
    }
    return { defs: out, body: body };
  }

  function outlines(L, names) {
    var s = '';
    Object.keys(L.circles).forEach(function (n) {
      s += shp(L.circles[n], 'fill="none" stroke="var(--set' + n + ')" stroke-width="2.2"');
    });
    Object.keys(L.labels).forEach(function (n) {
      var p = L.labels[n];
      var nm = (names && names[n]) ? names[n] : n;
      s += '<text x="' + p.x + '" y="' + p.y + '" fill="var(--set' + n + ')" font-size="19" font-style="italic" font-family="Cambria Math,Times New Roman,serif" text-anchor="middle">' + nm + '</text>';
    });
    return s;
  }

  function placeItems(L, items) {
    var byR = {};
    items.forEach(function (it) { (byR[it.r] = byR[it.r] || []).push(it); });
    var s = '';
    Object.keys(byR).forEach(function (r) {
      var arr = byR[r], a = L.anchors[r] || [220, 175];
      var n = arr.length;
      var cols = n <= 3 ? n : Math.ceil(n / 2);
      var rows = Math.ceil(n / cols);
      var gx = 26, gy = 24;
      arr.forEach(function (it, i) {
        var cx = i % cols, cy = Math.floor(i / cols);
        var x = (it.x != null) ? it.x : a[0] + (cx - (cols - 1) / 2) * gx;
        var y = (it.y != null) ? it.y : a[1] + (cy - (rows - 1) / 2) * gy;
        s += '<text x="' + x + '" y="' + y + '" fill="var(--fg)" font-size="16" font-family="Cambria Math,Times New Roman,serif" font-style="' + (/^[a-zA-Z]$/.test(it.t) ? 'italic' : 'normal') + '" text-anchor="middle" dominant-baseline="middle">' + it.t + '</text>';
      });
    });
    return s;
  }

  function diagram(spec) {
    var L = LAYOUTS[spec.layout || 'two'];
    var id = 'v' + (++uid);
    var defs = '', body = '';
    (spec.shade || []).forEach(function (k) {
      var r = regionEls(L, k, id, spec.color || 'var(--vennFill)', spec.opacity, '', '');
      defs += r.defs; body += r.body;
    });
    var om = spec.omega === false ? '' :
      '<rect x="' + L.omega.x + '" y="' + L.omega.y + '" width="' + L.omega.w + '" height="' + L.omega.h + '" fill="none" stroke="var(--fg2)" stroke-width="1.6"/>' +
      '<text x="' + (L.omega.x + 16) + '" y="' + (L.omega.y + 24) + '" fill="var(--fg2)" font-size="17" font-family="Cambria Math,serif">Ω</text>';
    var w = spec.width || 420;
    return '<svg class="svgbox" viewBox="' + L.vb + '" style="width:100%;max-width:' + w + 'px" role="img">' +
      '<defs>' + defs + '</defs>' + body + om + outlines(L, spec.names) + placeItems(L, spec.items || []) + (spec.extra || '') + '</svg>';
  }

  // نسخة تفاعلية: كل المناطق قابلة للنقر
  function build(layoutName, qid) {
    var L = LAYOUTS[layoutName];
    var id = 'iv' + (++uid);
    var defs = '', body = '';
    L.regions.forEach(function (k) {
      var r = regionEls(L, k, id, 'var(--vennFill)', 0, 'rg', 'data-r="' + k + '" fill-opacity="0"');
      defs += r.defs; body += r.body;
    });
    var om = '<rect x="' + L.omega.x + '" y="' + L.omega.y + '" width="' + L.omega.w + '" height="' + L.omega.h + '" fill="none" stroke="var(--fg2)" stroke-width="1.6"/>' +
      '<text x="' + (L.omega.x + 16) + '" y="' + (L.omega.y + 24) + '" fill="var(--fg2)" font-size="17" font-family="Cambria Math,serif">Ω</text>';
    var vbp = L.vb.split(' ');
    return '<svg class="svgbox vsvg" data-layout="' + layoutName + '" viewBox="' + L.vb + '" style="width:100%;max-width:420px">' +
      '<defs>' + defs + '</defs>' + body + om + outlines(L) +
      '<rect class="hitlayer" x="0" y="0" width="' + vbp[2] + '" height="' + vbp[3] + '" fill="transparent" style="cursor:pointer"/>' +
      '</svg>';
  }

  function inside(c, x, y) {
    if (c.rx != null) {
      var dx = (x - c.cx) / c.rx, dy = (y - c.cy) / c.ry;
      return dx * dx + dy * dy <= 1;
    }
    var a = x - c.cx, b = y - c.cy;
    return a * a + b * b <= c.r * c.r;
  }

  // يحدد مفتاح المنطقة من إحداثيات نقطة داخل نظام viewBox
  function hit(layoutName, x, y) {
    var L = LAYOUTS[layoutName];
    if (x < L.omega.x || x > L.omega.x + L.omega.w || y < L.omega.y || y > L.omega.y + L.omega.h) return null;
    var k = '';
    Object.keys(L.circles).forEach(function (n) { if (inside(L.circles[n], x, y)) k += n; });
    if (k === '') return 'U';
    return L.regions.indexOf(k) >= 0 ? k : null;
  }

  window.VENN = { diagram: diagram, build: build, hit: hit, layouts: LAYOUTS };

  // ترطيب المخططات الثابتة المكتوبة عبر data-venn
  function hydrate(root) {
    (root || document).querySelectorAll('[data-venn]').forEach(function (n) {
      if (n.getAttribute('data-done')) return;
      try {
        var spec = JSON.parse(n.getAttribute('data-venn'));
        var cap = n.getAttribute('data-cap');
        n.innerHTML = diagram(spec) + (cap ? '<figcaption>' + cap + '</figcaption>' : '');
        n.setAttribute('data-done', '1');
      } catch (e) { }
    });
  }
  window.VENN.hydrate = hydrate;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hydrate(); });
  else hydrate();
})();
