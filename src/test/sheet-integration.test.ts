// @vitest-environment node
//
// Writes real rows to the Google Sheet, checks them, then deletes them again.
// Opt-in only:
//   RUN_SHEET_TESTS=1 node --env-file=.env node_modules/vitest/vitest.mjs run src/test/sheet-integration.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { sheetsApi, tabRange } from "@/lib/google-sheets";
import { saveRegistration } from "@/lib/registration-store";
import { LOG_COL, LOG_TAB, SOLO_COL, SOLO_TABS, SPORT_TABS, TEAM_COL } from "@/lib/sheet-layout";
import { registrationSchema, type RegistrationData, type RegistrationInput } from "@/lib/registration";

// Test entries use this contact-number prefix so cleanup can't touch real rows.
const TEST_PREFIX = "900000";
const FOOTBALL = SPORT_TABS["Men's Football"];
const VOLLEYBALL = SPORT_TABS["Women's Volleyball"];
const SOLO_FOOTBALL = SOLO_TABS["Men's Football"];
const SOLO_VOLLEYBALL = SOLO_TABS["Women's Volleyball"];
const CLEANUP = [[FOOTBALL, TEAM_COL.contact], [VOLLEYBALL, TEAM_COL.contact], [SOLO_FOOTBALL, SOLO_COL.contact], [SOLO_VOLLEYBALL, SOLO_COL.contact], [LOG_TAB, LOG_COL.contact]] as const;

// Goes through the schema, exactly as a form submission does.
const entry = (phone: string, overrides: Partial<RegistrationInput> = {}): RegistrationData => registrationSchema.parse({
  entryType: "Team", captainName: "Test Captain", phone: `${TEST_PREFIX}${phone}`, email: "test@example.com", registrantType: "Alumni", batch: "2012", studentClass: "",
  teamName: `Test Team ${phone}`, sport: "Men's Football",
  player2: "P Two", player3: "P Three", player4: "P Four", player5: "P Five", player6: "P Six",
  ...overrides,
});

const rows = async (tab: string) =>
  (await sheetsApi<{ values?: string[][] }>(`/values/${tabRange(tab, "A2:R")}?valueRenderOption=FORMATTED_VALUE`)).values ?? [];
const isTest = (row: string[], contactColumn: number) => row[contactColumn]?.startsWith(TEST_PREFIX) ?? false;

