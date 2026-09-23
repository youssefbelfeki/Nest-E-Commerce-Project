import json

INP = r'C:\Users\Youssef\Desktop\ecommerce-project\.ua\tmp\ua-arch-input.json'
OUT = r'C:\Users\Youssef\Desktop\ecommerce-project\.ua\intermediate\layers.json'

inp = json.load(open(INP, encoding='utf-8'))
nodes = inp['fileNodes']
by_id = {n['id']: n for n in nodes}


def fp(n):
    return n.get('filePath') or n.get('name') or n['id']


layers = {}


def layer(lid, name, desc):
    layers[lid] = {'id': lid, 'name': name, 'description': desc, 'nodeIds': []}


def put(lid, nid):
    layers[lid]['nodeIds'].append(nid)


layer('layer:storefront', 'Storefront UI Layer',
      'Next.js 16 localized storefront: App Router pages, components, auth/i18n contexts, API client, shared types, locale dictionaries, routing proxy, and global styles')
layer('layer:api', 'Backend API Layer',
      'NestJS REST controllers for auth, users, products, cart, and orders plus the validated DTO contracts that shape their request and response payloads')
layer('layer:service', 'Service and Composition Layer',
      'Prisma-backed business-logic services, NestJS feature modules, the AppModule composition root, and the main.ts application bootstrap')
layer('layer:security', 'Security and Middleware Layer',
      'Cross-cutting request pipeline: JWT strategies and guards, role-based authorization, parameter decorators, request logging middleware, and the success-envelope interceptor')
layer('layer:data', 'Data Layer',
      'PostgreSQL persistence: canonical Prisma schema, migration-defined User/Product/Order/Cart tables, migration lockfile, Prisma client module, and the user entity placeholder')
layer('layer:test', 'Test Layer',
      'Jest unit specs, integration, end-to-end, security, and edge-case suites with factories, fixtures, and app-bootstrapping helpers')
layer('layer:config', 'Configuration Layer',
      'Build, lint, type-check, and test-runner configs for the NestJS backend and Next.js storefront, plus Postman API collections and environments')
layer('layer:documentation', 'Documentation Layer',
      'Project guides and contracts: setup readmes, agent operating guides, backend API rules, and the knowledge-graph report')
layer('layer:tooling', 'Analysis Tooling Artifacts Layer',
      'Generated pipeline snapshots, import-map and scan inventories, graphify caches, and the interactive knowledge-graph visualization')

CONFIG_FILES = {'eslint.config.mjs', 'frontend/eslint.config.mjs',
                'frontend/next.config.ts', 'frontend/postcss.config.mjs',
                'prisma.config.ts'}
DATA_FILES = {'prisma/migrations/migration_lock.toml',
              'src/users/entities/user.entity.ts',
              'src/prisma/prisma.service.ts',
              'src/prisma/prisma.module.ts'}

for n in nodes:
    nid, typ, p = n['id'], n['type'], fp(n)
    base = p.split('/')[-1]
    is_spec = (base.endswith('.spec.ts') or '.e2e-spec.ts' in base
               or '.integration-spec.ts' in base or '.security-spec.ts' in base)
    if typ == 'document':
        put('layer:documentation', nid)
    elif p.startswith('.ua/') or p.startswith('graphify-out/'):
        put('layer:tooling', nid)
    elif typ in ('table', 'schema') or p in DATA_FILES:
        put('layer:data', nid)
    elif is_spec or (p.startswith('test/') and typ != 'config'):
        put('layer:test', nid)
    elif typ == 'config' or p in CONFIG_FILES:
        put('layer:config', nid)
    elif p.startswith('frontend/'):
        put('layer:storefront', nid)
    elif 'controller' in base or '/dto/' in p:
        put('layer:api', nid)
    elif any(k in base for k in ('guard', 'strategy', 'decorator', 'middleware', 'interceptor')):
        put('layer:security', nid)
    else:
        put('layer:service', nid)

allids = [i for L in layers.values() for i in L['nodeIds']]
assert len(allids) == len(nodes) == 151, (len(allids), len(nodes))
assert len(set(allids)) == 151, 'duplicate assignment'
assert set(allids) == set(by_id), 'mismatch: ' + str(set(by_id) ^ set(allids))
for lid, L in layers.items():
    assert len(L['nodeIds']) >= 1, lid
assert 3 <= len(layers) <= 10
for lid, L in layers.items():
    print(lid + ' | ' + L['name'] + ' | ' + str(len(L['nodeIds'])))
out = list(layers.values())
json.dump(out, open(OUT, 'w', encoding='utf-8'), indent=2)
print('wrote layers.json')
