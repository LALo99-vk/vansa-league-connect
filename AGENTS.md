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
- Keep the registration form client-only with no persistence or network submission until a real receiving service is explicitly requested; this is a frontend prototype.
- Evaluate the registration cutoff at the end of the closing date in Asia/Kolkata time because the event is in Bengaluru.
- Express the event palette through semantic global CSS tokens and use the shared Button for submission to keep presentation consistent.
