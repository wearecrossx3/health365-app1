"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

interface Condition {
  key: string; name: string; photo: string; tag: string; overview: string;
  considerations: string[]; included: string[]; moderation: string[]; consult: string;
}

const conditions: Condition[] = [
  {
    key: "diabetes", name: "Diabetes", photo: "ph-teal", tag: "Steadier meals, smarter carbs.",
    overview: "Diabetes nutrition is less about cutting carbs entirely and more about steadier, more predictable meals — spacing them out, pairing carbs with protein and fibre, and keeping portions consistent day to day.",
    considerations: ["Favor complex, slower-digesting carbs over refined ones", "Spread carbohydrate intake evenly across meals", "Pair carbs with protein or fibre to slow absorption", "Keep meal timing consistent where possible"],
    included: ["Whole grains — millets, brown rice, whole wheat", "Legumes and pulses (dal, chana, rajma)", "Non-starchy vegetables", "Lean protein — paneer, tofu, eggs, fish"],
    moderation: ["Refined sugar and sweets", "White rice and maida-based foods in large portions", "Fruit juices", "Deep-fried snacks"],
    consult: "If blood sugar is poorly controlled, or you're on insulin or other glucose-lowering medication, meal planning should be coordinated with your doctor and a dietitian.",
  },
  {
    key: "pcos", name: "PCOS", photo: "ph-rose", tag: "Hormone-aware eating that fits your routine.",
    overview: "PCOS nutrition often centers on supporting insulin sensitivity and hormonal balance through steady blood sugar, adequate protein, and regular movement — not restrictive dieting.",
    considerations: ["Prioritize protein and fibre at each meal", "Include healthy fats (nuts, seeds, ghee in moderation)", "Regular meal timing tends to help more than skipping meals", "Gentle, consistent movement supports insulin sensitivity"],
    included: ["High-fibre vegetables and whole grains", "Protein-rich foods — legumes, eggs, paneer, fish", "Healthy fats — nuts, seeds, olive oil", "Anti-inflammatory foods — turmeric, leafy greens, berries"],
    moderation: ["Refined carbohydrates and added sugar", "Ultra-processed and fried foods", "Excess dairy, if it worsens symptoms for you"],
    consult: "PCOS presents differently person to person — a plan built around your specific labs and history, ideally with your gynecologist and a dietitian working together.",
  },
  {
    key: "thyroid", name: "Thyroid", photo: "ph-sand", tag: "Support alongside your treatment.",
    overview: "Thyroid nutrition works alongside medical treatment, not instead of it — the goal is supporting energy, metabolism, and nutrient needs while your medication does the heavy lifting.",
    considerations: ["Iodine and selenium play a role — supplementing without guidance can backfire", "Take medication on an empty stomach, away from calcium/iron, as directed", "Adequate protein supports energy and metabolism", "Fibre and hydration help with common digestive slowdown"],
    included: ["Iodine-appropriate foods — as advised by your doctor", "Selenium sources — brazil nuts, eggs, sunflower seeds", "Whole grains and vegetables for fibre", "Protein at each meal"],
    moderation: ["Excess raw cruciferous vegetables in very large amounts", "Timing supplements too close to medication", "Highly processed foods"],
    consult: "Thyroid nutrition should never be self-directed around medication timing or supplementation — that needs your doctor and a dietitian working from your actual labs.",
  },
  {
    key: "weight", name: "Weight Management", photo: "ph-olive", tag: "Sustainable change, not a crash diet.",
    overview: "Sustainable weight change comes from a routine you can actually keep — a moderate, consistent gap between intake and expenditure, built around foods you genuinely enjoy.",
    considerations: ["Small, consistent changes tend to stick better than dramatic restriction", "Protein and fibre help manage hunger between meals", "Regular movement matters as much as what's on the plate", "Sleep and stress both affect weight more than people expect"],
    included: ["Vegetables and whole fruits", "Lean protein at each meal", "Whole grains in moderate portions", "Plenty of water throughout the day"],
    moderation: ["Very low-calorie or crash approaches", "Liquid calories — sugary drinks, excess juice", "Late-night heavy meals, if disruptive to sleep"],
    consult: "If previous attempts involved extreme restriction, or a health condition sits alongside the weight goal, a dietitian can help build something that holds up long-term.",
  },
  {
    key: "cholesterol", name: "Cholesterol", photo: "ph-terra", tag: "Heart-friendly swaps you'll enjoy.",
    overview: "Managing cholesterol through food is mostly about the type of fat, not the total amount — shifting toward unsaturated fats and fibre while trimming back on saturated and trans fats.",
    considerations: ["Swap saturated fats for unsaturated ones where practical", "Soluble fibre (oats, legumes, fruits) can help lower LDL", "Limit trans fats — often hiding in packaged/fried snacks", "Regular movement supports healthy cholesterol levels"],
    included: ["Oats and whole grains", "Legumes and pulses", "Nuts and seeds in moderate portions", "Fatty fish, if part of your diet"],
    moderation: ["Deep-fried and packaged snack foods", "Excess red and processed meat", "High-fat dairy in large quantities"],
    consult: "If cholesterol numbers are significantly elevated or you're on medication like statins, food changes should be planned alongside your doctor's guidance.",
  },
  {
    key: "digestive", name: "Digestive Health", photo: "ph-ink", tag: "Gut-friendly meals, built gradually.",
    overview: "Digestive comfort usually improves with gradual, consistent changes — enough fibre, enough water, and identifying personal triggers — rather than sudden overhauls.",
    considerations: ["Increase fibre gradually to avoid bloating", "Stay consistently hydrated — fibre needs water to work well", "Regular meal timing supports gut rhythm", "Everyone's triggers are a little different"],
    included: ["Fibre-rich vegetables and fruits, added gradually", "Fermented foods — curd, buttermilk, idli/dosa batter", "Adequate water throughout the day", "Smaller, more frequent meals if large meals feel heavy"],
    moderation: ["Very spicy or heavily fried food, if it triggers discomfort", "Carbonated drinks", "Sudden large increases in fibre"],
    consult: "Persistent digestive symptoms — pain, blood, unexplained weight loss — need a doctor's evaluation, not just a dietary tweak.",
  },
];

