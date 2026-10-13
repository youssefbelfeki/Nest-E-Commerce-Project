# Backend — NestJS API (@ecommerce/backend)

NestJS 11 REST API for the ApexStore storefront, with Prisma 7 + PostgreSQL.

See the root `README.md` for monorepo-wide setup and `docs/API.md` for the API contract.

## Commands

```bash
npm run dev          # nest start --watch (port $PORT ?? 3002)
npm run build        # nest build -> dist/
npm run start:prod   # node dist/main  (after build)
npm run lint         # ESLint with --fix
npm run format       # Prettier
npm run test         # unit tests (colocated src/**/*.spec.ts)
npm run test:e2e     # e2e + security suites
npm run test:integration
npm run test:cov
```

Run from the repo root with `--workspace apps/backend`, or `cd apps/backend && npm run <script>`.

## Database / Prisma

```bash
npx prisma generate          # regenerate client -> generated/prisma/
npx prisma migrate dev       # create/apply migrations
npx prisma migrate deploy    # apply migrations (production)
npx prisma migrate status
npx prisma studio
```

Also exposed as `npm run prisma:generate`, `prisma:migrate`, `prisma:migrate:deploy`, `prisma:studio`.

## Environment

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | Yes | — |
| `JWT_SECRET` | Yes | — |
| `PORT` | No | `3002` |
| `CORS_ORIGIN` | No | `http://localhost:3000` |

`.env` is git-ignored. Never commit real secrets.

## Layout

- `src/` — modules: `auth`, `users`, `products`, `cart`, `orders`, `prisma`, `logger`, plus `main.ts` / `app.module.ts`
- `test/` — e2e, integration, security suites, factories, helpers
- `prisma/` — `schema.prisma` + `migrations/`
- `generated/prisma/` — generated client (git-ignored)
- `postman/` — collection + environment