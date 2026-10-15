/**
 * Saves a registration to the Google Sheet. Server-only.
 *
 * A submission only counts as saved once Google has confirmed every write and the
 * values it echoes back match what we sent. Order of writes:
 *   1. Add the submission to "All submissions" with "Saved to team tab" = Pending,
 *      so every attempt is on record even if a later step fails.
 *   2. Add or update the team's row in its sport tab (matched on contact number).
 *   3. Mark the log row as saved.
 * Any failure throws, and the form tells the captain nothing was confirmed.
 */
import { sheetsApi, tabRange, withRetry, SheetsError } from "./google-sheets";
import { LOG_COL, LOG_LAST_COLUMN, LOG_SAVED_COLUMN, LOG_TAB, SPORT_TABS, TEAM_COL, TEAM_LAST_COLUMN } from "./sheet-layout";
import type { RegistrationData } from "./registration";

export type SaveResult = { reference: string; action: "new" | "updated"; savedAt: string };

type ValueRange = { values?: string[][] };
type WriteResponse = { updatedRange?: string; updatedRows?: number; updatedData?: ValueRange };

const PENDING = "Pending";
const SAVED = { new: "Yes, new team", updated: "Yes, updated team" } as const;

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

/** Adds the team, or updates it if this contact number already registered for this sport. */
async function saveTeam(tab: string, details: string[], at: string, reference: string): Promise<SaveResult["action"]> {
  const contact = details[TEAM_COL.contact];
  const rows = await readRows(tab, TEAM_LAST_COLUMN);
  const index = rows.findIndex((r) => r[TEAM_COL.contact] === contact);
  const existing = rows[index];

  if (index === -1 || !existing) {
    await appendRow(tab, TEAM_LAST_COLUMN, [...details, at, at, "0", reference], "the team row");
    return "new";
  }
  // A retry of a write that already landed: nothing more to do.
  if (existing[TEAM_COL.reference] === reference) return existing[TEAM_COL.timesUpdated] === "0" ? "new" : "updated";
  const timesUpdated = String((Number(existing[TEAM_COL.timesUpdated]) || 0) + 1);
  const row = [...details, existing[TEAM_COL.registeredAt] || at, at, timesUpdated, reference];
  const rowNumber = index + 2;
  await writeRow(tab, `A${rowNumber}:${TEAM_LAST_COLUMN}${rowNumber}`, row, "the team row");
  return "updated";
}

export function saveRegistration(data: RegistrationData): Promise<SaveResult> {
  return serialize(async () => {
    const now = new Date();
    const at = formatIst(now);
    const reference = newReference(now);
    const tab = SPORT_TABS[data.sport];
    const details = [
      data.teamName, data.captainName, data.phone, data.email, data.batch,
      data.player1, data.player2, data.player3, data.player4, data.player5, data.player6,
    ];

    const logRow = await withRetry(() => logSubmission([reference, at, PENDING, tab, ...details]));
    const action = await withRetry(() => saveTeam(tab, details, at, reference));
    await withRetry(() => writeRow(LOG_TAB, `${LOG_SAVED_COLUMN}${logRow}`, [SAVED[action]], "the log status"));
    return { reference, action, savedAt: at };
  });
}
