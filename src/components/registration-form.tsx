import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ENTRY_TYPES, MIN_TEAM_PLAYERS, PLAYER_COUNT, REGISTRANT_TYPES, SPORT_OPTIONS, STUDENT_CLASSES, isRegistrationClosed, registrationSchema, type RegistrationInput, type Sport } from "@/lib/registration";
import type { SaveResult } from "@/lib/registration-store";
import { REGISTRATION_CLOSED, submitRegistration } from "@/lib/submit-registration";

type FieldName = keyof RegistrationInput;
type Errors = Partial<Record<FieldName, string>>;

function Field({ name, label, error, type = "text", placeholder, autoComplete, inputMode, maxLength = 100, onInput }: {
  name: FieldName; label: string; error?: string | undefined; type?: string; placeholder: string; autoComplete?: string; inputMode?: "numeric" | "tel" | "email"; maxLength?: number; onInput?: (value: string) => void;
}) {
  return <div className="min-w-0">
    <label htmlFor={name} className="mb-2 block text-sm font-medium">{label}<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></label>
    <input id={name} name={name} type={type} required maxLength={maxLength} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="registration-input" onInput={onInput && ((event) => onInput(event.currentTarget.value))} />
    {error && <p id={`${name}-error`} className="mt-1.5 text-xs text-destructive">{error}</p>}
  </div>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-[15px] font-semibold text-primary">{children}</h3>;
}

const ENTRY_LABELS: Record<(typeof ENTRY_TYPES)[number], [string, string]> = {
  Team: ["With a team", "Captain registers the team"],
  Solo: ["Solo", "We'll put you in a team"],
};

function Jersey({ number }: { number: number }) {
  return <svg viewBox="0 0 32 28" className="jersey" aria-hidden="true">
    <path d="M10.5 1 4 4 0 10.5l5 3 2-2V27h18V11.5l2 2 5-3L28 4l-6.5-3C20.7 3.4 18.6 5 16 5s-4.7-1.6-5.5-4Z" fill="currentColor" />
    <text x="16" y="22.5" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="'Big Shoulders Display', sans-serif">{number}</text>
  </svg>;
}

