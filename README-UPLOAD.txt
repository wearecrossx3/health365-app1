Health365 — v1.0.7 Website + Admin (FINAL — use this zip only)
==============================================================
GitHub repo (health365-app1) -> "Add file" -> "Upload files" -> drag the folders
inside this zip (app, components, lib) -> Commit. Vercel deploys in 2–3 minutes.
The 1.0.6 app in review keeps working exactly the same.

TURN ON THE FOOD SCANNER (one time):
  1. Go to https://aistudio.google.com/apikey -> "Create API key" (free tier available).
  2. Vercel -> your project -> Settings -> Environment Variables -> Add:
        Name:  GEMINI_API_KEY      Value: (paste the key)   Environments: Production
        (Do NOT add GEMINI_MODEL — the site now picks a working model by itself.
         If you added it earlier, delete it.)
     Turn on billing for the key (paid tier) so photos are not used by Google, and set
     a small budget alert in Google Cloud -> Billing -> Budgets.
  3. Vercel -> Deployments -> latest -> "Redeploy".
  (Claude works too: add ANTHROPIC_API_KEY instead.)
  Until a key is added, the app simply hides the scan button.

New in Admin: Users & Plans, Plan Generator, App Offers, Blog, Food Database,
App Notifications -> Random nudges, Website Settings -> consultation details + 7-day lock.

Food data: USDA FoodData Central (public domain) via the TempoLife dataset (CC-BY-4.0).
IFCT data is NOT used (it needs written permission from NIN Hyderabad).
Privacy policy page is updated for the food scanner.

FUN NUDGES (159 new):
  Admin -> App Notifications -> Random nudges -> "Add Health365 fun pack" -> Save nudges.
  Untick any you don't like, or edit the text. Up to 300 nudges are allowed.
