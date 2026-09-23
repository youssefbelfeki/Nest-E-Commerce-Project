'use strict';
const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read/parse input: ' + e.message);
  process.exit(1);
}

const fileNodes = input.fileNodes || [];
const importEdges = input.importEdges || [];
const allEdges = input.allEdges || [];

function filePathOf(node) {
  return node.filePath || node.name || node.id;
}

// Strip the "prefix:id" scheme prefix to get raw path
function rawPath(node) {
  const fp = filePathOf(node);
  return fp;
}

// A. Directory Grouping: common prefix then first segment after it
function commonPrefix(paths) {
  if (!paths.length) return '';
  const split = paths.map(p => p.split('/'));
  let prefix = split[0];
  for (const parts of split.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < parts.length && prefix[i] === parts[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix.join('/');
}

const paths = fileNodes.map(rawPath);
const prefix = commonPrefix(paths);
const prefixSegs = prefix ? prefix.split('/') : [];

function groupOf(p) {
  const parts = p.split('/');
  // file directly at prefix root or no dir
  if (parts.length <= prefixSegs.length + 1 && parts.length <= 2) {
    // group by extension/type pattern for flat structures
    const base = parts[parts.length - 1];
    if (/\.(test|spec)\./.test(base) || /^(test_|.*_test\.)/.test(base)) return 'test';
    if (/\.(config|conf)\./.test(base) || /^(Dockerfile|Makefile|Jenkinsfile)/.test(base)) return 'root-config';
    if (/\.md$|\.rst$/.test(base)) return 'root-docs';
    return 'root';
  }
  const rest = parts.slice(prefixSegs.length);
  return rest[0] || 'root';
}

const directoryGroups = {};
for (const n of fileNodes) {
  const g = groupOf(rawPath(n));
  if (!directoryGroups[g]) directoryGroups[g] = [];
  directoryGroups[g].push(n.id);
}

// B. Node Type Grouping
const nodeTypeGroups = {};
for (const n of fileNodes) {
  const t = n.type;
  if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
  nodeTypeGroups[t].push(n.id);
}

// C. Import adjacency: fan-in / fan-out
const fileFanOut = {};
const fileFanIn = {};
const idToGroup = {};
for (const g of Object.keys(directoryGroups)) {
  for (const id of directoryGroups[g]) idToGroup[id] = g;
}
for (const e of importEdges) {
  fileFanOut[e.source] = (fileFanOut[e.source] || 0) + 1;
  fileFanIn[e.target] = (fileFanIn[e.target] || 0) + 1;
}
// ensure all nodes present
for (const n of fileNodes) {
  if (!(n.id in fileFanOut)) fileFanOut[n.id] = 0;
  if (!(n.id in fileFanIn)) fileFanIn[n.id] = 0;
}

// group-level import direction sets
const groupImportsFrom = {}; // g -> Set of groups it imports from
const groupImportedBy = {};
for (const g of Object.keys(directoryGroups)) {
  groupImportsFrom[g] = new Set();
  groupImportedBy[g] = new Set();
}
for (const e of importEdges) {
  const gs = idToGroup[e.source];
  const gt = idToGroup[e.target];
  if (gs === undefined || gt === undefined || gs === gt) continue;
  groupImportsFrom[gs].add(gt);
  groupImportedBy[gt].add(gs);
}

// D. Cross-category edges
const crossCat = {};
for (const e of allEdges) {
  const s = fileNodes.find(n => n.id === e.source);
  const t = fileNodes.find(n => n.id === e.target);
  if (!s || !t) continue;
  const key = s.type + '->' + t.type + '|' + e.type;
  crossCat[key] = (crossCat[key] || 0) + 1;
}
const crossCategoryEdges = Object.entries(crossCat).map(([k, count]) => {
  const [types, edgeType] = k.split('|');
  const [fromType, toType] = types.split('->');
  return { fromType, toType, edgeType, count };
}).sort((a, b) => b.count - a.count);

// E. Inter-group import frequency
const pairCounts = {};
for (const e of importEdges) {
  const gs = idToGroup[e.source];
  const gt = idToGroup[e.target];
  if (gs === undefined || gt === undefined || gs === gt) continue;
  const key = gs + '->' + gt;
  pairCounts[key] = (pairCounts[key] || 0) + 1;
}
const interGroupImports = Object.entries(pairCounts).map(([k, count]) => {
  const [from, to] = k.split('->');
  return { from, to, count };
}).sort((a, b) => b.count - a.count);

// F. Intra-group density
const intraGroupDensity = {};
for (const g of Object.keys(directoryGroups)) {
  const members = new Set(directoryGroups[g]);
  let internal = 0, total = 0;
  for (const e of importEdges) {
    const sIn = members.has(e.source);
    const tIn = members.has(e.target);
    if (sIn && tIn) { internal++; total++; }
    else if (sIn || tIn) total++;
  }
  intraGroupDensity[g] = { internalEdges: internal, totalEdges: total, density: total ? internal / total : 0 };
}

// G. Directory pattern matching
const dirPatterns = [
  [/^(routes?|api|controllers?|endpoints?|handlers?|routers?|blueprints?)$/i, 'api'],
  [/^(services?|core|lib|domain|logic|internal|composables|mailers|jobs|channels|signals)$/i, 'service'],
  [/^(models?|db|data|persistence|repositor(y|ies)|entit(y|ies)|sql|database|schema|migrations)$/i, 'data'],
  [/^(components?|views?|pages?|ui|layouts?|screens?|app)$/i, 'ui'],
  [/^(middleware|middlewares|plugins?|interceptors?|guards?)$/i, 'middleware'],
  [/^(utils?|helpers?|common|shared|tools?|pkg|factories|fixtures)$/i, 'utility'],
  [/^(config|configs|constants?|env|settings?|management|commands)$/i, 'config'],
  [/^(__tests__|test|tests|spec|specs|e2e|integration|security)$/i, 'test'],
  [/^(types?|interfaces?|schemas?|contracts?|dtos?|dto|request|response|dictionaries)$/i, 'types'],
  [/^hooks$/i, 'hooks'],
  [/^(store|state|reducers?|actions?|slices?|context)$/i, 'state'],
  [/^(assets?|static|public)$/i, 'assets'],
  [/^templatetags$/i, 'utility'],
  [/^serializers?$/i, 'api'],
  [/^(cmd|bin)$/i, 'entry'],
  [/^(docs?|documentation|wiki)$/i, 'documentation'],
  [/^(deploy|deployment|infra|infrastructure|docker)$/i, 'infrastructure'],
  [/^(\.github|\.gitlab|\.circleci)$/i, 'ci-cd'],
  [/^(k8s|kubernetes|helm|charts)$/i, 'infrastructure'],
  [/^(terraform|tf)$/i, 'infrastructure'],
  [/^(src|frontend|prisma|postman|test|graphify-out|\.ua)$/i, null], // containers, no direct label
];
function matchDir(name) {
  for (const [re, label] of dirPatterns) {
    if (re.test(name)) return label;
  }
  return null;
}
// also try last segment of nested groups (e.g. "src/auth" -> "auth")
const patternMatches = {};
for (const g of Object.keys(directoryGroups)) {
  let m = matchDir(g);
  if (!m && g.includes('/')) {
    const last = g.split('/').pop();
    m = matchDir(last);
  }
  // file-level fallback for flat groups
  if (!m) {
    const members = directoryGroups[g].map(id => id.split(':').slice(1).join(':').split('/').pop());
    if (members.length && members.every(b => /\.(spec|test)\./.test(b) || /\.e2e-spec\./.test(b))) m = 'test';
    else if (members.length && members.every(b => /\.md$/.test(b))) m = 'documentation';
    else if (members.length && members.every(b => /config|\.json$|\.toml$|\.ya?ml$/.test(b))) m = 'config';
  }
  if (m) patternMatches[g] = m;
}

// file-level pattern classification (section G second half)
function filePattern(p) {
  const base = p.split('/').pop();
  if (/\.(spec|test)\.[jt]sx?$/.test(base) || /^test_.*\.py$/.test(base) || /_test\.go$/.test(base) || /Test\.java$/.test(base) || /\.e2e-spec\./.test(base) || /\.integration-spec\./.test(base) || /\.security-spec\./.test(base)) return 'test';
  if (/\.d\.ts$/.test(base)) return 'types';
  if (/^(index\.[jt]sx?|__init__\.py)$/.test(base)) return 'entry';
  if (/^(Dockerfile|docker-compose.*|Makefile|Jenkinsfile)$/.test(base)) return 'infrastructure';
  if (/\.tf(vars)?$/.test(base)) return 'infrastructure';
  if (/^\.github\/workflows\//.test(p) || /\.gitlab-ci\.yml$/.test(p)) return 'ci-cd';
  if (/\.sql$/.test(base)) return 'data';
  if (/\.(graphql|gql|proto)$/.test(base)) return 'types';
  if (/\.(md|rst)$/.test(base)) return 'documentation';
  if (/^(Cargo\.toml|go\.mod|Gemfile|pom\.xml|build\.gradle|composer\.json)$/.test(base)) return 'config';
  return null;
}
const filePatternMatches = {};
for (const n of fileNodes) {
  const m = filePattern(rawPath(n));
  if (m) filePatternMatches[n.id] = m;
}

// H. Deployment topology
const allPaths = paths.join('\n');
function hasPat(re) { return allPaths.split('\n').some(p => re.test(p)); }
const infraFiles = fileNodes.filter(n => /Dockerfile|docker-compose|k8s|kubernetes|helm|terraform|\.tf$|workflows\/|\.gitlab-ci|Jenkinsfile/i.test(rawPath(n))).map(n => rawPath(n));
const deploymentTopology = {
  hasDockerfile: hasPat(/^Dockerfile/i) || hasPat(/Dockerfile$/),
  hasCompose: hasPat(/docker-compose/i),
  hasK8s: hasPat(/k8s|kubernetes|helm/i),
  hasTerraform: hasPat(/\.tf(vars)?$/i),
  hasCI: hasPat(/\.github\/workflows|\.gitlab-ci|Jenkinsfile/i),
  infraFiles,
};

// I. Data pipeline
const schemaFiles = fileNodes.filter(n => /schema\.(prisma|sql|graphql)|.*\.proto$/i.test(rawPath(n))).map(n => rawPath(n));
const migrationFiles = fileNodes.filter(n => /migrations?\//i.test(rawPath(n)) && /\.sql$/i.test(rawPath(n))).map(n => rawPath(n));
const dataModelFiles = fileNodes.filter(n => /(models?|entit(y|ies)|schemas?)\//i.test(rawPath(n)) && /\.[jt]sx?$/.test(rawPath(n))).map(n => rawPath(n));
const apiHandlerFiles = fileNodes.filter(n => /(controller|routes?|handlers?)\.[jt]sx?$/i.test(rawPath(n))).map(n => rawPath(n));
const dataPipeline = { schemaFiles, migrationFiles, dataModelFiles, apiHandlerFiles };

// J. Documentation coverage
const groups = Object.keys(directoryGroups);
const groupsWithDocs = groups.filter(g => directoryGroups[g].some(id => /\.(md|rst)$/i.test(id.split(':').slice(1).join(':'))));
const docCoverage = {
  groupsWithDocs: groupsWithDocs.length,
  totalGroups: groups.length,
  coverageRatio: groups.length ? groupsWithDocs.length / groups.length : 0,
  undocumentedGroups: groups.filter(g => !groupsWithDocs.includes(g)),
};

// K. Dependency direction
const seen = new Set();
const dependencyDirection = [];
for (const { from, to } of interGroupImports) {
  const rev = interGroupImports.find(x => x.from === to && x.to === from);
  const fwd = interGroupImports.find(x => x.from === from && x.to === to);
  const revCount = rev ? rev.count : 0;
  if (fwd.count > revCount && !seen.has(from + '->' + to)) {
    dependencyDirection.push({ dependent: from, dependsOn: to });
    seen.add(from + '->' + to);
    seen.add(to + '->' + from);
  }
}

// file stats
const filesPerGroup = {};
for (const g of Object.keys(directoryGroups)) filesPerGroup[g] = directoryGroups[g].length;
const nodeTypeCounts = {};
for (const t of Object.keys(nodeTypeGroups)) nodeTypeCounts[t] = nodeTypeGroups[t].length;

const out = {
  scriptCompleted: true,
  commonPrefix: prefix,
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  filePatternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats: { totalFileNodes: fileNodes.length, filesPerGroup, nodeTypeCounts },
  fileFanIn,
  fileFanOut,
};

fs.writeFileSync(outputPath, JSON.stringify(out, null, 2));
console.log('OK groups=' + groups.length + ' nodes=' + fileNodes.length);
