"use client";

import { useState } from "react";
import { ADMIN_PERMISSIONS } from "@/lib/adminPermissions";

interface AdminAccount {
  email: string;
  name: string;
  permissions: string[];
  addedAt: string;
}

function PermissionChecklist({ permissions, onToggle }: { permissions: string[]; onToggle: (key: string) => void }) {
  return (
    <div className="admin-grid-2" style={{ gap: 10 }}>
      {ADMIN_PERMISSIONS.map((p) => (
        <label key={p.key} style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={permissions.includes(p.key)}
            onChange={() => onToggle(p.key)}
            style={{ width: 17, height: 17, marginTop: 2, flexShrink: 0 }}
          />
          <span>
            <span style={{ fontWeight: 600, fontSize: ".87rem", display: "block" }}>{p.label}</span>
            <span style={{ fontSize: ".76rem", color: "var(--ink-soft)" }}>{p.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function AccountCard({ account, onSaved, onDeleted }: {
  account: AdminAccount;
  onSaved: (a: AdminAccount) => void;
  onDeleted: (email: string) => void;
}) {
  const [permissions, setPermissions] = useState<string[]>(account.permissions);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setPermissions((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: account.email, name: account.name, permissions }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      onSaved(data.account);
      setSaved(true);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove admin access for ${account.email}? They'll keep their regular Health365 account — just lose access to this panel.`)) return;
    await fetch("/api/admin/admin-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: account.email }),
    });
    onDeleted(account.email);
  }

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: ".95rem" }}>{account.name}</p>
          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>{account.email}</p>
        </div>
        <span style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", padding: "2px 9px", borderRadius: 100, background: permissions.length ? "var(--sage)" : "var(--paper)", color: permissions.length ? "var(--teal-deep)" : "var(--ink-soft)" }}>
          {permissions.length ? `${permissions.length} section${permissions.length > 1 ? "s" : ""} granted` : "No access granted"}
        </span>
      </div>
      <PermissionChecklist permissions={permissions} onToggle={toggle} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
        <button type="button" onClick={handleSave} disabled={saving} className="pill pill-primary" style={{ padding: "9px 20px", fontSize: ".85rem" }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={handleDelete} style={{ background: "none", border: "none", color: "var(--terracotta)", fontSize: ".82rem", fontWeight: 600, cursor: "pointer" }}>
          Remove access
        </button>
        {saved && <span style={{ color: "var(--teal-deep)", fontSize: ".82rem", fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </div>
  );
}

export default function AdminUsersManager({ initial }: { initial: AdminAccount[] }) {
  const [accounts, setAccounts] = useState<AdminAccount[]>(initial);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleNew(key: string) {
    setPermissions((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter the email address of their existing Health365 account.");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/admin/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, permissions }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setError(data.error || "Couldn't save.");
      return;
    }
    setAccounts((list) => [data.account, ...list.filter((a) => a.email !== data.account.email)]);
    setEmail(""); setName(""); setPermissions([]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <form onSubmit={handleAdd} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: "1.05rem" }}>Add an admin user</h2>
        <div className="admin-grid-2" style={{ gap: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Email <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— their existing account</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dietitian@example.com" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Name <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional, for your reference</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Astha Jadeja" />
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: ".87rem", display: "block", marginBottom: 10 }}>What can they access?</label>
          <PermissionChecklist permissions={permissions} onToggle={toggleNew} />
        </div>
        {error && <p style={{ color: "var(--terracotta)", fontSize: ".85rem" }}>{error}</p>}
        <div>
          <button type="submit" disabled={adding} className="pill pill-primary" style={{ padding: "10px 22px", fontSize: ".85rem" }}>
            {adding ? "Saving…" : "Grant access"}
          </button>
        </div>
      </form>

      {accounts.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "36px 20px" }}>
          <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>No other admin users yet — you're the only one with access.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {accounts.map((a) => (
            <AccountCard
              key={a.email}
              account={a}
              onSaved={(updated) => setAccounts((list) => list.map((x) => (x.email === updated.email ? updated : x)))}
              onDeleted={(email) => setAccounts((list) => list.filter((x) => x.email !== email))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
