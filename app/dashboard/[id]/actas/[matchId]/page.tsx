import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty } from "@/components/MatchList";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import ActaForm from "./ActaForm";

export const dynamic = "force-dynamic";

const PHASE_LABEL: Record<string, string> = {
  GROUP: "Fase de grupos",
  QUARTER: "Cuartos de final",
  SEMI: "Semifinal",
  FINAL: "Final",
};

export default async function ActaPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  await requireTournament(id);

  const match = await prisma.match.findFirst({
    where: { id: matchId, tournamentId: id },
    include: {
      homeTeam: { include: { players: { orderBy: { number: "asc" } } } },
      awayTeam: { include: { players: { orderBy: { number: "asc" } } } },
      events: true,
    },
  });
  if (!match) notFound();

  if (!match.homeTeam || !match.awayTeam) {
    return (
      <main className="space-y-4">
        <Link href={`/dashboard/${id}/fase-final`} className="text-sm text-neutral-400">
          ← Fase final
        </Link>
        <Empty>
          Este cruce todavía espera a los ganadores de la ronda anterior. Carga
          antes esas actas y los equipos aparecerán aquí solos.
        </Empty>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <div>
        <Link
          href={`/dashboard/${id}/actas`}
          className="text-sm text-neutral-400"
        >
          ← Partidos
        </Link>
        <h2 className="mt-1 font-semibold">
          {PHASE_LABEL[match.phase]}
          {match.round ? ` · Jornada ${match.round}` : ""}
          {match.label ? ` · ${match.label}` : ""}
        </h2>
      </div>

      <ActaForm
        tournamentId={id}
        matchId={match.id}
        home={{
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          players: match.homeTeam.players.map((player) => ({
            id: player.id,
            name: player.name,
            number: player.number,
          })),
        }}
        away={{
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          players: match.awayTeam.players.map((player) => ({
            id: player.id,
            name: player.name,
            number: player.number,
          })),
        }}
        initialHomeGoals={match.homeGoals}
        initialAwayGoals={match.awayGoals}
        initialEvents={match.events.map((event) => ({
          playerId: event.playerId,
          teamId: event.teamId,
          type: event.type,
        }))}
        isKnockout={match.phase !== "GROUP"}
        initialWinnerTeamId={match.winnerTeamId}
      />
    </main>
  );
}
