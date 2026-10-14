"use client";

import { useEffect, useMemo, useState } from "react";

interface Food { id: string; name: string; aliases?: string; group: string; kcal: number; protein: number; fat: number; carbs: number; fibre: number; per: string; serving?: string; src: string; custom?: boolean }
interface Db { dishes: Food[]; foods: Food[]; hidden: string[]; source: string }

const cell = { padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8, fontSize: ".82rem", width: "100%" } as const;

export default function FoodsManager() {
  const [db, setDb] = useState<Db | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"dishes" | "foods">("dishes");
  const [edit, setEdit] = useState<Food | null>(null);
  const [adding, setAdding] = useState<Partial<Food> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/admin/foods").then((r) => r.json()).then(setDb);
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (!db) return [];
    const s = q.trim().toLowerCase();
    const src = tab === "dishes" ? db.dishes : db.foods;
    return src.filter((f) => !s || `${f.name} ${f.aliases || ""} ${f.group}`.toLowerCase().includes(s)).slice(0, 80);
  }, [db, q, tab]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/admin/foods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    setEdit(null); setAdding(null);
    load();
  }

  if (!db) return <p style={{ color: "var(--ink-soft)" }}>Loading…</p>;
  const hidden = new Set(db.hidden || []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className={`pill ${tab === "dishes" ? "pill-primary" : ""}`} onClick={() => setTab("dishes")}>Dishes ({db.dishes.length}) · per serving</button>
        <button className={`pill ${tab === "foods" ? "pill-primary" : ""}`} onClick={() => setTab("foods")}>Ingredients ({db.foods.length}) · per 100 g</button>
        <button className="pill" onClick={() => setAdding({ name: "", per: tab === "dishes" ? "serving" : "100g", serving: "1 katori", kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, group: "Custom" })}>+ Add food</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — e.g. roti, dal, paneer, bajra, kela…" style={{ padding: "12px 16px", border: "1px solid var(--line)", borderRadius: 999, fontSize: ".92rem", background: "#fff" }} />

      {adding && (
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ fontSize: "1rem" }}>Add a food</h3>
          <div className="adm-cols" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            <input style={cell} placeholder="Name" value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
            <select style={cell} value={adding.per} onChange={(e) => setAdding({ ...adding, per: e.target.value })}><option value="serving">Per serving</option><option value="100g">Per 100 g</option></select>
            <input style={cell} placeholder="Serving e.g. 1 katori" disabled={adding.per !== "serving"} value={adding.serving} onChange={(e) => setAdding({ ...adding, serving: e.target.value })} />
          </div>
          <div className="adm-cols5" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
            {(["kcal", "protein", "carbs", "fat", "fibre"] as const).map((k) => (
              <label key={k} style={{ fontSize: ".72rem", fontWeight: 700 }}>{k}{k === "kcal" ? "" : " (g)"}<input type="number" style={cell} value={adding[k] as number} onChange={(e) => setAdding({ ...adding, [k]: Number(e.target.value) })} /></label>
            ))}
          </div>
          <input style={cell} placeholder="Other names for search (optional) — e.g. khakhra, khakra" value={adding.aliases || ""} onChange={(e) => setAdding({ ...adding, aliases: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pill pill-primary" disabled={busy || !adding.name} onClick={() => post({ action: "add", values: adding })}>Add</button>
            <button className="pill" onClick={() => setAdding(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".84rem" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper)" }}>
              {["Food", tab === "dishes" ? "Serving" : "Group", "kcal", "Protein", "Carbs", "Fat", "Fibre", ""].map((h) => <th key={h} style={{ padding: "10px 12px", fontWeight: 700 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const isEdit = edit?.id === f.id;
              const off = hidden.has(f.id);
              return (
                <tr key={f.id} style={{ borderTop: "1px solid var(--line)", opacity: off ? 0.45 : 1 }}>
                  <td style={{ padding: "8px 12px", minWidth: 180 }}>
                    {isEdit ? <input style={cell} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : <><b>{f.name}</b>{f.custom && <span style={{ fontSize: ".7rem", color: "#287379" }}> · custom</span>}</>}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-soft)" }}>{isEdit && f.per === "serving" ? <input style={cell} value={edit.serving || ""} onChange={(e) => setEdit({ ...edit, serving: e.target.value })} /> : tab === "dishes" ? f.serving : f.group}</td>
                  {(["kcal", "protein", "carbs", "fat", "fibre"] as const).map((k) => (
                    <td key={k} style={{ padding: "8px 12px", width: 72 }}>{isEdit ? <input type="number" style={cell} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: Number(e.target.value) })} /> : f[k]}</td>
                  ))}
                  <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                    {isEdit ? (
                      <>
                        <button disabled={busy} onClick={() => post({ action: "edit", id: f.id, values: edit })} style={{ background: "none", border: "none", color: "#2E7D4F", fontWeight: 700, cursor: "pointer" }}>Save</button>
                        <button onClick={() => setEdit(null)} style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer" }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEdit(f)} style={{ background: "none", border: "none", color: "#287379", fontWeight: 700, cursor: "pointer" }}>Edit</button>
                        {f.custom ? (
                          <button onClick={() => confirm("Remove this custom food?") && post({ action: "remove", id: f.id })} style={{ background: "none", border: "none", color: "var(--terracotta)", cursor: "pointer" }}>Remove</button>
                        ) : (
                          <button onClick={() => post({ action: off ? "show" : "hide", id: f.id })} style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer" }}>{off ? "Show" : "Hide"}</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 80 && <p style={{ padding: 12, fontSize: ".8rem", color: "var(--ink-soft)" }}>Showing the first 80 — search to narrow down.</p>}
      </div>
      <p style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>Source: {db.source}.</p>
    </div>
  );
}
