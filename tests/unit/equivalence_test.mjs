import * as A from './wallgraph_reference.mjs';
import * as B from './wallgraph.mjs';
let bad = 0;
function rnd(seed){ let s=seed; return () => (s = (s*1664525+1013904223) % 4294967296) / 4294967296; }
for (let t = 0; t < 300; t++) {
  const r = rnd(t+1);
  const n = 3 + Math.floor(r()*14);
  const walls = [];
  for (let i = 0; i < n; i++) {
    const pts = [];
    const k = 2 + Math.floor(r()*4);
    for (let j = 0; j < k; j++) pts.push({ x: Math.round(r()*10)*20 + (r()<0.2?3:0), y: Math.round(r()*10)*20 + (r()<0.2?2:0) });
    walls.push({ points: pts, thickness: 5, layer: 'walls' });
  }
  const ga = A.buildGraph(walls, 4), gb = B.buildGraph(walls, 4);
  const sa = A.graphStats(ga), sb = B.graphStats(gb);
  const fa = A.findFaces(ga, 10).map(f => Math.round(f.area)).sort().join(','), fb = B.findFaces(gb, 10).map(f => Math.round(f.area)).sort().join(',');
  if (JSON.stringify(sa) !== JSON.stringify(sb) || fa !== fb) { bad++; if (bad < 4) console.log('MISMATCH seed', t, sa, sb, fa, fb); }
}
console.log('mismatches', bad, 'of 300');
