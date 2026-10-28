import crypto from "crypto";
import { getJSON, setJSON } from "./kv";

// Saved plans a dietitian (or the Health365 team) can start a new plan from.
// owner = "team" for admins, "dt:<dietitianId>" for a joined dietitian.
export interface PlanTemplate { id: string; name: string; savedAt: string; by: string; plan: Record<string, unknown> }

const key = (owner: string) => `plan_templates:${owner}`;
const MAX = 40;

export async function listTemplates(owner: string): Promise<PlanTemplate[]> {
  return (await getJSON<PlanTemplate[]>(key(owner))) || [];
}

export async function saveTemplate(owner: string, name: string, by: string, plan: Record<string, unknown>): Promise<PlanTemplate> {
  const all = await listTemplates(owner);
  const t: PlanTemplate = { id: crypto.randomUUID().slice(0, 10), name: name.slice(0, 80) || "My template", savedAt: new Date().toISOString(), by: by.slice(0, 60), plan };
  await setJSON(key(owner), [t, ...all].slice(0, MAX));
  return t;
}

export async function deleteTemplate(owner: string, id: string): Promise<void> {
  const all = await listTemplates(owner);
  await setJSON(key(owner), all.filter((t) => t.id !== id));
}
