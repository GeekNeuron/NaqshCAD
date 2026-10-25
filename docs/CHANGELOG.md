# Changelog

Each version has a self-contained zip that can be used as a rollback point. Files saved by any version open in later versions.

## v25 (documentation release, same code as v24 plus one mobile fix)
- Full documentation set: README, user guides (English and Persian), architecture, development, file format, privacy and security, changelog, roadmap, test scripts.
- **Security fix:** a custom layer name in a project file or share link was inserted as HTML in v24 and earlier (a crafted file could run script). Names are now shown as text, ids are validated and escaped. Tested with a crafted file against v24 (script ran) and v25 (nothing runs).
- **Mobile layout fix:** the app height now follows the visible browser area (`visualViewport`), so the bottom tool bar no longer slides under the browser's bottom buttons; grid rows can shrink when the browser bars change; safe-area padding added.

## v24
- Persian hints, report and graph messages; names of the new library items.
- 3D preview draws doors, windows, furniture and stairs.
- Fillet, chamfer, SVG size and wall height inputs follow the unit system.
- Library: More Furniture (24), Vehicles & Outdoor (11). Room fills: Wood Planks, Checker Tile, Brick, Concrete.
- Performance: graph builder uses a spatial grid (about 8 times faster on dense curves, identical results on 300 random plans); bulk wall rebuilds render once (16.5 s to 2.7 s in the worst case).
- Fix: Persian text left behind after switching back to English for nodes that were detached; WeakRef fallback for older Safari.

## v23
- Units: metric or feet-inches. Two-finger pinch zoom and pan.
- Exports: PNG, SVG, multi-page PDF (own writer). Print all floors.
- Schedule and Plan Checks with CSV and a Show button for each finding.
- 20 MEP symbols. Copy Share Link. Compare with File. 3D Preview. Persian interface with RTL panels and Persian digits.
- File format document.
- Fixes: furniture could not be placed over a room; doors and windows could not be placed by clicking directly on a wall; room label update crash.

## v22
- Settings window (about 20 options) with theme moved there; autosave with restore; export, import and reset of settings.
- Mobile layout: horizontal bottom tool bar, modals fit the screen, canvas resizes with the window (it previously measured once).

## v21
- Explicit wall graph stored per floor in the project file; authoritative graphs rebuild walls on load.

## v20
- Normalize Walls and graph-form mode. Rooms with holes. Export All Floors as DXF. Print all floors.

## v19
- Move Corner tool. Live theme recolor of existing objects. Show floor below overlay.

## v18
- Wall graph engine and window: net areas, Detect Rooms, Merge Connected Walls.

## v17
- True rounded Fillet with per-wall revert (behind a feature flag).

## v16
- Multiple floors with per-floor history. Named history steps with jump. Fix: finishing a wall was not recorded in history.

## v15
- Import of custom SVG symbols into the library.

## Before v15
See PROJECT_STATUS.md for the earlier audit history, tooling added and module structure.
