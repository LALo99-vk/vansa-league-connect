import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
import pitch from "@/assets/vansa-pitch.jpg";

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
      <div className="mx-auto flex min-h-22 max-w-6xl items-center justify-between gap-4 px-6 md:px-10">
        <div><p className="text-base font-semibold text-primary sm:text-lg">Vidyanikethan School</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Bengaluru · Alumni community</p></div>
        <p className="hidden text-xs font-medium text-primary sm:block">VANSA Sports League <span className="ml-1 text-muted-foreground">2026</span></p>
        <p className="text-right text-[10px] font-medium leading-4 text-primary sm:hidden">VANSA<br />2026</p>
      </div>
    </header>
    <main>
      <section className="event-hero relative isolate overflow-hidden">
        <img src={pitch} alt="A sunlit football pitch with a white goal and tree-lined school grounds" width={1920} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.16em] text-hero-muted">Back to school. Back to sport.</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] text-hero-foreground sm:text-5xl md:text-[56px]">VANSA<br />Sports League 2026</h1>
          <p className="mt-4 text-xl font-medium text-hero-foreground md:text-2xl">Old friends. New rivalries.</p>
          <p className="mt-3 max-w-[480px] text-sm leading-[1.75] text-hero-muted">Welcome back to the pitch! We're bringing our alumni together for a day of competitive men's football and women's throwball for the alumni of Vidyanikethan School, Bengaluru.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-hero-foreground sm:text-sm"><span className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" />1 November 2026</span><span className="flex items-center gap-2"><MapPin className="size-4" aria-hidden="true" />Bengaluru</span></div>
          <div className="mt-5 flex items-center gap-4 text-xs text-hero-muted"><span>Men's Football</span><span className="h-3 border-l border-hero-muted/40" aria-hidden="true" /><span>Women's Throwball</span></div>
        </div>
      </section>
      <section className="mx-auto max-w-[824px] px-5 pb-16 pt-10 sm:px-8 sm:pt-12" aria-labelledby="registration-title">
        <div className="mb-7"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">One team. One more memory.</p><h2 id="registration-title" className="text-[28px] font-semibold text-primary sm:text-[32px]">Bring your team to the pitch.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Please complete the form below to confirm your participation. All fields are mandatory.</p></div>
        <RegistrationForm />
      </section>
    </main>
    <footer className="border-t"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-7 text-xs text-muted-foreground sm:flex-row md:px-10"><p className="font-medium text-primary">Vidyanikethan School, Bengaluru</p><p>For any queries, contact Manas: <a href="tel:+919902490638" className="whitespace-nowrap font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">+91 9902490638</a></p></div></footer>
  </div>;
}
