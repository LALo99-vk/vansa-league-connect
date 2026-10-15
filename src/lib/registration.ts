import { z } from "zod";

export const PLAYER_COUNT = 6;
export const SPORT_OPTIONS = ["Men's Football", "Women's Throwball"] as const;
export const REGISTRATION_CLOSING_DATE = "2026-10-27";
// The school's first graduating batch is not known, so allow a generous range.
export const BATCH_MIN_YEAR = 1950;
export const BATCH_MAX_YEAR = 2026;
// Registration remains open through midnight in Bengaluru (IST).
export const REGISTRATION_CLOSES_AT = "2026-10-27T23:59:59.999+05:30";

const requiredName = z.string().trim().min(1, "Please enter a name.").max(100, "Please use 100 characters or fewer.");

export const registrationSchema = z.object({
  captainName: requiredName,
  phone: z.string().trim().regex(/^\d{10}$/, "Please enter a 10-digit mobile number."),
  email: z.string().trim().min(1, "Please enter your email address.").email("Please enter a valid email address.").max(255, "Please use 255 characters or fewer."),
  batch: z.string().trim().regex(/^\d{4}$/, "Please enter the year you graduated, e.g. 2012.").refine((value) => Number(value) >= BATCH_MIN_YEAR && Number(value) <= BATCH_MAX_YEAR, `Please enter a year between ${BATCH_MIN_YEAR} and ${BATCH_MAX_YEAR}.`),
  teamName: z.string().trim().min(1, "Please enter your team name.").max(100, "Please use 100 characters or fewer."),
  sport: z.enum(SPORT_OPTIONS, { errorMap: () => ({ message: "Please select a sport." }) }),
  player1: requiredName,
  player2: requiredName,
  player3: requiredName,
  player4: requiredName,
  player5: requiredName,
  player6: requiredName,
});

export type RegistrationData = z.infer<typeof registrationSchema>;
export const isRegistrationClosed = (now = new Date()) => now.getTime() > new Date(REGISTRATION_CLOSES_AT).getTime();