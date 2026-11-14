// Turns the FOOTBALL and VOLLEYBALL fixture tabs into what the fixtures page draws.
// Browser-safe and import-free apart from types, so tests can feed it plain grids.
//
// Tab layout (the organiser's, kept as he made it): a title and a note on top, then a
// header row with Match | Time | Team A | Team B | Score A | Score B | Stage | Venue |
// Winner | Status. Stage is "League" for the round robin and "Final" for the final.
// The header row is found by looking for "Team A" and "Team B", so title rows above it
// and extra columns to the right don't matter.
//
// The site works out the table itself from the scores. It never reads the STANDINGS
// tab, which the desk may or may not keep up to date.

export type FixtureSport = "football" | "volleyball";

// The organiser's rules, from his STANDINGS tab: football Win 3 · Draw 1 · Loss 0, tie-break
// goal difference; volleyball Win 2 · Loss 0, tie-break set difference (no draws).
export const SPORTS: { slug: FixtureSport; label: string; tab: string; scoreLabel: string; win: number; draw: number; draws: boolean; cols: { for: string; against: string; diff: string }; tieBreak: string }[] = [
  { slug: "football", label: "Football", tab: "FOOTBALL", scoreLabel: "Goals", win: 3, draw: 1, draws: true, cols: { for: "GF", against: "GA", diff: "GD" }, tieBreak: "goal difference" },
  { slug: "volleyball", label: "Volleyball", tab: "VOLLEYBALL", scoreLabel: "Sets", win: 2, draw: 0, draws: false, cols: { for: "SW", against: "SL", diff: "SD" }, tieBreak: "set difference" },
];

export type MatchStatus = "upcoming" | "live" | "completed";

export type Fixture = {
  id: string; // "M1", "FINAL"
  time: string;
  venue: string;
  teamA: string;
  teamB: string;
  /** Shown instead of a name while the finalist isn't known, e.g. "1st in league". */
  placeholderA: string | null;
  placeholderB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  /** "draw" only in the league; a final needs a winner. */
  result: "a" | "b" | "draw" | null;
};

export type StandingRow = {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scored: number;
  conceded: number;
  points: number;
};

export type SportFixtures = {
  slug: FixtureSport;
  league: Fixture[];
  final: Fixture | null;
  standings: StandingRow[];
  leagueComplete: boolean;
  /** Set when the top two can't be told apart and the desk must settle it by hand. */
  tieNote: string | null;
  champion: string | null;
  warnings: string[];
};

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const clean = (value: string | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

const HEADERS: Record<string, string[]> = {
  id: ["match", "matchno", "no"],
  time: ["time", "timing", "slot"],
  teamA: ["teama", "team1"],
  teamB: ["teamb", "team2"],
  scoreA: ["scorea", "score1"],
  scoreB: ["scoreb", "score2"],
  stage: ["stage", "round"],
  venue: ["venue", "ground", "court"],
  winner: ["winner"],
  status: ["status"],
};

function findHeader(grid: string[][]): { row: number; cols: Record<string, number> } | null {
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const keys = (grid[r] ?? []).map((c) => norm(c ?? ""));
    if (!keys.includes("teama") && !keys.includes("team1")) continue;
    const cols: Record<string, number> = {};
    for (const [field, aliases] of Object.entries(HEADERS)) {
      const at = keys.findIndex((k) => aliases.includes(k));
      if (at >= 0) cols[field] = at;
    }
    if (cols["teamA"] !== undefined && cols["teamB"] !== undefined) return { row: r, cols };
  }
  return null;
}

const toScore = (value: string) => (/^\d+$/.test(value) ? Number(value) : null);

/** "1st in league", "2nd in league", "Winner of league", "TBD": a finalist not yet known. */
const isPlaceholder = (name: string) => !name || /\b(1st|2nd|first|second|winner|runner|tbd|tbc|league)\b/i.test(name);

function readStatus(value: string): MatchStatus | null {
  const key = norm(value);
  if (["live", "ongoing", "inprogress", "playing"].includes(key)) return "live";
  if (["completed", "complete", "done", "finished", "played", "ft"].includes(key)) return "completed";
  if (["upcoming", "scheduled", "notstarted", "yettostart"].includes(key)) return "upcoming";
  return null;
}

function readRow(row: string[], cols: Record<string, number>, sheetRow: number, warnings: string[], draws: boolean): Fixture & { stage: string } {
  const get = (field: string) => (cols[field] === undefined ? "" : clean(row[cols[field] as number]));
  const teamA = get("teamA");
  const teamB = get("teamB");
  const scoreA = toScore(get("scoreA"));
  const scoreB = toScore(get("scoreB"));
  const winnerCell = get("winner");
  const statusCell = readStatus(get("status"));
  const id = get("id") || `Row ${sheetRow}`;

  let result: Fixture["result"] = null;
  if (winnerCell) {
    if (norm(winnerCell) === norm(teamA)) result = "a";
    else if (norm(winnerCell) === norm(teamB)) result = "b";
    else if (norm(winnerCell) === "draw") result = "draw";
    else warnings.push(`${id}: winner "${winnerCell}" isn't either team.`);
  }
  // Both scores in and the match isn't still marked live: the scores decide it.
  if (!result && scoreA !== null && scoreB !== null && statusCell !== "live" && statusCell !== "upcoming") {
    result = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : "draw";
  }
  // Volleyball has no draws: level sets only count once the Winner column says who won.
  if (result === "draw" && !draws && norm(winnerCell) !== "draw") {
    warnings.push(`${id}: scores are level – pick the winner in the Winner column.`);
    result = null;
  }

  const status: MatchStatus = result ? "completed" : statusCell === "completed" ? "live" : (statusCell ?? "upcoming");
  if (statusCell === "completed" && !result) warnings.push(`${id}: marked Completed but has no score yet.`);

  return {
    id,
    stage: get("stage"),
    time: get("time"),
    venue: get("venue"),
    teamA,
    teamB,
    placeholderA: null,
    placeholderB: null,
    scoreA,
    scoreB,
    status,
    result,
  };
}

