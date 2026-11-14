import Link from "next/link";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TournamentHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournament(id);

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
  );
}
