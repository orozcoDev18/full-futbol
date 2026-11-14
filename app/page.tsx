import type { Metadata } from "next";
import Link from "next/link";
import { BallFlame, Logo } from "@/components/Logo";
import { Empty } from "@/components/MatchList";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Full Fútbol — Torneos y noticias",
  description:
    "Resultados, tablas de posiciones, goleadores y noticias de los torneos de fútbol amateur.",
};

export default async function HomePage() {
  const [tournaments, posts] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        championTeam: true,
        _count: { select: { teams: true } },
      },
    }),
    prisma.post.findMany({
      orderBy: { publishedAt: "desc" },
      take: 20,
      include: { tournament: { select: { name: true, slug: true } } },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <header className="mb-7 text-center">
        <Logo className="justify-center text-4xl" />
        <p className="mt-2 text-sm text-neutral-400">
          Torneos de barrio, en serio
        </p>
      </header>

      <Link
        href="/penales"
        className="tile mb-8 flex-row items-center gap-4 border-pitch-light/40 from-pitch-dark/50 to-neutral-950"
      >
        <span className="text-4xl">🥅</span>
        <span className="min-w-0">
          <span className="tile-title block">Tanda de penales</span>
          <span className="tile-sub">
            Patea y ataja mientras esperas el partido
          </span>
        </span>
      </Link>

      <section className="mb-8">
        <h2 className="ff-wordmark mb-3 text-xl tracking-widest text-neutral-300">
          Torneos
        </h2>
        {tournaments.length === 0 && <Empty>Todavía no hay torneos.</Empty>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/torneo/${tournament.slug}`}
              className="tile hover:border-pitch-light/60"
            >
              <BallFlame
                className="pointer-events-none absolute -right-4 -top-3 h-24 w-20 opacity-10"
                idSuffix={`home${tournament.id}`}
              />
              <div>
                <p className="tile-title text-lg">{tournament.name}</p>
                <p className="tile-sub">
                  {tournament.season ? `${tournament.season} · ` : ""}
                  {tournament._count.teams} equipos
                </p>
              </div>
              {tournament.championTeam ? (
                <p className="text-xs font-semibold text-amber-300">
                  🏆 {tournament.championTeam.name}
                </p>
              ) : (
                <p className="text-xs text-pitch-light">En juego</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="ff-wordmark mb-3 text-xl tracking-widest text-neutral-300">
          Noticias
        </h2>
        {posts.length === 0 && <Empty>Sin noticias publicadas.</Empty>}
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
              <p className="text-[11px] uppercase tracking-wide text-pitch-light">
                <Link href={`/torneo/${post.tournament.slug}`}>
                  {post.tournament.name}
                </Link>
                {" · "}
                {new Intl.DateTimeFormat("es", {
                  day: "2-digit",
                  month: "long",
                }).format(post.publishedAt)}
              </p>
              <h3 className="text-balance text-lg font-bold">{post.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">
                {post.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-neutral-600">
        <Link href="/login" className="underline">
          Entrar al panel del organizador
        </Link>
      </footer>
    </main>
  );
}
