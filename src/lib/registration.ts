import { z } from "zod";
import { SQUAD_SIZE } from "./sheet-layout";

export const SPORT_OPTIONS = ["Football", "Volleyball"] as const;
export type Sport = (typeof SPORT_OPTIONS)[number];
/** Squad size per sport, captain included: 9 for football, 6 for volleyball. */
export const PLAYER_COUNT: Record<Sport, number> = SQUAD_SIZE;
/** A team needs the captain plus at least 3 more. Smaller groups register solo. */
export const MIN_TEAM_PLAYERS = 4;
export const ENTRY_TYPES = ["Team", "Solo"] as const;
// Closed by hand only, when the school says so: set to false. There is no automatic closing date.
export const REGISTRATION_OPEN = true;
// The school's first graduating batch is not known, so allow a generous range.
export const REGISTRANT_TYPES = ["Alumni", "Current student"] as const;
export const STUDENT_CLASSES = ["10th", "12th"] as const;
export const BATCH_MIN_YEAR = 1950;
export const BATCH_MAX_YEAR = 2026;

const requiredName = z.string().trim().min(1, "Please enter a name.").max(100, "Please use 100 characters or fewer.");

const optionalText = z.string().trim().max(100, "Please use 100 characters or fewer.").optional().default("");

/** Player 1 is always the captain, so the form only asks for players 2 onwards. */
const OTHER_PLAYERS = ["player2", "player3", "player4", "player5", "player6", "player7", "player8", "player9"] as const;
type OtherPlayer = (typeof OTHER_PLAYERS)[number];
/** The player boxes the form shows for a sport: 2–9 for football, 2–6 for volleyball. */
export const otherPlayers = (sport: Sport) => OTHER_PLAYERS.slice(0, PLAYER_COUNT[sport] - 1);

export const registrationSchema = z.object({
  entryType: z.enum(ENTRY_TYPES, { errorMap: () => ({ message: "Please choose team or solo." }) }),
  captainName: requiredName,
  phone: z.string().trim().regex(/^\d{10}$/, "Please enter a 10-digit mobile number."),
  email: z.string().trim().min(1, "Please enter your email address.").email("Please enter a valid email address.").max(255, "Please use 255 characters or fewer."),
  registrantType: z.enum(REGISTRANT_TYPES, { errorMap: () => ({ message: "Please choose alumni or current student." }) }),
  batch: optionalText,
  studentClass: optionalText,
  teamName: optionalText,
  // A page loaded before 4 Nov still sends the old gendered names; accept them.
  sport: z.preprocess((v) => ({ "Men's Football": "Football", "Women's Volleyball": "Volleyball" } as Record<string, string>)[v as string] ?? v, z.enum(SPORT_OPTIONS, { errorMap: () => ({ message: "Please select a sport." }) })),
  player2: optionalText,
  player3: optionalText,
  player4: optionalText,
  player5: optionalText,
  player6: optionalText,
  player7: optionalText,
  player8: optionalText,
  player9: optionalText,
}).superRefine((value, ctx) => {
  if (value.registrantType === "Alumni") {
    if (!/^\d{4}$/.test(value.batch)) ctx.addIssue({ code: "custom", path: ["batch"], message: "Please enter the year you graduated, e.g. 2012." });
    else if (Number(value.batch) < BATCH_MIN_YEAR || Number(value.batch) > BATCH_MAX_YEAR) ctx.addIssue({ code: "custom", path: ["batch"], message: `Please enter a year between ${BATCH_MIN_YEAR} and ${BATCH_MAX_YEAR}.` });
  } else if (value.registrantType === "Current student") {
    if (!(STUDENT_CLASSES as readonly string[]).includes(value.studentClass)) ctx.addIssue({ code: "custom", path: ["studentClass"], message: "Please select your class." });
  }
  if (value.entryType === "Team") {
    if (!value.teamName) ctx.addIssue({ code: "custom", path: ["teamName"], message: "Please enter your team name." });
    const named = otherPlayers(value.sport).filter((key) => value[key]).length;
    if (named < MIN_TEAM_PLAYERS - 1) {
      // Point at the first empty box among the ones that must be filled.
      const empty = OTHER_PLAYERS.slice(0, MIN_TEAM_PLAYERS - 1).find((key) => !value[key]) ?? "player2";
      ctx.addIssue({ code: "custom", path: [empty], message: `A team needs at least ${MIN_TEAM_PLAYERS} players, including you. Fewer than that? Register as Solo instead.` });
    }
  }
}).transform((input) => {
  const { player2, player3, player4, player5, player6, player7, player8, player9, ...value } = input;
  const isTeam = value.entryType === "Team";
  // Close any gaps, so a team that filled boxes 2, 3 and 5 is saved as players 2, 3 and 4.
  // Boxes the sport doesn't have (7–9 for volleyball) are dropped.
  const others = isTeam ? otherPlayers(value.sport).map((key: OtherPlayer) => input[key]).filter(Boolean) : [];
  const [p2 = "", p3 = "", p4 = "", p5 = "", p6 = "", p7 = "", p8 = "", p9 = ""] = others;
  return {
    ...value,
    // Only the answer that applies is kept, so the sheet never holds a stale year or class.
    batch: value.registrantType === "Alumni" ? value.batch : "",
    studentClass: value.registrantType === "Current student" ? value.studentClass : "",
    // A solo player has no team, even if team fields were filled before switching.
    teamName: isTeam ? value.teamName : "",
    player1: isTeam ? value.captainName : "",
    player2: p2, player3: p3, player4: p4, player5: p5, player6: p6, player7: p7, player8: p8, player9: p9,
  };
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationData = z.infer<typeof registrationSchema>;
/** Every player slot, 1–9, in order. Volleyball rows leave 7–9 blank. */
export const allPlayers = (data: RegistrationData) =>
  [data.player1, data.player2, data.player3, data.player4, data.player5, data.player6, data.player7, data.player8, data.player9];
/** The player slots the sport's team tab has: 9 for football, 6 for volleyball. */
export const sportPlayers = (data: RegistrationData) => allPlayers(data).slice(0, PLAYER_COUNT[data.sport]);
export const playersNamed = (data: RegistrationData) => allPlayers(data).filter(Boolean).length;
export const isRegistrationClosed = () => !REGISTRATION_OPEN;
