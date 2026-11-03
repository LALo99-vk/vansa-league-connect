/**
 * Saves a registration to the Google Sheet. Server-only.
 *
 * A submission only counts as saved once Google has confirmed every write and the
 * values it echoes back match what we sent. Order of writes:
 *   1. Add the submission to "All submissions" with "Saved to tab" = Pending,
 *      so every attempt is on record even if a later step fails.
 *   2. Add or update the row in the sport's team tab or solo tab (matched on
 *      contact number).
 *   3. Mark the log row as saved.
 * Any failure throws, and the form tells the person nothing was confirmed.
 */
import { sheetsApi, tabRange, withRetry, SheetsError } from "./google-sheets";
import { LOG_COL, LOG_LAST_COLUMN, LOG_SAVED_COLUMN, LOG_TAB, SOLO_COL, SOLO_LAST_COLUMN, SOLO_TABS, SOLO_WRITE_LAST_COLUMN, SPORT_TABS, TEAM_COL, TEAM_LAST_COLUMN } from "./sheet-layout";
import { playersNamed, type RegistrationData } from "./registration";

export type SaveResult = { reference: string; action: "new" | "updated"; savedAt: string; entryType: RegistrationData["entryType"] };

type ValueRange = { values?: string[][] };
type WriteResponse = { updatedRange?: string; updatedRows?: number; updatedData?: ValueRange };

const PENDING = "Pending";
const SAVED = {
  Team: { new: "Yes, new team", updated: "Yes, updated team" },
  Solo: { new: "Yes, new solo player", updated: "Yes, updated solo player" },
} as const;

/** Where one kind of entry lives: which columns the site writes and how a row is matched. */
type RowLayout = {
  readColumn: string; writeColumn: string; contact: number; registeredAt: number; timesUpdated: number; reference: number; what: string;
};
const TEAM_ROWS: RowLayout = { readColumn: TEAM_LAST_COLUMN, writeColumn: TEAM_LAST_COLUMN, ...TEAM_COL, what: "the team row" };
// Solo rows are read up to "Group" but written only up to the column before it,
// so a group the organisers assigned is never overwritten.
const SOLO_ROWS: RowLayout = { readColumn: SOLO_LAST_COLUMN, writeColumn: SOLO_WRITE_LAST_COLUMN, ...SOLO_COL, what: "the solo player row" };

/** "2026-10-15 18:45:12": sorts correctly as text and needs no locale parsing. */
export function formatIst(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "medium" }).format(date);
}

/** Short, readable reference a captain can quote, e.g. VNS-1015-K7Q2. */
function newReference(date: Date) {
  const [, month, day] = formatIst(date).slice(0, 10).split("-");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), (byte) => alphabet[byte % alphabet.length]).join("");
  return `VNS-${month}${day}-${random}`;
}

// One write at a time per server instance, so two captains submitting together
// can't both decide the same team row is free.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

function rowNumberOf(updatedRange: string | undefined) {
  const match = updatedRange?.match(/![A-Z]+(\d+)/);
  if (!match) throw new SheetsError(`Google did not report which row was written (${updatedRange ?? "no range"}).`);
  return Number(match[1]);
}

/** Throws unless Google echoed back exactly the row we sent. */
function verifyWrite(response: WriteResponse, sent: string[], what: string) {
  const echoed = response.updatedData?.values?.[0] ?? [];
  const mismatch = sent.findIndex((value, index) => value !== (echoed[index] ?? ""));
  if ((response.updatedRows ?? 0) !== 1 || mismatch !== -1) {
    throw new SheetsError(`Could not confirm ${what}: Google reported ${response.updatedRows ?? 0} rows written${mismatch === -1 ? "" : `, column ${mismatch + 1} differs`}.`);
  }
}

async function readRows(tab: string, lastColumn: string) {
  const data = await sheetsApi<ValueRange>(`/values/${tabRange(tab, `A2:${lastColumn}`)}?valueRenderOption=FORMATTED_VALUE`);
  return data.values ?? [];
}

