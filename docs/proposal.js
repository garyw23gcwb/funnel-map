/* ------------------------------------------------------------------
   The proposal map. Same board, wires and pop-ups as the client map
   (app.js), but everything, geometry included, comes from one file per
   prospect in docs/proposals/<slug>.json. A prospect's funnel has its own
   shape, so it cannot share the client catalogue; and there are no links
   to open, because nothing is built yet. Cards open pop-ups instead.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var BOARD_W = 1400, BOARD_H = 1400, MIN_SCALE = 0.62;
  var NODE = {};

  function $(id) { return document.getElementById(id); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function pos(x, y, w, h) { return 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;'; }

  /* --------------------------- wires --------------------------- */

  function anchor(spec) {
    var at = spec.split('@');
    var bits = at[0].split(':');
    var n = NODE[bits[0]], side = bits[1];
    if (!n) { console.warn('proposal: unknown node in edge anchor "' + spec + '"'); return null; }
    var f = at.length > 1 ? parseFloat(at[1]) : 0.5;
    var px = at.length > 1 && at[1].charAt(0) === '+';
    var along = function (span) { return px ? f : span * f; };
    if (side === 't') return [n.x + along(n.w), n.y];
    if (side === 'b') return [n.x + along(n.w), n.y + n.h];
    if (side === 'l') return [n.x, n.y + along(n.h)];
    return [n.x + n.w, n.y + along(n.h)];
  }
  function len(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function unit(a, b) {
    var d = len(a, b) || 1;
    return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  }
  function routePath(pts, gap) {
    pts = pts.slice();
    var n = pts.length;
    if (gap) {
      var u = unit(pts[n - 2], pts[n - 1]);
      pts[n - 1] = [pts[n - 1][0] - u[0] * gap, pts[n - 1][1] - u[1] * gap];
    }
    var d = 'M' + r1(pts[0][0]) + ',' + r1(pts[0][1]);
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i], a = pts[i - 1], b = pts[i + 1];
      var u1 = unit(a, p), u2 = unit(p, b);
      var rr = Math.min(18, len(a, p) / 2, len(p, b) / 2);
      d += ' L' + r1(p[0] - u1[0] * rr) + ',' + r1(p[1] - u1[1] * rr);
      d += ' Q' + r1(p[0]) + ',' + r1(p[1]) + ' ' + r1(p[0] + u2[0] * rr) + ',' + r1(p[1] + u2[1] * rr);
    }
    var last = pts[pts.length - 1];
    return d + ' L' + r1(last[0]) + ',' + r1(last[1]);
  }

  /* --------------------------- render --------------------------- */

  function render(cfg, noticeText) {
    cfg.nodes = cfg.nodes || [];
    cfg.edges = cfg.edges || [];
    cfg.layers = cfg.layers || [];
    cfg.groups = cfg.groups || [];
    cfg.sublabels = cfg.sublabels || [];
    cfg.nodes.forEach(function (n) { NODE[n.id] = n; });

    document.title = (cfg.client || 'Funnel') + ' | Funnel Proposal';
    $('hClient').textContent = cfg.client || 'Funnel Proposal';
    $('hBook').textContent = cfg.book || '';
    $('hSub').textContent = cfg.sub || '';
    $('mKicker').textContent = cfg.kicker || 'Funnel proposal';
    if (cfg.prepared) {
      var d = el('span'); d.textContent = 'Prepared ' + cfg.prepared; $('metarow').appendChild(d);
    }
    var by = el('span'); by.textContent = 'Get Clients With Books'; $('metarow').appendChild(by);

    (cfg.legend || []).forEach(function (L) {
      var s = el('span');
      var i = el('i', 'dot ' + L.status);
      s.appendChild(i);
      s.appendChild(document.createTextNode(' ' + L.label));
      $('legend').appendChild(s);
    });

    if (noticeText) {
      $('notice').textContent = noticeText;
      $('notice').classList.add('on');
    }

    var board = $('board');

    /* Board height from what is actually on it. */
    var lowest = 0;
    cfg.nodes.forEach(function (n) { lowest = Math.max(lowest, n.y + n.h); });
    cfg.groups.forEach(function (g) { lowest = Math.max(lowest, g.y + g.h); });
    BOARD_H = lowest + 44;

    cfg.groups.forEach(function (g) {
      var d = el('div', 'group');
      d.style.cssText = pos(g.x, g.y, g.w, g.h);
      board.appendChild(d);
    });

    var wg = $('wiregroup'), NS = 'http://www.w3.org/2000/svg';
    cfg.edges.forEach(function (e) {
      var a = anchor(e.a), b = anchor(e.b);
      if (!a || !b) return;
      var pts = [a].concat(e.via || []).concat([b]);
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', routePath(pts, e.arrow === false ? 0 : 5));
      if (e.dashed) p.setAttribute('class', 'dashed');
      if (e.arrow !== false) p.setAttribute('marker-end', 'url(#ah)');
      wg.appendChild(p);
      if (e.label) {
        var l = el('div', 'wirelabel' + (e.vert ? ' vert' : ''));
        l.style.left = e.lx + 'px';
        l.style.top = e.ly + 'px';
        l.textContent = e.label;
        board.appendChild(l);
      }
    });

    cfg.layers.forEach(function (L) {
      if (L.lx == null) return;
      var t = el('div', 'titlebox');
      t.style.left = L.lx + 'px';
      t.style.top = L.ly + 'px';
      t.textContent = L.title;
      board.appendChild(t);
    });
    cfg.sublabels.forEach(function (s) {
      var d = el('div', 'sublabel');
      d.style.left = s.x + 'px';
      d.style.top = s.y + 'px';
      d.textContent = s.text;
      board.appendChild(d);
    });

    cfg.nodes.forEach(function (n) {
      var card = buildCard(n, 'card');
      card.style.cssText += pos(n.x, n.y, n.w, n.h);
      if (n.tilt === 1) card.className += ' tilt';
      if (n.tilt === 2) card.className += ' tilt2';
      board.appendChild(card);

      if (n.slots) {
        var sb = el('div', 'slots');
        sb.style.cssText = pos(n.slots.x, n.slots.y, n.slots.w, n.slots.h);
        n.slots.items.forEach(function (it) { sb.appendChild(slotEl(it)); });
        board.appendChild(sb);
      }
      if (n.chips) {
        var cb = el('div', n.chips.items.some(function (c) { return c.label; }) ? 'slots' : 'chips');
        cb.style.cssText = pos(n.chips.x, n.chips.y, n.chips.w, n.chips.h);
        n.chips.items.forEach(function (c, i) { cb.appendChild(chipEl(n, c, i)); });
        board.appendChild(cb);
      }
    });

    $('board').style.width = BOARD_W + 'px';
    $('board').style.height = BOARD_H + 'px';
    $('wires').setAttribute('viewBox', '0 0 ' + BOARD_W + ' ' + BOARD_H);

    buildStack(cfg);
    buildSections(cfg);
    $('foot').textContent = cfg.footer || '';
    fitBoard();
  }

  function slotEl(it) {
    var sl = el('span', 'slot' + (it.status ? ' ' + it.status : ''));
    sl.textContent = it.label;
    if (it.title) sl.title = it.title;
    return sl;
  }

  /* A chip is a pop-up button: numbered (a module, an email) or labelled
     (an ad hook). Both keep their place in the node's set for prev/next. */
  function chipEl(n, c, i) {
    var b = el('button', c.label ? 'slot' : 'chip');
    b.type = 'button';
    b.textContent = c.label || c.n;
    var title = (c.popup && c.popup.title) || c.label || ('' + c.n);
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', function () { openChip(n, i); });
    return b;
  }

  function buildCard(n, cls) {
    var isPop = !!n.popup;
    var card = el(isPop ? 'button' : 'div',
                  cls + ' ' + (n.status || '') + ((n.slots || n.chips) && cls === 'card' ? ' hasslots' : ''));
    if (isPop) {
      card.type = 'button';
      card.addEventListener('click', function () { openInline(n.popup, null); });
    }
    var lab = el('span', 'clabel');
    lab.textContent = n.label;
    card.appendChild(lab);
    if (!n.terse || cls === 'scard') {
      var job = el('span', 'cjob');
      job.textContent = n.job || '';
      card.appendChild(job);
    }
    if (isPop && (cls === 'scard' || n.terse || n.h > 100)) {
      var meta = el('span', 'cmeta');
      meta.textContent = n.cta || 'See the detail';
      card.appendChild(meta);
    }
    return card;
  }

  function buildStack(cfg) {
    var stack = $('stack');
    cfg.layers.forEach(function (L) {
      var members = cfg.nodes.filter(function (n) { return n.layer === L.id; });
      if (!members.length) return;
      var sec = el('section', 'slayer');
      var h = el('h2', 'stitle');
      h.textContent = L.title;
      sec.appendChild(h);
      members.forEach(function (n) {
        sec.appendChild(buildCard(n, 'scard'));
        if (n.slots || n.chips) {
          var row = el('div', 'schips');
          if (n.slots) n.slots.items.forEach(function (it) { row.appendChild(slotEl(it)); });
          if (n.chips) n.chips.items.forEach(function (c, i) {
            var b = chipEl(n, c, i);
            b.className = 'slot';
            b.textContent = c.label || (c.popup && c.popup.title ? c.n + '. ' + c.popup.title : c.n);
            row.appendChild(b);
          });
          sec.appendChild(row);
        }
      });
      stack.appendChild(sec);
    });
  }

  /* --------------------------- sections --------------------------- */

  function section(kick, title, sub) {
    var s = el('section', 'sec');
    var k = el('p', 'seckick'); k.textContent = kick; s.appendChild(k);
    var h = el('h2', 'sech2'); h.textContent = title; s.appendChild(h);
    if (sub) { var p = el('p', 'secsub'); p.textContent = sub; s.appendChild(p); }
    return s;
  }

  function table(spec, opts) {
    opts = opts || {};
    var wrap = el('div', 'tablewrap');
    var t = el('table');
    var thead = el('thead'), tr = el('tr');
    spec.columns.forEach(function (c, i) {
      var th = el('th');
      th.textContent = c;
      if (opts.numeric && i > 0) th.className = 'num';
      if (opts.hi === i) th.className += ' hi';
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    t.appendChild(thead);
    var tb = el('tbody');
    function row(cells, cls) {
      var r = el('tr', cls || '');
      cells.forEach(function (c, i) {
        var td = el('td');
        td.textContent = c;
        if (i === 0) td.className = 'first';
        if (opts.numeric && i > 0) td.className = 'num';
        if (opts.hi === i) td.className += ' hi';
        r.appendChild(td);
      });
      tb.appendChild(r);
    }
    spec.rows.forEach(function (r) { row(r); });
    if (spec.total) row(spec.total, 'total');
    if (spec.cpa) row(spec.cpa, 'cpa');
    t.appendChild(tb);
    wrap.appendChild(t);
    return wrap;
  }

  function buildSections(cfg) {
    var out = $('sections');

    if (cfg.offers && cfg.offers.length) {
      var s = section('The offer stack', 'Five things a reader can say yes to',
        'One book, one bump, one pack, one downsell for the reader who declines the pack, and the review that turns a finished workbook into an engagement.');
      var grid = el('div', 'offers');
      cfg.offers.forEach(function (o) {
        var c = el('div', 'ocard ' + (o.status || ''));
        var tag = el('div', 'otag'); tag.textContent = o.tag || ''; c.appendChild(tag);
        var nm = el('div', 'oname'); nm.textContent = o.name; c.appendChild(nm);
        var pr = el('div', 'oprice'); pr.textContent = o.price || '';
        if (o.price2) { var p2 = el('small'); p2.textContent = o.price2; pr.appendChild(p2); }
        c.appendChild(pr);
        if (o.branch) { var br = el('span', 'obranch'); br.textContent = o.branch; c.appendChild(br); }
        var ul = el('ul', 'olist');
        (o.included || []).forEach(function (t) { var li = el('li'); li.textContent = t; ul.appendChild(li); });
        c.appendChild(ul);
        if (o.problem) { var pb = el('div', 'oprob'); pb.textContent = o.problem; c.appendChild(pb); }
        grid.appendChild(c);
      });
      s.appendChild(grid);
      out.appendChild(s);
    }

    if (cfg.routing) {
      var r = section('Archetype routing', 'The quiz decides who takes the call',
        'The archetype tag chooses the nurture branch, the service line it closes on, and the practitioner who reviews the completed RACI.');
      r.appendChild(table(cfg.routing));
      out.appendChild(r);
    }

    if (cfg.economics) {
      var ec = cfg.economics;
      var e = section('The economics', 'What a book sale is worth');
      if (ec.quote) { var q = el('blockquote', 'quote'); q.textContent = ec.quote; e.appendChild(q); }
      [ec.aov, ec.monthly].forEach(function (spec) {
        if (!spec) return;
        var box = el('div', 'econ');
        if (spec.title) { var tt = el('p', 'ttitle'); tt.textContent = spec.title; box.appendChild(tt); }
        box.appendChild(table(spec, { numeric: true, hi: 2 }));
        if (spec.note) { var nt = el('p', 'tsub'); nt.textContent = spec.note; box.appendChild(nt); }
        e.appendChild(box);
      });
      if (ec.notes && ec.notes.length) {
        var ns = el('div', 'notes');
        ec.notes.forEach(function (t) { var p = el('p'); p.textContent = t; ns.appendChild(p); });
        e.appendChild(ns);
      }
      out.appendChild(e);
    }

    if (cfg.assets) {
      var a = section('What already exists', 'Package and wire, not build',
        'Most of the funnel is assets you already have. This is the inventory and where each one goes.');
      var det = el('details');
      var sum = el('summary'); sum.textContent = 'Asset inventory, ' + cfg.assets.rows.length + ' items'; det.appendChild(sum);
      det.appendChild(table(cfg.assets));
      a.appendChild(det);
      out.appendChild(a);
    }
  }

  /* --------------------------- pop-up --------------------------- */

  var lastFocus = null, chipNode = null, chipIdx = -1;

  function showVeil() {
    var veil = $('veil');
    if (veil.classList.contains('on')) return;
    lastFocus = document.activeElement;
    veil.hidden = false;
    veil.classList.add('on');
    document.body.style.overflow = 'hidden';
    $('mclose').focus();
  }
  function closePop() {
    var veil = $('veil');
    veil.classList.remove('on');
    veil.hidden = true;
    document.body.style.overflow = '';
    chipNode = null; chipIdx = -1;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openChip(n, i) {
    chipNode = n; chipIdx = i;
    openInline(n.chips.items[i].popup, popNav());
  }

  function popNav() {
    var nav = el('div', 'mnav');
    var prev = el('button'), next = el('button');
    prev.type = next.type = 'button';
    prev.textContent = '← Previous';
    next.textContent = 'Next →';
    var max = chipNode.chips.items.length;
    prev.disabled = chipIdx <= 0;
    next.disabled = chipIdx >= max - 1;
    prev.addEventListener('click', function () { openChip(chipNode, chipIdx - 1); });
    next.addEventListener('click', function () { openChip(chipNode, chipIdx + 1); });
    nav.appendChild(prev);
    nav.appendChild(next);
    return nav;
  }

  /* Built as nodes, never innerHTML, so the copy can never inject markup. */
  function openInline(pop, nav) {
    if (!pop) return;
    showVeil();
    var c = $('mcontent');
    c.textContent = '';

    var head = el('div', 'mhead');
    if (pop.kicker) { var k = el('div', 'mkicker'); k.textContent = pop.kicker; head.appendChild(k); }
    var t = el('div', 'mtitle'); t.id = 'mtitle'; t.textContent = pop.title || ''; head.appendChild(t);
    if (pop.price || pop.was) {
      var pr = el('div', 'mprice');
      var now = el('b'); now.textContent = pop.price || ''; pr.appendChild(now);
      if (pop.was) { var w = el('s'); w.textContent = pop.was; pr.appendChild(w); }
      if (pop.note) { var nn = el('span'); nn.textContent = pop.note; pr.appendChild(nn); }
      head.appendChild(pr);
    }
    c.appendChild(head);

    if (pop.check) {
      var row = el('div', 'mcheck');
      var box = el('span', 'mtick');
      box.textContent = '✓';
      row.appendChild(box);
      var lab = el('span');
      lab.textContent = pop.check;
      row.appendChild(lab);
      c.appendChild(row);
    }

    var body = el('div', 'mbody');
    (pop.body || []).forEach(function (txt) { var p = el('p'); p.textContent = txt; body.appendChild(p); });
    c.appendChild(body);

    if (pop.cta || pop.footnote) {
      var foot = el('div', 'mfoot');
      var txt = el('div', 'txt');
      if (pop.footnote) { var d = el('div', 'mdesc'); d.textContent = pop.footnote; txt.appendChild(d); }
      foot.appendChild(txt);
      if (pop.cta) { var b = el('div', 'mcta'); b.textContent = pop.cta; foot.appendChild(b); }
      c.appendChild(foot);
    }
    if (nav) c.appendChild(nav);
  }

  $('mclose').addEventListener('click', closePop);
  $('veil').addEventListener('click', function (ev) { if (ev.target === $('veil')) closePop(); });
  document.addEventListener('keydown', function (ev) {
    if (!$('veil').classList.contains('on')) return;
    if (ev.key === 'Escape') { closePop(); return; }
    if (!chipNode) return;
    var max = chipNode.chips.items.length;
    if (ev.key === 'ArrowRight' && chipIdx < max - 1) { openChip(chipNode, chipIdx + 1); }
    else if (ev.key === 'ArrowLeft' && chipIdx > 0) { openChip(chipNode, chipIdx - 1); }
  });

  /* --------------------------- fit --------------------------- */

  function scaleTo(s) {
    $('board').style.transform = 'scale(' + s + ')';
    $('stage').style.width = (BOARD_W * s) + 'px';
    $('stage').style.height = (BOARD_H * s) + 'px';
  }
  function fitBoard() {
    var avail = document.querySelector('.shell').clientWidth;
    scaleTo(Math.min(1, Math.max(MIN_SCALE, avail / BOARD_W)));
  }
  window.addEventListener('resize', fitBoard);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitBoard); }

  var PRINT_W = 1020;
  window.addEventListener('beforeprint', function () { scaleTo(PRINT_W / BOARD_W); });
  window.addEventListener('afterprint', fitBoard);

  /* --------------------------- boot --------------------------- */

  var params = new URLSearchParams(location.search);
  var raw = (params.get('c') || '').toLowerCase();
  var slug = /^[a-z0-9-]{1,64}$/.test(raw) ? raw : '';

  if (!slug) {
    render({ client: 'Funnel Proposal' }, 'No prospect given. Add ?c=<slug> to the address.');
  } else {
    fetch('proposals/' + slug + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (cfg) { render(cfg); })
      .catch(function () { render({ client: 'Funnel Proposal' }, 'No proposal found for "' + slug + '".'); });
  }

  if (window.parent !== window) {
    var lastH = 0;
    var reportHeight = function () {
      var h = Math.ceil(document.body.getBoundingClientRect().height);
      if (h !== lastH) {
        lastH = h;
        window.parent.postMessage({ type: 'bfmap:height', height: h }, '*');
      }
    };
    window.addEventListener('resize', reportHeight);
    window.addEventListener('load', reportHeight);
    if (window.ResizeObserver) { new ResizeObserver(reportHeight).observe(document.documentElement); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(reportHeight); }
    reportHeight();
  }
})();
