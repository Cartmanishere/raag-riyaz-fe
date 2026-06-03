# AGENTS.md — Raag Riyaz Frontend

## Quick start

```bash
npm install        # use npm, not yarn or pnpm
npm run dev        # starts Next.js dev server (default port 3000)
npm run build      # static export → out/
npm run lint       # ESLint via eslint-config-next
```

Copy `.env.example` to `.env.local` and set your local backend URL and Google client ID.

## Critical constraints

- **Static export only** (`output: "export"` in `next.config.ts`). No SSR, no API routes, no server components. Everything runs client-side. All pages are `"use client"`.
- **All env vars must be `NEXT_PUBLIC_*`** — they're inlined at build time and cannot change at runtime. There is no server process.
- **Trailing slash** and **image unoptimized** are forced on (see `next.config.ts`).

## Architecture

```
src/
├── app/                   # Next.js App Router (pages only, no API routes)
│   ├── login/             # email/password + Google OAuth login
│   ├── onboarding/        # post-Google-OAuth onboarding flow
│   ├── teacher-dashboard/ # admin views (students, batches, recordings, profile)
│   └── student-dashboard/ # student-assigned recordings
├── services/
│   ├── api.ts             # Axios client, interceptors, all API calls + DTO mapping
│   ├── auth.ts            # login/logout logic, role helpers
│   ├── auth-session.ts    # localStorage session + React external store
│   └── auth-errors.ts     # Google auth error messages
├── components/            # React components by feature
├── hooks/                 # useOrganization (subdomain-based org lookup)
├── lib/                   # domain.ts (hostname/URL helpers)
├── theme/                 # MUI v6 theme (warm earthy palette)
├── types/                 # All TypeScript types (DTOs + domain types)
└── data/seed.ts           # DEAD CODE — not imported anywhere (mock seed data)
```

## API layer conventions

- Backend uses **snake_case**, frontend domain types use **camelCase**.
- `src/types/index.ts` defines both DTO interfaces (e.g. `UserDto`) and domain interfaces (e.g. `User`).
- `src/services/api.ts` contains mapper functions (`mapUser`, `mapRecording`, etc.) that convert DTOs → domain types.
- **Always use the domain type** in components. Only `api.ts` should reference DTOs.
- API endpoints are grouped into namespaced objects: `authApi`, `organizationApi`, `adminUsersApi`, `adminStudentBatchesApi`, `adminRecordingsApi`, `adminDashboardApi`, `userRecordingsApi`.

## Auth

- JWT access/refresh token pair, stored in **localStorage** (not cookies).
- `auth-session.ts` uses an **external store** pattern (`useSyncExternalStore`) for React reactivity.
- `AuthProvider` wraps the entire app in `layout.tsx` and handles:
  - Hydrating session from localStorage on mount
  - Validating the session via `GET /auth/me`
  - Auto-refreshing tokens via Axios interceptor on 401
  - Redirecting unauthenticated users, role mismatches, and post-login routing
- Backend role `"admin"` = frontend role **"teacher"**. Role `"user"` = **"student"**.
- The `AuthProvider` context exposes `useAuth()` hook and `useActorDisplay()` for avatar info.
- Token refresh is deduplicated — concurrent 401s share a single refresh promise.

## Routing & navigation

- `/` → redirects to `/login`
- `/teacher-dashboard` → redirects to `/teacher-dashboard/students`
- Teacher routes are gated by `AuthProvider` — non-admin users get redirected.
- Student routes similarly gated for `"user"` role.
- `DashboardShell` is the layout for all `/teacher-dashboard/*` pages (applied via `layout.tsx`).
- Subdomain-based org routing: `useOrganization()` hook extracts org slug from hostname and fetches org name from the API.

## Deployment

- Build output goes to `out/`. Both **Cloudflare Pages** (`wrangler.jsonc`) and **GitHub Pages** (`.github/workflows/deploy-gh-pages.yml`) serve from there.
- `next.config.ts` supports `NEXT_PUBLIC_BASE_PATH` for serving from a subpath.
- All `NEXT_PUBLIC_*` vars must be present in the build environment — see `DEPLOYMENT.md` for staging/prod values.

## Styling

- **MUI v6** with custom theme (`src/theme/theme.ts`).
- `ThemeRegistry` wraps children in `AppRouterCacheProvider` (required for MUI + Next.js App Router) and `ThemeProvider`.
- Color palette is warm/earthy. Card background is `#eee6d8`, page background is `#f5f0e8`, primary is `#c05060`.
- Buttons have `textTransform: "none"` globally.

## Gotchas

- **No tests** — no test runner, no test files. Add them if the task requires.
- `src/data/seed.ts` is **dead code** with zero imports. Do not use it.
- The `DEFAULT_API_BASE_URL` fallback in `api.ts` points to the staging backend — real deploys override via `NEXT_PUBLIC_API_BASE_URL`.
- `buildFormData` in `api.ts` skips null/undefined values — recording create uses multipart/form-data for file upload.
- The app ships with no `public/` directory; the root `/public` may not exist.
