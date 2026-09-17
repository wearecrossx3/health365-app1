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
  title: "Health365 — Your health, your 365.",
  description:
    "Health365 is a nutrition platform built around real people, not just diet charts.",
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
