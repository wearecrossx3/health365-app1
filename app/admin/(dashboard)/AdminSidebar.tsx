"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", permission: "dashboard" },
  { href: "/admin/content", label: "Site Content", icon: "📝", permission: "content" },
  { href: "/admin/media", label: "Media Library", icon: "🖼️", permission: "media" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "💬", permission: "testimonials" },
  { href: "/admin/diet-plans", label: "Diet Plan Templates", icon: "🥗", permission: "diet-plans" },
  { href: "/admin/messages", label: "Messages", icon: "✉️", permission: "messages" },
  { href: "/admin/settings", label: "Website Settings", icon: "⚙️", permission: "settings" },
  { href: "/admin/app-content", label: "Mobile App", icon: "📱", permission: "app" },
];

export default function AdminSidebar({
  adminName,
  permissions,
  isSuperAdmin,
}: {
  adminName: string;
  permissions: string[];
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const visibleNav = NAV.filter((item) => permissions.includes(item.permission));

  // Close the mobile dropdown whenever the admin navigates somewhere.
  useEffect(() => setOpen(false), [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/admin-logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function navLink(item: (typeof NAV)[number]) {
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
  }

  const adminUsersLink = isSuperAdmin && (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.08)" }}>
      <p style={{ fontSize: ".72rem", fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".04em", padding: "0 12px", marginBottom: 8 }}>
        Owner only
      </p>
      <Link
        href="/admin/admin-users"
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10,
          fontSize: ".88rem", fontWeight: 600,
          color: pathname === "/admin/admin-users" ? "#fff" : "rgba(255,255,255,.6)",
          background: pathname === "/admin/admin-users" ? "rgba(255,255,255,.08)" : "transparent",
        }}
      >
        <span>👥</span>Admin Users
      </Link>
    </div>
  );

  const footer = (
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
  );

  return (
    <>
      {/* Desktop: unchanged fixed vertical sidebar, hidden below 860px */}
      <aside className="admin-sidebar">
        <div style={{ padding: "0 8px 24px" }}>
          <Logo variant="light" height={22} />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {visibleNav.map(navLink)}
          {adminUsersLink}
        </nav>
        {footer}
      </aside>

      {/* Mobile: sticky top bar with a hamburger that drops down the same nav */}
      <div className="admin-mobile-bar">
        <Logo variant="light" height={20} />
        <button className="admin-nav-toggle" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          <span style={{ transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
        </button>
      </div>
      <div className={`admin-mobile-menu${open ? " open" : ""}`}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visibleNav.map(navLink)}
          {adminUsersLink}
        </nav>
        {footer}
      </div>
    </>
  );
}
