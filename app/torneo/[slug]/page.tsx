import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  Empty,
  MatchesByRound,
  MatchRow,
  PHASE_LABEL,
  ScorersList,
} from "@/components/MatchList";
import { StandingsTable } from "@/components/Standings";
import { prisma } from "@/lib/prisma";
import {
  getTournamentBySlug,
  standingsByGroup,
  tournamentScorers,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "posiciones", label: "Posiciones" },
  { key: "goleadores", label: "Goleadores" },
  { key: "partidos", label: "Partidos" },
  { key: "final", label: "Fase Final" },
  { key: "noticias", label: "Noticias" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { championTeam: true, _count: { select: { teams: true } } },
  });
  if (!tournament) return { title: "Torneo no encontrado" };

  const title = tournament.championTeam
    ? `🏆 ${tournament.championTeam.name}, campeón de ${tournament.name}`
    : `${tournament.name} — Posiciones y goleadores`;
  const description = `${tournament._count.teams} equipos · Tabla, goleadores y resultados en vivo.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function TorneoPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ slug }, { tab }] = await Promise.all([params, searchParams]);
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) notFound();

  const posts = await prisma.post.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { publishedAt: "desc" },
  });

  const active: TabKey = TABS.some((item) => item.key === tab)
    ? (tab as TabKey)
    : "posiciones";

  const groups = standingsByGroup(tournament);
  const scorers = tournamentScorers(tournament, 20);
  const topScorer = scorers[0];
  const groupMatches = tournament.matches.filter(
    (match) => match.phase === "GROUP",
  );
  const knockoutPhases = ["QUARTER", "SEMI", "FINAL"].filter((phase) =>
    tournament.matches.some((match) => match.phase === phase),
  );

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-5">
      <header className="mb-4 text-center">
        <Link href="/">
          <Logo className="justify-center text-xl text-neutral-400" />
        </Link>
        <p className="mt-3 text-xs uppercase tracking-widest text-pitch-light">
          {tournament.season ?? "Torneo amateur"}
        </p>
        <h1 className="ff-wordmark text-balance text-3xl leading-tight">
          {tournament.name}
        </h1>
      </header>

      {tournament.championTeam && (
        <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[2px]">
          <div className="rounded-[22px] bg-neutral-950 px-5 py-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Campeón del torneo
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              {tournament.championTeam.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tournament.championTeam.logoUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-amber-400"
                />
              ) : (
                <span className="text-4xl">🏆</span>
              )}
              <p className="text-balance text-xl font-extrabold">
                {tournament.championTeam.name}
              </p>
            </div>
            {topScorer && (
              <p className="mt-3 text-sm text-neutral-300">
                <span className="font-semibold text-amber-400">
                  Goleador del torneo:
                </span>{" "}
                {topScorer.playerName} ({topScorer.teamName}) ·{" "}
                {topScorer.goals} {topScorer.goals === 1 ? "gol" : "goles"}
              </p>
            )}
          </div>
        </section>
      )}

      <nav className="sticky top-0 z-10 -mx-4 mb-5 flex gap-2 overflow-x-auto bg-neutral-950/95 px-4 py-3 backdrop-blur">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/torneo/${slug}?tab=${item.key}`}
            scroll={false}
            aria-current={item.key === active ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              item.key === active
                ? "bg-pitch-light text-white"
                : "border border-neutral-700 text-neutral-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {active === "posiciones" &&
        (tournament.teams.length === 0 ? (
          <Empty>Todavía no hay equipos inscritos.</Empty>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <StandingsTable
                key={group.name ?? "única"}
                rows={group.rows}
                title={group.name ? `Grupo ${group.name}` : undefined}
              />
            ))}
          </div>
        ))}

      {active === "goleadores" &&
        (scorers.length === 0 ? (
          <Empty>Todavía no hay goles cargados.</Empty>
        ) : (
          <ScorersList rows={scorers} />
        ))}

      {active === "partidos" &&
        (groupMatches.length === 0 ? (
          <Empty>El calendario todavía no está publicado.</Empty>
        ) : (
          <MatchesByRound matches={groupMatches} />
        ))}

      {active === "final" &&
        (knockoutPhases.length === 0 ? (
          <Empty>La fase final todavía no está definida.</Empty>
        ) : (
          <div className="space-y-6">
            {knockoutPhases.map((phase) => (
              <section key={phase}>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                  {PHASE_LABEL[phase]}
                </h2>
                <ul className="space-y-2">
                  {tournament.matches
                    .filter((match) => match.phase === phase)
                    .map((match) => (
                      <li key={match.id}>
                        <MatchRow match={match} highlight={phase === "FINAL"} />
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        ))}

      {active === "noticias" &&
        (posts.length === 0 ? (
          <Empty>Sin noticias de este torneo.</Empty>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <article key={post.id} className="card">
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="mb-3 h-44 w-full rounded-xl object-cover"
                  />
                )}
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                  {new Intl.DateTimeFormat("es", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(post.publishedAt)}
                </p>
                <h3 className="text-balance text-lg font-bold">{post.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">
                  {post.body}
                </p>
              </article>
            ))}
          </div>
        ))}

      <footer className="mt-10 space-y-2 text-center text-xs text-neutral-600">
        <Link
          href="/penales"
          className="block text-sm text-pitch-light underline"
        >
          🥅 Juega la tanda de penales mientras esperas
        </Link>
        <p>Full Fútbol · actualizado al momento</p>
      </footer>
    </main>
  );
}
