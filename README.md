# Business Manager

A multi-tenant SaaS web application for barber shop owners to manage branches,
workers, sales, wages, rent, expenses, and profit & loss — with a separate
Platform Admin console for the SaaS operator.

Built with **Next.js 14 (App Router) + TypeScript + Prisma + MySQL (Aiven) + Tailwind CSS**.

---

## Quick start (TL;DR)

```bash
git clone https://github.com/basha25119-maker/Product.git
cd Product
npm install
cp .env.example .env
```

Now open `.env` and fill in two values (see [§5](#5-set-up-your-aiven-mysql-database) and
[§6](#6-configure-environment-variables) below for where to get them):

```env
DATABASE_URL="mysql://avnadmin:PASSWORD@your-service.aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED"
AUTH_SECRET="<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">"
```

Then:

```bash
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) and sign in with
the `SEED_PLATFORM_ADMIN_EMAIL` / `SEED_PLATFORM_ADMIN_PASSWORD` from your `.env`. That's the
whole loop — the numbered sections below explain each step in detail and cover deployment.

---

## 1. What's included

- **Platform Admin console** (`/admin`) — create customer accounts, suspend/reactivate,
  reset passwords, view platform-wide stats.
- **Customer workspace** (`/dashboard`) — one isolated workspace per business (tenant):
  branches, workers, sales, wages, rent, expenses, reports, analytics, settings.
- **Complete tenant isolation** — every database query is scoped to the tenant derived
  from the signed server-side session. Tenant IDs are never trusted from the client
  (not from the URL, not from form fields, not from query params). See
  [`src/lib/guards.ts`](src/lib/guards.ts) and [`src/lib/ownership.ts`](src/lib/ownership.ts).
- **Secure auth** — bcrypt password hashing, signed HTTP-only session cookies (JWT via `jose`),
  protected routes via middleware, password reset flow, forced password change for
  admin-created accounts.
- **Financial engine** — revenue/wages/rent/expenses/profit calculations, 6-month P&L chart,
  sales by branch/worker, cash vs card breakdown, CSV report export.
- **Sales entry, one row per worker per day** — cash, card/machine (and any custom payment
  methods) are entered together and shown as columns with a total, instead of a separate
  row per payment method.
- **Attendance-based payroll** — mark each worker Full Day / Half Day / Absent per day on a
  monthly grid; pay is calculated automatically from their per-day rate (half day = 50%,
  absent = £0) over the month or any custom date range, then recorded as a wage payment.
  See [`src/lib/attendance.ts`](src/lib/attendance.ts).
- **Soft deletes + audit log** — sales/wages/rent/expenses are never hard-deleted; every
  important financial action is written to `audit_logs`.
- **Premium UI** — a small custom design system (cards, tables, forms, charts via Recharts),
  responsive down to mobile, onboarding wizard, empty/error/loading states.

---

## 2. Tech stack

| Layer      | Choice                                            |
|------------|----------------------------------------------------|
| Framework  | Next.js 14 (App Router), TypeScript                |
| Styling    | Tailwind CSS                                       |
| Database   | MySQL (designed for **Aiven MySQL**)               |
| ORM        | Prisma                                             |
| Auth       | Custom JWT session cookies (`jose`) + `bcryptjs`   |
| Charts     | Recharts                                           |
| Validation | Zod                                                |

Mutations are implemented as **Next.js Server Actions** (not a separate REST API), which
keeps every write server-side and tenant-scoped by construction. A few `GET` API routes
exist for logout and CSV export.

---

## 3. Project structure

```
prisma/
  schema.prisma        # All data models (Tenant, User, Branch, Worker, Sale, ...)
  seed.ts               # Creates the first Platform Admin + default expense categories
src/
  actions/              # Server actions (mutations) — every one derives tenantId from session
  app/
    admin/               # Platform Admin console (separate layout/auth)
    dashboard/, sales/, workers/, branches/, wages/, rent/, expenses/, reports/, settings/
    login/, admin/login/, forgot-password/, reset-password/[token]/
    api/                 # logout + CSV export routes
  components/ui/         # Design system primitives
  components/layout/     # DashboardShell (customer) / AdminShell (platform admin)
  lib/
    auth.ts              # Password hashing + JWT session cookie helpers
    guards.ts             # requireUserSession / requireAdminSession — the single source of tenant identity
    ownership.ts          # Defence-in-depth checks that a related record belongs to the caller's tenant
    finance.ts             # Revenue/expenses/profit calculations, all tenant-scoped
    prisma.ts              # Prisma client singleton
  middleware.ts          # Edge-level route protection for /admin/* and customer routes
```

---

## 4. Prerequisites

- Node.js 18.18+ (tested on Node 22)
- An **Aiven MySQL** service (free tier is fine to start)
- npm

---

## 5. Set up your Aiven MySQL database

1. Sign in to the [Aiven console](https://console.aiven.io/) and create a **MySQL** service
   (any plan/region works).
2. Once it's running, open the service and go to **Overview → Connection Information**.
3. Copy the **Service URI** — it looks like:

   ```
   mysql://avnadmin:AVNS_xxxxxxxxxxxxx@mysql-barber-yourorg.a.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED
   ```

4. You can use the default `defaultdb` database, or create a new one from the Aiven console
   (Databases tab) and swap the name in the URI.

That's it — Aiven's MySQL requires TLS, and Prisma's MySQL connector supports
`ssl-mode=REQUIRED` in the connection string directly, so no separate CA certificate file
is needed for a standard setup.

---

## 6. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://avnadmin:PASSWORD@your-service.aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED"

# Generate a random secret, e.g.:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="paste-a-long-random-value-here"

# First Platform Admin login, created by `npm run seed`
SEED_PLATFORM_ADMIN_EMAIL="admin@yourplatform.com"
SEED_PLATFORM_ADMIN_PASSWORD="ChangeMe123!"
SEED_PLATFORM_ADMIN_NAME="Platform Admin"
```

**Never commit `.env`** — it's already in `.gitignore`.

---

## 7. Install, migrate, and seed

```bash
npm install
npx prisma migrate dev --name init
npm run seed
```

- `npm install` also runs `prisma generate` automatically (via `postinstall`).
- `prisma migrate dev` creates every table in your Aiven MySQL database from
  `prisma/schema.prisma`.
- `npm run seed` creates your first **Platform Admin** login (from the `SEED_PLATFORM_ADMIN_*`
  env vars above) and the default global expense categories (Electricity, Cleaning,
  Marketing, etc.).

---

## 8. Run it locally

```bash
npm run dev
```

- Platform Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  — sign in with the `SEED_PLATFORM_ADMIN_EMAIL` / `SEED_PLATFORM_ADMIN_PASSWORD` you set.
- From the Platform Admin console, click **Create Customer** to create your first barber
  shop account. The temporary password is shown once on screen — copy it and give it to
  the customer.
- Customer login: [http://localhost:3000/login](http://localhost:3000/login) — the
  customer signs in with that temporary password, is required to set a new password, then
  walks through the onboarding wizard (branches → workers → payment methods → categories).

### Useful scripts

```bash
npm run dev             # start local dev server (Turbopack — fast first-page compiles)
npm run dev:webpack      # same, but classic webpack dev compiler (fallback if Turbopack misbehaves)
npm run build            # production build (always webpack, Turbopack doesn't affect this)
npm run start             # run the production build locally
npm run prisma:studio      # open Prisma Studio (visually browse your Aiven DB)
npm run prisma:migrate       # create a new migration after editing schema.prisma
npm run seed                  # re-run the seed script (idempotent)
npm run icons                  # regenerate favicon / home-screen icons from public/setvion-bridge.png
```

**App icon and "Add to Home Screen".** The browser-tab favicon, the iPhone home-screen icon
(`apple-touch-icon.png`) and the Android/PWA icons are generated from `public/setvion-bridge.png`
onto a dark background. After changing the logo, run `npm run icons` and commit the updated files
in `public/`. The home-screen label is set in `src/app/layout.tsx` (`appleWebApp.title`) and
`src/app/manifest.ts` (`short_name`); iOS truncates long labels, so it is kept short. iOS caches
home-screen icons, so to see a new one, remove the app from the home screen and add it again.

**Why pages feel slow to open the *first* time after `npm run dev`:** Next.js dev mode compiles each route on-demand, the first time you visit it — this is normal App Router behavior, not something broken. On Windows especially, the webpack dev compiler can make that first compile take 20–30s per page; `npm run dev` now runs with Turbopack by default, which cuts that to 1–5s. Every page after the first visit is served from an in-memory cache and is fast regardless. If you still see slow first-compiles, check that your antivirus isn't real-time-scanning this project folder and `node_modules` (a very common Windows-specific slowdown).

---

## 9. Deploying

### Option A — Vercel (recommended, easiest for Next.js)

1. This repo already lives at
   [github.com/basha25119-maker/Product](https://github.com/basha25119-maker/Product) —
   no need to push anywhere first.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import `basha25119-maker/Product`.
3. In **Environment Variables**, add:
   - `DATABASE_URL` — your Aiven MySQL connection string
   - `AUTH_SECRET` — a long random value (use a different one than local dev)
   - `NEXT_PUBLIC_APP_NAME` — optional
4. Deploy. Vercel runs `npm install` (which runs `prisma generate`) and `npm run build`
   automatically.
5. **Before the first deploy goes live**, run the migration against your Aiven database
   from your own machine (Vercel's build step does not run migrations automatically):

   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

6. In the Aiven console, check **Overview → Advanced configuration** or the service's
   firewall/IP allowlist — by default Aiven MySQL accepts connections from anywhere over
   TLS, but if you've restricted it, allow Vercel's outbound IPs or switch the service to
   "public access."

### Option B — Any Node host (Railway, Render, a VPS, Docker, etc.)

1. Set the same environment variables (`DATABASE_URL`, `AUTH_SECRET`).
2. Build and run:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run seed
   npm run build
   npm run start
   ```

3. `npm run start` runs Next.js in production mode on port 3000 (set `PORT` to change it).

---

## 10. Security notes

- Tenant isolation is enforced **server-side only**: every server action and query derives
  `tenantId` from the signed session cookie (`src/lib/guards.ts`), never from the client.
  Foreign keys supplied by the client (`branchId`, `workerId`, `paymentMethodId`,
  `categoryId`) are re-verified against the caller's tenant before every write
  (`src/lib/ownership.ts`).
- Passwords are hashed with bcrypt (cost factor 12); sessions are signed JWTs in
  HTTP-only, `SameSite=Lax` cookies, `Secure` in production.
- Important financial records (`sales`, `wage_payments`, `rent_payments`, `expenses`) are
  **soft-deleted** (`deleted_at` / `deleted_by`), never hard-deleted.
- Every significant action (login, logout, password change, CRUD on sales/wages/expenses/
  workers/branches, customer suspension) is written to `audit_logs`.
- **Email is not wired up.** "Forgot password" generates a real, time-limited reset token,
  but since no transactional email provider is configured, the reset link is shown directly
  on screen instead of being emailed. Before going live, plug in a provider (Resend,
  Postmark, SES, etc.) in `src/actions/password.ts` (`requestPasswordResetAction`) and
  `src/actions/admin.ts` (to email the temporary password Platform Admin generates,
  instead of showing it on screen).
- Run `npm audit` before production deployment — dependency advisories change over time;
  this project pins Next.js 14.2.35 (the latest patched 14.x release as of this build).

---

## 11. Acceptance checklist (matches the original spec)

- [x] Platform Admin can create/suspend/reactivate customers and reset their passwords.
- [x] Each customer sees only their own branches, workers, sales, wages, rent, expenses.
- [x] URLs never carry a tenant ID (`/dashboard`, not `/dashboard/<tenantId>`).
- [x] Six-month profit/loss chart, sales by branch/worker, cash vs card breakdown.
- [x] Workers marked "Left" keep their historical sales/wages visible in reports.
- [x] CSV export for sales, P&L, branch, and worker reports — always tenant-scoped.
