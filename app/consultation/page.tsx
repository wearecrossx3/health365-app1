"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { isValidPhone } from "@/lib/phone";
import { useAuthModal } from "@/components/AuthModalProvider";

const STEP_TITLES = ["About you", "Your body", "Lifestyle", "Your goal", "Food preference", "Allergies & health", "Review"];
const TOTAL = STEP_TITLES.length;

const GOALS = ["Lose weight", "Gain weight", "Maintain weight", "Improve nutrition", "Condition-specific support"];
const DIETS = ["Vegetarian", "Jain", "Vegan", "Eggetarian", "Non-vegetarian", "Other"];
const ALLERGENS = ["Nuts", "Dairy", "Gluten", "Soy", "Shellfish", "Eggs"];
const CONDITIONS = ["Diabetes", "PCOS", "Thyroid", "Hypertension", "Heart condition", "Kidney condition", "Cancer / Oncology", "Pregnant / breastfeeding"];

function Toggle({ options, value, onChange, multi, warnList }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean; warnList?: string[];
}) {
  function click(opt: string) {
    if (multi) {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    } else {
      onChange([opt]);
    }
  }
  return (
    <div className="toggle-group">
      {options.map((opt) => {
        const on = value.includes(opt);
        const warn = on && warnList?.includes(opt);
        return (
          <span key={opt} className={`toggle-opt${on ? " on" : ""}${warn ? " warn" : ""}`} onClick={() => click(opt)}>
            {opt}
          </span>
        );
      })}
    </div>
  );
}

function ConsultationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { open } = useAuthModal();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ needsReview: boolean } | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<string[]>([]);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState<string[]>([]);
  const [goal, setGoal] = useState<string[]>(
    params.get("condition") ? ["Condition-specific support"] : params.get("goal") ? [mapGoal(params.get("goal")!)] : []
  );
  const [dietType, setDietType] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>(
    params.get("condition") ? [mapCondition(params.get("condition")!)] : []
  );
  const [error, setError] = useState("");

  function mapGoal(g: string) {
    const map: Record<string, string> = {
      "Lose Weight": "Lose weight", "Gain Weight": "Gain weight",
      "Eat Better": "Improve nutrition", "Manage a Condition": "Condition-specific support",
    };
    return map[g] || g;
  }

  function mapCondition(c: string) {
    const map: Record<string, string> = { Oncology: "Cancer / Oncology" };
    return map[c] || c;
  }

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .finally(() => setCheckedAuth(true));
  }, []);

  if (!checkedAuth) {
    return (
      <div className="wrap" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 560 }}>
        <div className="step-card" style={{ textAlign: "center", color: "var(--ink-soft)" }}>Loading…</div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="wrap" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 560 }}>
        <div className="step-card" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.6rem", marginBottom: 10 }}>Let&apos;s save your progress</h2>
          <p style={{ marginBottom: 24 }}>Create a free account so your consultation and plans are there whenever you come back.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => open("signup")} className="pill pill-primary">Create an account</button>
            <button onClick={() => open("login")} className="pill pill-outline">Log in</button>
          </div>
        </div>
      </div>
    );
  }

  function validate(): boolean {
    if (step === 1 && (!fullName.trim() || !age || !phone.trim() || gender.length === 0)) { setError("Please fill in the required fields."); return false; }
    if (step === 1 && !isValidPhone(phone)) { setError("Please enter a valid phone number."); return false; }
    if (step === 2 && (!height || !weight)) { setError("Please enter your height and weight."); return false; }
    if (step === 3 && activity.length === 0) { setError("Please select your activity level."); return false; }
    if (step === 4 && goal.length === 0) { setError("Please choose a goal."); return false; }
    if (step === 5 && dietType.length === 0) { setError("Please select a food preference."); return false; }
    setError("");
    return true;
  }

  function next() {
    if (!validate()) return;
    setStep((s) => Math.min(TOTAL, s + 1));
  }
  function back() { setStep((s) => Math.max(1, s - 1)); }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName, age, phone, gender: gender[0], height, weight, activity: activity[0],
        goal: goal[0], dietType: dietType[0], allergens, conditions,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setSubmitError(data.error || "Something went wrong — please try again."); return; }
    setDone({ needsReview: data.needsProfessionalReview });
  }

  if (done) {
    return (
      <div className="wrap" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 640 }}>
        <div className="step-card" style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", margin: "0 auto 20px" }}>✓</div>
          <h2 style={{ fontSize: "1.8rem" }}>You&apos;re all set.</h2>
          <p style={{ marginTop: 14, maxWidth: "44ch", marginLeft: "auto", marginRight: "auto" }}>
            Thank you — your consultation has been saved.
            {done.needsReview
              ? " Since you mentioned a condition that needs professional review, Dr. Astha's team will look at this before any plan is shared."
              : " You can now generate a basic plan from your dashboard."}
          </p>
          <p style={{ marginTop: 18, fontSize: ".82rem" }}>This is general nutrition guidance, not a medical diagnosis or treatment.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
            <Link href="/diet-plan" className="pill pill-primary">Generate your diet plan</Link>
            <Link href="/dashboard" className="pill pill-outline">Go to your dashboard</Link>
            <Link href="/" className="pill pill-outline">Back to Health365</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="progress-wrap">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="progress-top">
            <span className="step-label">Step {step} of {TOTAL}</span>
            <span className="step-title">{STEP_TITLES[step - 1]}</span>
          </div>
          <div className="bar"><div className="bar-fill" style={{ width: `${(step / TOTAL) * 100}%` }} /></div>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: 760, paddingTop: 44, paddingBottom: 80 }}>
        <div className="step-card">
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Let&apos;s start with you</h2>
              <p style={{ marginBottom: 26 }}>A few basics so we know who we&apos;re building this for.</p>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 29" />
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Mobile number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 98765 43210" />
              </div>
              <div className="field">
                <label>Gender</label>
                <Toggle options={["Female", "Male", "Other", "Prefer not to say"]} value={gender} onChange={setGender} />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>A little about your body</h2>
              <p style={{ marginBottom: 26 }}>This helps us understand your starting point — nothing more.</p>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Height (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 165" />
              </div>
              <div className="field">
                <label>Weight (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 68" />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Your everyday rhythm</h2>
              <p style={{ marginBottom: 26 }}>Your plan should fit your life, not fight it.</p>
              <div className="field">
                <label>Activity level</label>
                <Toggle options={["Sedentary", "Lightly active", "Active", "Very active"]} value={activity} onChange={setActivity} />
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>What&apos;s your main goal?</h2>
              <p style={{ marginBottom: 26 }}>We&apos;ll shape the rest of your plan around this.</p>
              <div className="goal-grid">
                {GOALS.map((g) => (
                  <div key={g} className={`goal-card${goal[0] === g ? " selected" : ""}`} onClick={() => setGoal([g])}>
                    <h3>{g}</h3>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>How do you eat?</h2>
              <p style={{ marginBottom: 26 }}>So every meal we suggest actually fits your kitchen.</p>
              <div className="field">
                <label>Food preference</label>
                <Toggle options={DIETS} value={dietType} onChange={setDietType} />
              </div>
            </>
          )}
          {step === 6 && (
            <>
              <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Allergies &amp; health background</h2>
              <p style={{ marginBottom: 26 }}>General nutrition guidance only — this isn&apos;t a diagnosis.</p>
              <div className="field" style={{ marginBottom: 22 }}>
                <label>Common allergens <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— select any that apply</span></label>
                <Toggle options={ALLERGENS} value={allergens} onChange={setAllergens} multi />
              </div>
              <div className="field">
                <label>Existing conditions <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>— select any that apply</span></label>
                <Toggle options={CONDITIONS} value={conditions} onChange={setConditions} multi warnList={CONDITIONS} />
                {conditions.length > 0 && (
                  <div className="health-note">This needs a dietitian&apos;s review, not just an automatic plan — we&apos;ll prioritize connecting you with one after you submit.</div>
                )}
              </div>
            </>
          )}
          {step === 7 && (
            <>
              <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Quick check before we send this off</h2>
              <p style={{ marginBottom: 26 }}>You can go back and change anything.</p>
              <div className="summary-grid">
                <div className="summary-card"><div className="lbl">Name</div><div className="val">{fullName || "—"}</div></div>
                <div className="summary-card"><div className="lbl">Mobile</div><div className="val">{phone || "—"}</div></div>
                <div className="summary-card"><div className="lbl">Age / Gender</div><div className="val">{age || "—"} · {gender[0] || "—"}</div></div>
                <div className="summary-card"><div className="lbl">Height / Weight</div><div className="val">{height || "—"}cm · {weight || "—"}kg</div></div>
                <div className="summary-card"><div className="lbl">Activity</div><div className="val">{activity[0] || "—"}</div></div>
                <div className="summary-card"><div className="lbl">Goal</div><div className="val">{goal[0] || "—"}</div></div>
                <div className="summary-card"><div className="lbl">Food preference</div><div className="val">{dietType[0] || "—"}</div></div>
                <div className="summary-card"><div className="lbl">Allergies</div><div className="val">{allergens.join(", ") || "None specified"}</div></div>
                <div className="summary-card"><div className="lbl">Conditions</div><div className="val">{conditions.join(", ") || "None specified"}</div></div>
              </div>
              {submitError && <p style={{ color: "var(--terracotta)", marginTop: 16, fontSize: ".9rem" }}>{submitError}</p>}
            </>
          )}
          {error && <p style={{ color: "var(--terracotta)", marginTop: 16, fontSize: ".9rem" }}>{error}</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button className="pill pill-outline" onClick={back} disabled={step === 1}>Back</button>
          {step < TOTAL ? (
            <button className="pill pill-primary" onClick={next}>Continue</button>
          ) : (
            <button className="pill pill-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit consultation"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function ConsultationPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <ConsultationForm />
      </Suspense>
      <SiteFooter />
    </>
  );
}
