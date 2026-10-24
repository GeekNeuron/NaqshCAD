function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function projectParam(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return { u: 0, dist: distance(p, a) };
    const u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
    const cu = Math.max(0, Math.min(1, u));
    return { u: u, dist: distance(p, { x: a.x + cu * dx, y: a.y + cu * dy }) };
}

function intersectParams(a, b, c, d) {
    const rx = b.x - a.x;
    const ry = b.y - a.y;
    const sx = d.x - c.x;
    const sy = d.y - c.y;
    const den = rx * sy - ry * sx;
    if (Math.abs(den) < 1e-9) return null;
    const qx = c.x - a.x;
    const qy = c.y - a.y;
    return { u: (qx * sy - qy * sx) / den, v: (qx * ry - qy * rx) / den };
}

function createNodeIndex(tol) {
    const cell = Math.max(tol * 2, 1e-6);
    const grid = new Map();
    const nodes = [];
    function key(ix, iy) { return ix + ':' + iy; }
    function find(p) {
        const ix = Math.floor(p.x / cell);
        const iy = Math.floor(p.y / cell);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const list = grid.get(key(ix + dx, iy + dy));
                if (!list) continue;
                for (const n of list) if (distance(n, p) <= tol) return n;
            }
        }
        return null;
    }
    function get(p) {
        const existing = find(p);
        if (existing) return existing;
        const node = { id: nodes.length, x: p.x, y: p.y };
        nodes.push(node);
        const k = key(Math.floor(p.x / cell), Math.floor(p.y / cell));
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(node);
        return node;
    }
    return { get, find, nodes };
}

export function buildGraph(walls, tol) {
    const segments = [];
    walls.forEach((w, wi) => {
        for (let i = 0; i < w.points.length - 1; i++) {
            const a = w.points[i];
            const b = w.points[i + 1];
            if (distance(a, b) < 1e-6) continue;
            segments.push({ a: a, b: b, wi: wi, thickness: w.thickness, cuts: [0, 1] });
        }
    });

    const cell = Math.max(tol * 4, 64);
    const buckets = new Map();
    const cellRange = (seg) => ({
        x0: Math.floor((Math.min(seg.a.x, seg.b.x) - tol) / cell),
        x1: Math.floor((Math.max(seg.a.x, seg.b.x) + tol) / cell),
        y0: Math.floor((Math.min(seg.a.y, seg.b.y) - tol) / cell),
        y1: Math.floor((Math.max(seg.a.y, seg.b.y) + tol) / cell)
    });
    segments.forEach((seg, i) => {
        const r = cellRange(seg);
        for (let cx = r.x0; cx <= r.x1; cx++) {
            for (let cy = r.y0; cy <= r.y1; cy++) {
                const k = cx + ':' + cy;
                if (!buckets.has(k)) buckets.set(k, []);
                buckets.get(k).push(i);
            }
        }
    });

    for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
        const len = distance(s.a, s.b);
        const r = cellRange(s);
        const candidates = new Set();
        for (let cx = r.x0; cx <= r.x1; cx++) {
            for (let cy = r.y0; cy <= r.y1; cy++) {
                const list = buckets.get(cx + ':' + cy);
                if (list) list.forEach(j => { if (j !== i) candidates.add(j); });
            }
        }
        candidates.forEach(j => {
            const t = segments[j];
            [t.a, t.b].forEach(p => {
                const pr = projectParam(p, s.a, s.b);
                if (pr.dist <= tol && pr.u * len > tol && (1 - pr.u) * len > tol) s.cuts.push(pr.u);
            });
            const hit = intersectParams(s.a, s.b, t.a, t.b);
            if (hit && hit.u > 0 && hit.u < 1 && hit.v > 0 && hit.v < 1 && hit.u * len > tol && (1 - hit.u) * len > tol) s.cuts.push(hit.u);
        });
    }

    const index = createNodeIndex(tol);
    const edgeMap = new Map();
    const edges = [];
    segments.forEach(s => {
        const cuts = Array.from(new Set(s.cuts.map(u => Math.round(u * 1e6) / 1e6))).sort((x, y) => x - y);
        for (let k = 0; k < cuts.length - 1; k++) {
            const p0 = { x: s.a.x + (s.b.x - s.a.x) * cuts[k], y: s.a.y + (s.b.y - s.a.y) * cuts[k] };
            const p1 = { x: s.a.x + (s.b.x - s.a.x) * cuts[k + 1], y: s.a.y + (s.b.y - s.a.y) * cuts[k + 1] };
            const na = index.get(p0);
            const nb = index.get(p1);
            if (na === nb) continue;
            const ek = Math.min(na.id, nb.id) + '-' + Math.max(na.id, nb.id);
            const existing = edgeMap.get(ek);
            if (existing) {
                existing.thickness = Math.max(existing.thickness, s.thickness);
                if (existing.walls.indexOf(s.wi) < 0) existing.walls.push(s.wi);
                continue;
            }
            const edge = { id: edges.length, a: na.id, b: nb.id, len: distance(na, nb), thickness: s.thickness, walls: [s.wi] };
            edgeMap.set(ek, edge);
            edges.push(edge);
        }
    });

    const nodes = index.nodes;
    const adjacency = nodes.map(() => []);
    edges.forEach(e => { adjacency[e.a].push(e.id); adjacency[e.b].push(e.id); });
    return { nodes, edges, adjacency };
}

