"use client";

import { useEffect, useMemo, useState } from "react";

// Shared by Admin → Plan Generator and Admin → Users & Plans.
// Generates a realistic Indian plan, lets the dietitian tweak any meal,
// then assigns it to a user (it shows up in their app).

interface Item { name: string; portion: string; kcal: number; protein: number }
interface Meal { slot: string; label: string; time: string; title: string; items: Item[]; kcal: number; protein: number; carbs: number; fat: number; fibre: number; alt: string }
interface Day { day: number; label: string; meals: Meal[]; kcal: number; protein: number }
export interface Plan { title: string; goal: string; diet: string; region: string; conditions: string[]; targetKcal: number; days: Day[]; tips: string[]; source: string }
interface UserRow { id: string; name: string; email: string; phone: string }

const GOALS = [["lose", "Lose weight"], ["maintain", "Maintain"], ["gain", "Gain weight"], ["better", "Eat better"]];
const DIETS = [["veg", "Vegetarian"], ["eggetarian", "Eggetarian"], ["nonveg", "Non-veg"], ["jain", "Jain"], ["vegan", "Vegan"]];
const REGIONS = [["gujarati", "Gujarati"], ["north", "North Indian"], ["south", "South Indian"], ["mixed", "Mixed"]];
const CONDS = [["diabetes", "Diabetes"], ["pcos", "PCOS"], ["thyroid", "Thyroid"], ["cholesterol", "Cholesterol"], ["digestive", "Digestive"], ["weight", "Weight mgmt"], ["oncology", "Cancer care"]];

const chip = (on: boolean) => ({
  padding: "7px 12px", borderRadius: 999, fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
  border: `1.5px solid ${on ? "#287379" : "var(--line)"}`, background: on ? "#E3F0F0" : "#fff", color: on ? "#1E5A5F" : "var(--ink)",
});

