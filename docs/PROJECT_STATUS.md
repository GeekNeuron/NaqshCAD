# NaqshCAD — Project Status & Handoff

**What it is:** A fully offline, zero-dependency, browser-based 2D CAD / floor-planning tool. Originally called GNCAD, renamed to **NaqshCAD** (from نقشه/"blueprint" — reads naturally in both Persian and English). Built for Dogtor: offline-first, zero external calls at runtime, bilingual Persian/English UI.

**Stack:** Vanilla JS (ES modules), Fabric.js 5.5.2 (vendored), no build step, no framework. Everything — fonts, icons, the DXF parser, the polygon-clipping library — is vendored locally under `lib/`, `fonts/`, `assets/`. No CDN calls anywhere.

**Latest delivered build:** v15 (`NaqshCAD-v25.zip`).

---

## How this project has been worked on (read this before continuing)

Every change this session was **built, loaded in a real headless browser (Playwright + Chromium), interacted with, and screenshotted** before being called done — not just reviewed as code. This caught a long list of real bugs that code review alone had missed (see "Bugs found" below). **Keep doing this.** Code that looks correct in this app has repeatedly turned out to be broken in the browser — Fabric.js's selection events, touch event shapes, and CSS grid ordering have all bitten this project in ways a code-only review would not catch.

Workflow used throughout: implement → `node --check` the JS → serve with `python3 -m http.server` → drive with Playwright → screenshot → look at the screenshot → fix → re-verify. Comments are stripped from the codebase after every change (see "Code conventions" below) and a final `grep` for stray `//` / `<!--` / `/* */` is run before packaging.

---

## Feature inventory (everything implemented, by category)

### Drawing tools
- Wall (multi-point polyline chains, 3 thickness options)
- Room (rectangle, draw-then-rotate two-step interaction)
- Door, Window (snap to nearest wall)
- Stairs
- Free Text annotation (click to place, double-click to re-edit; own "Annotations" layer)
- Dimension (click two points, persistent)
- Quick Measure (click two points, transient — no permanent object, just a readout)

