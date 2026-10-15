<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep registration validation and event constants in a shared browser-safe module so UI and tests use the same rules.
- Registrations are saved to a Google Sheet by the `submitRegistration` server function (`src/lib/registration-store.ts`). The form may only show success after the sheet confirms every write; never add optimistic success or fire-and-forget saving.
- Sheet tabs and column order are defined in `src/lib/sheet-layout.ts`; `scripts/setup-sheet.ts` creates them. Changing the columns means updating both, and the live sheet.
- Secrets (`GOOGLE_SHEETS_ID`, `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`) live in `.env`, which must never be committed.
- Evaluate the registration cutoff at the end of the closing date in Asia/Kolkata time because the event is in Bengaluru.
- Express the event palette through semantic global CSS tokens and use the shared Button for submission to keep presentation consistent.
