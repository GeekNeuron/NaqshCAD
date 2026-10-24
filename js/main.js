import { PIXELS_PER_METER, GRID_SIZE, SNAP_DISTANCE, ROOM_FILL_COLORS, FEATURES } from './config.js';
import { createHistoryManager } from './history.js';
import { setUnitSystem, lengthUnit, areaUnit, toDisplayLength, fromDisplayLength, toDisplayArea, formatLabel, formatLength, formatArea } from './units.js';
import { setLanguage } from './i18n.js';
import { buildPdf, dataUrlToBytes } from './pdf.js';
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA, loadSettings, saveSettings, sanitizeSettings } from './settings.js';
import { buildSchedule, scheduleTotals, scheduleToCsv } from './schedule.js';
import { runChecks } from './planCheck.js';
import { encodeShare, decodeShare } from './share.js';
import { createViewer } from './viewer3d.js';
import { buildGraph, graphStats, findFaces, findOuterBoundaries, pointInPolygon, chainsFromGraph, faceInfo, mergeChains } from './wallgraph.js';
import { saveProject, loadProject, importDxf } from './io.js';
import { createDoorSymbol as createDoorSymbolBase, createWindowSymbol as createWindowSymbolBase, createStairsSymbol as createStairsSymbolBase, createDimensionObject as createDimensionObjectBase } from './symbols.js';

const ICON_SVG_OPEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const ICON_EYE = ICON_SVG_OPEN + '<path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg>';
const ICON_SUN = ICON_SVG_OPEN + '<path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>';
const ICON_MOON = ICON_SVG_OPEN + '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" /></svg>';
const ICON_EYE_OFF = ICON_SVG_OPEN + '<path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" /><path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" /><path d="M3 3l18 18" /></svg>';
const ICON_LOCK = ICON_SVG_OPEN + '<path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6" /><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M8 11v-4a4 4 0 1 1 8 0v4" /></svg>';
const ICON_LOCK_OPEN = ICON_SVG_OPEN + '<path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -6" /><path d="M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M8 11v-5a4 4 0 0 1 8 0" /></svg>';
const ICON_TRASH = ICON_SVG_OPEN + '<path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
const ICON_X = ICON_SVG_OPEN + '<path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>';
const ICON_ALIGN_LEFT = ICON_SVG_OPEN + '<path d="M4 4l0 16" /><path d="M8 11a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2l0 -2" /></svg>';
const ICON_ALIGN_HCENTER = ICON_SVG_OPEN + '<path d="M12 4l0 5" /><path d="M12 15l0 5" /><path d="M6 11a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2l0 -2" /></svg>';
const ICON_ALIGN_RIGHT = ICON_SVG_OPEN + '<path d="M20 4l0 16" /><path d="M4 11a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2l0 -2" /></svg>';
const ICON_ALIGN_TOP = ICON_SVG_OPEN + '<path d="M4 4l16 0" /><path d="M9 10a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2l0 -8" /></svg>';
const ICON_ALIGN_VCENTER = ICON_SVG_OPEN + '<path d="M4 12l5 0" /><path d="M15 12l5 0" /><path d="M9 8a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2l0 -8" /></svg>';
const ICON_ALIGN_BOTTOM = ICON_SVG_OPEN + '<path d="M4 20l16 0" /><path d="M9 6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2l0 -8" /></svg>';
const ICON_STACK = ICON_SVG_OPEN + '<path d="M12 4l-8 4l8 4l8 -4l-8 -4" /><path d="M4 12l8 4l8 -4" /><path d="M4 16l8 4l8 -4" /></svg>';
const ICON_RULER = ICON_SVG_OPEN + '<path d="M19.875 12c.621 0 1.125 .512 1.125 1.143v5.714c0 .631 -.504 1.143 -1.125 1.143h-15.875a1 1 0 0 1 -1 -1v-5.857c0 -.631 .504 -1.143 1.125 -1.143h15.75" /><path d="M9 12v2" /><path d="M6 12v3" /><path d="M12 12v3" /><path d="M18 12v3" /><path d="M15 12v2" /><path d="M3 3v4" /></svg>';

