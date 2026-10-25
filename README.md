# NaqshCAD

A browser-based 2D floor-plan and CAD editor that works entirely offline. No account, no server, no build step, no runtime network calls. Open `index.html` and draw.

NaqshCAD (formerly GNCAD) is aimed at architects, interior designers, builders and anyone who needs accurate plans with room areas, wall lengths, DXF output and printable scale drawings, in English or Persian.

## Highlights

- **Drawing:** walls (with thickness), rooms, doors, windows, stairs, dimensions, text, quick measure.
- **Editing:** move/rotate/resize, group, copy/paste/duplicate, mirror, offset, trim, linear and polar arrays, chamfer, true rounded fillet, undo/redo with a named, clickable history.
- **Library:** 129 furniture, fixture and MEP symbols, plus your own SVG symbols (sanitized, saved in the browser).
- **Wall graph:** automatic room detection from closed wall loops, rooms with holes, net floor areas, merge and normalize walls, drag a shared corner and everything connected follows.
- **Floors:** any number of floors, per-floor history, faint "floor below" overlay, all-floor export.
- **Reports:** quantity schedule (CSV), plan checks (gaps, open ends, overlaps, openings off walls), project comparison.
- **Output:** save/open `.gncad` (plain JSON), DXF import/export (one layer per floor), PNG, SVG, PDF, print at 1:20 to 1:200, share link (whole project inside the URL), 3D preview.
- **Comfort:** metric or feet-inches, light/dark/system theme, accent colors, autosave, large touch targets, pinch zoom, Persian interface with right-to-left panels and Persian digits.

## Quick start

1. Download the project folder.
2. Open `index.html` in a modern browser. Everything is vendored locally, including fonts.
3. Optional, for a local server (some browsers restrict `file://` features such as clipboard and compression):

   ```
   python3 -m http.server 8765
   ```

   then visit `http://localhost:8765/`.

Start drawing with **L** (wall) or **R** (room). Press **Esc** or double-click to finish a wall. Save with **File > Save Project**.

## Documentation

| Document | Audience | Contents |
|---|---|---|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Users | Complete guide: every tool, panel, setting and export |
| [docs/USER_GUIDE.fa.md](docs/USER_GUIDE.fa.md) | Persian-speaking users | Persian user guide |
| [docs/FILE_FORMAT.md](docs/FILE_FORMAT.md) | Integrators | Project file, share link, settings and storage formats |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Developers | Modules, data model, algorithms, design decisions |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Developers | Running, feature flags, rollback, extending, testing, releasing |
| [docs/PRIVACY_AND_SECURITY.md](docs/PRIVACY_AND_SECURITY.md) | Everyone | What is stored, what leaves the device (nothing), input sanitizing |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Everyone | Version history v15 to v25 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Contributors | Known limits and ideas |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Maintainers | Detailed hand-off notes |
| [tests/README.md](tests/README.md) | Developers | Browser and unit test scripts |

## Project layout

```
index.html              single page; all markup and modals
css/style.css           all styling, light/dark themes, mobile layout
js/main.js              application: canvas, tools, panels, floors, settings glue
js/config.js            constants and FEATURES flags
js/history.js           undo/redo with labeled steps and jump
js/wallgraph.js         wall graph engine (pure functions)
js/schedule.js          quantity schedule and CSV
js/planCheck.js         plan checks (pure functions)
js/units.js             metric / imperial formatting
js/settings.js          settings defaults, schema, validation
js/i18n.js, js/fa.js    runtime translation and Persian dictionary
js/viewer3d.js          dependency-free 3D preview
js/pdf.js               minimal PDF writer
js/share.js             share-link encoding (gzip + base64url)
js/dxf-exporter.js      DXF writer
js/io.js, js/symbols.js project save/load, symbol helpers
lib/                    Fabric.js, Clipper.js, dxf-parser (vendored)
assets/furniture/       furniture and symbol images
fonts/                  Inter and Vazirmatn (vendored)
docs/, tests/           documentation and test scripts
```

## Browser support

Developed and tested on Chromium. It uses standard modern APIs only (ES modules, Canvas 2D, ResizeObserver, pointer and touch events). Gzip share links use `CompressionStream` where available and fall back to uncompressed links elsewhere. Firefox and Safari are expected to work but have not been tested in this build.

## Privacy

Everything runs locally. Projects, settings, custom symbols and autosave live in your browser's storage or in files you save. Nothing is uploaded. See [docs/PRIVACY_AND_SECURITY.md](docs/PRIVACY_AND_SECURITY.md).

## License

MIT, see [LICENSE](LICENSE). Third-party components are listed in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