export function graphStats(graph) {
    let total = 0;
    graph.edges.forEach(e => { total += e.len; });
    let junctions = 0;
    let ends = 0;
    let bends = 0;
    graph.adjacency.forEach(list => {
        if (list.length >= 3) junctions++;
        else if (list.length === 1) ends++;
        else if (list.length === 2) bends++;
    });
    return { totalLength: total, nodes: graph.nodes.length, edges: graph.edges.length, junctions, ends, bends };
}

function shoelace(points) {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const q = points[(i + 1) % points.length];
        sum += p.x * q.y - q.x * p.y;
    }
    return sum / 2;
}

function traceFaces(graph) {
    const alive = graph.edges.map(() => true);
    const degree = graph.adjacency.map(list => list.length);
    const queue = [];
    degree.forEach((d, n) => { if (d === 1) queue.push(n); });
    while (queue.length) {
        const n = queue.pop();
        if (degree[n] !== 1) continue;
        const eid = graph.adjacency[n].find(id => alive[id]);
        if (eid === undefined) continue;
        alive[eid] = false;
        degree[n] = 0;
        const e = graph.edges[eid];
        const other = e.a === n ? e.b : e.a;
        degree[other]--;
        if (degree[other] === 1) queue.push(other);
    }

    const sorted = graph.nodes.map((node, n) => {
        const list = graph.adjacency[n].filter(id => alive[id]).map(id => {
            const e = graph.edges[id];
            const to = e.a === n ? e.b : e.a;
            const t = graph.nodes[to];
            return { to: to, edgeId: id, angle: Math.atan2(t.y - node.y, t.x - node.x) };
        });
        list.sort((p, q) => p.angle - q.angle);
        return list;
    });

    const visited = new Set();
    const faces = [];
    graph.edges.forEach(edge => {
        if (!alive[edge.id]) return;
        [[edge.a, edge.b], [edge.b, edge.a]].forEach(([startU, startV]) => {
            if (visited.has(startU + '>' + startV)) return;
            let u = startU;
            let v = startV;
            const nodeIds = [];
            const edgeIds = [];
            let guard = 0;
            while (!visited.has(u + '>' + v) && guard++ < 100000) {
                visited.add(u + '>' + v);
                nodeIds.push(u);
                const list = sorted[v];
                const idx = list.findIndex(item => item.to === u);
                const next = list[(idx - 1 + list.length) % list.length];
                edgeIds.push(next ? sorted[u].find(item => item.to === v).edgeId : -1);
                u = v;
                v = next.to;
            }
            const points = nodeIds.map(id => ({ x: graph.nodes[id].x, y: graph.nodes[id].y }));
            const area = shoelace(points);
            faces.push({ nodeIds, edgeIds, points, area });
        });
    });

    return faces;
}

export function findFaces(graph, minArea) {
    return traceFaces(graph).filter(f => f.area > minArea && f.points.length >= 3);
}

export function findOuterBoundaries(graph, minArea) {
    return traceFaces(graph).filter(f => f.area < -minArea && f.points.length >= 3);
}

export function faceInfo(graph, face) {
    let perimeter = 0;
    let thicknessSum = 0;
    face.edgeIds.forEach(id => {
        if (id < 0) return;
        perimeter += graph.edges[id].len;
        thicknessSum += graph.edges[id].thickness;
    });
    const count = face.edgeIds.filter(id => id >= 0).length || 1;
    const key = face.points.map(p => Math.round(p.x) + ',' + Math.round(p.y)).sort().join('|');
    return { perimeter, thickness: thicknessSum / count, key };
}

