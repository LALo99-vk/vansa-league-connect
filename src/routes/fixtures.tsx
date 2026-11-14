import { useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Trophy, Volleyball } from "lucide-react";
import { SPORTS, type Fixture, type FixtureSport, type SportFixtures } from "@/lib/fixtures";
import { getFixtures } from "@/lib/fixtures-store";
import schoolLogo from "@/assets/vidyaniketan-logo.png";
import schoolWordmark from "@/assets/vidyaniketan-wordmark.png";
import athletiqLogo from "@/assets/athletiq-logo.png";

const REFRESH_MS = 30_000;

export const Route = createFileRoute("/fixtures")({
  validateSearch: (search: Record<string, unknown>): { sport: FixtureSport } => ({
    sport: search["sport"] === "volleyball" ? "volleyball" : "football",
  }),
  loader: () => getFixtures(),
  head: () => ({ meta: [
    { title: "Fixtures & results | VANSA Sports League 2026" },
    { name: "description", content: "Football and volleyball fixtures, league tables, finals and winners at the VANSA Sports League 2026." },
  ] }),
  component: FixturesPage,
});

/** A football drawn to match lucide's 2px rounded stroke, so it pairs with lucide's Volleyball. */
function Football({ className }: { className?: string | undefined }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12.0 8.1 15.7 10.8 14.3 15.2 9.7 15.2 8.3 10.8Z" fill="currentColor" />
    <path d="M12.0 8.1 12.0 5.4M15.7 10.8 18.3 10.0M14.3 15.2 15.9 17.3M9.7 15.2 8.1 17.3M8.3 10.8 5.7 10.0" />
    <path d="M12.0 5.4 8.5 4.1 9.2 2.4 14.8 2.4 15.5 4.1ZM18.3 10.0 18.4 6.2 20.3 6.4 22.0 11.7 20.6 12.9ZM15.9 17.3 19.4 16.3 19.9 18.2 15.4 21.4 13.8 20.4ZM8.1 17.3 10.2 20.4 8.6 21.4 4.1 18.2 4.6 16.3ZM5.7 10.0 3.4 12.9 2.0 11.7 3.7 6.4 5.6 6.2Z" fill="currentColor" strokeWidth="1" />
  </svg>;
}

function SportIcon({ sport, className }: { sport: FixtureSport; className?: string | undefined }) {
  return sport === "football" ? <Football className={className} /> : <Volleyball className={className} strokeWidth={2} aria-hidden="true" />;
}

function useAutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void router.invalidate();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);
}

function StatusPill({ status }: { status: Fixture["status"] }) {
  if (status === "live") return <span className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"><span className="size-1.5 animate-pulse rounded-full bg-white" />Live</span>;
  if (status === "completed") return <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Full time</span>;
  return null;
}

function TeamLine({ name, placeholder, score, won, lost }: { name: string; placeholder: string | null; score: number | null; won: boolean; lost: boolean }) {
  return <div className={`flex items-center justify-between gap-3 py-1 ${lost ? "text-muted-foreground" : ""}`}>
    <span className={`min-w-0 truncate ${won ? "font-semibold" : ""} ${name ? "" : "italic text-muted-foreground"}`}>{name || placeholder}</span>
    <span className={`font-display text-xl tabular-nums ${won ? "text-primary" : ""}`}>{score ?? "–"}</span>
  </div>;
}

function MatchCard({ match }: { match: Fixture }) {
  return <div className={`rounded-md border bg-card px-4 py-3 ${match.status === "live" ? "border-maroon ring-1 ring-maroon" : "border-border"}`}>
    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span><b className="font-semibold text-foreground">{match.id}</b>{match.time && ` · ${match.time}`}</span>
      <StatusPill status={match.status} />
    </div>
    <TeamLine name={match.teamA} placeholder={match.placeholderA} score={match.scoreA} won={match.result === "a"} lost={match.result === "b"} />
    <TeamLine name={match.teamB} placeholder={match.placeholderB} score={match.scoreB} won={match.result === "b"} lost={match.result === "a"} />
    {match.result === "draw" && <p className="mt-1 text-xs text-muted-foreground">Draw</p>}
  </div>;
}

