# NaqshCAD User Guide

This guide covers every part of NaqshCAD. If you only need a fast start, read sections 1 to 3 and the shortcut table in section 17.

Contents: 1 Interface, 2 Navigation and scale, 3 Drawing, 4 Editing, 5 Furniture and symbols, 6 Layers, 7 Floors, 8 History, 9 Wall graph, 10 Schedule and plan checks, 11 Saving, opening and sharing, 12 Exporting and printing, 13 3D preview, 14 Settings, 15 Mobile and touch, 16 Persian interface, 17 Shortcuts, 18 Troubleshooting, 19 Glossary.

## 1. Interface

| Area | What it holds |
|---|---|
| Header | **File** menu, **Settings** (gear), Undo, Redo, and on narrow screens a panel toggle |
| Tool bar | Drawing and editing tools. A vertical column on the left on desktop, a horizontal scrolling bar at the bottom on phones |
| Canvas | The drawing area with rulers on the top and left edges |
| Right panel | **Floors**, **Layers**, **Properties** of the selected object, **History**, and the **Assets** library while the furniture tool is active |
| Status bar | Tool hints, cursor coordinates, zoom controls and the **Rulers**, **Snap**, **OSnap** toggles |

On screens narrower than 860 px the right panel slides over the canvas. Open it with the panel button in the header and tap outside it to close.

## 2. Navigation and scale

- **Scale:** the drawing is true to scale. 40 pixels equal 1 metre and the grid spacing is 0.5 m.
- **Pan:** hold **Space** and drag, use the **Pan Canvas** (hand) tool, or drag with two fingers on a touch screen.
- **Zoom:** mouse wheel (centred on the cursor), the **+** and **-** buttons in the status bar, or pinch with two fingers. Zoom ranges from 10 % to 1000 %.
- **Rulers:** show distances in the current unit system. Toggle them with **Rulers** in the status bar or in Settings.
- **Snap:** **Snap** snaps to the 0.5 m grid. **OSnap** shows guide lines that align the object you move with nearby objects. Both can be toggled at any time.

## 3. Drawing

### 3.1 Walls (L)
1. Choose the wall tool and click to place the first point, then click each following point.
2. Finish with **Esc**, a **double-click**, or by choosing another tool.
3. Pick the line weight from the small popover next to the tool: **Thin**, **Medium** (default) or **Thick**.

Walls are polylines. They can touch other walls end to end, cross them or branch off them; the wall graph (section 9) understands all of these. You can start a new wall directly on an existing wall.

### 3.2 Rooms (R)
Drag to draw a rectangle, then move the mouse to set the rotation and click to finish. Width and height labels appear on the room. Rooms can also be created from closed wall loops (section 9.2).

### 3.3 Doors (P) and windows (W)
Click on or next to a wall. The opening snaps to the nearest wall and takes its angle. Doors show a swing arc. Width and other values are editable in the Properties panel.

### 3.4 Stairs (S)
Drag to draw a staircase footprint.

### 3.5 Dimensions (D), quick measure (Q) and text (X)
- **Dimension:** click two points to leave a dimension line with its length label.
- **Quick measure:** click two points to read a distance in the status bar without leaving anything on the plan.
- **Text:** click on the canvas to add a text label, then edit it in place.

## 4. Editing

### 4.1 Selecting and the Properties panel
Use **Select (V)**. Click an object, or drag a rectangle around several. The **Properties** panel shows what applies to the selection: layer, size, area, perimeter, angle, fill pattern, lock/unlock and delete. Length and size fields follow your unit system and can be typed in.

Room fill patterns: Solid, Diagonal Hatch, Cross Hatch, Dots, Tile Grid, Wood Planks, Checker Tile, Brick, Concrete.

### 4.2 Clipboard and groups
| Action | Keys |
|---|---|
| Copy / Paste / Duplicate | Ctrl+C / Ctrl+V / Ctrl+D |
| Select all | Ctrl+A |
| Group / Ungroup | Ctrl+G / Ctrl+Shift+G |
| Delete | Delete or Backspace |
| Nudge | Arrow keys move by 1 px, Shift+Arrow by one grid step |

(Use Cmd instead of Ctrl on macOS.)

