import type { Metadata } from "next";
import { Instrument_Sans, Inter } from "next/font/google";
import "./globals.css";
import AuthModalProvider from "@/components/AuthModalProvider";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400", "500", "600", "700"],
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
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>",
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
  return (
    <html lang="en" className={`${instrument.variable} ${inter.variable}`}>
      <body className="font-body">
        <AuthModalProvider>{children}</AuthModalProvider>
      </body>
    </html>
  );
}