function Standings({ data, sport }: { data: SportFixtures; sport: (typeof SPORTS)[number] }) {
  const { cols } = sport;
  const th = "px-1.5 py-2 font-semibold sm:px-2.5";
  const td = "px-1.5 py-2.5 tabular-nums sm:px-2.5";
  return <div className="overflow-x-auto rounded-md border border-border bg-card">
    <table className="w-full text-[13px] sm:text-sm">
      <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="py-2 pl-3 pr-1 text-left font-semibold">#</th>
          <th className={`${th} text-left`}>Team</th>
          <th className={th} title="Played">P</th><th className={th} title="Won">W</th>{sport.draws && <th className={th} title="Drawn">D</th>}<th className={th} title="Lost">L</th>
          <th className={th} title={sport.slug === "football" ? "Goals for" : "Sets won"}>{cols.for}</th>
          <th className={th} title={sport.slug === "football" ? "Goals against" : "Sets lost"}>{cols.against}</th>
          <th className={th} title={sport.slug === "football" ? "Goal difference" : "Set difference"}>{cols.diff}</th>
          <th className="py-2 pl-1.5 pr-3 font-semibold">Pts</th>
        </tr>
      </thead>
      <tbody>{data.standings.map((row, i) => {
        const diff = row.scored - row.conceded;
        const finalist = data.leagueComplete && !data.tieNote && i < 2;
        return <tr key={row.team} className={`border-t border-border text-center ${finalist ? "bg-gold/15" : ""}`}>
          <td className="py-2.5 pl-3 pr-1 text-left text-muted-foreground">{i + 1}</td>
          <td className="px-1.5 py-2.5 text-left font-medium sm:px-2.5">{row.team}{finalist && <span className="ml-1.5 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold uppercase text-navy-deep">Final</span>}</td>
          <td className={td}>{row.played}</td><td className={td}>{row.won}</td>{sport.draws && <td className={td}>{row.drawn}</td>}<td className={td}>{row.lost}</td>
          <td className={td}>{row.scored}</td><td className={td}>{row.conceded}</td>
          <td className={`${td} font-medium`}>{diff > 0 ? `+${diff}` : diff}</td>
          <td className="py-2.5 pl-1.5 pr-3 font-bold tabular-nums">{row.points}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function Champion({ name, sport }: { name: string | null; sport: string }) {
  return <div className={`flex items-center gap-4 rounded-md px-5 py-4 ${name ? "bg-navy-deep text-white" : "border border-dashed border-border bg-card text-muted-foreground"}`}>
    <Trophy className={name ? "text-gold" : ""} size={30} strokeWidth={1.6} />
    <div>
      <p className="text-xs uppercase tracking-wide opacity-75">{sport} champions</p>
      <p className={`font-display text-2xl font-bold ${name ? "" : "text-lg"}`}>{name ?? "Decided at the final"}</p>
    </div>
  </div>;
}

function SportView({ data }: { data: SportFixtures }) {
  const sport = SPORTS.find((s) => s.slug === data.slug)!;
  if (!data.league.length && !data.final) return <p className="rounded-md border border-dashed border-border bg-card p-6 text-center text-muted-foreground">Fixtures will appear here soon.</p>;
  return <div className="space-y-8">
    <Champion name={data.champion} sport={sport.label} />
    {data.final && <section>
      <h2 className="mb-3 font-display text-2xl font-bold">Final</h2>
      <MatchCard match={data.final} />
    </section>}
    <section>
      <h2 className="font-display text-2xl font-bold">League table</h2>
      <p className="mb-3 mt-1 text-xs text-muted-foreground">Everyone plays everyone; the top 2 play the final. Win {sport.win}{sport.draws ? ` · Draw ${sport.draw}` : ""} · Loss 0 · tie-break: {sport.tieBreak}, then {sport.scoreLabel.toLowerCase()} scored. Updates by itself as scores come in.</p>
      <Standings data={data} sport={sport} />
      {data.tieNote && <p className="mt-2 text-sm text-maroon">{data.tieNote}</p>}
    </section>
    <section>
      <h2 className="mb-3 font-display text-2xl font-bold">League matches</h2>
      <div className="grid gap-3 sm:grid-cols-2">{data.league.map((m) => <MatchCard key={m.id} match={m} />)}</div>
    </section>
  </div>;
}

function FixturesPage() {
  useAutoRefresh();
  const { sports } = Route.useLoaderData();
  const { sport } = Route.useSearch();
  const data = sports.find((s) => s.slug === sport) ?? sports[0]!;
  return <div className="flex min-h-screen flex-col">
    <div className="h-1 bg-maroon" aria-hidden="true" />
    <header className="bg-card">
      <div className="mx-auto flex max-w-[720px] items-center gap-3 px-5 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center gap-3"><img src={schoolLogo} alt="" className="h-9 w-auto" /><img src={schoolWordmark} alt="Vidyaniketan School" className="h-4 w-auto" /></Link>
      </div>
    </header>
    <main className="flex-1">
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[720px] px-5 pt-8 sm:px-8">
          <p className="font-display text-lg font-bold text-gold">VANSA Sports League 2026</p>
          <h1 className="font-display text-5xl font-extrabold leading-none sm:text-6xl">Fixtures &amp; results</h1>
          <nav className="mt-7 grid grid-cols-2 gap-1.5" aria-label="Sport">{SPORTS.map((s) => {
            const active = s.slug === sport;
            return <Link key={s.slug} to="/fixtures" search={{ sport: s.slug }} aria-current={active ? "page" : undefined} className={`flex items-center justify-center gap-2.5 rounded-t-lg px-4 py-3.5 font-display text-2xl font-bold tracking-wide transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold ${active ? "bg-background text-primary" : "text-white/70 hover:bg-white/[0.08] hover:text-white"}`}>
              <SportIcon sport={s.slug} className={`size-6 shrink-0 ${active ? "sport-tab-roll" : ""}`} />
              {s.label}
            </Link>;
          })}</nav>
        </div>
      </section>
      <div className="mx-auto max-w-[720px] px-5 pb-16 pt-8 sm:px-8">
        <SportView data={data} />
        <p className="mt-12 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">Powered by <img src={athletiqLogo} alt="AthletIQ" className="h-4 w-auto" /></p>
      </div>
    </main>
    <footer className="bg-maroon text-white">
      <div className="mx-auto max-w-[720px] px-5 py-6 text-sm sm:px-8"><p className="text-white/70">Vidyaniketan School, Bengaluru</p></div>
    </footer>
  </div>;
}
