# MIGRATION — Frontend & Backend Separation (Phase 10)

> What moved, what changed, breaking changes, and risks for the restructure from a single
> NestJS repo at the root to an npm workspace monorepo (`apps/backend` + `apps/frontend`).

## 1. Summary

The project was reorganized from one NestJS application at the repository root into two
independently installable, independently runnable applications under `apps/`, orchestrated from
the root via npm workspaces. No business logic, routes, or API behavior was changed.

## 2. Directory layout (after)

```
project-root/
├── apps/
│   ├── backend/              # NestJS 11 API (was repo root: src/, test/, prisma/, configs)
│   │   ├── src/
│   │   ├── test/
│   │   ├── prisma/           # schema.prisma + migrations/
│   │   ├── generated/prisma/ # Prisma client (git-ignored)
│   │   ├── postman/          # collection + environment
│   │   ├── package.json
│   │   ├── .env.example      # placeholders only
│   │   ├── .env              # local only, git-ignored
│   │   ├── nest-cli.json, tsconfig*.json, eslint.config.mjs, .prettierrc
│   │   └── README.md
│   │
│   └── frontend/             # Next.js 16 storefront (was /frontend)
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── .env.example      # placeholders only
│       ├── .env.local        # local only, git-ignored
│       ├── next.config.ts    # Turbopack root retargeted
│       ├── tsconfig.json, eslint.config.mjs, postcss.config.mjs
│       └── README.md
│
├── docs/                     # ARCHITECTURE.md, API.md, MIGRATION.md, TASKS.md
├── .editorconfig             # new
├── .gitignore                # updated for per-app paths
├── package.json              # npm workspaces + root orchestration scripts
└── README.md                 # rewritten as monorepo root readme
```

## 3. What moved

**Into `apps/backend/`:**
- `src/**` — all NestJS modules (auth, users, products, cart, orders, prisma, logger) + `main.ts`, `app.module.ts`
- `test/**` — unit, e2e, integration, security suites + factories, fixtures, helpers
- `prisma/**` — `schema.prisma` + `migrations/`
- `prisma.config.ts`, `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.mjs`, `.prettierrc`

**Into `apps/frontend/`:**
- Entire previous `frontend/` tree (Next.js App Router app)

## 4. What was created

- Root `package.json` — `"workspaces": ["apps/*"]` + orchestration scripts (`dev`, `build`, `lint`, `test`, `prisma:*`)
- `apps/backend/package.json`, `apps/backend/.env.example`, `apps/backend/README.md`
- `apps/frontend/.env.example`, `apps/frontend/README.md`
- Root `.editorconfig`

## 5. What was modified

| File | Change |
|------|--------|
| Root `package.json` | Added npm workspaces + root scripts; added `allowScripts` for bcrypt/esbuild/prisma engines |
| Root `.gitignore` | Per-app `node_modules`, `dist`, `.next`, `coverage`, `generated`, `.env*` exclusions; `.env.example` tracked |
| `apps/frontend/next.config.ts` | Turbopack `root` retargeted to the monorepo root |
| `apps/frontend/src/lib/api.ts` | API base URL default fixed to backend port `3002` |
| Backend sources | Prisma client import paths adjusted for the new `generated/prisma/` location |
| Root `README.md` | Rewritten as monorepo root readme |

## 6. Breaking changes

- **File paths moved.** Any external tooling or CI referencing `src/`, `test/`, `prisma/`, or `frontend/` at the repo root must be retargeted to `apps/backend/...` or `apps/frontend/...`.
- **Install location.** `npm install` must run at the repository root (workspaces). Per-app `npm install` still works from inside `apps/backend` or `apps/frontend`.
- **Environment files.** `.env` now lives at `apps/backend/.env`; `.env.local` at `apps/frontend/.env.local`. Examples are committed (placeholders only); real env files are git-ignored.
- **API prefix.** `/api/v1` global prefix is active in `apps/backend/src/main.ts:19` (`app.setGlobalPrefix('api/v1')`). All endpoints are at `/api/v1/*`.

## 7. Non-breaking (intentionally unchanged)

- All route paths, controllers, services, DTOs, guards, middleware, and envelopes unchanged.
- Auth: same two mechanisms (custom `AuthGuard` for products/cart/orders; passport `JwtAuthGuard` for users).
- Ports: backend `3002` default; frontend `3000` default.
- Database: same PostgreSQL/Neon + Prisma v7 schema and migrations.
- No shared `packages/` workspace introduced.

## 8. Risks and mitigation

| Risk | Status | Mitigation |
|------|--------|------------|
| Broken relative imports after move (Prisma client path) | Resolved | All `generated/prisma/client` imports fixed; `nest build` passes |
| Jest/tsconfig/eslint paths assuming old root | Resolved | Configs moved with sources; `npm test` + `npm run lint` pass |
| Turbopack `root` pointing at old parent | Resolved | Retargeted in `apps/frontend/next.config.ts`; `next build` passes |
| Env drift (three different ports previously) | Resolved | Standardized: backend `3002`, frontend env documents `NEXT_PUBLIC_API_URL` |
| Secrets copied into examples/images | Avoided | `.env.example` placeholders only; real `.env` never copied or committed |
| Lockfile/workspace hoisting conflicts | Resolved | Single root lockfile; `npm install` verified clean |
| Exposed Neon password / JWT secret in prior `.env` | Outstanding | Reported to owner; rotation is out of scope (user action) |

## 9. Verification (Phase 9 results)

- `npm install` at root: OK (1055 packages)
- Backend lint: clean; `nest build`: OK
- Backend tests: 165 unit + 58 e2e + 25 integration pass
- Frontend `next build`: OK (all SSG routes)
- `prisma validate`: OK; migrations intact (4 migrations + lock); `prisma generate` emits to `apps/backend/generated/prisma`
