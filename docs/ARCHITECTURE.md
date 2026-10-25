# Architecture

NaqshCAD is a static single-page application: HTML, CSS and ES modules, no build step and no framework. Fabric.js draws and manages objects on a canvas; everything else is plain JavaScript.

## 1. Design principles

1. **Offline first.** No runtime network calls, all libraries and fonts are vendored.
2. **Zero build.** Edit a file, reload. ES modules are loaded directly by the browser.
3. **Plain data.** Projects, settings, graphs and share links are JSON.
4. **Additive features behind flags.** Newer capabilities live in `FEATURES` (`js/config.js`) so they can be switched off without code changes.
5. **Old files keep opening.** New data (floors, graph) is stored beside the original canvas JSON, never instead of it.
6. **Pure logic is separate.** Graph, schedule, plan checks, units, PDF, share and settings are modules without DOM access and can be tested in Node.

## 2. Modules

| File | Role | DOM access |
|---|---|---|
| `js/main.js` | Application shell: canvas setup, tools, mouse/keyboard handling, panels, floors, graph UI, report, exports, settings wiring | yes |
| `js/config.js` | `PIXELS_PER_METER` (40), `GRID_SIZE` (20), `HISTORY_LIMIT`, `ROOM_FILL_COLORS`, `FEATURES` | no |
| `js/history.js` | Undo/redo stack, labels, jump-to-step, per-floor export/import of history | no (callbacks) |
| `js/wallgraph.js` | `buildGraph`, `graphStats`, `findFaces`, `findOuterBoundaries`, `faceInfo`, `mergeChains`, `chainsFromGraph`, `pointInPolygon` | no |
| `js/schedule.js` | `buildSchedule`, `scheduleTotals`, `scheduleToCsv` | no |
| `js/planCheck.js` | `runChecks` | no |
| `js/units.js` | Unit system state and formatting | no |
| `js/settings.js` | Defaults, schema, `sanitizeSettings`, load/save | localStorage only |
| `js/i18n.js` + `js/fa.js` | Runtime DOM translation and the Persian dictionary and patterns | yes |
| `js/viewer3d.js` | Canvas 2D 3D renderer with orbit and pinch | canvas element |
| `js/pdf.js` | Minimal PDF 1.4 writer embedding JPEG pages | no |
| `js/share.js` | gzip + base64url encoding of a project for URLs | no |
| `js/dxf-exporter.js` | DXF R12 writer with layers; loaded as a classic script | no |
| `js/io.js`, `js/symbols.js` | Project save/load, symbol helpers | file APIs |

`main.js` is large because it owns the canvas closure; features that can be isolated are extracted into pure modules and tested separately.

## 3. Coordinate system and data model

- Canvas units are pixels. **40 px = 1 m.** Y grows downward on screen and is flipped on DXF export.
- Every domain object is a Fabric object with a `data` property:

| `data.type` | Fabric type | Notes |
|---|---|---|
| `wall-system` | `polyline` | `strokeWidth` is the line weight (2, 5, 10 px); `data.layer`, optional `data.filletUndo` |
| `room` | `group` (rectangle + labels) or `polygon` | polygon rooms from the graph carry `graphKey` and `holes` |
| `door`, `window`, `stairs` | `group` | width in `data.width` where applicable |
| `furniture` | `image`, `group` or `path` | `data.name` |
| `user-group` | `group` | created by Ctrl+G |

Dimensions use `data.layer === 'dimensions'`. Temporary helpers are named `temp` or `snap-guide` and are never exported or saved.

Wall points are stored in the object's local space. Absolute points are `transform(point - pathOffset)` using `calcTransformMatrix()`. `getWallAbsPoints` and `wallAbsFromLocal` in `main.js` implement this and are used by every feature that reads walls.

## 4. State, history and floors

- `settings` (module `settings.js`) is a plain object persisted under `naqshcad-settings`. `applySetting(key)` maps each key to its side effect; `applyAllSettings()` runs at start.
- **History.** Each step stores the canvas JSON, a label and a summary (hash and kind per object). When no explicit label is given the label is derived by diffing summaries (*Add wall*, *Delete 3 objects*, *Edit Room*). `jumpTo(i)` rebuilds the undo and redo stacks around the chosen step.
- **Floors.** A floor is `{id, name, json, history, graph}`. Only the active floor lives on the canvas. Switching captures the canvas into the floor record (including its history and serialized wall graph) and loads the target. The project file keeps the active floor in `canvasData` and other floors in `meta.floors[i].json`.

## 5. Wall graph

Input is a list of polylines in absolute coordinates with thickness and layer.

