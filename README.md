# VANSA League Connect

Design a clean, premium, mobile-first team registration website for **VANSA Sports League 2026**, an alumni sports event organised by Vidyanikethan School, Bengaluru.

## Design Direction

Create a calm, elegant, human-designed website that feels professional, welcoming, and sports-oriented without looking flashy, cluttered, or AI-generated. Take inspiration from high-quality editorial websites, modern university athletics branding, and minimalist event landing pages.

**Visual style:**
- Primary colour: deep forest green.
- Background: warm off-white or soft ivory.
- Accent: a muted, natural light green used sparingly.
- Text: dark charcoal for excellent readability.
- Use generous whitespace, subtle borders, restrained rounded corners, and consistent spacing.
- Use a clean, modern sans-serif typeface with a strong but understated typographic hierarchy.
- Avoid excessive gradients, neon colours, oversized decorative graphics, excessive shadows, and unnecessary visual effects.

## Page Structure

### 1. Header
A minimal header containing the Vidyanikethan School name or official logo if available, alongside a small VANSA Sports League 2026 label. Keep the header compact, particularly on mobile.

### 2. Hero Section
Create a simple, editorial-style hero with the heading:

**VANSA Sports League 2026**

Supporting headline: "Old friends. New rivalries."

Description: "Welcome back to the pitch! We're bringing our alumni together for a day of competitive men's football and women's throwball for the alumni of Vidyanikethan School, Bengaluru."

Display the event date, **1 November 2026**, and venue context, Bengaluru, in a subtle information row.

Include two restrained sport labels:
- Men's Football
- Women's Throwball

If a visual is needed, use one tasteful, authentic sports photograph or a subtle static sports-inspired graphic. Do not use multiple competing images or a large, distracting collage.

### 3. Registration Form
Make the form the main focus of the page. Use a clean white card against the warm off-white background, with clear section headings and enough spacing between fields.

Introductory text:

"Please complete the form below to confirm your participation. All fields are mandatory."

Organise the fields into three sections:

**01 — Captain Details**
- Full Name
- Contact Number
- Email ID
- Batch (year graduated)

**02 — Team Details**
- Team Name
- Sport selection with two clear options: Men's Football and Women's Throwball.

**03 — Players**
- Player 1 Name
- Player 2 Name
- Player 3 Name
- Player 4 Name
- Player 5 Name
- Player 6 Name

Use simple, consistent input fields with clear labels above them. Keep all six player fields separate and easy to fill. Use appropriate input types and mobile keyboards wherever possible.

Add a single full-width forest-green button labelled **Register My Team**.

Below the button, display this note in small, readable text:

"Already registered? Submitting again with the same contact number updates your team."

### 4. Registration Deadline
Clearly display:

"Registrations close 27 October 2026."

Keep this visible near the registration form without turning it into a large warning banner.

### 5. Footer
A minimal footer with the school name and:

"For any queries, contact Manas: +91 9902490638"

Make the phone number a tap-to-call link.

## Mobile-First Requirements

Design for mobile screens first, especially users opening the registration link directly from WhatsApp.

- Single-column layout on mobile.
- Large, comfortable touch targets.
- Readable text without zooming.
- No horizontal scrolling.
- Consistent spacing and field heights.
- Form fields should occupy the available width.
- Keep the page lightweight and straightforward.
- Ensure the hero does not push the registration form too far below the fold.
- Adapt gracefully to tablet and desktop without introducing unnecessary columns or oversized empty sections.

## Functional Requirements

Implement the form with React and TypeScript using the project's existing setup.

- Every field is required.
- Validate the Indian mobile number as exactly 10 digits.
- Validate email format.
- Trim whitespace from all inputs.
- Show inline validation errors beneath the relevant fields.
- Disable the submit button while submission is in progress.
- Keep the player count (6), sport options, and registration closing date as constants near the top of the relevant source file.
- Keep the submit handler in one clearly named function, such as `handleSubmit`.
- On submission, collect the data into a single object with these exact keys: `captainName`, `phone`, `email`, `batch`, `teamName`, `sport`, `player1`, `player2`, `player3`, `player4`, `player5`, `player6`.
- For now, log the object to the console. Do not connect a database or external backend.
- After successful submission, replace the form with this confirmation:

"Thank you for registering! Your entry for the VANSA Sports League 2026 has been received. Fixtures and team details will be shared with you on WhatsApp and email closer to the event. See you on the pitch!"

- After 27 October 2026, hide the form and show:

"Registrations are now closed. For queries, contact Manas: +91 9902490638."

## Important Design Constraints

The website must look intentionally designed by a skilled human designer, not like a generic AI-generated landing page.

Do not add:
- Unnecessary animations or parallax effects.
- Animated backgrounds, floating elements, or moving gradients.
- Excessive cards, badges, pills, icons, or decorative shapes.
- Random accent colours or loud colour combinations.
- Fake testimonials, statistics, countdowns, or sponsor logos.
- Unnecessary navigation menus, dashboards, or extra pages.
- Unrequested features or complex interactions.
- Supabase, authentication, databases, or backend integrations.

Use only subtle hover and focus states where useful for accessibility. Prioritise clarity, consistency, performance, and usability over decoration.

**Final goal:** A calm, polished, trustworthy alumni sports registration website that feels connected to Vidyanikethan School, has a distinct sporting identity, and makes registering an entire team effortless on a mobile phone.

## Development

You need Node.js 22.

```sh
git clone https://github.com/LALo99-vk/vansa-league-connect.git
cd vansa-league-connect
npm install --legacy-peer-deps --no-package-lock   # plain `npm i` crashes on a peer-dependency bug
cp .env.example .env                                # then fill in the Google Sheet id and service account
npm run dev
```

Registrations are saved to the Google Sheet in `GOOGLE_SHEETS_ID`. To create its tabs:

```sh
node --experimental-strip-types --env-file=.env scripts/setup-sheet.ts
```