### 4.3 Transform and modify tools
- **Mirror (M):** mirror the selection. Follow the status-bar hints for the two points that define the mirror line.
- **Offset (O):** create a parallel copy of a wall, or an expanded copy of a room, at a distance you set. Follow the status-bar hints.
- **Trim (T):** click near the end of a wall to trim or extend it to the nearest crossing wall.
- **Array:** open **Array Copy** for a **Linear** array (count, spacing, direction) or a **Polar** array (count, total angle) of the selected object.
- **Chamfer:** choose the tool, enter the cut distance, then click near a wall corner to cut it flat.
- **Fillet (rounded):** choose the tool, enter a radius, then click near a bend of a wall. The corner becomes a true arc (stored as short straight segments, so every other tool still works). If the neighbouring segments are too short the radius is reduced automatically and a message tells you. Select the wall and press **Revert Last Fillet** in Properties to undo the most recent fillet on that wall.
- **Move Corner:** drag a shared wall corner or T-junction; every connected wall follows and detected rooms update (section 9.5).

Chamfer and fillet work on interior corners of a polyline. If two walls meet end to end, use **Merge Connected Walls** first (section 9.3). The start corner of a closed loop can be filleted too.

## 5. Furniture and symbols

Press **A** (Place Furniture). The **Assets** panel lists 129 items in 13 categories: Living Room, Bedroom, Kitchen, Bathroom, Office, Dining, Decor, Lighting, Electrical & Plumbing, More Furniture, Vehicles & Outdoor, MEP Symbols, Outdoor. Click an item, then click on the canvas. You can place items on top of rooms.

### 5.1 Your own symbols
1. Click **Import SVG Symbol** at the top of the Assets panel and choose an `.svg` file (up to 300 KB).
2. Check the preview, enter a name and the size on the plan (longest side, in your current unit).
3. **Add to Library.** The symbol appears under **Custom**, at the top of the list.

Imported SVGs are sanitized: scripts, embedded images, animations, event handlers and external references are removed. Black strokes and fills are recoloured to the theme's text colour so symbols stay visible. Hover a custom symbol and click **x** to remove it from the library (symbols already placed on the plan stay). The library is stored in your browser, up to 40 symbols.

## 6. Layers

Default layers: **Walls**, **Furniture**, **Dimensions**, **Annotations**. Click the eye icon to hide or show a layer. Add your own with **+** next to **Layers** and assign an object to a layer in its Properties. Hidden layers are skipped by drawing tools and by exports that read the canvas.

## 7. Floors

The **Floors** panel manages stacked levels. Each floor has its own drawing and its own undo history.

| Action | How |
|---|---|
| Add a floor | **+** next to Floors |
| Switch floor | Click it |
| Rename | Double-click the name |
| Duplicate | Layers icon on the floor row |
| Delete | **x** on the floor row (asks first unless you disabled confirmations) |
| Show the floor below | Tick **Show floor below** to see its walls, rooms and stairs as a faint, non-editable overlay |

Layers are shared by all floors. Exports can include all floors (DXF, PDF, printing, schedule, 3D, comparison).

## 8. History

The **History** panel lists every step with a number and a name such as *Add wall*, *Fillet corner* or *Move corner*. Click any step to jump to that state. Steps after it stay available for redo until you make a new change. Undo and Redo (Ctrl+Z, Ctrl+Y) walk step by step. The length of the history is a setting (20 to 200 steps).

## 9. Wall graph

NaqshCAD can look at all walls on the current floor as a **graph**: corners (nodes) joined by wall segments (edges), where walls that touch, cross or branch share corners. Open it with the **Wall Graph** tool. The window shows:

- Number of wall objects and segments after splitting at crossings.
- Corners, junctions and free ends.
- **Total wall length** with overlaps counted once.
- **Closed rooms found** and the **net floor area** of each (measured inside the walls, subtracting half the wall thickness), the total, and each perimeter.

### 9.1 Detect Rooms
Click **Detect Rooms** to create a room polygon for every closed loop that does not already have one. A room already detected is not duplicated. If you later change the walls, delete the old room and detect again.

### 9.2 Rooms with holes
If a closed wall loop lies fully inside another one without sharing corners (an inner courtyard, a core or a column box), the outer room automatically excludes it. Its area is reduced accordingly and the inner loop becomes its own room.

