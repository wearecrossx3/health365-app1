"use client";

import { useEffect, useMemo, useState } from "react";

// Shared by Admin → Plan Generator and Admin → Users & Plans.
// Generates a realistic Indian plan, lets the dietitian tweak any meal,
// then assigns it to a user (it shows up in their app).

// _b = per-unit values from the food database, kept only while editing so a
// new portion ("150 g", "2 medium") re-works the calories. Removed on send.
interface Base { kcal: number; protein: number; per: "100g" | "serving"; serving: string }
interface Item { name: string; portion: string; kcal: number; protein: number; _b?: Base }
type FoodRow = [string, string, string, string, number, number, number, number, number, string, string];
export interface ClientInfo { goal?: string; diet?: string; conditions?: string[]; allergens?: string[]; kcal?: number; basis?: string; notes?: string }
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

// `portal` = Dietitian portal mode: its own generate/assign endpoints, and the
// plan is always signed with the dietitian's own name (set on the server).
// Work out kcal/protein for a typed portion from the food's base values.
function scale(b: Base, portion: string): { kcal: number; protein: number } | null {
  const n = parseFloat((portion.match(/(\d+(?:\.\d+)?)/) || [])[1] || "");
  if (!n) return null;
  if (b.per === "100g") {
    if (!/\b(g|gm|gram|grams|ml)\b/i.test(portion)) return null;
    return { kcal: Math.round((b.kcal * n) / 100), protein: Math.round((b.protein * n) / 10) / 10 };
  }
  // per serving: "2 medium", "1.5 katori", "½" not handled
  return { kcal: Math.round(b.kcal * n), protein: Math.round(b.protein * n * 10) / 10 };
}
const clean = (p: Plan): Plan => ({ ...p, days: p.days.map((d) => ({ ...d, meals: d.meals.map((m) => ({ ...m, items: m.items.map(({ _b, ...it }) => it) })) })) }); // eslint-disable-line @typescript-eslint/no-unused-vars

