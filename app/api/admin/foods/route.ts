import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { getFoodDatabase, getFoodOverrides, saveFoodOverrides, FoodItem } from "@/lib/foods";

const num = (v: unknown, max = 2000) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n * 10) / 10)) : 0;
};
const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function GET(req: NextRequest) {
  if (!(await adminFromRequest(req, "foods"))) return denied();
  return NextResponse.json(await getFoodDatabase(true));
}

// body: { action: "edit", id, values } | { action: "hide"|"show", id } | { action: "add", values } | { action: "remove", id } | { action: "reset", id }
export async function POST(req: NextRequest) {
  if (!(await adminFromRequest(req, "foods"))) return denied();
  const b = await req.json().catch(() => null);
  const o = await getFoodOverrides();
  const id = txt(b?.id, 40);
  const v = (b?.values || {}) as Record<string, unknown>;
  const values = {
    name: txt(v.name, 80),
    kcal: num(v.kcal, 1000),
    protein: num(v.protein, 100),
    fat: num(v.fat, 100),
    carbs: num(v.carbs, 100),
    fibre: num(v.fibre, 100),
  };
  switch (b?.action) {
    case "edit": {
      if (!id) return NextResponse.json({ error: "Missing food." }, { status: 400 });
      const added = o.added.find((f) => f.id === id);
      if (added) Object.assign(added, values, { serving: txt(v.serving, 30) || added.serving, aliases: txt(v.aliases, 120) });
      else o.edited[id] = { ...values, ...(v.serving ? { serving: txt(v.serving, 30) } : {}), ...(v.aliases !== undefined ? { aliases: txt(v.aliases, 120) } : {}) };
      break;
    }
    case "reset":
      delete o.edited[id];
      break;
    case "hide":
      if (!o.hidden.includes(id)) o.hidden.push(id);
      break;
    case "show":
      o.hidden = o.hidden.filter((x) => x !== id);
      break;
    case "add": {
      if (!values.name) return NextResponse.json({ error: "Please add a name." }, { status: 400 });
      const perServing = v.per === "serving";
      const f: FoodItem = {
        id: `C${crypto.randomUUID().slice(0, 6)}`,
        ...values,
        aliases: txt(v.aliases, 120),
        group: txt(v.group, 40) || "Custom",
        per: perServing ? "serving" : "100g",
        serving: perServing ? txt(v.serving, 30) || "1 serving" : undefined,
        src: "Added by Health365",
        custom: true,
      };
      o.added = [f, ...o.added].slice(0, 500);
      break;
    }
    case "remove":
      o.added = o.added.filter((f) => f.id !== id);
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  await saveFoodOverrides(o);
  return NextResponse.json({ ok: true });
}
