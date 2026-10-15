// Layout of the registrations spreadsheet. Shared by the server code that writes
// registrations and by scripts/setup-sheet.ts, which creates the tabs — so this
// file must stay free of imports.
//
// Organisers may sort rows or add their own columns to the right of the last
// column, but must not insert, delete or reorder the columns listed here: the
// site writes by position.

export const SPORT_TABS = {
  "Men's Football": "Football (Men)",
  "Women's Throwball": "Throwball (Women)",
} as const;

/** Every form submission, in the order received. Rows are only ever added. */
export const LOG_TAB = "All submissions";

const DETAIL_HEADERS = [
  "Team name",
  "Captain",
  "Contact number",
  "Email",
  "Batch",
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6",
];

/** One row per team. A captain registering again (same contact number) updates their row. */
export const TEAM_HEADERS = [
  ...DETAIL_HEADERS,
  "Registered at (IST)",
  "Last updated (IST)",
  "Times updated",
  "Latest reference",
];

export const LOG_HEADERS = ["Reference", "Received at (IST)", "Saved to team tab", "Sport", ...DETAIL_HEADERS];

// Zero-based column positions the server relies on.
export const TEAM_COL = {
  contact: 2,
  registeredAt: 11,
  timesUpdated: 13,
  reference: 14,
} as const;
export const LOG_COL = { reference: 0 } as const;
export const LOG_SAVED_COLUMN = "C"; // "Saved to team tab"

export const TEAM_LAST_COLUMN = "O"; // TEAM_HEADERS.length === 15
export const LOG_LAST_COLUMN = "O"; // LOG_HEADERS.length === 15
