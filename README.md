# Easybaby advisors

Public directory of **EasyBaby babywearing specialists** ("specjaliści przyjaźni chustonoszeniu"), plus a private admin
panel to manage them. Visitors browse an interactive map of Poland, drill into a voivodeship, and search/filter the
specialists active in their area.

Live at **[specjalisci.easybaby.pl](https://specjalisci.easybaby.pl)**.

---

## Tech stack

| Concern      | Choice                                                                                |
|--------------|---------------------------------------------------------------------------------------|
| Framework    | Next.js 16 (App Router, React 19, Server Actions)                                     |
| Runtime      | Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| Database     | Cloudflare **D1** - binding `DB`                                                      |
| File storage | Cloudflare **R2** - binding `PHOTOS`                                                  |
| Auth         | Auth.js (NextAuth v5) - Google OAuth, JWT sessions                                    |
| Styling      | Tailwind CSS v4 + shadcn/base-ui primitives                                           |
| Tooling      | TypeScript, ESLint, Wrangler                                                          |

---

## Architecture

```
Browser
  │
  ├─ Public site  (SSR + Server Actions, no login)
  │    /            → map of Poland with per-voivodeship counts
  │    /[woj]       → specialist list for a voivodeship
  │                   (SSR first page, infinite scroll, search, sort)
  │
  └─ Admin panel  (/admin, Google login gated by D1 allowlist)
       CRUD specialists · manage allowlist · upload photos

Server (Cloudflare Worker)
  Server Components / Server Actions
       │
       ├─ D1 (DB)      advisors, allowlist, app_meta
       └─ R2 (PHOTOS)  advisor photos, served via /api/photo/<key>
```

Cloudflare bindings are read **per request** through `getCloudflareContext()` (not `process.env`), because secrets and
bindings live on the Worker environment. This is why most data modules start with `import "server-only"`.

## Getting started (local)

### Prerequisites

- Node.js 20+
- A Cloudflare account (only needed for remote D1/R2 and deploys; local dev simulates both)
- A Google OAuth 2.0 "Web application" client (for admin login)

### 1. Install

```bash
npm install
```

### 2. Configure secrets

Local secrets go in `.dev.vars` (gitignored). Create/fill it with:

```ini
NEXTJS_ENV=development
AUTH_SECRET=<random string, e.g. `openssl rand -base64 32`>
AUTH_GOOGLE_ID=<Google OAuth client id>
AUTH_GOOGLE_SECRET=<Google OAuth client secret>
```

In the Google Cloud console, add these authorized redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://specjalisci.easybaby.pl/api/auth/callback/google
```

### 3. Apply database migrations (local D1)

```bash
npm run db:migrate:local
```

This creates the `advisors`, `allowlist`, and `app_meta` tables in the local (simulated) D1 under `.wrangler/state`. To
get into the panel, make sure your Google email is in `allowlist` — either edit migration `0002` before applying, or
insert it directly:

```bash
npx wrangler d1 execute specjalisci-easybaby-db --local \
  --command "INSERT OR IGNORE INTO allowlist (email, added) VALUES ('you@gmail.com', date('now'))"
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site, or `/admin` for the panel. `next.config.ts`
calls `initOpenNextCloudflareForDev()`, so D1/R2 bindings work under plain `next dev` — no separate Wrangler process
needed.

---

## Environment variables

| Name                 | Where                                          | Purpose                            |
|----------------------|------------------------------------------------|------------------------------------|
| `AUTH_SECRET`        | `.dev.vars` (local) / `wrangler secret` (prod) | Auth.js JWT signing secret         |
| `AUTH_GOOGLE_ID`     | `.dev.vars` / `wrangler secret`                | Google OAuth client id             |
| `AUTH_GOOGLE_SECRET` | `.dev.vars` / `wrangler secret`                | Google OAuth client secret         |
| `NEXTJS_ENV`         | `.dev.vars`                                    | Next.js env selector for local dev |

Set production secrets on the Worker:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put AUTH_GOOGLE_ID
npx wrangler secret put AUTH_GOOGLE_SECRET
```

---

## Database & storage (remote setup)

One-time provisioning for a fresh Cloudflare account:

```bash
# D1 — paste the returned database_id into wrangler.jsonc
npx wrangler d1 create specjalisci-easybaby-db

# R2 bucket for photos
npx wrangler r2 bucket create specjalisci-easybaby-photos

# Apply migrations to remote D1
npm run db:migrate:remote
```

Migrations live in `migrations/` and are plain SQL, applied in filename order. Add new schema changes as
`migrations/000N_description.sql`.

---

## Admin panel & auth

- Route: `/admin` (never prerendered — `dynamic = "force-dynamic"`, `robots: noindex`).
- Sign-in is **Google only**, and every login is checked against the D1 `allowlist` in the `signIn` callback (
  `src/auth.ts`). Accounts not on the list are rejected.
- Admins manage the allowlist from the panel's **Dostęp** tab; you cannot revoke your own access.
- All admin Server Actions go through `requireAdmin()` before touching D1/R2.

## Photos

Advisor photos are uploaded through a Server Action to R2 (max 5 MB; JPG/PNG/WEBP/GIF). The object key is stored in the
advisor's `zdjecie` field and served publicly, cached immutably, via `GET /api/photo/<key>`. Because uploads flow
through a Server Action, `next.config.ts` raises the body-size limit to 6 MB.

---

## License

Licensed under the **Apache License 2.0** — see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE).
