# Roadmap and known limits

## Known limits
- Wall storage is polylines (optionally canonical graph chains). Tools edit walls directly; the graph is derived.
- The 3D preview is an extrusion viewer: no materials, lighting or openings cut into walls.
- Labels already on the plan keep their text when the unit system changes (room rectangles refresh).
- Persian translation covers the interface, messages, history and library; native alert boxes and user-entered names stay as typed.
- Perimeter of a room with holes counts the hole bridge twice in the Properties panel.
- Firefox, Safari and real phones have not been tested by the maintainers' automated runs.

## Not feasible in an offline browser-only build
- LiDAR or camera room scanning (needs a native app).
- Real-time multi-user editing (needs a server). The share link and Compare with File cover asynchronous sharing.
- AI conversion of a plan image or PDF into an editable plan (needs a model or service).
- Photorealistic rendering.

## Ideas
- Cut door and window openings into the 3D walls and add materials.
- Wall materials and layered wall types with automatic net areas per finish.
- Imperial inputs for every field; fractional inches.
- Section and elevation views from the 3D model.
- Symbol libraries as importable packs.
- Printing title blocks with project name, scale bar and north arrow.
- A tests folder runnable in CI with a headless browser matrix.
- Accessibility pass: keyboard-only drawing, screen-reader labels for tools.
