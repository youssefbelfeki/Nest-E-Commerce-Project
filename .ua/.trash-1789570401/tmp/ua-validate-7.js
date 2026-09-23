const fs = require('fs');
const p = 'C:\\Users\\Youssef\\Desktop\\ecommerce-project\\.ua\\intermediate\\batch-7.json';
const s = fs.statSync(p);
const d = JSON.parse(fs.readFileSync(p, 'utf8'));
const ids = new Set(d.nodes.map(n => n.id));
const bad = d.edges.filter(e => !ids.has(e.source) && !ids.has(e.target));
console.log(JSON.stringify({
  bytes: s.size,
  nodes: d.nodes.length,
  edges: d.edges.length,
  imports: d.edges.filter(e => e.type === 'imports').length,
  edgesWithNoLocalEndpoint: bad.length
}));
