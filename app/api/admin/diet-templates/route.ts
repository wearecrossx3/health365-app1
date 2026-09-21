import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { listAllDietTemplates, setDietTemplate, DietTemplate } from "@/lib/kv";
import { DIET_TEMPLATE_OPTIONS } from "@/lib/dietConditions";

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  return isAdmin(session, "diet-plans");
}

const VALID_KEYS = new Set(DIET_TEMPLATE_OPTIONS.map((o) => o.key));
const SLOTS = ["breakfast", "midmorning", "lunch", "eveningsnack", "dinner"];

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const templates = await listAllDietTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.key || !VALID_KEYS.has(body.key)) {
    return NextResponse.json({ error: "Unknown template key." }, { status: 400 });
  }

  const meals: DietTemplate["meals"] = {};
  for (const slot of SLOTS) {
    const m = body.meals?.[slot] || {};
    meals[slot] = {
      name: String(m.name || ""),
      portion: String(m.portion || ""),
      cal: String(m.cal || ""),
      note: String(m.note || ""),
    };
  }

  const template: DietTemplate = {
    key: body.key,
    tips: String(body.tips || ""),
    meals,
    updatedAt: new Date().toISOString(),
  };
  await setDietTemplate(template);
  return NextResponse.json({ ok: true, template });
}
