// Short summary of the organisers' "VANSA 2026 : Rules & Regulations" PDF, shown under the
// fixtures. Only what the PDF says; change it here if the organisers change the document.
import type { FixtureSport } from "./fixtures";

export const GENERAL_RULES = [
  "Report at 10:00 AM. Player registration 10:00–10:20 is mandatory; opening at 10:20.",
  "Bring your own breakfast. Lunch, first aid and water are provided.",
  "The referees' and organisers' decisions are final.",
];

export const SPORT_RULES: Record<FixtureSport, string[]> = {
  football: [
    "7 + 2 rolling subs. Bring your own jersey, footwear, socks and water bottle.",
    "Every match, final included: 8 min + 4 min break + 8 min, plus stoppage time.",
    "Be at the venue 30 min before kickoff. Not there 10 min after the scheduled time: walkover.",
    "Everyone plays everyone once; the top 2 play the final. Win 3 · Draw 1 · Loss 0.",
    "League draws stand. Level on points: goal difference, then goals scored.",
    "Final level at full time: 3 + 2 + 3 min extra time, then 5 penalties each (one-step).",
    "Two yellow cards make a red. No violence; abuse of anyone means team suspension.",
  ],
  volleyball: [
    "6 players per team.",
    "Each match is 3 games to 11 points; a level game goes to deuce.",
    "Everyone plays everyone once; the top 2 play the final. A win earns 2 points.",
    "Level on points: the total points scored across all games decides.",
  ],
};

export const RULES_CONTACT = { name: "Mayur", phone: "+91 95350 29732" };