async function deleteTestRows() {
  const meta = await sheetsApi<{ sheets: { properties: { sheetId: number; title: string } }[] }>("?fields=sheets(properties(sheetId,title))");
  for (const [tab, contactColumn] of CLEANUP) {
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
    for (const [tab, column] of CLEANUP) {
      expect((await rows(tab)).filter((row) => isTest(row, column))).toHaveLength(0);
    }
  }, 120_000);

  it("adds a new team and logs it as saved", async () => {
    const result = await saveRegistration(entry("0001"));
    expect(result.action).toBe("new");
    expect(result.reference).toMatch(/^VNS-\d{4}-[A-Z2-9]{4}$/);

    const team = (await rows(FOOTBALL)).filter((r) => r[TEAM_COL.contact] === "9000000001");
    expect(team).toHaveLength(1);
    expect(team[0]!.slice(0, 14)).toEqual(["Test Team 0001", "Test Captain", "9000000001", "test@example.com", "Alumni", "2012", "", "6", "Test Captain", "P Two", "P Three", "P Four", "P Five", "P Six"]);
    expect(team[0]![TEAM_COL.timesUpdated]).toBe("0");
    expect(team[0]![TEAM_COL.reference]).toBe(result.reference);

    const log = (await rows(LOG_TAB)).find((r) => r[0] === result.reference)!;
    expect(log.slice(2, 7)).toEqual(["Yes, new team", "Team", FOOTBALL, "Test Team 0001", "Test Captain"]);
  });

  it("updates the same team in place when the captain registers again", async () => {
    const first = (await rows(FOOTBALL)).find((r) => r[TEAM_COL.contact] === "9000000001")!;
    const result = await saveRegistration(entry("0001", { player6: "New Sixth Player" }));
    expect(result.action).toBe("updated");

    const team = (await rows(FOOTBALL)).filter((r) => r[TEAM_COL.contact] === "9000000001");
    expect(team).toHaveLength(1);
    expect(team[0]![13]).toBe("New Sixth Player");
    expect(team[0]![TEAM_COL.registeredAt]).toBe(first[TEAM_COL.registeredAt]);
    expect(team[0]![TEAM_COL.timesUpdated]).toBe("1");

    // Both submissions stay on record.
    expect((await rows(LOG_TAB)).filter((r) => r[LOG_COL.contact] === "9000000001").map((r) => r[2])).toEqual(["Yes, new team", "Yes, updated team"]);
  });

  it("saves a current student's class and leaves the batch blank", async () => {
    await saveRegistration(entry("0003", { registrantType: "Current student", batch: "", studentClass: "12th" }));
    const row = (await rows(FOOTBALL)).find((r) => r[TEAM_COL.contact] === "9000000003");
    expect(row?.slice(4, 7)).toEqual(["Current student", "", "12th"]);
    expect(row?.[8]).toBe("Test Captain");
  });

  it("saves a 4-player team with the last two players blank", async () => {
    await saveRegistration(entry("0004", { player5: "", player6: "" }));
    const row = (await rows(FOOTBALL)).find((r) => r[TEAM_COL.contact] === "9000000004");
    expect(row?.[TEAM_COL.playersNamed]).toBe("4");
    expect(row?.slice(8, 14)).toEqual(["Test Captain", "P Two", "P Three", "P Four", "", ""]);
  });

  it("saves a solo player to the solo tab, not the team tab", async () => {
    const result = await saveRegistration(entry("0021", { entryType: "Solo", captainName: "Solo Tester" }));
    expect(result).toMatchObject({ action: "new", entryType: "Solo" });
    const solo = (await rows(SOLO_FOOTBALL)).filter((r) => r[SOLO_COL.contact] === "9000000021");
    expect(solo).toHaveLength(1);
    expect(solo[0]!.slice(0, 6)).toEqual(["Solo Tester", "9000000021", "test@example.com", "Alumni", "2012", ""]);
    expect(solo[0]![SOLO_COL.timesUpdated]).toBe("0");
    expect((await rows(FOOTBALL)).filter((r) => r[TEAM_COL.contact] === "9000000021")).toHaveLength(0);

    const log = (await rows(LOG_TAB)).find((r) => r[0] === result.reference)!;
    expect(log.slice(2, 7)).toEqual(["Yes, new solo player", "Solo", SOLO_FOOTBALL, "", "Solo Tester"]);
  });

  it("keeps an assigned group when a solo player registers again", async () => {
    const index = (await rows(SOLO_FOOTBALL)).findIndex((r) => r[SOLO_COL.contact] === "9000000021");
    const groupCell = `K${index + 2}`;
    await sheetsApi(`/values/${tabRange(SOLO_FOOTBALL, groupCell)}?valueInputOption=RAW`, { method: "PUT", body: { values: [["Group 7"]] } });

    const result = await saveRegistration(entry("0021", { entryType: "Solo", captainName: "Solo Tester", email: "new@example.com" }));
    expect(result.action).toBe("updated");
    const solo = (await rows(SOLO_FOOTBALL)).filter((r) => r[SOLO_COL.contact] === "9000000021");
    expect(solo).toHaveLength(1);
    expect(solo[0]![2]).toBe("new@example.com");
    expect(solo[0]![SOLO_COL.timesUpdated]).toBe("1");
    expect(solo[0]![SOLO_COL.group]).toBe("Group 7");
  });

  it("puts solo volleyball players in their own tab", async () => {
    await saveRegistration(entry("0022", { entryType: "Solo", sport: "Women's Volleyball" }));
    expect((await rows(SOLO_VOLLEYBALL)).filter((r) => r[SOLO_COL.contact] === "9000000022")).toHaveLength(1);
    expect((await rows(SOLO_FOOTBALL)).filter((r) => r[SOLO_COL.contact] === "9000000022")).toHaveLength(0);
  });

  it("puts volleyball teams in their own tab", async () => {
    await saveRegistration(entry("0002", { sport: "Women's Volleyball" }));
    expect((await rows(VOLLEYBALL)).filter((r) => r[TEAM_COL.contact] === "9000000002")).toHaveLength(1);
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
    expect((await rows(LOG_TAB)).filter((r) => isTest(r, LOG_COL.contact) && r[2] === "Pending")).toHaveLength(0);
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
