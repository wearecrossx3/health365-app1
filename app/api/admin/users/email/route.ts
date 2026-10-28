import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { getUserById } from "@/lib/kv";
import { sendEmailResult, emailWrapper } from "@/lib/email";
import { fillUserMessage } from "@/lib/userMessages";

// Admin › Users: email one user or a group of users.
// Resend's free plan sends at most 100 emails a day, so one send is capped.
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const MAX_PER_SEND = 90;
const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
const linkify = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#287379">$1</a>');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const session = await adminFromRequest(req, "users");
  if (!session) return denied();
  const b = await req.json().catch(() => null);
  const ids: string[] = Array.from(new Set((Array.isArray(b?.ids) ? b.ids : []).map(String))).slice(0, 500) as string[];
  const subject = String(b?.subject || "").trim().slice(0, 150);
  const body = String(b?.body || "").trim().slice(0, 3000);
  if (!ids.length) return NextResponse.json({ error: "Pick at least one user." }, { status: 400 });
  if (!subject || !body) return NextResponse.json({ error: "Write a subject and a message." }, { status: 400 });
  if (ids.length > MAX_PER_SEND) {
    return NextResponse.json({ error: `That's ${ids.length} people. The free email plan sends up to 100 a day, so send to ${MAX_PER_SEND} or fewer at a time (use the search box to narrow the list).` }, { status: 400 });
  }

  let sent = 0, failed = 0, skipped = 0;
  let firstError = "";
  for (const id of ids) {
    const u = await getUserById(id).catch(() => null);
    if (!u?.email || !/@/.test(u.email)) { skipped++; continue; }
    const t = fillUserMessage(subject, u.name);
    const html = fillUserMessage(body, u.name).split(/\n+/).map((x) => `<p>${linkify(esc(x))}</p>`).join("");
    const r = await sendEmailResult({ to: u.email, subject: t, html: emailWrapper(t, html) }).catch(() => ({ ok: false, error: "Couldn't reach the email service." }));
    if (r.ok) sent++;
    else { failed++; if (!firstError) firstError = `${u.name} (${u.email}): ${r.error || "failed"}`; }
    if (ids.length > 1) await sleep(550); // stay under Resend's 2-per-second limit
  }
  return NextResponse.json({ ok: true, sent, failed, skipped, firstError });
}