export default function ConditionsPage() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = conditions.find((c) => c.key === activeKey) || null;

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ maxWidth: 980, paddingTop: 72, paddingBottom: 100 }}>
          <div style={{ marginBottom: 64, maxWidth: 620 }}>
            <span className="luma-eyebrow">Conditions</span>
            <h1 style={{ fontSize: "clamp(2.1rem,4vw,2.9rem)", fontWeight: 500 }}>
              Made for <span className="luma-mark">real-life</span> <span className="luma-highlight">health goals.</span>
            </h1>
            <p style={{ marginTop: 18, fontSize: "1.05rem", lineHeight: 1.7 }}>
              General nutrition guidance for common conditions — always paired with an option to talk to a qualified dietitian.
            </p>
          </div>

          <div className="cond-grid">
            {conditions.map((c) => (
              <div key={c.key} className={`cond-tile luma-tile${activeKey === c.key ? " active" : ""}`} onClick={() => setActiveKey(c.key)}>
                <div className={`photo ${c.photo} grain`} />
                <div className="body"><h3>{c.name}</h3><p>{c.tag}</p></div>
              </div>
            ))}
          </div>

          {active && (
            <div style={{ marginTop: 80, paddingTop: 64, borderTop: "1px solid var(--line)" }}>
              <div className="cond-detail-head" style={{ display: "grid", gridTemplateColumns: ".55fr 1fr", gap: 56, alignItems: "center", marginBottom: 56 }}>
                <div className={`photo ${active.photo} grain`} style={{ aspectRatio: "4/5" }} />
                <div>
                  <span className="luma-eyebrow">Condition guide</span>
                  <h2 style={{ fontSize: "clamp(1.9rem,3.6vw,2.6rem)", fontWeight: 500 }}>{active.name}</h2>
                  <p style={{ marginTop: 16, fontSize: "1.05rem", lineHeight: 1.75, maxWidth: "58ch" }}>{active.overview}</p>
                </div>
              </div>

              <div className="cond-detail-lists" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, marginBottom: 48 }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Generally include</h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {active.included.map((i) => <li key={i} style={{ fontSize: ".95rem", color: "var(--ink-soft)", marginBottom: 10, lineHeight: 1.6 }}>{i}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Worth moderating</h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {active.moderation.map((i) => <li key={i} style={{ fontSize: ".95rem", color: "var(--ink-soft)", marginBottom: 10, lineHeight: 1.6 }}>{i}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{ maxWidth: "62ch", padding: "24px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 40, background: "var(--sage)", borderRadius: 16, paddingLeft: 24, paddingRight: 24 }}>
                <p style={{ fontSize: ".95rem", lineHeight: 1.7 }}>
                  <b style={{ color: "var(--ink)" }}>When to consult a professional — </b>{active.consult}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <a href={`/consultation?goal=${encodeURIComponent("Manage a Condition")}`} className="luma-pill">
                  Start a Consultation for {active.name} <span>→</span>
                </a>
                <button
                  onClick={() => setActiveKey(null)}
                  style={{ background: "none", border: "none", fontSize: ".88rem", fontWeight: 600, color: "var(--ink-soft)", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
