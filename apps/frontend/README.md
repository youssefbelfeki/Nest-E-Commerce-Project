# Frontend — Next.js Storefront (@ecommerce/frontend)

ApexStore storefront built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4,
and EN/FR i18n. Communicates with the backend via `src/lib/api.ts` only.

See the root `README.md` for monorepo-wide setup and `docs/API.md` for the API contract.

## Commands

```bash
npm run dev      # next dev (http://localhost:3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

Run from the repo root with `--workspace apps/frontend`, or `cd apps/frontend && npm run <script>`.

## Environment

Copy `.env.example` to `.env.local` and adjust:

| Variable | Required | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Recommended | `http://localhost:3002/api/v1` |

`.env.local` is git-ignored. `NEXT_PUBLIC_*` values ship to the browser — never put secrets here.

## Layout

- `src/app/[lang]/` — locale-scoped pages: home, products, cart, orders, login, register, admin/products
- `src/proxy.ts` — i18n locale routing (cookie → Accept-Language → `fr`); there is no root `middleware.ts`
- `src/lib/api.ts` — `apiFetch`: base URL, Bearer token, `credentials: 'include'`, success-envelope unwrapping
- `src/lib/i18n.ts` + `src/context/I18nContext.tsx` — dictionaries and `t()`
- `src/context/AuthContext.tsx` — client-side JWT decode, login/register/logout
- `src/lib/schemas.ts` — Zod validation mirroring backend DTOs

## Auth flow

- Login returns `{ accessToken }`; stored in `localStorage['accessToken']` (with cookie fallback).
- Sent as `Authorization: Bearer <token>` on every `apiFetch` call.
- `AuthContext` decodes the JWT payload `{ sub, email, role, exp }` and restores the session only while unexpired.