export function mergeChains(walls, tol) {
    const endpointIndex = createNodeIndex(tol);
    const incident = new Map();
    walls.forEach((w, wi) => {
        [0, w.points.length - 1].forEach(pi => {
            const node = endpointIndex.get(w.points[pi]);
            if (!incident.has(node.id)) incident.set(node.id, []);
            incident.get(node.id).push({ wi, end: pi === 0 ? 'start' : 'end' });
        });
    });

    const eligible = [];
    incident.forEach((list, nodeId) => {
        if (list.length !== 2 || list[0].wi === list[1].wi) return;
        const wa = walls[list[0].wi];
        const wb = walls[list[1].wi];
        if (wa.layer !== wb.layer || Math.abs(wa.thickness - wb.thickness) > 1e-6) return;
        const node = endpointIndex.nodes[nodeId];
        let blocked = false;
        walls.forEach((w, wi) => {
            if (blocked) return;
            for (let i = 0; i < w.points.length - 1; i++) {
                const a = w.points[i];
                const b = w.points[i + 1];
                const touchesEnd = (wi === list[0].wi || wi === list[1].wi) && (distance(a, node) <= tol || distance(b, node) <= tol);
                if (touchesEnd) continue;
                if (projectParam(node, a, b).dist <= tol) { blocked = true; return; }
            }
        });
        if (!blocked) eligible.push({ x: node.x, y: node.y });
    });

    let chains = walls.map((w, wi) => ({ points: w.points.map(p => ({ x: p.x, y: p.y })), thickness: w.thickness, layer: w.layer, members: [wi] }));
    function isEligible(p) { return eligible.some(e => distance(e, p) <= tol); }

    let changed = true;
    while (changed) {
        changed = false;
        outer:
        for (let i = 0; i < chains.length; i++) {
            for (let j = i + 1; j < chains.length; j++) {
                const A = chains[i];
                const B = chains[j];
                const ends = [
                    { ai: 'end', bi: 'start' }, { ai: 'end', bi: 'end' },
                    { ai: 'start', bi: 'start' }, { ai: 'start', bi: 'end' }
                ];
                for (const c of ends) {
                    const pa = c.ai === 'end' ? A.points[A.points.length - 1] : A.points[0];
                    const pb = c.bi === 'start' ? B.points[0] : B.points[B.points.length - 1];
                    if (distance(pa, pb) > tol || !isEligible(pa)) continue;
                    const left = c.ai === 'end' ? A.points.slice() : A.points.slice().reverse();
                    const right = c.bi === 'start' ? B.points.slice() : B.points.slice().reverse();
                    const merged = { points: left.concat(right.slice(1)), thickness: A.thickness, layer: A.layer, members: A.members.concat(B.members) };
                    chains = chains.filter((_, k) => k !== i && k !== j);
                    chains.push(merged);
                    changed = true;
                    break outer;
                }
            }
        }
    }
    return chains.filter(c => c.members.length > 1);
}

export function pointInPolygon(p, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i];
        const b = polygon[j];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
}

export function chainsFromGraph(graph, walls) {
    function attrKey(e) {
        const w = walls[e.walls[0]];
        return (w.layer || 'walls') + '|' + (Math.round(e.thickness * 1000) / 1000);
    }
    function breaksAt(n) {
        const list = graph.adjacency[n];
        if (list.length !== 2) return true;
        return attrKey(graph.edges[list[0]]) !== attrKey(graph.edges[list[1]]);
    }
    const used = new Set();
    const chains = [];
    function walk(startEdge, startNode) {
        const first = graph.edges[startEdge];
        const ids = [startNode];
        let node = startNode;
        let eid = startEdge;
        for (let guard = 0; guard < 100000; guard++) {
            used.add(eid);
            const e = graph.edges[eid];
            node = e.a === node ? e.b : e.a;
            ids.push(node);
            if (breaksAt(node)) break;
            const next = graph.adjacency[node].find(id => id !== eid);
            if (next === undefined || used.has(next)) break;
            eid = next;
        }
        chains.push({
            points: ids.map(id => ({ x: graph.nodes[id].x, y: graph.nodes[id].y })),
            layer: walls[first.walls[0]].layer || 'walls',
            thickness: first.thickness,
            source: first.walls[0]
        });
    }
    graph.nodes.forEach(n => {
        if (!breaksAt(n.id)) return;
        graph.adjacency[n.id].forEach(eid => { if (!used.has(eid)) walk(eid, n.id); });
    });
    graph.edges.forEach(e => { if (!used.has(e.id)) walk(e.id, e.a); });
    return chains;
}
