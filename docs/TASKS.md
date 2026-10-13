# TASKS — Frontend & Backend Separation

> Detected from the last prompt: **"SENIOR SOFTWARE ARCHITECT — FRONTEND & BACKEND SEPARATION"**.
> Full task list across Phases 1–10. Status: `[x]` done, `[~]` in progress, `[ ]` pending.

---

## Phase 1 — Audit the existing project

- [x] Inspect the complete project structure (root = NestJS, `frontend/` = Next.js)
- [x] Identify stack: NestJS 11, Prisma 7 (PostgreSQL/Neon), JWT auth (passport-jwt + custom guard), bcrypt, npm (root + frontend lockfiles)
- [x] Identify routes, controllers, services, DTOs, guards, middleware
- [x] Identify env vars and config files (`.env` — DATABASE_URL, JWT_SECRET, PORT; `frontend/.env.local` — NEXT_PUBLIC_API_URL)
- [x] Detect shared code / cross-dependencies (frontend Turbopack `root` points at repo root)
- [x] Detect duplicated logic, circular deps, security issues, architectural problems
- [x] Inspect tests, build scripts, linting, formatting, CI/CD (no `.github/workflows` present)
- [x] Identify features that must keep working (auth, products CRUD, cart, orders, users admin, i18n EN/FR)
- [x] Write `docs/ARCHITECTURE_AUDIT.md`

**Key audit findings (summary):**
- Backend serves **no `/api/v1` prefix** despite `AGENTS.md` claiming one; README documents the mismatch.
- Backend port default `3002`, but frontend `api.ts` fallback is `http://localhost:3000` → misconfigured unless `.env.local` sets `NEXT_PUBLIC_API_URL` (it currently sets `:3001`, also wrong).
- `.env` contains **committed-format real secrets** (Neon DB password, JWT secret) — must rotate; git-ignored but previously exposed in working tree.
- Two overlapping auth mechanisms: `src/users/auth/auth.guard.ts` (custom JWT guard) used by products/cart/orders, and `src/auth/guards/jwt-auth.guard.ts` (passport) used by users controller.
- Frontend validates forms with Zod schemas that mirror backend DTOs (defense-in-depth, acceptable duplication).
- JWT stored in `localStorage` + JS-readable cookie (not httpOnly) — XSS-exposed; note as accepted risk or improve later.

## Phase 2 — Design the target architecture ✅

- [x] Finalize `apps/frontend` + `apps/backend` layout (npm workspaces at root) — see `docs/ARCHITECTURE.md`
- [x] Decide: no shared `packages/` (D2: ~150 lines of shared types not worth a package)
- [ ] Preserve Git history (`git mv` for moves) — **cancelled per user instruction (D9): plain moves accepted**
- [x] Write `docs/ARCHITECTURE.md` (decisions D1–D10, risks, file inventory)

## Phase 3 — Separate the applications

**Backend → `apps/backend/`**
- [x] `git mv` `src/` → `apps/backend/src/`
- [x] `git mv` `test/` → `apps/backend/test/`
- [x] `git mv` `prisma/` → `apps/backend/prisma/`
- [x] `git mv` `prisma.config.ts` → `apps/backend/prisma.config.ts`
- [x] `git mv` `generated/` → `apps/backend/generated/` (regenerate; git-ignored)
- [x] Move `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.mjs`, `.prettierrc`
- [x] Create `apps/backend/package.json` (backend deps + scripts from root)
- [x] Create `apps/backend/.env.example`
- [x] Create `apps/backend/README.md`
- [x] Fix Prisma client import paths (`../../generated/prisma/client` → `../generated/prisma/client` etc.)
- [x] Verify dotenv load path still works from new location

**Frontend → `apps/frontend/`**
- [x] `git mv` `frontend/` → `apps/frontend/`
- [x] Fix `next.config.ts` Turbopack `root` (now points at old monorepo root — retarget)
- [x] Create `apps/frontend/.env.example`
- [x] Create/refresh `apps/frontend/README.md`
- [x] Fix API base URL default to backend port (`3002` or actual dev port)

