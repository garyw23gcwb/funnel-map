(function () {
  'use strict';

  var C = window.FUNNEL_CATALOGUE;
  /* Matches the 999px breakpoint below which the board is swapped for the
     stacked list, so the board never renders smaller than this. */
  /* BOARD_H is worked out per client in render(), from the nodes shown. */
  var BOARD_W = C.BOARD_W, BOARD_H = 1200, MIN_SCALE = 0.62;
  var LAYERS = C.LAYERS, NODES = C.NODES, GROUPS = C.GROUPS;
  var SUBLABELS = C.SUBLABELS, CHIPS = C.CHIPS, AD_CHIPS = C.AD_CHIPS, EDGES = C.EDGES;

  /* --------------------------- helpers --------------------------- */

  /* Clearance between the last card in a group and the frame around it, on
     every side, so a group holding one column looks as deliberate as one
     holding three. */
  var GROUP_PAD = 32;

  var NODE = {};
  NODES.forEach(function (n) {
    NODE[n.id] = n;
    /* Keep the declared size: a card with a compact fallback is switched
       between the two at render, once the client file is known. */
    if (n.compact) n.full = { w: n.w, h: n.h };
  });

  function $(id) { return document.getElementById(id); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function r1(v) { return Math.round(v * 10) / 10; }

  function anchor(spec) {
    var at = spec.split('@');
    var bits = at[0].split(':');
    var n = NODE[bits[0]], side = bits[1];
    /* A fraction along the side, or, written "+145", that many pixels from
       the start of it: a fixed offset holds its place on a card whose size
       depends on what the client has to put in it. */
    var f = at.length > 1 ? parseFloat(at[1]) : 0.5;
    var px = at.length > 1 && at[1].charAt(0) === '+';
    var along = function (span) { return px ? f : span * f; };
    if (side === 't') return [n.x + along(n.w), n.y];
    if (side === 'b') return [n.x + along(n.w), n.y + n.h];
    if (side === 'l') return [n.x, n.y + along(n.h)];
    return [n.x + n.w, n.y + along(n.h)];
  }
  function edgeNodeIds(e) {
    return [e.a.split('@')[0].split(':')[0], e.b.split('@')[0].split(':')[0]];
  }

  /* The frame drawn around a group of side funnels, shrunk to the cards this
     client actually has. A client running one two-step funnel got the full
     three-column, three-row box with most of it empty; it now closes up to
     the same clearance on every side. */
  function groupBox(g, members) {
    var edge = function (f) { return Math.max.apply(null, members.map(f)); };
    return {
      w: Math.min(g.w, edge(function (n) { return n.x + n.w; }) + GROUP_PAD - g.x),
      h: Math.min(g.h, edge(function (n) { return n.y + n.h; }) + GROUP_PAD - g.y)
    };
  }

  function len(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function unit(a, b) {
    var d = len(a, b) || 1;
    return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  }

  /* Polyline with rounded corners. The last point is pulled back a few
     pixels so the arrowhead sits just off the card edge rather than on it. */
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

  /* --------------------------- config --------------------------- */

  function decodeInline(s) {
    try {
      var bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (err) { return null; }
  }

  var EMPTY = { client: '', book: '', nodes: {}, emails: [] };

  function normalise(cfg) {
    cfg = cfg || {};
    cfg.nodes = cfg.nodes || {};
    cfg.emails = cfg.emails || [];
    return cfg;
  }

  function stateOf(cfg, id) {
    var c = cfg.nodes[id];
    /* Nodes marked optional stay hidden unless a client file mentions them,
       so adding one does not put a phantom "still to come" box on every
       existing client's map. Everything else defaults to still-to-come. */
    if (!c) return NODE[id].optional ? null : { status: 'soon', url: '' };
    if (c.off) return null;
    var url = (c.url || '').trim();
    /* A declared status is honoured even with no link, for pieces that are
       real but have nothing to open: "theirs" for what the client runs
       themselves, and "live" for a box whose links live inside it, like the
       ads card holding its ten concepts. Anything undeclared is still to come. */
    if (!url) {
      var declared = c.status === 'theirs' || c.status === 'live' || c.status === 'review';
      return { status: declared ? c.status : 'soon', url: '', label: c.label, job: c.job, cta: c.cta, popup: c.popup };
    }
    return { status: c.status === 'review' ? 'review' : 'live', url: url, label: c.label, job: c.job, cta: c.cta, popup: c.popup };
  }

  /* --------------------------- render --------------------------- */

  function render(cfg, noticeText) {
    cfg = normalise(cfg);

    var title = cfg.client ? cfg.client : 'Funnel Ecosystem Map';
    document.title = cfg.client ? cfg.client + ' | Funnel Ecosystem Map' : 'Funnel Ecosystem Map';
    $('hClient').textContent = title;

    $('hBook').textContent = cfg.book || '';
    $('hSub').textContent =
      'Everything built for this funnel, and how each piece feeds the next. Click any live box to open it.';

    if (noticeText) {
      $('notice').textContent = noticeText;
      $('notice').classList.add('on');
    }

    var board = $('board');
    var shown = {};

    NODES.forEach(function (n) {
      var st = stateOf(cfg, n.id);
      if (st) shown[n.id] = st;
    });

    /* A card sized around what it holds shrinks back when this client has
       nothing to put in it: the ads card is only 560 wide because of its ten
       chips, and without them it was a wide empty rectangle. Done before
       anything is measured or drawn, so the wires follow it. */
    NODES.forEach(function (n) {
      if (!n.compact) return;
      var size = (!n.holds || cfg[n.holds]) ? n.full : n.compact;
      n.w = size.w;
      n.h = size.h;
    });

    /* Size the board to what this client actually has, so switching whole
       sections off shortens the page instead of leaving empty space. */
    var lowest = 0;
    NODES.forEach(function (n) { if (shown[n.id]) lowest = Math.max(lowest, n.y + n.h); });
    if (shown['email-sequence']) lowest = Math.max(lowest, CHIPS.y + CHIPS.h);
    GROUPS.forEach(function (g) {
      var members = NODES.filter(function (n) { return n.layer === g.id && shown[n.id]; });
      if (members.length < 2) return;
      /* Use the height the box will actually be drawn at, not its declared
         maximum, or a client using a short column gets dead board below. */
      lowest = Math.max(lowest, g.y + groupBox(g, members).h);
    });
    BOARD_H = lowest + 44;


    var states = {};
    Object.keys(shown).forEach(function (id) { states[shown[id].status] = true; });
    [].forEach.call($('legend').children, function (sp) {
      sp.classList.toggle('on', !!states[sp.getAttribute('data-state')]);
    });

    /* group boxes, drawn first so wires and cards sit on top */
    /* A group holding a single card needs no wrapper, no band title and no
       sub-heading: the card's own label says what it is, and the chrome
       would only repeat it. */
    var solo = {};
    GROUPS.forEach(function (g) {
      var members = NODES.filter(function (n) { return n.layer === g.id && shown[n.id]; });
      if (members.length < 2) { solo[g.id] = members.length === 1; return; }
      var box = groupBox(g, members);
      var d = el('div', 'group');
      d.style.cssText = pos(g.x, g.y, box.w, box.h);
      board.appendChild(d);
    });

    /* wires */
    var wg = $('wiregroup'), NS = 'http://www.w3.org/2000/svg';
    EDGES.forEach(function (e) {
      var ids = edgeNodeIds(e);
      if (!shown[ids[0]] || !shown[ids[1]]) return;
      var pts = [anchor(e.a)].concat(e.via || []).concat([anchor(e.b)]);
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

    /* layer titles */
    /* Only layers with a title position (the side-funnel block) get one. */
    LAYERS.forEach(function (L) {
      if (L.lx == null || solo[L.id]) return;
      var any = NODES.some(function (n) { return n.layer === L.id && shown[n.id]; });
      if (!any) return;
      var t = el('div', 'titlebox');
      t.style.left = L.lx + 'px';
      t.style.top = L.ly + 'px';
      t.textContent = L.title;
      board.appendChild(t);
    });

    SUBLABELS.forEach(function (s) {
      if (!s.needs.some(function (id) { return shown[id]; })) return;
      if (s.needs.some(function (id) { return NODE[id] && solo[NODE[id].layer]; })) return;
      var d = el('div', 'sublabel');
      d.style.left = s.x + 'px';
      d.style.top = s.y + 'px';
      d.textContent = s.text;
      board.appendChild(d);
    });

    /* cards */
    NODES.forEach(function (n) {
      var st = shown[n.id];
      if (!st) return;
      var card = buildCard(n, st, 'card');
      card.style.cssText += pos(n.x, n.y, n.w, n.h);
      if (n.tilt === 1) card.className += ' tilt';
      if (n.tilt === 2) card.className += ' tilt2';
      board.appendChild(card);
    });

    /* email chips */
    if (shown['email-sequence']) {
      var box = el('div', 'chips');
      box.style.cssText = pos(CHIPS.x, CHIPS.y, CHIPS.w, CHIPS.h);
      var byN = {};
      cfg.emails.forEach(function (e) { if (e && e.n) byN[e.n] = e; });
      for (var i = 1; i <= CHIPS.count; i++) {
        var e = byN[i] || {};
        var url = (e.url || '').trim();
        var title = 'Email ' + i + (e.day != null ? ', day ' + e.day : '');
        var c;
        if (url) {
          c = el('a', 'chip');
          c.href = url; c.target = '_blank'; c.rel = 'noopener';
          c.textContent = i;
          c.title = title;
        } else if (cfg.emailPages) {
          /* No explicit link, but the copy is loaded: open the pop-up. */
          c = popChip('email', i, title);
        } else {
          c = el('span', 'chip');
          c.textContent = i;
          c.title = title;
        }
        box.appendChild(c);
      }
      board.appendChild(box);
    }

    /* file slots inside their container */
    NODES.forEach(function (n) {
      if (!n.slots || !shown[n.id]) return;
      var box = el('div', 'slots');
      box.style.cssText = pos(n.slots.x, n.slots.y, n.slots.w, n.slots.h);
      n.slots.items.forEach(function (it) {
        var c = cfg.nodes[it.id] || {};
        if (c.off) return;
        var url = (c.url || '').trim();
        var sl = el(url ? 'a' : 'span', 'slot' + (url ? '' : ' soon'));
        if (url) { sl.href = url; sl.target = '_blank'; sl.rel = 'noopener'; }
        sl.textContent = c.label || it.label;
        sl.title = (it.title || it.label) + (url ? '' : ' — still to come');
        box.appendChild(sl);
      });
      board.appendChild(box);
    });

    /* ten ad concepts, each opening the pop-up */
    if (shown['ads'] && cfg.adPages) {
      var ab = el('div', 'chips');
      ab.style.cssText = pos(AD_CHIPS.x, AD_CHIPS.y, AD_CHIPS.w, AD_CHIPS.h);
      for (var a = 1; a <= AD_CHIPS.count; a++) {
        ab.appendChild(popChip('ad', a, 'Ad concept ' + a));
      }
      board.appendChild(ab);
    }

    /* The catalogue is authoritative for board size. */
    $('board').style.width = BOARD_W + 'px';
    $('board').style.height = BOARD_H + 'px';
    $('wires').setAttribute('viewBox', '0 0 ' + BOARD_W + ' ' + BOARD_H);

    /* Warm the pop-up data now, so the first chip click is instant instead
       of waiting on a cold fetch. Failures are retried on click. */
    if (cfg.adPages && shown['ads']) {
      load('ad').then(function (data) {
        /* Fetch the creative quietly once the map is up, a few at a time, so
           the first pop-up is instant instead of waiting on a cold image. */
        var queue = [];
        (data.ads || []).forEach(function (a) {
          if (a.feed) queue.push(a.feed);
          if (a.story) queue.push(a.story);
        });
        var at = 0;
        function next() {
          if (at >= queue.length) return;
          var im = new Image();
          im.onload = im.onerror = next;
          im.src = queue[at++];
        }
        for (var lane = 0; lane < 3; lane++) { next(); }
      }).catch(function () {});
    }
    if (cfg.emailPages && shown['email-sequence']) { load('email').catch(function () {}); }

    buildStack(cfg, shown);
    fitBoard();
  }

  /* A chip that opens the pop-up rather than navigating. A button, so it is
     keyboard reachable and is not announced as a link to nowhere. */
  function popChip(kind, n, title) {
    var b = el('button', 'chip');
    b.type = 'button';
    b.textContent = n;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', function () { openPop(kind, n); });
    return b;
  }

  function pos(x, y, w, h) {
    return 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;';
  }

  function buildCard(n, st, cls) {
    var isLink = !!st.url;
    /* A node with its own pop-up content and no page of its own becomes a
       button, so it is keyboard reachable and not a link to nowhere. */
    var isPop = !isLink && !!st.popup;
    var card = el(isLink ? 'a' : (isPop ? 'button' : 'div'),
                  cls + ' ' + st.status + (n.slots && cls === 'card' ? ' hasslots' : ''));
    if (isLink) { card.href = st.url; card.target = '_blank'; card.rel = 'noopener'; }
    if (isPop) {
      card.type = 'button';
      card.addEventListener('click', function () { openInline(st.popup); });
    }


    var lab = el('span', 'clabel');
    lab.textContent = st.label || n.label;
    card.appendChild(lab);

    var job = el('span', 'cjob');
    job.textContent = st.job || n.job;
    card.appendChild(job);

    /* The board's slim cards (the order bump) have no room for a third
       line; the stacked phone view always does. They are still clickable,
       and being anchors they still show a pointer cursor. */
    var wantsMeta = isLink || isPop || st.status === 'soon';
    if ((cls === 'scard' || n.h > 100) && wantsMeta) {
      var meta = el('span', 'cmeta');
      meta.textContent = (isLink || isPop)
        ? (st.cta || n.cta || (isPop ? 'See the copy' : 'Open page')) + (st.status === 'review' ? ' · in review' : '')
        : 'Still to come';
      card.appendChild(meta);
    }
    return card;
  }

  function buildStack(cfg, shown) {
    var stack = $('stack');
    LAYERS.forEach(function (L) {
      var members = NODES.filter(function (n) { return n.layer === L.id && shown[n.id]; });
      if (!members.length) return;
      var sec = el('section', 'slayer');
      var h = el('h2', 'stitle');
      h.textContent = L.title;
      sec.appendChild(h);
      members.forEach(function (n) {
        var c = buildCard(n, shown[n.id], 'scard');
        sec.appendChild(c);
      });
      stack.appendChild(sec);
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* --------------------------- pop-up --------------------------- */

  var cache = {}, lastFocus = null, popKind = null, popN = 0, popMax = 0;

  /* These files are static, so let the browser cache them normally: forcing
     revalidation on every open cost seconds on a cold CDN. A rejection is
     never cached, otherwise one blip would disable every chip on the page
     until reload. */
  function load(kind) {
    var file = 'clients/' + slug + '-' + (kind === 'ad' ? 'ads' : 'emails') + '.json';
    if (!cache[kind]) {
      cache[kind] = fetch(file).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).catch(function (err) {
        delete cache[kind];
        throw err;
      });
    }
    return cache[kind];
  }

  function showVeil() {
    var veil = $('veil');
    if (veil.classList.contains('on')) return;
    lastFocus = document.activeElement;
    veil.hidden = false;
    veil.classList.add('on');
    document.body.style.overflow = 'hidden';
    $('mclose').focus();
  }

  function popMessage(text) {
    var c = $('mcontent');
    c.textContent = '';
    var head = el('div', 'mhead');
    var t = el('div', 'mtitle');
    t.id = 'mtitle';
    t.textContent = text;
    head.appendChild(t);
    c.appendChild(head);
  }

  /* Open straight away and fill in when the data lands. Waiting silently for
     a slow fetch made every chip look broken. */
  function openPop(kind, n) {
    showVeil();
    var pending = true;
    setTimeout(function () { if (pending) popMessage('Loading…'); }, 150);

    load(kind).then(function (data) {
      pending = false;
      var list = kind === 'ad' ? (data.ads || []) : (data.emails || []);
      var item = list.filter(function (x) { return x.n === n; })[0];
      if (!item) { popMessage('That one is not in the file yet.'); return; }
      popKind = kind; popN = n; popMax = list.length;
      var c = $('mcontent');
      c.textContent = '';
      (kind === 'ad' ? adPop : mailPop)(c, item, data);
      c.appendChild(popNav());
    }).catch(function () {
      pending = false;
      popMessage(kind === 'ad' ? 'The ads could not be loaded. Try again in a moment.'
                               : 'The emails could not be loaded. Try again in a moment.');
    });
  }

  /* Content that belongs to a node rather than to a numbered set, such as
     the bump upgrade that lives inside the order form. No prev/next. */
  function openInline(pop) {
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
      box.textContent = '\u2713';
      row.appendChild(box);
      var lab = el('span');
      lab.textContent = pop.check;
      row.appendChild(lab);
      c.appendChild(row);
    }

    var body = el('div', 'mbody');
    popParas(body, pop.body || []);
    c.appendChild(body);

    if (pop.cta) {
      var foot = el('div', 'mfoot');
      var txt = el('div', 'txt');
      if (pop.footnote) { var d = el('div', 'mdesc'); d.textContent = pop.footnote; txt.appendChild(d); }
      foot.appendChild(txt);
      var b = el('div', 'mcta'); b.textContent = pop.cta; foot.appendChild(b);
      c.appendChild(foot);
    }
  }

  function closePop() {
    var veil = $('veil');
    veil.classList.remove('on');
    veil.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function popNav() {
    var nav = el('div', 'mnav');
    var prev = el('button'), next = el('button');
    prev.type = next.type = 'button';
    prev.textContent = '← Previous';
    next.textContent = 'Next →';
    prev.disabled = popN <= 1;
    next.disabled = popN >= popMax;
    prev.addEventListener('click', function () { openPop(popKind, popN - 1); });
    next.addEventListener('click', function () { openPop(popKind, popN + 1); });
    nav.appendChild(prev);
    nav.appendChild(next);
    return nav;
  }

  function isTodo(s) { return /^\[.*\]$/.test(String(s).trim()); }

  /* Copy carries live URLs; show them as links rather than raw text. Built
     as nodes, never innerHTML, so the copy can never inject markup. */
  function linkify(into, text) {
    var re = /https?:\/\/[^\s)<>"']+/g, last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) into.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = el('a', 'mlink');
      a.href = m[0];
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = m[0].replace(/^https?:\/\//, '');
      into.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < text.length) into.appendChild(document.createTextNode(text.slice(last)));
  }

  function popParas(into, list) {
    (list || []).forEach(function (t) {
      var p = el('p');
      if (isTodo(t)) {
        var s = el('span', 'mtodo');
        s.textContent = String(t).replace(/^\[|\]$/g, '');
        p.appendChild(s);
      } else { linkify(p, String(t)); }
      into.appendChild(p);
    });
  }

  function adPop(c, a) {
    var head = el('div', 'mhead');
    var k = el('div', 'mkicker'); k.textContent = 'Ad concept ' + a.n + ' of ' + popMax; head.appendChild(k);
    var t = el('div', 'mtitle'); t.id = 'mtitle'; t.textContent = a.title; head.appendChild(t);
    if (a.creative) { var s = el('div', 'msub it'); s.textContent = a.creative; head.appendChild(s); }
    c.appendChild(head);

    var body = el('div', 'mbody');
    popParas(body, a.primary);
    c.appendChild(body);

    var shots = el('div', 'mshots');
    [['feed', '4:5 feed'], ['story', '9:16 story']].forEach(function (pair) {
      if (!a[pair[0]]) return;
      var fig = el('figure', 'mshot');
      fig.style.margin = '0';
      var img = el('img');
      /* Intrinsic size up front so the frame is reserved before the file
         lands. Without it the grid collapses to nothing while loading and
         the pop-up looks as though it has no imagery at all. No lazy
         loading: the modal is built while hidden, where it never fires. */
      if (pair[0] === 'feed') { img.width = 864; img.height = 1080; }
      else { img.width = 787; img.height = 1400; }
      img.decoding = 'async';
      if ('fetchPriority' in img) { img.fetchPriority = 'high'; }
      img.src = a[pair[0]];
      img.alt = 'Concept ' + a.n + ', ' + a.title + ', ' + pair[1];
      fig.appendChild(img);
      var cap = el('figcaption'); cap.textContent = pair[1]; fig.appendChild(cap);
      shots.appendChild(fig);
    });
    c.appendChild(shots);

    var foot = el('div', 'mfoot');
    var txt = el('div', 'txt');
    var hl = el('div', 'mhl'); hl.textContent = a.headline; txt.appendChild(hl);
    if (a.description) { var d = el('div', 'mdesc'); d.textContent = a.description; txt.appendChild(d); }
    foot.appendChild(txt);
    if (a.cta) { var b = el('div', 'mcta'); b.textContent = a.cta; foot.appendChild(b); }
    c.appendChild(foot);
  }

  function mailPop(c, e, data) {
    var head = el('div', 'mhead');
    var k = el('div', 'mkicker');
    k.textContent = 'Email ' + e.n + ' of ' + popMax + ' · Day ' + e.day +
      (data.from ? ' · From ' + data.from : '');
    head.appendChild(k);
    var t = el('div', 'mtitle'); t.id = 'mtitle'; t.textContent = e.subject; head.appendChild(t);
    if (e.preview) { var s = el('div', 'msub'); s.textContent = e.preview; head.appendChild(s); }
    c.appendChild(head);
    var body = el('div', 'mbody');
    popParas(body, e.body);
    c.appendChild(body);
  }

  $('mclose').addEventListener('click', closePop);
  $('veil').addEventListener('click', function (ev) { if (ev.target === $('veil')) closePop(); });
  document.addEventListener('keydown', function (ev) {
    if (!$('veil').classList.contains('on')) return;
    if (ev.key === 'Escape') { closePop(); }
    else if (ev.key === 'ArrowRight' && popN < popMax) { openPop(popKind, popN + 1); }
    else if (ev.key === 'ArrowLeft' && popN > 1) { openPop(popKind, popN - 1); }
  });

  /* --------------------------- fit --------------------------- */

  function scaleTo(s) {
    $('board').style.transform = 'scale(' + s + ')';
    $('stage').style.width = (BOARD_W * s) + 'px';
    $('stage').style.height = (BOARD_H * s) + 'px';
  }

  function fitBoard() {
    /* Measure the shell, which is already inside the wrap's padding, rather
       than subtracting a fixed inset from the wrap: the padding changes with
       the breakpoint and a hardcoded number silently overflowed the board. */
    var avail = document.querySelector('.shell').clientWidth;
    scaleTo(Math.min(1, Math.max(MIN_SCALE, avail / BOARD_W)));
  }
  window.addEventListener('resize', fitBoard);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitBoard); }

  /* Printing keeps whatever scale the screen last used, which spills the
     board off the page. Size it to the usable width of a landscape sheet
     at 10mm margins instead, then put it back afterwards. Fitting the
     height too would shrink the type past readable, so a tall board is
     allowed to run onto a second page. */
  var PRINT_W = 1020;
  window.addEventListener('beforeprint', function () { scaleTo(PRINT_W / BOARD_W); });
  window.addEventListener('afterprint', fitBoard);

  /* --------------------------- boot --------------------------- */

  var params = new URLSearchParams(location.search);
  var inline = params.get('d');
  var raw = (params.get('c') || 'demo').toLowerCase();
  var slug = /^[a-z0-9-]{1,64}$/.test(raw) ? raw : 'demo';

  if (inline) {
    var cfg = decodeInline(inline);
    render(cfg || EMPTY, cfg ? '' : 'That preview link could not be read. Showing an empty map.');
  } else {
    fetch('clients/' + slug + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (cfg) { render(cfg); })
      .catch(function () {
        if (slug === 'demo') { render(EMPTY, 'No client map found. Showing an empty board.'); return; }
        fetch('clients/demo.json', { cache: 'no-cache' })
          .then(function (r) { return r.json(); })
          .then(function (cfg) { render(cfg, 'No map found for "' + slug + '". Showing the example map instead.'); })
          .catch(function () { render(EMPTY, 'No map found for "' + slug + '".'); });
      });
  }

  /* When embedded, report our height so the parent iframe can size itself.
     The page height is not monotonic with width: the board scales, and below
     1000px it is replaced by the stacked list. */
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
