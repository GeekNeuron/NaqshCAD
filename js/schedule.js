function shoelace(points) {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum / 2);
}

function weightLabel(px) {
    if (px === 2) return 'Thin wall';
    if (px === 5) return 'Medium wall';
    if (px === 10) return 'Thick wall';
    return `Wall (${px}px line)`;
}

export function buildSchedule(objects, ppm, wallPoints) {
    const out = { rooms: [], walls: { count: 0, length: 0, byWeight: {} }, doors: {}, windows: {}, stairs: 0, furniture: {} };
    let roomIndex = 0;
    objects.forEach(o => {
        const d = o.data;
        if (!d || o.name === 'temp') return;
        if (d.type === 'room') {
            roomIndex++;
            let area = 0;
            let perimeter = 0;
            if (o.type === 'polygon') {
                const sx = Math.abs(o.scaleX || 1);
                const sy = Math.abs(o.scaleY || 1);
                const pts = o.points.map(p => ({ x: p.x * sx, y: p.y * sy }));
                area = shoelace(pts);
                for (let i = 0; i < pts.length; i++) {
                    const q = pts[(i + 1) % pts.length];
                    perimeter += Math.hypot(q.x - pts[i].x, q.y - pts[i].y);
                }
            } else {
                const rect = o._objects && o._objects.find(c => c.type === 'rect');
                if (!rect) return;
                const w = rect.getScaledWidth();
                const h = rect.getScaledHeight();
                area = w * h;
                perimeter = 2 * (w + h);
            }
            out.rooms.push({ name: d.name || `Room ${roomIndex}`, area: area / (ppm * ppm), perimeter: perimeter / ppm, holes: d.holes || 0 });
        } else if (d.type === 'wall-system' && Array.isArray(o.points)) {
            const pts = wallPoints(o);
            let length = 0;
            for (let i = 0; i < pts.length - 1; i++) length += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
            out.walls.count++;
            out.walls.length += length / ppm;
            const label = weightLabel(o.strokeWidth || 0);
            out.walls.byWeight[label] = (out.walls.byWeight[label] || 0) + length / ppm;
        } else if (d.type === 'door' || d.type === 'window') {
            const width = ((d.width || o.getScaledWidth()) / ppm).toFixed(2);
            const bucket = d.type === 'door' ? out.doors : out.windows;
            bucket[width] = (bucket[width] || 0) + 1;
        } else if (d.type === 'stairs') {
            out.stairs++;
        } else if (d.type === 'furniture') {
            const name = d.name || 'Furniture';
            out.furniture[name] = (out.furniture[name] || 0) + 1;
        }
    });
    return out;
}

export function scheduleTotals(schedule) {
    const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);
    return {
        rooms: schedule.rooms.length,
        roomArea: schedule.rooms.reduce((a, r) => a + r.area, 0),
        wallLength: schedule.walls.length,
        doors: sum(schedule.doors),
        windows: sum(schedule.windows),
        stairs: schedule.stairs,
        furniture: sum(schedule.furniture)
    };
}

function csvCell(value) {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function scheduleToCsv(entries) {
    const rows = [['Floor', 'Category', 'Item', 'Quantity', 'Length_m', 'Area_m2']];
    entries.forEach(({ floor, schedule }) => {
        schedule.rooms.forEach(r => rows.push([floor, 'Room', r.name, 1, r.perimeter.toFixed(2), r.area.toFixed(2)]));
        Object.entries(schedule.walls.byWeight).forEach(([label, length]) => rows.push([floor, 'Walls', label, '', length.toFixed(2), '']));
        Object.entries(schedule.doors).forEach(([width, n]) => rows.push([floor, 'Doors', `${width} m wide`, n, '', '']));
        Object.entries(schedule.windows).forEach(([width, n]) => rows.push([floor, 'Windows', `${width} m wide`, n, '', '']));
        if (schedule.stairs) rows.push([floor, 'Stairs', 'Stairs', schedule.stairs, '', '']);
        Object.entries(schedule.furniture).forEach(([name, n]) => rows.push([floor, 'Furniture', name, n, '', '']));
    });
    return rows.map(r => r.map(csvCell).join(',')).join('\n');
}
