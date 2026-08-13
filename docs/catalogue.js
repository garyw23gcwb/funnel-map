/* ------------------------------------------------------------------
   The funnel node catalogue: the single source of truth for what
   appears on the map and where it sits.

   Loaded by BOTH docs/index.html (the client-facing map) and
   builder.html (where the links are entered), so the two can never
   drift apart. Add a node here and it shows up in both.

   Layout: the book funnel runs left to right across the top, the way a
   buyer moves through a checkout. The delivery band under it runs the same
   way: the reader gets the book, then follows the calls to action inside
   it. Everything after that continues downwards. Anything hanging off a
   step (the bump upgrade, a second upsell, the abandonment emails) sits
   directly below or beside its parent.

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
    /* The book's own calls to action. On the board they run across the
       delivery band, out of the portal; this title is the heading they get
       in the narrow-screen list. */
    { id: 'inbook',   title: 'What The Book Points To' },
    { id: 'followup', title: 'Follow-up' },
    { id: 'convert',  title: 'Conversion' },
    { id: 'side',     title: 'Side Funnels', lx: 216, ly: 1800 }
  ];

  var NODES = [
    /* Wide enough to hold the ten ad chips inside it, and left aligned so
       the arrow drops straight into the sales page below. `holds` names the
       flag in the client file that fills it; without the chips it falls back
       to `compact` rather than sitting there as a wide empty box. */
    { id: 'ads', layer: 'traffic', label: 'Meta Ads', x: A, y: 60, w: 560, h: 158,
      holds: 'adPages', compact: { w: CW, h: CH },
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

    /* A container, and the book itself as far as this map is concerned: the
       formats are slots inside this card rather than a node of their own.
       It starts the delivery band, and what the book points at follows it
       across the same row. */
    { id: 'reader-portal', layer: 'delivery', label: 'Reader Portal', x: P, y: 802, w: CW, h: 168,
      job: 'Where the buyer logs in and downloads.', cta: 'Open portal',
      slots: { x: 242, y: 932, w: 256, h: 28, items: [
        { id: 'file-pdf',   label: 'PDF',  title: 'The ebook, PDF' },
        { id: 'file-epub',  label: 'EPUB', title: 'The ebook, EPUB' },
        { id: 'file-mp3',   label: 'MP3',  title: 'The audiobook, MP3' },
        { id: 'file-m4b',   label: 'M4B',  title: 'The audiobook, M4B' },
        { id: 'file-extra', label: 'Bump', title: 'The bump upgrade content' }
      ] } },

    /* Legacy, and used by one map only. Jim's book was made before the free
       tool became the end of the reader-bonus run, and his map has been
       handed over, so this node holds the shape it was presented in. New
       clients get the run below instead, which is why this is optional and
       why it can share the row with `rb-thanks`: no map has both. */
    { id: 'scorecard', layer: 'delivery', label: 'The Scorecard', x: S, y: 802, w: CW, h: CH, optional: true,
      job: 'A free tool the book points readers to.' },

    /* The bonus run the book sends readers on, straight out of the portal,
       because the book carrying the CTA is delivered there. It fills the rest
       of the delivery row, and the tool at the end steps down to clear it. */
    { id: 'rb-optin', layer: 'inbook', label: 'Reader Bonus Opt-in', x: Q, y: 802, w: CW, h: CH,
      job: 'Claims the bonus the book promises, in exchange for an email.' },
    { id: 'rb-thanks', layer: 'inbook', label: 'Bonus Delivery', x: S, y: 802, w: CW, h: CH,
      job: 'Hands over the bonus and adds the reader to your list.' },
    /* Some bonuses hand over a hosted tool rather than a file, which makes
       the run three steps. Optional, so a two-step bonus is unaffected. */
    { id: 'free-tool', layer: 'inbook', label: 'The Free Tool', x: D, y: 982, w: CW, h: CH, optional: true,
      job: 'The tool itself, free, on its own page.' },

    { id: 'email-sequence', layer: 'followup', label: 'Email Sequence', x: 430, y: 1070, w: 540, h: 218,
      job: 'Twenty-one emails over thirty days. Delivers, builds the relationship, then makes the offer.' },
    { id: 'plan-page', layer: 'followup', label: 'Plan Page', x: Q, y: 1388, w: CW, h: CH, tilt: 2,
      job: 'The offer on its own URL, for readers who buy later from email.' },
    { id: 'abandonment', layer: 'followup', label: 'Abandonment Sequence', x: S, y: 1388, w: CW, h: CH,
      job: 'Three emails to anyone who opens the page and does not buy within 24 hours.', cta: 'Read the emails' },

    { id: 'survey', layer: 'convert', label: 'The Survey', x: P, y: 1628, w: CW, h: CH,
      job: 'Filled in by one-click buyers. The answers build the plan before the call.' },
    { id: 'review-call', layer: 'convert', label: 'Review Call', x: Q, y: 1628, w: CW, h: CH,
      job: 'Booked by one-click buyers only. No free calls, no cold prospects.', cta: 'Open booking page' },
    { id: 'backend-offer', layer: 'convert', label: 'Backend Offer', x: S, y: 1628, w: CW, h: CH, tilt: 1,
      job: 'Your core service, sold to a reader who has already paid you twice.' },

    /* What is left down here is the traffic that does not come through the
       book at all: a plan sold on its own, and a list built before launch. */
    { id: 'sip-page', layer: 'side', label: 'SIP Sales Page', x: P, y: 1908, w: CW, h: 132,
      job: 'Sells the plan on its own, with the survey that builds it.' },
    { id: 'sip-confirm', layer: 'side', label: 'SIP Confirmation', x: P, y: 2072, w: CW, h: 132,
      job: 'Sends the buyer straight into the survey.' },
    { id: 'wl-optin', layer: 'side', label: 'Waitlist Opt-in', x: Q, y: 1908, w: CW, h: 132,
      job: 'Collects emails before launch, against first access.' },
    { id: 'wl-confirm', layer: 'side', label: 'Waitlist Confirmation', x: Q, y: 2072, w: CW, h: 132,
      job: 'Confirms the spot and sets the launch expectation.' }
  ];

  /* The frame is drawn at the size the columns actually shown need, so the
     declared width and height are the three-column, three-row maximum:
     32px of clearance past the last card on every side. */
  var GROUPS = [
    { id: 'side', x: 193, y: 1862, w: 684, h: 374 }
  ];

  var SUBLABELS = [
    { text: 'Standalone SIP', x: P, y: 1884, needs: ['sip-page', 'sip-confirm'] },
    { text: 'Waitlist',       x: Q, y: 1884, needs: ['wl-optin', 'wl-confirm'] }
  ];

  /* Both chip strips sit inside their card. */
  var CHIPS = { x: 450, y: 1160, w: 500, h: 62, count: 21 };
  var AD_CHIPS = { x: 82, y: 156, w: 460, h: 28, count: 10 };

  /* Edges. `a` and `b` are anchors written as id:side, optionally with a
     fraction along that side (confirmation:b@0.35), or a fixed number of
     pixels from the start of that side (ads:b@+145) for a card whose size
     changes with what it holds. `via` holds waypoints in board coordinates.
     An edge is drawn only if both nodes are shown. */
  var EDGES = [
    /* Fixed at 145px so it drops into the middle of the sales page below
       whether the ads card is at its full width or its compact one. */
    { a: 'ads:b@+145',         b: 'sales-page:t' },

    { a: 'sales-page:r',       b: 'order-form:l' },
    { a: 'order-form:r',       b: 'one-click:l' },
    { a: 'one-click:r',        b: 'confirmation:l' },
    { a: 'order-form:b',       b: 'order-bump:t', dashed: true, arrow: false },
    { a: 'one-click:b',        b: 'one-click-2:t' },
    { a: 'one-click-2:r',      b: 'confirmation:b@0.5', via: [[1195, 560]] },

    { a: 'confirmation:b@0.35', b: 'reader-portal:t', via: [[1151, 712], [370, 712]] },
    { a: 'reader-portal:r@0.4167', b: 'scorecard:l', label: 'in-book CTA', lx: 600, ly: 846 },

    /* The book's own run: opt in, get the bonus, use the tool. It leaves the
       portal on the same side as the legacy scorecard wire, which no map
       draws at the same time. */
    { a: 'reader-portal:r@0.4167', b: 'rb-optin:l' },
    { a: 'rb-optin:r',         b: 'rb-thanks:l' },
    { a: 'rb-thanks:r',        b: 'free-tool:t', via: [[1195, 872]] },

    { a: 'reader-portal:b',    b: 'email-sequence:t@0.5', via: [[370, 1020], [700, 1020]] },
    /* No label: the arrow already leaves the email card, so saying so twice
       reads as noise. */
    { a: 'email-sequence:r',   b: 'scorecard:b@0.5', via: [[1030, 1179]] },
    { a: 'email-sequence:b@0.3926', b: 'plan-page:t@0.3' },
    /* The free scorecard feeds the paid diagnostic. Routed down the right so
       it clears the email card and stops short of the abandonment row. */
    { a: 'scorecard:b@0.8',    b: 'plan-page:t@0.7', via: [[1117, 1336], [758, 1336]] },

    { a: 'plan-page:r',        b: 'abandonment:l' },
    { a: 'abandonment:b@0.5',  b: 'plan-page:b@0.9', via: [[1030, 1558], [816, 1558]],
      label: 're-pitch', lx: 882, ly: 1538 },
    { a: 'plan-page:b@0.3',    b: 'survey:t', via: [[642, 1578], [370, 1578]] },

    { a: 'survey:r',           b: 'review-call:l' },
    { a: 'review-call:r',      b: 'backend-offer:l' },

    { a: 'sip-page:b',         b: 'sip-confirm:t' },
    { a: 'wl-optin:b',         b: 'wl-confirm:t' }
  ];

  return {
    BOARD_W: BOARD_W,
    LAYERS: LAYERS, NODES: NODES, GROUPS: GROUPS,
    SUBLABELS: SUBLABELS, CHIPS: CHIPS, AD_CHIPS: AD_CHIPS, EDGES: EDGES
  };
})();
