# AGENTS.md

## Cursor Cloud specific instructions

### Product Overview

Uni Customs (`uni-customs.com`) is a Next.js 15 (App Router + Turbopack) SaaS app that provides AI-powered HS code classification for international trade. See `README.md` and `package.json` for standard commands.

### Required Secrets

The app requires these environment variables to be fully functional:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication (required for auth UI) |
| `CLERK_SECRET_KEY` | Clerk server-side auth (required for middleware) |

Without these, the dev server starts but pages render without auth context (no sign-in/sign-up, usage tracking returns defaults). Clerk credentials can be obtained from https://dashboard.clerk.com.

### Key Gotchas

- **Legacy `src/pages/` directory**: Contains old Vite/React Router page components from a prior migration. These are NOT used by the Next.js App Router but Next.js auto-compiles them. The `next.config.mjs` webpack alias stubs out `react-router-dom` and `tsconfig.json` excludes legacy entry files (`src/App.tsx`, `src/main.tsx`, `src/components/DevWrapper.tsx`, `src/components/BatchClassify.tsx`) to prevent build errors. Do not add `react-router-dom` as a real dependency.
- **Turbopack + webpack config**: Dev mode uses Turbopack (`next dev --turbo`) but `next.config.mjs` has a webpack config for the react-router-dom alias. Turbopack shows a warning about this; it can be ignored for now.
- **Supabase and classification API are external**: Database (Supabase at `ljxfezqvwsppewvibxnz.supabase.co`) and AI classification API (`hscode-eight.vercel.app`) are cloud-hosted. No local database setup needed.
- **Pre-existing lint errors**: The codebase has ~24K+ ESLint errors (mostly `no-unused-vars`, `no-explicit-any` in legacy files). `next.config.mjs` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`.
- **`.next/` gitignore**: The original `.gitignore` had a corrupted entry for `.next/` (spaces between characters). This was fixed.

### Standard Commands

- `npm run dev` — starts dev server with Turbopack on port 3000
- `npm run build` — production build (needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or will warn)
- `npm run lint` — runs ESLint
- `npm start` — starts production server (after build)
