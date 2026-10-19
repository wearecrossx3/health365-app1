import { NextRequest, NextResponse } from "next/server";
import { adminFromRequest, denied } from "@/lib/adminGuard";
import { getAppt, isChatAppointment, listMessages, addMessage, getMeta } from "@/lib/consultChat";
import { sendNotifyToClient } from "@/lib/consultClientNotify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await adminFromRequest(req, "users"))) return denied();
  const a = await getAppt(params.id);
  if (!a || !isChatAppointment(a)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const [messages, meta] = await Promise.all([listMessages(a.id, { owner: true }), getMeta(a.id)]);
  return NextResponse.json({ thread: { id: a.id, client: a.userName, dietitian: a.dietitianName, date: a.date, time: a.time, note: meta.note, outcome: meta.outcome }, messages });
}

// The team can step into a chat (shown as "Health365 team").
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await adminFromRequest(req, "users"))) return denied();
  const a = await getAppt(params.id);
  if (!a || !isChatAppointment(a)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").trim();
  if (!text) return NextResponse.json({ error: "Type a message first." }, { status: 400 });
  const m = await addMessage(a.id, "team", text);
  sendNotifyToClient(a, "New message from the Health365 team").catch(() => {});
  return NextResponse.json({ ok: true, message: m });
}
