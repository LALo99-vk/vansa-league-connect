// Layout of the registrations spreadsheet. Shared by the server code that writes
// registrations and by scripts/setup-sheet.ts, which creates the tabs — so this
// file must stay free of imports.
//
// Organisers may sort rows or add their own columns to the right of the last
// column, but must not insert, delete or reorder the columns listed here: the
// site writes by position.

export const SPORT_TABS = {
  "Football": "Team – Football",
  "Volleyball": "Team – Volleyball",
} as const;

/** Players who registered without a team, one tab per sport. */
export const SOLO_TABS = {
  "Football": "Solo – Football",
  "Volleyball": "Solo – Volleyball",
} as const;

/** Every form submission, in the order received. Rows are only ever added. */
export const LOG_TAB = "All submissions";

/** Squad size per sport, captain included. Each team tab has this many Player columns. */
export const SQUAD_SIZE = { "Football": 9, "Volleyball": 6 } as const;
type SportName = keyof typeof SQUAD_SIZE;
const MAX_SQUAD = Math.max(...Object.values(SQUAD_SIZE));

const PERSON_HEADERS = ["Contact number", "Email", "Registering as", "Batch", "Class"];
const playerHeaders = (count: number) => Array.from({ length: count }, (_, index) => `Player ${index + 1}`);
const TRACKING_HEADERS = ["Registered at (IST)", "Last updated (IST)", "Times updated", "Latest reference"];

/** 0 → "A", 20 → "U". */
const columnLetter = (index: number) => String.fromCharCode(65 + index);

/** One row per team. A captain registering again (same contact number) updates their row.
 *  The Player columns differ per sport, so everything after them moves too. */
export const teamHeaders = (sport: SportName) =>
  ["Team name", "Captain", ...PERSON_HEADERS, "Players named", ...playerHeaders(SQUAD_SIZE[sport]), ...TRACKING_HEADERS];

/** Zero-based column positions in a sport's team tab, and its last column letter.
 *  Football: tracking in R–U. Volleyball: tracking in O–R. */
export function teamColumns(sport: SportName) {
  const registeredAt = 8 + SQUAD_SIZE[sport];
  return { contact: 2, playersNamed: 7, registeredAt, timesUpdated: registeredAt + 2, reference: registeredAt + 3, lastColumn: columnLetter(registeredAt + 3) };
}

/** One row per solo player, matched on contact number like teams. The site never
 *  writes the last column, "Group": organisers (or the grouping script) fill it in,
 *  and it survives the player registering again. */
export const SOLO_HEADERS = ["Name", ...PERSON_HEADERS, ...TRACKING_HEADERS, "Group"];

/** Players 1–9 for every entry; volleyball teams leave 7–9 blank. */
export const LOG_HEADERS = ["Reference", "Received at (IST)", "Saved to tab", "Entry type", "Sport tab", "Team name", "Name", ...PERSON_HEADERS, ...playerHeaders(MAX_SQUAD)];

// Zero-based column positions the server relies on.
export const SOLO_COL = { contact: 1, registeredAt: 6, timesUpdated: 8, reference: 9, group: 10 } as const;
export const LOG_COL = { reference: 0, contact: 7 } as const;
export const LOG_SAVED_COLUMN = "C"; // "Saved to tab"

export const SOLO_WRITE_LAST_COLUMN = "J"; // the site writes A–J; K is "Group"
export const SOLO_LAST_COLUMN = "K"; // SOLO_HEADERS.length === 11
export const LOG_LAST_COLUMN = "U"; // LOG_HEADERS.length === 21