export default function PlanBuilder({ fixedUser, onAssigned }: { fixedUser?: UserRow; onAssigned?: () => void }) {
  const [goal, setGoal] = useState("lose");
  const [diet, setDiet] = useState("veg");
  const [region, setRegion] = useState("gujarati");
  const [conds, setConds] = useState<string[]>([]);
  const [kcal, setKcal] = useState("");
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [openDay, setOpenDay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState(fixedUser?.id || "");
  const [note, setNote] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [signedAs, setSignedAs] = useState("Dt. Astha Jadeja");

  useEffect(() => {
    if (fixedUser) return;
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users || [])).catch(() => {});
  }, [fixedUser]);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return users.filter((u) => [u.name, u.email, u.phone].some((x) => (x || "").toLowerCase().includes(s))).slice(0, 6);
  }, [q, users]);
  const chosen = fixedUser || users.find((u) => u.id === userId);

  async function generate() {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/admin/plan-generator", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, diet, region, conditions: conds, targetKcal: Number(kcal) || undefined, days }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error || "Couldn't generate." });
    setPlan(d.plan); setOpenDay(0);
  }

  function editItem(di: number, mi: number, ii: number, patch: Partial<Item>) {
    if (!plan) return;
    const p = structuredClone(plan);
    const meal = p.days[di].meals[mi];
    meal.items[ii] = { ...meal.items[ii], ...patch };
    meal.kcal = meal.items.reduce((s, x) => s + (Number(x.kcal) || 0), 0);
    meal.title = meal.items.map((x) => x.name).join(" + ");
    p.days[di].kcal = p.days[di].meals.reduce((s, m) => s + m.kcal, 0);
    setPlan(p);
  }
  function removeItem(di: number, mi: number, ii: number) {
    if (!plan) return;
    const p = structuredClone(plan);
    p.days[di].meals[mi].items.splice(ii, 1);
    const meal = p.days[di].meals[mi];
    meal.kcal = meal.items.reduce((s, x) => s + (Number(x.kcal) || 0), 0);
    meal.title = meal.items.map((x) => x.name).join(" + ");
    p.days[di].kcal = p.days[di].meals.reduce((s, m) => s + m.kcal, 0);
    setPlan(p);
  }
  function addItem(di: number, mi: number) {
    if (!plan) return;
    const p = structuredClone(plan);
    p.days[di].meals[mi].items.push({ name: "New item", portion: "1 katori", kcal: 0, protein: 0 });
    setPlan(p);
  }

  async function assign() {
    if (!plan || !chosen) return;
    setBusy(true); setMsg(null);
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign", userId: chosen.id, plan, note, startsOn, signedAs }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error || "Couldn't assign." });
    setMsg({ ok: true, text: `✓ Sent to ${chosen.name}. It shows in their app the next time it opens.` });
    onAssigned?.();
  }

  const d = plan?.days[openDay];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: ".85rem", marginBottom: 8 }}>Goal</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{GOALS.map(([k, l]) => <button type="button" key={k} style={chip(goal === k)} onClick={() => setGoal(k)}>{l}</button>)}</div>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: ".85rem", marginBottom: 8 }}>Food preference</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{DIETS.map(([k, l]) => <button type="button" key={k} style={chip(diet === k)} onClick={() => setDiet(k)}>{l}</button>)}</div>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: ".85rem", marginBottom: 8 }}>Kitchen style</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{REGIONS.map(([k, l]) => <button type="button" key={k} style={chip(region === k)} onClick={() => setRegion(k)}>{l}</button>)}</div>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: ".85rem", marginBottom: 8 }}>Health conditions <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional, pick any</span></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{CONDS.map(([k, l]) => <button type="button" key={k} style={chip(conds.includes(k))} onClick={() => setConds((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))}>{l}</button>)}</div>
        </div>
        <div className="admin-grid-2" style={{ gap: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Calories per day <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— empty = based on goal</span></label>
            <input type="number" min={1100} max={3200} step={50} value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder={goal === "lose" ? "1400" : goal === "gain" ? "2300" : "1800"} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Plan length</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={chip(days === 7)} onClick={() => setDays(7)}>7 days</button>
              <button type="button" style={chip(days === 1)} onClick={() => setDays(1)}>1 day</button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="pill pill-primary" disabled={busy} onClick={generate}>{busy ? "Working…" : plan ? "↻ Generate another" : "Generate plan"}</button>
        </div>
        <p style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>Calories are worked out from USDA FoodData Central values (public domain) using standard Indian home recipes. Every click makes a different week.</p>
      </div>

      {plan && d && (
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Plan title</label>
            <input value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {plan.days.map((x, i) => (
              <button type="button" key={i} onClick={() => setOpenDay(i)} style={{ ...chip(openDay === i), flex: "none" }}>
                {x.label} · {x.kcal} kcal
              </button>
            ))}
          </div>
          {d.meals.map((m, mi) => (
            <div key={mi} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <p style={{ fontWeight: 700 }}>{m.label} <span style={{ fontWeight: 500, color: "var(--ink-soft)", fontSize: ".8rem" }}>· {m.time}</span></p>
                <p style={{ fontWeight: 700, color: "#287379" }}>{m.kcal} kcal</p>
              </div>
              {m.items.map((it, ii) => (
                <div key={ii} className="adm-item" style={{ display: "grid", gridTemplateColumns: "1fr 120px 74px 24px", gap: 6, marginBottom: 6 }}>
                  <input value={it.name} onChange={(e) => editItem(openDay, mi, ii, { name: e.target.value })} style={{ padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: ".85rem" }} />
                  <input value={it.portion} onChange={(e) => editItem(openDay, mi, ii, { portion: e.target.value })} style={{ padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: ".85rem" }} />
                  <input type="number" value={it.kcal} onChange={(e) => editItem(openDay, mi, ii, { kcal: Number(e.target.value) || 0 })} style={{ padding: "7px 8px", border: "1px solid var(--line)", borderRadius: 8, fontSize: ".85rem" }} />
                  <button type="button" title="Remove" onClick={() => removeItem(openDay, mi, ii)} style={{ background: "none", border: "none", color: "var(--terracotta)", cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <button type="button" onClick={() => addItem(openDay, mi)} style={{ background: "none", border: "none", color: "#287379", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", padding: 0 }}>+ Add item</button>
            </div>
          ))}
          <div style={{ background: "var(--paper)", borderRadius: 14, padding: 14, fontSize: ".85rem" }}>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>Tips shown with the plan</p>
            <ul style={{ paddingLeft: 18, margin: 0 }}>{plan.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        </div>
      )}

      {plan && (
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: "1.05rem" }}>Send this plan to a user</h2>
          {!fixedUser && (
            <div className="field" style={{ marginBottom: 0, position: "relative" }}>
              <label>Find user <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— name, email or phone</span></label>
              <input value={chosen && !q ? `${chosen.name} · ${chosen.email}` : q} onChange={(e) => { setQ(e.target.value); setUserId(""); }} placeholder="Start typing…" />
              {matches.length > 0 && !userId && (
                <div style={{ border: "1px solid var(--line)", borderRadius: 12, marginTop: 6, overflow: "hidden" }}>
                  {matches.map((u) => (
                    <button type="button" key={u.id} onClick={() => { setUserId(u.id); setQ(""); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "#fff", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: ".86rem" }}>
                      <b>{u.name}</b> · {u.email}{u.phone ? ` · ${u.phone}` : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {fixedUser && <p style={{ fontSize: ".9rem" }}>For <b>{fixedUser.name}</b> · {fixedUser.email}</p>}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Personal note <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— shown at the top of their plan</span></label>
            <textarea rows={2} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Start with this for 2 weeks. Message me on WhatsApp if you feel low on energy." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>From <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— the name the user sees on the plan</span></label>
            <input value={signedAs} maxLength={60} onChange={(e) => setSignedAs(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0, maxWidth: 240 }}>
            <label>Start date <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional</span></label>
            <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
          </div>
          {msg && <p style={{ fontSize: ".88rem", color: msg.ok ? "#256B3C" : "var(--terracotta)", fontWeight: 600 }}>{msg.text}</p>}
          <div><button type="button" className="pill pill-primary" disabled={busy || !chosen} onClick={assign}>{busy ? "Sending…" : "Assign plan"}</button></div>
        </div>
      )}
    </div>
  );
}
