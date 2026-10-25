# Tests

These are the scripts used to verify NaqshCAD during development. They are plain scripts, not a framework.

## Requirements
- Node 18+ (unit tests)
- Python 3 with Playwright for Python and Chromium: `pip install playwright && python3 -m playwright install chromium`

## Unit tests (Node)

```
tests/run_unit_tests.sh
```

| File | Checks |
|---|---|
| `unit/graph_test.mjs` | square, four separate walls, crossing walls, dangling wall, shared sides, chain merge, T-junction blocking |
| `unit/graph_test2.mjs` | rooms with holes (outer boundaries, containment), chain normalization |
| `unit/equivalence_test.mjs` | the grid-accelerated graph builder gives the same stats and face areas as the earlier all-pairs builder on 300 random plans. Save an older `js/wallgraph.js` as `unit/wallgraph_reference.mjs` to run it |

## Browser tests (Chromium)

```
tests/run_browser_test.sh tests/browser/testS.py
```

The runner serves the project on `http://localhost:8765` and the scripts write their temporary files to `/tmp/t/` (the runner creates it). Each script prints results and the list of console or page errors (`errs []` or `[]` means none). Some files are inputs created by earlier scripts; run `testB`, `testC2`, `testE`, `testG` before `testI` if a file is missing.

| Script | Area |
|---|---|
| `testA`, `testA2` | floors, per-floor history, save and load, history jump |
| `testB`, `testB2` | fillet, revert, clamped radius, offset, DXF |
| `testC`, `testC2` | wall graph window, merge, detect rooms, fillet across merged walls, reload |
| `testD` | corner drag, theme recolor, floor-below (uses the old theme button, update before reuse) |
| `testE` | rooms with holes, normalize, auto graph form, all-floors DXF, multi-page print |
| `testF` | every feature flag set to false |
| `testG` | graph persistence, restore from graph, tampered and legacy files |
| `testH` | units, PNG, SVG and PDF validity |
| `testI` | schedule, CSV, plan checks, share link, compare, 3D |
| `testJ`, `testK` | furniture over rooms, door and window placement on walls |
| `testL`, `testN`, `testO3` | Persian interface, imperial inputs, language revert |
| `testM`, `testV` | mobile layout, toolbar, popover, rotation, visible-height handling |
| `testP` | two-finger pinch |
| `testS` | settings, persistence, autosave, export, import, reset |
| `testX` | HTML injection through layer names in a project file |
| `risk`, `risk2` | touch drawing, rotation, system theme, full storage, malformed inputs, history limits |
| `perf`, `perf2` | timing on large and dense synthetic plans (`python3 tests/browser/perf.py 80`) |

## Not covered
Firefox, Safari, and real phones were not available in the build environment. Run the browser scripts with `p.firefox` or `p.webkit` in place of `p.chromium` where those browsers are installed, and test touch on a device.
