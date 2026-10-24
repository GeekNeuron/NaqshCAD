export function createViewer(canvasEl, getColors) {
    const ctx = canvasEl.getContext('2d');
    let model = null;
    let yaw = -0.7;
    let pitch = 0.62;
    let dist = 30;
    let center = { x: 0, y: 0, z: 0 };
    let extent = 20;
    const pointers = new Map();
    let lastPinch = 0;

    function resize() {
        const ratio = window.devicePixelRatio || 1;
        const w = canvasEl.clientWidth;
        const h = canvasEl.clientHeight;
        if (!w || !h) return;
        canvasEl.width = Math.round(w * ratio);
        canvasEl.height = Math.round(h * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function project(p) {
        const w = canvasEl.clientWidth;
        const h = canvasEl.clientHeight;
        const x = p.x - center.x;
        const y = p.y - center.y;
        const z = p.z - center.z;
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);
        const x1 = x * cy - z * sy;
        const z1 = x * sy + z * cy;
        const cp = Math.cos(pitch);
        const sp = Math.sin(pitch);
        const y1 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const depth = z2 + dist;
        const scale = Math.min(w, h) * 1.5 / Math.max(depth, 0.2);
        return { x: w / 2 + x1 * scale, y: h / 2 - y1 * scale, depth: depth };
    }

    function shade(rgb, normal) {
        const light = { x: 0.35, y: 0.85, z: 0.4 };
        const len = Math.hypot(normal.x, normal.y, normal.z) || 1;
        const dot = Math.abs((normal.x * light.x + normal.y * light.y + normal.z * light.z) / len);
        const f = 0.55 + 0.45 * dot;
        return `rgb(${Math.round(rgb[0] * f)}, ${Math.round(rgb[1] * f)}, ${Math.round(rgb[2] * f)})`;
    }

    function cross(a, b, c) {
        const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
        const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
        return { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
    }

    function buildFaces() {
        const colors = getColors();
        const ppm = model.ppm;
        const faces = [];
        const floors = [];
        model.floors.forEach((floor, i) => {
            const y0 = i * (model.height + 0.2);
            const y1 = y0 + model.height;
            floor.rooms.forEach(room => {
                floors.push({ pts: room.points.map(p => ({ x: p.x / ppm, y: y0, z: p.y / ppm })), fill: room.fill || colors.room });
            });
            floor.walls.forEach(wall => {
                const a = { x: wall.a.x / ppm, z: wall.a.y / ppm };
                const b = { x: wall.b.x / ppm, z: wall.b.y / ppm };
                const dx = b.x - a.x;
                const dz = b.z - a.z;
                const len = Math.hypot(dx, dz) || 1;
                const half = Math.max(wall.t / ppm, 0.06) / 2;
                const nx = -dz / len * half;
                const nz = dx / len * half;
                const P = (x, y, z) => ({ x: x, y: y, z: z });
                const a1 = [a.x + nx, a.z + nz];
                const a2 = [a.x - nx, a.z - nz];
                const b1 = [b.x + nx, b.z + nz];
                const b2 = [b.x - nx, b.z - nz];
                const quads = [
                    [P(a1[0], y0, a1[1]), P(b1[0], y0, b1[1]), P(b1[0], y1, b1[1]), P(a1[0], y1, a1[1])],
                    [P(b2[0], y0, b2[1]), P(a2[0], y0, a2[1]), P(a2[0], y1, a2[1]), P(b2[0], y1, b2[1])],
                    [P(a2[0], y0, a2[1]), P(a1[0], y0, a1[1]), P(a1[0], y1, a1[1]), P(a2[0], y1, a2[1])],
                    [P(b1[0], y0, b1[1]), P(b2[0], y0, b2[1]), P(b2[0], y1, b2[1]), P(b1[0], y1, b1[1])],
                    [P(a1[0], y1, a1[1]), P(b1[0], y1, b1[1]), P(b2[0], y1, b2[1]), P(a2[0], y1, a2[1])]
                ];
                quads.forEach((q, k) => faces.push({ pts: q, fill: shade(colors.wall, k === 4 ? { x: 0, y: 1, z: 0 } : cross(q[0], q[1], q[2])) }));
            });
        });
        model.floors.forEach((floor, i) => {
            const base = i * (model.height + 0.2);
            (floor.boxes || []).forEach(box => {
                const rad = box.angle * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const hw = box.w / ppm / 2;
                const hd = box.d / ppm / 2;
                const corner = (lx, lz, y) => ({ x: box.cx / ppm + lx * cos - lz * sin, y: base + y, z: box.cy / ppm + lx * sin + lz * cos });
                const y0 = box.y0;
                const y1 = box.y0 + box.h;
                const rgb = box.kind === 'door' ? [160, 105, 60] : (box.kind === 'window' ? [110, 180, 240] : [135, 150, 175]);
                const ring = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
                for (let k = 0; k < 4; k++) {
                    const a = ring[k];
                    const b = ring[(k + 1) % 4];
                    const q = [corner(a[0], a[1], y0), corner(b[0], b[1], y0), corner(b[0], b[1], y1), corner(a[0], a[1], y1)];
                    faces.push({ pts: q, fill: shade(rgb, cross(q[0], q[1], q[2])) });
                }
                faces.push({ pts: ring.map(r => corner(r[0], r[1], y1)), fill: shade(rgb, { x: 0, y: 1, z: 0 }) });
            });
        });
        return { floors, faces };
    }

    function draw() {
        resize();
        const w = canvasEl.clientWidth;
        const h = canvasEl.clientHeight;
        const colors = getColors();
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, w, h);
        if (!model) return;
        const built = buildFaces();
        built.floors.forEach(f => {
            const pts = f.pts.map(project);
            ctx.beginPath();
            pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
            ctx.closePath();
            ctx.fillStyle = f.fill;
            ctx.fill();
        });
        const projected = built.faces.map(f => {
            const pts = f.pts.map(project);
            return { pts: pts, fill: f.fill, depth: pts.reduce((s, p) => s + p.depth, 0) / pts.length };
        }).sort((a, b) => b.depth - a.depth);
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = colors.edge;
        projected.forEach(f => {
            ctx.beginPath();
            f.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
            ctx.closePath();
            ctx.fillStyle = f.fill;
            ctx.fill();
            ctx.stroke();
        });
    }

    function fit() {
        if (!model) return;
        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        const mark = (x, z) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); };
        model.floors.forEach(f => {
            f.walls.forEach(w => { mark(w.a.x / model.ppm, w.a.y / model.ppm); mark(w.b.x / model.ppm, w.b.y / model.ppm); });
            f.rooms.forEach(r => r.points.forEach(p => mark(p.x / model.ppm, p.y / model.ppm)));
            (f.boxes || []).forEach(b => mark(b.cx / model.ppm, b.cy / model.ppm));
        });
        if (!isFinite(minX)) { minX = 0; maxX = 10; minZ = 0; maxZ = 10; }
        const totalHeight = model.floors.length * (model.height + 0.2);
        extent = Math.max(maxX - minX, maxZ - minZ, totalHeight, 4);
        center = { x: (minX + maxX) / 2, y: totalHeight / 2, z: (minZ + maxZ) / 2 };
        dist = extent * 1.7;
    }

    function setModel(next) {
        model = next;
        fit();
        draw();
    }

    function reset() {
        yaw = -0.7;
        pitch = 0.62;
        fit();
        draw();
    }

    canvasEl.addEventListener('pointerdown', (e) => {
        canvasEl.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
            const [a, b] = Array.from(pointers.values());
            lastPinch = Math.hypot(a.x - b.x, a.y - b.y);
        }
    });

    canvasEl.addEventListener('pointermove', (e) => {
        const prev = pointers.get(e.pointerId);
        if (!prev) return;
        const next = { x: e.clientX, y: e.clientY };
        pointers.set(e.pointerId, next);
        if (pointers.size === 1) {
            yaw += (next.x - prev.x) * 0.01;
            pitch = Math.min(1.5, Math.max(0.05, pitch + (next.y - prev.y) * 0.01));
        } else if (pointers.size === 2) {
            const [a, b] = Array.from(pointers.values());
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (lastPinch > 0) dist = Math.min(extent * 6, Math.max(extent * 0.4, dist * lastPinch / d));
            lastPinch = d;
        }
        draw();
    });

    function release(e) {
        pointers.delete(e.pointerId);
        lastPinch = 0;
    }
    canvasEl.addEventListener('pointerup', release);
    canvasEl.addEventListener('pointercancel', release);

    canvasEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        dist = Math.min(extent * 6, Math.max(extent * 0.4, dist * (1 + e.deltaY * 0.001)));
        draw();
    }, { passive: false });

    return { setModel, draw, reset };
}
