<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Frontend (Next.js 16.3.0)

Guidance for AI coding agents working in `frontend/`. Facts below are verified against the code and config; when a prose claim conflicts with a config or code file, the code/config wins.

## Stack

- **Next.js 16.3.0** (App Router), **React 19.2.8**, TypeScript `^5` (strict mode).
- Tailwind CSS `^4` via `@tailwindcss/postcss` (PostCSS runs the single plugin `@tailwindcss/postcss`; no Tailwind config file).
- ESLint `^9` flat config with `eslint-config-next@16.3.0` (`nextVitals` + `nextTs` presets).

## Commands

- `npm run dev` — next dev (development server).
- `npm run build` — production build.
- `npm run start` — start production server.
- `npm run lint` — ESLint.

## Config / wiring

- `next.config.ts` sets Turbopack `root` to the monorepo root: `path.join(__dirname, '../')` — builds resolve the workspace root, not `frontend/`.
- `tsconfig.json`: strict, `"@/*"` → `"./src/*"`.
- `eslint.config.mjs` ignores `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- Project uses TypeScript path alias `@/*`.

## Source layout

- App Router pages live under `src/app/[lang]/`: `home`, `login`, `register`, `cart`, `orders`, `products`, `admin/products`, plus the root `layout.tsx`, `dictionaries.ts`, and `globals.css`.
- The `[lang]` dynamic segment is the locale; all pages are locale-scoped.
- Supporting code: `src/lib/i18n.ts`, `src/lib/api.ts`, `src/proxy.ts`, `src/context/AuthContext.tsx` (and its I18nProvider sibling), `src/components/`, `src/types/index.ts`.
- There is **no** root-level `middleware.ts`/`middleware.*` — i18n routing logic lives in `src/proxy.ts`.

## i18n

- `src/lib/i18n.ts` defines `locales = ['en', 'fr']`, `defaultLocale = 'fr'`, the `NEXT_LOCALE` cookie name, and an `isLocale` type guard. `src/proxy.ts` comments that it "Must stay in sync with src/lib/i18n.ts".
- Locale resolution priority in `src/proxy.ts`: `NEXT_LOCALE` cookie → `Accept-Language` header → default locale (`fr`).
- `src/proxy.ts` redirects non-locale paths to the equivalent `/[locale]` path and sets the locale cookie; its matcher is `/((?!_next|favicon.ico|.*\\..*).*)`.
- `src/app/[lang]/dictionaries.ts` is a `server-only` module; it loads `en`/`fr` JSON dictionaries, with `getDictionary` falling back to `en`.

## API wiring (src/lib/api.ts)

- `API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'`.
- Auth token read from `localStorage['accessToken']`, with a cookie fallback.
- `apiFetch` always sends `credentials: 'include'` and, when a token exists, `Authorization: Bearer <token>`.

## Auth (src/context/AuthContext.tsx)

- Client-side JWT decode; payload `{ sub, email, role: 'USER' | 'ADMIN', exp }`.
- User is restored only while the token is unexpired.

## Layout (src/app/[lang]/layout.tsx)

- Route params are Promises: `params: Promise<{ lang: string }>` is awaited.
- `generateStaticParams` returns all `locales`; metadata title is `ApexStore | Next-Gen E-Commerce Platform`.
- Provider nesting: `AuthProvider > I18nProvider > Navbar > main`.