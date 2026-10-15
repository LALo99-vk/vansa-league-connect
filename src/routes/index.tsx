import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/registration-form";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "VANSA Sports League 2026 | Team Registration" },
    { name: "description", content: "Register your alumni team for men's football or women's throwball at Vidyanikethan School's VANSA Sports League on 1 November 2026 in Bengaluru." },
    { property: "og:title", content: "VANSA Sports League 2026 — Old friends. New rivalries." },
    { property: "og:description", content: "Join Vidyanikethan School alumni on the pitch in Bengaluru, 1 November 2026. Team registrations close 27 October." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return <div className="min-h-screen">
    <header className="border-b bg-background">
      <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-6 sm:min-h-22 md:px-10">
        <div><p className="text-base font-semibold text-primary sm:text-lg">Vidyanikethan School</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Bengaluru · Alumni community</p></div>
        <p className="hidden text-xs font-medium text-primary sm:block">VANSA Sports League <span className="ml-1 text-muted-foreground">2026</span></p>
        <p className="text-right text-[10px] font-medium leading-4 text-primary sm:hidden">VANSA<br />2026</p>
      </div>
    </header>
    <main>
      <section className="mx-auto max-w-[824px] px-5 pb-9 pt-10 sm:px-8 sm:pt-14" aria-labelledby="event-title">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Back to school. Back to sport.</p>
        <h1 id="event-title" className="mt-4 max-w-[16ch] text-[38px] font-semibold leading-[1.05] tracking-[-0.01em] text-primary sm:text-[52px]">VANSA Sports League 2026</h1>
        <p className="mt-4 text-lg font-medium text-foreground sm:text-xl">Old friends. New rivalries.</p>
        <p className="mt-3 max-w-[540px] text-sm leading-[1.75] text-muted-foreground">Welcome back to the pitch! We're bringing our alumni together for a day of competitive men's football and women's throwball for the alumni of Vidyanikethan School, Bengaluru.</p>
        <p className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-4 text-xs font-medium text-foreground sm:text-sm"><span>1 November 2026</span><span aria-hidden="true" className="text-muted-foreground">·</span><span>Bengaluru</span><span aria-hidden="true" className="text-muted-foreground">·</span><span>Men's Football &amp; Women's Throwball</span></p>
      </section>
      <section className="mx-auto max-w-[824px] px-5 pb-16 pt-1 sm:px-8 sm:pt-2" aria-labelledby="registration-title">
        <div className="mb-7"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">One team. One more memory.</p><h2 id="registration-title" className="text-[28px] font-semibold text-primary sm:text-[32px]">Bring your team to the pitch.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Please complete the form below to confirm your participation. All fields are mandatory.</p></div>
        <RegistrationForm />
      </section>
    </main>
    <footer className="border-t"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-7 text-xs text-muted-foreground sm:flex-row md:px-10"><p className="font-medium text-primary">Vidyanikethan School, Bengaluru</p><p>For any queries, contact Manas: <a href="tel:+919902490638" className="whitespace-nowrap font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">+91 9902490638</a></p></div></footer>
  </div>;
}