document.addEventListener('DOMContentLoaded', () => {

let roomColorIndex = 0;

    function cssVar(name) {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    }

    function createDoorSymbol(x, y, angle = 0, width = PIXELS_PER_METER * 0.8) {
        return createDoorSymbolBase(fabric, canvas, cssVar, x, y, angle, currentStrokeWidth, width);
    }
    function createWindowSymbol(x, y, angle = 0, width = PIXELS_PER_METER * 1.2) {
        return createWindowSymbolBase(fabric, canvas, cssVar, x, y, angle, currentStrokeWidth, width);
    }
    function createStairsSymbol(x, y, width, height, angle = 0) {
        return createStairsSymbolBase(fabric, canvas, cssVar, x, y, width, height, angle);
    }
    function createDimensionObject(p1, p2) {
        return createDimensionObjectBase(fabric, canvas, p1, p2);
    }

    let currentMode = 'select';
    let currentLayer = 'walls';
    let currentStrokeWidth = 5;
    let isDrawing = false;
    let isDefiningAngle = false;
    let startPoint = null;
    let activeShape = null;
    let dimensionFirstPoint = null;
    let measureFirstPoint = null;
    let wallPoints = [];
    let tempWallLine = null;
    let lastMousePos = { x: 0, y: 0 };
    let clipboardData = null;
    let nudgeSaveTimer = null;
    let arrayTargetObject = null;
    let chamferDistance = 0.3;
    let filletRadius = 0.5;
    let customLayers = [];
    let isPanning = false;
    let lastPanPoint = null;

    const canvasContainer = document.getElementById('canvas-container');
    let settings = loadSettings();
    const panelContent = document.getElementById('panel-content');
    const panelPlaceholder = document.getElementById('panel-content-placeholder');
    const assetPanel = document.getElementById('asset-panel-container');
    const propertiesPanel = document.getElementById('properties-panel');
    const coordsDisplay = document.getElementById('coords-display');
    const zoomDisplay = document.getElementById('zoom-display');
    const toolTip = document.getElementById('tool-tip');
    const snapCheckbox = document.getElementById('snap-checkbox');
    const objectSnapCheckbox = document.getElementById('object-snap-checkbox');
    const showRulersCheckbox = document.getElementById('show-rulers-checkbox');
    const toolButtons = document.querySelectorAll('.tool-btn');
    const fileMenuBtn = document.getElementById('file-menu-btn');
    const fileMenuDropdown = document.getElementById('file-menu-dropdown');
    const newBtn = document.getElementById('new-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const exportBtn = document.getElementById('export-btn');
    const fileInput = document.getElementById('file-input');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const modalOverlay = document.getElementById('export-modal-overlay');
    const modal = document.getElementById('export-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const downloadBtn = document.getElementById('download-btn');
    const qualityWrapper = document.getElementById('quality-wrapper');
    const rulerTopCanvas = document.getElementById('ruler-top');
    const rulerLeftCanvas = document.getElementById('ruler-left');
    const crosshairCanvas = document.getElementById('crosshair-canvas');
    const wallThicknessSelector = document.getElementById('wall-thickness-selector');
    const importDxfBtn = document.getElementById('import-dxf-btn');
    const exportDxfBtn = document.getElementById('export-dxf-btn');
    const dxfFileInput = document.getElementById('dxf-file-input');

    const rulerTopCtx = rulerTopCanvas.getContext('2d');
    const rulerLeftCtx = rulerLeftCanvas.getContext('2d');
    const crosshairCtx = crosshairCanvas.getContext('2d');

    const canvas = new fabric.Canvas('gn-canvas', {
        width: canvasContainer.offsetWidth,
        height: canvasContainer.offsetHeight,
        backgroundColor: 'transparent',
        selectionColor: 'rgba(66, 133, 244, 0.3)',
        selectionBorderColor: '#4285f4',
        selectionLineWidth: 2,
    });

    function createGridPattern() {
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = GRID_SIZE;
        gridCanvas.height = GRID_SIZE;
        const ctx = gridCanvas.getContext('2d');
        if (settings.showGrid) {
            ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--grid-color').trim();
            ctx.lineWidth = 0.5;
            ctx.strokeRect(0.5, 0.5, GRID_SIZE, GRID_SIZE);
        }
        return new fabric.Pattern({ source: gridCanvas, repeat: 'repeat' });
    }

    function withAlpha(rgba, alpha) {
        const match = rgba.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
        if (!match) return rgba;
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }

    function createHatchPattern(type, baseColor) {
        const size = (type === 'wood' || type === 'brick') ? 32 : 16;
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        ctx.fillStyle = withAlpha(baseColor, 0.15);
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = withAlpha(baseColor, 0.9);
        ctx.lineWidth = 1;
        if (type === 'diagonal') {
            ctx.beginPath();
            ctx.moveTo(0, size); ctx.lineTo(size, 0);
            ctx.moveTo(-size / 2, size / 2); ctx.lineTo(size / 2, -size / 2);
            ctx.moveTo(size / 2, size * 1.5); ctx.lineTo(size * 1.5, size / 2);
            ctx.stroke();
        } else if (type === 'cross') {
            ctx.beginPath();
            ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
            ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
            ctx.stroke();
        } else if (type === 'dots') {
            ctx.fillStyle = withAlpha(baseColor, 0.9);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'grid') {
            ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
        } else if (type === 'wood') {
            ctx.fillStyle = withAlpha(baseColor, 0.3);
            ctx.fillRect(0, 0, size, size);
            ctx.beginPath();
            [0, 8, 16, 24].forEach(y => { ctx.moveTo(0, y + 0.5); ctx.lineTo(size, y + 0.5); });
            ctx.moveTo(10, 0); ctx.lineTo(10, 8);
            ctx.moveTo(26, 8); ctx.lineTo(26, 16);
            ctx.moveTo(4, 16); ctx.lineTo(4, 24);
            ctx.moveTo(20, 24); ctx.lineTo(20, 32);
            ctx.stroke();
        } else if (type === 'checker') {
            ctx.fillStyle = withAlpha(baseColor, 0.55);
            ctx.fillRect(0, 0, size / 2, size / 2);
            ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
        } else if (type === 'brick') {
            ctx.fillStyle = withAlpha(baseColor, 0.3);
            ctx.fillRect(0, 0, size, size);
            ctx.beginPath();
            [0, 8, 16, 24].forEach(y => { ctx.moveTo(0, y + 0.5); ctx.lineTo(size, y + 0.5); });
            [[0, 8], [16, 24]].forEach(([a, b]) => {
                ctx.moveTo(a === 0 ? 0.5 : 16.5, 0); ctx.lineTo(a === 0 ? 0.5 : 16.5, 8);
                ctx.moveTo(b === 8 ? 8.5 : 24.5, 8); ctx.lineTo(b === 8 ? 8.5 : 24.5, 16);
            });
            ctx.moveTo(0.5, 16); ctx.lineTo(0.5, 24);
            ctx.moveTo(16.5, 16); ctx.lineTo(16.5, 24);
            ctx.moveTo(8.5, 24); ctx.lineTo(8.5, 32);
            ctx.moveTo(24.5, 24); ctx.lineTo(24.5, 32);
            ctx.stroke();
        } else if (type === 'concrete') {
            ctx.fillStyle = withAlpha(baseColor, 0.7);
            [[2, 3], [7, 11], [12, 5], [4, 14], [14, 13], [9, 8], [1, 9], [15, 2], [6, 1], [11, 15]].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 0.8, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        return new fabric.Pattern({ source: c, repeat: 'repeat' });
    }

    function applyRoomFill(obj, fillTarget, pattern) {
        const baseColor = (obj.data && obj.data.baseColor) || ROOM_FILL_COLORS[0];
        obj.data.hatchPattern = pattern;
        fillTarget.set('fill', pattern === 'solid' ? baseColor : createHatchPattern(pattern, baseColor));
        canvas.renderAll();
        saveState();
    }

    function createFillPatternSelect(obj, fillTarget) {
        const propItem = document.createElement('div');
        propItem.className = 'prop-item';
        const label = document.createElement('label');
        label.innerText = 'Fill Pattern';
        propItem.appendChild(label);
        const select = document.createElement('select');
        [['solid', 'Solid'], ['diagonal', 'Diagonal Hatch'], ['cross', 'Cross Hatch'], ['dots', 'Dots'], ['grid', 'Tile Grid'], ['wood', 'Wood Planks'], ['checker', 'Checker Tile'], ['brick', 'Brick'], ['concrete', 'Concrete']].forEach(([value, text]) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.innerText = text;
            if ((obj.data && obj.data.hatchPattern || 'solid') === value) opt.selected = true;
            select.appendChild(opt);
        });
        select.addEventListener('change', (e) => applyRoomFill(obj, fillTarget, e.target.value));
        propItem.appendChild(select);
        panelContent.appendChild(propItem);
    }

    function setupRulers() {
        rulerTopCanvas.width = canvasContainer.offsetWidth;
        rulerTopCanvas.height = 20;
        rulerLeftCanvas.width = 20;
        rulerLeftCanvas.height = canvasContainer.offsetHeight;
        crosshairCanvas.width = canvasContainer.offsetWidth;
        crosshairCanvas.height = canvasContainer.offsetHeight;
        drawRulers();
    }
    
    function drawRulers() {
        const rulersVisible = showRulersCheckbox.checked;
        rulerTopCanvas.style.display = rulersVisible ? 'block' : 'none';
        rulerLeftCanvas.style.display = rulersVisible ? 'block' : 'none';
        document.getElementById('ruler-corner').style.display = rulersVisible ? 'block' : 'none';

        if (!rulersVisible) return;

        const zoom = canvas.getZoom();
        const vpt = canvas.viewportTransform;
        const panX = vpt[4];
        const panY = vpt[5];
        const fontColor = getComputedStyle(document.body).getPropertyValue('--ruler-text').trim();
        const bgColor = getComputedStyle(document.body).getPropertyValue('--ruler-bg').trim();
        
        rulerTopCtx.clearRect(0, 0, rulerTopCanvas.width, rulerTopCanvas.height);
        rulerTopCtx.fillStyle = bgColor;
        rulerTopCtx.fillRect(0,0, rulerTopCanvas.width, rulerTopCanvas.height);
        rulerTopCtx.font = "10px Inter";
        rulerTopCtx.fillStyle = fontColor;
        rulerTopCtx.strokeStyle = fontColor;
        rulerTopCtx.lineWidth = 0.5;
        
        const startX = Math.floor((-panX / zoom) / GRID_SIZE) * GRID_SIZE;
        const endX = (rulerTopCanvas.width - panX) / zoom;
        for (let i = startX; i < endX; i += GRID_SIZE) {
            const screenX = i * zoom + panX;
            if (screenX > rulerTopCanvas.width) break;
            if (screenX < 0) continue;
            rulerTopCtx.beginPath();
            rulerTopCtx.moveTo(screenX, 15);
            rulerTopCtx.lineTo(screenX, 20);
            rulerTopCtx.stroke();
            if (Math.round(i / GRID_SIZE) % 2 === 0) {
                 const meter = Math.round(i / PIXELS_PER_METER);
                 rulerTopCtx.fillText(`${meter}`, screenX + 2, 12);
            }
        }

        rulerLeftCtx.clearRect(0, 0, rulerLeftCanvas.width, rulerLeftCanvas.height);
        rulerLeftCtx.fillStyle = bgColor;
        rulerLeftCtx.fillRect(0,0, rulerLeftCanvas.width, rulerLeftCanvas.height);
        rulerLeftCtx.font = "10px Inter";
        rulerLeftCtx.fillStyle = fontColor;
        rulerLeftCtx.strokeStyle = fontColor;
        rulerLeftCtx.lineWidth = 0.5;

        const startY = Math.floor((-panY / zoom) / GRID_SIZE) * GRID_SIZE;
        const endY = (rulerLeftCanvas.height - panY) / zoom;
        for (let i = startY; i < endY; i += GRID_SIZE) {
            const screenY = i * zoom + panY;
            if (screenY > rulerLeftCanvas.height) break;
            if (screenY < 0) continue;
            rulerLeftCtx.beginPath();
            rulerLeftCtx.moveTo(15, screenY);
            rulerLeftCtx.lineTo(20, screenY);
            rulerLeftCtx.stroke();
            if (Math.round(i / GRID_SIZE) % 2 === 0) {
                 const meter = Math.round(i / PIXELS_PER_METER);
                 rulerLeftCtx.save();
                 rulerLeftCtx.translate(12, screenY + 2);
                 rulerLeftCtx.rotate(-Math.PI / 2);
                 rulerLeftCtx.fillText(`${meter}`, 0, 0);
                 rulerLeftCtx.restore();
            }
        }
    }
    
    function drawCrosshairs(pointer) {
        crosshairCtx.clearRect(0, 0, crosshairCanvas.width, crosshairCanvas.height);
        if (!showRulersCheckbox.checked || !pointer) return;
        
        crosshairCtx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent-primary').trim();
        crosshairCtx.lineWidth = 0.5;
        
        crosshairCtx.beginPath();
        crosshairCtx.moveTo(pointer.x, 0);
        crosshairCtx.lineTo(pointer.x, crosshairCanvas.height);
        crosshairCtx.moveTo(0, pointer.y);
        crosshairCtx.lineTo(crosshairCanvas.width, pointer.y);
        crosshairCtx.stroke();
    }

    const historyList = document.getElementById('history-list');
    const floorList = document.getElementById('floor-list');
    let floors = [{ id: 'floor-1', name: 'Floor 1', json: null, history: null }];
    let activeFloorId = 'floor-1';

    function renderHistoryPanel() {
        historyList.innerHTML = '';
        historyManager.getEntries().forEach((entry, i) => {
            const li = document.createElement('li');
            li.className = 'history-item' + (entry.current ? ' current' : '') + (entry.future ? ' future' : '');
            li.dataset.index = i;
            const num = document.createElement('span');
            num.className = 'history-num';
            num.textContent = i + 1;
            const text = document.createElement('span');
            text.textContent = entry.label;
            li.append(num, text);
            historyList.appendChild(li);
        });
        const cur = historyList.querySelector('.current');
        if (cur) historyList.scrollTop = Math.max(0, cur.offsetTop - historyList.clientHeight / 2);
    }

    const historyManager = createHistoryManager(canvas, {
        undoBtn, redoBtn,
        onRestore: () => { updatePropertiesPanel(canvas.getActiveObject()); drawRulers(); },
        onChange: renderHistoryPanel
    });
    const { saveState, undo, redo, updateUndoRedoButtons } = historyManager;

    historyList.addEventListener('click', (e) => {
        const li = e.target.closest('.history-item');
        if (li) historyManager.jumpTo(parseInt(li.dataset.index, 10));
    });

    function captureActiveFloor() {
        const floor = floors.find(f => f.id === activeFloorId);
        if (!floor) return;
        floor.json = canvas.toJSON(['data', 'name']);
        floor.history = historyManager.exportState();
        floor.graph = FEATURES.graphPersist ? serializeWallGraph() : null;
    }

    let ghostObjects = [];
    let ghostToken = 0;
    let showGhost = false;
    const ghostToggle = document.getElementById('ghost-floor-toggle');

    function rebuildGhost() {
        ghostObjects = [];
        ghostToken++;
        if (!FEATURES.ghostFloor || !showGhost) { canvas.requestRenderAll(); return; }
        const idx = floors.findIndex(f => f.id === activeFloorId);
        const below = idx > 0 ? floors[idx - 1] : null;
        if (!below || !below.json || !Array.isArray(below.json.objects)) { canvas.requestRenderAll(); return; }
        const wanted = below.json.objects.filter(o => o.data && ['wall-system', 'room', 'stairs'].includes(o.data.type));
        const token = ghostToken;
        fabric.util.enlivenObjects(JSON.parse(JSON.stringify(wanted)), (objs) => {
            if (token !== ghostToken) return;
            objs.forEach(o => { o.objectCaching = false; o.canvas = canvas; });
            ghostObjects = objs;
            canvas.requestRenderAll();
        });
    }

    canvas.on('after:render', (opt) => {
        if (!ghostObjects.length) return;
        const ctx = canvas.getContext();
        if (opt && opt.ctx && opt.ctx !== ctx) return;
        const v = canvas.viewportTransform;
        ctx.save();
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
        ctx.globalAlpha = 0.22;
        ghostObjects.forEach(o => o.render(ctx));
        ctx.restore();
    });

    if (FEATURES.ghostFloor) {
        ghostToggle.addEventListener('change', () => { showGhost = ghostToggle.checked; updateSetting('showFloorBelow', showGhost); rebuildGhost(); });
    } else {
        document.getElementById('ghost-floor-label').remove();
    }

    function renderFloorList() {
        floorList.innerHTML = '';
        floors.forEach(f => {
            const li = document.createElement('li');
            li.className = 'floor-item' + (f.id === activeFloorId ? ' active' : '');
            li.dataset.floor = f.id;
            const name = document.createElement('span');
            name.className = 'floor-name';
            name.textContent = f.name;
            name.title = 'Double-click to rename';
            const actions = document.createElement('span');
            actions.className = 'floor-actions';
            const dup = document.createElement('span');
            dup.className = 'floor-action floor-dup';
            dup.title = 'Duplicate floor';
            dup.innerHTML = ICON_STACK;
            const del = document.createElement('span');
            del.className = 'floor-action floor-del';
            del.title = 'Delete floor';
            del.innerHTML = ICON_X;
            actions.append(dup, del);
            li.append(name, actions);
            floorList.appendChild(li);
        });
        rebuildGhost();
    }

    function loadFloorIntoCanvas(floor, onDone) {
        const finish = () => {
            canvas.backgroundColor = createGridPattern();
            canvas.renderAll();
            syncLayerUI();
            drawRulers();
            updatePropertiesPanel(null);
            if (FEATURES.graphPersist && floor.graphPending) {
                floor.graphPending = false;
                applyWallGraph(floor.graph);
            }
            if (floor.history && floor.history.history.length) historyManager.importState(floor.history);
            else { historyManager.reset(); saveState('Start'); }
            renderFloorList();
            if (onDone) onDone();
        };
        if (floor.json) canvas.loadFromJSON(floor.json, finish);
        else { canvas.clear(); finish(); }
    }

    function switchFloor(id) {
        if (id === activeFloorId) return;
        const target = floors.find(f => f.id === id);
        if (!target) return;
        setMode('select');
        captureActiveFloor();
        activeFloorId = id;
        loadFloorIntoCanvas(target);
    }

    function addFloor() {
        const name = prompt('New floor name:', `Floor ${floors.length + 1}`);
        if (name === null) return;
        const floor = { id: 'floor-' + Date.now().toString(36), name: name.trim() || `Floor ${floors.length + 1}`, json: null, history: null };
        floors.push(floor);
        switchFloor(floor.id);
    }

    function duplicateFloor(id) {
        const src = floors.find(f => f.id === id);
        if (!src) return;
        setMode('select');
        captureActiveFloor();
        const copy = { id: 'floor-' + Date.now().toString(36), name: src.name + ' copy', json: src.json ? JSON.parse(JSON.stringify(src.json)) : null, history: null };
        floors.splice(floors.indexOf(src) + 1, 0, copy);
        switchFloor(copy.id);
    }

    function deleteFloor(id) {
        if (floors.length <= 1) { alert('A project needs at least one floor.'); return; }
        const idx = floors.findIndex(f => f.id === id);
        if (idx < 0) return;
        if (!askConfirm(`Delete "${floors[idx].name}"? This cannot be undone.`)) return;
        const wasActive = id === activeFloorId;
        floors.splice(idx, 1);
        if (wasActive) {
            const target = floors[Math.max(0, idx - 1)];
            activeFloorId = target.id;
            setMode('select');
            loadFloorIntoCanvas(target);
        } else {
            renderFloorList();
        }
    }

    function resetFloors() {
        floors = [{ id: 'floor-1', name: 'Floor 1', json: null, history: null }];
        activeFloorId = 'floor-1';
        renderFloorList();
    }

    function getProjectMeta() {
        captureActiveFloor();
        return {
            customLayers,
            activeFloorId,
            floors: floors.map(f => ({ id: f.id, name: f.name, json: f.id === activeFloorId ? null : f.json, graph: f.graph || null }))
        };
    }

    floorList.addEventListener('click', (e) => {
        const li = e.target.closest('.floor-item');
        if (!li) return;
        const id = li.dataset.floor;
        if (e.target.closest('.floor-dup')) duplicateFloor(id);
        else if (e.target.closest('.floor-del')) deleteFloor(id);
        else switchFloor(id);
    });

    floorList.addEventListener('dblclick', (e) => {
        const nameEl = e.target.closest('.floor-name');
        if (!nameEl) return;
        const floor = floors.find(f => f.id === nameEl.parentElement.dataset.floor);
        if (!floor) return;
        const name = prompt('Rename floor:', floor.name);
        if (name && name.trim()) { floor.name = name.trim(); renderFloorList(); }
    });

    document.getElementById('add-floor-btn').addEventListener('click', addFloor);
    renderFloorList();
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    function updatePropertiesPanel(obj) {
        panelContent.innerHTML = '';
        if (!obj) { panelContent.appendChild(panelPlaceholder); return; }
        if (obj.type === 'activeSelection') { renderMultiSelectionToolbar(obj); return; }
        if (!obj.data) { panelContent.appendChild(panelPlaceholder); return; }

        renderObjectToolbar(obj);
        const { layer, type } = obj.data;

        if (type === 'room') renderRectProperties(obj);
        else if (type === 'wall-system') renderPolylineProperties(obj);
        else if (layer === 'dimensions') renderDimensionProperties(obj);
        else if (type === 'door') renderDoorProperties(obj);
        else if (type === 'window') renderWindowProperties(obj);
        else if (type === 'stairs') renderStairsProperties(obj);
        else if (layer === 'furniture') renderFurnitureProperties(obj);
        else if (type === 'user-group') renderGroupProperties(obj);
        else if (type === 'text') renderTextProperties(obj);
    }

    function setActiveAndSync(obj) {
        canvas.setActiveObject(obj);
        updatePropertiesPanel(obj);
    }

    function toggleObjectLock(obj) {
        const locking = !obj.lockMovementX;
        obj.set({ lockMovementX: locking, lockMovementY: locking, lockScalingX: locking, lockScalingY: locking, lockRotation: locking, hasControls: !locking });
        canvas.renderAll();
        saveState();
        updatePropertiesPanel(obj);
    }

    function renderObjectToolbar(obj) {
        const toolbar = document.createElement('div');
        toolbar.className = 'panel-toolbar';
        const locked = !!obj.lockMovementX;
        const lockBtn = document.createElement('button');
        lockBtn.className = 'panel-action-btn panel-action-btn-half';
        lockBtn.title = locked ? 'Unlock' : 'Lock';
        lockBtn.innerHTML = (locked ? ICON_LOCK : ICON_LOCK_OPEN) + `<span>${locked ? 'Unlock' : 'Lock'}</span>`;
        lockBtn.addEventListener('click', () => toggleObjectLock(obj));
        toolbar.appendChild(lockBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'panel-action-btn panel-action-btn-half panel-action-btn-danger';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = ICON_TRASH + '<span>Delete</span>';
        deleteBtn.addEventListener('click', () => {
            canvas.remove(obj);
            canvas.discardActiveObject();
            canvas.renderAll();
            updatePropertiesPanel(null);
            saveState();
        });
        toolbar.appendChild(deleteBtn);
        panelContent.appendChild(toolbar);

        if (obj.data && obj.data.layer) {
            const layerRow = document.createElement('div');
            layerRow.className = 'prop-item';
            const layerLabel = document.createElement('label');
            layerLabel.innerText = 'Layer';
            layerRow.appendChild(layerLabel);
            const layerSelect = document.createElement('select');
            getAllLayers().forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.id;
                opt.innerText = l.name;
                if (l.id === obj.data.layer) opt.selected = true;
                layerSelect.appendChild(opt);
            });
            layerSelect.addEventListener('change', (e) => {
                obj.data.layer = e.target.value;
                const targetToggle = layerList.querySelector(`.layer-item[data-layer="${e.target.value}"] .visibility-toggle`);
                obj.visible = !targetToggle || targetToggle.dataset.visible === 'true';
                canvas.renderAll();
                saveState();
            });
            layerRow.appendChild(layerSelect);
            panelContent.appendChild(layerRow);
        }
    }

    function renderGroupProperties(obj) {
        const hint = document.createElement('div');
        hint.className = 'prop-hint';
        hint.innerText = `Group of ${obj._objects ? obj._objects.length : 0} objects. Ctrl+Shift+G to ungroup.`;
        panelContent.appendChild(hint);
    }

    function renderTextProperties(obj) {
        createPropItem('Font Size', obj.fontSize, 'px', true, (newValue) => {
            obj.set('fontSize', Math.max(6, newValue));
            canvas.renderAll();
            saveState();
        });
        createPropItem('Angle', obj.angle.toFixed(0), '°', true, (newValue) => { obj.set('angle', newValue); canvas.renderAll(); });
        const hint = document.createElement('div');
        hint.className = 'prop-hint';
        hint.innerText = 'Double-click the text on the canvas to edit its content.';
        panelContent.appendChild(hint);
    }

    function alignSelection(edge) {
        const active = canvas.getActiveObject();
        if (!active || active.type !== 'activeSelection') return;
        const objects = active.getObjects();
        const rects = objects.map(o => ({ obj: o, rect: o.getBoundingRect(true, true) }));
        const minX = Math.min(...rects.map(r => r.rect.left));
        const maxX = Math.max(...rects.map(r => r.rect.left + r.rect.width));
        const minY = Math.min(...rects.map(r => r.rect.top));
        const maxY = Math.max(...rects.map(r => r.rect.top + r.rect.height));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        rects.forEach(({ obj: o, rect }) => {
            let dx = 0, dy = 0;
            if (edge === 'left') dx = minX - rect.left;
            if (edge === 'right') dx = maxX - (rect.left + rect.width);
            if (edge === 'hcenter') dx = centerX - (rect.left + rect.width / 2);
            if (edge === 'top') dy = minY - rect.top;
            if (edge === 'bottom') dy = maxY - (rect.top + rect.height);
            if (edge === 'vcenter') dy = centerY - (rect.top + rect.height / 2);
            o.set({ left: o.left + dx, top: o.top + dy });
            o.setCoords();
        });
        active.addWithUpdate();
        canvas.renderAll();
        saveState();
    }

    function renderMultiSelectionToolbar(activeSelection) {
        const toolbar = document.createElement('div');
        toolbar.className = 'panel-toolbar';
        [
            ['left', ICON_ALIGN_LEFT, 'Align Left'],
            ['hcenter', ICON_ALIGN_HCENTER, 'Align Center Horizontal'],
            ['right', ICON_ALIGN_RIGHT, 'Align Right'],
            ['top', ICON_ALIGN_TOP, 'Align Top'],
            ['vcenter', ICON_ALIGN_VCENTER, 'Align Center Vertical'],
            ['bottom', ICON_ALIGN_BOTTOM, 'Align Bottom'],
        ].forEach(([edge, icon, title]) => {
            const btn = document.createElement('button');
            btn.className = 'panel-toolbar-btn';
            btn.title = title;
            btn.innerHTML = icon;
            btn.addEventListener('click', () => alignSelection(edge));
            toolbar.appendChild(btn);
        });
        panelContent.appendChild(toolbar);
        const groupBtn = document.createElement('button');
        groupBtn.className = 'panel-action-btn';
        groupBtn.innerHTML = ICON_STACK + '<span>Group (Ctrl+G)</span>';
        groupBtn.addEventListener('click', groupSelection);
        panelContent.appendChild(groupBtn);
        const hint = document.createElement('div');
        hint.className = 'prop-hint';
        hint.innerText = `${activeSelection.getObjects().length} objects selected.`;
        panelContent.appendChild(hint);
    }
    
    function createPropItem(label, value, unit = '', isEditable = false, onchange = null) {
        let convertBack = null;
        if (unit === 'm' || unit === 'm²') {
            const numeric = parseFloat(value);
            if (isFinite(numeric)) {
                if (unit === 'm') { value = toDisplayLength(numeric).toFixed(2); unit = lengthUnit(); convertBack = fromDisplayLength; }
                else { value = toDisplayArea(numeric).toFixed(2); unit = areaUnit(); }
            }
        }
        const propItem = document.createElement('div');
        propItem.className = 'prop-item';
        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        propItem.appendChild(labelEl);
        const inputWrap = document.createElement('div');
        inputWrap.className = 'prop-input-wrap';
        const inputEl = document.createElement('input');
        inputEl.type = isEditable ? 'number' : 'text';
        if (isEditable) {
            inputEl.value = value;
            if (onchange) inputEl.addEventListener('change', (e) => { const entered = parseFloat(e.target.value) || 0; onchange(convertBack ? convertBack(entered) : entered); });
        } else {
            inputEl.value = unit ? `${value} ${unit}` : value;
            inputEl.disabled = true;
        }
        inputWrap.appendChild(inputEl);
        if (isEditable && unit) {
            const unitEl = document.createElement('span');
            unitEl.className = 'prop-unit';
            unitEl.innerText = unit;
            inputWrap.appendChild(unitEl);
        }
        propItem.appendChild(inputWrap);
        panelContent.appendChild(propItem);
    }

    function polygonArea(points) {
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y - points[j].x * points[i].y;
        }
        return Math.abs(area / 2);
    }

    function polygonPerimeter(points) {
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            perimeter += Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y);
        }
        return perimeter;
    }

    function renderPolygonRoomProperties(obj) {
        const scaleX = obj.scaleX || 1, scaleY = obj.scaleY || 1;
        const points = obj.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
        const areaM2 = polygonArea(points) / (PIXELS_PER_METER * PIXELS_PER_METER);
        const perimeterM = polygonPerimeter(points) / PIXELS_PER_METER;
        createPropItem('Perimeter', perimeterM.toFixed(2), 'm');
        createPropItem('Area', areaM2.toFixed(2), 'm²');
        createPropItem('Angle', obj.angle.toFixed(0), '°', true, (newValue) => { obj.set('angle', newValue); canvas.renderAll(); });
        if (!obj.data.baseColor) obj.data.baseColor = ROOM_FILL_COLORS[0];
        createFillPatternSelect(obj, obj);
    }

    function renderRectProperties(obj) {
        if (obj.type === 'polygon') { renderPolygonRoomProperties(obj); return; }
        const rect = obj._objects.find(o => o.type === 'rect');
        const widthMeters = (rect.getScaledWidth() / PIXELS_PER_METER).toFixed(2);
        const heightMeters = (rect.getScaledHeight() / PIXELS_PER_METER).toFixed(2);
        createPropItem('Width', widthMeters, 'm', true, (newValue) => {
            const newWidth = newValue * PIXELS_PER_METER;
            obj.set('width', newWidth);
            rect.set('width', newWidth);
            updateRoomDimensions(obj);
            canvas.renderAll();
        });
        createPropItem('Height', heightMeters, 'm', true, (newValue) => {
            const newHeight = newValue * PIXELS_PER_METER;
            obj.set('height', newHeight);
            rect.set('height', newHeight);
            updateRoomDimensions(obj);
            canvas.renderAll();
        });
        createPropItem('Area', (widthMeters * heightMeters).toFixed(2), 'm²');
        createPropItem('Angle', obj.angle.toFixed(0), '°', true, (newValue) => { obj.set('angle', newValue); canvas.renderAll(); });
        if (!obj.data.baseColor) obj.data.baseColor = rect.fill;
        createFillPatternSelect(obj, rect);
    }

    function renderPolylineProperties(obj) {
    let totalLength = 0;
    if (obj.points) { 
        for (let i = 0; i < obj.points.length - 1; i++) {
            totalLength += new fabric.Point(obj.points[i].x, obj.points[i].y)
                .distanceFrom(new fabric.Point(obj.points[i + 1].x, obj.points[i + 1].y));
        }
    }
    const lengthMeters = (totalLength / PIXELS_PER_METER).toFixed(2);
    createPropItem('Total Length', lengthMeters, 'm');
    if (canRevertFillet(obj)) {
        const revertBtn = document.createElement('button');
        revertBtn.className = 'panel-action-btn';
        revertBtn.textContent = 'Revert Last Fillet';
        revertBtn.addEventListener('click', () => revertLastFillet(obj));
        panelContent.appendChild(revertBtn);
    }
}

    function renderDimensionProperties(obj) {
        const textObject = obj._objects.find(o => o.type === 'text');
        if (textObject) createPropItem('Measured', textObject.text.replace(' m', ''), 'm');
    }

    function renderDoorProperties(obj) {
        const doorLeaf = obj._objects.find(o => o.type === 'rect');
        createPropItem('Width', (doorLeaf.width / PIXELS_PER_METER).toFixed(2), 'm');
        createPropItem('Angle', obj.angle.toFixed(0), '°', true, (newValue) => { obj.set('angle', newValue); canvas.renderAll(); });
    }

    function renderWindowProperties(obj) {
        createPropItem('Width', (obj.data.width / PIXELS_PER_METER).toFixed(2), 'm', true, (newValue) => {
            const newWidthPixels = newValue * PIXELS_PER_METER;
            obj._objects.forEach(line => {
                line.set({ x1: -newWidthPixels / 2, x2: newWidthPixels / 2 });
            });
            obj.data.width = newWidthPixels;
            obj.setCoords();
            canvas.renderAll();
        });
        createPropItem('Angle', obj.angle.toFixed(0), '°', true, (newValue) => { obj.set('angle', newValue); canvas.renderAll(); });
    }

    function renderStairsProperties(obj) {
        const outline = obj._objects.find(o => o.type === 'rect');
        createPropItem('Width', (outline.getScaledWidth() / PIXELS_PER_METER).toFixed(2), 'm');
        createPropItem('Length', (outline.getScaledHeight() / PIXELS_PER_METER).toFixed(2), 'm');
        createPropItem('Angle', obj.angle.toFixed(0), '°', true, (newValue) => { obj.set('angle', newValue); canvas.renderAll(); });
    }

    function renderFurnitureProperties(obj) {
        createPropItem('Width', (obj.getScaledWidth() / PIXELS_PER_METER).toFixed(2), 'm');
        createPropItem('Height', (obj.getScaledHeight() / PIXELS_PER_METER).toFixed(2), 'm');
        createPropItem('Angle', obj.angle.toFixed(0), '°', true, (newValue) => { obj.set('angle', newValue); canvas.renderAll(); });
    }

    function finalizeWall() {
    let wallAdded = false;
    if (wallPoints.length > 1) {
        const finalWall = new fabric.Polyline(wallPoints, {
            stroke: cssVar('--text-primary'),
            strokeWidth: currentStrokeWidth,
            fill: null,
            selectable: true,
            data: { layer: 'walls', type: 'wall-system' },
            objectCaching: false,
            strokeLineJoin: 'miter'
        });
        canvas.add(finalWall);
        wallAdded = true;
    }

    canvas.getObjects().forEach(obj => {
        if (obj.name === 'temp') {
            canvas.remove(obj);
        }
    });

    if (tempWallLine) canvas.remove(tempWallLine);
    wallPoints = [];
    tempWallLine = null;
    isDrawing = false;
    toolTip.innerText = '';
    setMode('select');
    canvas.renderAll();
    if (wallAdded && graphAuto) normalizeWalls(false);
    if (wallAdded) saveState('Add wall');
}
    
    function updateRoomDimensions(roomGroup) {
        const rect = roomGroup._objects.find(o => o.type === 'rect');
        const widthText = roomGroup._objects.find(o => o.data && o.data.type === 'width');
        const heightText = roomGroup._objects.find(o => o.data && o.data.type === 'height');

        const newWidth = rect.getScaledWidth();
        const newHeight = rect.getScaledHeight();

        widthText.set({ text: formatLabel(newWidth / PIXELS_PER_METER), left: newWidth / 2, top: newHeight - 16 });
        heightText.set({ text: formatLabel(newHeight / PIXELS_PER_METER), left: 4, top: newHeight / 2 });

        roomGroup.setCoords();
        canvas.requestRenderAll();
    }

    function lineIntersection(p1, p2, p3, p4) {
        const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
        const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
        const denom = d1x * d2y - d1y * d2x;
        if (Math.abs(denom) < 1e-6) return null;
        const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
        return { x: p1.x + t * d1x, y: p1.y + t * d1y };
    }

    function pointToSegmentDistance(pt, p1, p2) {
        const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
        if (l2 === 0) return Math.hypot(pt.x - p1.x, pt.y - p1.y);
        let t = ((pt.x - p1.x) * (p2.x - p1.x) + (pt.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
        return Math.hypot(pt.x - proj.x, pt.y - proj.y);
    }

    function getWallAbsPoints(wall) {
        const matrix = wall.calcTransformMatrix();
        const offset = wall.pathOffset || { x: 0, y: 0 };
        return wall.points.map(p => fabric.util.transformPoint({ x: p.x - offset.x, y: p.y - offset.y }, matrix));
    }

    function isClosedPolyline(points) {
        return points.length >= 4 && Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y) < 1e-6;
    }

    function findNearestWallVertex(pointer, tolerance, includeClosedStart) {
        let best = null;
        canvas.getObjects().forEach(obj => {
            if (!obj.data || obj.data.type !== 'wall-system') return;
            const absPoints = getWallAbsPoints(obj);
            const from = includeClosedStart && isClosedPolyline(absPoints) ? 0 : 1;
            for (let i = from; i < absPoints.length - 1; i++) {
                const dist = Math.hypot(absPoints[i].x - pointer.x, absPoints[i].y - pointer.y);
                if (dist < tolerance && (!best || dist < best.dist)) {
                    best = { wall: obj, vertexIndex: i, dist };
                }
            }
        });
        return best;
    }

    function chamferWallCorner(wall, vertexIndex, distanceM) {
        const points = wall.points;
        if (vertexIndex <= 0 || vertexIndex >= points.length - 1) return null;
        const distPx = distanceM * PIXELS_PER_METER;
        const prev = points[vertexIndex - 1];
        const curr = points[vertexIndex];
        const next = points[vertexIndex + 1];

        const len1 = Math.hypot(curr.x - prev.x, curr.y - prev.y) || 1;
        const len2 = Math.hypot(next.x - curr.x, next.y - curr.y) || 1;
        const cutDist = Math.min(distPx, len1 * 0.45, len2 * 0.45);
        if (cutDist <= 0) return null;

        const p1 = {
            x: curr.x - (curr.x - prev.x) / len1 * cutDist,
            y: curr.y - (curr.y - prev.y) / len1 * cutDist,
        };
        const p2 = {
            x: curr.x + (next.x - curr.x) / len2 * cutDist,
            y: curr.y + (next.y - curr.y) / len2 * cutDist,
        };

        return points.slice(0, vertexIndex).concat([p1, p2], points.slice(vertexIndex + 1));
    }


    function wallAbsFromLocal(wall, localPoints) {
        const matrix = wall.calcTransformMatrix();
        const offset = wall.pathOffset || { x: 0, y: 0 };
        return localPoints.map(p => fabric.util.transformPoint({ x: p.x - offset.x, y: p.y - offset.y }, matrix));
    }

    function wallFromAbsPoints(src, absPoints, data) {
        return new fabric.Polyline(absPoints.map(p => ({ x: p.x, y: p.y })), {
            stroke: src.stroke, strokeWidth: src.strokeWidth,
            strokeLineJoin: 'miter', fill: null, selectable: true, objectCaching: false,
            data: data
        });
    }

    function filletAbsPoints(absPoints, vertexIndex, radiusM) {
        if (vertexIndex <= 0 || vertexIndex >= absPoints.length - 1) return null;
        const P = absPoints[vertexIndex];
        const A = absPoints[vertexIndex - 1];
        const B = absPoints[vertexIndex + 1];
        const l1 = Math.hypot(A.x - P.x, A.y - P.y);
        const l2 = Math.hypot(B.x - P.x, B.y - P.y);
        if (l1 < 1e-6 || l2 < 1e-6) return { error: 'degenerate' };
        const u = { x: (A.x - P.x) / l1, y: (A.y - P.y) / l1 };
        const v = { x: (B.x - P.x) / l2, y: (B.y - P.y) / l2 };
        const theta = Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y)));
        if (theta < 0.05 || Math.PI - theta < 0.3) return { error: 'flat' };
        const half = theta / 2;
        let radius = radiusM * PIXELS_PER_METER;
        let t = radius / Math.tan(half);
        const tMax = Math.min(l1 * (vertexIndex - 1 > 0 ? 0.5 : 0.98), l2 * (vertexIndex + 1 < absPoints.length - 1 ? 0.5 : 0.98));
        let clamped = false;
        if (t > tMax) { t = tMax; radius = t * Math.tan(half); clamped = true; }
        const T1 = { x: P.x + u.x * t, y: P.y + u.y * t };
        const T2 = { x: P.x + v.x * t, y: P.y + v.y * t };
        const bx = u.x + v.x;
        const by = u.y + v.y;
        const bl = Math.hypot(bx, by) || 1;
        const dist = radius / Math.sin(half);
        const C = { x: P.x + bx / bl * dist, y: P.y + by / bl * dist };
        const a1 = Math.atan2(T1.y - C.y, T1.x - C.x);
        let delta = Math.atan2(T2.y - C.y, T2.x - C.x) - a1;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        const steps = Math.max(3, Math.ceil(Math.abs(delta) / (Math.PI / 18)));
        const arc = [];
        for (let k = 0; k <= steps; k++) {
            const a = a1 + delta * k / steps;
            arc.push({ x: C.x + radius * Math.cos(a), y: C.y + radius * Math.sin(a) });
        }
        arc[0] = T1;
        arc[steps] = T2;
        return { points: absPoints.slice(0, vertexIndex).concat(arc, absPoints.slice(vertexIndex + 1)), clamped: clamped, radius: radius / PIXELS_PER_METER };
    }

    function applyFillet(wall, vertexIndex, radiusM) {
        let absBefore = getWallAbsPoints(wall);
        if (vertexIndex === 0 && isClosedPolyline(absBefore)) {
            absBefore = absBefore.slice(1).concat([absBefore[1]]);
            vertexIndex = absBefore.length - 2;
        }
        const result = filletAbsPoints(absBefore, vertexIndex, radiusM);
        if (!result || result.error) return result || { error: 'invalid' };
        const previous = (wall.data && Array.isArray(wall.data.filletUndo)) ? wall.data.filletUndo : [];
        const stack = previous.map(e => ({ before: wallAbsFromLocal(wall, e.before), after: wallAbsFromLocal(wall, e.after) }));
        stack.push({ before: absBefore.map(p => ({ x: p.x, y: p.y })), after: result.points.map(p => ({ x: p.x, y: p.y })) });
        const newWall = wallFromAbsPoints(wall, result.points, { layer: wall.data.layer, type: 'wall-system', filletUndo: stack.slice(-10) });
        canvas.remove(wall);
        canvas.add(newWall);
        setActiveAndSync(newWall);
        canvas.renderAll();
        saveState('Fillet corner');
        return { ok: true, clamped: result.clamped, radius: result.radius };
    }

    function wallPointsMatch(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (Math.abs(a[i].x - b[i].x) > 1e-6 || Math.abs(a[i].y - b[i].y) > 1e-6) return false;
        }
        return true;
    }

    function canRevertFillet(wall) {
        const stack = wall.data && wall.data.filletUndo;
        if (!Array.isArray(stack) || !stack.length) return false;
        return wallPointsMatch(wall.points, stack[stack.length - 1].after);
    }

    function revertLastFillet(wall) {
        if (!canRevertFillet(wall)) return false;
        const stack = wall.data.filletUndo;
        const last = stack[stack.length - 1];
        const absBefore = wallAbsFromLocal(wall, last.before);
        const rest = stack.slice(0, -1).map(e => ({ before: wallAbsFromLocal(wall, e.before), after: wallAbsFromLocal(wall, e.after) }));
        const data = { layer: wall.data.layer, type: 'wall-system' };
        if (rest.length) data.filletUndo = rest;
        const restored = wallFromAbsPoints(wall, absBefore, data);
        if (rest.length) {
            const restoredAbs = absBefore.map(p => ({ x: p.x, y: p.y }));
            restored.data.filletUndo[rest.length - 1].after = restoredAbs;
        }
        canvas.remove(wall);
        canvas.add(restored);
        setActiveAndSync(restored);
        canvas.renderAll();
        saveState('Revert fillet');
        return true;
    }

    function offsetWallPoints(points, delta) {
        if (points.length < 2) return points.slice();
        const segments = [];
        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i], b = points[i + 1];
            const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const nx = -(b.y - a.y) / len * delta, ny = (b.x - a.x) / len * delta;
            segments.push({ a: { x: a.x + nx, y: a.y + ny }, b: { x: b.x + nx, y: b.y + ny } });
        }
        const result = [segments[0].a];
        for (let i = 0; i < segments.length - 1; i++) {
            const joint = lineIntersection(segments[i].a, segments[i].b, segments[i + 1].a, segments[i + 1].b);
            result.push(joint || segments[i].b);
        }
        result.push(segments[segments.length - 1].b);
        return result;
    }

    const CLIPPER_SCALE = 1000;
    function offsetPolygonPoints(points, delta) {
        const path = points.map(p => ({ X: Math.round(p.x * CLIPPER_SCALE), Y: Math.round(p.y * CLIPPER_SCALE) }));
        const co = new ClipperLib.ClipperOffset();
        co.AddPath(path, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
        const solution = new ClipperLib.Paths();
        co.Execute(solution, delta * CLIPPER_SCALE);
        if (!solution.length) return null;
        return solution[0].map(p => ({ x: p.X / CLIPPER_SCALE, y: p.Y / CLIPPER_SCALE }));
    }

    function performTrim(pointer) {
        const walls = canvas.getObjects().filter(o => o.data && o.data.type === 'wall-system' && Array.isArray(o.points) && o.points.length >= 2);
        if (walls.length < 2) { toolTip.innerText = 'Need at least two walls to trim.'; return; }

        let best = null;
        walls.forEach(wall => {
            const pts = getWallAbsPoints(wall);
            const endSegments = [{ p1: pts[0], p2: pts[1], isStart: true }];
            if (pts.length > 2) endSegments.push({ p1: pts[pts.length - 2], p2: pts[pts.length - 1], isStart: false });
            endSegments.forEach(seg => {
                const dist = pointToSegmentDistance(pointer, seg.p1, seg.p2);
                if (dist < 25 && (!best || dist < best.dist)) best = { wall, ...seg, dist };
            });
        });
        if (!best) { toolTip.innerText = 'Click closer to the end of a wall to trim it.'; return; }

        let bestIntersection = null;
        walls.forEach(otherWall => {
            if (otherWall === best.wall) return;
            const oPts = getWallAbsPoints(otherWall);
            for (let i = 0; i < oPts.length - 1; i++) {
                const ix = lineIntersection(best.p1, best.p2, oPts[i], oPts[i + 1]);
                if (ix) {
                    const d = Math.hypot(ix.x - pointer.x, ix.y - pointer.y);
                    if (!bestIntersection || d < bestIntersection.dist) bestIntersection = { point: ix, dist: d };
                }
            }
        });
        if (!bestIntersection) { toolTip.innerText = 'No intersecting wall found near that end.'; return; }

        const inverted = fabric.util.invertTransform(best.wall.calcTransformMatrix());
        const local = fabric.util.transformPoint(bestIntersection.point, inverted);
        const offset = best.wall.pathOffset || { x: 0, y: 0 };
        const newLocalPoint = { x: local.x + offset.x, y: local.y + offset.y };

        const newPoints = best.wall.points.slice();
        if (best.isStart) newPoints[0] = newLocalPoint; else newPoints[newPoints.length - 1] = newLocalPoint;
        best.wall.set({ points: newPoints });
        best.wall.setCoords();
        canvas.renderAll();
        saveState();
    }

    function finalizeActiveShape() {
        if (!activeShape) return;
        const { left, top, width, height, angle } = activeShape;
        canvas.remove(activeShape);

        if (width > 2 && height > 2) {
            if (currentMode === 'rect') {
                const fillColor = ROOM_FILL_COLORS[roomColorIndex % ROOM_FILL_COLORS.length];
                roomColorIndex++;
                const rect = new fabric.Rect({
                    width, height,
                    fill: fillColor,
                    stroke: cssVar('--text-primary'),
                    strokeWidth: 2,
                    originX: 'left', originY: 'top'
                });
                const widthText = new fabric.Text(formatLabel(width / PIXELS_PER_METER), {
                    fontSize: 12, fill: cssVar('--text-primary'),
                    originX: 'center', originY: 'top',
                    left: width / 2, top: height - 16,
                    data: { type: 'width' }
                });
                const heightText = new fabric.Text(formatLabel(height / PIXELS_PER_METER), {
                    fontSize: 12, fill: cssVar('--text-primary'),
                    originX: 'left', originY: 'center',
                    left: 4, top: height / 2,
                    data: { type: 'height' }
                });
                const roomGroup = new fabric.Group([rect, widthText, heightText], {
                    left, top, angle,
                    originX: 'left', originY: 'top',
                    selectable: true,
                    data: { layer: 'walls', type: 'room', baseColor: fillColor, hatchPattern: 'solid' }
                });
                canvas.add(roomGroup);
                setActiveAndSync(roomGroup);
            } else if (currentMode === 'stairs') {
                const stairsGroup = createStairsSymbol(left, top, width, height, angle);
                setActiveAndSync(stairsGroup);
            }
        }

        activeShape = null;
        canvas.renderAll();
        setMode('select');
        saveState();
    }

    function cancelActiveShape() {
        if (activeShape) {
            canvas.remove(activeShape);
            activeShape = null;
            canvas.renderAll();
        }
        isDrawing = false;
        isDefiningAngle = false;
    }

    function snap(value) {
        return snapCheckbox.checked ? Math.round(value / GRID_SIZE) * GRID_SIZE : value;
    }

    function findClosestWallPoint(pointer) {
        const walls = canvas.getObjects().filter(obj => obj.data && (obj.data.type === 'wall-system' || obj.data.type === 'room'));
        let minDistance = Infinity, bestPoint = null, wallAngle = 0;

        function considerSegment(p1, p2) {
            const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
            if (l2 === 0) return;
            let t = ((pointer.x - p1.x) * (p2.x - p1.x) + (pointer.y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const closestPointOnSegment = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
            const dist = Math.sqrt(Math.pow(pointer.x - closestPointOnSegment.x, 2) + Math.pow(pointer.y - closestPointOnSegment.y, 2));
            if (dist < minDistance) {
                minDistance = dist;
                bestPoint = closestPointOnSegment;
                wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
            }
        }

        walls.forEach(wallObj => {
            const matrix = wallObj.calcTransformMatrix();
            if (wallObj.data.type === 'wall-system' && Array.isArray(wallObj.points)) {
                const offset = wallObj.pathOffset || { x: 0, y: 0 };
                const absPoints = wallObj.points.map(p => fabric.util.transformPoint({ x: p.x - offset.x, y: p.y - offset.y }, matrix));
                for (let i = 0; i < absPoints.length - 1; i++) considerSegment(absPoints[i], absPoints[i + 1]);
            } else if (wallObj.data.type === 'room' && wallObj._objects) {
                const rect = wallObj._objects.find(o => o.type === 'rect');
                if (rect) {
                    const tl = fabric.util.transformPoint({ x: 0, y: 0 }, matrix);
                    const tr = fabric.util.transformPoint({ x: rect.width, y: 0 }, matrix);
                    const bl = fabric.util.transformPoint({ x: 0, y: rect.height }, matrix);
                    const br = fabric.util.transformPoint({ x: rect.width, y: rect.height }, matrix);
                    considerSegment(tl, tr); considerSegment(tr, br); considerSegment(br, bl); considerSegment(bl, tl);
                }
            }
        });

        return { point: bestPoint, angle: wallAngle, distance: minDistance };
    }

    canvas.on('mouse:wheel', function(opt) {
        opt.e.preventDefault();
        opt.e.stopPropagation();
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 10) zoom = 10;
        if (zoom < 0.1) zoom = 0.1;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        zoomDisplay.innerText = `Zoom: ${Math.round(zoom * 100)}%`;
        drawRulers();
    });

    function getClientPoint(e) {
        if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }

    function getObjectSnapEdges(obj) {
        const rect = obj.getBoundingRect(true, true);
        return {
            left: rect.left, right: rect.left + rect.width, centerX: rect.left + rect.width / 2,
            top: rect.top, bottom: rect.top + rect.height, centerY: rect.top + rect.height / 2,
        };
    }

    function clearSnapGuides() {
        canvas.getObjects().filter(o => o.name === 'snap-guide').forEach(o => canvas.remove(o));
    }

    function drawSnapGuide(isVertical, position) {
        const points = isVertical
            ? [position, 0, position, canvas.getHeight()]
            : [0, position, canvas.getWidth(), position];
        canvas.add(new fabric.Line(points, {
            stroke: cssVar('--accent-primary'), strokeWidth: 1, strokeDashArray: [4, 4],
            selectable: false, evented: false, name: 'snap-guide'
        }));
    }

    canvas.on('object:moving', (e) => {
        clearSnapGuides();
        if (!objectSnapCheckbox.checked) return;
        const target = e.target;
        if (target.name === 'temp' || target.type === 'activeSelection') return;
        const threshold = objectSnapThreshold;
        const edges = getObjectSnapEdges(target);
        let bestDx = null, bestDy = null, guideXPos = null, guideYPos = null;

        canvas.getObjects().forEach(obj => {
            if (obj === target || obj.name === 'temp' || obj.name === 'snap-guide' || !obj.data) return;
            const other = getObjectSnapEdges(obj);
            [['left', 'left'], ['left', 'right'], ['right', 'right'], ['right', 'left'], ['centerX', 'centerX']].forEach(([a, b]) => {
                const delta = other[b] - edges[a];
                if (Math.abs(delta) < threshold && (bestDx === null || Math.abs(delta) < Math.abs(bestDx))) {
                    bestDx = delta;
                    guideXPos = other[b];
                }
            });
            [['top', 'top'], ['top', 'bottom'], ['bottom', 'bottom'], ['bottom', 'top'], ['centerY', 'centerY']].forEach(([a, b]) => {
                const delta = other[b] - edges[a];
                if (Math.abs(delta) < threshold && (bestDy === null || Math.abs(delta) < Math.abs(bestDy))) {
                    bestDy = delta;
                    guideYPos = other[b];
                }
            });
        });

        if (bestDx !== null) { target.set('left', target.left + bestDx); drawSnapGuide(true, guideXPos); }
        if (bestDy !== null) { target.set('top', target.top + bestDy); drawSnapGuide(false, guideYPos); }
        if (bestDx !== null || bestDy !== null) canvas.renderAll();
    });

    canvas.on({
        'selection:created': (e) => updatePropertiesPanel(e.target),
        'selection:updated': (e) => updatePropertiesPanel(e.target),
        'selection:cleared': () => updatePropertiesPanel(null),
        'object:scaling': (e) => {
            const target = e.target;
            if (target.data && target.data.layer === 'furniture') {
                target.set('scaleY', target.scaleX);
            }
        },
        'object:modified': (e) => {
            clearSnapGuides();
            canvas.renderAll();
            const target = e.target;
            if (target.data && target.data.type === 'room') {
                updateRoomDimensions(target);
            }
            saveState();
        },
    });

    canvas.on('mouse:down', (o) => {
        if (pinchActive) return;
        if (canvas.isGrabMode) {
            isPanning = true;
            lastPanPoint = getClientPoint(o.e);
            canvas.defaultCursor = 'grabbing';
            canvas.setCursor('grabbing');
            return;
        }
        if (o.target && o.target.selectable && currentMode !== 'select' && currentMode !== 'text' && currentMode !== 'measure' && currentMode !== 'chamfer-active' && currentMode !== 'fillet-active' && currentMode !== 'wall' && currentMode !== 'asset' && currentMode !== 'door' && currentMode !== 'window') return;
        if (o.target && currentMode === 'select') return;

        const pointer = canvas.getPointer(o.e);
        
        if (isDefiningAngle) {
            finalizeActiveShape();
            return;
        }

        if (currentMode === 'node') {
            startNodeDrag(pointer);
            return;
        }

        if (currentMode === 'trim') {
            performTrim(pointer);
            return;
        }

        if (currentMode === 'asset') {
            if (selectedAssetId) {
                placeFurniture(selectedAssetId, pointer.x, pointer.y);
            } else {
                toolTip.innerText = 'Pick a furniture item from the Assets panel first.';
            }
            return;
        }

        if (currentMode === 'door' || currentMode === 'window') {
            const result = findClosestWallPoint(pointer);
            if (result && result.distance < 20) {
                if (currentMode === 'door') createDoorSymbol(result.point.x, result.point.y, result.angle);
                else createWindowSymbol(result.point.x, result.point.y, result.angle);
            } else {
                if (currentMode === 'door') createDoorSymbol(pointer.x, pointer.y, 0);
                else createWindowSymbol(pointer.x, pointer.y, 0);
            }
            saveState();
            setMode('select');
            return;
        }

        const snappedPointer = { x: snap(pointer.x), y: snap(pointer.y) };
        if (currentMode === 'dimension') {
            if (!dimensionFirstPoint) {
                dimensionFirstPoint = snappedPointer;
                canvas.add(new fabric.Circle({ radius: 3, fill: 'red', left: dimensionFirstPoint.x - 3, top: dimensionFirstPoint.y - 3, selectable: false, evented: false, name: 'temp' }));
            } else {
                createDimensionObject(dimensionFirstPoint, snappedPointer);
                dimensionFirstPoint = null;
                setMode('select');
            }
            return;
        }

        if (currentMode === 'chamfer-active') {
            const found = findNearestWallVertex(pointer, 20);
            if (found) {
                const newPoints = chamferWallCorner(found.wall, found.vertexIndex, chamferDistance);
                if (newPoints) {
                    const newWall = new fabric.Polyline(newPoints, {
                        left: found.wall.left, top: found.wall.top, angle: found.wall.angle,
                        scaleX: found.wall.scaleX, scaleY: found.wall.scaleY,
                        stroke: found.wall.stroke, strokeWidth: found.wall.strokeWidth,
                        strokeLineJoin: 'miter', fill: null, selectable: true, objectCaching: false,
                        data: { layer: 'walls', type: 'wall-system' }
                    });
                    canvas.remove(found.wall);
                    canvas.add(newWall);
                    setActiveAndSync(newWall);
                    canvas.renderAll();
                    saveState('Chamfer corner');
                    toolTip.innerText = 'Corner chamfered. Click another corner, or switch tools when done.';
                } else {
                    toolTip.innerText = 'That corner is too short to chamfer at this distance.';
                }
            } else {
                toolTip.innerText = 'No wall corner found nearby. Click closer to a bend in a wall.';
            }
            return;
        }

        if (currentMode === 'fillet-active') {
            const found = findNearestWallVertex(pointer, 20, true);
            if (found) {
                const res = applyFillet(found.wall, found.vertexIndex, filletRadius);
                if (res.ok) {
                    toolTip.innerText = res.clamped
                        ? `Corner rounded with a reduced radius of ${formatLength(res.radius)} (the segments are short). Click another corner, or switch tools when done.`
                        : 'Corner rounded. Click another corner, or switch tools when done.';
                } else if (res.error === 'flat') {
                    toolTip.innerText = 'That bend is too gentle to round.';
                } else {
                    toolTip.innerText = 'That corner cannot be rounded.';
                }
            } else {
                toolTip.innerText = 'No wall corner found nearby. Click closer to a bend in a wall.';
            }
            return;
        }

        if (currentMode === 'measure') {
            if (!measureFirstPoint) {
                canvas.getObjects().filter(o => o.name === 'temp').forEach(o => canvas.remove(o));
                measureFirstPoint = snappedPointer;
                canvas.add(new fabric.Circle({ radius: 3, fill: cssVar('--accent-primary'), left: measureFirstPoint.x - 3, top: measureFirstPoint.y - 3, selectable: false, evented: false, name: 'temp' }));
                toolTip.innerText = 'Click the second point.';
            } else {
                const distPx = Math.hypot(snappedPointer.x - measureFirstPoint.x, snappedPointer.y - measureFirstPoint.y);
                const distM = formatLength(distPx / PIXELS_PER_METER);
                canvas.getObjects().filter(o => o.name === 'temp').forEach(o => canvas.remove(o));
                canvas.add(new fabric.Line([measureFirstPoint.x, measureFirstPoint.y, snappedPointer.x, snappedPointer.y], { stroke: cssVar('--accent-primary'), strokeWidth: 2, strokeDashArray: [6, 4], selectable: false, evented: false, name: 'temp' }));
                canvas.renderAll();
                toolTip.innerText = `Distance: ${distM} — click to start a new measurement.`;
                measureFirstPoint = null;
            }
            return;
        }

        if (currentMode === 'text') {
            const textObj = new fabric.IText('Text', {
                left: snappedPointer.x, top: snappedPointer.y,
                fontFamily: 'Inter, Vazirmatn, sans-serif',
                fontSize: 16,
                fill: cssVar('--text-primary'),
                selectable: true,
                data: { layer: 'annotations', type: 'text' }
            });
            canvas.add(textObj);
            canvas.setActiveObject(textObj);
            canvas.renderAll();
            textObj.enterEditing();
            textObj.selectAll();
            textObj.on('editing:exited', () => {
                if (!textObj.text.trim()) {
                    canvas.remove(textObj);
                    updatePropertiesPanel(null);
                } else {
                    updatePropertiesPanel(textObj);
                }
                saveState();
            });
            currentMode = 'select';
            canvas.defaultCursor = 'default';
            canvas.selection = true;
            toolButtons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('select-tool-btn').classList.add('active');
            return;
        }

        if (currentMode === 'wall') {
            isDrawing = true;
            toolTip.innerText = 'Press ESC or Double-Click to finish.';
            wallPoints.push(snappedPointer);
            canvas.add(new fabric.Circle({ left: snappedPointer.x, top: snappedPointer.y, radius: currentStrokeWidth/2, fill: '#999', originX: 'center', originY: 'center', selectable: false, evented: false, name: 'temp'}));
            if (wallPoints.length > 1) {
                const prevPoint = wallPoints[wallPoints.length - 2];
                canvas.add(new fabric.Line([prevPoint.x, prevPoint.y, snappedPointer.x, snappedPointer.y], { stroke: '#999', strokeWidth: currentStrokeWidth, selectable: false, evented: false, name: 'temp' }));
            }
            if (tempWallLine) canvas.remove(tempWallLine);
            tempWallLine = new fabric.Line([snappedPointer.x, snappedPointer.y, snappedPointer.x, snappedPointer.y], { stroke: 'rgba(66, 133, 244, 0.5)', strokeWidth: currentStrokeWidth, selectable: false, evented: false });
            canvas.add(tempWallLine);
            return;
        }

        if (currentMode === 'rect' || currentMode === 'stairs') {
            isDrawing = true;
            startPoint = snappedPointer;
            activeShape = new fabric.Rect({ left: startPoint.x, top: startPoint.y, width: 0, height: 0, stroke: 'rgba(66, 133, 244, 0.5)', strokeWidth: 2, fill: 'rgba(66, 133, 244, 0.1)', selectable: false });
            canvas.add(activeShape);
            return;
        }
    });

    canvas.on('mouse:move', (o) => {
        if (pinchActive) return;
        const clientPt = getClientPoint(o.e);
        const containerRect = canvasContainer.getBoundingClientRect();
        lastMousePos = { x: clientPt.x - containerRect.left, y: clientPt.y - containerRect.top };
        drawCrosshairs(lastMousePos);
        if (canvas.isGrabMode) {
            if (isPanning && lastPanPoint) {
                const currentPoint = getClientPoint(o.e);
                const dx = currentPoint.x - lastPanPoint.x;
                const dy = currentPoint.y - lastPanPoint.y;
                canvas.relativePan({ x: dx, y: dy });
                lastPanPoint = currentPoint;
            }
            drawRulers();
            return;
        }

        const pointer = canvas.getPointer(o.e);
        const snappedPointer = { x: snap(pointer.x), y: snap(pointer.y) };
        coordsDisplay.innerText = `X: ${formatLabel(pointer.x / PIXELS_PER_METER)}, Y: ${formatLabel(pointer.y / PIXELS_PER_METER)}`;
        
        if (currentMode === 'node' && nodeDrag) {
            updateNodeDrag(snappedPointer);
            return;
        }

        if (isDefiningAngle && activeShape) {
            const angle = fabric.util.radiansToDegrees(Math.atan2(snappedPointer.y - activeShape.top, snappedPointer.x - activeShape.left));
            activeShape.set('angle', angle);
            canvas.renderAll();
            return;
        }

        if (!isDrawing || !activeShape) return;
        
        if (currentMode === 'wall' && tempWallLine) {
            tempWallLine.set({ x2: snappedPointer.x, y2: snappedPointer.y });
        } else if ((currentMode === 'rect' || currentMode === 'stairs') && activeShape) {
            const width = snappedPointer.x - startPoint.x;
            const height = snappedPointer.y - startPoint.y;
            activeShape.set({ width: Math.abs(width), height: Math.abs(height), left: width > 0 ? startPoint.x : snappedPointer.x, top: height > 0 ? startPoint.y : snappedPointer.y });
        }
        canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
        if (pinchActive) return;
        if (canvas.isGrabMode) {
            isPanning = false;
            lastPanPoint = null;
            canvas.defaultCursor = 'grab';
            canvas.setCursor('grab');
            return;
        }
        if (currentMode === 'node') {
            endNodeDrag();
            return;
        }
        if (currentMode === 'wall') return;
        if (isDrawing) {
            if (activeShape) {
                if (currentMode === 'rect' || currentMode === 'stairs') {
                    isDrawing = false;
                    isDefiningAngle = true;
                    toolTip.innerText = 'Move mouse to set angle, click to finalize.';
                    return;
                }
            }
        }
        if (currentMode === 'select') updatePropertiesPanel(canvas.getActiveObject());
    });

    canvas.on('mouse:dblclick', () => { if (currentMode === 'wall') finalizeWall(); });
    
    function copySelection() {
        const active = canvas.getActiveObject();
        if (!active) return;
        active.clone((cloned) => { clipboardData = cloned; }, ['data']);
    }

    function pasteClipboard() {
        if (!clipboardData) return;
        clipboardData.clone((cloned) => {
            canvas.discardActiveObject();
            cloned.set({ left: cloned.left + GRID_SIZE, top: cloned.top + GRID_SIZE, evented: true });
            if (cloned.type === 'activeSelection') {
                cloned.canvas = canvas;
                cloned.forEachObject((obj) => { obj.data = obj.data ? Object.assign({}, obj.data) : undefined; canvas.add(obj); });
                cloned.setCoords();
            } else {
                cloned.data = clipboardData.data ? Object.assign({}, clipboardData.data) : undefined;
                canvas.add(cloned);
            }
            setActiveAndSync(cloned);
            canvas.renderAll();
            saveState('Paste');
        }, ['data']);
    }

    function duplicateSelection() {
        const active = canvas.getActiveObject();
        if (!active) return;
        active.clone((cloned) => {
            canvas.discardActiveObject();
            cloned.set({ left: cloned.left + GRID_SIZE, top: cloned.top + GRID_SIZE, evented: true });
            if (cloned.type === 'activeSelection') {
                cloned.canvas = canvas;
                cloned.forEachObject((obj) => { obj.data = obj.data ? Object.assign({}, obj.data) : undefined; canvas.add(obj); });
                cloned.setCoords();
            } else {
                cloned.data = active.data ? Object.assign({}, active.data) : undefined;
                canvas.add(cloned);
            }
            setActiveAndSync(cloned);
            canvas.renderAll();
            saveState('Duplicate');
        }, ['data']);
    }

    function selectAllObjects() {
        canvas.discardActiveObject();
        const selectable = canvas.getObjects().filter(o => o.selectable !== false && o.evented !== false);
        if (!selectable.length) { canvas.renderAll(); return; }
        const sel = new fabric.ActiveSelection(selectable, { canvas });
        setActiveAndSync(sel);
        canvas.renderAll();
    }

    function groupSelection() {
        const active = canvas.getActiveObject();
        if (!active || active.type !== 'activeSelection') return;
        const group = active.toGroup();
        group.set('data', { type: 'user-group' });
        canvas.requestRenderAll();
        updatePropertiesPanel(group);
        saveState('Group');
    }

    function ungroupSelection() {
        const active = canvas.getActiveObject();
        if (!active || active.type !== 'group' || !active.data || active.data.type !== 'user-group') return;
        active.toActiveSelection();
        canvas.requestRenderAll();
        updatePropertiesPanel(canvas.getActiveObject());
        saveState('Ungroup');
    }

    window.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); if (!canvas.isGrabMode) { canvas.isGrabMode = true; canvas.defaultCursor = 'grab'; canvas.selection = false; canvas.renderAll(); } return; }

        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase();
            if (key === 'c') { e.preventDefault(); copySelection(); return; }
            if (key === 'v') { e.preventDefault(); pasteClipboard(); return; }
            if (key === 'd') { e.preventDefault(); duplicateSelection(); return; }
            if (key === 'a') { e.preventDefault(); selectAllObjects(); return; }
            if (key === 'g' && e.shiftKey) { e.preventDefault(); ungroupSelection(); return; }
            if (key === 'g') { e.preventDefault(); groupSelection(); return; }
            if (key === 'z') { e.preventDefault(); undo(); return; }
            if (key === 'y') { e.preventDefault(); redo(); return; }
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'v': setMode('select'); break;
            case 'l': setMode('wall'); break;
            case 'r': setMode('rect'); break;
            case 'p': setMode('door'); break;
            case 'w': setMode('window'); break;
            case 's': setMode('stairs'); break;
            case 'd': setMode('dimension'); break;
            case 'a': setMode('asset'); break;
            case 'x': setMode('text'); break;
            case 'm': setMode('mirror'); break;
            case 'o': setMode('offset'); break;
            case 't': setMode('trim'); break;
            case 'q': setMode('measure'); break;
        }
        if (e.key === 'Escape') {
             if (currentMode === 'wall') finalizeWall();
             if (isDefiningAngle || activeShape) {
                 cancelActiveShape();
                 setMode('select');
             }
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const actives = canvas.getActiveObjects();
            if (actives.length) {
                actives.forEach(obj => canvas.remove(obj));
                canvas.discardActiveObject();
                canvas.renderAll();
                updatePropertiesPanel(null);
                saveState();
            }
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const active = canvas.getActiveObject();
            if (active && currentMode === 'select') {
                e.preventDefault();
                const step = e.shiftKey ? GRID_SIZE : 1;
                if (e.key === 'ArrowUp') active.top -= step;
                if (e.key === 'ArrowDown') active.top += step;
                if (e.key === 'ArrowLeft') active.left -= step;
                if (e.key === 'ArrowRight') active.left += step;
                active.setCoords();
                canvas.renderAll();
                drawRulers();
                clearTimeout(nudgeSaveTimer);
                nudgeSaveTimer = setTimeout(() => saveState(), 400);
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            canvas.isGrabMode = false;
            isPanning = false;
            lastPanPoint = null;
            canvas.defaultCursor = 'default';
            canvas.selection = true;
            canvas.renderAll();
            drawRulers();
        }
    });

    fileMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); fileMenuDropdown.classList.toggle('show'); });
    window.addEventListener('click', () => { if (fileMenuDropdown.classList.contains('show')) fileMenuDropdown.classList.remove('show'); });
    function clearCanvas() { if (askConfirm('Are you sure? All unsaved work will be lost.')) { localStorage.removeItem(AUTOSAVE_KEY); canvas.clear(); layerList.querySelectorAll('.custom-layer-item').forEach(el => el.remove()); customLayers = []; resetFloors(); historyManager.reset(); canvas.backgroundColor = createGridPattern(); canvas.renderAll(); syncLayerUI(); drawRulers(); saveState('New canvas'); } }
    newBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', () => { saveProject(canvas, getProjectMeta()); try { localStorage.removeItem(AUTOSAVE_KEY); } catch (err) { autosaveFailed = false; } });
    loadBtn.addEventListener('click', () => fileInput.click());
    function openProjectFile(file) {
        loadProject(canvas, file, (meta) => {
            layerList.querySelectorAll('.custom-layer-item').forEach(el => el.remove());
            customLayers = [];
            if (meta && Array.isArray(meta.customLayers)) {
                meta.customLayers.forEach(l => addCustomLayer(l.name, l.id));
            }
            if (meta && Array.isArray(meta.floors) && meta.floors.length) {
                floors = meta.floors.map(f => ({ id: String(f.id), name: String(f.name || 'Floor'), json: f.json || null, history: null, graph: f.graph || null, graphPending: !!(f.graph && f.graph.authoritative) }));
                activeFloorId = floors.some(f => f.id === meta.activeFloorId) ? meta.activeFloorId : floors[0].id;
                const activeFloor = floors.find(f => f.id === activeFloorId);
                if (FEATURES.graphPersist && activeFloor && activeFloor.graphPending) {
                    activeFloor.graphPending = false;
                    if (applyWallGraph(activeFloor.graph)) toolTip.innerText = 'Walls were rebuilt from the saved wall graph.';
                }
            } else {
                floors = [{ id: 'floor-1', name: 'Floor 1', json: null, history: null }];
                activeFloorId = 'floor-1';
            }
            renderFloorList();
            canvas.backgroundColor = createGridPattern(); canvas.renderAll(); syncLayerUI(); drawRulers(); fileInput.value = ''; historyManager.reset(); saveState('Open project');
        });
    }
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        openProjectFile(file);
    });
    exportBtn.addEventListener('click', () => { modalOverlay.classList.remove('hidden'); modal.classList.remove('hidden'); });
    function closeModal() { modalOverlay.classList.add('hidden'); modal.classList.add('hidden'); }
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    document.querySelectorAll('input[name="format"]').forEach((radio) => {
        radio.addEventListener('change', (e) => { qualityWrapper.style.display = e.target.value === 'jpeg' ? 'block' : 'none'; });
    });

    const arrayModalOverlay = document.getElementById('array-modal-overlay');
    const arrayModal = document.getElementById('array-modal');
    const closeArrayModalBtn = document.getElementById('close-array-modal-btn');
    const arrayLinearFields = document.getElementById('array-linear-fields');
    const arrayPolarFields = document.getElementById('array-polar-fields');
    const arrayApplyBtn = document.getElementById('array-apply-btn');

    function openArrayModal() { arrayModalOverlay.classList.remove('hidden'); arrayModal.classList.remove('hidden'); }
    function closeArrayModal() { arrayModalOverlay.classList.add('hidden'); arrayModal.classList.add('hidden'); }
    closeArrayModalBtn.addEventListener('click', closeArrayModal);
    arrayModalOverlay.addEventListener('click', closeArrayModal);
    document.querySelectorAll('input[name="array-type"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            const isLinear = e.target.value === 'linear';
            arrayLinearFields.classList.toggle('hidden', !isLinear);
            arrayPolarFields.classList.toggle('hidden', isLinear);
        });
    });

    function generateLinearArray(source, count, direction, spacingM) {
        const spacingPx = spacingM * PIXELS_PER_METER;
        const created = [];
        for (let i = 1; i < count; i++) {
            source.clone((cloned) => {
                cloned.set({
                    left: source.left + (direction === 'horizontal' ? spacingPx * i : 0),
                    top: source.top + (direction === 'vertical' ? spacingPx * i : 0),
                    data: source.data ? Object.assign({}, source.data) : undefined
                });
                canvas.add(cloned);
                created.push(cloned);
                if (created.length === count - 1) {
                    canvas.renderAll();
                    saveState('Polar array');
                }
            }, ['data']);
        }
    }

    function generatePolarArray(source, count, totalAngle, radiusM) {
        const radiusPx = radiusM * PIXELS_PER_METER;
        const angleStep = totalAngle / count;
        const startTheta = -Math.PI / 2;
        const centerX = source.left - radiusPx * Math.cos(startTheta);
        const centerY = source.top - radiusPx * Math.sin(startTheta);
        const created = [];
        for (let i = 1; i < count; i++) {
            const theta = startTheta + (angleStep * i) * Math.PI / 180;
            source.clone((cloned) => {
                cloned.set({
                    left: centerX + radiusPx * Math.cos(theta),
                    top: centerY + radiusPx * Math.sin(theta),
                    angle: (source.angle || 0) + angleStep * i,
                    data: source.data ? Object.assign({}, source.data) : undefined
                });
                canvas.add(cloned);
                created.push(cloned);
                if (created.length === count - 1) {
                    canvas.renderAll();
                    saveState('Linear array');
                }
            }, ['data']);
        }
    }

    arrayApplyBtn.addEventListener('click', () => {
        if (!arrayTargetObject) { closeArrayModal(); return; }
        const type = document.querySelector('input[name="array-type"]:checked').value;
        if (type === 'linear') {
            const count = parseInt(document.getElementById('array-linear-count').value, 10) || 2;
            const direction = document.getElementById('array-direction').value;
            const spacing = parseFloat(document.getElementById('array-spacing').value) || 1;
            generateLinearArray(arrayTargetObject, count, direction, spacing);
        } else {
            const count = parseInt(document.getElementById('array-polar-count').value, 10) || 2;
            const angle = parseFloat(document.getElementById('array-polar-angle').value) || 360;
            const radius = parseFloat(document.getElementById('array-polar-radius').value) || 1;
            generatePolarArray(arrayTargetObject, count, angle, radius);
        }
        arrayTargetObject = null;
        closeArrayModal();
    });

    const PAPER_SIZES_CM = {
        a4: { width: 21, height: 29.7 },
        letter: { width: 21.6, height: 27.9 },
    };

    function getContentBoundingBox() {
        const objects = canvas.getObjects().filter(o => o.name !== 'temp' && o.name !== 'snap-guide');
        if (!objects.length) return null;
        const originalVpt = canvas.viewportTransform.slice();
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(o => {
            const rect = o.getBoundingRect(true, true);
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.left + rect.width);
            maxY = Math.max(maxY, rect.top + rect.height);
        });
        canvas.setViewportTransform(originalVpt);
        const padding = GRID_SIZE;
        return { left: minX - padding, top: minY - padding, width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 };
    }

    function getPrintMetrics(bbox) {
        const scaleDenominator = parseFloat(document.getElementById('print-scale').value);
        const paperKey = document.getElementById('print-paper').value;
        const orientation = document.querySelector('input[name="print-orientation"]:checked').value;
        let paper = PAPER_SIZES_CM[paperKey];
        if (orientation === 'landscape') paper = { width: paper.height, height: paper.width };

        const widthM = bbox.width / PIXELS_PER_METER;
        const heightM = bbox.height / PIXELS_PER_METER;
        const printedWidthCm = (widthM * 100) / scaleDenominator;
        const printedHeightCm = (heightM * 100) / scaleDenominator;
        const fits = printedWidthCm <= paper.width && printedHeightCm <= paper.height;

        return { bbox, scaleDenominator, paper, orientation, printedWidthCm, printedHeightCm, fits };
    }

    function getPrintPlan() {
        const bbox = getContentBoundingBox();
        if (!bbox) return null;
        return getPrintMetrics(bbox);
    }

    function loadFloorStatic(floor) {
        return new Promise(resolve => {
            const sc = new fabric.StaticCanvas(null, { width: 100, height: 100, renderOnAddRemove: false, backgroundColor: '#ffffff' });
            sc.loadFromJSON(floor.json || { objects: [] }, () => resolve(sc));
        });
    }

    async function printAllFloors() {
        captureActiveFloor();
        const statics = [];
        for (const floor of floors) statics.push(await loadFloorStatic(floor));
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        statics.forEach(sc => {
            sc.getObjects().filter(o => o.name !== 'temp' && o.name !== 'snap-guide').forEach(o => {
                const rect = o.getBoundingRect(true, true);
                minX = Math.min(minX, rect.left);
                minY = Math.min(minY, rect.top);
                maxX = Math.max(maxX, rect.left + rect.width);
                maxY = Math.max(maxY, rect.top + rect.height);
            });
        });
        if (!isFinite(minX)) { statics.forEach(sc => sc.dispose()); return; }
        const bbox = { left: minX - GRID_SIZE, top: minY - GRID_SIZE, width: (maxX - minX) + GRID_SIZE * 2, height: (maxY - minY) + GRID_SIZE * 2 };
        const plan = getPrintMetrics(bbox);
        const multiplier = (plan.printedWidthCm * (150 / 2.54)) / bbox.width;
        const urls = statics.map(sc => {
            forEachDeepObject(sc.getObjects(), obj => {
                if (obj.stroke) obj.stroke = '#1a1a1a';
                if ((obj.type === 'i-text' || obj.type === 'text') && obj.fill) obj.fill = '#1a1a1a';
            });
            const url = sc.toDataURL({ format: 'png', left: bbox.left, top: bbox.top, width: bbox.width, height: bbox.height, multiplier: multiplier });
            sc.dispose();
            return url;
        });
        const container = document.getElementById('print-container');
        container.querySelectorAll('.print-extra').forEach(el => el.remove());
        const first = document.getElementById('print-image');
        urls.forEach((url, i) => {
            const img = i === 0 ? first : document.createElement('img');
            if (i > 0) { img.className = 'print-extra'; container.appendChild(img); }
            img.src = url;
            img.style.width = `${plan.printedWidthCm}cm`;
            img.style.height = `${plan.printedHeightCm}cm`;
        });
        container.classList.add('multi-page');
        document.body.classList.add('printing-multi');
        window.addEventListener('afterprint', () => {
            container.classList.remove('multi-page');
            document.body.classList.remove('printing-multi');
            container.querySelectorAll('.print-extra').forEach(el => el.remove());
        }, { once: true });
        setTimeout(() => window.print(), 300);
    }

    function updatePrintFitHint() {
        const plan = getPrintPlan();
        const hint = document.getElementById('print-fit-hint');
        if (!plan) { hint.innerText = 'Nothing to print yet.'; return; }
        const sizeText = `${plan.printedWidthCm.toFixed(1)} x ${plan.printedHeightCm.toFixed(1)} cm at 1:${plan.scaleDenominator}`;
        hint.innerText = plan.fits
            ? `Fits the page (${sizeText}).`
            : `Too large for one page at this scale (${sizeText}). Try a larger scale number (e.g. 1:100) or a bigger paper size.`;
        hint.style.color = plan.fits ? 'var(--text-secondary)' : 'var(--accent-primary)';
    }

    const printModalOverlay = document.getElementById('print-modal-overlay');
    const printModal = document.getElementById('print-modal');
    document.getElementById('print-btn').addEventListener('click', () => {
        printModalOverlay.classList.remove('hidden');
        printModal.classList.remove('hidden');
        updatePrintFitHint();
    });
    function closePrintModal() { printModalOverlay.classList.add('hidden'); printModal.classList.add('hidden'); }
    document.getElementById('close-print-modal-btn').addEventListener('click', closePrintModal);
    printModalOverlay.addEventListener('click', closePrintModal);
    ['print-scale', 'print-paper'].forEach(id => document.getElementById(id).addEventListener('change', updatePrintFitHint));
    document.querySelectorAll('input[name="print-orientation"]').forEach(r => r.addEventListener('change', updatePrintFitHint));

    function forEachDeepObject(objects, callback) {
        objects.forEach(obj => {
            callback(obj);
            if (obj._objects) forEachDeepObject(obj._objects, callback);
        });
    }

    document.getElementById('print-apply-btn').addEventListener('click', () => {
        if (document.getElementById('print-all-floors').checked && floors.length > 1) {
            closePrintModal();
            printAllFloors();
            return;
        }
        const plan = getPrintPlan();
        if (!plan) { closePrintModal(); return; }
        const PRINT_DPI = 150;
        const pixelsPerCm = PRINT_DPI / 2.54;
        const targetWidthPx = plan.printedWidthCm * pixelsPerCm;
        const multiplier = targetWidthPx / plan.bbox.width;

        const originalBg = canvas.backgroundColor;
        canvas.backgroundColor = '#ffffff';
        const colorOverrides = [];
        forEachDeepObject(canvas.getObjects(), (obj) => {
            if (obj.stroke) { colorOverrides.push({ obj, prop: 'stroke', original: obj.stroke }); obj.stroke = '#1a1a1a'; }
            if (obj.type === 'i-text' || obj.type === 'text') { if (obj.fill) { colorOverrides.push({ obj, prop: 'fill', original: obj.fill }); obj.fill = '#1a1a1a'; } }
        });

        const originalVpt = canvas.viewportTransform.slice();
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        const dataUrl = canvas.toDataURL({
            format: 'png',
            left: plan.bbox.left,
            top: plan.bbox.top,
            width: plan.bbox.width,
            height: plan.bbox.height,
            multiplier: multiplier,
        });
        canvas.setViewportTransform(originalVpt);
        canvas.backgroundColor = originalBg;
        colorOverrides.forEach(({ obj, prop, original }) => { obj[prop] = original; });
        canvas.renderAll();

        const printImage = document.getElementById('print-image');
        printImage.src = dataUrl;
        printImage.style.width = `${plan.printedWidthCm}cm`;
        printImage.style.height = `${plan.printedHeightCm}cm`;
        closePrintModal();
        setTimeout(() => window.print(), 200);
    });

    const chamferModalOverlay = document.getElementById('chamfer-modal-overlay');
    const chamferModal = document.getElementById('chamfer-modal');
    function openChamferModal() { chamferModalOverlay.classList.remove('hidden'); chamferModal.classList.remove('hidden'); }
    function closeChamferModal() { chamferModalOverlay.classList.add('hidden'); chamferModal.classList.add('hidden'); }
    document.getElementById('close-chamfer-modal-btn').addEventListener('click', closeChamferModal);
    chamferModalOverlay.addEventListener('click', closeChamferModal);

    function activateChamferInteractiveMode() {
        currentMode = 'chamfer-active';
        canvas.discardActiveObject();
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.renderAll();
        toolTip.innerText = 'Click near a wall corner to chamfer it.';
        toolButtons.forEach(btn => btn.classList.remove('active'));
        document.getElementById('chamfer-tool-btn').classList.add('active');
    }

    document.getElementById('chamfer-apply-btn').addEventListener('click', () => {
        chamferDistance = fromDisplayLength(parseFloat(document.getElementById('chamfer-distance').value)) || 0.3;
        closeChamferModal();
        activateChamferInteractiveMode();
    });


    const filletModalOverlay = document.getElementById('fillet-modal-overlay');
    const filletModal = document.getElementById('fillet-modal');
    function openFilletModal() { filletModalOverlay.classList.remove('hidden'); filletModal.classList.remove('hidden'); }
    function closeFilletModal() { filletModalOverlay.classList.add('hidden'); filletModal.classList.add('hidden'); }
    document.getElementById('close-fillet-modal-btn').addEventListener('click', closeFilletModal);
    filletModalOverlay.addEventListener('click', closeFilletModal);

    function activateFilletInteractiveMode() {
        currentMode = 'fillet-active';
        canvas.discardActiveObject();
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.renderAll();
        toolTip.innerText = 'Click near a wall corner to round it.';
        toolButtons.forEach(btn => btn.classList.remove('active'));
        document.getElementById('fillet-tool-btn').classList.add('active');
    }

    document.getElementById('fillet-apply-btn').addEventListener('click', () => {
        filletRadius = fromDisplayLength(parseFloat(document.getElementById('fillet-radius').value)) || 0.5;
        closeFilletModal();
        activateFilletInteractiveMode();
    });

    if (!FEATURES.fillet) {
        document.getElementById('fillet-tool-btn').remove();
    }


    const GRAPH_TOL = 4;
    const MIN_ROOM_AREA_PX = 800;
    const graphModalOverlay = document.getElementById('graph-modal-overlay');
    const graphModal = document.getElementById('graph-modal');
    const graphSummary = document.getElementById('graph-summary');
    const graphMessage = document.getElementById('graph-message');

    function collectWalls() {
        return canvas.getObjects().filter(o => o.data && o.data.type === 'wall-system' && Array.isArray(o.points) && o.points.length >= 2);
    }

    function wallRecords(walls) {
        return walls.map(w => ({
            points: getWallAbsPoints(w).map(p => ({ x: p.x, y: p.y })),
            thickness: w.strokeWidth || 1,
            layer: (w.data && w.data.layer) || 'walls'
        }));
    }

    function polygonArea(points) {
        let sum = 0;
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            sum += a.x * b.y - b.x * a.y;
        }
        return Math.abs(sum / 2);
    }

    function signedArea(points) {
        let sum = 0;
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            sum += a.x * b.y - b.x * a.y;
        }
        return sum / 2;
    }

    function bridgeHole(outer, hole) {
        const ring = hole.slice();
        if (Math.sign(signedArea(ring)) === Math.sign(signedArea(outer))) ring.reverse();
        let bi = 0;
        let bj = 0;
        let bd = Infinity;
        outer.forEach((p, i) => ring.forEach((q, k) => {
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d < bd) { bd = d; bi = i; bj = k; }
        }));
        const merged = outer.slice(0, bi + 1);
        for (let k = 0; k <= ring.length; k++) merged.push(ring[(bj + k) % ring.length]);
        merged.push(outer[bi]);
        return merged.concat(outer.slice(bi + 1));
    }

    function analyzePlan() {
        const walls = collectWalls();
        const graph = buildGraph(wallRecords(walls), GRAPH_TOL);
        const stats = graphStats(graph);
        const rooms = findFaces(graph, MIN_ROOM_AREA_PX).map(face => {
            const info = faceInfo(graph, face);
            let netPoints = offsetPolygonPoints(face.points, -info.thickness / 2);
            if (!netPoints || netPoints.length < 3 || polygonArea(netPoints) < 1) netPoints = face.points;
            return { netPoints: netPoints, gross: face.points, nodeIds: new Set(face.nodeIds), grossArea: face.area, area: polygonArea(netPoints), perimeter: info.perimeter, key: info.key, holes: [] };
        });
        if (FEATURES.roomHoles) {
            findOuterBoundaries(graph, MIN_ROOM_AREA_PX).forEach(outer => {
                const info = faceInfo(graph, outer);
                let host = null;
                rooms.forEach(room => {
                    if (outer.nodeIds.some(id => room.nodeIds.has(id))) return;
                    if (!pointInPolygon(outer.points[0], room.gross)) return;
                    if (!host || room.grossArea < host.grossArea) host = room;
                });
                if (!host) return;
                const holePoints = offsetPolygonPoints(outer.points, info.thickness / 2) || outer.points;
                host.holes.push({ points: holePoints, key: info.key });
            });
            rooms.forEach(room => {
                if (!room.holes.length) return;
                let ring = room.netPoints;
                room.holes.forEach(hole => { ring = bridgeHole(ring, hole.points); });
                room.netPoints = ring;
                room.area = polygonArea(ring);
                room.key = room.key + '#' + room.holes.map(h => h.key).join('#');
            });
        }
        return { walls, graph, stats, rooms };
    }

    function toMeters(px) { return formatLength(px / PIXELS_PER_METER); }
    function toSquareMeters(px2) { return formatArea(px2 / (PIXELS_PER_METER * PIXELS_PER_METER)); }

    function graphRow(label, value) {
        const row = document.createElement('div');
        row.className = 'graph-row';
        const a = document.createElement('span');
        a.textContent = label;
        const b = document.createElement('span');
        b.textContent = value;
        row.append(a, b);
        return row;
    }

    function renderGraphSummary() {
        const plan = analyzePlan();
        graphSummary.innerHTML = '';
        graphSummary.appendChild(graphRow('Wall objects', String(plan.walls.length)));
        graphSummary.appendChild(graphRow('Wall segments (after splitting)', String(plan.stats.edges)));
        graphSummary.appendChild(graphRow('Corners / junctions / free ends', `${plan.stats.bends} / ${plan.stats.junctions} / ${plan.stats.ends}`));
        graphSummary.appendChild(graphRow('Total wall length', toMeters(plan.stats.totalLength)));
        graphSummary.appendChild(graphRow('Closed rooms found', String(plan.rooms.length)));
        let total = 0;
        if (plan.rooms.length) {
            const heading = document.createElement('div');
            heading.className = 'graph-heading';
            heading.textContent = 'Net floor area (inside walls)';
            graphSummary.appendChild(heading);
            plan.rooms.forEach((room, i) => {
                total += room.area;
                graphSummary.appendChild(graphRow(`Room ${i + 1} (perimeter ${toMeters(room.perimeter)})`, toSquareMeters(room.area)));
            });
            graphSummary.appendChild(graphRow('Total floor area', toSquareMeters(total)));
        }
    }

    function openGraphModal() {
        graphMessage.textContent = '';
        renderGraphSummary();
        graphModalOverlay.classList.remove('hidden');
        graphModal.classList.remove('hidden');
    }

    function closeGraphModal() {
        graphModalOverlay.classList.add('hidden');
        graphModal.classList.add('hidden');
    }

    document.getElementById('close-graph-modal-btn').addEventListener('click', closeGraphModal);
    graphModalOverlay.addEventListener('click', closeGraphModal);

    function detectRooms() {
        const plan = analyzePlan();
        const existing = canvas.getObjects().filter(o => o.data && o.data.type === 'room');
        const existingKeys = new Set(existing.map(o => o.data.graphKey).filter(Boolean));
        let created = 0;
        let skipped = 0;
        let stale = 0;
        plan.rooms.forEach(room => {
            if (existingKeys.has(room.key)) { skipped++; return; }
            const pts = room.netPoints;
            const minX = Math.min(...pts.map(p => p.x));
            const minY = Math.min(...pts.map(p => p.y));
            const cx = (minX + Math.max(...pts.map(p => p.x))) / 2;
            const cy = (minY + Math.max(...pts.map(p => p.y))) / 2;
            const sameSpot = existing.find(o => {
                const c = o.getCenterPoint();
                const area = o.type === 'polygon' ? polygonArea(o.points) * Math.abs(o.scaleX * o.scaleY) : o.getScaledWidth() * o.getScaledHeight();
                return Math.hypot(c.x - cx, c.y - cy) < 0.3 * PIXELS_PER_METER && Math.abs(area - room.area) / room.area < 0.25;
            });
            if (sameSpot) {
                skipped++;
                if (sameSpot.data.graphKey) stale++;
                return;
            }
            const color = ROOM_FILL_COLORS[roomColorIndex++ % ROOM_FILL_COLORS.length];
            const polygon = createRoomPolygon(pts, color, { layer: 'walls', type: 'room', baseColor: color, hatchPattern: 'solid', graphKey: room.key, holes: room.holes.length });
            canvas.add(polygon);
            created++;
        });
        if (created) {
            canvas.discardActiveObject();
            canvas.renderAll();
            saveState('Detect rooms');
        }
        const staleNote = stale ? ` ${stale} detected room${stale > 1 ? 's have' : ' has'} a different shape now; delete ${stale > 1 ? 'them' : 'it'} and detect again to refresh.` : '';
        graphMessage.textContent = (created
            ? `Created ${created} room${created > 1 ? 's' : ''} from closed wall loops${skipped ? ` (${skipped} already existed)` : ''}.`
            : (plan.rooms.length ? 'All closed loops already have a room.' : 'No closed wall loops found. Make sure the walls meet at their ends.')) + staleNote;
        renderGraphSummary();
    }

    function mergeConnectedWalls() {
        const walls = collectWalls();
        const chains = mergeChains(wallRecords(walls), GRAPH_TOL);
        if (!chains.length) {
            graphMessage.textContent = 'No wall pieces to merge. Only two walls meeting end to end, with the same thickness and layer and nothing else touching the corner, are joined.';
            return;
        }
        let pieces = 0;
        chains.forEach(chain => {
            const merged = wallFromAbsPoints(walls[chain.members[0]], chain.points, { layer: chain.layer, type: 'wall-system' });
            chain.members.forEach(i => canvas.remove(walls[i]));
            canvas.add(merged);
            pieces += chain.members.length;
        });
        canvas.discardActiveObject();
        canvas.renderAll();
        saveState('Merge walls');
        graphMessage.textContent = `Merged ${pieces} wall pieces into ${chains.length} continuous wall${chains.length > 1 ? 's' : ''}. Chamfer and Fillet now work across those corners.`;
        renderGraphSummary();
    }


    function createRoomPolygon(pts, fill, data) {
        const minX = Math.min(...pts.map(p => p.x));
        const minY = Math.min(...pts.map(p => p.y));
        const hasHoles = !!(data && data.holes);
        return new fabric.Polygon(pts.map(p => ({ x: p.x - minX, y: p.y - minY })), {
            left: minX, top: minY,
            fill: fill,
            stroke: hasHoles ? null : cssVar('--text-primary'),
            strokeWidth: hasHoles ? 0 : 2,
            selectable: true,
            data: data
        });
    }

    function refreshAutoRooms() {
        const plan = analyzePlan();
        const unmatched = plan.rooms.slice();
        canvas.getObjects().filter(o => o.data && o.data.type === 'room' && o.data.graphKey && o.type === 'polygon').forEach(old => {
            const oc = old.getCenterPoint();
            const oldArea = polygonArea(old.points) * Math.abs(old.scaleX * old.scaleY);
            let best = null;
            unmatched.forEach((room, i) => {
                const xs = room.netPoints.map(p => p.x);
                const ys = room.netPoints.map(p => p.y);
                const d = Math.hypot((Math.min(...xs) + Math.max(...xs)) / 2 - oc.x, (Math.min(...ys) + Math.max(...ys)) / 2 - oc.y);
                const ratio = room.area / oldArea;
                if (d < 3 * PIXELS_PER_METER && ratio > 0.3 && ratio < 3 && (!best || d < best.d)) best = { room, i, d };
            });
            if (!best) return;
            unmatched.splice(best.i, 1);
            const fresh = createRoomPolygon(best.room.netPoints, old.fill, Object.assign({}, old.data, { graphKey: best.room.key, holes: best.room.holes.length }));
            canvas.remove(old);
            canvas.add(fresh);
        });
    }

    let nodeDrag = null;

    function startNodeDrag(pointer) {
        const walls = collectWalls();
        const records = wallRecords(walls);
        const graph = buildGraph(records, GRAPH_TOL);
        let best = null;
        graph.nodes.forEach(n => {
            const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
            if (d < 20 && (!best || d < best.d)) best = { node: n, d };
        });
        if (!best) { toolTip.innerText = 'No wall corner or junction found nearby.'; return; }
        const node = { x: best.node.x, y: best.node.y };
        const items = [];
        records.forEach((rec, wi) => {
            const out = [];
            const indices = [];
            for (let i = 0; i < rec.points.length; i++) {
                const a = rec.points[i];
                out.push({ x: a.x, y: a.y });
                const aNear = Math.hypot(a.x - node.x, a.y - node.y) <= GRAPH_TOL;
                if (aNear) indices.push(out.length - 1);
                if (i < rec.points.length - 1) {
                    const b = rec.points[i + 1];
                    const bNear = Math.hypot(b.x - node.x, b.y - node.y) <= GRAPH_TOL;
                    if (!aNear && !bNear && pointToSegmentDistance(node, a, b) <= GRAPH_TOL) {
                        out.push({ x: node.x, y: node.y });
                        indices.push(out.length - 1);
                    }
                }
            }
            if (indices.length) items.push({ wall: walls[wi], points: out, indices: indices });
        });
        nodeDrag = { items: items, last: null, moved: false };
        toolTip.innerText = 'Drag to move the corner.';
    }

    function updateNodeDrag(target) {
        if (nodeDrag.last && nodeDrag.last.x === target.x && nodeDrag.last.y === target.y) return;
        nodeDrag.last = { x: target.x, y: target.y };
        nodeDrag.moved = true;
        nodeDrag.items.forEach(item => {
            const pts = item.points.map((p, i) => item.indices.indexOf(i) >= 0 ? { x: target.x, y: target.y } : p);
            const fresh = wallFromAbsPoints(item.wall, pts, { layer: (item.wall.data && item.wall.data.layer) || 'walls', type: 'wall-system' });
            canvas.remove(item.wall);
            canvas.add(fresh);
            item.wall = fresh;
        });
        canvas.renderAll();
    }

    function endNodeDrag() {
        const drag = nodeDrag;
        nodeDrag = null;
        if (!drag || !drag.moved) return;
        refreshAutoRooms();
        canvas.discardActiveObject();
        canvas.renderAll();
        saveState('Move corner');
        toolTip.innerText = 'Corner moved. Drag another corner, or switch tools when done.';
    }

    if (!FEATURES.nodeEdit) {
        document.getElementById('node-tool-btn').remove();
    }


    const NORMALIZE_TOL = 1.5;
    let graphAuto = settings.graphAuto;
    const graphAutoToggle = document.getElementById('graph-auto-toggle');
    graphAutoToggle.checked = graphAuto;
    graphAutoToggle.addEventListener('change', () => {
        graphAuto = graphAutoToggle.checked;
        updateSetting('graphAuto', graphAuto);
        if (graphAuto) normalizeWalls(false);
    });

    function normalizeWalls(announce) {
        const walls = collectWalls();
        if (!walls.length) { if (announce) graphMessage.textContent = 'There are no walls to normalize.'; return 0; }
        const records = wallRecords(walls);
        const graph = buildGraph(records, NORMALIZE_TOL);
        const chains = chainsFromGraph(graph, records);
        const template = walls[0];
        const priorRender = canvas.renderOnAddRemove;
        canvas.renderOnAddRemove = false;
        walls.forEach(w => canvas.remove(w));
        chains.forEach(chain => {
            const src = walls[chain.source] || template;
            const wall = wallFromAbsPoints(src, chain.points, { layer: chain.layer, type: 'wall-system' });
            wall.set('strokeWidth', chain.thickness);
            canvas.add(wall);
        });
        canvas.renderOnAddRemove = priorRender;
        canvas.discardActiveObject();
        canvas.renderAll();
        if (announce) {
            saveState('Normalize walls');
            graphMessage.textContent = `Rebuilt ${walls.length} wall object${walls.length > 1 ? 's' : ''} as ${chains.length} graph edge chain${chains.length > 1 ? 's' : ''}: shared corners are exact, overlaps removed and crossings split.`;
            renderGraphSummary();
        }
        return chains.length;
    }


    function serializeWallGraph() {
        const walls = collectWalls();
        if (!walls.length) return null;
        const records = wallRecords(walls);
        const graph = buildGraph(records, NORMALIZE_TOL);
        return {
            version: 1,
            authoritative: graphAuto,
            nodes: graph.nodes.map(n => ({ x: n.x, y: n.y })),
            edges: graph.edges.map(e => ({ a: e.a, b: e.b, t: e.thickness, l: records[e.walls[0]].layer }))
        };
    }

    function deserializeWallGraph(data) {
        if (!data || data.version !== 1 || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;
        const nodes = data.nodes.map((n, i) => ({ id: i, x: Number(n.x), y: Number(n.y) }));
        if (nodes.some(n => !isFinite(n.x) || !isFinite(n.y))) return null;
        const layers = [];
        const layerIndex = new Map();
        const edges = [];
        for (const e of data.edges) {
            if (!Number.isInteger(e.a) || !Number.isInteger(e.b) || e.a === e.b || e.a < 0 || e.b < 0 || e.a >= nodes.length || e.b >= nodes.length) return null;
            const thickness = Number(e.t);
            if (!(thickness > 0)) return null;
            const layer = typeof e.l === 'string' ? e.l : 'walls';
            if (!layerIndex.has(layer)) { layerIndex.set(layer, layers.length); layers.push({ layer: layer }); }
            edges.push({ id: edges.length, a: e.a, b: e.b, len: Math.hypot(nodes[e.a].x - nodes[e.b].x, nodes[e.a].y - nodes[e.b].y), thickness: thickness, walls: [layerIndex.get(layer)] });
        }
        const adjacency = nodes.map(() => []);
        edges.forEach(e => { adjacency[e.a].push(e.id); adjacency[e.b].push(e.id); });
        return { graph: { nodes, edges, adjacency }, layers };
    }

    function applyWallGraph(data) {
        const parsed = deserializeWallGraph(data);
        if (!parsed) return false;
        const chains = chainsFromGraph(parsed.graph, parsed.layers);
        const priorRender = canvas.renderOnAddRemove;
        canvas.renderOnAddRemove = false;
        collectWalls().forEach(w => canvas.remove(w));
        const template = { stroke: cssVar('--text-primary'), strokeWidth: 1 };
        chains.forEach(chain => {
            const wall = wallFromAbsPoints(template, chain.points, { layer: chain.layer, type: 'wall-system' });
            wall.set('strokeWidth', chain.thickness);
            canvas.add(wall);
        });
        canvas.renderOnAddRemove = priorRender;
        canvas.renderAll();
        return true;
    }

    document.getElementById('graph-normalize-btn').addEventListener('click', () => normalizeWalls(true));
    if (!FEATURES.normalizeWalls) {
        document.getElementById('graph-normalize-btn').remove();
        document.getElementById('graph-auto-label').remove();
        graphAuto = false;
    }

    document.getElementById('graph-rooms-btn').addEventListener('click', detectRooms);
    document.getElementById('graph-merge-btn').addEventListener('click', mergeConnectedWalls);

    if (!FEATURES.wallGraph) {
        document.getElementById('graph-tool-btn').remove();
    }

    downloadBtn.addEventListener('click', () => {
        const format = document.querySelector('input[name="format"]:checked').value;
        const scale = parseFloat(document.getElementById('export-scale').value);
        const options = { format: format, multiplier: scale, quality: 1.0 };
        const link = document.createElement('a');
        link.href = canvas.toDataURL(options);
        link.download = `gncad-export.${format}`;
        link.click();
        closeModal();
    });
    function enlivenFloorObjects(floor) {
        if (floor.id === activeFloorId) return Promise.resolve(canvas.getObjects());
        if (!floor.json || !Array.isArray(floor.json.objects)) return Promise.resolve([]);
        return new Promise(resolve => {
            fabric.util.enlivenObjects(JSON.parse(JSON.stringify(floor.json.objects)), objs => resolve(objs));
        });
    }

    async function exportAllFloorsDxf() {
        captureActiveFloor();
        const groups = [];
        for (let i = 0; i < floors.length; i++) {
            const safe = String(floors[i].name).replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
            groups.push({ name: `FLOOR_${i + 1}${safe ? '_' + safe : ''}`, objects: await enlivenFloorObjects(floors[i]) });
        }
        const blob = new Blob([exportFloorsToDXF(groups)], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'naqshcad-all-floors.dxf';
        a.click();
        URL.revokeObjectURL(url);
    }

    const exportAllDxfBtn = document.getElementById('export-all-dxf-btn');
    if (FEATURES.allFloorsExport) exportAllDxfBtn.addEventListener('click', exportAllFloorsDxf);
    else exportAllDxfBtn.remove();

    exportDxfBtn.addEventListener('click', () => { const dxfString = exportToDXF(canvas); const blob = new Blob([dxfString], { type: 'application/dxf' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'gncad-export.dxf'; a.click(); URL.revokeObjectURL(url);});
    importDxfBtn.addEventListener('click', () => dxfFileInput.click());
    dxfFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        importDxf(fabric, canvas, cssVar, file, () => saveState('Import DXF'));
    });
    function sameColor(a, b) {
        return typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase();
    }

    function recolorTree(obj, from, to) {
        if (sameColor(obj.stroke, from)) obj.set('stroke', to);
        if (sameColor(obj.fill, from)) obj.set('fill', to);
        if (obj._objects) obj._objects.forEach(child => recolorTree(child, from, to));
    }

    function applyThemeRecolor(from, to) {
        canvas.getObjects().forEach(o => recolorTree(o, from, to));
        const needle = '"' + from + '"';
        const swap = '"' + to + '"';
        floors.forEach(f => {
            if (f.id === activeFloorId) return;
            if (f.json) f.json = JSON.parse(JSON.stringify(f.json).split(needle).join(swap));
            if (f.history) {
                f.history.history.concat(f.history.redoStack).forEach(e => { e.json = e.json.split(needle).join(swap); });
            }
        });
        historyManager.replaceInStates(from, to);
        rebuildGhost();
    }


    const rightPanel = document.getElementById('right-panel');
    const panelToggleBtn = document.getElementById('panel-toggle-btn');
    const panelBackdrop = document.getElementById('panel-backdrop');
    function closePanel() {
        rightPanel.classList.remove('panel-open');
        panelBackdrop.classList.remove('visible');
    }
    panelToggleBtn.addEventListener('click', () => {
        rightPanel.classList.toggle('panel-open');
        panelBackdrop.classList.toggle('visible', rightPanel.classList.contains('panel-open'));
    });
    panelBackdrop.addEventListener('click', closePanel);

    showRulersCheckbox.addEventListener('change', () => {
        drawRulers();
        drawCrosshairs(lastMousePos);
    });

    const panBtn = document.getElementById('pan-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');

    function setGrabMode(active) {
        canvas.isGrabMode = active;
        canvas.defaultCursor = active ? 'grab' : 'default';
        canvas.selection = !active;
        panBtn.classList.toggle('active', active);
        canvas.renderAll();
    }

    panBtn.addEventListener('click', () => setGrabMode(!canvas.isGrabMode));

    function zoomBy(factor) {
        let zoom = canvas.getZoom() * factor;
        if (zoom > 10) zoom = 10;
        if (zoom < 0.1) zoom = 0.1;
        const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
        canvas.zoomToPoint(center, zoom);
        zoomDisplay.innerText = `Zoom: ${Math.round(zoom * 100)}%`;
        drawRulers();
    }

    zoomInBtn.addEventListener('click', () => zoomBy(1.2));
    zoomOutBtn.addEventListener('click', () => zoomBy(1 / 1.2));
    wallThicknessSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('thickness-option')) {
            wallThicknessSelector.querySelectorAll('.thickness-option').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            currentStrokeWidth = parseInt(e.target.dataset.thickness, 10);
        }
    });

    const layerList = document.getElementById('layer-list');
    layerList.querySelectorAll('.visibility-toggle').forEach(toggle => { toggle.innerHTML = ICON_EYE; });
    layerList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-layer-btn');
        if (removeBtn) {
            const layerItem = removeBtn.closest('.layer-item');
            removeCustomLayer(layerItem.dataset.layer);
            return;
        }
        const toggle = e.target.closest('.visibility-toggle');
        if (!toggle) return;
        const layerItem = toggle.closest('.layer-item');
        const layerName = layerItem.dataset.layer;
        const newVisible = toggle.dataset.visible !== 'true';
        toggle.dataset.visible = String(newVisible);
        toggle.innerHTML = newVisible ? ICON_EYE : ICON_EYE_OFF;
        canvas.getObjects().forEach(obj => {
            if (obj.data && obj.data.layer === layerName) {
                obj.visible = newVisible;
            }
        });
        canvas.renderAll();
    });

    function getAllLayers() {
        return [
            { id: 'walls', name: 'Walls' },
            { id: 'furniture', name: 'Furniture' },
            { id: 'dimensions', name: 'Dimensions' },
            { id: 'annotations', name: 'Annotations' },
            ...customLayers,
        ];
    }

    function addCustomLayer(name, existingId) {
        const id = existingId || ('custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36));
        customLayers.push({ id, name });
        const li = document.createElement('li');
        li.className = 'layer-item custom-layer-item';
        li.dataset.layer = id;
        li.innerHTML = `<span class="remove-layer-btn">${ICON_X}</span><span>${name}</span><span class="visibility-toggle" data-visible="true">${ICON_EYE}</span>`;
        layerList.appendChild(li);
    }

    function removeCustomLayer(id) {
        customLayers = customLayers.filter(l => l.id !== id);
        const li = layerList.querySelector(`.layer-item[data-layer="${id}"]`);
        if (li) li.remove();
        canvas.getObjects().forEach(obj => {
            if (obj.data && obj.data.layer === id) {
                obj.data.layer = 'furniture';
                obj.visible = true;
            }
        });
        canvas.renderAll();
        if (canvas.getActiveObject()) updatePropertiesPanel(canvas.getActiveObject());
    }

    document.getElementById('add-layer-btn').addEventListener('click', () => {
        const name = prompt('New layer name:');
        if (name && name.trim()) addCustomLayer(name.trim());
    });

    function syncLayerUI() {
        layerList.querySelectorAll('.layer-item').forEach(item => {
            const toggle = item.querySelector('.visibility-toggle');
            toggle.dataset.visible = 'true';
            toggle.innerHTML = ICON_EYE;
        });
        canvas.getObjects().forEach(obj => { obj.visible = true; });
        canvas.renderAll();
    }

    const FURNITURE_CATALOG = {
        'Living Room': [
            { id: 'sofa', name: 'Sofa', file: 'sofa.png', sizeMeters: 2.0 },
            { id: 'loveseat', name: 'Loveseat', file: 'loveseat.png', sizeMeters: 1.4 },
            { id: 'armchair', name: 'Armchair', file: 'chair.png', sizeMeters: 0.8 },
            { id: 'coffee-table', name: 'Coffee Table', file: 'coffee_table.png', sizeMeters: 1.2 },
            { id: 'tv-stand', name: 'TV Stand', file: 'tv_stand.png', sizeMeters: 1.5 },
            { id: 'television', name: 'Television', file: 'television.png', sizeMeters: 1.2 },
            { id: 'bookshelf', name: 'Bookshelf', file: 'bookshelf.png', sizeMeters: 0.8 },
            { id: 'side-table', name: 'Side Table', file: 'side_table.png', sizeMeters: 0.5 },
            { id: 'fireplace', name: 'Fireplace', file: 'fireplace.png', sizeMeters: 1.2 },
            { id: 'storage', name: 'Storage Cabinet', file: 'storage.png', sizeMeters: 1.0 },
            { id: 'piano', name: 'Piano', file: 'piano.svg', sizeMeters: 1.5 },
        ],
        'Bedroom': [
            { id: 'bed-queen', name: 'Queen Bed', file: 'bed_queen.png', sizeMeters: 2.0 },
            { id: 'bed-twin', name: 'Twin Bed', file: 'bed_twin.png', sizeMeters: 1.9 },
            { id: 'nightstand', name: 'Nightstand', file: 'nightstand.png', sizeMeters: 0.5 },
            { id: 'dresser', name: 'Dresser', file: 'dresser.png', sizeMeters: 1.2 },
            { id: 'wardrobe', name: 'Wardrobe', file: 'wardrobe.png', sizeMeters: 1.2 },
            { id: 'coat-rack', name: 'Coat Rack', file: 'coat-rack.svg', sizeMeters: 0.4 },
        ],
        'Kitchen': [
            { id: 'stove', name: 'Stove', file: 'stove.png', sizeMeters: 0.6 },
            { id: 'oven', name: 'Oven', file: 'oven.png', sizeMeters: 0.6 },
            { id: 'fridge', name: 'Fridge', file: 'fridge.png', sizeMeters: 0.7 },
            { id: 'sink-kitchen', name: 'Kitchen Sink', file: 'sink_k.png', sizeMeters: 0.6 },
            { id: 'counter', name: 'Counter', file: 'counter.png', sizeMeters: 1.2 },
            { id: 'dishwasher', name: 'Dishwasher', file: 'dishwasher.png', sizeMeters: 0.6 },
            { id: 'microwave', name: 'Microwave', file: 'microwave.svg', sizeMeters: 0.5 },
            { id: 'cabinet', name: 'Cabinet', file: 'cabinet.svg', sizeMeters: 1.0 },
        ],
        'Bathroom': [
            { id: 'toilet', name: 'Toilet', file: 'toilet.png', sizeMeters: 0.65 },
            { id: 'bathtub', name: 'Bathtub', file: 'bathtub.png', sizeMeters: 1.7 },
            { id: 'shower', name: 'Shower', file: 'shower.png', sizeMeters: 0.9 },
            { id: 'sink-bathroom', name: 'Sink', file: 'sink_b.png', sizeMeters: 0.6 },
            { id: 'washer-dryer', name: 'Washer/Dryer', file: 'washer_dryer.png', sizeMeters: 0.65 },
        ],
        'Office': [
            { id: 'desk', name: 'Desk', file: 'desk.png', sizeMeters: 1.4 },
            { id: 'office-chair', name: 'Office Chair', file: 'office_chair.png', sizeMeters: 0.45 },
            { id: 'computer', name: 'Computer', file: 'computer.svg', sizeMeters: 0.5 },
            { id: 'printer', name: 'Printer', file: 'printer.svg', sizeMeters: 0.4 },
        ],
        'Dining': [
            { id: 'dining-table', name: 'Dining Table', file: 'dining_table.png', sizeMeters: 1.2 },
            { id: 'dining-chair', name: 'Dining Chair', file: 'dining_chair.png', sizeMeters: 0.45 },
            { id: 'table', name: 'Table', file: 'table.png', sizeMeters: 1.0 },
        ],
        'Decor': [
            { id: 'rug', name: 'Rug', file: 'rug.png', sizeMeters: 3.0 },
            { id: 'round-rug', name: 'Round Rug', file: 'round_rug.png', sizeMeters: 2.0 },
            { id: 'runner-rug', name: 'Runner Rug', file: 'runner_rug.png', sizeMeters: 2.5 },
            { id: 'potted-plant', name: 'Potted Plant', file: 'potted_plant.png', sizeMeters: 0.4 },
            { id: 'floor-plant', name: 'Floor Plant', file: 'floor_plant.png', sizeMeters: 0.5 },
            { id: 'hanging-plant', name: 'Hanging Plant', file: 'hanging_plant.png', sizeMeters: 0.3 },
            { id: 'curtain', name: 'Curtain', file: 'curtain.png', sizeMeters: 1.2 },
            { id: 'sheer-curtain', name: 'Sheer Curtain', file: 'sheer_curtain.png', sizeMeters: 1.2 },
            { id: 'wall-art', name: 'Wall Art', file: 'wall_art.png', sizeMeters: 0.8 },
            { id: 'mirror', name: 'Mirror', file: 'mirror.png', sizeMeters: 0.6 },
            { id: 'clock', name: 'Clock', file: 'clock.png', sizeMeters: 0.3 },
        ],
        'Lighting': [
            { id: 'ceiling-light', name: 'Ceiling Light', file: 'ceiling_light.png', sizeMeters: 0.4 },
            { id: 'chandelier', name: 'Chandelier', file: 'chandelier.png', sizeMeters: 0.6 },
            { id: 'recessed-light', name: 'Recessed Light', file: 'recessed_light.png', sizeMeters: 0.15 },
            { id: 'floor-lamp', name: 'Floor Lamp', file: 'floor_lamp.png', sizeMeters: 0.4 },
            { id: 'table-lamp', name: 'Table Lamp', file: 'table_lamp.png', sizeMeters: 0.25 },
            { id: 'wall-sconce', name: 'Wall Sconce', file: 'wall_sconce.png', sizeMeters: 0.15 },
            { id: 'pendant-light', name: 'Pendant Light', file: 'pendant_light.png', sizeMeters: 0.3 },
        ],
        'Electrical & Plumbing': [
            { id: 'sym-outlet', name: 'Power Outlet', file: 'sym_outlet.png', sizeMeters: 0.15 },
            { id: 'sym-switch', name: 'Light Switch', file: 'sym_switch.png', sizeMeters: 0.15 },
            { id: 'sym-ceiling-light', name: 'Ceiling Light Sym.', file: 'sym_ceiling_light.png', sizeMeters: 0.2 },
            { id: 'sym-recessed-light', name: 'Recessed Light Sym.', file: 'sym_recessed_light.png', sizeMeters: 0.15 },
            { id: 'sym-pendant', name: 'Pendant Sym.', file: 'sym_pendant.png', sizeMeters: 0.18 },
            { id: 'sym-ceiling-fan', name: 'Ceiling Fan', file: 'sym_ceiling_fan.png', sizeMeters: 0.25 },
            { id: 'sym-junction', name: 'Junction Box', file: 'sym_junction.png', sizeMeters: 0.12 },
            { id: 'sym-smoke', name: 'Smoke Detector', file: 'sym_smoke.png', sizeMeters: 0.15 },
            { id: 'sym-water-supply', name: 'Water Supply', file: 'sym_water_supply.png', sizeMeters: 0.15 },
            { id: 'sym-drain', name: 'Drain Point', file: 'sym_drain.png', sizeMeters: 0.15 },
            { id: 'sym-water-heater', name: 'Water Heater', file: 'sym_water_heater.png', sizeMeters: 0.2 },
            { id: 'sym-washer-hookup', name: 'Washer Hookup', file: 'sym_washer_hookup.png', sizeMeters: 0.15 },
            { id: 'sym-gas-line', name: 'Gas Line', file: 'sym_gas_line.png', sizeMeters: 0.15 },
        ],
        'More Furniture': [
            { id: 'l-sofa', name: 'L-Shaped Sofa', file: 'l-sofa.svg', sizeMeters: 2.4 },
            { id: 'ottoman', name: 'Ottoman', file: 'ottoman.svg', sizeMeters: 0.5 },
            { id: 'bench', name: 'Bench', file: 'bench.svg', sizeMeters: 1.2 },
            { id: 'recliner', name: 'Recliner', file: 'recliner.svg', sizeMeters: 0.9 },
            { id: 'king-bed', name: 'King Bed', file: 'king-bed.svg', sizeMeters: 2.1 },
            { id: 'bunk-bed', name: 'Bunk Bed', file: 'bunk-bed.svg', sizeMeters: 2.0 },
            { id: 'crib', name: 'Crib', file: 'crib.svg', sizeMeters: 1.3 },
            { id: 'bar-stool', name: 'Bar Stool', file: 'bar-stool.svg', sizeMeters: 0.4 },
            { id: 'kitchen-island', name: 'Kitchen Island', file: 'kitchen-island.svg', sizeMeters: 2.0 },
            { id: 'vanity', name: 'Bathroom Vanity', file: 'vanity.svg', sizeMeters: 1.2 },
            { id: 'bidet', name: 'Bidet', file: 'bidet.svg', sizeMeters: 0.7 },
            { id: 'towel-rail', name: 'Towel Rail', file: 'towel-rail.svg', sizeMeters: 0.6 },
            { id: 'corner-desk', name: 'Corner Desk', file: 'corner-desk.svg', sizeMeters: 1.6 },
            { id: 'file-cabinet', name: 'Filing Cabinet', file: 'file-cabinet.svg', sizeMeters: 0.5 },
            { id: 'tv-unit', name: 'TV Wall Unit', file: 'tv-unit.svg', sizeMeters: 2.4 },
            { id: 'aquarium', name: 'Aquarium', file: 'aquarium.svg', sizeMeters: 1.0 },
            { id: 'treadmill', name: 'Treadmill', file: 'treadmill.svg', sizeMeters: 1.8 },
            { id: 'exercise-bike', name: 'Exercise Bike', file: 'exercise-bike.svg', sizeMeters: 1.0 },
            { id: 'bean-bag', name: 'Bean Bag', file: 'bean-bag.svg', sizeMeters: 0.9 },
            { id: 'shoe-rack', name: 'Shoe Rack', file: 'shoe-rack.svg', sizeMeters: 0.8 },
            { id: 'laundry-basket', name: 'Laundry Basket', file: 'laundry-basket.svg', sizeMeters: 0.5 },
            { id: 'trash-bin', name: 'Trash Bin', file: 'trash-bin.svg', sizeMeters: 0.4 },
            { id: 'wine-rack', name: 'Wine Rack', file: 'wine-rack.svg', sizeMeters: 0.8 },
            { id: 'pool-table', name: 'Pool Table', file: 'pool-table.svg', sizeMeters: 2.4 },
        ],
        'Vehicles & Outdoor': [
            { id: 'car', name: 'Car', file: 'car.svg', sizeMeters: 4.5 },
            { id: 'bicycle', name: 'Bicycle', file: 'bicycle.svg', sizeMeters: 1.8 },
            { id: 'motorcycle', name: 'Motorcycle', file: 'motorcycle.svg', sizeMeters: 2.1 },
            { id: 'parking', name: 'Parking Space', file: 'parking.svg', sizeMeters: 5.0 },
            { id: 'gate', name: 'Gate', file: 'gate.svg', sizeMeters: 3.0 },
            { id: 'fence', name: 'Fence', file: 'fence.svg', sizeMeters: 3.0 },
            { id: 'patio-table', name: 'Patio Table', file: 'patio-table.svg', sizeMeters: 1.5 },
            { id: 'sun-lounger', name: 'Sun Lounger', file: 'sun-lounger.svg', sizeMeters: 1.9 },
            { id: 'hot-tub', name: 'Hot Tub', file: 'hot-tub.svg', sizeMeters: 2.0 },
            { id: 'shed', name: 'Garden Shed', file: 'shed.svg', sizeMeters: 3.0 },
            { id: 'trampoline', name: 'Trampoline', file: 'trampoline.svg', sizeMeters: 3.0 },
        ],
        'MEP Symbols': [
            { id: 'sym-data-outlet', name: 'Data Outlet', file: 'sym-data-outlet.svg', sizeMeters: 0.15 },
            { id: 'sym-tv-point', name: 'TV Point', file: 'sym-tv-point.svg', sizeMeters: 0.15 },
            { id: 'sym-thermostat', name: 'Thermostat', file: 'sym-thermostat.svg', sizeMeters: 0.15 },
            { id: 'sym-dist-board', name: 'Distribution Board', file: 'sym-dist-board.svg', sizeMeters: 0.3 },
            { id: 'sym-wall-light', name: 'Wall Light', file: 'sym-wall-light.svg', sizeMeters: 0.15 },
            { id: 'sym-switch-3way', name: '3-Way Switch', file: 'sym-switch-3way.svg', sizeMeters: 0.15 },
            { id: 'sym-dimmer', name: 'Dimmer', file: 'sym-dimmer.svg', sizeMeters: 0.15 },
            { id: 'sym-doorbell', name: 'Doorbell', file: 'sym-doorbell.svg', sizeMeters: 0.12 },
            { id: 'sym-exit-sign', name: 'Exit Sign', file: 'sym-exit-sign.svg', sizeMeters: 0.3 },
            { id: 'sym-sprinkler', name: 'Sprinkler', file: 'sym-sprinkler.svg', sizeMeters: 0.15 },
            { id: 'sym-cctv', name: 'CCTV Camera', file: 'sym-cctv.svg', sizeMeters: 0.2 },
            { id: 'sym-radiator', name: 'Radiator', file: 'sym-radiator.svg', sizeMeters: 0.9 },
            { id: 'sym-ac-split', name: 'AC Split Unit', file: 'sym-ac-split.svg', sizeMeters: 0.9 },
            { id: 'sym-boiler', name: 'Boiler', file: 'sym-boiler.svg', sizeMeters: 0.5 },
            { id: 'sym-valve', name: 'Shutoff Valve', file: 'sym-valve.svg', sizeMeters: 0.12 },
            { id: 'sym-water-meter', name: 'Water Meter', file: 'sym-water-meter.svg', sizeMeters: 0.2 },
            { id: 'sym-hose-bib', name: 'Hose Bib', file: 'sym-hose-bib.svg', sizeMeters: 0.12 },
            { id: 'sym-sump-pump', name: 'Sump Pump', file: 'sym-sump-pump.svg', sizeMeters: 0.3 },
            { id: 'sym-fire-ext', name: 'Fire Extinguisher', file: 'sym-fire-ext.svg', sizeMeters: 0.15 },
            { id: 'sym-floor-drain', name: 'Floor Drain', file: 'sym-floor-drain.svg', sizeMeters: 0.2 },
        ],
        'Outdoor': [
            { id: 'plant', name: 'Plant', file: 'plant.svg', sizeMeters: 0.4 },
            { id: 'tree', name: 'Tree', file: 'tree.svg', sizeMeters: 2.0 },
            { id: 'umbrella', name: 'Umbrella', file: 'umbrella.svg', sizeMeters: 1.8 },
            { id: 'pool', name: 'Swimming Pool', file: 'pool.svg', sizeMeters: 3.0 },
            { id: 'bbq-grill', name: 'BBQ Grill', file: 'bbq-grill.svg', sizeMeters: 0.6 },
            { id: 'garden-cart', name: 'Garden Cart', file: 'garden-cart.svg', sizeMeters: 0.6 },
        ],
    };
    const CUSTOM_SYMBOLS_KEY = 'naqshcad-custom-symbols';
    const MAX_CUSTOM_SYMBOLS = 40;
    const MAX_SVG_BYTES = 300 * 1024;
    let customSymbols = [];
    let selectedAssetId = null;
    let pendingSvg = null;
    const assetList = document.getElementById('asset-list');

    function sanitizeSvg(text) {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const root = doc.documentElement;
        if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null;
        root.querySelectorAll('script, foreignObject, iframe, object, embed, audio, video, image, animate, set, animateTransform, animateMotion').forEach(n => n.remove());
        root.querySelectorAll('style').forEach(s => { if (/@import|url\(/i.test(s.textContent)) s.remove(); });
        root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value.trim().toLowerCase();
                if (name.startsWith('on')) el.removeAttribute(attr.name);
                else if ((name === 'href' || name === 'xlink:href') && !value.startsWith('#')) el.removeAttribute(attr.name);
                else if (value.includes('javascript:') || /url\(\s*['"]?(?!#)/.test(value)) el.removeAttribute(attr.name);
            });
        });
        if (!root.getAttribute('viewBox')) {
            const w = parseFloat(root.getAttribute('width'));
            const h = parseFloat(root.getAttribute('height'));
            if (!(w > 0 && h > 0)) return null;
            root.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
        root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        return new XMLSerializer().serializeToString(root);
    }

    try {
        const stored = JSON.parse(localStorage.getItem(CUSTOM_SYMBOLS_KEY) || '[]');
        if (Array.isArray(stored)) {
            customSymbols = stored
                .filter(s => s && s.id && typeof s.svg === 'string')
                .map(s => ({ id: String(s.id), name: String(s.name || 'Symbol'), sizeMeters: parseFloat(s.sizeMeters) > 0 ? parseFloat(s.sizeMeters) : 0.6, svg: sanitizeSvg(s.svg) }))
                .filter(s => s.svg);
        }
    } catch (err) {
        customSymbols = [];
    }

    function persistCustomSymbols() {
        try {
            localStorage.setItem(CUSTOM_SYMBOLS_KEY, JSON.stringify(customSymbols));
            return true;
        } catch (err) {
            return false;
        }
    }

    function getCatalog() {
        const catalog = {};
        if (customSymbols.length) catalog['Custom'] = customSymbols.map(s => ({ id: s.id, name: s.name, custom: true, svg: s.svg, sizeMeters: s.sizeMeters }));
        return Object.assign(catalog, FURNITURE_CATALOG);
    }

    function renderAssetList() {
        assetList.innerHTML = '';
        Object.entries(getCatalog()).forEach(([category, items]) => {
            const heading = document.createElement('div');
            heading.className = 'asset-category-heading';
            heading.textContent = category;
            assetList.appendChild(heading);

            const grid = document.createElement('div');
            grid.className = 'asset-category-grid';
            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'asset-item';
                if (item.id === selectedAssetId) el.classList.add('active');
                el.dataset.assetId = item.id;
                el.title = item.name;
                el.innerHTML = '<div class="asset-icon"></div><span class="asset-label"></span>';
                el.querySelector('.asset-label').textContent = item.name;
                const icon = el.querySelector('.asset-icon');
                if (item.custom) {
                    icon.classList.add('custom');
                    icon.innerHTML = item.svg;
                    const del = document.createElement('button');
                    del.className = 'asset-delete';
                    del.title = 'Remove symbol';
                    del.innerHTML = '&times;';
                    el.appendChild(del);
                } else if (item.file.endsWith('.png')) {
                    icon.innerHTML = `<img src="assets/furniture/${item.file}" alt="${item.name}" draggable="false">`;
                } else {
                    fetch(`assets/furniture/${item.file}`)
                        .then(res => res.text())
                        .then(svgText => { icon.innerHTML = svgText; })
                        .catch(() => {});
                }
                grid.appendChild(el);
            });
            assetList.appendChild(grid);
        });
    }

    renderAssetList();

    assetList.addEventListener('click', (e) => {
        const del = e.target.closest('.asset-delete');
        if (del) {
            const id = del.parentElement.dataset.assetId;
            customSymbols = customSymbols.filter(s => s.id !== id);
            persistCustomSymbols();
            if (selectedAssetId === id) selectedAssetId = null;
            renderAssetList();
            return;
        }
        const item = e.target.closest('.asset-item');
        if (!item) return;
        assetList.querySelectorAll('.asset-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        selectedAssetId = item.dataset.assetId;
        toolTip.innerText = `${item.title} selected — click on the canvas to place it.`;
    });

    const svgModalOverlay = document.getElementById('svg-modal-overlay');
    const svgModal = document.getElementById('svg-modal');
    const svgFileInput = document.getElementById('svg-file-input');
    function openSvgModal() { svgModalOverlay.classList.remove('hidden'); svgModal.classList.remove('hidden'); }
    function closeSvgModal() { svgModalOverlay.classList.add('hidden'); svgModal.classList.add('hidden'); pendingSvg = null; }
    document.getElementById('close-svg-modal-btn').addEventListener('click', closeSvgModal);
    svgModalOverlay.addEventListener('click', closeSvgModal);
    document.getElementById('import-svg-btn').addEventListener('click', () => svgFileInput.click());

    svgFileInput.addEventListener('change', () => {
        const file = svgFileInput.files[0];
        svgFileInput.value = '';
        if (!file) return;
        if (file.size > MAX_SVG_BYTES) {
            alert('This SVG is too large (limit 300 KB).');
            return;
        }
        if (customSymbols.length >= MAX_CUSTOM_SYMBOLS) {
            alert('The custom library is full. Remove a symbol first.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const clean = sanitizeSvg(String(event.target.result));
            if (!clean) {
                alert('This file is not a usable SVG.');
                return;
            }
            pendingSvg = clean;
            document.getElementById('svg-preview').innerHTML = clean;
            document.getElementById('svg-name').value = file.name.replace(/\.svg$/i, '').slice(0, 40);
            openSvgModal();
        };
        reader.readAsText(file);
    });

    document.getElementById('svg-add-btn').addEventListener('click', () => {
        if (!pendingSvg) return;
        const name = document.getElementById('svg-name').value.trim() || 'Symbol';
        const sizeMeters = fromDisplayLength(parseFloat(document.getElementById('svg-size').value));
        if (!(sizeMeters > 0)) {
            alert('Enter a size greater than zero.');
            return;
        }
        const symbol = { id: 'custom-' + Date.now().toString(36), name: name, sizeMeters: sizeMeters, svg: pendingSvg };
        customSymbols.push(symbol);
        if (!persistCustomSymbols()) {
            customSymbols.pop();
            alert('Could not save the symbol: browser storage is full or unavailable.');
            return;
        }
        selectedAssetId = symbol.id;
        pendingSvg = null;
        closeSvgModal();
        renderAssetList();
        toolTip.innerText = `${name} selected — click on the canvas to place it.`;
    });

    function isBlackish(color) {
        if (!color || typeof color !== 'string') return false;
        const v = color.replace(/\s+/g, '').toLowerCase();
        return v === '#000' || v === '#000000' || v === 'black' || v === 'rgb(0,0,0)' || v === 'currentcolor';
    }

    function finalizeFurnitureObject(obj, itemDef, x, y) {
        const targetSizePx = itemDef.sizeMeters * PIXELS_PER_METER;
        const scale = targetSizePx / Math.max(obj.width, obj.height, 1);
        obj.set({
            left: x, top: y,
            originX: 'center', originY: 'center',
            scaleX: scale, scaleY: scale,
            selectable: true,
            snapAngle: 15,
            snapThreshold: 5,
            data: { layer: 'furniture', type: 'furniture', name: itemDef.name }
        });
        obj.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
        canvas.add(obj);
        setActiveAndSync(obj);
        canvas.renderAll();
        saveState();
    }

    function placeFurniture(assetId, x, y) {
        const itemDef = Object.values(getCatalog()).flat().find(i => i.id === assetId);
        if (!itemDef) return;
        if (itemDef.custom) {
            fabric.loadSVGFromString(itemDef.svg, (objects, options) => {
                if (!objects || !objects.length) return;
                objects.forEach(o => {
                    if (isBlackish(o.stroke)) o.set('stroke', cssVar('--text-primary'));
                    if (isBlackish(o.fill)) o.set('fill', cssVar('--text-primary'));
                });
                finalizeFurnitureObject(fabric.util.groupSVGElements(objects, options), itemDef, x, y);
            });
        } else if (itemDef.file.endsWith('.png')) {
            fabric.Image.fromURL(`assets/furniture/${itemDef.file}`, (img) => {
                finalizeFurnitureObject(img, itemDef, x, y);
            }, { crossOrigin: 'anonymous' });
        } else {
            fabric.loadSVGFromURL(`assets/furniture/${itemDef.file}`, (objects, options) => {
                objects.forEach(o => {
                    if (o.stroke) o.set('stroke', cssVar('--text-primary'));
                });
                const svgGroup = fabric.util.groupSVGElements(objects, options);
                finalizeFurnitureObject(svgGroup, itemDef, x, y);
            });
        }
    }

    function setMode(mode) {
        let postModeMessage = null;
        canvas.isGrabMode = false;
        const panBtnEl = document.getElementById('pan-btn');
        if (panBtnEl) panBtnEl.classList.remove('active');

        if (mode === 'mirror') {
            const active = canvas.getActiveObject();
            if (active) {
                active.set('flipX', !active.flipX);
                active.setCoords();
                canvas.renderAll();
                saveState('Mirror');
            } else {
                postModeMessage = 'Select an object first, then click Mirror.';
            }
            mode = 'select';
        } else if (mode === 'offset') {
            const active = canvas.getActiveObject();
            if (active && active.data && active.data.type === 'wall-system') {
                const newPoints = offsetWallPoints(getWallAbsPoints(active), GRID_SIZE);
                const offsetWall = new fabric.Polyline(newPoints, {
                    stroke: active.stroke,
                    strokeWidth: active.strokeWidth,
                    strokeLineJoin: 'miter',
                    fill: null,
                    selectable: true,
                    objectCaching: false,
                    data: { layer: 'walls', type: 'wall-system' }
                });
                canvas.add(offsetWall);
                setActiveAndSync(offsetWall);
                canvas.renderAll();
                saveState('Offset wall');
            } else if (active && active.data && active.data.type === 'room') {
                const ring = offsetPolygonPoints(active.getCoords(), GRID_SIZE);
                if (ring) {
                    const minX = Math.min(...ring.map(p => p.x));
                    const minY = Math.min(...ring.map(p => p.y));
                    const sourceBaseColor = (active.data && active.data.baseColor) || ((active._objects && active._objects[0]) ? active._objects[0].fill : ROOM_FILL_COLORS[0]);
                    const sourceHatch = (active.data && active.data.hatchPattern) || 'solid';
                    const offsetRoom = new fabric.Polygon(ring.map(p => ({ x: p.x - minX, y: p.y - minY })), {
                        left: minX, top: minY,
                        fill: sourceHatch === 'solid' ? sourceBaseColor : createHatchPattern(sourceHatch, sourceBaseColor),
                        stroke: cssVar('--text-primary'),
                        strokeWidth: 2,
                        selectable: true,
                        data: { layer: 'walls', type: 'room', baseColor: sourceBaseColor, hatchPattern: sourceHatch }
                    });
                    canvas.add(offsetRoom);
                    setActiveAndSync(offsetRoom);
                    canvas.renderAll();
                    saveState('Offset room');
                } else {
                    postModeMessage = 'Offset distance is too large for this room.';
                }
            } else if (active) {
                active.clone((cloned) => {
                    cloned.set({
                        left: active.left + GRID_SIZE,
                        top: active.top + GRID_SIZE,
                        data: active.data ? Object.assign({}, active.data) : undefined
                    });
                    canvas.add(cloned);
                    setActiveAndSync(cloned);
                    canvas.renderAll();
                    saveState('Offset copy');
                });
            } else {
                postModeMessage = 'Select an object first, then click Offset.';
            }
            mode = 'select';
        } else if (mode === 'array') {
            const active = canvas.getActiveObject();
            if (active && active.type !== 'activeSelection') {
                arrayTargetObject = active;
                openArrayModal();
            } else {
                postModeMessage = 'Select a single object first, then click Array.';
            }
            mode = 'select';
        } else if (mode === 'chamfer') {
            openChamferModal();
            mode = 'select';
        } else if (mode === 'fillet') {
            openFilletModal();
            mode = 'select';
        } else if (mode === 'graph') {
            openGraphModal();
            mode = 'select';
        }

        if (currentMode === 'wall' && mode !== 'wall' && wallPoints.length > 0) finalizeWall();
        if (currentMode !== mode && activeShape) cancelActiveShape();

        currentMode = mode;
        isDrawing = false; isDefiningAngle = false; dimensionFirstPoint = null; measureFirstPoint = null;
        canvas.getObjects().filter(o => o.name === 'temp').forEach(o => canvas.remove(o));
        toolTip.innerText = '';
        wallThicknessSelector.classList.add('hidden');
        if (mode === 'wall') wallThicknessSelector.classList.remove('hidden');

        assetPanel.classList.toggle('hidden', mode !== 'asset');

        const crosshairModes = ['wall', 'rect', 'stairs', 'dimension', 'door', 'window', 'measure', 'text'];
        canvas.defaultCursor = crosshairModes.includes(mode) ? 'crosshair' : 'default';
        canvas.selection = mode === 'select';
        canvas.skipTargetFind = mode === 'node';
        nodeDrag = null;
        canvas.discardActiveObject();
        canvas.renderAll();
        updatePropertiesPanel(null);

        switch (mode) {
            case 'select': toolTip.innerText = ''; break;
            case 'wall': toolTip.innerText = 'Click to start drawing a wall.'; break;
            case 'rect': toolTip.innerText = 'Click and drag to draw a room.'; break;
            case 'stairs': toolTip.innerText = 'Click and drag to draw a staircase.'; break;
            case 'door': toolTip.innerText = 'Click near a wall to place a door.'; break;
            case 'window': toolTip.innerText = 'Click near a wall to place a window.'; break;
            case 'dimension': toolTip.innerText = 'Click two points to measure.'; break;
            case 'measure': toolTip.innerText = 'Click two points for a quick distance readout.'; break;
            case 'text': toolTip.innerText = 'Click on the canvas to add a text label.'; break;
            case 'node': toolTip.innerText = 'Drag a wall corner or junction. Connected walls and detected rooms follow.'; break;
            case 'trim': toolTip.innerText = 'Click near the end of a wall to trim/extend it to the nearest wall.'; break;
            case 'asset': toolTip.innerText = 'Select a furniture item, then click on the canvas.'; break;
        }

        toolButtons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`${mode}-tool-btn`);
        if (activeBtn) activeBtn.classList.add('active');

        if (postModeMessage) toolTip.innerText = postModeMessage;
    }
    toolButtons.forEach(btn => { btn.addEventListener('click', () => setMode(btn.id.replace('-tool-btn', ''))); });


    let objectSnapThreshold = settings.objectSnapThreshold;
    const AUTOSAVE_KEY = 'naqshcad-autosave';
    let autosaveTimer = null;
    let autosaveFailed = false;
    let lastAutosave = '';
    const settingsModalOverlay = document.getElementById('settings-modal-overlay');
    const settingsModal = document.getElementById('settings-modal');
    const settingsBody = document.getElementById('settings-body');
    const settingsFileInput = document.getElementById('settings-file-input');
    const systemDarkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function askConfirm(message) {
        return settings.confirmDestructive ? confirm(message) : true;
    }

    function updateSetting(key, value) {
        settings[key] = value;
        saveSettings(settings);
        if (!settingsModal.classList.contains('hidden')) renderSettings();
    }

    function resolveDarkTheme() {
        if (settings.theme === 'system') return !!(systemDarkQuery && systemDarkQuery.matches);
        return settings.theme !== 'light';
    }

    function applyTheme() {
        const wantDark = resolveDarkTheme();
        if (wantDark === document.body.classList.contains('dark-theme')) return;
        const oldColor = cssVar('--text-primary');
        document.body.classList.toggle('dark-theme', wantDark);
        document.body.classList.toggle('light-theme', !wantDark);
        const newColor = cssVar('--text-primary');
        if (FEATURES.liveRecolor && !sameColor(oldColor, newColor)) applyThemeRecolor(oldColor, newColor);
        canvas.backgroundColor = createGridPattern();
        canvas.renderAll();
        drawRulers();
    }

    if (systemDarkQuery && systemDarkQuery.addEventListener) {
        systemDarkQuery.addEventListener('change', () => { if (settings.theme === 'system') applyTheme(); });
    }

    function writeAutosave() {
        if (!canvas.getObjects().length && floors.length === 1) return;
        try {
            const meta = getProjectMeta();
            const payload = { canvasData: canvas.toJSON(['data', 'name']), meta: meta };
            const serialized = JSON.stringify(payload);
            if (serialized === lastAutosave) return;
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ time: Date.now(), dirty: true, payload: payload }));
            lastAutosave = serialized;
            autosaveFailed = false;
        } catch (err) {
            if (!autosaveFailed) toolTip.innerText = 'Autosave failed: browser storage is full or unavailable.';
            autosaveFailed = true;
        }
    }

    function startAutosave(minutes) {
        if (autosaveTimer) clearInterval(autosaveTimer);
        autosaveTimer = null;
        if (minutes > 0) autosaveTimer = setInterval(writeAutosave, minutes * 60000);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && settings.autosave > 0) writeAutosave();
    });

    function readAutosave() {
        try {
            const entry = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null');
            return entry && entry.payload ? entry : null;
        } catch (err) {
            return null;
        }
    }

    function restoreAutosave() {
        const entry = readAutosave();
        if (!entry) { alert('There is no autosave in this browser.'); return false; }
        openProjectFile(new File([JSON.stringify(entry.payload)], 'autosave.gncad', { type: 'application/json' }));
        return true;
    }

    function offerAutosaveRestore() {
        const entry = readAutosave();
        if (!entry || !entry.dirty) return;
        const when = new Date(entry.time).toLocaleString();
        if (confirm(`An autosaved project from ${when} was found. Restore it?`)) {
            restoreAutosave();
        } else {
            entry.dirty = false;
            try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(entry)); } catch (err) { autosaveFailed = true; }
        }
    }

    const settingApplyHandlers = {
        theme: () => applyTheme(),
        accent: (v) => {
            if (v === 'default') document.body.style.removeProperty('--accent-primary');
            else document.body.style.setProperty('--accent-primary', v);
            drawRulers();
        },
        language: () => { setLanguage(settings.language, settings.persianDigits); syncToolInputs(); },
        persianDigits: () => setLanguage(settings.language, settings.persianDigits),
        reduceMotion: (v) => document.body.classList.toggle('reduce-motion', !!v),
        largeTargets: (v) => document.body.classList.toggle('large-targets', !!v),
        showHints: (v) => document.body.classList.toggle('no-hints', !v),
        showGrid: () => { canvas.backgroundColor = createGridPattern(); canvas.requestRenderAll(); },
        showRulers: (v) => { showRulersCheckbox.checked = !!v; drawRulers(); drawCrosshairs(lastMousePos); },
        snapGrid: (v) => { snapCheckbox.checked = !!v; },
        objectSnap: (v) => { objectSnapCheckbox.checked = !!v; },
        objectSnapThreshold: (v) => { objectSnapThreshold = v; },
        wallThickness: (v) => {
            currentStrokeWidth = Number(v);
            wallThicknessSelector.querySelectorAll('.thickness-option').forEach(el => el.classList.toggle('active', parseInt(el.dataset.thickness, 10) === Number(v)));
        },
        filletRadius: (v) => { filletRadius = v; syncToolInputs(); },
        chamferDistance: (v) => { chamferDistance = v; syncToolInputs(); },
        graphAuto: (v, fromUser) => {
            graphAuto = !!v && FEATURES.normalizeWalls;
            graphAutoToggle.checked = graphAuto;
            if (fromUser && graphAuto && collectWalls().length) normalizeWalls(true);
        },
        showFloorBelow: (v) => { showGhost = !!v; ghostToggle.checked = showGhost; rebuildGhost(); },
        autosave: (v) => startAutosave(Number(v)),
        historyLimit: (v) => historyManager.setLimit(Number(v)),
        confirmDestructive: () => {},
        units: (v) => {
            setUnitSystem(v);
            syncToolInputs();
            canvas.getObjects().filter(o => o.data && o.data.type === 'room' && o._objects && o._objects.some(c => c.data && c.data.type === 'width')).forEach(g => updateRoomDimensions(g));
            updatePropertiesPanel(canvas.getActiveObject());
            canvas.requestRenderAll();
        }
    };

    function applySetting(key, fromUser) {
        const handler = settingApplyHandlers[key];
        if (handler) handler(settings[key], fromUser);
    }

    function applyAllSettings() {
        Object.keys(DEFAULT_SETTINGS).forEach(key => applySetting(key, false));
    }

    function findSchemaItem(key) {
        for (const section of SETTINGS_SCHEMA) {
            const item = section.items.find(i => i.key === key);
            if (item) return item;
        }
        return null;
    }

    function renderSettings() {
        const scroll = settingsBody.scrollTop;
        settingsBody.innerHTML = '';
        SETTINGS_SCHEMA.forEach(section => {
            const wrap = document.createElement('div');
            wrap.className = 'settings-section';
            const heading = document.createElement('h4');
            heading.textContent = section.title;
            wrap.appendChild(heading);
            section.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'setting-row' + (item.type === 'action' ? ' setting-action' : '');
                if (item.type === 'action') {
                    const btn = document.createElement('button');
                    btn.className = 'panel-action-btn';
                    btn.textContent = item.label;
                    btn.dataset.action = item.action;
                    row.appendChild(btn);
                    wrap.appendChild(row);
                    return;
                }
                const label = document.createElement('span');
                label.className = 'setting-label';
                label.textContent = (item.key === 'filletRadius' || item.key === 'chamferDistance') ? item.label.replace('(m)', `(${lengthUnit()})`) : item.label;
                let control;
                if (item.type === 'toggle') {
                    control = document.createElement('label');
                    control.className = 'switch';
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = !!settings[item.key];
                    input.dataset.key = item.key;
                    const slider = document.createElement('span');
                    slider.className = 'slider';
                    control.append(input, slider);
                } else if (item.type === 'select') {
                    control = document.createElement('select');
                    control.dataset.key = item.key;
                    item.options.forEach(([value, text]) => {
                        const option = document.createElement('option');
                        option.value = String(value);
                        option.textContent = text;
                        if (String(settings[item.key]) === String(value)) option.selected = true;
                        control.appendChild(option);
                    });
                } else {
                    control = document.createElement('input');
                    control.type = 'number';
                    const metric = item.key === 'filletRadius' || item.key === 'chamferDistance';
                    control.min = metric ? Number(toDisplayLength(item.min).toFixed(2)) : item.min;
                    control.max = metric ? Number(toDisplayLength(item.max).toFixed(2)) : item.max;
                    control.step = item.step;
                    control.value = metric ? Number(toDisplayLength(settings[item.key]).toFixed(2)) : settings[item.key];
                    control.dataset.key = item.key;
                }
                row.append(label, control);
                if (item.hint) {
                    const hint = document.createElement('div');
                    hint.className = 'setting-hint';
                    hint.textContent = item.hint;
                    row.appendChild(hint);
                }
                wrap.appendChild(row);
            });
            settingsBody.appendChild(wrap);
        });
        settingsBody.scrollTop = scroll;
    }

    function openSettings() {
        renderSettings();
        settingsModalOverlay.classList.remove('hidden');
        settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
        settingsModalOverlay.classList.add('hidden');
        settingsModal.classList.add('hidden');
    }

    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings-modal-btn').addEventListener('click', closeSettings);
    settingsModalOverlay.addEventListener('click', closeSettings);

    settingsBody.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        if (!key) return;
        const item = findSchemaItem(key);
        if (!item) return;
        let value;
        if (item.type === 'toggle') value = e.target.checked;
        else if (item.type === 'select') value = item.options.find(o => String(o[0]) === e.target.value)[0];
        else {
            value = parseFloat(e.target.value);
            if (!isFinite(value)) value = DEFAULT_SETTINGS[key];
            if (key === 'filletRadius' || key === 'chamferDistance') value = fromDisplayLength(value);
            value = Math.min(item.max, Math.max(item.min, value));
        }
        settings[key] = value;
        saveSettings(settings);
        applySetting(key, true);
        if (item.type === 'number') e.target.value = (key === 'filletRadius' || key === 'chamferDistance') ? Number(toDisplayLength(value).toFixed(2)) : value;
    });

    function replaceSettings(next) {
        settings = next;
        saveSettings(settings);
        applyAllSettings();
        renderSettings();
    }

    settingsBody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'restoreAutosave') {
            if (!readAutosave()) { alert('There is no autosave in this browser.'); return; }
            if (askConfirm('Replace the current project with the autosave?')) { closeSettings(); restoreAutosave(); }
        } else if (action === 'clearAutosave') {
            try { localStorage.removeItem(AUTOSAVE_KEY); } catch (err) { autosaveFailed = true; }
            lastAutosave = '';
            toolTip.innerText = 'Autosave deleted.';
        } else if (action === 'exportSettings') {
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'naqshcad-settings.json';
            a.click();
            URL.revokeObjectURL(url);
        } else if (action === 'importSettings') {
            settingsFileInput.click();
        } else if (action === 'resetSettings') {
            if (askConfirm('Reset all settings to their defaults?')) replaceSettings(sanitizeSettings({}));
        }
    });

    settingsFileInput.addEventListener('change', () => {
        const file = settingsFileInput.files[0];
        settingsFileInput.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                replaceSettings(sanitizeSettings(JSON.parse(String(event.target.result))));
            } catch (err) {
                alert('This file is not a valid settings export.');
            }
        };
        reader.readAsText(file);
    });

    snapCheckbox.addEventListener('change', () => updateSetting('snapGrid', snapCheckbox.checked));
    objectSnapCheckbox.addEventListener('change', () => updateSetting('objectSnap', objectSnapCheckbox.checked));
    showRulersCheckbox.addEventListener('change', () => updateSetting('showRulers', showRulersCheckbox.checked));
    wallThicknessSelector.addEventListener('click', (e) => { if (e.target.classList.contains('thickness-option')) updateSetting('wallThickness', currentStrokeWidth); });
    document.getElementById('fillet-apply-btn').addEventListener('click', () => updateSetting('filletRadius', filletRadius));
    document.getElementById('chamfer-apply-btn').addEventListener('click', () => updateSetting('chamferDistance', chamferDistance));


    let pinchActive = false;
    let pinchState = null;
    const touchSurface = canvas.upperCanvasEl;

    function touchCenter(touches) {
        return { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 };
    }

    function touchDistance(touches) {
        return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    }

    touchSurface.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 2) return;
        pinchActive = true;
        if (isDrawing && activeShape) {
            canvas.remove(activeShape);
            activeShape = null;
            isDrawing = false;
            canvas.renderAll();
        }
        const rect = touchSurface.getBoundingClientRect();
        const c = touchCenter(e.touches);
        pinchState = { distance: touchDistance(e.touches), zoom: canvas.getZoom(), x: c.x - rect.left, y: c.y - rect.top };
        e.preventDefault();
    }, { passive: false });

    touchSurface.addEventListener('touchmove', (e) => {
        if (!pinchActive || !pinchState || e.touches.length !== 2) return;
        e.preventDefault();
        const rect = touchSurface.getBoundingClientRect();
        const c = touchCenter(e.touches);
        const x = c.x - rect.left;
        const y = c.y - rect.top;
        let zoom = pinchState.zoom * touchDistance(e.touches) / pinchState.distance;
        zoom = Math.min(10, Math.max(0.1, zoom));
        canvas.relativePan({ x: x - pinchState.x, y: y - pinchState.y });
        canvas.zoomToPoint({ x: x, y: y }, zoom);
        pinchState.x = x;
        pinchState.y = y;
        zoomDisplay.innerText = `Zoom: ${Math.round(zoom * 100)}%`;
        drawRulers();
    }, { passive: false });

    function endPinch(e) {
        if (!pinchActive) return;
        pinchState = null;
        if (e.touches.length === 0) setTimeout(() => { pinchActive = false; }, 80);
    }
    touchSurface.addEventListener('touchend', endPinch);
    touchSurface.addEventListener('touchcancel', endPinch);

    function downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    }

    function staticBounds(sc) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        sc.getObjects().filter(o => o.name !== 'temp' && o.name !== 'snap-guide').forEach(o => {
            const rect = o.getBoundingRect(true, true);
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.left + rect.width);
            maxY = Math.max(maxY, rect.top + rect.height);
        });
        if (!isFinite(minX)) return null;
        return { left: minX - GRID_SIZE, top: minY - GRID_SIZE, width: (maxX - minX) + GRID_SIZE * 2, height: (maxY - minY) + GRID_SIZE * 2 };
    }

    function inkStaticCanvas(sc) {
        forEachDeepObject(sc.getObjects(), obj => {
            if (obj.stroke) obj.stroke = '#1a1a1a';
            if ((obj.type === 'i-text' || obj.type === 'text') && obj.fill) obj.fill = '#1a1a1a';
        });
    }

    async function exportActiveFloorImage(kind) {
        captureActiveFloor();
        const floor = floors.find(f => f.id === activeFloorId);
        const sc = await loadFloorStatic(floor);
        const bbox = staticBounds(sc);
        if (!bbox) { sc.dispose(); alert('There is nothing to export on this floor.'); return; }
        inkStaticCanvas(sc);
        const safe = String(floor.name).replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'floor';
        if (kind === 'svg') {
            const svg = sc.toSVG({ viewBox: { x: bbox.left, y: bbox.top, width: bbox.width, height: bbox.height }, width: `${bbox.width}px`, height: `${bbox.height}px` });
            downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `naqshcad-${safe}.svg`);
        } else {
            const multiplier = Math.min(4, Math.max(1, 2400 / bbox.width));
            const url = sc.toDataURL({ format: 'png', left: bbox.left, top: bbox.top, width: bbox.width, height: bbox.height, multiplier: multiplier });
            downloadBlob(new Blob([dataUrlToBytes(url)], { type: 'image/png' }), `naqshcad-${safe}.png`);
        }
        sc.dispose();
    }

    async function exportPdfAllFloors() {
        captureActiveFloor();
        const statics = [];
        for (const floor of floors) statics.push(await loadFloorStatic(floor));
        let box = null;
        statics.forEach(sc => {
            const b = staticBounds(sc);
            if (!b) return;
            if (!box) { box = { left: b.left, top: b.top, right: b.left + b.width, bottom: b.top + b.height }; return; }
            box = { left: Math.min(box.left, b.left), top: Math.min(box.top, b.top), right: Math.max(box.right, b.left + b.width), bottom: Math.max(box.bottom, b.top + b.height) };
        });
        if (!box) { statics.forEach(sc => sc.dispose()); alert('There is nothing to export.'); return; }
        const width = box.right - box.left;
        const height = box.bottom - box.top;
        const multiplier = Math.min(4, Math.max(1, 2000 / width));
        const pages = statics.map(sc => {
            inkStaticCanvas(sc);
            const url = sc.toDataURL({ format: 'jpeg', quality: 0.92, left: box.left, top: box.top, width: width, height: height, multiplier: multiplier });
            sc.dispose();
            return { jpeg: dataUrlToBytes(url), width: Math.round(width * multiplier), height: Math.round(height * multiplier) };
        });
        downloadBlob(buildPdf(pages), 'naqshcad-plan.pdf');
    }

    document.getElementById('export-png-btn').addEventListener('click', () => exportActiveFloorImage('png'));
    document.getElementById('export-svg-btn').addEventListener('click', () => exportActiveFloorImage('svg'));
    document.getElementById('export-pdf-btn').addEventListener('click', exportPdfAllFloors);


    const reportModal = document.getElementById('report-modal');
    const reportOverlay = document.getElementById('report-modal-overlay');
    const reportBody = document.getElementById('report-body');
    let reportEntries = [];
    let flashPoint = null;

    async function collectScheduleEntries() {
        captureActiveFloor();
        const entries = [];
        for (const floor of floors) {
            const objs = await enlivenFloorObjects(floor);
            entries.push({ floor: floor.name, schedule: buildSchedule(objs, PIXELS_PER_METER, getWallAbsPoints) });
        }
        return entries;
    }

    function roomSpotTaken(room, existing) {
        const xs = room.netPoints.map(p => p.x);
        const ys = room.netPoints.map(p => p.y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        return existing.some(o => {
            const c = o.getCenterPoint();
            const area = o.type === 'polygon' ? polygonArea(o.points) * Math.abs(o.scaleX * o.scaleY) : o.getScaledWidth() * o.getScaledHeight();
            return Math.hypot(c.x - cx, c.y - cy) < 0.3 * PIXELS_PER_METER && Math.abs(area - room.area) / room.area < 0.25;
        });
    }

    function currentPlanChecks() {
        const plan = analyzePlan();
        const openings = canvas.getObjects().filter(o => o.data && (o.data.type === 'door' || o.data.type === 'window')).map(o => {
            const c = o.getCenterPoint();
            return { type: o.data.type, x: c.x, y: c.y };
        });
        const existing = canvas.getObjects().filter(o => o.data && o.data.type === 'room');
        const unmatched = plan.rooms.filter(room => !roomSpotTaken(room, existing)).map(room => {
            const xs = room.netPoints.map(p => p.x);
            const ys = room.netPoints.map(p => p.y);
            return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
        });
        return runChecks({ graph: plan.graph, openings: openings, unmatchedLoops: unmatched, ppm: PIXELS_PER_METER, describeLength: m => formatLength(m) });
    }

    function focusPoint(at) {
        const z = canvas.getZoom();
        canvas.setViewportTransform([z, 0, 0, z, canvas.getWidth() / 2 - at.x * z, canvas.getHeight() / 2 - at.y * z]);
        flashPoint = { x: at.x, y: at.y, until: Date.now() + 2500 };
        drawRulers();
        canvas.requestRenderAll();
    }

    canvas.on('after:render', (opt) => {
        if (!flashPoint) return;
        const left = flashPoint.until - Date.now();
        if (left <= 0) { flashPoint = null; return; }
        const ctx = canvas.getContext();
        if (opt && opt.ctx && opt.ctx !== ctx) return;
        const v = canvas.viewportTransform;
        const pulse = 14 + 6 * Math.sin(Date.now() / 120);
        ctx.save();
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
        ctx.beginPath();
        ctx.arc(flashPoint.x, flashPoint.y, pulse / canvas.getZoom(), 0, Math.PI * 2);
        ctx.lineWidth = 3 / canvas.getZoom();
        ctx.strokeStyle = cssVar('--accent-primary');
        ctx.stroke();
        ctx.restore();
        setTimeout(() => canvas.requestRenderAll(), 50);
    });

    async function renderReport() {
        reportBody.innerHTML = '';
        reportBody.appendChild(graphRow('Working...', ''));
        reportEntries = await collectScheduleEntries();
        reportBody.innerHTML = '';
        const sqm = v => formatArea(v);
        reportEntries.forEach(({ floor, schedule }) => {
            const title = document.createElement('div');
            title.className = 'report-floor';
            title.textContent = floor;
            reportBody.appendChild(title);
            const t = scheduleTotals(schedule);
            if (!t.rooms && !schedule.walls.count && !t.doors && !t.windows && !t.stairs && !t.furniture) {
                reportBody.appendChild(graphRow('Nothing drawn on this floor', ''));
                return;
            }
            schedule.rooms.forEach(r => reportBody.appendChild(graphRow(`${r.name} (perimeter ${formatLength(r.perimeter)})`, sqm(r.area))));
            if (t.rooms) reportBody.appendChild(graphRow('Total room area', sqm(t.roomArea)));
            Object.entries(schedule.walls.byWeight).forEach(([label, length]) => reportBody.appendChild(graphRow(label, formatLength(length))));
            Object.entries(schedule.doors).forEach(([width, n]) => reportBody.appendChild(graphRow(`Doors, ${formatLength(parseFloat(width))} wide`, String(n))));
            Object.entries(schedule.windows).forEach(([width, n]) => reportBody.appendChild(graphRow(`Windows, ${formatLength(parseFloat(width))} wide`, String(n))));
            if (schedule.stairs) reportBody.appendChild(graphRow('Stairs', String(schedule.stairs)));
            Object.entries(schedule.furniture).forEach(([name, n]) => reportBody.appendChild(graphRow(name, String(n))));
        });
        const checksTitle = document.createElement('div');
        checksTitle.className = 'report-floor';
        checksTitle.textContent = 'Plan checks (current floor)';
        reportBody.appendChild(checksTitle);
        currentPlanChecks().forEach(issue => {
            const row = document.createElement('div');
            row.className = 'report-issue';
            const badge = document.createElement('span');
            badge.className = 'badge ' + issue.severity;
            badge.textContent = issue.severity === 'warning' ? '!' : (issue.severity === 'ok' ? '✓' : 'i');
            const text = document.createElement('span');
            text.textContent = issue.message;
            row.append(badge, text);
            if (issue.at) {
                const show = document.createElement('button');
                show.textContent = 'Show';
                show.addEventListener('click', () => { closeReport(); focusPoint(issue.at); });
                row.appendChild(show);
            }
            reportBody.appendChild(row);
        });
    }

    function openReport() {
        reportOverlay.classList.remove('hidden');
        reportModal.classList.remove('hidden');
        renderReport();
    }

    function closeReport() {
        reportOverlay.classList.add('hidden');
        reportModal.classList.add('hidden');
    }

    document.getElementById('report-btn').addEventListener('click', (e) => { e.preventDefault(); openReport(); });
    document.getElementById('close-report-modal-btn').addEventListener('click', closeReport);
    reportOverlay.addEventListener('click', closeReport);
    document.getElementById('report-refresh-btn').addEventListener('click', renderReport);
    document.getElementById('report-csv-btn').addEventListener('click', () => {
        if (!reportEntries.length) return;
        downloadBlob(new Blob(['\ufeff' + scheduleToCsv(reportEntries)], { type: 'text/csv;charset=utf-8' }), 'naqshcad-schedule.csv');
    });

    const compareModal = document.getElementById('compare-modal');
    const compareOverlay = document.getElementById('compare-modal-overlay');
    const compareBody = document.getElementById('compare-body');
    const compareInput = document.getElementById('compare-file-input');

    function enlivenJson(json) {
        if (!json || !Array.isArray(json.objects)) return Promise.resolve([]);
        return new Promise(resolve => fabric.util.enlivenObjects(JSON.parse(JSON.stringify(json.objects)), objs => resolve(objs)));
    }

    function sumTotals(list) {
        const out = { rooms: 0, roomArea: 0, wallLength: 0, doors: 0, windows: 0, stairs: 0, furniture: 0 };
        list.forEach(s => { const t = scheduleTotals(s); Object.keys(out).forEach(k => { out[k] += t[k]; }); });
        return out;
    }

    async function totalsFromPayload(payload) {
        const sources = [];
        if (payload.meta && Array.isArray(payload.meta.floors) && payload.meta.floors.length) {
            payload.meta.floors.forEach(f => sources.push(f.json || (f.id === payload.meta.activeFloorId ? payload.canvasData : null)));
        } else {
            sources.push(payload.canvasData);
        }
        const schedules = [];
        for (const json of sources) schedules.push(buildSchedule(await enlivenJson(json), PIXELS_PER_METER, getWallAbsPoints));
        return { totals: sumTotals(schedules), floors: sources.length };
    }

    function compareRow(label, a, b, delta, head) {
        const row = document.createElement('div');
        row.className = 'compare-row' + (head ? ' head' : '');
        [label, a, b, delta].forEach(text => { const cell = document.createElement('span'); cell.textContent = text; row.appendChild(cell); });
        return row;
    }

    async function runCompare(file) {
        compareOverlay.classList.remove('hidden');
        compareModal.classList.remove('hidden');
        compareBody.innerHTML = '';
        compareBody.appendChild(graphRow('Comparing...', ''));
        try {
            const other = await totalsFromPayload(JSON.parse(await file.text()));
            const entries = await collectScheduleEntries();
            const mine = { totals: sumTotals(entries.map(e => e.schedule)), floors: entries.length };
            compareBody.innerHTML = '';
            compareBody.appendChild(compareRow('', 'Current', file.name.slice(0, 18), 'Change', true));
            const count = (label, key) => {
                const d = other.totals[key] - mine.totals[key];
                compareBody.appendChild(compareRow(label, String(mine.totals[key]), String(other.totals[key]), (d > 0 ? '+' : '') + d));
            };
            const metric = (label, key, fmt) => {
                const d = other.totals[key] - mine.totals[key];
                compareBody.appendChild(compareRow(label, fmt(mine.totals[key]), fmt(other.totals[key]), (d > 0 ? '+' : '') + fmt(d)));
            };
            const floorsDelta = other.floors - mine.floors;
            compareBody.appendChild(compareRow('Floors', String(mine.floors), String(other.floors), (floorsDelta > 0 ? '+' : '') + floorsDelta));
            count('Rooms', 'rooms');
            metric('Room area', 'roomArea', v => formatArea(v));
            metric('Wall length', 'wallLength', v => formatLength(v));
            count('Doors', 'doors');
            count('Windows', 'windows');
            count('Stairs', 'stairs');
            count('Furniture items', 'furniture');
        } catch (err) {
            compareBody.innerHTML = '';
            compareBody.appendChild(graphRow('This file could not be read as a project.', ''));
        }
    }

    function closeCompare() {
        compareOverlay.classList.add('hidden');
        compareModal.classList.add('hidden');
    }

    document.getElementById('compare-btn').addEventListener('click', (e) => { e.preventDefault(); compareInput.click(); });
    compareInput.addEventListener('change', () => {
        const file = compareInput.files[0];
        compareInput.value = '';
        if (file) runCompare(file);
    });
    document.getElementById('close-compare-modal-btn').addEventListener('click', closeCompare);
    compareOverlay.addEventListener('click', closeCompare);

    async function copyShareLink() {
        captureActiveFloor();
        const payload = JSON.stringify({ canvasData: canvas.toJSON(['data', 'name']), meta: getProjectMeta() });
        const code = await encodeShare(payload);
        const link = location.href.split('#')[0] + '#p=' + code;
        try {
            await navigator.clipboard.writeText(link);
            toolTip.innerText = `Share link copied (${Math.max(1, Math.round(link.length / 1024))} KB).` + (link.length > 60000 ? ' It is long, so some chat apps may cut it. Use Save for big plans.' : '');
        } catch (err) {
            prompt('Copy this link:', link);
        }
    }

    async function openFromHash() {
        const match = location.hash.match(/^#p=(.+)$/);
        if (!match) return false;
        try {
            const text = await decodeShare(match[1]);
            history.replaceState(null, '', location.pathname + location.search);
            if (confirm('Open the plan from this shared link? It replaces the current canvas.')) openProjectFile(new File([text], 'shared.gncad', { type: 'application/json' }));
        } catch (err) {
            alert('This share link could not be opened.');
        }
        return true;
    }

    document.getElementById('share-btn').addEventListener('click', (e) => { e.preventDefault(); copyShareLink(); });

    const view3dModal = document.getElementById('view3d-modal');
    const view3dOverlay = document.getElementById('view3d-modal-overlay');
    const view3dCanvas = document.getElementById('view3d-canvas');
    let viewer3d = null;

    function viewColors() {
        const dark = document.body.classList.contains('dark-theme');
        return {
            bg: cssVar('--bg-main'),
            wall: dark ? [215, 215, 222] : [96, 98, 112],
            room: dark ? 'rgba(66,133,244,0.28)' : 'rgba(66,133,244,0.22)',
            edge: dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
        };
    }

    function roomOutline(o) {
        if (o.type === 'polygon') {
            const m = o.calcTransformMatrix();
            const off = o.pathOffset || { x: 0, y: 0 };
            return o.points.map(p => fabric.util.transformPoint({ x: p.x - off.x, y: p.y - off.y }, m));
        }
        return o.getCoords().map(p => ({ x: p.x, y: p.y }));
    }


    function viewBoxFor(o) {
        const c = o.getCenterPoint();
        const kind = o.data.type;
        const name = String(o.data.name || '');
        let w = o.getScaledWidth();
        let d = o.getScaledHeight();
        let y0 = 0;
        let h = 0.55;
        if (kind === 'door' || kind === 'window') {
            w = o.data.width || w;
            d = 8;
            h = kind === 'door' ? 2.1 : 1.2;
            y0 = kind === 'door' ? 0 : 0.9;
        } else if (kind === 'stairs') {
            h = 1.2;
        } else if (/Rug|Runner/.test(name)) {
            h = 0.03;
        } else if (/Wardrobe|Fridge|Bookshelf|Cabinet|Tree|Plant|Shower|Boiler|Rack|Piano|Aquarium|Distribution/.test(name)) {
            h = 1.8;
        } else if (/Lamp|Chandelier/.test(name)) {
            h = 1.4;
        } else if (/Sofa|Bed|Chair|Armchair|Loveseat|Bench|Recliner|Ottoman|Stool/.test(name)) {
            h = 0.5;
        } else if (/Table|Desk|Counter|Island|Vanity|Stove|Oven/.test(name)) {
            h = 0.8;
        }
        return { cx: c.x, cy: c.y, w: w, d: d, angle: o.angle || 0, y0: y0, h: h, kind: kind };
    }

    async function buildViewModel() {
        captureActiveFloor();
        const height = Math.min(6, Math.max(2, fromDisplayLength(parseFloat(document.getElementById('view3d-height').value)) || 2.7));
        const only = !document.getElementById('view3d-all').checked;
        const list = only ? floors.filter(f => f.id === activeFloorId) : floors;
        const model = { ppm: PIXELS_PER_METER, height: height, floors: [] };
        for (const floor of list) {
            const objs = await enlivenFloorObjects(floor);
            const wallObjs = objs.filter(o => o.data && o.data.type === 'wall-system' && Array.isArray(o.points));
            const graph = buildGraph(wallObjs.map(w => ({ points: getWallAbsPoints(w).map(p => ({ x: p.x, y: p.y })), thickness: w.strokeWidth || 1, layer: 'walls' })), NORMALIZE_TOL);
            model.floors.push({
                walls: graph.edges.map(e => ({ a: graph.nodes[e.a], b: graph.nodes[e.b], t: e.thickness })),
                rooms: objs.filter(o => o.data && o.data.type === 'room').map(o => ({ points: roomOutline(o), fill: null })),
                boxes: objs.filter(o => o.data && ['door', 'window', 'furniture', 'stairs'].includes(o.data.type)).map(o => viewBoxFor(o))
            });
        }
        return model;
    }

    async function refreshView3d() {
        if (!viewer3d) viewer3d = createViewer(view3dCanvas, viewColors);
        viewer3d.setModel(await buildViewModel());
    }

    document.getElementById('view3d-btn').addEventListener('click', (e) => {
        e.preventDefault();
        view3dOverlay.classList.remove('hidden');
        view3dModal.classList.remove('hidden');
        refreshView3d();
    });
    function closeView3d() {
        view3dOverlay.classList.add('hidden');
        view3dModal.classList.add('hidden');
    }
    document.getElementById('close-view3d-modal-btn').addEventListener('click', closeView3d);
    view3dOverlay.addEventListener('click', closeView3d);
    document.getElementById('view3d-height').addEventListener('change', refreshView3d);
    document.getElementById('view3d-all').addEventListener('change', refreshView3d);
    document.getElementById('view3d-reset').addEventListener('click', () => { if (viewer3d) viewer3d.reset(); });
    window.addEventListener('resize', () => { if (viewer3d && !view3dModal.classList.contains('hidden')) viewer3d.draw(); });


    function setUnitLabel(el, base) {
        if (!el) return;
        const text = lengthUnit() === 'ft' ? base.replace('(m', '(ft') : base;
        const node = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.nodeValue.trim());
        if (node) node.nodeValue = node.nodeValue.replace(/\S[\s\S]*\S|\S/, text);
    }

    function syncToolInputs() {
        const shown = (meters) => Number(toDisplayLength(meters).toFixed(2));
        document.getElementById('fillet-radius').value = shown(filletRadius);
        document.getElementById('chamfer-distance').value = shown(chamferDistance);
        const svgSize = document.getElementById('svg-size');
        const height = document.getElementById('view3d-height');
        if (!svgSize.dataset.meters) svgSize.dataset.meters = '0.6';
        if (!height.dataset.meters) height.dataset.meters = '2.7';
        svgSize.value = shown(parseFloat(svgSize.dataset.meters));
        height.value = shown(parseFloat(height.dataset.meters));
        setUnitLabel(document.querySelector('label[for="fillet-radius"]'), 'Radius (m)');
        setUnitLabel(document.querySelector('label[for="chamfer-distance"]'), 'Cut Distance (m)');
        setUnitLabel(document.querySelector('label[for="svg-size"]'), 'Size on plan (m, longest side)');
        setUnitLabel(height.parentElement, 'Wall height (m)');
    }

    document.getElementById('svg-size').addEventListener('input', (e) => { e.target.dataset.meters = String(fromDisplayLength(parseFloat(e.target.value) || 0.6)); });
    document.getElementById('view3d-height').addEventListener('input', (e) => { e.target.dataset.meters = String(fromDisplayLength(parseFloat(e.target.value) || 2.7)); });

    let resizeFrame = 0;
    function handleResize() {
        const w = canvasContainer.offsetWidth;
        const h = canvasContainer.offsetHeight;
        if (!w || !h || (canvas.getWidth() === w && canvas.getHeight() === h)) return;
        canvas.setDimensions({ width: w, height: h });
        canvas.calcOffset();
        setupRulers();
        canvas.requestRenderAll();
    }
    if (window.ResizeObserver) {
        new ResizeObserver(() => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(handleResize);
        }).observe(canvasContainer);
    }
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 250));

    function init() {
        canvas.backgroundColor = createGridPattern();
        canvas.renderAll();
        setupRulers();
        setMode('select');
        updateUndoRedoButtons();
        saveState();
        applyAllSettings();
        if (!location.hash.startsWith('#p=')) offerAutosaveRestore();
        else openFromHash();
    }
    
    init();
});
