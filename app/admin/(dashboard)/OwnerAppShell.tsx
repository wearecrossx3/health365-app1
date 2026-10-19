"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "./AdminSidebar";

// The owner's Admin app (Health365Admin) gets an app-style shell, like the
// Dietitian app: cream screens, a small top bar and a flat bottom menu
// (Home · Chats · Users · More). The website on a computer keeps the sidebar.
const TABS = [
  { k: "home", href: "/admin", label: "Home", perm: "dashboard", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" /></svg> },
  { k: "chats", href: "/admin/consult-chats", label: "Chats", perm: "users", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" /><path d="M8 10h8M8 13h5" /></svg> },
  { k: "users", href: "/admin/users", label: "Users", perm: "users", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinecap="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.6" /><path d="M17 14.2c2.7.2 4.5 2.2 4.5 5" /></svg> },
];
const MORE_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.1"><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>;

export default function OwnerAppShell({ name, permissions, isSuperAdmin, children }: { name: string; permissions: string[]; isSuperAdmin: boolean; children: React.ReactNode }) {
  const path = usePathname() || "/admin";
  const router = useRouter();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);

  const tabs = TABS.filter((t) => permissions.includes(t.perm));
  const items = [...NAV.filter((n) => permissions.includes(n.permission) && n.permission !== "my-clients" && n.href !== "/admin"), ...(isSuperAdmin ? [{ href: "/admin/admin-users", label: "Admin Users", icon: "👥", permission: "dashboard" }] : [])];
  const isTab = tabs.some((t) => t.href === path);
  const current = tabs.find((t) => (t.href === "/admin" ? path === "/admin" : path.startsWith(t.href)))?.k || "more";
  const title = path === "/admin" ? "" : [...items].sort((a, b) => b.href.length - a.href.length).find((n) => path.startsWith(n.href))?.label || "";

  async function logout() {
    await fetch("/api/auth/admin-logout", { method: "POST" });
    location.href = "/admin/login";
  }

  return (
    <div className={"ow" + (path !== "/admin" && !isTab ? " sub" : "")}>
      {path !== "/admin" && !isTab && (
        <div className="ow-top">
          <button className="ow-back" onClick={() => (history.length > 1 ? router.back() : router.push("/admin"))} aria-label="Back">‹</button>
          <b>{title}</b>
        </div>
      )}
      <div className="ow-body">{children}</div>

      {more && (
        <div className="ow-sh" onClick={() => setMore(false)}>
          <div className="ow-shb" onClick={(e) => e.stopPropagation()}>
            <div className="ow-shh"><b>All sections</b><button onClick={() => setMore(false)} aria-label="Close">✕</button></div>
            <div className="ow-grid">
              {items.map((n) => (
                <Link key={n.href} href={n.href} className={path === n.href ? "on" : ""}><span>{n.icon}</span>{n.label}</Link>
              ))}
            </div>
            <div className="ow-me"><span className="ow-av">{(name || "A")[0]}</span><b>{name}</b><button onClick={logout}>Log out</button></div>
          </div>
        </div>
      )}

      <nav className="ow-nav">
        {tabs.map((t) => (
          <Link key={t.k} href={t.href} className={current === t.k && !more ? "on" : ""}>{t.icon}{t.label}</Link>
        ))}
        <button className={current === "more" || more ? "on" : ""} onClick={() => setMore((v) => !v)}>{MORE_ICON}More</button>
      </nav>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  );
}

const CSS = `
body:has(.ow){background:#FFF8F0}
.ow{--g:#4EAA67;--gs:#E6F3E9;--tl:#287379;--cr:#FFF3E5;--bgc:#FFF8F0;--mu:#8A8F98;min-height:100vh;background:var(--bgc);font-family:var(--font-inter),Inter,system-ui,sans-serif}
.ow-body{padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.ow-top{position:sticky;top:0;z-index:30;background:var(--bgc);display:flex;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top)) 16px 10px;border-bottom:1px solid #F1E3D2}
.ow-top b{font-family:var(--font-instrument),Fredoka,sans-serif;font-weight:600;font-size:19px}
.ow-back{width:38px;height:38px;border-radius:12px;background:var(--cr);color:var(--tl);font-size:24px;font-weight:700;border:0;display:grid;place-items:center;line-height:1;cursor:pointer}
.ow main{background:var(--bgc)!important;padding:16px 14px 24px!important;min-height:0!important}
.ow .wrap{padding:0!important}
.ow .eyebrow{display:none}
.ow.sub main h1:first-of-type{display:none}
.ow main>.wrap>div:first-child>p:first-child,.ow.sub main h1+p{margin-top:0!important}
.ow h1{font-family:var(--font-instrument),Fredoka,sans-serif!important;font-weight:600!important;font-size:26px!important;letter-spacing:-.3px}
.ow h2{font-family:var(--font-instrument),Fredoka,sans-serif;font-weight:600}
.ow .panel{border:0!important;border-radius:20px!important;padding:16px!important;box-shadow:0 2px 10px rgba(80,50,20,.04)}
.ow .pill-primary{background:var(--tl)!important;border-color:var(--tl)!important;color:#fff!important}
.ow .pill-outline{background:var(--cr)!important;border-color:transparent!important;color:var(--tl)!important}
.ow input,.ow select,.ow textarea{border-radius:14px!important}
.ow-nav{position:fixed;bottom:0;left:0;right:0;margin:0 auto;max-width:560px;height:calc(72px + env(safe-area-inset-bottom));padding:0 18px env(safe-area-inset-bottom);background:#fff;border-radius:24px 24px 0 0;display:flex;justify-content:space-between;align-items:center;box-shadow:0 -6px 24px rgba(80,50,20,.07);z-index:40}
.ow-nav a,.ow-nav button{width:72px;height:54px;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:500 11.5px var(--font-instrument),Fredoka,sans-serif;color:#a39c92;background:none;border:0;cursor:pointer;text-decoration:none}
.ow-nav svg{stroke:#a39c92}.ow-nav .on{background:var(--gs);color:var(--g)}.ow-nav .on svg{stroke:var(--g)}
.ow-sh{position:fixed;inset:0;z-index:35;background:rgba(31,43,44,.4);display:flex;align-items:flex-end;justify-content:center}
.ow-shb{background:var(--bgc);width:100%;max-width:560px;max-height:80vh;overflow-y:auto;border-radius:24px 24px 0 0;padding:16px 16px calc(92px + env(safe-area-inset-bottom))}
.ow-shh{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.ow-shh b{font-family:var(--font-instrument),Fredoka;font-size:20px;font-weight:600}
.ow-shh button{width:34px;height:34px;border-radius:12px;background:var(--cr);color:var(--tl);border:0;font-weight:700}
.ow-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.ow-grid a{background:#fff;border-radius:18px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;font-size:12px;font-weight:600;color:#1F2B2C;text-decoration:none;line-height:1.2}
.ow-grid a span{font-size:22px;width:44px;height:44px;border-radius:14px;background:var(--cr);display:grid;place-items:center}
.ow-grid a.on{outline:2px solid var(--g)}
.ow-me{display:flex;align-items:center;gap:10px;background:#fff;border-radius:18px;padding:12px;margin-top:12px}
.ow-me b{flex:1;font-size:14.5px}.ow-me button{background:none;border:0;color:#E5394F;font-weight:700;font-size:14px}
.ow-av{width:38px;height:38px;border-radius:50%;background:var(--tl);color:#fff;display:grid;place-items:center;font-weight:700}
`;
