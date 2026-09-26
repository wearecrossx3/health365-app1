import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifySessionCookieValue, ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import {
  getAppContent,
  setAppContent,
  AppContent,
  AppBannerAction,
  APP_GOAL_KEYS,
  APP_CONDITION_KEYS,
  APP_MENU_KEYS,
  DEFAULT_APP_CONTENT,
} from "@/lib/kv";

async function allowed(req: NextRequest) {
  const session = verifySessionCookieValue(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
  return isAdmin(session, "app");
}

const PALETTE = ["#4EAA67", "#287379", "#E5394F", "#CBDB3D", "#F6961D", "#9997C9"];
const ACTIONS: AppBannerAction[] = ["consult", "plan", "oncology", "care", "none"];

const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
// Only accept http(s) image links — anything else (javascript:, data:, etc.) is dropped.
const url = (v: unknown) => {
  const s = txt(v, 600);
  return /^https?:\/\//i.test(s) ? s : "";
};
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

export async function GET(req: NextRequest) {
  if (!(await allowed(req))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  return NextResponse.json({ content: await getAppContent() });
}

export async function POST(req: NextRequest) {
  if (!(await allowed(req))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Missing content." }, { status: 400 });

  const d = DEFAULT_APP_CONTENT;
  const tc = b.todayCard || {};
  const tx = b.texts || {};
  const content: AppContent = {
    todayCard: {
      label: txt(tc.label, 40) || d.todayCard.label,
      color: PALETTE.includes(String(tc.color)) ? String(tc.color) : d.todayCard.color,
      imageUrl: url(tc.imageUrl),
      ringColor: [...PALETTE, "#FFF3E5"].includes(String(tc.ringColor)) ? String(tc.ringColor) : d.todayCard.ringColor,
    },
    texts: {
      upNext: txt(tx.upNext, 40) || d.texts.upNext,
      water: txt(tx.water, 40) || d.texts.water,
      progress: txt(tx.progress, 40) || d.texts.progress,
      reviews: txt(tx.reviews, 60) || d.texts.reviews,
      premiumTitle: txt(tx.premiumTitle, 60) || d.texts.premiumTitle,
      premiumText: txt(tx.premiumText, 160),
    },
    menuIcons: Object.fromEntries(APP_MENU_KEYS.map((k) => [k, url(b.menuIcons?.[k])]).filter(([, v]) => v)),
    // Only an https website address is accepted; the app also checks it answers before switching.
    apiBase: /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(txt(b.apiBase, 120).replace(/\/+$/, "")) ? txt(b.apiBase, 120).replace(/\/+$/, "") : "",
    introSlides: [0, 1, 2].map((i) => ({
      title: txt(b.introSlides?.[i]?.title, 80) || d.introSlides[i].title,
      text: txt(b.introSlides?.[i]?.text, 200),
      imageUrl: url(b.introSlides?.[i]?.imageUrl),
    })),
    goalIcons: Object.fromEntries(APP_GOAL_KEYS.map((k) => [k, url(b.goalIcons?.[k])])),
    conditionIcons: Object.fromEntries(APP_CONDITION_KEYS.map((k) => [k, url(b.conditionIcons?.[k])])),
    banners: (Array.isArray(b.banners) ? b.banners : []).slice(0, 8).map((x: Record<string, unknown>) => ({
      id: txt(x.id, 40) || crypto.randomUUID().slice(0, 8),
      title: txt(x.title, 80),
      text: txt(x.text, 200),
      buttonText: txt(x.buttonText, 40),
      imageUrl: url(x.imageUrl),
      color: PALETTE.includes(String(x.color)) ? String(x.color) : PALETTE[5],
      action: ACTIONS.includes(x.action as AppBannerAction) ? (x.action as AppBannerAction) : "none",
      enabled: bool(x.enabled, true),
    })),
    habitCards: (Array.isArray(b.habitCards) ? b.habitCards : []).slice(0, 12).map((x: Record<string, unknown>) => ({
      id: txt(x.id, 40) || crypto.randomUUID().slice(0, 8),
      tag: txt(x.tag, 20),
      text: txt(x.text, 120),
      imageUrl: url(x.imageUrl),
      enabled: bool(x.enabled, true),
    })),
    habitsTitle: txt(b.habitsTitle, 60) || d.habitsTitle,
    autoScroll: bool(b.autoScroll, true),
    soundEnabled: bool(b.soundEnabled, true),
    hapticsEnabled: bool(b.hapticsEnabled, true),
    confettiEnabled: bool(b.confettiEnabled, true),
    updatedAt: new Date().toISOString(),
  };
  await setAppContent(content);
  return NextResponse.json({ ok: true, content });
}
