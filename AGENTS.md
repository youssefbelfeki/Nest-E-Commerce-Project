# AGENTS.md

Guidance for AI coding agents working in this repo. Trust this file unless a config or code file contradicts it — when they conflict, the code/config wins. Verify before changing shared behavior.

## Project layout

- Repo root is a **NestJS v11 backend** (TypeScript, `src/`).
- `frontend/` is a separate **Next.js** app with its own `AGENTS.md` (`frontend/AGENTS.md`). Do not modify it; it is auto-regenerated and shouldn't be added to this file.
- `prisma/` holds `schema.prisma`; generated client is emitted to `generated/prisma/` (outside `./node_modules`).

## Entrypoint wiring (`src/main.ts`)

- `import 'dotenv/config'` is required before config is read, including in scripts/tools that touch the app.
- Server port: `process.env.PORT ?? 3002` (not 3000).
- CORS: `origin: process.env.CORS_ORIGIN?.split(',')` defaulting to `['http://localhost:3000']` (the frontend dev origin), with `credentials: true`.
- Global request logger: `LoggerMiddleware` from `./logger/logger.middleware`.
- Global validation: `ValidationPipe({ whitelist: true, transform: true })`.
- Global response envelope: `TransformInterceptor` from `./users/transform/transform.interceptor` wraps success responses as `{ status: "success", data, timestamp }`.

## Module registration (`src/app.module.ts`)

`[UsersModule, PrismaModule, ProductsModule, AuthModule, OrdersModule, CartModule]` are registered (plus `AppController`/`AppService`). Add new feature modules to this list.

## API contract summary

All endpoints are under `/api/v1` (global prefix). Error responses follow NestJS default shape: `{ statusCode, message, error }` with codes `400 / 401 / 403 / 404 / 409`.

### Auth
- `POST /auth/register` (public, `@Public()`): `409` + `"Email is already in use"` on duplicate email.
- `POST /auth/login` (public): returns `{ accessToken }`; `401` + `"Invalid credentials"` on bad credentials.
- JWT payload: `{ sub: number, email, role: "USER" | "ADMIN" }`.
- Protected routes use the NestJS `AuthGuard`, which reads `Authorization: Bearer <accessToken>`. The frontend sends this header plus `credentials: "include"`.

### Products
- Controller-level `@UseGuards(AuthGuard, RolesGuard)`.
- `GET /products` and `GET /products/:id` → `AuthGuard` only (any authenticated user).
- `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` → `AuthGuard` + `@Roles(Role.ADMIN)`.
- `CreateProductDto`: `name` NotEmpty, `price` NotEmpty + Positive, `stock` NotEmpty + Integer + Min:0. `UpdateProductDto` = `Partial<CreateProductDto>`.

### Cart (all `AuthGuard`)
- `GET /cart` → current user's cart.
- `POST /cart/add` with `AddToCartDto` (`productId` Integer, `quantity` Integer Min:1) → returns `CartItem`; `400` if quantity exceeds stock or product out of stock, `404` if product does not exist.
- `PATCH /cart/item/:id` with `UpdateCartItemDto` (`quantity` Integer Min:1) → returns `CartItem`.
- `DELETE /cart/item/:id` → removes item, returns `CartItem`.

### Orders (all `AuthGuard`)
- `POST /orders` with `CreateOrderDto` (`items: Array<{ productId, quantity (Integer, Min:1) }>`, `ArrayMinSize(1)`) → creates order and **atomically decrements product stock in a Prisma transaction**; `400` if insufficient stock.
- `GET /orders` → orders for the current user, ordered `createdAt` DESC.
- `GET /orders/:id` → a single order.

## Prisma

- `prisma/schema.prisma`: generator `prisma-client` with `output = "../generated/prisma"` and `moduleFormat = "cjs"`; datasource `postgresql` (URL resolved via `prisma.config.ts` / `process.env["DATABASE_URL"]`).
- Models: `Role` enum (`USER | ADMIN`), `User`, `Cart` (userId `@unique`), `CartItem` (`@@unique([cartId, productId])`, `cart` relation `onDelete: Cascade`), `Product`, `Order` (`createdAt @default(now())`), `OrderItem`.
- Run `npx prisma generate` after schema changes; the client lives at `generated/prisma/`.

## Schema / convention details

- JWT: `jwtService.signAsync({ sub: user.id, email: user.email, role: user.role })`; secret/token in `.env`.
- Closed-shop: NestJs `Reflector` (admin-only routes) uses custom guard with `Role.ADMIN` metadata.
- Frontend "Sign Up" persists JWT to `localStorage` key `token`; `AuthGuard` on the frontend reads it and sends `Authorization: Bearer <token>`.

## Commands

- Install/build/test are standard NestJS scripts in root `package.json`:
  - `npm run start:dev` — watch mode (dev server on `3002`).
  - `npm run lint` — ESLint (flat config `eslint.config.mjs`, `projectService: true`, prettier with `endOfLine: "auto"`).
  - `npm run test` — unit tests (`*.spec.ts`, colocated with source).
  - `npm run test:integration` / `npm run test:e2e` — integration/e2e suites.
  - `npm run format` — Prettier.

## Notes

- `src/products/`, `src/users/`, `src/auth/`, `src/cart/` follow a consistent layout: controller, service, module, DTOs — each with a colocated `*.spec.ts`.
- `src/orders/` is an exception: only `orders.service.spec.ts` exists; `orders.controller.ts` and `dto/create-order.dto.ts` have no colocated spec. Match this when adding tests.
- TypeScript config: `module/moduleResolution nodenext`, target `ES2023`, `outDir ./dist`, `baseUrl ./`, `strictNullChecks` on, `noImplicitAny` off, decorators enabled, `incremental` on. `tsconfig.build.json` excludes `node_modules`, `test`, `dist`, `frontend`, and `**/*spec.ts`.
- This repo has no `CLAUDE.md`, `opencode.json`, `.cursorrules`, `.claude/`, or `.github/workflows/` — the knowledge graph in `graphify-out/` (see `GRAPH_REPORT.md`) is the source of truth for architecture questions.