1. **Split.** All segments are indexed in a uniform grid (cell size `max(4*tol, 64)` px). For each segment only segments in shared cells are tested. Cuts are made where another segment's endpoint lies within `tol` of the interior (T-junction) and where two segments properly intersect.
2. **Cluster.** Points within `tol` (4 px for analysis, 1.5 px for normalization) share a node, found with a hash grid.
3. **Edges.** Each cut piece becomes an edge between two nodes. Duplicate node pairs merge, keeping the larger thickness and remembering which wall objects contributed (overlap detection).
4. **Faces.** Dangling edges are pruned (degree 1, repeatedly). For each directed edge the next edge is the previous neighbour in angle order, which traces faces with the interior on one side. Positive signed area means an interior face, negative means the outer boundary of a connected component.
5. **Rooms.** Interior faces above a minimum area become rooms. The net polygon is the face inset by half the average boundary thickness using Clipper's offset (negative delta shrinks regardless of orientation).
6. **Holes.** For every outer boundary, the smallest interior face that contains one of its vertices and shares no node with it hosts it as a hole. The hole is outset by half its thickness and joined to the host with a zero-width bridge so the result is still one `fabric.Polygon` (non-zero fill, hole wound the opposite way). Area is the shoelace area of the bridged ring.
7. **Chains.** `chainsFromGraph` walks edges between nodes where the degree is not 2 or the thickness/layer changes; closed loops become polylines whose last point equals the first.
8. **Merge.** `mergeChains` joins only end-to-end pairs where exactly two wall endpoints meet, layer and thickness match and no other segment passes through the node.

Complexity is near linear for typical plans. A 5000-point polyline builds in about 0.3 s and a 12,800-edge worst case analyses in about 1 s.

### Persistence
When `graphPersist` is on, every captured floor stores `{version, authoritative, nodes[{x,y}], edges[{a,b,t,l}]}`. `authoritative` is true if graph form was on at save time. On load an authoritative graph is validated and used to rebuild the walls (`applyWallGraph`); invalid graphs are ignored.

## 6. Rendering details

- **Theme and recolor.** Colors come from CSS variables. Objects created with the theme's text color are recolored when the theme changes (`applyThemeRecolor`), including stored floors and history.
- **Overlays outside the object tree.** The ghost floor, the plan-check pulse and snap guides are drawn in `after:render` (or on a separate crosshair canvas) so they are never serialized.
- **Resize.** A `ResizeObserver` on the canvas container resizes the Fabric canvas and rulers. `--app-height` (from `visualViewport`) keeps the app inside the visible area on mobile browsers whose toolbars change the viewport; grid tracks use `minmax(0, 1fr)` so the canvas row can shrink.
- **Pinch.** Two-finger touch is handled on the upper canvas; while it is active the normal mouse handlers return early.
- **Bulk updates.** Operations that add many objects set `canvas.renderOnAddRemove = false` and render once.

## 7. Import, export and sharing

| Feature | Implementation |
|---|---|
| Project | `canvas.toJSON(['data','name'])` plus `meta`; see FILE_FORMAT.md |
| DXF export | `exportFloorsToDXF(groups)` writes LINE and LWPOLYLINE entities per layer with a LAYER table; Y negated |
| DXF import | `lib/dxf-parser.js` |
| PNG, SVG, PDF, multi-floor print | Floors are rendered on an off-screen `fabric.StaticCanvas` with strokes recolored to near-black on white; PDF pages are JPEG images written by `pdf.js` |
| Share link | project JSON gzipped (`CompressionStream`) and base64url encoded in `#p=`; an uncompressed `r` form is used when compression is unavailable |
| Compare | totals from `buildSchedule` for both projects; the other file is enlivened off-screen |
| Custom SVG | parsed with `DOMParser`, sanitized, stored in `naqshcad-custom-symbols`, rendered through `fabric.loadSVGFromString` |

## 8. Internationalization

`i18n.js` translates the live DOM instead of templating strings. It keeps the original text of every node it changes, translates exact matches from `FA` plus regular-expression patterns for messages with numbers, restores originals when switching back, and uses a `MutationObserver` to translate nodes the app adds later. Tracked nodes are held through weak references so nodes that were detached are still restored. Persian digits are applied as a post-step on text nodes only.

## 9. Trade-offs and known limits

- Wall storage is polylines (optionally in canonical graph form), not a separate model that all tools edit directly. Tools that move walls re-derive the graph.
- Rooms detected from the graph are measured to wall centre lines minus half thickness; they do not model wall materials.
- Labels already placed on the plan keep their text when units change (room rectangles refresh).
- The 3D preview is an extrusion viewer, not a renderer. It sorts faces by depth, so unusual overlaps can show ordering artifacts.
- Arcs created by fillet are polylines with one segment per 10 degrees (nine segments for a right-angle bend); very small radii (under about 1.5 px) collapse when normalized.
- Browser storage limits (about 5 MB) bound autosave, custom symbols and settings together.
