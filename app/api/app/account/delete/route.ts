import { NextRequest } from "next/server";
import { getUserByEmail, getUserById, deleteUserAccount } from "@/lib/kv";
import { verifyPassword } from "@/lib/auth";
import { getAdminEmails, sendEmail, emailWrapper } from "@/lib/email";
import { appJson, appPreflight, getAppSession, limit, str } from "@/lib/appApi";

// Permanently deletes a Health365 account and its data.
// Used by the app ("Delete my account", signed in with a bearer token) and by
// the public /delete-account page (email + password). The password is always
// re-checked, so a stolen session alone can't wipe an account.
export async function OPTIONS() {
  return appPreflight();
}

export async function POST(req: NextRequest) {
  const limited = await limit(req, "app-delete", 10, 3600);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const password = String(body?.password ?? "");
  if (!password) return appJson({ error: "Please enter your password to confirm." }, 400);

  const session = getAppSession(req);
  const user = session ? await getUserById(session.userId) : await getUserByEmail(str(body?.email, 120).toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return appJson({ error: "Incorrect email or password." }, 401);
  }

  try {
    const removed = await deleteUserAccount(user.id);
    const admins = getAdminEmails();
    if (admins.length > 0) {
      sendEmail({
        to: admins,
        subject: "A Health365 account was deleted",
        html: emailWrapper("Account deleted", `<p>${user.email} deleted their account and data (${removed?.consultations ?? 0} consultations, ${removed?.appointments ?? 0} appointments).</p>`),
      }).catch(() => {});
    }
    sendEmail({
      to: user.email,
      subject: "Your Health365 account has been deleted",
      html: emailWrapper("Account deleted", "<p>Your Health365 account and the data linked to it have been permanently deleted. We're sorry to see you go.</p>"),
    }).catch(() => {});
    const res = appJson({ ok: true, removed });
    res.cookies.set("h365_session", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("Account deletion failed:", err);
    return appJson({ error: "Couldn't delete right now — please try again." }, 500);
  }
}
