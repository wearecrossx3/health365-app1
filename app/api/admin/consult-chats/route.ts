import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { listAllAppointments, listApprovedDietitians, getDietitianApplicationById, createOrUpdateDietitianApplication } from "@/lib/kv";
import { threadsForOwner, getActivity, OWN_DIETITIAN } from "@/lib/consultChat";
import { getAsthaPortalEmail, setAsthaPortalEmail } from "@/lib/portal";

// Owner/team view of every consultation chat with joined dietitians, plus
// each dietitian's portal switch and activity log.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await adminFromRequest(req, "users"))) return denied();
  const [appts, dts] = await Promise.all([listAllAppointments(), listApprovedDietitians()]);
  const threads = await threadsForOwner(appts);
  const dietitians = await Promise.all(
    dts.filter((d) => d.id !== OWN_DIETITIAN).map(async (d) => ({ id: d.id, name: d.name, email: d.email, portal: d.portal !== false, activity: await getActivity(d.id) }))
  );
  return NextResponse.json({ threads, dietitians, astha: { email: await getAsthaPortalEmail(), activity: await getActivity(OWN_DIETITIAN) } });
}

export async function POST(req: NextRequest) {
  if (!(await adminFromRequest(req, "users"))) return denied();
  const b = await req.json().catch(() => ({}));
  if (b.action === "asthaEmail") {
    const e = String(b.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    await setAsthaPortalEmail(e);
    return NextResponse.json({ ok: true, email: e });
  }
  if (b.action === "portal") {
    const d = await getDietitianApplicationById(String(b.dietitianId || ""));
    if (!d) return NextResponse.json({ error: "Not found." }, { status: 404 });
    d.portal = !!b.portal;
    await createOrUpdateDietitianApplication(d);
    return NextResponse.json({ ok: true, portal: d.portal });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
