import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/registration-form";
import schoolLogo from "@/assets/vidyaniketan-logo.png";
import schoolWordmark from "@/assets/vidyaniketan-wordmark.png";
import athletiqLogo from "@/assets/athletiq-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "VANSA Sports League 2026 | Team Registration" },
    { name: "description", content: "Register your alumni team for men's football or women's throwball at Vidyaniketan School's VANSA Sports League on 1 November 2026 in Bengaluru." },
    { property: "og:title", content: "VANSA Sports League 2026 · Team registration" },
    { property: "og:description", content: "Join Vidyaniketan School alumni on the pitch in Bengaluru, 1 November 2026. Team registrations close 27 October." },
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

function Index() {
  return <div className="flex min-h-screen flex-col">
    <div className="h-1 bg-maroon" aria-hidden="true" />
    <header className="bg-card">
      <div className="mx-auto flex max-w-[720px] items-center gap-3 px-5 py-3.5 sm:px-8">
        <img src={schoolLogo} alt="" className="h-9 w-auto" />
        <img src={schoolWordmark} alt="Vidyaniketan School" className="h-4 w-auto" />
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
          <p className="mt-6 max-w-[52ch] text-[15px] leading-7 text-primary-foreground/85">Welcome back to the pitch! We're bringing our alumni together for a day of competitive men's football and women’s throwball for the alumni of Vidyaniketan School, Bengaluru.</p>
        </div>
      </section>
      <div className="mx-auto max-w-[720px] px-5 pb-16 pt-10 sm:px-8 sm:pt-12">
        <RegistrationForm />
        <p className="mt-12 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">Powered by <img src={athletiqLogo} alt="AthletIQ" className="h-4 w-auto" /></p>
      </div>
    </main>
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
