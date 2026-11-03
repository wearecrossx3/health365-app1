import type { Metadata } from "next";

export const metadata: Metadata = { title: "Join as a dietitian · Health365", robots: { index: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
