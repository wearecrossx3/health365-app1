import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 520, paddingTop: 56, paddingBottom: 90 }}>
          <ForgotForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
