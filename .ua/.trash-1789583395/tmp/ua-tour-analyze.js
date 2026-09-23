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
  const nodeIds = new Set(nodes.map(n => n.id));
  const byId = {};
  nodes.forEach(n => { byId[n.id] = n; });

  // A. Fan-in, B. Fan-out
  const fanIn = {};
  const fanOut = {};
  nodes.forEach(n => { fanIn[n.id] = 0; fanOut[n.id] = 0; });
  edges.forEach(e => {
    if (nodeIds.has(e.target)) fanIn[e.target] = (fanIn[e.target] || 0) + 1;
    if (nodeIds.has(e.source)) fanOut[e.source] = (fanOut[e.source] || 0) + 1;
  });
  const fanInRanking = nodes.map(n => ({ id: n.id, fanIn: fanIn[n.id] || 0, name: n.name }))
    .sort((a, b) => b.fanIn - a.fanIn).slice(0, 20);
  const fanOutRanking = nodes.map(n => ({ id: n.id, fanOut: fanOut[n.id] || 0, name: n.name }))
    .sort((a, b) => b.fanOut - a.fanOut).slice(0, 20);

  // thresholds for entry scoring
  const fanOutVals = nodes.map(n => fanOut[n.id] || 0).sort((a, b) => a - b);
  const fanInVals = nodes.map(n => fanIn[n.id] || 0).sort((a, b) => a - b);
  const top10FanOutCut = fanOutVals[Math.floor(fanOutVals.length * 0.9)] ?? 0;
  const bottom25FanInCut = fanInVals[Math.floor(fanInVals.length * 0.25)] ?? 0;

  const CODE_ENTRY = ['index.ts','index.js','main.ts','main.js','app.ts','app.js','server.ts','server.js','mod.rs','main.go','main.py','main.rs','manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py','Application.java','Main.java','Program.cs','config.ru','index.php','App.swift','Application.kt','main.cpp','main.c'];

  // C. Entry point candidates
  const scored = nodes.map(n => {
    let score = 0;
    const fp = n.filePath || n.id;
    const base = fp.split('/').pop();
    if (n.type === 'document') {
      if (n.id === 'document:README.md' || fp === 'README.md') score += 5;
      else if ((n.name || '').endsWith('.md') && !fp.includes('/')) score += 2;
    } else {
      if (CODE_ENTRY.includes(base)) score += 3;
      const depth = fp.split('/').length;
      if (depth <= 2) score += 1;
      if ((fanOut[n.id] || 0) >= top10FanOutCut && top10FanOutCut > 0) score += 1;
      if ((fanIn[n.id] || 0) <= bottom25FanInCut) score += 1;
    }
    return { id: n.id, score, name: n.name, summary: n.summary || '' };
  });
  const entryPointCandidates = scored.filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 5);

  // D. BFS from top code entry point (skip documents)
  const codeCandidates = entryPointCandidates.filter(c => {
    const n = byId[c.id];
    return n && n.type !== 'document';
  });
  const startNode = codeCandidates.length > 0 ? codeCandidates[0].id
    : (nodes.find(n => n.id === 'file:src/main.ts') || {}).id || entryPointCandidates[0]?.id;
  const adj = {};
  edges.forEach(e => {
    if (e.type === 'imports' || e.type === 'calls') {
      if (!adj[e.source]) adj[e.source] = [];
      adj[e.source].push(e.target);
    }
  });
  const order = [];
  const depthMap = {};
  if (startNode && nodeIds.has(startNode)) {
    const visited = new Set([startNode]);
    const queue = [{ id: startNode, d: 0 }];
    depthMap[startNode] = 0;
    while (queue.length) {
      const cur = queue.shift();
      order.push(cur.id);
      for (const nb of (adj[cur.id] || [])) {
        if (!nodeIds.has(nb) || visited.has(nb)) continue;
        visited.add(nb);
        depthMap[nb] = cur.d + 1;
        queue.push({ id: nb, d: cur.d + 1 });
      }
    }
  }
  const byDepth = {};
  Object.entries(depthMap).forEach(([id, d]) => {
    const k = String(d);
    if (!byDepth[k]) byDepth[k] = [];
    byDepth[k].push(id);
  });

  // E. Non-code inventory
  const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
  nodes.forEach(n => {
    const entry = { id: n.id, name: n.name, type: n.type, summary: n.summary || '' };
    if (n.type === 'document') nonCodeFiles.documentation.push(entry);
    else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') nonCodeFiles.infrastructure.push(entry);
    else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') nonCodeFiles.data.push(entry);
    else if (n.type === 'config') nonCodeFiles.config.push(entry);
  });

  // F. Clusters: bidirectional pairs then expand
  const fwd = new Set(edges.map(e => e.source + '\u0000' + e.target));
  const pairs = [];
  const seen = new Set();
  edges.forEach(e => {
    if (e.type !== 'imports' && e.type !== 'calls') return;
    const rev = e.target + '\u0000' + e.source;
    const key = [e.source, e.target].sort().join('\u0000');
    if (fwd.has(rev) && !seen.has(key) && nodeIds.has(e.source) && nodeIds.has(e.target)) {
      seen.add(key);
      pairs.push([e.source, e.target]);
    }
  });
  // union-find
  const parent = {};
  const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a, b) => { parent[a] = parent[a] || a; parent[b] = parent[b] || b; parent[find(a)] = find(b); };
  pairs.forEach(([a, b]) => union(a, b));
  const groups = {};
  Object.keys(parent).forEach(n => {
    const r = find(n);
    if (!groups[r]) groups[r] = new Set();
    groups[r].add(n);
  });
  // expand: add nodes connected to 2+ members
  const neighbor = {};
  edges.forEach(e => {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return;
    if (!neighbor[e.source]) neighbor[e.source] = new Set();
    if (!neighbor[e.target]) neighbor[e.target] = new Set();
    neighbor[e.source].add(e.target);
    neighbor[e.target].add(e.source);
  });
  let clusters = Object.values(groups).map(s => Array.from(s));
  clusters = clusters.map(members => {
    const set = new Set(members);
    nodes.forEach(n => {
      if (set.has(n.id)) return;
      const nb = neighbor[n.id] || new Set();
      let c = 0;
      members.forEach(m => { if (nb.has(m)) c++; });
      if (c >= 2) set.add(n.id);
    });
    return Array.from(set).slice(0, 5);
  });
  // edge count within cluster
  clusters = clusters.map(members => {
    const set = new Set(members);
    let edgeCount = 0;
    edges.forEach(e => { if (set.has(e.source) && set.has(e.target)) edgeCount++; });
    return { nodes: members, edgeCount };
  }).sort((a, b) => b.edgeCount - a.edgeCount).slice(0, 10);
  // fallback: if no bidirectional pairs, derive clusters from shared neighbors (top co-imported groups)
  if (clusters.length === 0) {
    const importTargets = {};
    edges.forEach(e => {
      if (e.type !== 'imports') return;
      if (!importTargets[e.source]) importTargets[e.source] = new Set();
      importTargets[e.source].add(e.target);
    });
    const keys = Object.keys(importTargets);
    const scoredPairs = [];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = importTargets[keys[i]], b = importTargets[keys[j]];
        let shared = 0;
        a.forEach(t => { if (b.has(t)) shared++; });
        if (shared >= 1) scoredPairs.push({ nodes: [keys[i], keys[j]], edgeCount: shared });
      }
    }
    clusters = scoredPairs.sort((a, b) => b.edgeCount - a.edgeCount).slice(0, 5);
  }

  // G. layers
  const layerList = layers.map(l => ({ id: l.id, name: l.name, description: l.description || '' }));

  // H. summary index
  const nodeSummaryIndex = {};
  nodes.forEach(n => { nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary || '' }; });

  const out = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal: { startNode, order, depthMap, byDepth },
    nonCodeFiles,
    clusters,
    layers: { count: layers.length, list: layerList },
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length
  };
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 1));
  process.exit(0);
}

main();
