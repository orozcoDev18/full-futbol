"use server";

import { revalidatePath } from "next/cache";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { getTournamentById, seedFromStandings } from "@/lib/queries";
import {
  BRACKET_SIZES,
  buildBracket,
  type BracketSize,
  type MatchPhase,
} from "@/lib/tournament-engine";

const KNOCKOUT_PHASES: MatchPhase[] = ["QUARTER", "SEMI", "FINAL"];

async function revalidate(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { slug: true },
  });
  revalidatePath(`/dashboard/${tournamentId}`, "layout");
  if (tournament) revalidatePath(`/torneo/${tournament.slug}`);
}

/** Cruce manual de eliminación directa (cuartos, semis o final). */
export async function createKnockoutMatch(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const phase = String(formData.get("phase") ?? "") as MatchPhase;
  const homeTeamId = String(formData.get("homeTeamId") ?? "");
  const awayTeamId = String(formData.get("awayTeamId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "").trim();
  await requireTournament(tournamentId);

  if (!KNOCKOUT_PHASES.includes(phase)) throw new Error("Fase no válida");
  if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
    throw new Error("Elige dos equipos distintos");
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId, id: { in: [homeTeamId, awayTeamId] } },
    select: { id: true },
  });
  if (teams.length !== 2) throw new Error("Equipos no encontrados en el torneo");

  await prisma.match.create({
    data: {
      tournamentId,
      phase,
      label: label || null,
      date: dateValue ? new Date(dateValue) : null,
      homeTeamId,
      awayTeamId,
    },
  });

  await revalidate(tournamentId);
}

export async function deleteMatch(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  await requireTournament(tournamentId);

  const match = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
  });
  if (!match) throw new Error("Partido no encontrado");

  await prisma.match.delete({ where: { id: matchId } });
  await revalidate(tournamentId);
}

/** Marca al campeón y cierra el torneo. Con teamId vacío, lo reabre. */
export async function setChampion(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const teamId = String(formData.get("championTeamId") ?? "").trim();
  await requireTournament(tournamentId);

  if (!teamId) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { championTeamId: null, status: "ACTIVE" },
    });
    await revalidate(tournamentId);
    return;
  }

  const team = await prisma.team.findFirst({ where: { id: teamId, tournamentId } });
  if (!team) throw new Error("Equipo no encontrado");

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { championTeamId: teamId, status: "FINISHED" },
  });
  await revalidate(tournamentId);
}

/**
 * Crea la llave completa (cuartos/semis/final según el tamaño) sembrando
 * con la tabla de posiciones. Reemplaza la fase final anterior.
 */
export async function generateBracket(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const size = Number(formData.get("size"));
  await requireTournament(tournamentId);

  if (!BRACKET_SIZES.includes(size as BracketSize)) {
    throw new Error("La llave debe ser de 2, 4 u 8 equipos");
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.teams.length < 2) {
    throw new Error("Necesitas al menos 2 equipos inscritos");
  }

  const bracket = buildBracket(seedFromStandings(tournament, size));

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({
      where: { tournamentId, phase: { in: ["QUARTER", "SEMI", "FINAL"] } },
    });

    const idByKey = new Map<string, string>();
    for (const match of bracket) {
      const created = await tx.match.create({
        data: {
          tournamentId,
          phase: match.phase,
          label: match.label,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
        },
      });
      idByKey.set(match.key, created.id);
    }

    for (const match of bracket) {
      if (!match.nextKey) continue;
      await tx.match.update({
        where: { id: idByKey.get(match.key) },
        data: {
          nextMatchId: idByKey.get(match.nextKey),
          nextSlot: match.nextSlot,
        },
      });
    }

    await tx.tournament.update({
      where: { id: tournamentId },
      data: { championTeamId: null, status: "ACTIVE" },
    });
  });

  await revalidate(tournamentId);
}
