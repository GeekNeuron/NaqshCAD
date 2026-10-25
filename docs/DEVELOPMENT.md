# Development guide

## Run it

No install. Open `index.html`, or serve the folder:

```
python3 -m http.server 8765
```

Use a server when you test clipboard, compression or `file://` restrictions.

## Conventions

- Plain ES modules, no bundler, no new runtime dependencies. Vendor any library under `lib/` and list it in `THIRD_PARTY_LICENSES.md`.
- No code comments; names should carry the meaning.
- Pure logic goes in its own module with no DOM access.
- Anything user-visible and optional gets a `FEATURES` flag.
- Typographic and wording style: short sentences, no marketing language.
- Every length stored in the project is in pixels; convert with `PIXELS_PER_METER` and the helpers in `js/units.js` for display.

## Feature flags

`js/config.js`:

| Flag | Controls |
|---|---|
| `fillet` | Fillet tool |
| `wallGraph` | Wall Graph tool and window |
| `nodeEdit` | Move Corner tool |
| `liveRecolor` | Recolor objects when the theme changes |
| `ghostFloor` | "Show floor below" overlay |
| `normalizeWalls` | Normalize Walls and graph-form mode |
| `roomHoles` | Rooms with holes |
| `allFloorsExport` | Export All Floors as DXF |
| `graphPersist` | Store and restore the wall graph in project files |

Set a flag to `false` and reload. The matching buttons are removed and the rest of the app is unaffected.

## Rollback

Each release is a self-contained zip. To go back, deploy the earlier folder. Project files stay readable by older versions because new data is additive (`meta.floors`, `graph` are ignored by builds that do not know them). Settings are stored under their own key and are validated on load, so unknown or invalid values fall back to defaults.

## Adding things

**A furniture or symbol.** Add the image under `assets/furniture/` (SVG with `stroke="currentColor"`, 24x24 viewBox, works best), then add `{ id, name, file, sizeMeters }` to a category in `FURNITURE_CATALOG` in `main.js`. Add the Persian name to `js/fa.js`.

**A setting.** Add the key and default to `DEFAULT_SETTINGS`, an entry to `SETTINGS_SCHEMA` (toggle, select or number), and a handler in `settingApplyHandlers` in `main.js`. `sanitizeSettings` validates it automatically. Add translations for its label and options.

**A UI string.** Write it in English in the HTML or JS. For Persian add the exact string to `FA` in `js/fa.js`; for messages with numbers add a regular expression to `FA_PATTERNS`.

**A tool.** Add a button with id `<mode>-tool-btn` (the mode is the part before `-tool-btn`), handle the mode in `setMode`, and handle clicks in the `mouse:down` handler. If the tool must work when the pointer is over existing objects, add the mode to the guard at the top of `mouse:down`. Add the shortcut to the key switch and to this document and the user guides.

**A history label.** Pass it to `saveState('Label')`; without one it is derived by diffing.

## Testing

The `tests/` folder holds the scripts used during development; see `tests/README.md`. In short:

- **Unit tests (Node):** graph, holes, chains and an equivalence test of the graph builder against a reference on 300 random plans.
- **Browser tests (Playwright for Python, Chromium):** drawing, fillet and revert, wall graph, floors, history, settings, exports (PNG, SVG, PDF validity), schedule and checks, share link, compare, 3D, Persian switch and revert, units, pinch, touch drawing, rotation, system theme, full storage, malformed files, performance on dense plans.

Before a release run the whole set and check there are no console errors. Firefox, Safari and real phones need manual passes; they were not available in the build environment.

## Performance notes

- `buildGraph` is grid-accelerated; keep `tol` small relative to the cell size.
- Operations that add or remove many objects must set `canvas.renderOnAddRemove = false` and render once.
- Floor switching and project saving each run a graph build when `graphPersist` is on.
- History stores whole canvas JSON per step; the limit (default 50) bounds memory.

## Releasing

1. Update `docs/CHANGELOG.md` and `docs/PROJECT_STATUS.md`.
2. Run the test set.
3. Zip the folder as `NaqshCAD-vNN.zip`. Keep earlier zips as rollback points.
4. If the file format changed, update `docs/FILE_FORMAT.md` and keep the change additive.
