import { describe, expect, it } from "vitest";
import { registrationSchema, isRegistrationClosed, SPORT_OPTIONS, PLAYER_COUNT } from "@/lib/registration";

const entry = {
  captainName: " Captain Name ", phone: " 9876543210 ", email: " captain@example.com ", registrantType: "Alumni", batch: " 2018 ", studentClass: "", teamName: " Alumni United ", sport: "Men's Football",
  player1: " Player One ", player2: " Player Two ", player3: " Player Three ", player4: " Player Four ", player5: " Player Five ", player6: " Player Six ",
};

describe("VANSA registration", () => {
  it("accepts all fields and trims every value", () => {
    const result = registrationSchema.parse(entry);
    expect(Object.keys(result)).toHaveLength(14);
    expect(Object.values(result).every((value) => value === value.trim())).toBe(true);
    expect(result.captainName).toBe("Captain Name");
  });
  it("requires every field", () => {
    for (const key of Object.keys(entry).filter((k) => k !== "studentClass")) {
      expect(registrationSchema.safeParse({ ...entry, [key]: "   " }).success).toBe(false);
    }
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
  it("stays open until closed by hand", () => {
    expect(isRegistrationClosed()).toBe(false);
  });
});