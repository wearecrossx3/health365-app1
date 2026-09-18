# Health365 — Next.js app (Phase 4 start)

Real project, no Supabase. Auth and consultation storage run on **Vercel's
Redis store** (Storage tab -> Create Database -> Redis), with sessions signed via HMAC —
the same lightweight pattern used on the Antaraga admin panel — instead of
a full auth provider.

## What's working right now

- Full marketing **homepage** (`/`) — ported from the approved design
- **Consultation flow** (`/consultation`) — 7 steps, requires login, submits to the real database
- **Diet plan generator** (`/diet-plan`) — rule-based engine, branded PDF download, auto-prefills from your latest saved consultation
- **Conditions** (`/conditions`) — all 6 conditions, click-through detail view
- **Dietitian directory** (`/dietitians`) — filterable, pulls Dr. Astha plus any admin-approved dietitians live from the database
- **Dietitian applications** (`/join-as-dietitian`) — real application form, reviewed from the admin dashboard (Approve/Reject), approved dietitians get their own dashboard at `/dietitian-dashboard`
- **Real appointment booking** — pick a date/time on any dietitian's profile, prevents double-booking, shows up on the user's dashboard, the dietitian's dashboard, and the admin dashboard
- **Admin dashboard** (`/admin`) — users, consultations (with a "needs professional review" flag and mark-reviewed button), dietitian applications, and all appointments in one place. Gated by `ADMIN_EMAILS`, no separate role system.
- **Dedicated admin login** (`/admin/login`) — separate branded sign-in for the admin area, distinct from the public site's login popup.
- **Admin sidebar** — every page under `/admin` shares a persistent sidebar (Dashboard, Site Content, Media Library) instead of the public site's header/footer.
- **Media Library** (`/admin/media`) — every uploaded image in one place, with copy-URL and delete.
- **Content editor** (`/admin/content`) — edit the hero image, hero stat, goal card labels, custom logo, offer popup, and Dr. Astha's profile from a form, with real drag-and-drop image upload. Changes go live immediately, no redeploy.
- **Email notifications** (optional) — you, dietitians, and users get emailed on new consultations, bookings, and applications instead of relying on manually checking the admin dashboard. Uses Resend; the site works fine without it configured, it just won't send emails.
- Login/signup as a popup with glass-blur backdrop, not a separate page
- Email/password auth with an HMAC-signed session cookie — no external auth provider
- Mobile hamburger menu, responsive grids throughout
- Design tokens (colors, fonts) wired into Tailwind + globals.css so new pages match the approved look everywhere

## What's NOT built yet

- **Payment** — deliberately left as "architecture ready" per the original brief (no fake payment system) until a real provider is chosen.
- Real content: Dr. Astha's actual bio/credentials/photo are still placeholders; the colored "photo" panels site-wide are gradient stand-ins for real photography.
- A dietitian can't yet set their own availability — booking currently offers a fixed set of daily time slots for every dietitian.

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

## Setting up image upload (recommended)

1. Vercel dashboard -> your project -> **Storage** tab -> **Create Database** -> **Blob**.
2. Once created, it connects to your project automatically. Modern Blob
   stores use Vercel's OIDC connection — **you do not need to add
   `BLOB_READ_WRITE_TOKEN` yourself**; in fact Vercel will suggest
   revoking that token if you're not using it outside of Vercel, which
   is the expected, correct state.
3. Redeploy.
4. Go to `/admin/content` — you'll now see a "Click to choose a photo, or
   drag one here" box instead of only a URL field.

## Setting up email notifications (optional)

Without this, everything still works — new bookings/applications/consultations
just won't send an email, only show up in `/admin`.

1. Go to **resend.com** → sign up (free tier is fine to start).
2. Create an **API key** → copy it.
3. In Vercel → your project → Environment Variables → add:
   - `RESEND_API_KEY` — the key you just copied (type: Secret)
   - `RESEND_FROM_EMAIL` — leave blank to start; Resend gives you a free
     `onboarding@resend.dev` sender for testing. To send from your own
     domain (e.g. `notifications@health365.com`) you'll need to verify
     that domain in Resend first — their dashboard walks you through it.
   - `NEXT_PUBLIC_SITE_URL` — your real site URL (e.g.
     `https://health365-app1.vercel.app`), just so links inside emails
     point to the right place.
4. Redeploy.

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
- [ ] Attach Vercel Blob storage for image uploads (optional)
- [ ] Set up Resend for email notifications (optional)
- [ ] Replace the placeholder Dr. Astha bio/credentials with verified details
- [ ] Choose a real payment provider before launch (none is wired up yet, by design)
