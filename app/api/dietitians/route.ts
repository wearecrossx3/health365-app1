import { NextResponse } from "next/server";
import { listApprovedDietitians } from "@/lib/kv";

export async function GET() {
  try {
    const dietitians = await listApprovedDietitians();
    return NextResponse.json({ dietitians });
  } catch (err) {
    console.error("Failed to load dietitians:", err);
    return NextResponse.json({ dietitians: [] });
  }
}