### 9.3 Merge Connected Walls
Joins walls that meet end to end into one continuous wall, as long as they have the same layer and thickness and nothing else touches that corner. Afterwards chamfer and fillet work across those corners.

### 9.4 Normalize Walls and graph form
**Normalize Walls** rebuilds every wall as one polyline per chain between junctions or free ends: shared corners become exactly equal, overlapping duplicates disappear and crossings are split. Tick **Keep walls in graph form automatically** (also in Settings) to do this after each wall you draw. When a file is saved in this mode, the explicit graph is stored in it and used to rebuild the walls when the file is opened. Normalizing removes the per-wall fillet-undo memory, and corners with arcs smaller than about 1.5 px collapse.

### 9.5 Move Corner
Choose **Move Corner** and drag a corner or junction. All walls that end or pass there move together, a vertex is added where a wall passes through the point, and rooms made by Detect Rooms are rebuilt with their fill kept. The move is one history step.

## 10. Schedule and plan checks

**File > Schedule and Plan Checks** opens a report.

**Schedule (all floors):** per floor, each room with its perimeter and area, total room area, wall length by line weight, doors and windows grouped by width, stairs and furniture by name. **Download CSV** gives a spreadsheet-ready file (metric, UTF-8 with BOM so Persian text opens correctly in Excel).

**Plan checks (current floor):**

| Finding | Meaning |
|---|---|
| A wall ends X short of a corner / another wall | A gap you probably meant to close |
| Free wall end | A wall that ends in the open |
| Two or more walls overlap here | Duplicate walls |
| Very short wall segment | Under 0.15 m, usually a drawing slip |
| A door/window is not on any wall | An opening placed away from walls |
| A closed wall loop has no room | Use Detect Rooms |

Each finding has a **Show** button that closes the report and pans the canvas to the spot with a pulsing ring.

## 11. Saving, opening and sharing

- **Save Project** downloads a `.gncad` file (plain JSON, see FILE_FORMAT.md). It contains every floor, layers and, in graph form mode, the wall graph.
- **Load Project** opens a `.gncad` file and replaces the current canvas.
- **New Canvas** clears everything (asks first).
- **Import DXF** reads walls and lines from a DXF file.
- **Copy Share Link** copies a URL that contains the whole project, compressed. Whoever opens it is asked whether to open the plan. Large plans produce long links that some chat apps cut; use Save and send the file instead.
- **Compare with File** compares your project with another `.gncad` file: floors, rooms, room area, wall length, doors, windows, stairs and furniture, with the difference.
- **Autosave** (Settings) stores a copy in the browser every 1, 5 or 10 minutes and whenever the tab is hidden. At the next start you are offered a restore if the autosave is newer than your last Save. Settings also lets you restore or delete it.

## 12. Exporting and printing

| Command | Output |
|---|---|
| Export as DXF | Current floor as DXF lines and polylines |
| Export All Floors as DXF | One DXF, one layer per floor (`FLOOR_1_name`) |
| Export Image... | The canvas view as PNG or JPG with a resolution scale and JPG quality |
| Export Image (PNG) | Current floor, cropped to the drawing, dark lines on white, about 2400 px wide |
| Export Vector (SVG) | Current floor as SVG |
| Export PDF (all floors) | A multi-page PDF, one floor per page, same scale on every page |
| Print with Scale | Scales 1:20, 1:50, 1:100, 1:200; A4 or Letter; portrait or landscape; optional **all floors, one page each**. A hint tells you whether the drawing fits the page |

DXF units are the app's pixels (40 units = 1 m) and the Y axis is flipped to the CAD convention.

## 13. 3D preview

**File > 3D Preview** extrudes walls to a height you choose (default 2.7 m), colours room floors, and draws doors, windows, furniture and stairs as simple boxes. Drag to orbit, use the wheel or pinch to zoom, **Reset view** to return. Untick **All floors** to see only the current floor. It is a quick spatial check, not a rendering.

## 14. Settings

Open the gear icon. Everything is saved in your browser and applied immediately.

