import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import "./globals.css";
import AuthModalProvider from "@/components/AuthModalProvider";
import OfferPopup from "@/components/OfferPopup";
import ActivityToast from "@/components/ActivityToast";
import ThemeInjector from "@/components/ThemeInjector";

const heading = Fredoka({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["500", "600", "700"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://health365-app1.vercel.app"),
  title: {
    default: "Health365 — Your health, your 365.",
    template: "%s — Health365",
  },
  description:
    "Health365 is a nutrition platform built around real people, not just diet charts — consultations, personalised plans, and dietitians you can trust.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Health365 — Your health, your 365.",
    description:
      "Nutrition guidance built around your routine, your kitchen, and your goals — not a generic diet chart.",
    siteName: "Health365",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Health365 — Your health, your 365.",
    description: "Nutrition guidance built around your routine, your kitchen, and your goals.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Health365",
    description:
      "Nutrition platform offering consultations, personalised diet plans, and dietitian bookings.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://health365-app1.vercel.app",
    areaServed: "IN",
    founder: {
      "@type": "Person",
      name: "Dr. Astha Jadeja",
      jobTitle: "Founder & Lead Dietitian",
    },
  };

  return (
    <html lang="en" className={`${heading.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#C96A3C" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body">
        <ThemeInjector />
        <AuthModalProvider>{children}</AuthModalProvider>
        <OfferPopup />
        <ActivityToast />
      </body>
    </html>
  );
}
