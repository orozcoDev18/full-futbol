"use server";

import { revalidatePath } from "next/cache";
import { propagateWinner, syncChampion } from "@/lib/bracket";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import type { MatchEventType } from "@/lib/tournament-engine";

const EVENT_TYPES: MatchEventType[] = ["GOAL", "YELLOW_CARD", "RED_CARD"];

export interface ActaEventInput {
  playerId: string;
  teamId: string;
  type: MatchEventType;
  minute?: number | null;
}

/**
 * Guarda el acta completa: reemplaza los eventos del partido y fija el
 * resultado. El marcador nunca puede ser menor que los goles asignados.
 */
export async function saveActa(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  const homeGoals = Number(formData.get("homeGoals"));
  const awayGoals = Number(formData.get("awayGoals"));
  const played = String(formData.get("status") ?? "PLAYED") === "PLAYED";

  await requireTournament(tournamentId);

  if (
    !Number.isInteger(homeGoals) ||
    !Number.isInteger(awayGoals) ||
    homeGoals < 0 ||
    awayGoals < 0 ||
    homeGoals > 99 ||
    awayGoals > 99
  ) {
    throw new Error("Marcador no válido");
  }

  const match = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
    include: {
      homeTeam: { select: { id: true, players: { select: { id: true } } } },
      awayTeam: { select: { id: true, players: { select: { id: true } } } },
    },
  });
  if (!match) throw new Error("Partido no encontrado");
  if (!match.homeTeam || !match.awayTeam) {
    throw new Error(
      "Este cruce todavía no tiene los dos equipos: falta que se jueguen los partidos anteriores",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("events") ?? "[]"));
  } catch {
    throw new Error("Eventos no válidos");
  }
  if (!Array.isArray(parsed)) throw new Error("Eventos no válidos");

  const homeTeamId = match.homeTeam.id;
  const awayTeamId = match.awayTeam.id;

  const squads = new Map<string, Set<string>>([
    [homeTeamId, new Set(match.homeTeam.players.map((p) => p.id))],
    [awayTeamId, new Set(match.awayTeam.players.map((p) => p.id))],
  ]);

  const events = (parsed as ActaEventInput[]).map((event) => {
    const squad = squads.get(event.teamId);
    if (!squad) throw new Error("Equipo ajeno al partido");
    if (!squad.has(event.playerId)) {
      throw new Error("El jugador no pertenece a ese equipo");
    }
    if (!EVENT_TYPES.includes(event.type)) throw new Error("Evento no válido");
    const minute =
      typeof event.minute === "number" && event.minute >= 0 && event.minute <= 130
        ? Math.trunc(event.minute)
        : null;
    return {
      matchId,
      teamId: event.teamId,
      playerId: event.playerId,
      type: event.type,
      minute,
    };
  });

  const assignedHome = events.filter(
    (event) => event.type === "GOAL" && event.teamId === homeTeamId,
  ).length;
  const assignedAway = events.filter(
    (event) => event.type === "GOAL" && event.teamId === awayTeamId,
  ).length;
  if (homeGoals < assignedHome || awayGoals < assignedAway) {
    throw new Error(
      "El marcador no puede ser menor que los goles asignados a jugadores",
    );
  }

  // Empate en eliminación directa: pasa quien diga el organizador.
  const rawWinner = String(formData.get("winnerTeamId") ?? "").trim();
  const isKnockout = match.phase !== "GROUP";
  const tie = homeGoals === awayGoals;
  if (rawWinner && rawWinner !== homeTeamId && rawWinner !== awayTeamId) {
    throw new Error("El equipo que pasa debe ser uno de los dos del cruce");
  }
  if (isKnockout && played && tie && !rawWinner) {
    throw new Error("El cruce quedó empatado: elige qué equipo pasa de ronda");
  }
  const winnerTeamId = isKnockout && played && tie ? rawWinner : null;

  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.deleteMany({ where: { matchId } });
    await tx.matchEvent.createMany({ data: events });
    await tx.match.update({
      where: { id: matchId },
      data: {
        homeGoals,
        awayGoals,
        status: played ? "PLAYED" : "SCHEDULED",
        winnerTeamId,
      },
    });
    if (isKnockout) {
      await propagateWinner(tx, matchId);
      await syncChampion(tx, tournamentId);
    }
  });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { slug: true },
  });
  revalidatePath(`/dashboard/${tournamentId}`, "layout");
  if (tournament) revalidatePath(`/torneo/${tournament.slug}`);
}
