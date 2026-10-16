import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PLAYER_COUNT, SPORT_OPTIONS, isRegistrationClosed, registrationSchema, type RegistrationData } from "@/lib/registration";
import type { SaveResult } from "@/lib/registration-store";
import { REGISTRATION_CLOSED, submitRegistration } from "@/lib/submit-registration";

type FieldName = keyof RegistrationData;
type Errors = Partial<Record<FieldName, string>>;

function Field({ name, label, error, type = "text", placeholder, autoComplete, inputMode, maxLength = 100 }: {
  name: FieldName; label: string; error?: string | undefined; type?: string; placeholder: string; autoComplete?: string; inputMode?: "numeric" | "tel" | "email"; maxLength?: number;
}) {
  return <div className="min-w-0">
    <label htmlFor={name} className="mb-2 block text-sm font-medium">{label}<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></label>
    <input id={name} name={name} type={type} required maxLength={maxLength} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="registration-input" />
    {error && <p id={`${name}-error`} className="mt-1.5 text-xs text-destructive">{error}</p>}
  </div>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-[15px] font-semibold text-primary">{children}</h3>;
}

const SPORT_LABELS: Record<(typeof SPORT_OPTIONS)[number], [string, string]> = {
  "Men's Football": ["Football", "Men's team"],
  "Women's Throwball": ["Throwball", "Women's team"],
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
    <p className="mt-3 leading-7 text-muted-foreground">Your entry for the VANSA Sports League 2026 has been received. Fixtures and team details will be shared with you on WhatsApp and email closer to the event. See you on the pitch!</p>
    <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-l-[3px] border-l-gold pl-4 text-sm">
      <dt className="text-muted-foreground">Reference</dt><dd className="font-semibold tracking-wide text-foreground">{saved.reference}</dd>
      <dt className="text-muted-foreground">Saved at</dt><dd className="text-foreground">{saved.savedAt} IST</dd>
    </dl>
    <Button type="button" variant="outline" className="mt-7 h-11 rounded-sm border-primary px-6 font-medium text-primary shadow-none hover:bg-accent hover:text-primary" onClick={() => setSaved(null)}>Back to registration form</Button>
  </div>;

  return <form className="registration-card" onSubmit={handleSubmit} noValidate aria-labelledby="sheet-title">
    <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id="sheet-title" className="font-display text-[40px] font-extrabold leading-none text-primary">Registration form</h2>
      <p className="text-sm text-muted-foreground"><span className="text-maroon" aria-hidden="true">*</span> All fields are required</p>
    </div>
    <p className="-mt-4 mb-7 text-sm font-medium text-foreground">Registrations close on 27th October 2026.</p>
    <fieldset disabled={submitting} className="min-w-0">
      <fieldset>
        <legend className="mb-3 text-[15px] font-semibold text-primary">Sport<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></legend>
        <div className="grid grid-cols-2 gap-3">{SPORT_OPTIONS.map((sport) => <label key={sport} className="sport-option">
          <input type="radio" name="sport" value={sport} required className="sr-only" aria-invalid={Boolean(errors.sport)} aria-describedby={errors.sport ? "sport-error" : undefined} />
          <span className="font-display text-[26px] font-extrabold leading-none">{SPORT_LABELS[sport][0]}</span>
          <span className="sport-option-sub text-xs text-muted-foreground">{SPORT_LABELS[sport][1]}</span>
        </label>)}</div>
        {errors.sport && <p id="sport-error" className="mt-1.5 text-xs text-destructive">{errors.sport}</p>}
      </fieldset>
      <div className="mt-6"><Field name="teamName" label="Team name" placeholder="" error={errors.teamName} /></div>
      <section className="mt-9">
        <SectionHeading>Captain</SectionHeading>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field name="captainName" label="Full name" placeholder="" autoComplete="name" error={errors.captainName} />
          <Field name="phone" label="Contact number" placeholder="10-digit mobile" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20} error={errors.phone} />
          <Field name="email" label="Email ID" placeholder="" type="email" inputMode="email" autoComplete="email" maxLength={255} error={errors.email} />
          <Field name="batch" label="Batch (year you graduated)" placeholder="e.g. 2012" inputMode="numeric" maxLength={4} error={errors.batch} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Fixtures will be sent to this number on WhatsApp and to this email.</p>
      </section>
      <section className="mt-9">
        <SectionHeading>Players<span className="ml-0.5 text-maroon" aria-hidden="true">*</span></SectionHeading>
        <ol className="space-y-3">{Array.from({ length: PLAYER_COUNT }, (_, index) => {
          const name = `player${index + 1}` as FieldName;
          const error = errors[name];
          return <li key={name}>
            <div className="flex items-center gap-3">
              <label htmlFor={name} className="shrink-0"><span className="sr-only">Player {index + 1} name</span><Jersey number={index + 1} /></label>
              <input id={name} name={name} type="text" required maxLength={100} placeholder="Full name *" aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="registration-input" />
            </div>
            {error && <p id={`${name}-error`} className="ml-12 mt-1.5 text-xs text-destructive">{error}</p>}
          </li>;
        })}</ol>
      </section>
      <div className="mt-10">
        {saveFailed && <div role="alert" className="mb-5 rounded-sm border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm leading-6 text-foreground"><p className="font-semibold text-destructive">Your registration was not saved.</p><p>Your details are still filled in. Check your internet connection and press Register team again. If it keeps failing, call Manas on <a className="whitespace-nowrap font-medium text-primary underline underline-offset-4" href="tel:+919902490638">+91 99024 90638</a>.</p></div>}
        <Button type="submit" className="h-12 w-full rounded-sm px-10 text-[15px] font-semibold shadow-none sm:w-auto" disabled={submitting}>{submitting ? "Registering…" : "Register team"}</Button>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Need to change something later? Register again with the same sport and contact number, and your entry will be updated. The sport and contact number themselves can't be changed. For that, call Manas on <a className="whitespace-nowrap text-primary underline underline-offset-4" href="tel:+919902490638">+91 99024 90638</a>.</p>
      </div>
    </fieldset>
  </form>;
}
