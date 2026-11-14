// Reads the fixture tabs from the same spreadsheet as the registrations (GOOGLE_SHEETS_ID)
// and keeps a short-lived copy, so a crowd refreshing on match day costs one Google read
// every 20 seconds. Never throws: if Google is down, the last good copy is served.
import { createServerFn } from "@tanstack/react-start";
import { sheetsApi, tabRange } from "./google-sheets";
import { SPORTS, parseSportTab, type SportFixtures } from "./fixtures";

const FRESH_MS = 20_000;

export type FixturesData = { sports: SportFixtures[]; fetchedAt: number; error?: string };

let cache: FixturesData | null = null;
let inFlight: Promise<FixturesData> | null = null;

async function read(): Promise<FixturesData> {
  try {
    const ranges = SPORTS.map((s) => `ranges=${tabRange(s.tab, "A1:L40")}`).join("&");
    const res = await sheetsApi<{ valueRanges: { values?: string[][] }[] }>(`/values:batchGet?${ranges}`);
    const sports = SPORTS.map((s, i) => parseSportTab(s.slug, res.valueRanges[i]?.values ?? []));
    for (const s of sports) if (s.warnings.length) console.warn(`[fixtures] ${s.slug}:`, s.warnings.join(" | "));
    cache = { sports, fetchedAt: Date.now() };
    return cache;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[fixtures] read failed:", message);
    if (cache) return { ...cache, error: message };
    return { sports: SPORTS.map((s) => parseSportTab(s.slug, [])), fetchedAt: Date.now(), error: message };
  }
}

export const getFixtures = createServerFn({ method: "GET" }).handler(async () => {
  if (cache && Date.now() - cache.fetchedAt < FRESH_MS) return cache;
  inFlight ??= read().finally(() => {
    inFlight = null;
  });
  return inFlight;
});
