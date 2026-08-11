/* ------------------------------------------------------------------
   The funnel node catalogue: the single source of truth for what
   appears on the map and where it sits.

   Loaded by BOTH docs/index.html (the client-facing map) and
   builder.html (where the links are entered), so the two can never
   drift apart. Add a node here and it shows up in both.

   Board coordinates are plain pixels on a fixed 1560 x 1312 canvas,
   which index.html then scales to fit the viewport.
   ------------------------------------------------------------------ */

window.FUNNEL_CATALOGUE = (function () {
  'use strict';

  var BOARD_W = 1560, BOARD_H = 1312;

/* Horizontal bands down the main flow, plus the side-funnel column.
   lx / ly place each band's title box. */
var LAYERS = [
  { id: 'traffic',  title: 'Traffic',          lx: 108,  ly: 56 },
  { id: 'book',     title: 'The Book Funnel',  lx: 108,  ly: 256 },
  { id: 'delivery', title: 'Delivery',         lx: 108,  ly: 568 },
  { id: 'followup', title: 'Follow-up',        lx: 108,  ly: 776 },
  { id: 'convert',  title: 'Conversion',       lx: 108,  ly: 1086 },
  { id: 'side',     title: 'Side Funnels',     lx: 1268, ly: 252 }
];

var NODES = [
  { id: 'ads', layer: 'traffic', step: 10, label: 'Meta Ads', x: 150, y: 102, w: 238, h: 130,
    job: 'Ten ad concepts, each running in feed and story sizes.', cta: 'Open ad account' },

  { id: 'sales-page', layer: 'book', step: 20, label: 'Sales Page', x: 150, y: 310, w: 238, h: 130, tilt: 1,
    job: 'Eighteen sections selling the book and nothing else. Every button goes to checkout.' },
  { id: 'order-form', layer: 'book', step: 30, label: 'Order Form', x: 422, y: 310, w: 238, h: 130,
    job: 'Three format tiers: digital, audiobook, paperback. Card details captured here.' },
  /* h clears the "one-click buyers" wire that runs across at y=556. */
  { id: 'order-bump', layer: 'book', label: 'Order Bump', x: 422, y: 458, w: 238, h: 92,
    job: 'One tick, added above the order button.' },
  { id: 'one-click', layer: 'book', step: 40, label: 'One-Click Offer', x: 694, y: 310, w: 238, h: 130, tilt: 2,
    job: 'Your implementation plan, offered on purchase momentum. No card re-entry.' },
  /* Most clients run one upsell and leave this switched off. Jim Fitzgerald
     runs two (Deep Diagnostic, then Training Kit) and no order bump. */
  { id: 'one-click-2', layer: 'book', step: 45, label: 'Second One-Click Offer', x: 694, y: 458, w: 238, h: 112, optional: true,
    job: 'A second upsell, taken or declined the same way.' },
  { id: 'confirmation', layer: 'book', step: 50, label: 'Order Confirmation', x: 966, y: 310, w: 238, h: 130,
    job: 'Confirms the order, sets delivery expectations, points to the reader portal.' },

  { id: 'reader-portal', layer: 'delivery', step: 60, label: 'Reader Portal', x: 150, y: 618, w: 238, h: 130,
    job: 'Where the buyer logs in and downloads. EPUB, PDF and cover.', cta: 'Open portal' },
  { id: 'tinybook', layer: 'delivery', step: 70, label: 'The Tinybook', x: 422, y: 618, w: 238, h: 130, tilt: 1,
    job: 'Digital, audiobook and paperback. The asset the whole funnel is built around.', cta: 'Open the book' },
  /* A free tool or asset the book points at, sitting beside the book rather
     than in the side column. Unnumbered: it is a destination the book and
     the emails link to, not a step in the purchase run. */
  { id: 'scorecard', layer: 'delivery', label: 'The Scorecard', x: 694, y: 618, w: 238, h: 130, optional: true,
    job: 'A free tool the book points readers to.' },

  { id: 'email-sequence', layer: 'followup', step: 80, label: 'Email Sequence', x: 150, y: 828, w: 510, h: 130,
    job: 'Twenty-one emails over thirty days. Delivers, builds the relationship, then makes the offer.', cta: 'Read the sequence' },
  { id: 'plan-page', layer: 'followup', step: 90, label: 'Plan Page', x: 694, y: 828, w: 238, h: 130, tilt: 2,
    job: 'The one-click offer on its own URL, for readers who buy later from email.' },
  { id: 'abandonment', layer: 'followup', step: 100, label: 'Abandonment Sequence', x: 966, y: 828, w: 238, h: 130,
    job: 'Three emails to anyone who opens the plan page and does not buy within 24 hours.', cta: 'Read the emails' },

  { id: 'survey', layer: 'convert', step: 105, label: 'The Survey', x: 150, y: 1138, w: 238, h: 130,
    job: 'The questions that build the plan. Filled in before the call is booked.' },
  { id: 'review-call', layer: 'convert', step: 110, label: 'Review Call', x: 422, y: 1138, w: 238, h: 130,
    job: 'Booked by one-click buyers only. No free calls, no cold prospects.', cta: 'Open booking page' },
  { id: 'backend-offer', layer: 'convert', step: 120, label: 'Backend Offer', x: 694, y: 1138, w: 238, h: 130, tilt: 1,
    job: 'Your core service, sold on the call to a reader who has already paid you twice.' },

  { id: 'rb-optin', layer: 'side', label: 'Reader Bonus Opt-in', x: 1268, y: 326, w: 238, h: 116,
    job: 'Claims the bonus the book promises, in exchange for an email.' },
  { id: 'rb-thanks', layer: 'side', label: 'Bonus Delivery', x: 1268, y: 458, w: 238, h: 116,
    job: 'Hands over the bonus and adds the reader to your list.' },
  { id: 'sip-page', layer: 'side', label: 'SIP Sales Page', x: 1268, y: 622, w: 238, h: 116,
    job: 'Sells the plan on its own, with the survey that builds it.' },
  { id: 'sip-confirm', layer: 'side', label: 'SIP Confirmation', x: 1268, y: 754, w: 238, h: 116,
    job: 'Sends the buyer straight into the survey.' },
  { id: 'wl-optin', layer: 'side', label: 'Waitlist Opt-in', x: 1268, y: 918, w: 238, h: 116,
    job: 'Collects emails before launch, against first access.' },
  { id: 'wl-confirm', layer: 'side', label: 'Waitlist Confirmation', x: 1268, y: 1050, w: 238, h: 116,
    job: 'Confirms the spot and sets the launch expectation.' }
];

var GROUPS = [
  { id: 'side', x: 1250, y: 272, w: 274, h: 924 }
];

var SUBLABELS = [
  { text: 'Reader bonus', x: 1268, y: 300, needs: ['rb-optin', 'rb-thanks'] },
  { text: 'Standalone SIP', x: 1268, y: 596, needs: ['sip-page', 'sip-confirm'] },
  { text: 'Waitlist', x: 1268, y: 892, needs: ['wl-optin', 'wl-confirm'] }
];

var CHIPS = { x: 150, y: 974, w: 510, h: 68, count: 21 };

/* The ten ad concepts, sitting beside the ads card rather than under it:
   the book-funnel band title is directly below. */
var AD_CHIPS = { x: 422, y: 153, w: 460, h: 28, count: 10 };

/* Edges. `a` and `b` are anchors written as id:side, optionally with a
   fraction along that side (one-click:b@0.72). `via` holds waypoints in
   board coordinates. An edge is drawn only if both its nodes are shown. */
var EDGES = [
  { a: 'ads:b',              b: 'sales-page:t' },
  { a: 'sales-page:r',       b: 'order-form:l' },
  { a: 'order-form:r',       b: 'one-click:l' },
  { a: 'one-click:r',        b: 'confirmation:l' },
  { a: 'order-form:b',       b: 'order-bump:t', dashed: true, arrow: false },
  { a: 'one-click:b@0.3',    b: 'one-click-2:t@0.3' },
  { a: 'one-click-2:r',      b: 'confirmation:b@0.118', via: [[994, 514]] },
  { a: 'one-click:b@0.72',   b: 'confirmation:b@0.35', via: [[865, 592], [1049, 592]],
    label: 'decline', lx: 940, ly: 568 },
  { a: 'confirmation:b@0.65', b: 'reader-portal:t', via: [[1121, 610], [269, 610]] },
  { a: 'reader-portal:b',    b: 'email-sequence:t@0.2333' },
  { a: 'reader-portal:r',    b: 'tinybook:l' },
  { a: 'tinybook:r',         b: 'scorecard:l' },
  { a: 'email-sequence:t@0.9', b: 'scorecard:b@0.5', via: [[609, 790], [813, 790]],
    label: 'from the emails', lx: 636, ly: 794 },
  { a: 'email-sequence:r',   b: 'plan-page:l' },
  { a: 'plan-page:r',        b: 'abandonment:l' },
  { a: 'abandonment:b',      b: 'plan-page:b@0.6', via: [[1085, 1010], [837, 1010]],
    label: 're-pitch', lx: 928, ly: 1020 },
  { a: 'plan-page:b@0.15',   b: 'survey:t', via: [[730, 1080], [269, 1080]] },
  /* Leaves from the left edge and drops through the 34px gap between the
     order form and the upsell column, so it clears one-click-2 when that
     is switched on. */
  { a: 'one-click:l@0.9',    b: 'survey:l', via: [[677, 427], [677, 556], [70, 556], [70, 1203]],
    label: 'one-click buyers', lx: 62, ly: 1012, vert: true },
  { a: 'survey:r',           b: 'review-call:l' },
  { a: 'review-call:r',      b: 'backend-offer:l' },
  { a: 'tinybook:r',         b: 'rb-optin:l', via: [[1232, 683], [1232, 384]],
    label: 'in-book CTA', lx: 950, ly: 658 },
  { a: 'rb-optin:b',         b: 'rb-thanks:t' },
  { a: 'sip-page:b',         b: 'sip-confirm:t' },
  { a: 'wl-optin:b',         b: 'wl-confirm:t' }
];


  return {
    BOARD_W: BOARD_W, BOARD_H: BOARD_H,
    LAYERS: LAYERS, NODES: NODES, GROUPS: GROUPS,
    SUBLABELS: SUBLABELS, CHIPS: CHIPS, AD_CHIPS: AD_CHIPS, EDGES: EDGES
  };
})();
