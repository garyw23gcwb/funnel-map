# Funnel Ecosystem Map

One page that shows a client their whole funnel: ads, sales page, order form and
bump, one-click offer, confirmation, reader portal, what the book itself points
at, the email sequence, the plan page, the review call, and the side funnels.
Every piece is a box, wired to the pieces it feeds, with a line saying what it
does. Click a box and that page, document or ad account opens.

Same idea as Funnelytics or Geru, without the simulation. It replaces sending a
client a list of links.

## Files

| File | What it is |
| --- | --- |
| `docs/index.html` | The client-facing map. **Deployed.** |
| `docs/catalogue.js` | Every node, its position, its description, and the arrows between them. **Edit this to change what appears on the map.** Loaded by both the map and the builder, so they cannot drift apart. |
| `docs/clients/<slug>.json` | One per client: the links and their statuses. Written by the builder. |
| `docs/clients/demo.json` | Worked example, and the fallback when a slug is not found. |
| `builder.html` | Where you enter the links. Opened locally from Finder, never deployed. |
| `docs/logo.png` | bookfunnels.io logo shown on the map. |
| `assets/` | Logo source files. |

Plain HTML, one `<style>` block, vanilla JS. No framework, no npm, no build step.
Edit the files directly.

## Building a client's map

1. Open `builder.html` by double-clicking it in Finder.
2. Fill in the client name, book title and slug (`jacqueline-oberst`).
3. Paste each link and set its status:
   - **Live** shows a green box the client can click.
   - **In review** shows an amber box, still clickable, marked "in review".
   - **Leave the link blank** and the box shows greyed out as "still to come".
   - **Off** removes the box and its arrows entirely, for pieces this client is
     not getting. Use it for the whole waitlist funnel if there is no launch, for
     example.
4. Optionally paste per-email links under "Email sequence". Without them, the
   sequence box links to the master doc and the 21 numbered chips are just
   markers.
5. **Preview map** opens the map in a new tab against what is currently in the
   form, before anything is saved.
6. **Download JSON** writes `<slug>.json`. Move it into `docs/clients/`, commit,
   push, and it is live.

The form autosaves to this browser as you type, keyed by slug, so closing the tab
does not lose an hour of pasting. **Load a file** reopens an existing
`<slug>.json` to edit it. Nothing is ever uploaded from the builder.

## Deploying

The domain lives in HighLevel, so the page is hosted separately and embedded.

1. Push this repo to GitHub (public: GitHub Pages needs it on the free plan).
2. Settings, Pages, deploy from `main` branch, `/docs` folder. GitHub Pages only
   accepts `/` or `/docs` as a source, which is why the built page lives in
   `docs/`. The page lands at `https://<user>.github.io/funnel-map/`.
3. Send the client `https://<user>.github.io/funnel-map/?c=jacqueline-oberst`, or
   build a HighLevel page holding a responsive iframe pointing at it.

The map posts its own height to the parent window
(`{type:'bfmap:height', height}`), because the page height is not fixed: the
board scales with width, and below 1000px it is replaced by a stacked list.

An unknown slug falls back to the demo map with a visible notice rather than a
blank page.

## Changing what is on the map

Everything structural is in `docs/catalogue.js`.

- `NODES` is the list of boxes. Each has an `id` (what the client JSON keys off),
  a `label`, a `job` line, a `layer`, and fixed `x/y/w/h` on a 1400-wide board.
  The board's height is worked out at render time from the nodes actually shown.
- `EDGES` is the arrows. `a` and `b` are anchors written `id:side`, where side is
  `t`, `b`, `l` or `r`, optionally with a fraction along that side
  (`one-click:b@0.72`) or a fixed number of pixels from the start of it
  (`ads:b@+145`, which holds its place whichever size that card is drawn at).
  `via` holds waypoints the arrow routes through, so wires can be steered around
  the boxes. An arrow is drawn only when both its boxes are shown, which is why
  switching a node off removes its wires too.
- `LAYERS`, `GROUPS` and `SUBLABELS` are the band titles, the box around the side
  funnels, and the small headings inside it. A layer is a heading in the
  narrow-screen list, not a row on the board: `delivery` and `inbook` sit side by
  side in the same band. The group box is drawn at the size the columns actually
  shown need, so its declared `w/h` is the full two-column, two-row maximum.
- `compact` on a node is the size it drops to when it has nothing to hold, with
  `holds` naming the flag in the client file that fills it. The ads card is only
  560 wide because of its ten ad chips; a client without `adPages` gets a
  standard card instead of a wide empty box.
- `optional: true` on a node keeps it hidden unless a client's file mentions it.
  Use it for anything most clients do not have, such as `one-click-2`, so adding
  a node does not put a phantom "still to come" box on every existing map.

The delivery band is the Tinybook shape: the reader gets the book in the portal,
then follows what the book points at across the same row, ending in `free-tool`
where the bonus is a hosted tool rather than a file. Give that node the client's
own `label`.

`scorecard` is the pre-Tinybook version of the same idea, a free tool the book
points at with no opt-in in front of it. It belongs to Jim's map, which was
handed over before the run above existed and is therefore frozen. It shares a
column with `rb-thanks`, which is safe only because no map has both: leave it out
of new clients.

`docs/index.html` loads `catalogue.js` and `app.js` with a timestamp on the end,
so an edit is live as soon as it is pushed. Only that small HTML shell can go
stale, and it holds no geometry. `builder.html` runs from Finder and reads the
file straight off disk.

Geometry deliberately lives here and not in the client files, so every client's
map has the same layout and only the links change. After moving anything, load
`?c=demo` and check nothing collides: the demo file has every node populated.

## Known limits

- Printing fits the board to the width of a landscape page. A board this tall
  will usually run onto a second page; shrinking it to one page makes the type
  too small to read.
- The map shows the buyer being handed the book and then entering the email
  sequence as a chain. In GoHighLevel both are actually triggered by the
  purchase. The chain reads more clearly on a client call and is not misleading.
- There is no plumbing layer (GHL workflows, tags, Stripe, Pixel, CAPI). This is
  a client-facing map, not an engineering diagram.
- No traffic or revenue modelling. The
  [Book Funnel ROI Calculator](../bookfunnel-roi-calculator) already does that,
  and could later overlay projected numbers onto these same nodes.