function buildStandings(league: Fixture[], win: number, draw: number): StandingRow[] {
  const teams: string[] = [];
  for (const m of league) for (const t of [m.teamA, m.teamB]) if (t && !teams.some((k) => norm(k) === norm(t))) teams.push(t);
  const rows = teams.map((team): StandingRow => ({ team, played: 0, won: 0, drawn: 0, lost: 0, scored: 0, conceded: 0, points: 0 }));
  for (const m of league) {
    if (!m.result) continue;
    for (const side of ["a", "b"] as const) {
      const row = rows.find((r) => norm(r.team) === norm(side === "a" ? m.teamA : m.teamB));
      if (!row) continue;
      row.played += 1;
      row.scored += (side === "a" ? m.scoreA : m.scoreB) ?? 0;
      row.conceded += (side === "a" ? m.scoreB : m.scoreA) ?? 0;
      if (m.result === "draw") {
        row.drawn += 1;
        row.points += draw;
      } else if (m.result === side) {
        row.won += 1;
        row.points += win;
      } else row.lost += 1;
    }
  }
  // Points, then the difference (the organiser's tie-break), then scored, then fixture order.
  return rows.sort(
    (a, b) => b.points - a.points || b.scored - b.conceded - (a.scored - a.conceded) || b.scored - a.scored || teams.indexOf(a.team) - teams.indexOf(b.team),
  );
}

const level = (a: StandingRow, b: StandingRow) => a.points === b.points && a.scored - a.conceded === b.scored - b.conceded && a.scored === b.scored;

export function parseSportTab(slug: FixtureSport, grid: string[][]): SportFixtures {
  const sport = SPORTS.find((s) => s.slug === slug)!;
  const warnings: string[] = [];
  const empty: SportFixtures = { slug, league: [], final: null, standings: [], leagueComplete: false, tieNote: null, champion: null, warnings };
  const header = findHeader(grid);
  if (!header) {
    if (grid.length) warnings.push(`${sport.tab}: no header row with "Team A" and "Team B".`);
    return empty;
  }

  const league: Fixture[] = [];
  let final: Fixture | null = null;
  grid.slice(header.row + 1).forEach((row, index) => {
    const sheetRow = header.row + index + 2;
    if (!row.some((c) => clean(c))) return;
    const match = readRow(row, header.cols, sheetRow, warnings, sport.draws);
    if (!match.teamA && !match.teamB) return;
    const { stage, ...fixture } = match;
    if (/final/i.test(stage) || /final/i.test(fixture.id)) final = fixture;
    else league.push(fixture);
  });

  const standings = buildStandings(league, sport.win, sport.draw);
  const leagueComplete = league.length > 0 && league.every((m) => m.result);
  const [first, second, third] = standings;
  // Only 2nd v 3rd matters: if 1st and 2nd are level, both are finalists either way.
  const tieNote =
    leagueComplete && first && second && third && level(second, third)
      ? `${second.team} and ${third.team} are level on points, ${sport.tieBreak} and ${sport.scoreLabel.toLowerCase()} scored; the organisers will settle the second finalist.`
      : null;

  let champion: string | null = null;
  if (final) {
    const f: Fixture = final;
    // The desk may type the finalists in; until then fill them from the table once the league is done.
    const fill = (name: string, place: number): [string, string | null] => {
      if (!isPlaceholder(name)) return [name, null];
      const known = leagueComplete && !tieNote ? standings[place]?.team : undefined;
      return known ? [known, name || null] : ["", name || (place === 0 ? "1st in league" : "2nd in league")];
    };
    const [teamA, placeholderA] = fill(f.teamA, 0);
    const [teamB, placeholderB] = fill(f.teamB, 1);
    // A Winner cell may still say "1st in league" if the desk picked it from the dropdown before typing names.
    let result = f.result;
    if (result === "draw") {
      result = null;
      if (f.scoreA !== null) warnings.push("FINAL: scores are level – put the winner (e.g. on penalties) in the Winner column.");
    }
    final = { ...f, teamA, teamB, placeholderA, placeholderB, result, status: result ? "completed" : f.status === "completed" ? "live" : f.status };
    if (result === "a" && teamA) champion = teamA;
    if (result === "b" && teamB) champion = teamB;
  }

  return { slug, league, final, standings, leagueComplete, tieNote, champion, warnings };
}
