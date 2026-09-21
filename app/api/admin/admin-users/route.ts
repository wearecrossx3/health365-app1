import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isSuperAdmin, isValidPermission } from "@/lib/admin";
import { listAdminAccounts, saveAdminAccount, deleteAdminAccount, getAdminAccount, AdminAccount } from "@/lib/kv";

// Deliberately checks isSuperAdmin directly, not the general isAdmin(session)
// helper — granting or editing another admin's access is owner-only and is
// never itself one of the grantable permissions, so a sub-admin can never
// escalate their own or anyone else's access.
function requireSuperAdmin(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionCookieValue(cookie);
  return isSuperAdmin(session);
}

export async function GET(req: NextRequest) {
  if (!requireSuperAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const accounts = await listAdminAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  if (!requireSuperAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const permissions = Array.isArray(body?.permissions) ? body.permissions.filter(isValidPermission) : [];
  const existing = await getAdminAccount(email);
  const account: AdminAccount = {
    email,
    name: String(body?.name || existing?.name || email),
    permissions,
    addedAt: existing?.addedAt || new Date().toISOString(),
  };
  await saveAdminAccount(account);
  return NextResponse.json({ ok: true, account });
}

export async function DELETE(req: NextRequest) {
  if (!requireSuperAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.email) return NextResponse.json({ error: "Missing email." }, { status: 400 });
  await deleteAdminAccount(String(body.email).toLowerCase());
  return NextResponse.json({ ok: true });
}
