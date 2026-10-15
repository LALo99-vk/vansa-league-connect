import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAYER_COUNT, SPORT_OPTIONS, isRegistrationClosed, registrationSchema, type RegistrationData } from "@/lib/registration";

type FieldName = keyof RegistrationData;
type Errors = Partial<Record<FieldName, string>>;

function Field({ name, label, error, type = "text", placeholder, autoComplete, inputMode, maxLength = 100 }: {
  name: FieldName; label: string; error?: string; type?: string; placeholder: string; autoComplete?: string; inputMode?: "numeric" | "tel" | "email"; maxLength?: number;
}) {
  return <div className="min-w-0">
    <label htmlFor={name} className="mb-2 block text-sm font-medium">{label}</label>
    <input id={name} name={name} type={type} required maxLength={maxLength} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="registration-input" />
    {error && <p id={`${name}-error`} className="mt-1.5 text-xs text-destructive">{error}</p>}
  </div>;
}

function SectionHeading({ number, children }: { number: string; children: React.ReactNode }) {
  return <h3 className="mb-6 flex items-center gap-3 text-lg font-semibold"><span className="text-sm font-normal text-muted-foreground">{number}</span><span className="h-px w-4 bg-border" aria-hidden="true" />{children}</h3>;
}

export function RegistrationForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      const firstField = form.elements.namedItem(Object.keys(nextErrors)[0]);
      if (firstField instanceof HTMLElement) firstField.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // Prototype only: no storage, network request, or actual registration update.
      console.log(result.data);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
      setSubmitted(true);
    } finally { setSubmitting(false); }
  }

  if (closed && !submitted) return <div className="registration-card py-12" role="status"><h2 className="text-2xl font-semibold text-primary">Registrations are now closed.</h2><p className="mt-4 leading-7 text-muted-foreground">For queries, contact Manas: <a className="text-primary underline underline-offset-4" href="tel:+919902490638">+91 9902490638</a>.</p></div>;

  if (submitted) return <div className="registration-card py-12" role="status"><Check className="mb-5 size-8 text-primary" aria-hidden="true" /><h2 className="text-2xl font-semibold text-primary">Thank you for registering!</h2><p className="mt-4 leading-7 text-muted-foreground">Your entry for the VANSA Sports League 2026 has been received. Fixtures and team details will be shared with you on WhatsApp and email closer to the event. See you on the pitch!</p></div>;

  return <form className="registration-card" onSubmit={handleSubmit} noValidate>
    <fieldset disabled={submitting} className="min-w-0">
      <section aria-labelledby="captain-section">
        <div id="captain-section"><SectionHeading number="01">Captain Details</SectionHeading></div>
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field name="captainName" label="Full Name" placeholder="Captain’s full name" autoComplete="name" error={errors.captainName} />
          <Field name="phone" label="Contact Number" placeholder="10-digit mobile number" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20} error={errors.phone} />
          <Field name="email" label="Email ID" placeholder="you@example.com" type="email" inputMode="email" autoComplete="email" maxLength={255} error={errors.email} />
          <Field name="batch" label="Batch (year graduated)" placeholder="e.g. 2018" inputMode="numeric" maxLength={8} error={errors.batch} />
        </div>
      </section>
      <section className="mt-8 border-t pt-8" aria-labelledby="team-section">
        <div id="team-section"><SectionHeading number="02">Team Details</SectionHeading></div>
        <Field name="teamName" label="Team Name" placeholder="Your team’s name" error={errors.teamName} />
        <fieldset className="mt-5"><legend className="mb-2 text-sm font-medium">Sport</legend>
          <div className="grid gap-3 sm:grid-cols-2">{SPORT_OPTIONS.map((sport) => <label key={sport} className="sport-option"><input type="radio" name="sport" value={sport} required className="size-4 shrink-0 accent-primary" aria-invalid={Boolean(errors.sport)} aria-describedby={errors.sport ? "sport-error" : undefined} /><span>{sport}</span></label>)}</div>
          {errors.sport && <p id="sport-error" className="mt-1.5 text-xs text-destructive">{errors.sport}</p>}
        </fieldset>
      </section>
      <section className="mt-8 border-t pt-8" aria-labelledby="players-section">
        <div id="players-section"><SectionHeading number="03">Players</SectionHeading></div>
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{Array.from({ length: PLAYER_COUNT }, (_, index) => {
          const name = `player${index + 1}` as FieldName;
          return <Field key={name} name={name} label={`Player ${index + 1} Name`} placeholder="Player’s full name" error={errors[name]} />;
        })}</div>
      </section>
      <Button type="submit" className="mt-8 h-13 w-full rounded-sm text-[15px] font-semibold shadow-none" disabled={submitting}>{submitting ? "Submitting…" : "Register My Team"}<ArrowRight className="ml-2" aria-hidden="true" /></Button>
      <p className="mx-auto mt-4 max-w-md text-center text-xs leading-5 text-muted-foreground">Already registered? Submitting again with the same contact number updates your team.</p>
    </fieldset>
    <div className="mt-7 flex items-center justify-center gap-2 border-t pt-5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden="true" />Registrations close 27 October 2026.</div>
  </form>;
}