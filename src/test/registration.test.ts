import { describe, expect, it } from "vitest";
import { registrationSchema, isRegistrationClosed, SPORT_OPTIONS, PLAYER_COUNT } from "@/lib/registration";

const entry = {
  captainName: " Captain Name ", phone: " 9876543210 ", email: " captain@example.com ", batch: " 2018 ", teamName: " Alumni United ", sport: "Men's Football",
  player1: " Player One ", player2: " Player Two ", player3: " Player Three ", player4: " Player Four ", player5: " Player Five ", player6: " Player Six ",
};

describe("VANSA registration", () => {
  it("accepts all fields and trims every value", () => {
    const result = registrationSchema.parse(entry);
    expect(Object.keys(result)).toHaveLength(12);
    expect(Object.values(result).every((value) => value === value.trim())).toBe(true);
    expect(result.captainName).toBe("Captain Name");
  });
  it("requires every field", () => {
    for (const key of Object.keys(entry)) {
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
    expect(registrationSchema.safeParse({ ...entry, sport: "Cricket" }).success).toBe(false);
    for (const sport of SPORT_OPTIONS) expect(registrationSchema.safeParse({ ...entry, sport }).success).toBe(true);
    expect(PLAYER_COUNT).toBe(6);
  });
  it("closes only after 27 October ends in Bengaluru", () => {
    expect(isRegistrationClosed(new Date("2026-10-27T23:59:59.999+05:30"))).toBe(false);
    expect(isRegistrationClosed(new Date("2026-10-28T00:00:00+05:30"))).toBe(true);
  });
});