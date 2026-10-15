// Creates the registration tabs, headers and formatting in the Google Sheet.
// Safe to re-run: it only adds what is missing and refuses to overwrite a header
// row that holds something else.
//
//   node --experimental-strip-types --env-file=.env scripts/setup-sheet.ts
import { sheetsApi, tabRange } from "../src/lib/google-sheets.ts";
import { LOG_HEADERS, LOG_TAB, SPORT_TABS, TEAM_HEADERS } from "../src/lib/sheet-layout.ts";

type SheetMeta = {
  properties: { sheetId: number; title: string };
  bandedRanges?: unknown[];
  protectedRanges?: unknown[];
};

const NAVY = { red: 10 / 255, green: 44 / 255, blue: 109 / 255 };
const WHITE = { red: 1, green: 1, blue: 1 };
const STRIPE = { red: 0.953, green: 0.961, blue: 0.976 };
const MAROON = { red: 139 / 255, green: 0, blue: 0 };
const GOLD = { red: 245 / 255, green: 180 / 255, blue: 0 };

const PLAYER_WIDTH = 150;
const TEAM_WIDTHS = [180, 170, 130, 220, 70, ...Array(6).fill(PLAYER_WIDTH), 160, 160, 110, 140];
const LOG_WIDTHS = [130, 160, 150, 140, 180, 170, 130, 220, 70, ...Array(6).fill(PLAYER_WIDTH)];

const tabs = [
  { title: SPORT_TABS["Men's Football"], headers: TEAM_HEADERS, widths: TEAM_WIDTHS, color: NAVY },
  { title: SPORT_TABS["Women's Throwball"], headers: TEAM_HEADERS, widths: TEAM_WIDTHS, color: GOLD },
  { title: LOG_TAB, headers: LOG_HEADERS, widths: LOG_WIDTHS, color: MAROON },
];

const meta = () => sheetsApi<{ sheets: SheetMeta[] }>("?fields=sheets(properties(sheetId,title),bandedRanges(bandedRangeId),protectedRanges(protectedRangeId))");
const update = (requests: unknown[]) => requests.length && sheetsApi(":batchUpdate", { method: "POST", body: { requests } });

let sheets = (await meta()).sheets;
const find = (title: string) => sheets.find((s) => s.properties.title === title);

// Reuse the blank default tab for the first sport instead of leaving it lying around.
const blank = find("Sheet1");
if (blank && !find(tabs[0]!.title)) {
  const used = await sheetsApi<{ values?: unknown[] }>(`/values/${tabRange("Sheet1", "A1:Z50")}`);
  if (used.values?.length) throw new Error("Sheet1 is not empty; refusing to rename it.");
  await update([{ updateSheetProperties: { properties: { sheetId: blank.properties.sheetId, title: tabs[0]!.title }, fields: "title" } }]);
  console.log(`Renamed Sheet1 to "${tabs[0]!.title}"`);
}
sheets = (await meta()).sheets;
const missing = tabs.filter((tab) => !find(tab.title));
await update(missing.map((tab) => ({ addSheet: { properties: { title: tab.title } } })));
for (const tab of missing) console.log(`Added tab "${tab.title}"`);
sheets = (await meta()).sheets;

for (const tab of tabs) {
  const sheet = find(tab.title)!;
  const sheetId = sheet.properties.sheetId;
  const lastColumn = String.fromCharCode(64 + tab.headers.length);

  const current = (await sheetsApi<{ values?: string[][] }>(`/values/${tabRange(tab.title, `A1:${lastColumn}1`)}`)).values?.[0] ?? [];
  if (current.length && current.join("|") !== tab.headers.join("|")) {
    throw new Error(`"${tab.title}" row 1 already has different headers; not touching it: ${current.join(", ")}`);
  }
  if (!current.length) {
    await sheetsApi(`/values/${tabRange(tab.title, `A1:${lastColumn}1`)}?valueInputOption=RAW`, { method: "PUT", body: { values: [tab.headers] } });
  }

  const textColumns = ["Contact number", "Batch"].map((name) => tab.headers.indexOf(name));
  await update([
    { updateSheetProperties: { properties: { sheetId, tabColor: tab.color, gridProperties: { frozenRowCount: 1 } }, fields: "tabColor,gridProperties.frozenRowCount" } },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: tab.headers.length },
        cell: { userEnteredFormat: { backgroundColor: NAVY, textFormat: { bold: true, foregroundColor: WHITE }, verticalAlignment: "MIDDLE", wrapStrategy: "WRAP" } },
        fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment,wrapStrategy)",
      },
    },
    { updateDimensionProperties: { range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 }, properties: { pixelSize: 36 }, fields: "pixelSize" } },
    // Data rows: plain text, so nothing inherits the header style.
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: tab.headers.length },
        cell: { userEnteredFormat: { textFormat: { bold: false, foregroundColor: { red: 0.11, green: 0.14, blue: 0.2 } }, verticalAlignment: "MIDDLE" } },
        fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment)",
      },
    },
    ...tab.widths.map((pixelSize, index) => ({
      updateDimensionProperties: { range: { sheetId, dimension: "COLUMNS", startIndex: index, endIndex: index + 1 }, properties: { pixelSize }, fields: "pixelSize" },
    })),
    // Keep phone numbers and batch years as typed if anyone edits them by hand.
    ...textColumns.map((column) => ({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: column, endColumnIndex: column + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: "TEXT" } } },
        fields: "userEnteredFormat.numberFormat",
      },
    })),
    ...(sheet.bandedRanges?.length
      ? []
      : [{ addBanding: { bandedRange: { range: { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: tab.headers.length }, rowProperties: { firstBandColor: WHITE, secondBandColor: STRIPE } } } }]),
    // The log is the record of every submission: warn anyone who tries to edit it.
    ...(tab.title === LOG_TAB && !sheet.protectedRanges?.length
      ? [{ addProtectedRange: { protectedRange: { range: { sheetId }, description: "Record of every website submission. Do not edit.", warningOnly: true } } }]
      : []),
  ]);
  console.log(`Formatted "${tab.title}"`);
}

// Sport tabs first, log last.
await update(tabs.map((tab, index) => ({ updateSheetProperties: { properties: { sheetId: find(tab.title)!.properties.sheetId, index }, fields: "index" } })));
console.log("Done.");