### Editing / modify tools
- Select, Mirror, **real geometric Offset** (ClipperLib-based polygon inset/outset for rooms; perpendicular+miter offset math for walls — this replaced an old "clone and nudge" stub)
- Trim (scoped: wall-endpoint-to-nearest-wall only, not full polyline splitting — documented limitation, not a bug)
- **Chamfer** (straight-cut corner on a wall's interior vertex; modal for distance, click-near-a-corner interaction, stays active for multiple corners)
- Copy / Paste (Ctrl+C/V), Duplicate (Ctrl+D), Select All (Ctrl+A)
- Group / Ungroup (Ctrl+G / Ctrl+Shift+G) — tagged `data.type === 'user-group'` so built-in Room groups can never be accidentally ungrouped
- Lock / Unlock per object
- Align (6-way: left/h-center/right/top/v-center/bottom) for multi-selection, in the properties panel
- Arrow-key nudge (1px, or one grid unit with Shift)
- **Linear Array** and **Polar Array** (via a modal — count/spacing/direction for linear; count/radius/angle for polar)
- Delete (Delete/Backspace key, or a labeled button in the properties panel)

### Precision / navigation
- Snap to Grid (existing) and **Object Snap** (new — smart alignment guides to other objects' edges/centers while dragging, independent checkbox)
- Real pan (drag with Space held, or toggle the Pan button in the status bar — works with both mouse and touch)
- Zoom In/Out buttons in the status bar, plus mouse-wheel zoom
- Rulers (horizontal + vertical, correctly track pan/zoom — see bug history)
- Rotation snapping for furniture (15° increments)
- Furniture cannot be stretched non-uniformly (edge/midpoint resize handles removed; a scaling guard forces scaleY=scaleX even under Shift)

### Layers
- 4 built-in layers: Walls, Furniture, Dimensions, Annotations
- **User-created custom layers**: "+" button in the Layers panel, prompts for a name, gets its own visibility toggle and a remove (×) button
- A "Layer" dropdown in the object properties panel reassigns any selected object to any layer (built-in or custom)
- Deleting a custom layer reassigns its objects back to Furniture rather than orphaning them
- All of this persists through save/load

### Rooms
- Width/Height/Area, editable, auto-updating dimension labels
- Rotation (the draw-then-rotate interaction)
- **Hatch fill patterns**: Solid, Diagonal Hatch, Cross Hatch, Dots, Tile Grid — dropdown in the room properties panel, works for both rectangular and offset/polygon-shaped rooms, generated as small `fabric.Pattern` tiles. Base color tracked separately (`data.baseColor`) so pattern switches don't lose it.

### File / I/O
- Save/Load project (`.gncad` — JSON, wrapped as `{canvasData, meta}`; backward-compatible with old plain-canvas-JSON saves)
- Import DXF (LINE/LWPOLYLINE entities)
- Export as DXF (walls, rooms incl. polygon rooms, doors/windows/stairs bounding boxes, dimensions)
- Export Image (PNG/JPG, adjustable resolution multiplier)
- **Print with Scale**: File menu → "Print with Scale...". Modal for scale (1:20/50/100/200), paper size (A4/Letter), orientation; live "fits the page" check computed from the actual full-drawing bounding box (not just the visible viewport). Forces a white background and dark strokes/text for the printed output regardless of current on-screen theme (object colors are set once at creation time, not live-bound to CSS, so this required an explicit deep object-tree color override, not a theme-class toggle).

### Furniture / symbol library
- **Custom SVG symbol import (v15):** "Import SVG Symbol" button at the top of the Assets panel. Picks an `.svg` (max 300 KB), shows a preview in a modal (`#svg-modal`), asks for a name and on-plan size in meters (longest side), then saves it under a "Custom" category (listed first). Library is stored in `localStorage` (`naqshcad-custom-symbols`, max 40 symbols) and survives reloads; each custom item has a hover "×" to remove it from the library (objects already placed stay on the plan). Every imported SVG is sanitized with `DOMParser` first (script/foreignObject/image/animation elements, `on*` attributes, `javascript:` and external `href`/`url()` references are stripped; a `viewBox` or width+height is required). On placement, black strokes/fills (and SVG default black) are remapped to the current `--text-primary` so they stay visible on the active theme; other colors are kept. Placed symbols are ordinary Fabric objects tagged `data.type === 'furniture'`, so save/load, DXF export, Object Snap and the properties panel work unchanged (round-trip verified).
36 → 62 detailed items. Two sources:
- A small set of generic items (piano, computer, printer, outdoor items, coat rack, cabinet, microwave) as hand-picked **Tabler Icons SVGs** (MIT), styled with `stroke="currentColor"` so they adapt to the theme automatically.
- The bulk of the library — **62 professionally-rendered top-down architectural icons** — sourced from `laanlabs/openPlan3D` (MIT). Its TypeScript canvas-drawing functions were compiled and run in a headless browser to rasterize PNGs (real sofas with cushion lines, beds with pillows/comforter, plus a full electrical/plumbing symbol set: outlets, switches, smoke detectors, water heater, gas line, ceiling fan, junction box, etc.). Rendered twice — first with a white stroke (invisible in light theme), then re-rendered with a theme-neutral gray (`#6b7280`) that reads on both themes.
- Categories: Living Room, Bedroom, Kitchen, Bathroom, Office, Dining, Decor, Lighting, Electrical & Plumbing, Outdoor.
- `placeFurniture()` and the asset-panel thumbnail renderer both branch on file extension to support PNG (`fabric.Image.fromURL`) alongside the original SVG path (inline-fetched so `currentColor` resolves, since a plain `<img>` tag can't do that).

### UI / theming / mobile
- Dark theme (Photoshop-style neutral grays, accent reserved for active states only) and light theme, dedicated toggle button
- Fully responsive: right panel becomes a slide-in drawer with backdrop under 860px, toggled from the header; status-bar checkbox labels abbreviate (not hide) under that breakpoint ("Show Rulers"→"Rulers" etc.)
- Toolbar/ruler/canvas column order follows the correct Photoshop/CAD convention: `[Toolbar][Ruler][Canvas]`
- Tap-highlight and touch-callout disabled globally
- Smooth CSS transitions on modals, dropdowns, tool buttons, asset hover
- Self-hosted fonts: Inter (Latin) + Vazirmatn (Persian/Arabic script), full bilingual support with zero network calls
- All modals (Export, Array, Print, Chamfer) follow one consistent pattern (`#x-modal-overlay` / `#x-modal`, fadeIn + modalPop animations)

---

## Significant bugs found and fixed (worth knowing before touching related code)

1. **Ruler squeezed into the wrong grid column** — CSS `grid-template-areas` had Ruler/Toolbar in the wrong order.
2. **Dark theme painted almost all text pink** — `--text-primary` was wrongly set to the accent color.
3. **Properties panel never updated on click** — Fabric.js's real click-driven selection in this build does not reliably fire `selection:created`/`selection:updated`. Fixed via a `mouse:up`-driven sync. This also affected every *programmatic* `setActiveObject()` call (after drawing, placing furniture, offsetting, pasting, grouping) — all now go through one `setActiveAndSync()` helper so this class of bug can't silently reappear piecemeal.
4. **Every editable numeric field rendered blank** — a unit string like `" m"` was appended to a `type="number"` input's value, which browsers silently reject. Fixed by moving the unit to a separate visual suffix next to the input.
5. **DXF export crashed on any wall** — the exporter treated `fabric.Polyline` walls as if they were `fabric.Group`.
6. **Ruler broke after enough pan/zoom** — the ruler-drawing loop always started iterating from world-coordinate 0 regardless of the current pan offset; fixed to compute start/end from the actual current pan+zoom.
7. **Canvas panning didn't actually work at all** — `isGrabMode` only changed the cursor; there was no code that ever moved the viewport. Implemented real `canvas.relativePan`-based dragging.
8. **Touch-drag panning produced NaN** — touch events don't have `clientX`/`clientY` directly (only on `e.touches[0]`); added a `getClientPoint(e)` helper used everywhere pan/crosshair math happens.
9. **Text tool silently failed when clicking on an existing object** (e.g. inside a room — the single most natural use case, labeling a room) — a generic guard clause meant for other tools was blocking it, so keystrokes fell through to global tool shortcuts instead of typing (typing "Living Room" was literally triggering Rect/Offset/Mirror tool shortcuts letter by letter). Fixed by exempting `'text'`/`'measure'`/`'chamfer-active'` modes from that guard.
10. **Polar Array math bug** — first attempt used the object's own center as the rotation center, so all copies collapsed onto one point; fixed with an explicit Radius field and a correctly-computed separate center.
11. **Asset-panel furniture thumbnails rendered solid black** — used `<img src="*.svg">`, which can't resolve `stroke="currentColor"` (no CSS context for an `<img>`). Switched to inline-fetched SVG.

12. **Known limitation (not new):** object colors are fixed at creation time, so anything placed in the dark theme looks faint after switching to the light theme (and vice versa). This applies to custom symbols and built-in furniture alike; a live-recolor pass on theme toggle would fix it project-wide.

---

### v16-v18 additions
- **v16 Multi-floor + named History:** Floors panel (add, switch, rename by double-click, duplicate, delete). Each floor keeps its own canvas and undo history; the project file stores all floors in `meta.floors` (the active floor stays in `canvasData`, so older builds still open it). History panel lists labeled steps (explicit labels or auto-diffed "Add Wall / Edit Room / Delete 3 objects"); click any step to jump, steps after it stay redoable. Fixed an old bug: finishing a wall was never recorded in history.
- **v17 True Fillet (flag `FEATURES.fillet` in `js/config.js`):** tessellated arcs (10 degree steps) stored as ordinary polyline points, so Trim/Offset/DXF/Object Snap are unaffected. Radius is clamped when segments are short; works on closed-loop start corners. Rollback options: undo/History, "Revert Last Fillet" button in a wall's properties (stack in `data.filletUndo`), flag off, or the v16 zip.
- **v18 Wall graph (flag `FEATURES.wallGraph`):** `js/wallgraph.js` is a pure module that derives a planar graph (shared corners, T-junction/crossing splits, overlap dedupe) from the wall polylines on demand. Toolbar "Wall Graph" modal shows true wall length and net room areas, "Detect Rooms" creates polygon rooms from closed loops (net of wall thickness, tagged `data.graphKey`, no duplicates), "Merge Connected Walls" joins end-to-end walls so Chamfer/Fillet work across them. NOT done: wall storage is still polylines, not a graph source of truth; rooms with holes are not handled. Wall tool can now start on an existing wall; left toolbar scrolls.
- **v19 (flags `nodeEdit`, `liveRecolor`, `ghostFloor`):** "Move Corner" tool drags a shared wall corner or T-junction; every connected wall (a vertex is inserted where a wall passes through the node) follows live, auto-detected rooms (`data.graphKey`) are re-matched and rebuilt keeping their fill, one history step "Move corner". Theme toggle now recolors existing objects (current floor, other floors, history snapshots) so nothing stays faint after switching. "Show floor below" checkbox in Floors draws walls, rooms and stairs of the floor underneath as a faint non-editable overlay (never saved or exported).
- **v20 (flags `normalizeWalls`, `roomHoles`, `allFloorsExport`):** (1) Wall Graph modal gets "Normalize Walls": rewrites every wall as one polyline per graph edge chain (exact shared corners, overlaps removed, crossings split, chains broken only at junctions/free ends or thickness/layer changes) using `chainsFromGraph` in `js/wallgraph.js`; the checkbox "Keep walls in graph form automatically" (localStorage) does this after every drawn wall. This is the opt-in "graph as storage" mode; it drops `data.filletUndo` on touched walls. (2) Rooms with holes: a closed wall loop fully inside another, with no shared corners, becomes a hole in the host room (bridged ring in a normal `fabric.Polygon`, `data.holes`, net area subtracts the hole; perimeter in the properties panel counts the bridge twice). (3) File menu "Export All Floors as DXF" (one DXF layer per floor, `FLOOR_<n>_<name>`; `js/dxf-exporter.js` now takes a layer name and has a LAYER table) and Print modal checkbox "Print all floors (one page each)" (offscreen `fabric.StaticCanvas` per floor, shared bounding box so scale matches). 
- **v21 (flag `graphPersist`):** the project file now stores an explicit wall graph per floor (`meta.floors[i].graph`: `version`, `authoritative`, `nodes[{x,y}]`, `edges[{a,b,t,l}]`) next to the usual canvas JSON, so older builds still open the file (they ignore the graph). `authoritative` is true when "Keep walls in graph form automatically" was on at save time; on load such a graph is the source of truth and the wall objects are rebuilt from it (active floor immediately, other floors when first opened), which also repairs files whose wall objects were damaged or removed. Files without a graph (v15-v20) load exactly as before. The graph is validated on load (indices, thickness); invalid graphs are ignored. Computing it costs one `buildGraph` pass per save/floor switch.
- **v22 Settings + mobile:** gear button in the header opens Settings (`js/settings.js` holds defaults, schema and validation; UI is generated from `SETTINGS_SCHEMA`; stored in localStorage `naqshcad-settings`). Theme toggle moved there (Dark / Light / Match system, live recolor still applies). Options: accent color, large touch targets, reduce animations, grid/rulers/hints visibility, snap to grid, object snap on/off and distance, default wall thickness, default fillet radius and chamfer distance, graph auto form, floor-below overlay, autosave (off/1/5/10 min, also on tab hide, restore offer on startup, restore/delete in Settings), undo history length, confirm-before-delete, export/import/reset settings. The status-bar toggles and wall thickness picker stay in sync with Settings. Mobile (<=860px): the tool column became a horizontal scrollable bar above the status bar (44px targets, scroll shadows), the wall thickness picker opens above it, every modal fits the screen, and the canvas now resizes with the window (ResizeObserver; before, it only measured once at load).
- **v23 (competitor-gap batch):** units setting (metric / feet-inches) via `js/units.js` (panels, status bar, graph/report numbers, new labels; labels already on the plan keep their old text except room rectangles, which refresh); two-finger pinch zoom and pan on touch screens; File menu exports PNG, SVG and a multi-page PDF (`js/pdf.js` writes the PDF itself, JPEG pages, no library); "Schedule and Plan Checks" (`js/schedule.js`, `js/planCheck.js`): per-floor quantity table (rooms, wall length by weight, doors/windows by width, stairs, furniture) with CSV download, plus checks for gaps in walls, free ends, overlapping or tiny walls, doors/windows not on a wall, closed loops without a room, each with a "Show" button that pans to the spot; 20 new MEP symbols (category "MEP Symbols"); "Copy Share Link" puts the whole project in the URL hash (gzip + base64url, `js/share.js`, opens with a confirm; long for big plans); "Compare with File" shows a totals diff against another .gncad; "3D Preview" (`js/viewer3d.js`, canvas 2D, no library) extrudes walls per floor with orbit, zoom/pinch and a wall-height field; Persian UI (`js/fa.js`, `js/i18n.js`): Settings > Language and Persian digits, runtime translation of static UI and common labels (tool messages stay English), RTL panels and modals; `docs/FILE_FORMAT.md` documents the project file. Fixed pre-existing bugs: furniture could not be placed on top of a room, doors/windows could not be placed by clicking directly on a wall, and the room label updater crashed when a child had no `data`.
- Not feasible in an offline browser-only build: LiDAR/camera room scanning, real-time multi-user editing (needs a server), AI conversion of a plan photo or PDF into an editable plan, photoreal renders.
- **v24 (completion + risk pass):** tool hints, report/graph messages and 35 new library names are translated (pattern rules in `js/fa.js`); 3D preview now draws doors, windows, furniture and stairs as boxes; fillet/chamfer/SVG-size/wall-height inputs and the two default settings follow the unit system (stored in metres); library gained "More Furniture" (24) and "Vehicles & Outdoor" (11) SVG symbols; room fills gained Wood Planks, Checker Tile, Brick, Concrete. Risk fixes: `buildGraph` now uses a spatial grid (a 5000-point polyline went from 2.1 s to 0.26 s; verified identical to the old builder on 300 random plans); bulk wall rebuilds (Normalize, graph restore) no longer re-render per object (160-wall/12,800-edge worst case 16.5 s -> 2.7 s); language switch no longer leaves Persian text on nodes that were detached from the page; WeakRef fallback for old Safari. Not testable here: Firefox and Safari (only Chromium is installed in the build sandbox), real phones.
- **v25 (documentation + fixes):** full docs set in `docs/` (README at the root, user guides EN/FA, architecture, development, file format, privacy and security, changelog, roadmap) and `tests/` with the verification scripts. Fixes found while documenting and from a phone screenshot: (1) security: custom layer names from a project file or share link were inserted as HTML in v24 and earlier (script ran in a crafted file; confirmed against v24, fixed and re-tested), layer ids are now validated and CSS-escaped; (2) mobile: the app used `100vh`, which on phone browsers is taller than the visible area, so the bottom tool bar slid under the browser buttons. Height now follows `visualViewport` through `--app-height` (with `100dvh` fallback), grid tracks use `minmax(0, 1fr)` so the canvas row can shrink, safe-area padding added.

## Code conventions (please keep following these)

- **No comments anywhere** — JS, HTML, CSS, SVG assets. This was an explicit, repeated instruction. After every change, verify with:
  ```
  grep -n "//" js/*.js | grep -v "https://\|http://"
  grep -n "<!--" index.html
  grep -n "/\*" css/style.css
  ```
  All three should return nothing.
- **100% offline** — no CDN links, no runtime network calls. Anything new (fonts, icons, libraries) gets vendored into `lib/`/`fonts/`/`assets/` and committed to the repo, never linked.
- **Test in a real browser before calling anything done.** `node --check` only proves JS syntax, not behavior. Use Playwright: serve with `python3 -m http.server`, drive the page, screenshot, look at the screenshot.
- Icon style: Tabler Icons outline style (`stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, 24×24 viewBox), inlined as SVG (not `<img>`) wherever theme-adaptive coloring matters.
- Modal pattern: `#x-modal-overlay` + `#x-modal`, both start with class `hidden`, `fadeIn`/`modalPop` CSS animations, open/close via classList toggles — copy this pattern for any new modal rather than inventing a new one.
- New toolbar tool checklist: add the button in `index.html` → add to `crosshairModes` array if it needs a crosshair cursor → add a tooltip string in the `switch(mode)` block → add mouse:down handling → **check whether it needs exempting from the `if (o.target && o.target.selectable ...) return` guard near the top of `mouse:down`** (anything that should work when clicking on top of an existing object needs this, as bug #9 above shows).
- Any new interactive mode entered via a modal (see Array, Print, Chamfer) should NOT go through `setMode()` for its real activation — `setMode()` is for toolbar-button-driven mode switches and will reset things. Use a small dedicated activation function instead (see `activateChamferInteractiveMode()`).

---

## What's NOT done yet / possible next steps

Roughly in order of practicality:

1. **Multi-floor support** — the app currently has exactly one canvas/floor; no concept of floor switching or stacking.
2. **Named history steps** (Photoshop-style History panel with labeled undo steps) — currently just a plain linear undo/redo stack.
3. **True rounded Fillet** (an actual arc, not the straight-cut Chamfer that's implemented) — deliberately not done because it would require converting affected walls from `fabric.Polyline` to `fabric.Path` (for the arc segment), which risks breaking Trim/Offset/DXF export and anything else that assumes `wall.points` exists as a flat point array. If this is wanted, it should be scoped as its own careful pass with full regression testing of Trim/Offset/DXF-export afterward.
4. **The big one: a true wall-graph data model** (Corner/HalfEdge style, like `furnishup/blueprint3d`, which was cloned and reviewed earlier in this project for exactly this reason). Right now walls are independent `Polyline` objects with no shared-corner concept between separate wall chains. A real graph model would enable:
   - Automatic room detection from a closed loop of walls (instead of manually drawing a separate Room rectangle on top)
   - Correct multi-wall corner joins (today, Chamfer only works on a bend *within* one polyline — two separate wall objects that happen to touch don't know about each other)
   - Accurate total wall length / floor area calculations
   
   This is a genuine architecture rewrite, not an incremental feature — it would touch wall creation, trim, offset, chamfer, DXF export, and the properties panel all at once. It should **not** be attempted as a quick addition; it deserves its own dedicated, carefully-scoped session with the user's explicit buy-in on the scope, and heavy regression testing against everything listed above afterward.

---

## Where to pick up

The project folder is a flat static site (`index.html`, `css/style.css`, `js/*.js`, `lib/`, `fonts/`, `assets/`). No build step — edit and refresh. The latest zip is `NaqshCAD-v25.zip`. Read `/areas/gncad.md` in memory for the full version-by-version changelog if more historical detail is needed than what's summarized above.
