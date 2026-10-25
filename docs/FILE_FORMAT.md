# File and data formats

All formats are plain JSON or URL text. Nothing is binary except the PDF and PNG exports.

## 1. Project file (`.gncad`)

```
{
  "canvasData": { ... },
  "meta": {
    "customLayers": [{ "id": "...", "name": "..." }],
    "activeFloorId": "floor-1",
    "floors": [
      { "id": "floor-1", "name": "Floor 1", "json": null, "graph": { ... } },
      { "id": "floor-2", "name": "Floor 2", "json": { ... }, "graph": { ... } }
    ]
  }
}
```

- `canvasData` is the Fabric.js 5.5 JSON of the **active** floor, extended with each object's `data` and `name`. Builds without floor support open the file and see the active floor.
- For the active floor `meta.floors[i].json` is `null`; other floors hold their own Fabric JSON.
- `meta` may be absent (files from before floors existed) and `graph` may be `null`; both load as a single floor with no graph.
- Lengths are canvas pixels. **40 px = 1 m.** Y grows downward.

### Object conventions

| `data.type` | Fabric type | Extra data |
|---|---|---|
| `wall-system` | `polyline` | `layer`; `strokeWidth` = line weight (2 thin, 5 medium, 10 thick); optional `filletUndo` |
| `room` | `group` or `polygon` | `baseColor`, `hatchPattern` (`solid`, `diagonal`, `cross`, `dots`, `grid`, `wood`, `checker`, `brick`, `concrete`); polygon rooms from the graph add `graphKey` and `holes` |
| `door`, `window` | `group` | `width` in px |
| `stairs` | `group` | |
| `furniture` | `image`, `group` or `path` | `name` |
| `user-group` | `group` | |

Polyline points are in the object's local space. Absolute position is `transform(point - pathOffset, calcTransformMatrix())`.

### Wall graph (`meta.floors[i].graph`)

```
{
  "version": 1,
  "authoritative": true,
  "nodes": [{ "x": 120, "y": 80 }],
  "edges": [{ "a": 0, "b": 1, "t": 5, "l": "walls" }]
}
```

`a` and `b` are node indexes, `t` is thickness in px, `l` is the layer name. If `authoritative` is true the walls are rebuilt from the graph when the file is opened. Invalid graphs (bad indexes, non-numeric values, non-positive thickness) are ignored and the canvas walls are used.

## 2. Share link

`<page URL>#p=<code>`

`code` starts with a kind letter: `g` for gzip then base64url, `r` for raw UTF-8 then base64url (used when `CompressionStream` is unavailable). The payload is the same JSON as a project file. A link is only opened after the user confirms.

## 3. Settings export

A flat JSON object with the keys of `DEFAULT_SETTINGS` (see `js/settings.js`), for example:

```
{ "theme": "dark", "language": "en", "units": "metric", "wallThickness": 5, "autosave": 0 }
```

Unknown keys are dropped and invalid values fall back to defaults on import.

## 4. Browser storage keys

| Key | Content |
|---|---|
| `naqshcad-settings` | Settings object |
| `naqshcad-autosave` | `{ time, dirty, payload }` where `payload` has the project shape above |
| `naqshcad-custom-symbols` | Array of `{ id, name, sizeMeters, svg }` (sanitized SVG text), up to 40 |

## 5. CSV schedule

Header: `Floor,Category,Item,Quantity,Length_m,Area_m2`. UTF-8 with a byte-order mark. Categories: `Room`, `Walls`, `Doors`, `Windows`, `Stairs`, `Furniture`. Always metric regardless of the unit setting. For a room row, `Length_m` is the perimeter.

## 6. DXF export

AutoCAD R12 style ASCII DXF (`$ACADVER AC1009`). LINE entities for walls and dimension lines, LWPOLYLINE for rooms and bounding boxes of doors, windows, stairs and furniture. One LAYER per floor in the all-floors export (`FLOOR_<n>_<ascii name>`), `0` for a single-floor export. Units are the app's pixels (40 per metre) and Y is negated.

## 7. Compatibility rules

1. New data is added next to existing data, never replacing it.
2. Readers must ignore unknown keys.
3. A file saved by a newer build must still open in an older build with at most the loss of the new feature.
