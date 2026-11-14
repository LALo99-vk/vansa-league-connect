import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
import schoolLogo from "@/assets/vidyaniketan-logo.png";
import schoolWordmark from "@/assets/vidyaniketan-wordmark.png";
import athletiqLogo from "@/assets/athletiq-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "VANSA Sports League 2026 | Fixtures & results" },
    { name: "description", content: "Football and volleyball fixtures, league tables and winners at Vidyaniketan School's VANSA Sports League, 15 November 2026, Bengaluru." },
    { property: "og:title", content: "VANSA Sports League 2026 · Fixtures & results" },
    { property: "og:description", content: "Follow every football and volleyball match at the VANSA Sports League, 15 November 2026: fixtures, live scores, league tables and winners." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

// The school emblem redrawn from the logo (a figure with arms raised over five steps),
// with a graduation cap added because this is an alumni event.
const PODIUM_STEPS = [
  { x: 136, y: 418, width: 241, height: 21 },
  { x: 100, y: 441, width: 313, height: 22 },
  { x: 75, y: 465, width: 362, height: 23 },
  { x: 51, y: 490, width: 411, height: 23 },
  { x: 26, y: 515, width: 460, height: 25 },
];

// School blues (#3a6ac4 to #2c5aa0), lightest on the top step.
const PODIUM_COLORS = ["#3a6ac4", "#3563b5", "#315dab", "#2e5ba5", "#2c5aa0"];

function Emblem({ className }: { className?: string }) {
  // Each click tosses the cap; the key change restarts the animation.
  const [tosses, setTosses] = useState(0);
  return <svg viewBox="20 -48 472 590" className={className} aria-hidden="true" onClick={() => setTosses((count) => count + 1)}>
    <g className="emblem-figure" fill="var(--gold)">
      <circle cx="252.5" cy="76" r="54" />
      <path d="M96 64 249 152v260Z" />
      <path d="M407 62 260 152v254Z" />
    </g>
    <g key={tosses} className={tosses ? "emblem-cap-toss" : "emblem-cap"}>
      <g transform="rotate(-9 252 20)">
        <path d="M206 22h92l-3 26q-43 14-86 0Z" fill="#6b0000" />
        <path d="M252-14 336 14 252 42 168 14Z" fill="var(--maroon)" stroke="#b83a3a" strokeWidth="2" strokeLinejoin="round" />
        <path d="M252 14 320 20v42" fill="none" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" />
        <path d="M314 60h12l3 26h-18Z" fill="var(--gold)" />
        <circle cx="252" cy="14" r="5" fill="var(--gold)" />
      </g>
    </g>
    {PODIUM_STEPS.map((step, index) => <rect key={step.y} className="emblem-step" style={{ animationDelay: `${(PODIUM_STEPS.length - 1 - index) * 70}ms` }} {...step} fill={PODIUM_COLORS[index]} />)}
    <path className="emblem-step" d="M205 418h30l30 68v-68h30v106h-30l-30-68v68h-30Z" fill="var(--primary)" />
  </svg>;
}

const SPORT_LINKS = [
  { slug: "football", label: "Football", where: "Football Ground" },
  { slug: "volleyball", label: "Volleyball", where: "Volleyball Court" },
] as const;

function Index() {
  return <div className="flex min-h-screen flex-col">
    <div className="h-1 bg-maroon" aria-hidden="true" />
    <header className="bg-card">
      <div className="mx-auto flex max-w-[720px] items-center gap-3 px-5 py-3.5 sm:px-8">
        <img src={schoolLogo} alt="" className="h-9 w-auto" />
        <img src={schoolWordmark} alt="Vidyaniketan School" className="h-4 w-auto" />
        <Link to="/fixtures" search={{ sport: "football" }} className="ml-auto hidden items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-deep transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex">Fixtures &amp; results <ArrowRight size={16} /></Link>
      </div>
    </header>
    <main className="flex-1">
      <section className="relative overflow-hidden bg-primary text-primary-foreground" aria-labelledby="event-title">
        <Emblem className="absolute z-10 cursor-pointer select-none overflow-visible right-5 top-9 h-[118px] w-auto sm:bottom-0 sm:right-[7%] sm:top-auto sm:h-[86%]" />
        <div className="relative mx-auto max-w-[720px] px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14">
          <h1 id="event-title" className="font-display font-extrabold leading-[0.88]">
            <span className="block text-[92px] sm:text-[140px]">VANSA</span>
            <span className="mt-1 block text-[34px] font-bold sm:text-[50px]">Sports League 2026</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[15px] leading-7 text-primary-foreground/85">Welcome back to the pitch! We're bringing our alumni together for a day of competitive football and volleyball for the alumni and current students of Vidyaniketan School, Bengaluru, on 15 November 2026.</p>
          <Link to="/fixtures" search={{ sport: "football" }} className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-navy-deep shadow-[0_10px_24px_-10px_rgba(0,0,0,0.55)] transition-[filter,transform] hover:brightness-105 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">See fixtures &amp; results <ArrowRight size={18} /></Link>
        </div>
      </section>
      <div className="mx-auto max-w-[720px] px-5 pb-28 pt-10 sm:px-8 sm:pb-16 sm:pt-12">
        <section aria-labelledby="match-day">
          <h2 id="match-day" className="font-display text-4xl font-extrabold text-primary">Match day · 15 November</h2>
          <p className="mt-2 text-[15px] leading-7 text-muted-foreground">Fixtures, live scores, league tables and the winners, updated through the day.</p>
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            {SPORT_LINKS.map((sport) => <Link key={sport.slug} to="/fixtures" search={{ sport: sport.slug }} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl font-bold text-foreground">{sport.label}</span>
                <span className="block text-sm text-muted-foreground">{sport.where} · 4 teams · league, then the final</span>
              </span>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5"><ArrowRight size={18} /></span>
            </Link>)}
          </div>
        </section>
        <div className="mt-12"><RegistrationForm /></div>
        <p className="mt-12 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">Powered by <img src={athletiqLogo} alt="AthletIQ" className="h-4 w-auto" /></p>
      </div>
    </main>
    <Link to="/fixtures" search={{ sport: "football" }} className="fixtures-bar fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-xl bg-navy-deep px-4 py-3 text-white shadow-[0_12px_30px_-8px_rgba(10,20,50,0.6)] sm:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-gold" aria-hidden="true" />
      <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold">Fixtures &amp; results</span><span className="block text-xs text-white/70">Football and volleyball, live today</span></span>
      <span className="flex items-center gap-1 rounded-full bg-gold px-3.5 py-2 text-sm font-semibold text-navy-deep">Open <ArrowRight size={15} /></span>
    </Link>
    <footer className="bg-maroon text-white">
      <div className="mx-auto max-w-[720px] px-5 py-6 text-sm sm:px-8">
        <div>
          <p>Questions? Call Manas on <a href="tel:+919902490638" className="whitespace-nowrap font-medium underline decoration-white/40 underline-offset-4 hover:decoration-white">+91 99024 90638</a></p>
          <p className="mt-1 text-white/70">Vidyaniketan School, Bengaluru</p>
        </div>
      </div>
    </footer>
  </div>;
}
