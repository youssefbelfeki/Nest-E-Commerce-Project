'use strict';
const fs = require('fs');

function main() {
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

  const idToNode = new Map();
  for (const n of fileNodes) idToNode.set(n.id, n);

  // ---- A. Directory grouping (common prefix then first segment) ----
  const paths = fileNodes.map((n) => n.filePath || '');
  function commonPrefixSegments(ps) {
    const split = ps.map((p) => p.split('/').slice(0, -1)); // dir segments only
    if (split.length === 0) return [];
    let prefix = split[0];
    for (let i = 1; i < split.length; i++) {
      const segs = split[i];
      let j = 0;
      while (j < prefix.length && j < segs.length && prefix[j] === segs[j]) j++;
      prefix = prefix.slice(0, j);
      if (prefix.length === 0) break;
    }
    return prefix;
  }
  const flatStructure = paths.every((p) => !p.includes('/'));
  const prefix = flatStructure ? [] : commonPrefixSegments(paths);
  const prefixLen = prefix.length;

  function groupFor(filePath) {
    const segs = filePath.split('/');
    if (segs.length <= 1) return 'root';
    if (flatStructure) {
      // group by file type/extension pattern
      const base = segs[segs.length - 1];
      if (/\.test\.|\.spec\.|^test_/.test(base)) return 'test';
      if (/\.config\.|^(package\.json|tsconfig.*|nest-cli\.json)$/.test(base)) return 'config';
      return 'root';
    }
    if (segs.length - 1 <= prefixLen) return 'root';
    return segs[prefixLen] || 'root';
  }

  const directoryGroups = {};
  for (const n of fileNodes) {
    const g = groupFor(n.filePath || '');
    if (!directoryGroups[g]) directoryGroups[g] = [];
    directoryGroups[g].push(n.id);
  }
  const nodeToGroup = {};
  for (const [g, ids] of Object.entries(directoryGroups)) {
    for (const id of ids) nodeToGroup[id] = g;
  }

  // ---- B. Node type grouping ----
  const nodeTypeGroups = {};
  for (const n of fileNodes) {
    const t = n.type || 'file';
    if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
    nodeTypeGroups[t].push(n.id);
  }

  // ---- C. Import adjacency: fan-in / fan-out ----
  const fileFanIn = {};
  const fileFanOut = {};
  for (const n of fileNodes) { fileFanIn[n.id] = 0; fileFanOut[n.id] = 0; }
  const groupImportsFrom = {}; // group -> Set of groups it imports from
  const groupImportedBy = {}; // group -> Set of groups importing it
  for (const g of Object.keys(directoryGroups)) {
    groupImportsFrom[g] = new Set();
    groupImportedBy[g] = new Set();
  }
  for (const e of importEdges) {
    if (!idToNode.has(e.source) || !idToNode.has(e.target)) continue;
    fileFanOut[e.source] = (fileFanOut[e.source] || 0) + 1;
    fileFanIn[e.target] = (fileFanIn[e.target] || 0) + 1;
    const gs = nodeToGroup[e.source];
    const gt = nodeToGroup[e.target];
    if (gs && gt) {
      groupImportsFrom[gs].add(gt);
      groupImportedBy[gt].add(gs);
    }
  }

  // ---- D. Cross-category dependency analysis ----
  const crossKey = {};
  for (const e of allEdges) {
    const s = idToNode.get(e.source);
    const t = idToNode.get(e.target);
    if (!s || !t) continue;
    const key = s.type + '|' + t.type + '|' + e.type;
    if (!crossKey[key]) {
      crossKey[key] = { fromType: s.type, toType: t.type, edgeType: e.type, count: 0 };
    }
    crossKey[key].count++;
  }
  const crossCategoryEdges = Object.values(crossKey).sort((a, b) => b.count - a.count);

  // ---- E. Inter-group import frequency ----
  const pairCounts = {};
  for (const e of importEdges) {
    const gs = nodeToGroup[e.source];
    const gt = nodeToGroup[e.target];
    if (!gs || !gt) continue;
    const key = gs + '|' + gt;
    pairCounts[key] = (pairCounts[key] || 0) + 1;
  }
  const interGroupImports = Object.entries(pairCounts)
    .map(([k, count]) => {
      const [from, to] = k.split('|');
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count);

  // ---- F. Intra-group import density ----
  const intraGroupDensity = {};
  for (const g of Object.keys(directoryGroups)) {
    const internalEdges = pairCounts[g + '|' + g] || 0;
    let totalEdges = 0;
    for (const [k, c] of Object.entries(pairCounts)) {
      const [from, to] = k.split('|');
      if (from === g || to === g) totalEdges += c;
    }
    intraGroupDensity[g] = {
      internalEdges,
      totalEdges,
      density: totalEdges === 0 ? 0 : Math.round((internalEdges / totalEdges) * 1000) / 1000,
    };
  }

  // ---- G. Directory pattern matching ----
  const dirPatterns = [
    [/^(routes?|api|controllers?|endpoints?|handlers?|routers?|blueprints?)$/, 'api'],
    [/^(services?|core|lib|domain|logic|internal|composables|mailers?|jobs?|channels?|signals?)$/, 'service'],
    [/^(models?|db|data|persistence|repositor(y|ies)|entities?|entity|sql|database|schema|migrations?)$/, 'data'],
    [/^(components?|views?|pages?|ui|layouts?|screens?)$/, 'ui'],
    [/^(middleware|plugins?|interceptors?|guards?)$/, 'middleware'],
    [/^(utils?|helpers?|common|shared|tools?|pkg|templatetags)$/, 'utility'],
    [/^(config|constants?|env|settings|management|commands?)$/, 'config'],
    [/^(__tests__|test|tests|spec|specs?)$/, 'test'],
    [/^(types?|interfaces?|schemas?|contracts?|dtos?|dto|requests?|responses?)$/, 'types'],
    [/^hooks?$/, 'hooks'],
    [/^(store|state|reducers?|actions?|slices?)$/, 'state'],
    [/^(assets?|static|public)$/, 'assets'],
    [/^(docs?|documentation|wiki)$/, 'documentation'],
    [/^(deploy|deployment|infra|infrastructure|docker|k8s|kubernetes|helm|charts?|terraform|tf)$/, 'infrastructure'],
    [/^(\.github|\.gitlab|\.circleci)$/, 'ci-cd'],
    [/^(serializers?)$/, 'api'],
    [/^(cmd|bin)$/, 'entry'],
    [/^src\/main\/java$/, 'service'],
    [/^src\/test\/java$/, 'test'],
  ];
  function matchDirName(name) {
    const lower = String(name).toLowerCase();
    for (const [re, label] of dirPatterns) {
      if (re.test(lower)) return label;
    }
    return null;
  }
  // File-level patterns -> label
  function matchFileLevel(n) {
    const fp = n.filePath || '';
    const base = fp.split('/').pop() || '';
    if (/\.test\.|\.spec\.|^(test_.*|.*_test\.go|.*Test\.java|.*_spec\.rb|.*Test\.php|.*Tests\.cs)$/.test(base)) return 'test';
    if (/\.d\.ts$/.test(base)) return 'types';
    if (/^(index\.(ts|js|tsx|jsx)|__init__\.py)$/.test(base)) return 'entry';
    if (/^manage\.py$/.test(base)) return 'entry';
    if (/^(wsgi|asgi)\.py$/.test(base)) return 'config';
    if (/^main\.go$/.test(base)) return 'entry';
    if (/^(main|lib)\.rs$/.test(base)) return 'entry';
    if (/^(Application\.java|Program\.cs)$/.test(base)) return 'entry';
    if (/^config\.ru$/.test(base)) return 'entry';
    if (/^(Cargo\.toml|go\.mod|Gemfile|pom\.xml|build\.gradle|composer\.json)$/.test(base)) return 'config';
    if (/^Dockerfile$|^docker-compose\..*/.test(base)) return 'infrastructure';
    if (/\.(tf|tfvars)$/.test(base)) return 'infrastructure';
    if (/^\.github\/workflows\//.test(fp) || /^\.gitlab-ci\.yml$/.test(fp) || /^Jenkinsfile$/.test(base)) return 'ci-cd';
    if (/\.sql$/.test(base)) return 'data';
    if (/\.(graphql|gql|proto)$/.test(base)) return 'types';
    if (/\.(md|rst)$/.test(base)) return 'documentation';
    if (/^Makefile$/.test(base)) return 'infrastructure';
    return null;
  }
  const patternMatches = {};
  for (const g of Object.keys(directoryGroups)) {
    let m = matchDirName(g);
    if (!m) {
      // fall back: most common second-level segment or file-level label within group
      const ids = directoryGroups[g];
      const subCounts = {};
      const fileLabelCounts = {};
      for (const id of ids) {
        const n = idToNode.get(id);
        const fp = (n && n.filePath) || '';
        const segs = fp.split('/');
        if (segs.length > 2) {
          const sub = segs[prefixLen + 1] || '';
          if (sub) subCounts[sub.toLowerCase()] = (subCounts[sub.toLowerCase()] || 0) + 1;
        }
        const fl = matchFileLevel(n || {});
        if (fl) fileLabelCounts[fl] = (fileLabelCounts[fl] || 0) + 1;
      }
      // try sub-directory names
      const topSub = Object.entries(subCounts).sort((a, b) => b[1] - a[1])[0];
      if (topSub) {
        const sm = matchDirName(topSub[0]);
        if (sm) m = sm;
      }
      if (!m) {
        const topFile = Object.entries(fileLabelCounts).sort((a, b) => b[1] - a[1])[0];
        if (topFile && topFile[1] >= Math.ceil(ids.length / 2)) m = topFile[0];
      }
    }
    if (m) patternMatches[g] = m;
  }

  // ---- H. Deployment topology detection ----
  const allPaths = fileNodes.map((n) => n.filePath || '');
  const hasDockerfile = allPaths.some((p) => /(^|\/)Dockerfile(\.|$)/.test(p));
  const hasCompose = allPaths.some((p) => /docker-compose.*\.ya?ml/i.test(p));
  const hasK8s = allPaths.some((p) => /(^|\/)(k8s|kubernetes|helm|charts?)\//i.test(p) || /k8s.*\.ya?ml$/i.test(p));
  const hasTerraform = allPaths.some((p) => /\.(tf|tfvars)$/.test(p));
  const hasCI = allPaths.some((p) => /^\.github\/workflows\//.test(p) || /(^\/|\/)\.gitlab-ci\.yml$/.test(p) || /(^|\/)Jenkinsfile$/.test(p) || /(^|\/)\.circleci\//.test(p));
  const infraFiles = allPaths.filter((p) =>
    /(^|\/)Dockerfile(\.|$)/.test(p) ||
    /docker-compose.*\.ya?ml/i.test(p) ||
    /(^|\/)(k8s|kubernetes|helm|charts?)\//i.test(p) ||
    /\.(tf|tfvars)$/.test(p) ||
    /^\.github\/workflows\//.test(p) ||
    /(^|\/)\.gitlab-ci\.yml$/.test(p) ||
    /(^|\/)Jenkinsfile$/.test(p) ||
    /(^|\/)Makefile$/.test(p)
  );
  const deploymentTopology = { hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI, infraFiles };

  // ---- I. Data pipeline detection ----
  const schemaFiles = [];
  const migrationFiles = [];
  const dataModelFiles = [];
  const apiHandlerFiles = [];
  for (const n of fileNodes) {
    const fp = n.filePath || '';
    const tags = n.tags || [];
    const summary = (n.summary || '').toLowerCase();
    if (/\.prisma$|\.graphql$|\.gql$|\.proto$|^schema\.sql$|dbdiagram|schema\.dbml$/i.test(fp)) schemaFiles.push(fp);
    if (/migrations?\//i.test(fp) && /\.sql$/i.test(fp)) migrationFiles.push(fp);
    if (/models?\//i.test(fp) || /entit(y|ies)\//i.test(fp) || tags.includes('entity') || tags.includes('model') || /prisma\.service/i.test(fp)) {
      if (!/migrations?\//i.test(fp)) dataModelFiles.push(fp);
    }
    if (/controllers?\//i.test(fp) || /routes?\//i.test(fp) || /app\/api\//i.test(fp) || tags.includes('api-handler') || tags.includes('controller') || /route\.ts$/i.test(fp)) {
      if (/\.(ts|tsx|js|jsx|py|go|java|rb|php|cs)$/.test(fp)) apiHandlerFiles.push(fp);
    }
    void summary;
  }
  const dataPipeline = { schemaFiles, migrationFiles, dataModelFiles, apiHandlerFiles };

  // ---- J. Documentation coverage ----
  const docGroups = new Set();
  for (const n of fileNodes) {
    const fp = n.filePath || '';
    if (/\.(md|rst)$/i.test(fp)) {
      const g = nodeToGroup[n.id];
      if (g) docGroups.add(g);
    }
  }
  // docs/*.md referencing code groups: documents edges from document nodes
  const totalGroups = Object.keys(directoryGroups).length;
  const groupsWithDocs = docGroups.size;
  const undocumentedGroups = Object.keys(directoryGroups).filter((g) => !docGroups.has(g));
  const docCoverage = {
    groupsWithDocs,
    totalGroups,
    coverageRatio: totalGroups === 0 ? 0 : Math.round((groupsWithDocs / totalGroups) * 100) / 100,
    undocumentedGroups,
  };

  // ---- K. Dependency direction ----
  const groupPairs = {};
  for (const [k, c] of Object.entries(pairCounts)) {
    const [from, to] = k.split('|');
    if (from === to) continue;
    groupPairs[from + '|' + to] = c;
  }
  const dependencyDirection = [];
  const seen = new Set();
  for (const [k] of Object.entries(groupPairs)) {
    const [a, b] = k.split('|');
    const pairKey = [a, b].sort().join('|');
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);
    const ab = groupPairs[a + '|' + b] || 0;
    const ba = groupPairs[b + '|' + a] || 0;
    if (ab === 0 && ba === 0) continue;
    if (ab >= ba) dependencyDirection.push({ dependent: a, dependsOn: b });
    else dependencyDirection.push({ dependent: b, dependsOn: a });
  }
  dependencyDirection.sort((x, y) =>
    x.dependent.localeCompare(y.dependent) || x.dependsOn.localeCompare(y.dependsOn)
  );

  // ---- fileStats ----
  const filesPerGroup = {};
  for (const [g, ids] of Object.entries(directoryGroups)) filesPerGroup[g] = ids.length;
  const nodeTypeCounts = {};
  for (const [t, ids] of Object.entries(nodeTypeGroups)) nodeTypeCounts[t] = ids.length;

  const output = {
    scriptCompleted: true,
    commonPrefix: prefix.join('/'),
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    groupImportsFrom: Object.fromEntries(Object.entries(groupImportsFrom).map(([k, v]) => [k, [...v]])),
    groupImportedBy: Object.fromEntries(Object.entries(groupImportedBy).map(([k, v]) => [k, [...v]])),
    fileStats: {
      totalFileNodes: fileNodes.length,
      filesPerGroup,
      nodeTypeCounts,
    },
    fileFanIn,
    fileFanOut,
  };

  try {
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 1), 'utf8');
  } catch (e) {
    console.error('Failed to write output: ' + e.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
