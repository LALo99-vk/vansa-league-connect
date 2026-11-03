import { describe, expect, it } from "vitest";
import { registrationSchema, isRegistrationClosed, playersNamed, SPORT_OPTIONS, PLAYER_COUNT, MIN_TEAM_PLAYERS } from "@/lib/registration";

const entry = {
  entryType: "Team", captainName: " Captain Name ", phone: " 9876543210 ", email: " captain@example.com ", registrantType: "Alumni", batch: " 2018 ", studentClass: "", teamName: " Alumni United ", sport: "Men's Football",
  player2: " Player Two ", player3: " Player Three ", player4: " Player Four ", player5: " Player Five ", player6: " Player Six ",
};
const solo = { entryType: "Solo", captainName: "Solo Player", phone: "9876543211", email: "solo@example.com", registrantType: "Alumni", batch: "2015", studentClass: "", sport: "Women's Volleyball" };

describe("VANSA team registration", () => {
  it("accepts a full team, trims every value and makes the captain player 1", () => {
    const result = registrationSchema.parse(entry);
    expect(Object.values(result).every((value) => value === value.trim())).toBe(true);
    expect(result.captainName).toBe("Captain Name");
    expect(result.player1).toBe("Captain Name");
    expect(result.player6).toBe("Player Six");
    expect(playersNamed(result)).toBe(6);
  });
  it("ignores a player 1 sent by the browser", () => {
    expect(registrationSchema.parse({ ...entry, player1: "Someone Else" }).player1).toBe("Captain Name");
  });
  it("requires the shared fields and the team name", () => {
    for (const key of ["entryType", "captainName", "phone", "email", "registrantType", "batch", "sport", "teamName"]) {
      expect(registrationSchema.safeParse({ ...entry, [key]: "   " }).success).toBe(false);
    }
  });
  it("needs at least 4 players including the captain", () => {
    expect(MIN_TEAM_PLAYERS).toBe(4);
    const four = registrationSchema.parse({ ...entry, player5: "", player6: "  " });
    expect(playersNamed(four)).toBe(4);
    expect([four.player5, four.player6]).toEqual(["", ""]);

    const three = registrationSchema.safeParse({ ...entry, player4: "", player5: "", player6: "" });
    expect(three.success).toBe(false);
    if (!three.success) {
      expect(three.error.issues[0]?.path).toEqual(["player4"]);
      expect(three.error.issues[0]?.message).toMatch(/Register as Solo/);
    }
  });
  it("closes gaps between named players", () => {
    const result = registrationSchema.parse({ ...entry, player3: "", player4: "", player5: "Five", player6: "Six" });
    expect([result.player2, result.player3, result.player4, result.player5, result.player6]).toEqual(["Player Two", "Five", "Six", "", ""]);
  });
  it("accepts exactly ten numeric phone digits", () => {
    for (const phone of ["12345", "98765432101", "+919876543210", "98765abc10", "98765 3210"]) {
      expect(registrationSchema.safeParse({ ...entry, phone }).success).toBe(false);
    }
  });
  it("validates email, year and the two sports", () => {
    expect(registrationSchema.safeParse({ ...entry, email: "invalid" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...entry, batch: "2027" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...entry, batch: "12" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...entry, batch: "1979" }).success).toBe(true);
    expect(registrationSchema.safeParse({ ...entry, sport: "Cricket" }).success).toBe(false);
    for (const sport of SPORT_OPTIONS) expect(registrationSchema.safeParse({ ...entry, sport }).success).toBe(true);
    expect(PLAYER_COUNT).toBe(6);
  });
  it("asks current students for their class, not a graduation year", () => {
    const student = { ...entry, registrantType: "Current student", batch: "", studentClass: "10th" };
    expect(registrationSchema.parse(student)).toMatchObject({ batch: "", studentClass: "10th" });
    expect(registrationSchema.safeParse({ ...student, studentClass: "" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...student, studentClass: "11th" }).success).toBe(false);
    expect(registrationSchema.parse({ ...student, batch: "2012" }).batch).toBe("");
    expect(registrationSchema.parse({ ...entry, studentClass: "12th" }).studentClass).toBe("");
    expect(registrationSchema.safeParse({ ...entry, registrantType: "Parent" }).success).toBe(false);
  });
  it("re-validates its own output, as the server does", () => {
    const once = registrationSchema.parse({ ...entry, player3: "", player6: "" });
    expect(registrationSchema.parse(once)).toEqual(once);
  });
});

describe("VANSA solo registration", () => {
  it("needs no team name or players", () => {
    const result = registrationSchema.parse(solo);
    expect(result).toMatchObject({ entryType: "Solo", captainName: "Solo Player", teamName: "", player1: "", player2: "", player6: "" });
    expect(playersNamed(result)).toBe(0);
  });
  it("drops team fields filled in before switching to solo", () => {
    const result = registrationSchema.parse({ ...solo, teamName: "Old Team", player2: "A", player3: "B", player4: "C" });
    expect([result.teamName, result.player1, result.player2, result.player4]).toEqual(["", "", "", ""]);
  });
  it("still checks the person's own details", () => {
    for (const key of ["captainName", "phone", "email", "registrantType", "batch", "sport"]) {
      expect(registrationSchema.safeParse({ ...solo, [key]: "  " }).success).toBe(false);
    }
    expect(registrationSchema.safeParse({ ...solo, entryType: "Pair" }).success).toBe(false);
  });
});

describe("VANSA registration window", () => {
  it("stays open until closed by hand", () => {
    expect(isRegistrationClosed()).toBe(false);
  });
});