| Setting | Options | Default |
|---|---|---|
| **Appearance** | | |
| Theme | Dark, Light, Match system | Dark |
| Language | English, فارسی | English |
| Persian digits | On / Off | Off |
| Accent color | Theme default, Red, Blue, Green, Purple, Orange | Theme default |
| Large touch targets (Bigger buttons, useful on phones and tablets.) | On / Off | Off |
| Reduce animations | On / Off | Off |
| **Canvas** | | |
| Show grid | On / Off | On |
| Show rulers | On / Off | On |
| Show tool hints in the status bar | On / Off | On |
| Units (Panels, status bar and new labels. Fillet and chamfer inputs stay in metres.) | Metric (m), Imperial (ft-in) | Metric (m) |
| **Drawing** | | |
| Snap to grid | On / Off | On |
| Object snap guides | On / Off | On |
| Object snap distance (px) | 2 to 20 | 8 |
| Default wall thickness | Thin, Medium, Thick | Medium |
| Default fillet radius (m) | 0.05 to 10 | 0.5 |
| Default chamfer distance (m) | 0.05 to 10 | 0.3 |
| **Walls and floors** | | |
| Keep walls in graph form automatically (Rebuilds walls as clean graph chains after each wall you draw.) | On / Off | Off |
| Show the floor below as a faint overlay | On / Off | Off |
| **Data and safety** | | |
| Autosave to this browser (Also saves when the tab is hidden. Stored locally, never uploaded.) | Off, Every minute, Every 5 minutes, Every 10 minutes | Off |
| Undo history length | 20 steps, 50 steps, 100 steps, 200 steps | 50 steps |
| Ask before deleting floors or clearing the canvas | On / Off | On |
| Restore autosave | button | |
| Delete autosave | button | |
| Export settings | button | |
| Import settings | button | |
| Reset to defaults | button | |

Settings can be exported and imported as a small JSON file and reset to defaults.

## 15. Mobile and touch

- The tool bar is a horizontal strip at the bottom; scroll it sideways. The wall thickness choices open above it.
- **Pinch** to zoom and drag with **two fingers** to pan. Single-finger input draws and selects.
- Turn on **Large touch targets** in Settings for bigger buttons.
- The canvas resizes when you rotate the device.
- Rooms, walls and furniture can be placed with taps; the status bar hints still guide each step.

## 16. Persian interface

In Settings choose **Language > فارسی**. The interface, tool names, history entries, library names and most messages are translated, and panels and windows switch to right-to-left. **Persian digits** shows numbers in Persian numerals (the canvas, rulers and number fields keep standard digits). Switch back to English at any time. Some native alert boxes and the names you type yourself are not translated.

## 17. Keyboard shortcuts

| Key | Action |
|---|---|
| V | Select |
| L | Wall |
| R | Room |
| P | Door |
| W | Window |
| S | Stairs |
| D | Dimension |
| A | Furniture |
| X | Text |
| M | Mirror |
| O | Offset |
| T | Trim |
| Q | Quick measure |
| Space (hold) | Pan |
| Esc | Finish wall or cancel the current shape |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+C / V / D / A | Copy / Paste / Duplicate / Select all |
| Ctrl+G / Ctrl+Shift+G | Group / Ungroup |
| Delete, Backspace | Delete selection |
| Arrows (+Shift) | Nudge by 1 px (by one grid step) |

## 18. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| Detect Rooms finds nothing | The loop is not closed. Open the report, run the plan checks and close the gaps it lists |
| A door will not appear | Choose the door tool and click on or next to a wall; if no wall is near it is ignored |
| Fillet says the corner cannot be rounded | The bend is almost straight, or the walls are separate objects. Merge Connected Walls first |
| Labels did not change when I switched units | Labels already on the plan keep their text, except room rectangles which refresh |
| The share link is very long | Large plans give large links. Use Save and send the file |
| Autosave failed | Browser storage is full. Save to a file, then delete old autosave or custom symbols |
| The page looks wrong after changing language | Wait a moment; if text stays mixed, reload, your plan is kept by autosave |
| Nothing happens on a button | Check that a modal is not open behind another one; press Esc or the x |
| Plan is slow | Very dense curves create many segments. Reduce fillet segments by using fewer rounded corners, or split the plan across floors |

## 19. Glossary

- **Graph:** corners joined by wall segments.
- **Node / corner:** a point where walls meet or end.
- **Junction:** a node where three or more segments meet.
- **Net area:** room area measured inside the walls.
- **Normalize:** rebuild walls as clean graph chains.
- **Fillet / chamfer:** rounding / cutting a corner.
- **Floor below:** the level underneath, drawn faintly for reference.
