// One-off, 2026-11-06: football squads grew from 6 to 9.
// Inserts Player 7–9 columns after Player 6 in "Team – Football" (existing rows
// shift right with them) and adds Player 7–9 headers to the end of "All submissions".
// Run it right before deploying the 9-player site, then run setup-sheet.ts to
// restyle. Refuses to run twice.
//
//   node --experimental-strip-types --env-file=.env scripts/add-football-players-7-9.ts
import { sheetsApi, tabRange } from "../src/lib/google-sheets.ts";
import { LOG_HEADERS, LOG_TAB, SPORT_TABS, teamHeaders } from "../src/lib/sheet-layout.ts";

const FOOTBALL = SPORT_TABS["Football"];
const header = async (tab: string) => (await sheetsApi<{ values?: string[][] }>(`/values/${tabRange(tab, "A1:Z1")}`)).values?.[0] ?? [];

const football = await header(FOOTBALL);
if (football[13] !== "Player 6" || football[14] !== "Registered at (IST)") {
  throw new Error(`"${FOOTBALL}" is not in the 6-player layout; not touching it: ${football.join(", ")}`);
}
const log = await header(LOG_TAB);
if (log.length !== 18 || log[17] !== "Player 6") throw new Error(`"${LOG_TAB}" is not in the 6-player layout: ${log.join(", ")}`);

const meta = await sheetsApi<{ sheets: { properties: { sheetId: number; title: string } }[] }>("?fields=sheets(properties(sheetId,title))");
const sheetId = meta.sheets.find((s) => s.properties.title === FOOTBALL)!.properties.sheetId;
await sheetsApi(":batchUpdate", {
  method: "POST",
  body: { requests: [{ insertDimension: { range: { sheetId, dimension: "COLUMNS", startIndex: 14, endIndex: 17 }, inheritFromBefore: true } }] },
});
await sheetsApi(`/values/${tabRange(FOOTBALL, "O1:Q1")}?valueInputOption=RAW`, { method: "PUT", body: { values: [["Player 7", "Player 8", "Player 9"]] } });
await sheetsApi(`/values/${tabRange(LOG_TAB, "S1:U1")}?valueInputOption=RAW`, { method: "PUT", body: { values: [["Player 7", "Player 8", "Player 9"]] } });

if ((await header(FOOTBALL)).join("|") !== teamHeaders("Football").join("|")) throw new Error(`"${FOOTBALL}" headers don't match the new layout.`);
if ((await header(LOG_TAB)).join("|") !== LOG_HEADERS.join("|")) throw new Error(`"${LOG_TAB}" headers don't match the new layout.`);
console.log("Football tab and log now have Player 7–9. Next: run setup-sheet.ts, then deploy.");
