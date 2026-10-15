// @vitest-environment node
//
// Writes real rows to the Google Sheet, checks them, then deletes them again.
// Opt-in only:
//   RUN_SHEET_TESTS=1 node --env-file=.env node_modules/vitest/vitest.mjs run src/test/sheet-integration.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { sheetsApi, tabRange } from "@/lib/google-sheets";
import { saveRegistration } from "@/lib/registration-store";
import { LOG_TAB, SPORT_TABS, TEAM_COL } from "@/lib/sheet-layout";
import type { RegistrationData } from "@/lib/registration";

// Test entries use this contact-number prefix so cleanup can't touch real rows.
const TEST_PREFIX = "900000";
const FOOTBALL = SPORT_TABS["Men's Football"];
const THROWBALL = SPORT_TABS["Women's Throwball"];

const entry = (phone: string, overrides: Partial<RegistrationData> = {}): RegistrationData => ({
  captainName: "Test Captain", phone: `${TEST_PREFIX}${phone}`, email: "test@example.com", batch: "2012",
  teamName: `Test Team ${phone}`, sport: "Men's Football",
  player1: "P One", player2: "P Two", player3: "P Three", player4: "P Four", player5: "P Five", player6: "P Six",
  ...overrides,
});

const rows = async (tab: string) =>
  (await sheetsApi<{ values?: string[][] }>(`/values/${tabRange(tab, "A2:O")}?valueRenderOption=FORMATTED_VALUE`)).values ?? [];
const isTest = (row: string[], contactColumn: number) => row[contactColumn]?.startsWith(TEST_PREFIX) ?? false;

async function deleteTestRows() {
  const meta = await sheetsApi<{ sheets: { properties: { sheetId: number; title: string } }[] }>("?fields=sheets(properties(sheetId,title))");
  for (const [tab, contactColumn] of [[FOOTBALL, TEAM_COL.contact], [THROWBALL, TEAM_COL.contact], [LOG_TAB, 6]] as const) {
    const sheetId = meta.sheets.find((s) => s.properties.title === tab)!.properties.sheetId;
    const indexes = (await rows(tab)).flatMap((row, index) => (isTest(row, contactColumn) ? [index + 1] : [])).reverse();
    if (!indexes.length) continue;
    await sheetsApi(":batchUpdate", {
      method: "POST",
      body: { requests: indexes.map((startIndex) => ({ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex, endIndex: startIndex + 1 } } })) },
    });
  }
}

describe.skipIf(!process.env["RUN_SHEET_TESTS"])("saving registrations to the real sheet", { timeout: 120_000 }, () => {
  afterAll(async () => {
    await deleteTestRows();
    for (const [tab, column] of [[FOOTBALL, TEAM_COL.contact], [THROWBALL, TEAM_COL.contact], [LOG_TAB, 6]] as const) {
      expect((await rows(tab)).filter((row) => isTest(row, column))).toHaveLength(0);
    }
  }, 120_000);

  it("adds a new team and logs it as saved", async () => {
    const result = await saveRegistration(entry("0001"));
    expect(result.action).toBe("new");
    expect(result.reference).toMatch(/^VNS-\d{4}-[A-Z2-9]{4}$/);

    const team = (await rows(FOOTBALL)).filter((r) => r[TEAM_COL.contact] === "9000000001");
    expect(team).toHaveLength(1);
    expect(team[0]!.slice(0, 11)).toEqual(["Test Team 0001", "Test Captain", "9000000001", "test@example.com", "2012", "P One", "P Two", "P Three", "P Four", "P Five", "P Six"]);
    expect(team[0]![TEAM_COL.timesUpdated]).toBe("0");
    expect(team[0]![TEAM_COL.reference]).toBe(result.reference);

    const log = (await rows(LOG_TAB)).find((r) => r[0] === result.reference)!;
    expect(log.slice(2, 5)).toEqual(["Yes, new team", FOOTBALL, "Test Team 0001"]);
  });

  it("updates the same team in place when the captain registers again", async () => {
    const first = (await rows(FOOTBALL)).find((r) => r[TEAM_COL.contact] === "9000000001")!;
    const result = await saveRegistration(entry("0001", { player6: "New Sixth Player" }));
    expect(result.action).toBe("updated");

    const team = (await rows(FOOTBALL)).filter((r) => r[TEAM_COL.contact] === "9000000001");
    expect(team).toHaveLength(1);
    expect(team[0]![10]).toBe("New Sixth Player");
    expect(team[0]![TEAM_COL.registeredAt]).toBe(first[TEAM_COL.registeredAt]);
    expect(team[0]![TEAM_COL.timesUpdated]).toBe("1");

    // Both submissions stay on record.
    expect((await rows(LOG_TAB)).filter((r) => r[6] === "9000000001").map((r) => r[2])).toEqual(["Yes, new team", "Yes, updated team"]);
  });

  it("puts throwball teams in their own tab", async () => {
    await saveRegistration(entry("0002", { sport: "Women's Throwball" }));
    expect((await rows(THROWBALL)).filter((r) => r[TEAM_COL.contact] === "9000000002")).toHaveLength(1);
    expect((await rows(FOOTBALL)).filter((r) => r[TEAM_COL.contact] === "9000000002")).toHaveLength(0);
  });

  it("keeps every entry when five captains submit at the same moment", async () => {
    const phones = ["0011", "0012", "0013", "0014", "0015"];
    const results = await Promise.all(phones.map((phone) => saveRegistration(entry(phone))));
    expect(new Set(results.map((r) => r.reference)).size).toBe(5);

    const football = await rows(FOOTBALL);
    for (const phone of phones) expect(football.filter((r) => r[TEAM_COL.contact] === `${TEST_PREFIX}${phone}`)).toHaveLength(1);
    const log = await rows(LOG_TAB);
    for (const { reference } of results) expect(log.find((r) => r[0] === reference)?.[2]).toBe("Yes, new team");
  });

  it("never leaves a log row pending after a successful save", async () => {
    expect((await rows(LOG_TAB)).filter((r) => isTest(r, 6) && r[2] === "Pending")).toHaveLength(0);
  });

  it("reports failure instead of success when the sheet can't be reached", async () => {
    const realId = process.env["GOOGLE_SHEETS_ID"];
    process.env["GOOGLE_SHEETS_ID"] = "this-sheet-does-not-exist";
    try {
      await expect(saveRegistration(entry("0099"))).rejects.toThrow();
    } finally {
      process.env["GOOGLE_SHEETS_ID"] = realId;
    }
  });
});
