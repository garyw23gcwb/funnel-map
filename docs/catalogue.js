/* ------------------------------------------------------------------
   The funnel node catalogue: the single source of truth for what
   appears on the map and where it sits.

   Loaded by BOTH docs/index.html (the client-facing map) and
   builder.html (where the links are entered), so the two can never
   drift apart. Add a node here and it shows up in both.

   Layout: the book funnel runs left to right across the top, the way a
   buyer moves through a checkout. Everything after the purchase then
   continues downwards in centred rows. Anything hanging off a step (the
   order bump, a second upsell, the abandonment emails) sits directly
   below or beside its parent.

   Board coordinates are plain pixels on a 1400-wide canvas. The height
   is worked out at render time from the nodes actually shown, so a
   client with fewer pieces gets a shorter board rather than dead space.
   ------------------------------------------------------------------ */

window.FUNNEL_CATALOGUE = (function () {
  'use strict';

  var BOARD_W = 1400;

  var CW = 290;                              /* standard card width      */
  var A = 66, B = 392, C = 718, D = 1044;    /* four across, book funnel */
  var P = 229, Q = 555, S = 881;             /* three across, centred    */

  /* Only the side-funnel block carries a title box on the board; the rest
     of the flow reads from its own shape. These titles are still used as
     the headings in the narrow-screen list view. */
  var LAYERS = [
    { id: 'traffic',  title: 'Traffic' },
    { id: 'book',     title: 'The Book Funnel' },
    { id: 'delivery', title: 'Delivery' },
    { id: 'followup', title: 'Follow-up' },
    { id: 'convert',  title: 'Conversion' },
    { id: 'side',     title: 'Side Funnels', lx: 220, ly: 1376 }
  ];

  var NODES = [
    /* Wide enough to hold the ten ad chips inside it, and left aligned so
       the arrow drops straight into the sales page below. */
    { id: 'ads', layer: 'traffic', label: 'Meta Ads', x: A, y: 60, w: 560, h: 140,
      job: 'Ten ad concepts, each running in feed and story sizes.' },

    { id: 'sales-page', layer: 'book', label: 'Sales Page', x: A, y: 250, w: CW, h: 130, tilt: 1,
      job: 'Eighteen sections selling the book. Every button goes to checkout.' },
    { id: 'order-form', layer: 'book', label: 'Order Form', x: B, y: 250, w: CW, h: 130,
      job: 'Three format tiers: digital, audiobook, paperback. Card details captured here.' },
    { id: 'order-bump', layer: 'book', label: 'Order Bump', x: B, y: 410, w: CW, h: 92,
      job: 'One tick, added above the order button.' },
    { id: 'one-click', layer: 'book', label: 'One-Click Offer', x: C, y: 250, w: CW, h: 130, tilt: 2,
      job: 'Offered on purchase momentum, with no card re-entry.' },
    { id: 'one-click-2', layer: 'book', label: 'Second One-Click Offer', x: C, y: 410, w: CW, h: 112, optional: true,
      job: 'A second upsell, taken or declined the same way.' },
    { id: 'confirmation', layer: 'book', label: 'Order Confirmation', x: D, y: 250, w: CW, h: 130,
      job: 'Confirms the order and points the buyer to the reader portal.' },

    { id: 'reader-portal', layer: 'delivery', label: 'Reader Portal', x: P, y: 560, w: CW, h: 130,
      job: 'Where the buyer logs in and downloads.', cta: 'Open portal' },
    { id: 'tinybook', layer: 'delivery', label: 'The Tinybook', x: Q, y: 560, w: CW, h: 130, tilt: 1,
      job: 'Digital, audiobook and paperback. What the whole funnel is built around.', cta: 'Open the book' },
    /* A free tool the book points at, sitting beside the book rather than
       in a side column. */
    { id: 'scorecard', layer: 'delivery', label: 'The Scorecard', x: S, y: 560, w: CW, h: 130, optional: true,
      job: 'A free tool the book points readers to.' },

    { id: 'email-sequence', layer: 'followup', label: 'Email Sequence', x: 430, y: 760, w: 540, h: 200,
      job: 'Twenty-one emails over thirty days. Delivers, builds the relationship, then makes the offer.' },
    { id: 'plan-page', layer: 'followup', label: 'Plan Page', x: Q, y: 1020, w: CW, h: 130, tilt: 2,
      job: 'The offer on its own URL, for readers who buy later from email.' },
    { id: 'abandonment', layer: 'followup', label: 'Abandonment Sequence', x: S, y: 1020, w: CW, h: 130,
      job: 'Three emails to anyone who opens the page and does not buy within 24 hours.', cta: 'Read the emails' },

    { id: 'survey', layer: 'convert', label: 'The Survey', x: P, y: 1220, w: CW, h: 130,
      job: 'Filled in by one-click buyers. The answers build the plan before the call.' },
    { id: 'review-call', layer: 'convert', label: 'Review Call', x: Q, y: 1220, w: CW, h: 130,
      job: 'Booked by one-click buyers only. No free calls, no cold prospects.', cta: 'Open booking page' },
    { id: 'backend-offer', layer: 'convert', label: 'Backend Offer', x: S, y: 1220, w: CW, h: 130, tilt: 1,
      job: 'Your core service, sold to a reader who has already paid you twice.' },

    { id: 'rb-optin', layer: 'side', label: 'Reader Bonus Opt-in', x: P, y: 1446, w: CW, h: 118,
      job: 'Claims the bonus the book promises, in exchange for an email.' },
    { id: 'rb-thanks', layer: 'side', label: 'Bonus Delivery', x: P, y: 1584, w: CW, h: 118,
      job: 'Hands over the bonus and adds the reader to your list.' },
    { id: 'sip-page', layer: 'side', label: 'SIP Sales Page', x: Q, y: 1446, w: CW, h: 118,
      job: 'Sells the plan on its own, with the survey that builds it.' },
    { id: 'sip-confirm', layer: 'side', label: 'SIP Confirmation', x: Q, y: 1584, w: CW, h: 118,
      job: 'Sends the buyer straight into the survey.' },
    { id: 'wl-optin', layer: 'side', label: 'Waitlist Opt-in', x: S, y: 1446, w: CW, h: 118,
      job: 'Collects emails before launch, against first access.' },
    { id: 'wl-confirm', layer: 'side', label: 'Waitlist Confirmation', x: S, y: 1584, w: CW, h: 118,
      job: 'Confirms the spot and sets the launch expectation.' }
  ];

  var GROUPS = [
    { id: 'side', x: 200, y: 1400, w: 1000, h: 330 }
  ];

  var SUBLABELS = [
    { text: 'Reader bonus',   x: P, y: 1422, needs: ['rb-optin', 'rb-thanks'] },
    { text: 'Standalone SIP', x: Q, y: 1422, needs: ['sip-page', 'sip-confirm'] },
    { text: 'Waitlist',       x: S, y: 1422, needs: ['wl-optin', 'wl-confirm'] }
  ];

  /* Both chip strips sit inside their card. */
  var CHIPS = { x: 450, y: 866, w: 500, h: 62, count: 21 };
  var AD_CHIPS = { x: 88, y: 150, w: 460, h: 28, count: 10 };

  /* Edges. `a` and `b` are anchors written as id:side, optionally with a
     fraction along that side (confirmation:b@0.35). `via` holds waypoints
     in board coordinates. An edge is drawn only if both nodes are shown. */
  var EDGES = [
    { a: 'ads:b@0.259',        b: 'sales-page:t' },

    { a: 'sales-page:r',       b: 'order-form:l' },
    { a: 'order-form:r',       b: 'one-click:l' },
    { a: 'one-click:r',        b: 'confirmation:l' },
    { a: 'order-form:b',       b: 'order-bump:t', dashed: true, arrow: false },
    { a: 'one-click:b',        b: 'one-click-2:t' },
    { a: 'one-click-2:r',      b: 'confirmation:b@0.5', via: [[1189, 466]] },

    { a: 'confirmation:b@0.35', b: 'reader-portal:t', via: [[1145, 536], [374, 536]] },
    { a: 'reader-portal:r',    b: 'tinybook:l' },
    { a: 'tinybook:r',         b: 'scorecard:l' },

    { a: 'reader-portal:b',    b: 'email-sequence:t@0.5', via: [[374, 730], [700, 730]] },
    { a: 'email-sequence:r',   b: 'scorecard:b@0.5', via: [[1026, 860]],
      label: 'from the emails', lx: 1034, ly: 786 },
    { a: 'email-sequence:b@0.5', b: 'plan-page:t' },

    { a: 'plan-page:r',        b: 'abandonment:l' },
    { a: 'abandonment:b@0.5',  b: 'plan-page:b@0.9', via: [[1026, 1180], [816, 1180]],
      label: 're-pitch', lx: 878, ly: 1160 },
    { a: 'plan-page:b@0.3',    b: 'survey:t', via: [[642, 1190], [374, 1190]] },

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
