'use strict';
const fs = require('fs');

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    console.error('Usage: node ua-tour-analyze.js <input.json> <output.json>');
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read/parse input: ' + e.message);
    process.exit(1);
  }
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const layers = data.layers || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // A. Fan-in, B. Fan-out (all edge types)
  const fanIn = new Map(nodes.map((n) => [n.id, 0]));
  const fanOut = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    if (e.source === e.target) continue;
    fanOut.set(e.source, (fanOut.get(e.source) || 0) + 1);
    fanIn.set(e.target, (fanIn.get(e.target) || 0) + 1);
  }
  const fanInRanking = nodes
    .map((n) => ({ id: n.id, fanIn: fanIn.get(n.id) || 0, name: n.name }))
    .sort((a, b) => b.fanIn - a.fanIn || (a.id < b.id ? -1 : 1))
    .slice(0, 20);
  const fanOutRanking = nodes
    .map((n) => ({ id: n.id, fanOut: fanOut.get(n.id) || 0, name: n.name }))
    .sort((a, b) => b.fanOut - a.fanOut || (a.id < b.id ? -1 : 1))
    .slice(0, 20);

  // Thresholds for entry-point scoring
  const fanOutVals = [...fanOut.values()].sort((a, b) => a - b);
  const fanInVals = [...fanIn.values()].sort((a, b) => a - b);
  const q = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
  const fanOutTop10 = q(fanOutVals, 0.9);
  const fanInBottom25 = q(fanInVals, 0.25);

  const codeEntryNames = new Set([
    'index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js',
    'server.ts', 'server.js', 'mod.rs', 'main.go', 'main.py', 'main.rs',
    'manage.py', 'app.py', 'wsgi.py', 'asgi.py', 'run.py', '__main__.py',
    'Application.java', 'Main.java', 'Program.cs', 'config.ru', 'index.php',
    'App.swift', 'Application.kt', 'main.cpp', 'main.c',
  ]);

  // C. Entry point candidates
  const candidates = [];
  for (const n of nodes) {
    let score = 0;
    const fp = n.filePath || '';
    const depth = fp.split('/').length; // segments
    if (n.type === 'document') {
      if (fp === 'README.md') score += 5;
      else if (fp.endsWith('.md') && !fp.includes('/')) score += 2;
    } else {
      if (codeEntryNames.has(n.name)) score += 3;
      if (depth <= 2) score += 1;
      if ((fanOut.get(n.id) || 0) >= fanOutTop10 && fanOutTop10 > 0) score += 1;
      if ((fanIn.get(n.id) || 0) <= fanInBottom25) score += 1;
    }
    if (score > 0) candidates.push({ id: n.id, score, name: n.name, summary: n.summary || '' });
  }
  candidates.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
  const entryPointCandidates = candidates.slice(0, 5);

  // D. BFS from top code entry point (skip documents)
  const codeCandidates = candidates.filter((c) => {
    const n = byId.get(c.id);
    return n && n.type !== 'document';
  });
  const startNode = codeCandidates.length > 0 ? codeCandidates[0].id : entryPointCandidates.length > 0 ? entryPointCandidates[0].id : null;
  const adj = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    if (e.type !== 'imports' && e.type !== 'calls') continue;
    if (!adj.has(e.source) || !byId.has(e.target)) continue;
    adj.get(e.source).push(e.target);
  }
  const order = [];
  const depthMap = {};
  const byDepth = {};
  if (startNode) {
    const visited = new Set([startNode]);
    const queue = [{ id: startNode, d: 0 }];
    depthMap[startNode] = 0;
    while (queue.length > 0) {
      const cur = queue.shift();
      order.push(cur.id);
      if (!byDepth[String(cur.d)]) byDepth[String(cur.d)] = [];
      byDepth[String(cur.d)].push(cur.id);
      const nexts = (adj.get(cur.id) || []).slice().sort();
      for (const nx of nexts) {
        if (!visited.has(nx)) {
          visited.add(nx);
          depthMap[nx] = cur.d + 1;
          queue.push({ id: nx, d: cur.d + 1 });
        }
      }
    }
  }

  // E. Non-code inventory
  const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
  for (const n of nodes) {
    const entry = { id: n.id, name: n.name, type: n.type, summary: n.summary || '' };
    if (n.type === 'document') nonCodeFiles.documentation.push(entry);
    else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') nonCodeFiles.infrastructure.push(entry);
    else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') nonCodeFiles.data.push(entry);
    else if (n.type === 'config') nonCodeFiles.config.push(entry);
  }

  // F. Tightly coupled clusters (bidirectional pairs, expand)
  const outSet = new Map(nodes.map((n) => [n.id, new Set()]));
  const undirected = new Map(nodes.map((n) => [n.id, new Set()]));
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target) || e.source === e.target) continue;
    outSet.get(e.source).add(e.target);
    undirected.get(e.source).add(e.target);
    undirected.get(e.target).add(e.source);
  }
  const pairKeys = new Set();
  const clusters = [];
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target) || e.source === e.target) continue;
    if (outSet.get(e.target).has(e.source)) {
      const key = [e.source, e.target].sort().join('|');
      if (!pairKeys.has(key)) {
        pairKeys.add(key);
        clusters.push(new Set([e.source, e.target]));
      }
    }
  }
  // Expand: add nodes connected to 2+ members
  for (const c of clusters) {
    let grew = true;
    while (grew && c.size < 5) {
      grew = false;
      for (const n of nodes) {
        if (c.has(n.id)) continue;
        let links = 0;
        for (const m of c) {
          if (undirected.get(n.id).has(m)) links++;
        }
        if (links >= 2) {
          c.add(n.id);
          grew = true;
          if (c.size >= 5) break;
        }
      }
    }
  }
  // Merge overlapping clusters
  const merged = [];
  for (const c of clusters) {
    let placed = false;
    for (const m of merged) {
      const inter = [...c].filter((x) => m.has(x));
      if (inter.length > 0) {
        for (const x of c) { if (m.size < 5) m.add(x); }
        placed = true;
        break;
      }
    }
    if (!placed) merged.push(new Set(c));
  }
  const clusterOut = merged.slice(0, 10).map((c) => {
    const arr = [...c];
    let edgeCount = 0;
    for (const e of edges) {
      if (c.has(e.source) && c.has(e.target)) edgeCount++;
    }
    return { nodes: arr.sort(), edgeCount };
  }).sort((a, b) => b.edgeCount - a.edgeCount).slice(0, 10);

  // G. Layers
  const layerList = layers.map((l) => ({ id: l.id, name: l.name, description: l.description }));

  // H. Node summary index
  const nodeSummaryIndex = {};
  for (const n of nodes) {
    nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary || '' };
  }

  const out = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal: { startNode, order, depthMap, byDepth },
    nonCodeFiles,
    clusters: clusterOut,
    layers: { count: layerList.length, list: layerList },
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2));
  console.log('OK nodes=' + nodes.length + ' edges=' + edges.length + ' bfs=' + order.length);
}

main();