export function RegistrationForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<SaveResult | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [closed, setClosed] = useState(false);
  const [registrantType, setRegistrantType] = useState<string>("");
  const [entryType, setEntryType] = useState<string>("");
  const [sport, setSport] = useState<Sport | "">("");
  // Football squads are 9, volleyball 6.
  const squadSize = sport ? PLAYER_COUNT[sport] : 0;
  const [captainName, setCaptainName] = useState("");
  const isSolo = entryType === "Solo";
  const submitLabel = isSolo ? "Register as solo player" : "Register team";

  useEffect(() => {
    const update = () => setClosed(isRegistrationClosed());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (isRegistrationClosed()) { setClosed(true); return; }
    const form = event.currentTarget;
    const result = registrationSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!result.success) {
      const nextErrors: Errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      // Focus the first invalid field in page order, not schema order.
      const firstField = Array.from(form.elements).find((el) => (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) && el.name in nextErrors);
      if (firstField instanceof HTMLElement) firstField.focus();
      return;
    }
    setErrors({});
    setSaveFailed(false);
    setSubmitting(true);
    try {
      // Resolves only after the sheet has confirmed the save; anything else is a failure.
      setSaved(await submitRegistration({ data: result.data }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof Error && error.message.includes(REGISTRATION_CLOSED)) setClosed(true);
      else setSaveFailed(true);
    } finally { setSubmitting(false); }
  }

  if (closed && !saved) return <div className="registration-card" role="status"><h2 className="font-display text-4xl font-extrabold text-primary">Registrations are closed</h2><p className="mt-3 leading-7 text-muted-foreground">For queries, call Manas on <a className="text-primary underline underline-offset-4" href="tel:+919902490638">+91 99024 90638</a>.</p></div>;

  if (saved) return <div className="registration-card" role="status">
    <h2 className="font-display text-4xl font-extrabold text-primary">Thank you for registering!</h2>
    {saved.entryType === "Solo"
      ? <p className="mt-3 leading-7 text-muted-foreground">You're registered as a solo player for the VANSA Sports League 2026. We'll put you in a team and let you know your team on WhatsApp and email before 15 Nov. See you on the pitch!</p>
      : <p className="mt-3 leading-7 text-muted-foreground">Your team is registered for the VANSA Sports League 2026. Fixtures and team details will be shared with you on WhatsApp and email closer to the event. See you on the pitch!</p>}
    <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-l-[3px] border-l-gold pl-4 text-sm">
      <dt className="text-muted-foreground">Reference</dt><dd className="font-semibold tracking-wide text-foreground">{saved.reference}</dd>
      <dt className="text-muted-foreground">Saved at</dt><dd className="text-foreground">{saved.savedAt} IST</dd>
    </dl>
    <Button type="button" variant="outline" className="mt-7 h-11 rounded-sm border-primary px-6 font-medium text-primary shadow-none hover:bg-accent hover:text-primary" onClick={() => { setSaved(null); setSport(""); setEntryType(""); setCaptainName(""); }}>Back to registration form</Button>
  </div>;

  return <form className="registration-card" onSubmit={handleSubmit} noValidate aria-labelledby="sheet-title">
    <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id="sheet-title" className="font-display text-[40px] font-extrabold leading-none text-primary">Registration form</h2>
      <p className="text-sm text-muted-foreground"><span className="text-maroon" aria-hidden="true">*</span> Required</p>
    </div>
    <fieldset disabled={submitting} className="min-w-0">
      <fieldset>
        <legend className="mb-3 text-[15px] font-semibold text-primary">Sport<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></legend>
        <div className="grid grid-cols-2 gap-3">{SPORT_OPTIONS.map((option) => <label key={option} className="sport-option">
          <input type="radio" name="sport" value={option} required className="sr-only" checked={sport === option} onChange={() => setSport(option)} aria-invalid={Boolean(errors.sport)} aria-describedby={errors.sport ? "sport-error" : undefined} />
          <span className="font-display text-[26px] font-extrabold leading-none">{option}</span>
        </label>)}</div>
        {errors.sport && <p id="sport-error" className="mt-1.5 text-xs text-destructive">{errors.sport}</p>}
      </fieldset>
      <fieldset className="mt-6">
        <legend className="mb-3 text-[15px] font-semibold text-primary">How are you registering?<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></legend>
        <div className="grid grid-cols-2 gap-3">{ENTRY_TYPES.map((type) => <label key={type} className="sport-option">
          <input type="radio" name="entryType" value={type} required className="sr-only" checked={entryType === type} onChange={() => setEntryType(type)} aria-invalid={Boolean(errors.entryType)} aria-describedby={errors.entryType ? "entryType-error" : undefined} />
          <span className="font-display text-[22px] font-extrabold leading-none">{ENTRY_LABELS[type][0]}</span>
          <span className="sport-option-sub text-xs text-muted-foreground">{ENTRY_LABELS[type][1]}</span>
        </label>)}</div>
        {errors.entryType && <p id="entryType-error" className="mt-1.5 text-xs text-destructive">{errors.entryType}</p>}
      </fieldset>
      {entryType === "Team" && <div className="mt-6"><Field name="teamName" label="Team name" placeholder="" error={errors.teamName} /></div>}
      <section className="mt-9">
        <SectionHeading>{entryType === "Team" ? "Your details (captain)" : "Your details"}</SectionHeading>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field name="captainName" label="Full name" placeholder="" autoComplete="name" error={errors.captainName} onInput={setCaptainName} />
          <Field name="phone" label="Contact number" placeholder="10-digit mobile" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20} error={errors.phone} />
          <Field name="email" label="Email ID" placeholder="" type="email" inputMode="email" autoComplete="email" maxLength={255} error={errors.email} />
        </div>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium">I am registering as<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></legend>
          <div className="grid grid-cols-2 gap-3">{REGISTRANT_TYPES.map((type) => <label key={type} className="sport-option">
            <input type="radio" name="registrantType" value={type} required className="sr-only" checked={registrantType === type} onChange={() => setRegistrantType(type)} aria-invalid={Boolean(errors.registrantType)} />
            <span className="font-display text-[22px] font-extrabold leading-none">{type}</span>
          </label>)}</div>
          {errors.registrantType && <p className="mt-1.5 text-xs text-destructive">{errors.registrantType}</p>}
        </fieldset>
        {registrantType === "Alumni" && <div className="mt-4 sm:max-w-[calc(50%-10px)]"><Field name="batch" label="Batch (year you graduated)" placeholder="e.g. 2012" inputMode="numeric" maxLength={4} error={errors.batch} /></div>}
        {registrantType === "Current student" && <div className="mt-4 sm:max-w-[calc(50%-10px)]">
          <label htmlFor="studentClass" className="mb-2 block text-sm font-medium">Class<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></label>
          <select id="studentClass" name="studentClass" required defaultValue="" aria-invalid={Boolean(errors.studentClass)} className="registration-input">
            <option value="" disabled>Select your class</option>
            {STUDENT_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.studentClass && <p className="mt-1.5 text-xs text-destructive">{errors.studentClass}</p>}
        </div>}
        <p className="mt-3 text-xs text-muted-foreground">Fixtures will be sent to this number on WhatsApp and to this email.</p>
      </section>
      {isSolo && <p className="mt-6 rounded-sm border-l-[3px] border-l-gold bg-accent/40 px-4 py-3 text-sm leading-6 text-foreground">Don't have a team? No problem. We'll put you in a team and let you know before 15 Nov.</p>}
      {entryType === "Team" && <section className="mt-9">
        <SectionHeading>Players</SectionHeading>
        {!sport && <p className="text-sm text-muted-foreground">Choose a sport above to add your players.</p>}
        {sport && <p className="-mt-2 mb-4 text-xs leading-5 text-muted-foreground">{sport} teams have {squadSize} players. At least {MIN_TEAM_PLAYERS}, including you. Short of {squadSize}? We'll fill the remaining spots with solo players.</p>}
        {sport && <ol className="space-y-3">
          <li className="flex items-center gap-3">
            <span className="shrink-0"><span className="sr-only">Player 1, the captain</span><Jersey number={1} /></span>
            <div className="registration-input registration-input-locked">{captainName.trim() ? `${captainName.trim()} (captain)` : "You (captain)"}</div>
          </li>
          {Array.from({ length: squadSize - 1 }, (_, index) => {
            const number = index + 2;
            const name = `player${number}` as FieldName;
            const required = number <= MIN_TEAM_PLAYERS;
            const error = errors[name];
            return <li key={name}>
              <div className="flex items-center gap-3">
                <label htmlFor={name} className="shrink-0"><span className="sr-only">Player {number} name{required ? "" : " (optional)"}</span><Jersey number={number} /></label>
                <input id={name} name={name} type="text" required={required} maxLength={100} placeholder={required ? "Full name *" : "Full name (optional)"} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="registration-input" />
              </div>
              {error && <p id={`${name}-error`} className="ml-12 mt-1.5 text-xs text-destructive">{error}</p>}
            </li>;
          })}
        </ol>}
      </section>}
      <div className="mt-10">
        {saveFailed && <div role="alert" className="mb-5 rounded-sm border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm leading-6 text-foreground"><p className="font-semibold text-destructive">Your registration was not saved.</p><p>Your details are still filled in. Check your internet connection and press {submitLabel} again. If it keeps failing, call Manas on <a className="whitespace-nowrap font-medium text-primary underline underline-offset-4" href="tel:+919902490638">+91 99024 90638</a>.</p></div>}
        <Button type="submit" className="h-12 w-full rounded-sm px-10 text-[15px] font-semibold shadow-none sm:w-auto" disabled={submitting}>{submitting ? "Registering…" : submitLabel}</Button>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Need to change something later? Register again with the same sport, contact number and team or solo choice, and your entry will be updated. Those three can't be changed this way. For that, call Manas on <a className="whitespace-nowrap text-primary underline underline-offset-4" href="tel:+919902490638">+91 99024 90638</a>.</p>
      </div>
    </fieldset>
  </form>;
}
