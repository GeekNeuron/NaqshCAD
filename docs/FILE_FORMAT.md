# NaqshCAD project file format (.gncad)

A project is plain JSON. Any text editor or script can read it.

```
{
  "canvasData": { ... },   // Fabric.js JSON of the active floor
  "meta": {
    "customLayers": [{ "id": "...", "name": "..." }],
    "activeFloorId": "floor-1",
    "floors": [
      { "id": "floor-1", "name": "Floor 1", "json": null, "graph": { ... } },
      { "id": "floor-2", "name": "Floor 2", "json": { ...Fabric JSON... }, "graph": { ... } }
    ]
  }
}
```

- `canvasData` always holds the active floor, so builds without floor support still open the file. For the active floor `meta.floors[i].json` is `null`.
- Lengths are in canvas pixels: 40 px = 1 metre.
- Every object carries `data.type` (`wall-system`, `room`, `door`, `window`, `stairs`, `furniture`, `user-group`) and `data.layer`.
- Walls are `polyline` objects. Rooms are `group` (rectangle) or `polygon` objects. Rooms found from wall loops have `data.graphKey`; rooms with holes have `data.holes`.
- `graph` (optional) is the explicit wall graph: `version`, `authoritative`, `nodes[{x,y}]`, `edges[{a,b,t,l}]` where `t` is thickness in px and `l` is the layer name. When `authoritative` is true the walls are rebuilt from it on load.
- Files without `meta` or without `graph` (older builds) load unchanged.

Settings live separately in the browser (`naqshcad-settings`) and can be exported from Settings.
