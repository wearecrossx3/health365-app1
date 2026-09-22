import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP, GIF, or SVG image." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image is too large — please keep it under 5MB." }, { status: 400 });
  }

  try {
    // No explicit token here on purpose: this project's Blob store is
    // connected via Vercel's OIDC method, which authenticates
    // automatically at runtime — a manually-set BLOB_READ_WRITE_TOKEN
    // is neither required nor recommended for this setup.
    const blob = await put(`site-content/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("Upload failed:", err);
    const message = err instanceof Error ? err.message : "Upload failed — please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
