/* ------------------------------------------------------------------
   The funnel node catalogue: the single source of truth for what
   appears on the map and where it sits.

   Loaded by BOTH docs/index.html (the client-facing map) and
   builder.html (where the links are entered), so the two can never
   drift apart. Add a node here and it shows up in both.

   Layout: the book funnel runs left to right across the top, the way a
   buyer moves through a checkout. Everything after the purchase then
   continues downwards. Anything hanging off a step (the bump upgrade, a
   second upsell, the abandonment emails) sits directly below or beside
   its parent.

   Vertical rhythm: 100px between bands, 40px between a card and the
   thing that drops out of it. Board coordinates are plain pixels on a
   1400-wide canvas; the height is worked out at render time from the
   nodes actually shown, so a client with fewer pieces gets a shorter
   board rather than dead space.
   ------------------------------------------------------------------ */

window.FUNNEL_CATALOGUE = (function () {
  'use strict';

  var BOARD_W = 1400;

  var CW = 290;                              /* standard card width      */
  var CH = 140;                              /* standard card height     */
  var A = 60, B = 390, C = 720, D = 1050;    /* four across, book funnel */
  var P = 225, Q = 555, S = 885;             /* three across, centred    */

  /* Only the side-funnel block carries a title box on the board; the rest
     of the flow reads from its own shape. These titles are still used as
     the headings in the narrow-screen list view. */
  var LAYERS = [
    { id: 'traffic',  title: 'Traffic' },
    { id: 'book',     title: 'The Book Funnel' },
    { id: 'delivery', title: 'Delivery' },
    { id: 'followup', title: 'Follow-up' },
    { id: 'convert',  title: 'Conversion' },
    { id: 'side',     title: 'Side Funnels', lx: 216, ly: 1720 }
  ];

  var NODES = [
    /* Wide enough to hold the ten ad chips inside it, and left aligned so
       the arrow drops straight into the sales page below. */
    { id: 'ads', layer: 'traffic', label: 'Meta Ads', x: A, y: 60, w: 560, h: 158,
      job: 'Ten ad concepts, each running in feed and story sizes.' },

    { id: 'sales-page', layer: 'book', label: 'Sales Page', x: A, y: 318, w: CW, h: CH, tilt: 1,
      job: 'Eighteen sections selling the book. Every button goes to checkout.' },
    { id: 'order-form', layer: 'book', label: 'Order Form', x: B, y: 318, w: CW, h: CH,
      job: 'Three format tiers: digital, audiobook, paperback. Card details captured here.' },
    /* Drops down from the order form: it lives inside that page, above the
       order button. Always called a Bump Upgrade, never an order bump. */
    { id: 'order-bump', layer: 'book', label: 'Bump Upgrade', x: B, y: 498, w: CW, h: 124,
      job: 'One tick, added above the order button.' },
    { id: 'one-click', layer: 'book', label: 'One-Click Offer', x: C, y: 318, w: CW, h: CH, tilt: 2,
      job: 'Offered on purchase momentum, with no card re-entry.' },
    { id: 'one-click-2', layer: 'book', label: 'Second One-Click Offer', x: C, y: 498, w: CW, h: 124, optional: true,
      job: 'A second upsell, taken or declined the same way.' },
    { id: 'confirmation', layer: 'book', label: 'Order Confirmation', x: D, y: 318, w: CW, h: CH,
      job: 'Confirms the order and points the buyer to the reader portal.' },

    /* A container. The book is delivered here, so its formats are slots
       inside this card rather than a node of their own. */
    { id: 'reader-portal', layer: 'delivery', label: 'Reader Portal', x: P, y: 722, w: CW, h: 168,
      job: 'Where the buyer logs in and downloads.', cta: 'Open portal',
      slots: { x: 242, y: 852, w: 256, h: 28, items: [
        { id: 'file-pdf',   label: 'PDF',  title: 'The ebook, PDF' },
        { id: 'file-epub',  label: 'EPUB', title: 'The ebook, EPUB' },
        { id: 'file-mp3',   label: 'MP3',  title: 'The audiobook, MP3' },
        { id: 'file-m4b',   label: 'M4B',  title: 'The audiobook, M4B' },
        { id: 'file-extra', label: 'Bump', title: 'The bump upgrade content' }
      ] } },
    /* A free tool the book points at. It comes out of the portal, because
       the book carrying that CTA is delivered there. */
    { id: 'scorecard', layer: 'delivery', label: 'The Scorecard', x: S, y: 722, w: CW, h: CH, optional: true,
      job: 'A free tool the book points readers to.' },

    { id: 'email-sequence', layer: 'followup', label: 'Email Sequence', x: 430, y: 990, w: 540, h: 218,
      job: 'Twenty-one emails over thirty days. Delivers, builds the relationship, then makes the offer.' },
    { id: 'plan-page', layer: 'followup', label: 'Plan Page', x: Q, y: 1308, w: CW, h: CH, tilt: 2,
      job: 'The offer on its own URL, for readers who buy later from email.' },
    { id: 'abandonment', layer: 'followup', label: 'Abandonment Sequence', x: S, y: 1308, w: CW, h: CH,
      job: 'Three emails to anyone who opens the page and does not buy within 24 hours.', cta: 'Read the emails' },

    { id: 'survey', layer: 'convert', label: 'The Survey', x: P, y: 1548, w: CW, h: CH,
      job: 'Filled in by one-click buyers. The answers build the plan before the call.' },
    { id: 'review-call', layer: 'convert', label: 'Review Call', x: Q, y: 1548, w: CW, h: CH,
      job: 'Booked by one-click buyers only. No free calls, no cold prospects.', cta: 'Open booking page' },
    { id: 'backend-offer', layer: 'convert', label: 'Backend Offer', x: S, y: 1548, w: CW, h: CH, tilt: 1,
      job: 'Your core service, sold to a reader who has already paid you twice.' },

    { id: 'rb-optin', layer: 'side', label: 'Reader Bonus Opt-in', x: P, y: 1828, w: CW, h: 132,
      job: 'Claims the bonus the book promises, in exchange for an email.' },
    { id: 'rb-thanks', layer: 'side', label: 'Bonus Delivery', x: P, y: 1992, w: CW, h: 132,
      job: 'Hands over the bonus and adds the reader to your list.' },
    { id: 'sip-page', layer: 'side', label: 'SIP Sales Page', x: Q, y: 1828, w: CW, h: 132,
      job: 'Sells the plan on its own, with the survey that builds it.' },
    { id: 'sip-confirm', layer: 'side', label: 'SIP Confirmation', x: Q, y: 1992, w: CW, h: 132,
      job: 'Sends the buyer straight into the survey.' },
    { id: 'wl-optin', layer: 'side', label: 'Waitlist Opt-in', x: S, y: 1828, w: CW, h: 132,
      job: 'Collects emails before launch, against first access.' },
    { id: 'wl-confirm', layer: 'side', label: 'Waitlist Confirmation', x: S, y: 1992, w: CW, h: 132,
      job: 'Confirms the spot and sets the launch expectation.' }
  ];

  var GROUPS = [
    { id: 'side', x: 193, y: 1782, w: 1014, h: 360 }
  ];

  var SUBLABELS = [
    { text: 'Reader bonus',   x: P, y: 1804, needs: ['rb-optin', 'rb-thanks'] },
    { text: 'Standalone SIP', x: Q, y: 1804, needs: ['sip-page', 'sip-confirm'] },
    { text: 'Waitlist',       x: S, y: 1804, needs: ['wl-optin', 'wl-confirm'] }
  ];

  /* Both chip strips sit inside their card. */
  var CHIPS = { x: 450, y: 1080, w: 500, h: 62, count: 21 };
  var AD_CHIPS = { x: 82, y: 156, w: 460, h: 28, count: 10 };

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
    { a: 'one-click-2:r',      b: 'confirmation:b@0.5', via: [[1195, 560]] },

    { a: 'confirmation:b@0.35', b: 'reader-portal:t', via: [[1151, 662], [370, 662]] },
    { a: 'reader-portal:r@0.4167', b: 'scorecard:l', label: 'in-book CTA', lx: 600, ly: 766 },

    { a: 'reader-portal:b',    b: 'email-sequence:t@0.5', via: [[370, 940], [700, 940]] },
    { a: 'email-sequence:r',   b: 'scorecard:b@0.5', via: [[1030, 1099]],
      label: 'from the emails', lx: 1040, ly: 962 },
    { a: 'email-sequence:b@0.3926', b: 'plan-page:t@0.3' },
    /* The free scorecard feeds the paid diagnostic. Routed down the right so
       it clears the email card and stops short of the abandonment row. */
    { a: 'scorecard:b@0.8',    b: 'plan-page:t@0.7', via: [[1117, 1256], [758, 1256]] },

    { a: 'plan-page:r',        b: 'abandonment:l' },
    { a: 'abandonment:b@0.5',  b: 'plan-page:b@0.9', via: [[1030, 1478], [816, 1478]],
      label: 're-pitch', lx: 882, ly: 1458 },
    { a: 'plan-page:b@0.3',    b: 'survey:t', via: [[642, 1498], [370, 1498]] },

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
