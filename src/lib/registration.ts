import { z } from "zod";

export const PLAYER_COUNT = 6;
export const SPORT_OPTIONS = ["Men's Football", "Women's Volleyball"] as const;
// Closed by hand only, when the school says so: set to false. There is no automatic closing date.
export const REGISTRATION_OPEN = true;
// The school's first graduating batch is not known, so allow a generous range.
export const REGISTRANT_TYPES = ["Alumni", "Current student"] as const;
export const STUDENT_CLASSES = ["10th", "12th"] as const;
export const BATCH_MIN_YEAR = 1950;
export const BATCH_MAX_YEAR = 2026;

const requiredName = z.string().trim().min(1, "Please enter a name.").max(100, "Please use 100 characters or fewer.");

const optionalText = z.string().trim().max(100).optional().default("");

export const registrationSchema = z.object({
  captainName: requiredName,
  phone: z.string().trim().regex(/^\d{10}$/, "Please enter a 10-digit mobile number."),
  email: z.string().trim().min(1, "Please enter your email address.").email("Please enter a valid email address.").max(255, "Please use 255 characters or fewer."),
  registrantType: z.enum(REGISTRANT_TYPES, { errorMap: () => ({ message: "Please choose alumni or current student." }) }),
  batch: optionalText,
  studentClass: optionalText,
  teamName: z.string().trim().min(1, "Please enter your team name.").max(100, "Please use 100 characters or fewer."),
  sport: z.enum(SPORT_OPTIONS, { errorMap: () => ({ message: "Please select a sport." }) }),
  player1: requiredName,
  player2: requiredName,
  player3: requiredName,
  player4: requiredName,
  player5: requiredName,
  player6: requiredName,
}).superRefine((value, ctx) => {
  if (value.registrantType === "Alumni") {
    if (!/^\d{4}$/.test(value.batch)) ctx.addIssue({ code: "custom", path: ["batch"], message: "Please enter the year you graduated, e.g. 2012." });
    else if (Number(value.batch) < BATCH_MIN_YEAR || Number(value.batch) > BATCH_MAX_YEAR) ctx.addIssue({ code: "custom", path: ["batch"], message: `Please enter a year between ${BATCH_MIN_YEAR} and ${BATCH_MAX_YEAR}.` });
  } else if (value.registrantType === "Current student") {
    if (!(STUDENT_CLASSES as readonly string[]).includes(value.studentClass)) ctx.addIssue({ code: "custom", path: ["studentClass"], message: "Please select your class." });
  }
}).transform((value) => ({
  ...value,
  // Only the answer that applies is kept, so the sheet never holds a stale year or class.
  batch: value.registrantType === "Alumni" ? value.batch : "",
  studentClass: value.registrantType === "Current student" ? value.studentClass : "",
}));

export type RegistrationData = z.infer<typeof registrationSchema>;
export const isRegistrationClosed = () => !REGISTRATION_OPEN;