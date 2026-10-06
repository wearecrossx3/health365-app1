Health365 — "Get the app" landing page  (www.thehealth365.in/app)

Upload to GitHub (wearecrossx3/health365-app1), keeping the same folders:
  1. Open the repo on GitHub -> Add file -> Upload files
  2. Drag in the 3 folders from this zip:  app   components   public
     (GitHub keeps the folder paths. SiteHeader.tsx and sitemap.ts replace the old ones.)
  3. Commit changes. Vercel deploys in ~2 minutes.
  4. Open https://www.thehealth365.in/app  — "Get the app" is now in the top menu.

What's inside
  app/app/page.tsx          the new page
  app/app/app-landing.css   its styles (only affect this page)
  public/app-landing/       real app screenshots, condition icons, QR code
  components/SiteHeader.tsx menu with the new "Get the app" link (desktop + mobile)
  app/sitemap.ts            adds /app for Google

Launch day: in app/app/page.tsx change   const PLAY_LIVE = false;   to   true
  -> the Google Play button links straight to the store listing.
