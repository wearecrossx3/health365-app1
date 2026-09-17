# Health365 — Next.js app (Phase 4 start)

Real project, no Supabase. Auth and consultation storage run on **Vercel's
Redis store** (Storage tab -> Create Database -> Redis), with sessions signed via HMAC —
the same lightweight pattern used on the Antaraga admin panel — instead of
a full auth provider.

## What's working right now

- Full marketing **homepage** (`/`) — ported from the approved design
- **Consultation flow** (`/consultation`) — 7 steps, requires login, submits to the real database
- **Diet plan generator** (`/diet-plan`) — same rule-based engine as the preview, plus a real browser-downloaded PDF (not the Claude-artifact-only download flow — this uses a normal `<a download>` / `doc.save()`, which works on any deployed site)
- **Conditions** (`/conditions`) — all 6 conditions, click-through detail view
- **Dietitian directory** (`/dietitians`) — filterable, with Dr. Astha's profile
- **Admin dashboard** (`/admin`) — total users, total consultations, a "needs
  professional review" count, a list of every consultation with a
  "Mark reviewed" button, and a simple user list. Gated by the
  `ADMIN_EMAILS` environment variable — no separate role system.
- Email/password signup and login (`/signup`, `/login`)
- HMAC-signed session cookie, no external auth service
- A dashboard (`/dashboard`) that reads the logged-in user's consultations
  from Redis
- API routes: `POST /api/auth/signup`, `POST /api/auth/login`,
  `POST /api/auth/logout`, `GET /api/auth/session`,
  `POST /api/consultations`, `GET /api/consultations`
- Design tokens (colors, fonts) wired into Tailwind + globals.css so new
  pages match the approved look everywhere

## What's NOT built yet

- The diet plan generator doesn't yet pull from a user's saved consultation
  automatically — it's still a standalone tool on its own page. Wiring
  that together is the next connection to make.
- Dietitian signup/verification flow, real booking/appointments, dietitian
  dashboard, and the admin dashboard (Phases 5–6) haven't been started.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `SESSION_SECRET` — any random string (`openssl rand -base64 32`)
   - `REDIS_URL` — from a Vercel Redis store (see below)
   - `ADMIN_EMAILS` — your own email, once you've signed up, so you can access `/admin`
3. `npm run dev` — runs at `http://localhost:3000`

## Setting up Vercel Redis

1. In the Vercel dashboard, open this project -> **Storage** tab -> **Create Database** -> **Redis** (this is the current product; it used to be called "KV" and used different variable names -- if you see leftover `KV_REST_API_*` variables from an older attempt, they can be deleted, they're not used).
2. Once created and connected, Vercel automatically injects `REDIS_URL`
   into your project's environment variables for Production and Preview.
3. **Redeploy** after attaching it -- existing deployments don't pick up
   new environment variables until you redeploy.
4. For local development, open the Redis store's **.env.local** tab in
   the Vercel dashboard and copy the value into your local `.env.local`.

## Deploying

1. Push this project to a GitHub repo.
2. Import the repo in Vercel → it detects Next.js automatically.
3. Attach a Redis store as described above (do this before the first deploy
   that needs it, or redeploy after attaching).
4. Set `SESSION_SECRET` in the project's Environment Variables.
5. Deploy. `npm run build` should pass with no errors.

## Production checklist

- [ ] Set a real `SESSION_SECRET` (not the dev default)
- [ ] Attach and verify the Vercel Redis store
- [ ] Port the approved HTML designs into React components
- [ ] Add the dietitian and admin dashboards (Phase 5–6)
- [ ] Replace the placeholder Dr. Astha bio/credentials with verified details
