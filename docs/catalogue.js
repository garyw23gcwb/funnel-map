/* ------------------------------------------------------------------
   The funnel node catalogue: the single source of truth for what
   appears on the map and where it sits.

   Loaded by BOTH docs/index.html (the client-facing map) and
   builder.html (where the links are entered), so the two can never
   drift apart. Add a node here and it shows up in both.

   Layout: one centred column running top to bottom, which is the order
   a buyer moves through. Anything that hangs off a step (the order
   bump, a second upsell, the abandonment emails) branches to the right;
   anything a step delivers into sits on the same row. The client reads
   it downwards without their eye jumping back across the page.

   Board coordinates are plain pixels on a 1120-wide canvas. The height
   is worked out at render time from the nodes actually shown, so a
   client with fewer pieces gets a shorter board rather than dead space.
   ------------------------------------------------------------------ */

window.FUNNEL_CATALOGUE = (function () {
  'use strict';

  var BOARD_W = 1120;

  /* Three columns. The middle one is the spine and is centred on the board. */
  var L = 70, M = 410, R = 750, CW = 300;

  /* Band titles, left aligned above each section. */
  var LAYERS = [
    { id: 'traffic',  title: 'Traffic',         lx: L, ly: 38 },
    { id: 'book',     title: 'The Book Funnel', lx: L, ly: 236 },
    { id: 'delivery', title: 'Delivery',        lx: L, ly: 916 },
    { id: 'followup', title: 'Follow-up',       lx: L, ly: 1086 },
    { id: 'convert',  title: 'Conversion',      lx: L, ly: 1514 },
    { id: 'side',     title: 'Side Funnels',    lx: L, ly: 1678 }
  ];

  var NODES = [
    /* Wide enough to hold the ten ad chips inside it, and centred. */
    { id: 'ads', layer: 'traffic', step: 10, label: 'Meta Ads', x: 300, y: 86, w: 520, h: 140,
      job: 'Ten ad concepts, each running in feed and story sizes.' },

    { id: 'sales-page', layer: 'book', step: 20, label: 'Sales Page', x: M, y: 284, w: CW, h: 112, tilt: 1,
      job: 'Eighteen sections selling the book. Every button goes to checkout.' },
    { id: 'order-form', layer: 'book', step: 30, label: 'Order Form', x: M, y: 454, w: CW, h: 112,
      job: 'Three format tiers: digital, audiobook, paperback. Card details captured here.' },
    { id: 'order-bump', layer: 'book', label: 'Order Bump', x: R, y: 464, w: CW, h: 92,
      job: 'One tick, added above the order button.' },
    { id: 'one-click', layer: 'book', step: 40, label: 'One-Click Offer', x: M, y: 624, w: CW, h: 112, tilt: 2,
      job: 'Offered on purchase momentum, with no card re-entry.' },
    { id: 'one-click-2', layer: 'book', step: 45, label: 'Second One-Click Offer', x: R, y: 624, w: CW, h: 112, optional: true,
      job: 'A second upsell, taken or declined the same way.' },
    { id: 'confirmation', layer: 'book', step: 50, label: 'Order Confirmation', x: M, y: 794, w: CW, h: 112,
      job: 'Confirms the order and points the buyer to the reader portal.' },

    { id: 'reader-portal', layer: 'delivery', step: 60, label: 'Reader Portal', x: L, y: 964, w: CW, h: 112,
      job: 'Where the buyer logs in and downloads.', cta: 'Open portal' },
    { id: 'tinybook', layer: 'delivery', step: 70, label: 'The Tinybook', x: M, y: 964, w: CW, h: 112, tilt: 1,
      job: 'Digital, audiobook and paperback. What the whole funnel is built around.', cta: 'Open the book' },
    /* A free tool the book points at. Sits beside the book, not in a side
       column, and carries no step number: it is a destination, not a step. */
    { id: 'scorecard', layer: 'delivery', label: 'The Scorecard', x: R, y: 964, w: CW, h: 112, optional: true,
      job: 'A free tool the book points readers to.' },

    { id: 'email-sequence', layer: 'followup', step: 80, label: 'Email Sequence', x: 290, y: 1134, w: 540, h: 200,
      job: 'Twenty-one emails over thirty days. Delivers, builds the relationship, then makes the offer.' },
    { id: 'plan-page', layer: 'followup', step: 90, label: 'Plan Page', x: M, y: 1392, w: CW, h: 112, tilt: 2,
      job: 'The offer on its own URL, for readers who buy later from email.' },
    { id: 'abandonment', layer: 'followup', step: 100, label: 'Abandonment Sequence', x: R, y: 1392, w: CW, h: 112,
      job: 'Three emails to anyone who opens the page and does not buy within 24 hours.', cta: 'Read the emails' },

    { id: 'survey', layer: 'convert', step: 105, label: 'The Survey', x: L, y: 1562, w: CW, h: 112,
      job: 'The questions that build the plan, filled in before the call is booked.' },
    { id: 'review-call', layer: 'convert', step: 110, label: 'Review Call', x: M, y: 1562, w: CW, h: 112,
      job: 'Booked by one-click buyers only. No free calls, no cold prospects.', cta: 'Open booking page' },
    { id: 'backend-offer', layer: 'convert', step: 120, label: 'Backend Offer', x: R, y: 1562, w: CW, h: 112, tilt: 1,
      job: 'Your core service, sold to a reader who has already paid you twice.' },

    { id: 'rb-optin', layer: 'side', label: 'Reader Bonus Opt-in', x: L, y: 1786, w: CW, h: 112,
      job: 'Claims the bonus the book promises, in exchange for an email.' },
    { id: 'rb-thanks', layer: 'side', label: 'Bonus Delivery', x: L, y: 1918, w: CW, h: 112,
      job: 'Hands over the bonus and adds the reader to your list.' },
    { id: 'sip-page', layer: 'side', label: 'SIP Sales Page', x: M, y: 1786, w: CW, h: 112,
      job: 'Sells the plan on its own, with the survey that builds it.' },
    { id: 'sip-confirm', layer: 'side', label: 'SIP Confirmation', x: M, y: 1918, w: CW, h: 112,
      job: 'Sends the buyer straight into the survey.' },
    { id: 'wl-optin', layer: 'side', label: 'Waitlist Opt-in', x: R, y: 1786, w: CW, h: 112,
      job: 'Collects emails before launch, against first access.' },
    { id: 'wl-confirm', layer: 'side', label: 'Waitlist Confirmation', x: R, y: 1918, w: CW, h: 112,
      job: 'Confirms the spot and sets the launch expectation.' }
  ];

  var GROUPS = [
    { id: 'side', x: 50, y: 1716, w: 1020, h: 314 }
  ];

  var SUBLABELS = [
    { text: 'Reader bonus',   x: L, y: 1762, needs: ['rb-optin', 'rb-thanks'] },
    { text: 'Standalone SIP', x: M, y: 1762, needs: ['sip-page', 'sip-confirm'] },
    { text: 'Waitlist',       x: R, y: 1762, needs: ['wl-optin', 'wl-confirm'] }
  ];

  /* Both chip strips sit inside their card. */
  var CHIPS = { x: 310, y: 1240, w: 500, h: 62, count: 21 };
  var AD_CHIPS = { x: 322, y: 176, w: 460, h: 28, count: 10 };

  /* Edges. `a` and `b` are anchors written as id:side, optionally with a
     fraction along that side (one-click:b@0.7). `via` holds waypoints in
     board coordinates. An edge is drawn only if both its nodes are shown. */
  var EDGES = [
    { a: 'ads:b',              b: 'sales-page:t' },
    { a: 'sales-page:b',       b: 'order-form:t' },
    { a: 'order-form:r',       b: 'order-bump:l', dashed: true, arrow: false },
    { a: 'order-form:b@0.35',  b: 'one-click:t@0.35' },
    { a: 'one-click:r',        b: 'one-click-2:l' },
    { a: 'one-click:b@0.3',    b: 'confirmation:t@0.3', label: 'buy', lx: 474, ly: 748 },
    { a: 'one-click:b@0.7',    b: 'confirmation:t@0.7', label: 'decline', lx: 596, ly: 748 },

    { a: 'confirmation:b@0.767', b: 'reader-portal:t@0.767', via: [[640, 934], [300, 934]] },
    { a: 'reader-portal:r',    b: 'tinybook:l' },
    { a: 'tinybook:r',         b: 'scorecard:l' },

    { a: 'reader-portal:b@0.767', b: 'email-sequence:t@0.5', via: [[300, 1104], [560, 1104]] },
    { a: 'email-sequence:r',   b: 'scorecard:b@0.5', via: [[900, 1234]],
      label: 'from the emails', lx: 908, ly: 1150 },
    { a: 'email-sequence:b@0.5', b: 'plan-page:t' },
    { a: 'plan-page:r',        b: 'abandonment:l' },
    { a: 'abandonment:b@0.5',  b: 'plan-page:b@0.873', via: [[900, 1528], [672, 1528]],
      label: 're-pitch', lx: 752, ly: 1512 },
    { a: 'plan-page:b@0.3',    b: 'survey:t@0.767', via: [[500, 1532], [300, 1532]] },

    /* The fast path: a one-click buyer skips the nurture and goes straight to
       the survey. Runs down the left margin, clear of every card. */
    { a: 'one-click:l@0.9',    b: 'survey:l', via: [[40, 725], [40, 1618]],
      label: 'one-click buyers', lx: 32, ly: 1320, vert: true },
    { a: 'survey:r',           b: 'review-call:l' },
    { a: 'review-call:r',      b: 'backend-offer:l' },

    { a: 'rb-optin:b',         b: 'rb-thanks:t' },
    { a: 'sip-page:b',         b: 'sip-confirm:t' },
    { a: 'wl-optin:b',         b: 'wl-confirm:t' }
  ];

  return {
    BOARD_W: BOARD_W,
    LAYERS: LAYERS, NODES: NODES, GROUPS: GROUPS,
    SUBLABELS: SUBLABELS, CHIPS: CHIPS, AD_CHIPS: AD_CHIPS, EDGES: EDGES
  };
})();
