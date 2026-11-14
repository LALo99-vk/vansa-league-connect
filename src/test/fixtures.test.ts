import { describe, expect, it } from "vitest";
import { parseSportTab } from "@/lib/fixtures";

// The organiser's FOOTBALL tab as written: title rows on top, header on row 4.
const head = [
  ["VANSA 2026 – Football Fixtures"],
  ["Venue: Football Ground"],
  [],
  ["Match", "Time", "Team A", "Team B", "Score A", "Score B", "Stage", "Venue", "Winner", "Status"],
];
const row = (id: string, a: string, b: string, sa = "", sb = "", stage = "League", winner = "", status = "") => [id, "10:30 – 10:50", a, b, sa, sb, stage, "Football Ground", winner, status];

describe("fixture tabs", () => {
  it("reads the organiser's layout with nothing played", () => {
    const data = parseSportTab("football", [...head, row("M1", "Stanley United", "Mencity"), row("FINAL", "1st in league", "2nd in league", "", "", "Final")]);
    expect(data.league).toHaveLength(1);
    expect(data.final?.teamA).toBe("");
    expect(data.final?.placeholderA).toBe("1st in league");
    expect(data.standings.map((r) => r.points)).toEqual([0, 0]);
    expect(data.champion).toBeNull();
  });

  it("scores the league 3/1/0, fills the final, and crowns the final's winner", () => {
    const grid = [
      ...head,
      row("M1", "A", "B", "2", "0"),
      row("M2", "C", "D", "1", "1"),
      row("M3", "A", "C", "1", "0"),
      row("M4", "B", "D", "0", "3"),
      row("M5", "A", "D", "0", "0"),
      row("M6", "B", "C", "2", "1"),
      row("FINAL", "1st in league", "2nd in league", "1", "1", "Final", "2nd in league"),
    ];
    const data = parseSportTab("football", grid);
    expect(data.standings.map((r) => [r.team, r.points])).toEqual([["A", 7], ["D", 5], ["B", 3], ["C", 1]]);
    expect(data.final?.teamA).toBe("A");
    expect(data.final?.teamB).toBe("D");
    expect(data.champion).toBe("D");
  });

  it("a level final with no winner doesn't crown anyone", () => {
    const data = parseSportTab("volleyball", [...head, row("M1", "A", "B", "2", "1"), row("FINAL", "A", "B", "1", "1", "Final")]);
    expect(data.champion).toBeNull();
    expect(data.warnings.join()).toMatch(/level/);
  });

  it("a live match with a score so far doesn't count yet", () => {
    const data = parseSportTab("football", [...head, row("M1", "A", "B", "1", "0", "League", "", "Live")]);
    expect(data.league[0]?.status).toBe("live");
    expect(data.standings[0]?.played).toBe(0);
  });

  it("works out GF, GA and GD for every football team", () => {
    const grid = [...head, row("M1", "A", "B", "3", "1"), row("M2", "C", "D", "0", "2"), row("M3", "A", "C", "1", "1")];
    const data = parseSportTab("football", grid);
    const a = data.standings.find((r) => r.team === "A")!;
    expect([a.played, a.won, a.drawn, a.lost, a.scored, a.conceded, a.points]).toEqual([2, 1, 1, 0, 4, 2, 4]);
    const c = data.standings.find((r) => r.team === "C")!;
    expect([c.played, c.drawn, c.lost, c.scored, c.conceded, c.points]).toEqual([2, 1, 1, 1, 3, 1]);
    // A 4 pts, D 3, B 0 (-2), C 1 → A, D, C, B
    expect(data.standings.map((r) => r.team)).toEqual(["A", "D", "C", "B"]);
  });

  it("volleyball: win 2, loss 0, sets won/lost, set difference breaks ties", () => {
    const grid = [
      ...head,
      row("M1", "09 Files", "Ace Holes", "2", "0"),
      row("M2", "Kiss my ace", "X", "2", "1"),
      row("M3", "09 Files", "Kiss my ace", "1", "2"),
      row("M4", "Ace Holes", "X", "2", "0"),
      row("M5", "Kiss my ace", "Ace Holes", "0", "2"),
      row("M6", "09 Files", "X", "2", "1"),
      row("FINAL", "1st in league", "2nd in league", "", "", "Final"),
    ];
    const data = parseSportTab("volleyball", grid);
    // 09 Files 4 pts (5–3, +2), Kiss my ace 4 (4–4, 0), Ace Holes 4 (4–2, +2), X 0
    const files = data.standings.find((r) => r.team === "09 Files")!;
    expect([files.won, files.lost, files.scored, files.conceded, files.points]).toEqual([2, 1, 5, 3, 4]);
    expect(data.standings.map((r) => [r.team, r.points])).toEqual([["09 Files", 4], ["Ace Holes", 4], ["Kiss my ace", 4], ["X", 0]]);
    expect(data.standings.every((r) => r.drawn === 0)).toBe(true);
    expect(data.final?.teamA).toBe("09 Files");
    expect(data.final?.teamB).toBe("Ace Holes");
  });

  it("volleyball: level sets don't count until a winner is picked", () => {
    const level = parseSportTab("volleyball", [...head, row("M1", "A", "B", "1", "1")]);
    expect(level.standings[0]?.played).toBe(0);
    expect(level.warnings.join()).toMatch(/pick the winner/);
    const picked = parseSportTab("volleyball", [...head, row("M1", "A", "B", "1", "1", "League", "B")]);
    expect(picked.standings.map((r) => [r.team, r.points])).toEqual([["B", 2], ["A", 0]]);
  });
});