export default function PlanBuilder({ fixedUser, onAssigned, portal, initialPlan, initialInput, editId, client }: { fixedUser?: UserRow; onAssigned?: () => void; portal?: { generateUrl: string; assignUrl: string }; initialPlan?: Plan | null; initialInput?: { goal: string; diet: string; conditions: string[]; kcal: number; basis: string } | null; editId?: string; client?: ClientInfo | null }) {
  const [goal, setGoal] = useState(initialInput?.goal || "lose");
  const [diet, setDiet] = useState(initialInput?.diet || "veg");
  const [region, setRegion] = useState("gujarati");
  const [conds, setConds] = useState<string[]>(initialInput?.conditions || []);
  const [kcal, setKcal] = useState(editId && initialPlan?.targetKcal ? String(initialPlan.targetKcal) : initialInput?.kcal ? String(initialInput.kcal) : "");
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState<Plan | null>(initialPlan || null);
  const [openDay, setOpenDay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [sugAt, setSugAt] = useState<string>(""); // "day-meal-item" whose name box shows suggestions

  useEffect(() => {
    fetch("/api/app/foods?compact=1").then((r) => r.json()).then((j) => setFoods(j.rows || [])).catch(() => {});
  }, []);
  const suggestFor = (text: string) => {
    const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return [];
    return foods
      .filter((f) => { const h = `${f[1]} ${f[2]}`.toLowerCase(); return words.every((w) => h.includes(w)); })
      .sort((a, b) => (a[9] === "serving" ? 0 : 1) - (b[9] === "serving" ? 0 : 1) || a[1].length - b[1].length)
      .slice(0, 8);
  };
  const target = Number(kcal) || plan?.targetKcal || 0;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState(fixedUser?.id || "");
  const [note, setNote] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [signedAs, setSignedAs] = useState("Dt. Astha Jadeja");

  useEffect(() => {
    if (fixedUser || portal) return;
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users || [])).catch(() => {});
  }, [fixedUser, portal]);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return users.filter((u) => [u.name, u.email, u.phone].some((x) => (x || "").toLowerCase().includes(s))).slice(0, 6);
  }, [q, users]);
  const chosen = fixedUser || users.find((u) => u.id === userId);

  async function generate() {
    setBusy(true); setMsg(null);
    const res = await fetch(portal?.generateUrl || "/api/admin/plan-generator", {
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
    const next = { ...meal.items[ii], ...patch };
    if (patch.portion !== undefined && next._b) { const sc = scale(next._b, patch.portion); if (sc) Object.assign(next, sc); }
    meal.items[ii] = next;
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
  function pickFood(di: number, mi: number, ii: number, f: FoodRow) {
    const per = f[9] === "serving" ? "serving" : "100g";
    const b: Base = { kcal: f[4], protein: f[5], per, serving: f[10] };
    editItem(di, mi, ii, { name: f[1], portion: per === "serving" ? f[10] || "1 serving" : "100 g", kcal: Math.round(f[4]), protein: Math.round(f[5] * 10) / 10, _b: b });
    setSugAt("");
  }
  function addItem(di: number, mi: number) {
    if (!plan) return;
    const p = structuredClone(plan);
    p.days[di].meals[mi].items.push({ name: "", portion: "", kcal: 0, protein: 0 });
    setSugAt(`${di}-${mi}-${p.days[di].meals[mi].items.length - 1}`);
    setPlan(p);
  }

  async function assign() {
    if (!plan || !chosen) return;
    setBusy(true); setMsg(null);
    const res = await fetch(portal?.assignUrl || "/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign", userId: chosen.id, plan: clean({ ...plan, targetKcal: Number(kcal) || plan.targetKcal }), note, startsOn, signedAs, replaceId: editId || undefined }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error || "Couldn't assign." });
    setMsg({ ok: true, text: editId ? `✓ Changes saved. ${chosen.name} sees the updated plan the next time the app opens.` : `✓ Sent to ${chosen.name}. It shows in their app the next time it opens.` });
    onAssigned?.();
  }

  const d = plan?.days[openDay];

  const cl = client || (initialInput ? { goal: initialInput.goal, diet: initialInput.diet, conditions: initialInput.conditions, kcal: initialInput.kcal, basis: initialInput.basis } : null);
  const goalName = (k?: string) => GOALS.find(([x]) => x === k)?.[1] || k || "";
  const dietName = (k?: string) => DIETS.find(([x]) => x === k)?.[1] || k || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {cl && (
        <div className="panel" style={{ background: "#F2F8F6", border: "1.5px solid #BFDCD5", display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontWeight: 700, color: "#1E5A5F" }}>📋 About this client — make the plan for this</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: ".85rem" }}>
            {cl.goal && <span style={{ background: "#fff", borderRadius: 999, padding: "5px 12px", border: "1px solid var(--line)" }}>Goal: <b>{goalName(cl.goal)}</b></span>}
            {cl.diet && <span style={{ background: "#fff", borderRadius: 999, padding: "5px 12px", border: "1px solid var(--line)" }}>Food: <b>{dietName(cl.diet)}</b></span>}
            <span style={{ background: "#fff", borderRadius: 999, padding: "5px 12px", border: "1px solid var(--line)" }}>Target: <b>{cl.kcal ? `${cl.kcal} kcal/day` : "not enough details"}</b></span>
          </div>
          <p style={{ fontSize: ".88rem" }}><b style={{ color: (cl.conditions || []).length ? "#A5371F" : "inherit" }}>Conditions:</b> {(cl.conditions || []).length ? (cl.conditions || []).join(", ") : "None mentioned"}</p>
          {(cl.allergens || []).length > 0 && <p style={{ fontSize: ".88rem" }}><b style={{ color: "#A5371F" }}>Avoid / allergies:</b> {(cl.allergens || []).join(", ")}</p>}
          {cl.basis && <p style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>Calories worked out from: {cl.basis}</p>}
          {cl.notes && <p style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>{cl.notes}</p>}
        </div>
      )}
      {editId && <p style={{ background: "#FFF6E5", border: "1px solid #F2D49B", borderRadius: 12, padding: "10px 14px", fontSize: ".86rem", fontWeight: 600 }}>✏️ You are editing a plan that was already sent. Saving replaces it in the client&apos;s app.</p>}
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
            <label>Calories per day <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— {initialInput?.kcal ? "worked out from the client's form" : "empty = based on goal"}</span></label>
            <input type="number" min={1100} max={3200} step={50} value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder={goal === "lose" ? "1400" : goal === "gain" ? "2300" : "1800"} />
            {initialInput?.basis && <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", marginTop: 4 }}>From the form: {initialInput.basis}. Change it if you like.</p>}
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
        <p style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>Calories are worked out from USDA FoodData Central values (public domain) using standard Indian home recipes. Every click makes a different week. While editing, type in a food box to pick from the food list — calories fill in, and change when you change the portion (e.g. &ldquo;150 g&rdquo; or &ldquo;2 medium&rdquo;).</p>
      </div>

      {plan && d && (
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Plan title</label>
            <input value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {plan.days.map((x, i) => (
              <button type="button" key={i} onClick={() => setOpenDay(i)} style={{ ...chip(openDay === i), flex: "none", ...(target && Math.abs(x.kcal - target) > target * 0.1 ? { color: "#A5371F" } : {}) }}>
                {x.label} · {x.kcal} kcal
              </button>
            ))}
          </div>
          {target > 0 && (() => {
            const diff = d.kcal - target; const off = Math.abs(diff) > target * 0.1;
            return <p style={{ fontSize: ".86rem", fontWeight: 600, padding: "8px 12px", borderRadius: 10, background: off ? "#FBE9E5" : "#E7F0DC", color: off ? "#A5371F" : "#2E6B3C" }}>{d.label}: {d.kcal} kcal · target {target} kcal · {diff === 0 ? "on target ✓" : `${Math.abs(diff)} kcal ${diff > 0 ? "over" : "under"}${off ? " — adjust portions" : " ✓"}`}</p>;
          })()}
          {d.meals.map((m, mi) => (
            <div key={mi} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <p style={{ fontWeight: 700 }}>{m.label} <span style={{ fontWeight: 500, color: "var(--ink-soft)", fontSize: ".8rem" }}>· {m.time}</span></p>
                <p style={{ fontWeight: 700, color: "#287379" }}>{m.kcal} kcal</p>
              </div>
              {m.items.map((it, ii) => (
                <div key={ii} className="adm-item" style={{ display: "grid", gridTemplateColumns: "1fr 120px 74px 24px", gap: 6, marginBottom: 6 }}>
                  <div style={{ position: "relative" }}>
                    <input value={it.name} placeholder="Type a food, e.g. barley" onFocus={() => setSugAt(`${openDay}-${mi}-${ii}`)} onBlur={() => setTimeout(() => setSugAt((v) => (v === `${openDay}-${mi}-${ii}` ? "" : v)), 180)} onChange={(e) => { editItem(openDay, mi, ii, { name: e.target.value, _b: undefined }); setSugAt(`${openDay}-${mi}-${ii}`); }} style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: ".85rem" }} />
                    {sugAt === `${openDay}-${mi}-${ii}` && suggestFor(it.name).length > 0 && (
                      <div style={{ position: "absolute", zIndex: 30, top: "100%", left: 0, right: -200, marginTop: 4, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 10px 28px rgba(0,0,0,.14)", overflow: "hidden" }}>
                        {suggestFor(it.name).map((f) => (
                          <button type="button" key={f[0]} onMouseDown={(e) => { e.preventDefault(); pickFood(openDay, mi, ii, f); }} style={{ display: "flex", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", padding: "8px 12px", background: "#fff", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: ".84rem" }}>
                            <span><b>{f[1]}</b> <span style={{ color: "var(--ink-soft)" }}>· {f[9] === "serving" ? f[10] : "per 100 g"}</span></span>
                            <span style={{ fontWeight: 700, color: "#287379", flex: "none" }}>{Math.round(f[4])} kcal</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
          {fixedUser && <p style={{ fontSize: ".9rem" }}>For <b>{fixedUser.name}</b>{fixedUser.email ? ` · ${fixedUser.email}` : ""}</p>}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Personal note <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— shown at the top of their plan</span></label>
            <textarea rows={2} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} placeholder={portal ? "e.g. Start with this for 2 weeks. Message me in the chat if you feel low on energy." : "e.g. Start with this for 2 weeks. Message me on WhatsApp if you feel low on energy."} />
          </div>
          {!portal && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label>From <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— the name the user sees on the plan</span></label>
            <input value={signedAs} maxLength={60} onChange={(e) => setSignedAs(e.target.value)} />
          </div>
          )}
          <div className="field" style={{ marginBottom: 0, maxWidth: 240 }}>
            <label>Start date <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— optional</span></label>
            <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
          </div>
          {msg && <p style={{ fontSize: ".88rem", color: msg.ok ? "#256B3C" : "var(--terracotta)", fontWeight: 600 }}>{msg.text}</p>}
          <div><button type="button" className="pill pill-primary" disabled={busy || !chosen} onClick={assign}>{busy ? "Saving…" : editId ? "Save changes" : "Assign plan"}</button></div>
        </div>
      )}
    </div>
  );
}
