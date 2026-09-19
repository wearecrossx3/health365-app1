import { NextRequest, NextResponse } from "next/server";
import { addNewsletterSubscriber } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  try {
    await addNewsletterSubscriber(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Newsletter signup failed:", err);
    return NextResponse.json({ error: "Couldn't subscribe right now — please try again." }, { status: 500 });
  }
}
