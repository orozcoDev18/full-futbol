import Link from "next/link";
import { BallFlame, Logo } from "@/components/Logo";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "../login/actions";
import { createTournament } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const tournaments = await prisma.tournament.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      championTeam: true,
      _count: { select: { teams: true, matches: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Logo className="text-3xl" />
          <p className="mt-1 text-sm text-neutral-400">
            {user.organization.name} · {user.name}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-ghost px-3 text-sm">
            Salir
          </button>
        </form>
      </header>

      <h2 className="ff-wordmark mb-3 text-xl tracking-widest text-neutral-300">
        Elige un torneo
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            href={`/dashboard/${tournament.id}`}
            className="tile hover:border-pitch-light/60"
          >
            <BallFlame
              className="pointer-events-none absolute -right-4 -top-3 h-24 w-20 opacity-10"
              idSuffix={tournament.id}
            />
            <div>
              <p className="tile-title text-lg">{tournament.name}</p>
              <p className="tile-sub">
                {tournament.season ? `${tournament.season} · ` : ""}
                {tournament._count.teams} equipos ·{" "}
                {tournament._count.matches} partidos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  tournament.status === "FINISHED"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-pitch-light/20 text-pitch-light"
                }`}
              >
                {tournament.status === "FINISHED" ? "Finalizado" : "En juego"}
              </span>
              {tournament.championTeam && (
                <span className="truncate text-xs text-amber-300">
                  🏆 {tournament.championTeam.name}
                </span>
              )}
            </div>
          </Link>
        ))}

        <details className="tile group cursor-pointer border-dashed open:cursor-default">
          <summary className="list-none">
            <p className="tile-icon">➕</p>
            <p className="tile-title text-lg">Crear torneo</p>
            <p className="tile-sub">Nuevo campeonato desde cero</p>
          </summary>
          <form action={createTournament} className="mt-3 space-y-3">
            <input
              name="name"
              required
              maxLength={80}
              placeholder="Copa Barrio Norte"
              className="w-full"
              aria-label="Nombre del torneo"
            />
            <input
              name="season"
              maxLength={40}
              placeholder="Temporada (opcional)"
              className="w-full"
              aria-label="Temporada"
            />
            <input
              name="venue"
              maxLength={60}
              placeholder="Cancha habitual (opcional)"
              className="w-full"
              aria-label="Cancha habitual"
            />
            <button type="submit" className="btn-primary w-full">
              Crear torneo
            </button>
          </form>
        </details>
      </div>
    </main>
  );
}