/** Writes into the next empty row. OVERWRITE (not INSERT_ROWS) so the row keeps the
 *  plain data formatting instead of copying the header row's style. */
async function appendRow(tab: string, lastColumn: string, row: string[], what: string) {
  const response = await sheetsApi<{ updates: WriteResponse }>(
    `/values/${tabRange(tab, `A1:${lastColumn}`)}:append?valueInputOption=RAW&insertDataOption=OVERWRITE&includeValuesInResponse=true`,
    { method: "POST", body: { values: [row] } },
  );
  verifyWrite(response.updates, row, what);
  return rowNumberOf(response.updates.updatedRange);
}

async function writeRow(tab: string, cells: string, row: string[], what: string) {
  const response = await sheetsApi<WriteResponse>(`/values/${tabRange(tab, cells)}?valueInputOption=RAW&includeValuesInResponse=true`, {
    method: "PUT",
    body: { values: [row] },
  });
  verifyWrite(response, row, what);
}

/** Adds the log row, unless an earlier attempt already did (a retry after a lost response). */
async function logSubmission(row: string[]) {
  const reference = row[LOG_COL.reference];
  const existing = (await readRows(LOG_TAB, LOG_LAST_COLUMN)).findIndex((r) => r[LOG_COL.reference] === reference);
  if (existing !== -1) return existing + 2;
  return appendRow(LOG_TAB, LOG_LAST_COLUMN, row, "the submission log");
}

/** Adds the row, or updates it if this contact number already registered in this tab.
 *  `build` turns the tracking values (registered at, last updated, times updated,
 *  reference) into the full row for that layout. */
async function saveRow(
  tab: string, layout: RowLayout, contact: string, at: string, reference: string,
  build: (registeredAt: string, updatedAt: string, timesUpdated: string, reference: string) => string[],
): Promise<SaveResult["action"]> {
  const rows = await readRows(tab, layout.readColumn);
  const index = rows.findIndex((r) => r[layout.contact] === contact);
  const existing = rows[index];

  if (index === -1 || !existing) {
    await appendRow(tab, layout.writeColumn, build(at, at, "0", reference), layout.what);
    return "new";
  }
  // A retry of a write that already landed: nothing more to do.
  if (existing[layout.reference] === reference) return existing[layout.timesUpdated] === "0" ? "new" : "updated";
  const timesUpdated = String((Number(existing[layout.timesUpdated]) || 0) + 1);
  const row = build(existing[layout.registeredAt] || at, at, timesUpdated, reference);
  const rowNumber = index + 2;
  await writeRow(tab, `A${rowNumber}:${layout.writeColumn}${rowNumber}`, row, layout.what);
  return "updated";
}

export function saveRegistration(data: RegistrationData): Promise<SaveResult> {
  return serialize(async () => {
    const now = new Date();
    const at = formatIst(now);
    const reference = newReference(now);
    const isTeam = data.entryType === "Team";
    const tab = isTeam ? SPORT_TABS[data.sport] : SOLO_TABS[data.sport];
    const person = [data.phone, data.email, data.registrantType, data.batch, data.studentClass];
    const players = [data.player1, data.player2, data.player3, data.player4, data.player5, data.player6];

    const logRow = await withRetry(() =>
      logSubmission([reference, at, PENDING, data.entryType, tab, data.teamName, data.captainName, ...person, ...players]));
    const action = await withRetry(() => isTeam
      ? saveRow(tab, TEAM_ROWS, data.phone, at, reference, (...tracking) =>
        [data.teamName, data.captainName, ...person, String(playersNamed(data)), ...players, ...tracking])
      : saveRow(tab, SOLO_ROWS, data.phone, at, reference, (...tracking) => [data.captainName, ...person, ...tracking]));
    await withRetry(() => writeRow(LOG_TAB, `${LOG_SAVED_COLUMN}${logRow}`, [SAVED[data.entryType][action]], "the log status"));
    return { reference, action, savedAt: at, entryType: data.entryType };
  });
}
