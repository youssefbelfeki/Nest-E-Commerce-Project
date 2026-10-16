# E-Commerce Platform — NestJS API + Next.js Storefront (ApexStore)

Full-stack e-commerce monorepo with a **NestJS v11 REST API** (PostgreSQL + Prisma v7) and a
**Next.js 16 storefront** (App Router, React 19, Tailwind CSS v4, EN/FR i18n). Two independently
installable applications under `apps/`, orchestrated from the root via npm workspaces.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Database & Prisma Workflow](#database--prisma-workflow)
- [Running the Apps](#running-the-apps)
- [API Reference](#api-reference)
- [Auth & Authorization](#auth--authorization)
- [Data Models](#data-models)
- [Validation, Responses & Errors](#validation-responses--errors)
- [Scripts Reference](#scripts-reference)
- [Testing](#testing)
- [Linting & Formatting](#linting--formatting)
- [Postman Collection](#postman-collection)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)

## Features

Backend (`apps/backend/`):

- JWT auth: register / login, bcrypt password hashing, `USER` / `ADMIN` roles.
- Products CRUD: public-authenticated reads, admin-only writes.
- Per-user cart with stock validation (`Cart` 1:1 `User`, `CartItem @@unique([cartId, productId])`).
- Orders with **atomic stock decrement in a Prisma transaction**; user-scoped history ordered `createdAt DESC`.
- Admin-only users CRUD.
- Global `ValidationPipe({ whitelist: true, transform: true })`, global `TransformInterceptor` success envelope, global request logger.

Frontend (`apps/frontend/`):

- ApexStore storefront: locale-scoped routes for home, products, cart, orders, login, register, admin products.
- EN/FR i18n (`/en/...`, `/fr/...`, default `fr`), `NEXT_LOCALE` cookie + `Accept-Language` fallback.
- JWT persisted to `localStorage['accessToken']` (+ cookie fallback), sent as `Authorization: Bearer <token>` with `credentials: 'include'`.
- Unwraps the backend `{ status: 'success', data }` envelope centrally in `apiFetch`.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11, TypeScript (target ES2023, `nodenext`), Express platform |
| Auth | `@nestjs/jwt`, `passport` + `passport-jwt`, `bcrypt` |
| Validation | `class-validator`, `class-transformer` |
| Database | PostgreSQL, Prisma ORM v7 (`@prisma/client`, `@prisma/adapter-pg` via `pg` pool) |
| Frontend | Next.js 16.3.0 (App Router + Turbopack), React 19.2.8, TypeScript strict |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` |
| Testing (backend) | Jest 30 + ts-jest, Supertest, colocated `*.spec.ts`, `test/e2e`, `test/integration`, `test/security` |
| Tooling | ESLint 9 flat config, Prettier, nest-cli 11 |

## Repository Layout

```
project-root/
├── apps/
│   ├── backend/              # NestJS 11 API
│   │   ├── src/              # modules: auth, users, products, cart, orders, prisma, logger
│   │   ├── test/             # unit, e2e, integration, security suites
│   │   ├── prisma/           # schema.prisma + migrations/
│   │   ├── generated/prisma/ # Prisma client (git-ignored)
│   │   ├── postman/          # collection + environment
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── frontend/             # Next.js 16 storefront
│       ├── src/
│       │   ├── app/[lang]/   # locale-scoped pages
│       │   ├── components/
│       │   ├── context/      # AuthContext + I18nProvider
│       │   ├── lib/          # api.ts, i18n.ts
│       │   └── proxy.ts      # i18n locale routing
│       ├── package.json
│       ├── next.config.ts
│       └── README.md
│
├── docs/                     # ARCHITECTURE.md, API.md, MIGRATION.md, TASKS.md, FINAL_REPORT.md
├── .editorconfig
├── .gitignore
├── package.json              # npm workspaces + root orchestration scripts
└── README.md                 # this file
```

Module layout convention: `controller.ts`, `service.ts`, `module.ts`, `dto/`, colocated `*.spec.ts`.
Exception: `apps/backend/src/orders/` has only `orders.service.spec.ts` (no controller/DTO spec).

## Prerequisites

- Node.js 20+ (Node 22 LTS recommended for Nest 11 / Next 16).
- npm 10+.
- PostgreSQL 14+ running locally or a hosted connection string.
- Git.

Check versions:

```bash
node --version
npm --version
psql --version
```

## Environment Variables

Backend loads via `import 'dotenv/config'` **first** in `apps/backend/src/main.ts` (required before any config is read).
`.env` is git-ignored — create it from the keys below. Do not commit secrets.

`apps/backend/.env`:

| Variable | Required | Default / Example | Used by |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://user:password@localhost:5432/ecommerce?schema=public` | `prisma.config.ts`, `src/prisma/prisma.service.ts` (pg Pool) |
| `JWT_SECRET` | Yes | a long random string | `src/auth/auth.module.ts`, `src/auth/jwt.strategy.ts` |
| `PORT` | No | `3002` (`process.env.PORT ?? 3002`) | `src/main.ts` |
| `CORS_ORIGIN` | No | `http://localhost:3000` (comma-separated list supported) | `src/main.ts` (`origin.split(',')`, `credentials: true`) |

Frontend (`apps/frontend/.env.local`, git-ignored):

| Variable | Required | Default | Used by |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No (recommended) | `http://localhost:3002` | `src/lib/api.ts` (`API_BASE_URL`) |

## Quick Start

The repository contains two independently installed applications. Install at the root (workspaces), then run each app independently.

1. Clone and install:

```bash
git clone <repo-url>
cd ecommerce-project
npm install
```

2. Create `apps/backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3002
CORS_ORIGIN="http://localhost:3000"
```

3. Generate the Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
# or, from apps/backend: npx prisma generate && npx prisma migrate dev
```

4. Start the API:

```bash
npm run dev:backend   # API on http://localhost:3002 (or $PORT)
```

5. In a second terminal, run the storefront:

```bash
npm run dev:frontend  # Storefront on http://localhost:3000
```

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

Register a user at `/fr/register` (or `/en/register`), then browse `/fr/products`. The frontend defaults to French when no locale is selected.

Creating an admin: `role` defaults to `USER` in the schema and `POST /auth/register` creates users; promote via SQL/Prisma Studio:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## Database & Prisma Workflow

- Schema: `apps/backend/prisma/schema.prisma` (generator `prisma-client`, `output = "../generated/prisma"`, `moduleFormat = "cjs"`; datasource `postgresql`, URL from `prisma.config.ts` → `process.env.DATABASE_URL`).
- Client import path: `generated/prisma/client` (not the default `@prisma/client` output location).
- After **any** schema change:

```bash
npm run prisma:generate
npm run prisma:migrate   # dev: npx prisma migrate dev --name <migration-name>
npm run prisma:migrate:deploy  # production: npx prisma migrate deploy
```

- Useful commands (run from `apps/backend` or via root workspaces):

```bash
npm run prisma:studio        # visual data browser
npm run prisma:migrate:status
npm run prisma:validate
```

## Running the Apps

Backend (from repo root, or `cd apps/backend`):

```bash
npm run dev:backend   # watch mode (dev, port $PORT ?? 3002)
npm run build:backend # nest build -> apps/backend/dist/
npm run start:prod:backend   # node apps/backend/dist/main  (after build)
```

Frontend (from repo root, or `cd apps/frontend`):

```bash
npm run dev:frontend  # next dev (http://localhost:3000)
npm run build:frontend  # next build (production)
npm run start:frontend  # next start (serve production build)
```

Root orchestration scripts: `dev`, `dev:backend`, `dev:frontend`, `build`, `build:backend`, `build:frontend`,
`lint`, `lint:backend`, `lint:frontend`, `test`, `test:e2e`, `test:integration`, `test:all`, `format`,
`prisma:generate`, `prisma:migrate`, `prisma:migrate:deploy`, `prisma:seed`.

Note: `apps/frontend/next.config.ts` sets Turbopack `root` to the monorepo root.

## API Reference

Base URL: `http://localhost:3002/api/v1`

All endpoints are prefixed with `/api/v1` via `app.setGlobalPrefix('api/v1')` in `apps/backend/src/main.ts:19`.

Every success response is wrapped by `TransformInterceptor`:

```json
{ "status": "success", "data": <payload>, "timestamp": "2026-10-12T00:00:00.000Z" }
```

Error responses use NestJS defaults:

```json
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }
```

All protected routes require `Authorization: Bearer <accessToken>` (plus `credentials: 'include'` from browsers).

### Auth — `/auth/v1` (public)

| Method & Path | Body | Success `data` | Errors |
|---|---|---|---|
| `POST /auth/register` (`@Public()`) | `RegisterDto`: `name` string NotEmpty; `email` string NotEmpty + IsEmail; `password` string NotEmpty + MinLength 6 | `{ id, email, name, role }` | `409 "Email is already in use"` |
| `POST /auth/login` | `LoginDto`: `email` NotEmpty + IsEmail; `password` NotEmpty | `{ accessToken }` | `401 "Invalid credentials"` |

JWT payload: `{ sub: number, email: string, role: "USER" \| "ADMIN" }`.

### Products — `/products`

Guarded at class level with `AuthGuard` + `RolesGuard`; writes require `@Roles(ADMIN)`.

| Method & Path | Role | Body | Success `data` |
|---|---|---|---|
| `GET /products` | Any authenticated | — | `Product[]` |
| `GET /products/:id` | Any authenticated | — | `Product` |
| `POST /products` | ADMIN | `CreateProductDto`: `name` NotEmpty; `price` NotEmpty + Positive; `stock` NotEmpty + Integer + Min 0 | `Product` |
| `PATCH /products/:id` | ADMIN | `Partial<CreateProductDto>` | `Product` |
| `DELETE /products/:id` | ADMIN | — | deleted `Product` |

### Cart — `/cart` (current user, `AuthGuard`)

| Method & Path | Body | Success `data` | Errors |
|---|---|---|---|
| `GET /cart` | — | `Cart & { items }` | `401` if unauthenticated |
| `POST /cart/add` | `AddToCartDto`: `productId` Integer; `quantity` Integer Min 1 | `CartItem` | `404` product missing; `400` out of stock |
| `PATCH /cart/item/:id` | `UpdateCartItemDto`: `quantity` Integer Min 1 | updated `CartItem` | `400`/`404` |
| `DELETE /cart/item/:id` | — | removed `CartItem` | `404` |

### Orders — `/orders` (`AuthGuard`, user-scoped)

| Method & Path | Body | Success `data` | Errors |
|---|---|---|---|
| `POST /orders` | `CreateOrderDto`: `items: Array<{ productId, quantity Integer Min 1 }>` (min 1) | created `Order` | `400` insufficient stock (transaction rolls back) |
| `GET /orders` | — | `Order[]` ordered `createdAt DESC` | `401` |
| `GET /orders/:id` | — | single `Order` | `404` |

### Users — `/users` (ADMIN only)

Class-level `@UseGuards(JwtAuthGuard, RolesGuard)`. All routes require `ADMIN`.

| Method & Path | Description |
|---|---|
| `POST /users` | Create user |
| `GET /users` | List users |
| `GET /users/:id` | Get one user |
| `PATCH /users/:id` | Update user |
| `DELETE /users/:id` | Delete user |

## Auth & Authorization

- Login returns `{ accessToken }`; the frontend stores it in `localStorage['accessToken']` (cookie fallback) and sends `Authorization: Bearer <token>` on every `apiFetch` with `credentials: 'include'`.
- Backend `AuthGuard` (JWT strategy) validates the Bearer token; `RolesGuard` uses `Reflector` + `@Roles(Role.ADMIN)` metadata for admin routes.
- Two overlapping auth mechanisms exist (known quirk): custom `AuthGuard` (`apps/backend/src/users/auth/auth.guard.ts`) used by products/cart/orders, and passport `JwtAuthGuard` (`apps/backend/src/auth/guards/jwt-auth.guard.ts`) used by users. Both validate the same JWT. Consolidation is future work.

## Data Models

See `docs/API.md` and `apps/backend/prisma/schema.prisma`. Core models:

```prisma
enum Role { USER ADMIN }

model User { id Int @id @default(autoincrement()); email String @unique; name String?; password String; role Role @default(USER); cart Cart?; orders Order[] }
model Cart { id Int @id @default(autoincrement()); userId Int @unique; user User @relation(fields:[userId], references:[id]); items CartItem[] }
model CartItem { id Int @id @default(autoincrement()); cartId Int; productId Int; quantity Int; @@unique([cartId, productId]) }
model Product { id Int @id @default(autoincrement()); name String; price Float; stock Int; cartItems CartItem[]; orderItems OrderItem[] }
model Order { id Int @id @default(autoincrement()); userId Int; items OrderItem[]; createdAt DateTime @default(now()) }
model OrderItem { id Int @id @default(autoincrement()); orderId Int; productId Int; quantity Int }
```

## Validation, Responses & Errors

Success envelope (global `TransformInterceptor`, `apps/backend/src/users/transform/transform.interceptor.ts`):

```json
{ "status": "success", "data": "<payload>", "timestamp": "..." }
```

Frontend rule: always read `json.data`.

Error shape (NestJS default):

```json
{ "statusCode": 400, "message": "...", "error": "Bad Request" }
```

| Code | Meaning |
|---|---|
| `400` | Validation failure or business rule (insufficient stock, bad cart quantity, empty order) |
| `401` | Missing/invalid/expired Bearer token; bad login credentials |
| `403` | Authenticated but wrong role (non-admin writes / users routes) |
| `404` | Product / cart item / order / user not found |
| `409` | `POST /auth/register` duplicate email |

Global pipe: `ValidationPipe({ whitelist: true, transform: true })` — unknown properties stripped, payloads transformed to DTO instances.

## Scripts Reference

Root (`package.json`):

| Script | What it does |
|---|---|
| `npm run dev` | Starts backend + frontend concurrently |
| `npm run dev:backend` / `dev:frontend` | Single app watch mode |
| `npm run build` | `nest build` + `next build` (all workspaces) |
| `npm run build:backend` / `build:frontend` | Single app build |
| `npm run lint` | ESLint with `--fix` (all workspaces) |
| `npm run lint:backend` / `lint:frontend` | Single app lint |
| `npm run test` | Backend unit tests (Jest) |
| `npm run test:e2e` / `test:integration` | Backend e2e / integration suites |
| `npm run test:all` | Coverage + e2e |
| `npm run format` | Prettier (all workspaces) |
| `npm run prisma:generate` / `prisma:migrate` / `prisma:migrate:deploy` / `prisma:seed` | Prisma workflows |

Backend (`apps/backend/package.json`): same scripts without workspace prefix.

Frontend (`apps/frontend/package.json`): `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

## Testing

- Unit: colocated `apps/backend/src/**/*.spec.ts` (auth, cart, products, users, prisma; orders has `orders.service.spec.ts` only).
- Suites: `test/app.e2e-spec.ts`, `test/e2e/`, `test/integration/`, `test/security/`, `test/edge-cases.spec.ts`, plus `test/factories/`, `test/fixtures/`, `test/helpers/`; configs `test/jest-e2e.json`, `test/jest-integration.json`.
- Coverage excludes `*.module.ts`, `main.ts`, `*.entity.ts`, `*.spec.ts`, `*.e2e-spec.ts`, `node_modules`.

```bash
npm run test
npm run test:cov
npm run test:e2e
npm run test:integration
```

## Linting & Formatting

```bash
npm run lint          # ESLint with --fix (all workspaces)
npm run lint:backend  # backend only
npm run lint:frontend # frontend only
npm run format        # Prettier write
```

TypeScript: `module/moduleResolution nodenext`, `target ES2023`, `outDir ./dist`, `baseUrl ./`, `strictNullChecks` on, `noImplicitAny` off, decorators + `emitDecoratorMetadata` on, `incremental` on.

## Postman Collection

`apps/backend/postman/collection.json` + `apps/backend/postman/environment.json` contain a ready-made collection. Import both into Postman, set the environment base URL to your running API (`http://localhost:3002/api/v1`), register/login to obtain `accessToken`, and set it as `Authorization: Bearer <token>` for protected calls.

## Deployment Notes

- Backend: `npm run build:backend` → `node apps/backend/dist/main` with `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` set in the host environment. Run `npx prisma generate` (and `prisma migrate deploy` for migrations) during the build/release step. No Docker in this pass (assessed in Phase 8 — plain Node + hosted Neon).
- CORS: set `CORS_ORIGIN` to the production storefront origin(s), comma-separated; `credentials: true` is required.
- Frontend: set `NEXT_PUBLIC_API_URL` to the public API URL at build time; `npm run build:frontend && npm run start:frontend`.
- Do not commit `.env` / `apps/frontend/.env.local`; provide them via the host's secret management.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `P1001` / connection refused from Prisma | `DATABASE_URL` wrong or Postgres down; verify with `psql` and `npx prisma migrate:status`. |
| `401` on every protected call | Missing/expired `Authorization: Bearer` token or wrong `JWT_SECRET` vs the signer; log in again. |
| `403` on `POST /products` | Caller is `USER`; promote to `ADMIN` in the DB. |
| `400` adding to cart / placing order | Stock insufficient — check `Product.stock`; order transaction rolls back on any shortfall. |
| Frontend calls hit wrong port | `NEXT_PUBLIC_API_URL` unset (falls back to `:3000`); set it to the API origin (`:3002` locally). |
| Endpoints 404 | All endpoints are under `/api/v1` — call `/api/v1/auth/...`, `/api/v1/products/...`. |
| Prisma client not found | Run `npm run prisma:generate` (client lives in `apps/backend/generated/prisma/`, git-ignored). |
| CORS errors in browser | `CORS_ORIGIN` must include the storefront origin exactly; backend uses `credentials: true`. |
| Frontend lint errors | 20 pre-existing errors outside plan scope (Phase 7 note); does not block `next build`. |

---

License: `UNLICENSED` (private) per `package.json`. NestJS itself is MIT-licensed.
