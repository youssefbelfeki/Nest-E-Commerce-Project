# ARCHITECTURE — Target Design (Phase 2)

> Status: **finalized**. This document defines the target layout, decisions, and boundaries for the
> frontend/backend separation. Implementation follows in Phase 3+; this design is the contract.

---

## 1. Current architecture (baseline)

| Layer | Technology | Location today |
|---|---|---|
| Backend | NestJS 11, Express platform, TypeScript (ES2023, `nodenext`) | repo root (`src/`, `test/`, `prisma/`) |
| Database | PostgreSQL (Neon), Prisma ORM v7, `@prisma/adapter-pg` + `pg` pool | `prisma/`, client to `generated/prisma/` |
| Auth | JWT (`@nestjs/jwt` + passport-jwt), bcrypt, roles `USER`/`ADMIN` | `src/auth/`, `src/users/auth/` |
| Frontend | Next.js 16.3 (App Router, Turbopack), React 19.2, Tailwind v4, Zod | `frontend/` (own `package.json`) |
| i18n | EN/FR, locale-scoped routes (`[lang]`), cookie + Accept-Language | `frontend/src/proxy.ts`, `lib/i18n.ts` |
| Package manager | npm (both lockfiles are `package-lock.json`) | root + `frontend/` |

The two apps already have **separate dependency manifests** and are independently installable.
The separation work is therefore a **relocation + orchestration** job, not a rewrite.

## 2. Problems discovered (motivating the move)

1. Backend config (`nest-cli.json`, `tsconfig*`, eslint, prettier) and frontend config sit at
   different levels, making the root ambiguous ("is this a Nest app or a monorepo?").
2. Frontend Turbopack `root` points at the repo root (`../`), coupling the Next build to the
   monorepo layout.
3. No root-level orchestration: starting both apps is two terminals with manual `cd`.
4. Port/env drift: backend defaults `3002`, frontend code fallback `http://localhost:3000`,
   `.env.local` currently says `:3001` — three different numbers.
5. `AGENTS.md` documents a `/api/v1` prefix that `main.ts` never sets (doc/code mismatch).
6. Secrets (Neon password, JWT secret) exist in a working-tree `.env` — must be rotated by the
   owner; the separation must never copy them into images/examples.

## 3. Proposed (target) architecture

```text
project-root/
├── apps/
│   ├── frontend/                 # moved from /frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json          # next, react, zod, tailwind (unchanged deps)
│   │   ├── next.config.ts        # Turbopack root retargeted
│   │   ├── tsconfig.json
│   │   ├── eslint.config.mjs
│   │   ├── .env.example          # NEW
│   │   ├── .env.local            # stays git-ignored, local only
│   │   └── README.md
│   │
│   └── backend/                  # moved from /src, /test, /prisma, root configs
│       ├── src/                  # NestJS modules: auth, users, products, cart,
│       │                         #   orders, prisma, logger + main.ts/app.module.ts
│       ├── test/                 # e2e, integration, security, factories, helpers
│       ├── prisma/               # schema.prisma + migrations/
│       ├── generated/prisma/     # prisma client output (git-ignored)
│       ├── prisma.config.ts
│       ├── package.json          # nest, prisma, passport, bcrypt (unchanged deps)
│       ├── nest-cli.json
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── eslint.config.mjs
│       ├── .prettierrc
│       ├── .env.example          # NEW
│       ├── .env                  # stays git-ignored, local only
│       └── README.md             # NEW
│
├── docs/
│   ├── ARCHITECTURE_AUDIT.md     # Phase 1 output
│   ├── ARCHITECTURE.md           # this file
│   ├── API.md                    # Phase 4
│   ├── MIGRATION.md              # Phase 10
│   └── TASKS.md                  # tracked task list
│
├── .gitignore                    # updated for per-app paths
├── .editorconfig                 # NEW (consistent editor defaults)
├── README.md                     # rewritten as monorepo root readme
└── package.json                  # npm workspaces orchestration
```

### Architecture rules (enforced going forward)

- `apps/frontend` and `apps/backend` each own their dependencies, configs, env files, and scripts.
- Frontend never imports backend implementation files; it talks HTTP only, via `src/lib/api.ts`.
- Backend never depends on frontend code or browser APIs.
- Backend owns: database access, migrations, business rules, authorization, server-side validation.
- No shared `packages/` today (see decision D2).

## 4. Decisions and rationale