**Root orchestration**
- [x] Create root `package.json` with npm workspaces (`apps/*`)
- [x] Root scripts: `dev` (concurrently), `dev:frontend`, `dev:backend`, `build`, `lint`, `test`
- [x] Root `.gitignore` update for new paths (dist, node_modules, generated, coverage per app)

## Phase 4 — API contract and integration

- [ ] Confirm current endpoints (no global prefix — `/auth/*`, `/products/*`, `/cart/*`, `/orders/*`, `/users/*`)
- [ ] Decide: keep no-prefix **or** introduce `/api/v1` (breaking change — needs user confirmation)
- [ ] Document contract in `docs/API.md` (endpoints, envelope `{ status, data, timestamp }`, error shape, auth header)
- [ ] Keep frontend `apiFetch` envelope unwrapping working
- [ ] Verify auth/login/logout/token flows after the move

## Phase 5 — Environment and configuration

- [ ] `apps/backend/.env.example` (DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN — placeholders only)
- [ ] `apps/frontend/.env.example` (NEXT_PUBLIC_API_URL)
- [ ] Add startup validation for required backend env vars (fail fast if missing DATABASE_URL/JWT_SECRET)
- [ ] Update root `.gitignore` (per-app `.env*` exclusions, keep examples tracked)
- [ ] Preserve existing `.env` values locally (do not overwrite; user must rotate secrets separately)

## Phase 6 — Development workflow

- [ ] Document per-app commands: install, dev, build, lint, test, migrate
- [ ] Root orchestration: `npm run dev` starts both apps
- [ ] Backend: `npx prisma migrate` / `prisma generate` run from `apps/backend`
- [ ] Ensure lockfiles stay npm-only (do not mix pnpm/yarn)

## Phase 7 — Security and quality

- [ ] Flag/rotate exposed secrets (Neon password, JWT secret) — report to user
- [ ] Verify CORS config (`CORS_ORIGIN`, `credentials: true`)
- [ ] Verify server-side validation (ValidationPipe whitelist/transform) intact
- [ ] Verify auth guards still applied on protected routes
- [ ] Run full test suite (unit, e2e, integration, security) post-move
- [ ] Run lint + format both apps
- [ ] No secrets in frontend bundles (only NEXT_PUBLIC_*)

## Phase 8 — Docker and deployment

- [ ] Assess whether Docker adds value (current setup: plain Node + hosted Neon — likely optional)
- [ ] If pursued: `apps/backend/Dockerfile`, `apps/frontend/Dockerfile`, root `compose.yaml`
- [ ] Non-root users, health checks, no `.env` baked into images, DB not public
- [ ] Otherwise: document independent deploy steps (build + run per app)

## Phase 9 — Validation

- [ ] `npm install` at root (workspaces) and per app
- [ ] Backend: lint, typecheck/build, unit tests, e2e/integration if runnable
- [ ] Frontend: lint, production build
- [ ] Start both apps independently; confirm frontend → backend API calls succeed
- [ ] Smoke-test: register, login, product list, add to cart, place order, orders history, admin product CRUD
- [ ] Verify migrations intact and Prisma client generates from new path
- [ ] Compare final behavior against Phase 1 audit feature list

## Phase 10 — Documentation and final report

- [ ] Update root `README.md` (structure, install, env, run, test, deploy)
- [ ] Write `docs/ARCHITECTURE.md`
- [ ] Write `docs/API.md`
- [ ] Write `docs/MIGRATION.md` (what moved, breaking changes, risks)
- [ ] Final report: files moved/created/modified, commands run + results, tests passed/failed, remaining debt

---

## Out of scope / deferred (explicitly not doing without approval)

- Rewriting the app from scratch
- Changing business logic
- Rotating production secrets (user action required)
- Introducing `/api/v1` prefix (breaking; awaiting decision)
- Shared `packages/` workspace (not justified today)
