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

const PERSON_HEADERS = ["Contact number", "Email", "Registering as", "Batch", "Class"];
const PLAYER_HEADERS = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"];
const TRACKING_HEADERS = ["Registered at (IST)", "Last updated (IST)", "Times updated", "Latest reference"];

/** One row per team. A captain registering again (same contact number) updates their row. */
export const TEAM_HEADERS = ["Team name", "Captain", ...PERSON_HEADERS, "Players named", ...PLAYER_HEADERS, ...TRACKING_HEADERS];

/** One row per solo player, matched on contact number like teams. The site never
 *  writes the last column, "Group": organisers (or the grouping script) fill it in,
 *  and it survives the player registering again. */
export const SOLO_HEADERS = ["Name", ...PERSON_HEADERS, ...TRACKING_HEADERS, "Group"];

export const LOG_HEADERS = ["Reference", "Received at (IST)", "Saved to tab", "Entry type", "Sport tab", "Team name", "Name", ...PERSON_HEADERS, ...PLAYER_HEADERS];

// Zero-based column positions the server relies on.
export const TEAM_COL = { contact: 2, playersNamed: 7, registeredAt: 14, timesUpdated: 16, reference: 17 } as const;
export const SOLO_COL = { contact: 1, registeredAt: 6, timesUpdated: 8, reference: 9, group: 10 } as const;
export const LOG_COL = { reference: 0, contact: 7 } as const;
export const LOG_SAVED_COLUMN = "C"; // "Saved to tab"

export const TEAM_LAST_COLUMN = "R"; // TEAM_HEADERS.length === 18
export const SOLO_WRITE_LAST_COLUMN = "J"; // the site writes A–J; K is "Group"
export const SOLO_LAST_COLUMN = "K"; // SOLO_HEADERS.length === 11
export const LOG_LAST_COLUMN = "R"; // LOG_HEADERS.length === 18
