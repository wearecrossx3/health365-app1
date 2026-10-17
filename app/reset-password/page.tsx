import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 520, paddingTop: 56, paddingBottom: 90 }}>
          <ResetForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
