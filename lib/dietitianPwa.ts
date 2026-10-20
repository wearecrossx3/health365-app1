import type { Metadata } from "next";

// Lets a dietitian on iPhone (or any browser) "Add to Home Screen" and open
// the Dietitian portal full-screen, like the Android H365 Dietitian app.
export const dietitianPwa: Metadata = {
  manifest: "/dietitian.webmanifest",
  appleWebApp: { capable: true, title: "H365 Dietitian", statusBarStyle: "default" },
  icons: { apple: "/dt-apple-touch-icon.png" },
};
