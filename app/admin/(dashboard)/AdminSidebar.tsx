"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/content", label: "Site Content", icon: "📝" },
  { href: "/admin/media", label: "Media Library", icon: "🖼️" },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside
      style={{
        width: 240, flex: "none", background: "#0F1613", color: "#fff",
        display: "flex", flexDirection: "column", padding: "24px 16px",
        position: "sticky", top: 0, height: "100vh",
      }}
    >
      <div style={{ padding: "0 8px 24px" }}>
        <Logo variant="light" height={22} />
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10,
                fontSize: ".88rem", fontWeight: 600, color: active ? "#fff" : "rgba(255,255,255,.6)",
                background: active ? "rgba(255,255,255,.08)" : "transparent",
              }}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          );
        })}

        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <p style={{ fontSize: ".72rem", fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".04em", padding: "0 12px", marginBottom: 8 }}>
            Coming soon
          </p>
          {["Testimonials", "Blog / Articles", "Website Settings", "Admin Users"].map((label) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", fontSize: ".84rem", color: "rgba(255,255,255,.28)" }}>
              {label}
            </div>
          ))}
        </div>
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 16, marginTop: 16 }}>
        <p style={{ fontSize: ".82rem", fontWeight: 600, color: "#fff", padding: "0 12px", marginBottom: 8 }}>{adminName}</p>
        <button
          onClick={handleLogout}
          style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, background: "none", border: "none", color: "rgba(255,255,255,.6)", fontSize: ".86rem", fontWeight: 600, cursor: "pointer" }}
        >
          ⏻ Logout
        </button>
        <Link href="/" style={{ display: "block", padding: "10px 12px", fontSize: ".8rem", color: "rgba(255,255,255,.4)" }}>
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
