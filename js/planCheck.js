function segmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    return Math.hypot(p.x - (a.x + u * dx), p.y - (a.y + u * dy));
}

export function runChecks(input) {
    const { graph, openings, unmatchedLoops, ppm, describeLength } = input;
    const issues = [];
    const near = 0.5 * ppm;

    graph.nodes.forEach(n => {
        if (graph.adjacency[n.id].length !== 1) return;
        let best = null;
        graph.nodes.forEach(m => {
            if (m.id === n.id) return;
            const d = Math.hypot(m.x - n.x, m.y - n.y);
            if (d <= near && (!best || d < best.d)) best = { d: d, kind: 'a corner' };
        });
        graph.edges.forEach(e => {
            if (e.a === n.id || e.b === n.id) return;
            const d = segmentDistance(n, graph.nodes[e.a], graph.nodes[e.b]);
            if (d <= near && (!best || d < best.d)) best = { d: d, kind: 'another wall' };
        });
        if (best) issues.push({ severity: 'warning', message: `A wall ends ${describeLength(best.d / ppm)} short of ${best.kind}. Close the gap.`, at: { x: n.x, y: n.y } });
        else issues.push({ severity: 'info', message: 'Free wall end.', at: { x: n.x, y: n.y } });
    });

    graph.edges.forEach(e => {
        const a = graph.nodes[e.a];
        const b = graph.nodes[e.b];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (e.len < 0.15 * ppm) issues.push({ severity: 'warning', message: 'Very short wall segment.', at: mid });
        if (e.walls.length > 1) issues.push({ severity: 'info', message: 'Two or more walls overlap here.', at: mid });
    });

    openings.forEach(o => {
        let best = Infinity;
        let thickness = 0;
        graph.edges.forEach(e => {
            const d = segmentDistance(o, graph.nodes[e.a], graph.nodes[e.b]);
            if (d < best) { best = d; thickness = e.thickness; }
        });
        if (best > thickness / 2 + 0.35 * ppm) issues.push({ severity: 'warning', message: `A ${o.type} is not on any wall.`, at: { x: o.x, y: o.y } });
    });

    unmatchedLoops.forEach(at => issues.push({ severity: 'info', message: 'A closed wall loop has no room. Use Detect Rooms.', at: at }));

    if (!issues.length) issues.push({ severity: 'ok', message: 'No problems found.', at: null });
    return issues.slice(0, 60);
}
