import Link from "next/link";
import { requireTournament } from "@/lib/org";
import { updateTournament } from "../actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TournamentHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await requireTournament(id);

  const [teams, played, pending, knockout, posts] = await Promise.all([
    prisma.team.count({ where: { tournamentId: id } }),
    prisma.match.count({ where: { tournamentId: id, status: "PLAYED" } }),
    prisma.match.count({ where: { tournamentId: id, status: "SCHEDULED" } }),
    prisma.match.count({
      where: { tournamentId: id, phase: { in: ["QUARTER", "SEMI", "FINAL"] } },
    }),
    prisma.post.count({ where: { tournamentId: id } }),
  ]);

  const tiles = [
    {
      href: `/dashboard/${id}/equipos`,
      icon: "👕",
      title: "Equipos",
      sub: `${teams} inscritos`,
    },
    {
      href: `/dashboard/${id}/sorteo`,
      icon: "🎲",
      title: "Sorteo",
      sub: "Previa, grupos y calendario",
      accent: true,
    },
    {
      href: `/dashboard/${id}/actas`,
      icon: "📝",
      title: "Actas",
      sub: `${pending} por cargar`,
    },
    {
      href: `/dashboard/${id}/tabla`,
      icon: "📊",
      title: "Posiciones",
      sub: "Tabla por grupo",
    },
    {
      href: `/dashboard/${id}/resultados`,
      icon: "✅",
      title: "Resultados",
      sub: `${played} jugados`,
    },
    {
      href: `/dashboard/${id}/proximos`,
      icon: "📅",
      title: "Próximos",
      sub: `${pending} pendientes`,
    },
    {
      href: `/dashboard/${id}/goleadores`,
      icon: "🥇",
      title: "Goleadores",
      sub: "Ranking del torneo",
    },
    {
      href: `/dashboard/${id}/disciplina`,
      icon: "🟨",
      title: "Tarjetas",
      sub: "Amonestados y expulsados",
    },
    {
      href: `/dashboard/${id}/fase-final`,
      icon: "🏆",
      title: "Fase final",
      sub: `${knockout} cruces · campeón`,
    },
    {
      href: `/dashboard/${id}/noticias`,
      icon: "📰",
      title: "Noticias",
      sub: `${posts} publicadas`,
    },
  ];

  return (
    <>
      <details className="card mb-4">
        <summary className="cursor-pointer text-sm font-semibold text-neutral-300">
          Editar torneo
          {tournament.venue ? ` · 📍 ${tournament.venue}` : ""}
        </summary>
        <form action={updateTournament} className="mt-3 space-y-2">
          <input type="hidden" name="tournamentId" value={id} />
          <label className="block">
            <span className="label">Nombre</span>
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={tournament.name}
              className="w-full"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="min-w-0 flex-1">
              <span className="label">Temporada</span>
              <input
                name="season"
                maxLength={40}
                defaultValue={tournament.season ?? ""}
                placeholder="2026"
                className="w-full"
              />
            </label>
            <label className="min-w-0 flex-1">
              <span className="label">Cancha habitual</span>
              <input
                name="venue"
                maxLength={60}
                defaultValue={tournament.venue ?? ""}
                placeholder="Cancha del barrio"
                className="w-full"
              />
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            Al guardar, los partidos que faltan por jugar pasan a esta
            cancha; los ya jugados conservan la suya. Si algún partido se
            juega en otro lado, cámbialo después en Próximos.
          </p>
          <button type="submit" className="btn-primary w-full">
            Guardar torneo
          </button>
        </form>
      </details>

      <main className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className={`tile ${
            tile.accent
              ? "border-pitch-light/50 from-pitch-dark/60 to-neutral-950"
              : "hover:border-neutral-600"
          }`}
        >
          <span className="tile-icon">{tile.icon}</span>
          <span>
            <span className="tile-title block">{tile.title}</span>
            <span className="tile-sub">{tile.sub}</span>
          </span>
        </Link>
      ))}
      </main>
    </>
  );
}
