import { requireAdminPage } from "@/lib/adminGuard";
import { listAllDietitianApplications, getUserById, getAppointmentsForDietitian } from "@/lib/kv";
import { threadsForDietitian, getActivity } from "@/lib/consultChat";
import DietitianList, { DtRow } from "./DietitianList";
import { TERMS_VERSION } from "@/lib/dietitianTerms";

export const dynamic = "force-dynamic";

// Every joined dietitian in one list: tap a row to see contact details,
// profile, bookings, money and recent activity.
export default async function DietitiansPage() {
  await requireAdminPage("dashboard");
  const ist = new Date(Date.now() + 5.5 * 3600e3);
  const today = ist.toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const apps = await listAllDietitianApplications();

  const rows: DtRow[] = await Promise.all(
    apps.map(async (d) => {
      const [user, appts, threads, activity] = await Promise.all([
        getUserById(d.userId).catch(() => null),
        getAppointmentsForDietitian(d.id).catch(() => []),
        threadsForDietitian(d.id).catch(() => []),
        getActivity(d.id).catch(() => []),
      ]);
      const booked = appts.filter((a) => a.status === "booked");
      const fee = Number(String(d.fee || "").replace(/[^\d.]/g, "")) || 0;
      const monthCount = booked.filter((a) => a.date.startsWith(month)).length;
      return {
        id: d.id,
        name: d.name,
        email: d.email,
        phone: user?.phone || "",
        status: d.status,
        portal: d.portal !== false,
        qualification: d.qualification,
        experienceYears: d.experienceYears,
        specializations: d.specializations || [],
        languages: d.languages || [],
        location: d.location,
        fee,
        feeText: d.fee,
        about: d.about,
        joinedAt: d.createdAt,
        termsAt: d.termsAcceptedAt || "",
        termsOk: d.termsVersion === TERMS_VERSION,
        total: booked.length,
        thisMonth: monthCount,
        clients: new Set(booked.map((a) => a.userId)).size,
        cancelled: appts.filter((a) => a.status === "cancelled").length,
        waiting: threads.filter((t) => t.unread).length,
        plansSent: activity.filter((x) => /plan/i.test(x.what)).length,
        lastActive: activity[0]?.at || 0,
        activity: activity.slice(0, 6),
        upcoming: booked
          .filter((a) => a.date >= today)
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
          .slice(0, 5)
          .map((a) => ({ date: a.date, time: a.time, client: a.userName })),
      };
    })
  );
  rows.sort((a, b) => ({ pending: 0, approved: 1, rejected: 2 }[a.status] - { pending: 0, approved: 1, rejected: 2 }[b.status]) || b.joinedAt.localeCompare(a.joinedAt));

  return (
    <main style={{ minHeight: "70vh", background: "var(--paper)", padding: "40px 20px" }}>
      <div className="wrap" style={{ maxWidth: 980, padding: 0 }}>
        <span className="eyebrow">Admin</span>
        <h1 style={{ fontSize: "1.9rem" }}>Dietitians</h1>
        <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: ".92rem", maxWidth: 680 }}>
          Everyone who joined or applied. Tap a dietitian to see their phone, profile, bookings and what they did recently.
        </p>
        <DietitianList rows={rows} />
      </div>
    </main>
  );
}
