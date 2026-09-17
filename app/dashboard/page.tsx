import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { getConsultationsForUser, getAppointmentsForUser } from "@/lib/kv";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const session = verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/login");

  const [consultations, appointments] = await Promise.all([
    getConsultationsForUser(session.userId),
    getAppointmentsForUser(session.userId),
  ]);
  const upcoming = appointments
    .filter((a) => a.status === "booked")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <main className="min-h-screen bg-paper px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm text-inksoft">Welcome back,</p>
            <h1 className="font-display text-2xl">{session.name}</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Your consultations</h2>
            <Link href="/consultation" className="pill pill-outline text-sm px-4 py-2">
              Start a new consultation
            </Link>
          </div>

          {consultations.length === 0 ? (
            <p className="text-sm text-inksoft">
              No consultations yet — start one to get your first nutrition plan.
            </p>
          ) : (
            <div className="space-y-3">
              {consultations.map((c) => (
                <div key={c.id} className="border border-line rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{c.goal}</p>
                    <p className="text-xs text-inksoft mt-1">
                      {c.dietType} · Submitted {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-pill bg-teal text-white">
                    {c.status === "submitted" ? "Under review" : "Reviewed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link href="/diet-plan" className="pill pill-outline text-sm px-4 py-2">Generate a diet plan</Link>
          <Link href="/conditions" className="pill pill-outline text-sm px-4 py-2">Browse conditions</Link>
          <Link href="/dietitians" className="pill pill-outline text-sm px-4 py-2">Find a dietitian</Link>
        </div>

        <div className="card mt-6">
          <h2 className="font-display text-lg mb-4">Your appointments</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-inksoft">No appointments booked yet — find a dietitian and pick a time that works for you.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="border border-line rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{a.dietitianName}</p>
                    <p className="text-xs text-inksoft mt-1">
                      {new Date(a.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} at {a.time}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-pill bg-teal text-white">Booked</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
