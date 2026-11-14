import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { matchWinner } from "./tournament-engine";

type Tx = Prisma.TransactionClient;

/**
 * Lleva el ganador de un partido a su hueco en la siguiente ronda.
 * Si el equipo que ocupaba el hueco cambia y ese partido ya estaba jugado,
 * se limpia (resultado, eventos y desempate) y el arrastre sigue hacia
 * adelante: lo que venía después ya no corresponde a esos equipos.
 */
export async function propagateWinner(
  tx: Tx,
  matchId: string,
  depth = 0,
): Promise<void> {
  if (depth > 8) return; // tope de seguridad ante un enlace circular

  const match = await tx.match.findUnique({ where: { id: matchId } });
  if (!match?.nextMatchId || !match.nextSlot) return;

  const winner = matchWinner(match);
  const next = await tx.match.findUnique({ where: { id: match.nextMatchId } });
  if (!next) return;

  const slotField = match.nextSlot === "HOME" ? "homeTeamId" : "awayTeamId";
  const current = next[slotField];
  if (current === winner) return;

  const dirty = next.status === "PLAYED" || next.winnerTeamId !== null;
  await tx.match.update({
    where: { id: next.id },
    data: {
      [slotField]: winner,
      ...(dirty
        ? {
            status: "SCHEDULED" as const,
            homeGoals: 0,
            awayGoals: 0,
            winnerTeamId: null,
          }
        : {}),
    },
  });
  if (dirty) {
    await tx.matchEvent.deleteMany({ where: { matchId: next.id } });
  }

  await propagateWinner(tx, next.id, depth + 1);
}

/**
 * El campeón sale de la final: si está jugada y resuelta, ese equipo;
 * si no, el torneo vuelve a estar en juego.
 */
export async function syncChampion(tx: Tx, tournamentId: string) {
  const finals = await tx.match.findMany({
    where: { tournamentId, phase: "FINAL" },
    orderBy: { createdAt: "desc" },
  });
  // Sin final creada no tocamos nada: el campeón pudo marcarse a mano.
  if (finals.length === 0) return;

  const champion = matchWinner(finals[0]);
  await tx.tournament.update({
    where: { id: tournamentId },
    data: {
      championTeamId: champion,
      status: champion ? "FINISHED" : "ACTIVE",
    },
  });
}

/** Partidos de la llave con sus equipos, en orden de ronda. */
export function knockoutMatches(tournamentId: string) {
  return prisma.match.findMany({
    where: { tournamentId, phase: { not: "GROUP" } },
    orderBy: [{ phase: "asc" }, { label: "asc" }, { createdAt: "asc" }],
    include: { homeTeam: true, awayTeam: true },
  });
}