| ID | Decision | Rationale |
|---|---|---|
| D1 | **npm workspaces** at root (`"workspaces": ["apps/*"]`); keep npm, don't introduce pnpm/yarn | Project already uses npm with two lockfiles; workspaces give root orchestration scripts (`dev`, `build`, `lint`) and hoisting without new tooling. Lockfiles consolidate to one root lockfile. |
| D2 | **No `packages/shared`** | The only "shared" concepts are API response types (~56 lines) and Zod schemas that deliberately mirror backend DTOs as defense-in-depth. A shared package would add build/versioning complexity for ~150 lines. Frontend types stay hand-written against the documented contract (`docs/API.md`). Revisit only if a third consumer appears. |
| D3 | **Keep backend feature-module layout** (`auth/`, `products/`, ...) instead of forcing `modules/common/config` | The existing layout is consistent NestJS convention with colocated specs. Reorganizing folders adds churn and breakage risk with zero functional gain. The reference `modules/common/config` tree is adapted, not copied. |
| D4 | **API stays without a global prefix** (`/auth/*`, `/products/*`, ...) | Current behavior; adding `/api/v1` is a breaking change for the frontend, Postman collection, and tests. Preserving behavior is a hard requirement. Decision documented; can be introduced later as a coordinated change. |
| D5 | **Ports**: backend `3002` (existing default), frontend `3000` (Next default); frontend env points to `http://localhost:3002` | Matches existing backend default and README. Fixes the current `:3000`/`:3001` drift. |
| D6 | **Auth mechanism unchanged** (custom `AuthGuard` in `users/auth` + passport `JwtAuthGuard` in `auth/guards`) | Consolidating the two guards is a behavior-touching refactor outside the separation scope. Logged as future work (Phase 10 report). |
| D7 | **Prisma stays 100% inside `apps/backend`** (schema, migrations, `prisma.config.ts`, generated client) | Database access is backend-only by rule; migrations must not be importable by the frontend. |
| D8 | **No Docker in this pass** (assessed in Phase 8) | Current deploy model is plain Node + hosted Neon; Docker would add complexity without a demonstrated need. Reassess only if the user requests containerized deploys. |
| D9 | **No `git mv` / history-preserving moves** — plain file moves | Explicitly excluded per user instruction. Git will show deletes + adds; this is accepted. |
| D10 | **Env examples committed, real envs never** | `.env.example` files carry placeholders only. Existing `.env` / `.env.local` values are preserved in place (not overwritten, not copied). Owner must rotate the exposed Neon password and JWT secret out-of-band. |

## 5. Communication contract (summary; full detail in `docs/API.md`)

- All frontend HTTP goes through `apps/frontend/src/lib/api.ts` (`apiFetch`):
  `NEXT_PUBLIC_API_URL` base + `Authorization: Bearer` + `credentials: 'include'`,
  unwraps `{ status: 'success', data, timestamp }`, normalizes error messages.
- Success envelope and NestJS error shape (`{ statusCode, message, error }`) are unchanged.
- Auth: login returns `{ accessToken }`; JWT payload `{ sub, email, role, exp }`;
  frontend persists to `localStorage['accessToken']` (+ cookie fallback), decodes client-side.

## 6. Migration plan (overview; execution = Phase 3+)

1. **Workspace scaffold** — root `package.json` with workspaces, root scripts, `.editorconfig`,
   updated `.gitignore`.
2. **Backend move** — relocate `src/`, `test/`, `prisma/`, `prisma.config.ts`, `nest-cli.json`,
   `tsconfig*.json`, `eslint.config.mjs`, `.prettierrc` into `apps/backend/`; create its
   `package.json`, `.env.example`, `README.md`; fix relative imports (Prisma client path,
   tsconfig paths, jest coverage dir).
3. **Frontend move** — relocate `frontend/` to `apps/frontend/`; retarget Turbopack root;
   fix API base URL default; add `.env.example`.
4. **Verify install/build/test per app independently** (Phase 9 gate before docs).
5. **Docs** — rewrite root `README.md`, write `docs/API.md`, `docs/MIGRATION.md`,
   final report.

## 7. Risks and mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Broken relative imports after move (Prisma client, `../generated/prisma/client`) | Backend won't compile | Grep all `generated/prisma` imports; fix paths; run `nest build` + jest |
| Jest / tsconfig / eslint paths assume old root | Tests or lint fail | Move configs with sources; run `npm test` + `npm run lint` in `apps/backend` |
| Turbopack `root` still points at old parent | Frontend build breaks | Set root to `apps/frontend` (or its new parent); run `next build` |
| Env drift (three different ports today) | Frontend can't reach API | Standardize: backend `3002`, frontend env example documents it; fix default fallback |
| Secrets copied into examples/images | Credential leak | `.env.example` placeholders only; never copy `.env` |
| Lockfile/workspace hoisting conflicts | Install failures | Single root lockfile; remove per-app lockfiles after workspace setup; verify `npm install` clean |
| Test suites referencing `../src` paths | e2e/integration break | Move `test/` with `src/` keeping relative depth identical |

## 8. File inventory (move / modify / create)

**Moved (into `apps/backend/`):** `src/**`, `test/**`, `prisma/**`, `generated/**` (ignored),
`prisma.config.ts`, `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.mjs`,
`.prettierrc`.

**Moved (into `apps/frontend/`):** entire current `frontend/` tree.

**Modified:** root `package.json` (workspaces + orchestration scripts), root `.gitignore`,
`apps/frontend/next.config.ts` (Turbopack root), `apps/frontend/src/lib/api.ts` (base URL default),
Prisma client import paths in backend sources, root `README.md`.

**Created:** `apps/backend/package.json`, `apps/backend/.env.example`, `apps/backend/README.md`,
`apps/frontend/.env.example`, `apps/frontend/README.md`, root `.editorconfig`,
`docs/ARCHITECTURE.md` (this file).
