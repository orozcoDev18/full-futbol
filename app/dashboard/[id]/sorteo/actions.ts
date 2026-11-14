"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { getTournamentById } from "@/lib/queries";
import {
  generateRoundRobinFixture,
  qualifiedFromPrelim,
} from "@/lib/tournament-engine";

export interface DrawGroup {
  name: string;
  teamIds: string[];
}

/**
 * Guarda el sorteo que el organizador acaba de ver en pantalla:
 * reparte los equipos en grupos y crea el todos-contra-todos de cada grupo.
 * Rehace la fase de grupos desde cero (borra partidos y goles anteriores).
 */
export async function saveDraw(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  await requireTournament(tournamentId);

  let groups: DrawGroup[];
  try {
    groups = JSON.parse(String(formData.get("groups") ?? "[]"));
  } catch {
    throw new Error("Sorteo no válido");
  }
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error("Sorteo no válido");
  }

  const drawnIds = groups.flatMap((group) => group.teamIds);
  if (new Set(drawnIds).size !== drawnIds.length) {
    throw new Error("Hay equipos repetidos en el sorteo");
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId, id: { in: drawnIds } },
    select: { id: true },
  });
  if (teams.length !== drawnIds.length) {
    throw new Error("Algún equipo no pertenece al torneo");
  }

  // Con fase previa, a los grupos solo entran los que la superaron.
  const full = await getTournamentById(tournamentId);
  if (!full) throw new Error("Torneo no encontrado");
  const prelim = qualifiedFromPrelim(
    full.matches,
    full.teams.map((team) => team.id),
  );
  if (prelim.pending > 0) {
    throw new Error(
      `Faltan ${prelim.pending} cruces de la fase previa por resolver`,
    );
  }
  const eliminated = new Set(prelim.eliminated);
  if (drawnIds.some((teamId) => eliminated.has(teamId))) {
    throw new Error("Hay equipos eliminados en la fase previa dentro del sorteo");
  }
  if (groups.some((group) => group.teamIds.length < 2)) {
    throw new Error("Cada grupo necesita al menos 2 equipos");
  }

  const single = groups.length === 1;
  const matches = groups.flatMap((group) =>
    generateRoundRobinFixture(group.teamIds).map((match) => ({
      tournamentId,
      phase: "GROUP" as const,
      groupName: single ? null : group.name,
      round: match.round,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
    })),
  );

  await prisma.$transaction([
    prisma.match.deleteMany({ where: { tournamentId, phase: "GROUP" } }),
    // Los equipos que no entraron al sorteo se quedan sin grupo.
    prisma.team.updateMany({
      where: { tournamentId },
      data: { groupName: null },
    }),
    ...groups.map((group) =>
      prisma.team.updateMany({
        where: { tournamentId, id: { in: group.teamIds } },
        data: { groupName: single ? null : group.name },
      }),
    ),
    prisma.match.createMany({ data: matches }),
    prisma.tournament.update({
      where: { id: tournamentId },
      data: { groupCount: groups.length },
    }),
  ]);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { slug: true },
  });
  revalidatePath(`/dashboard/${tournamentId}`, "layout");
  if (tournament) revalidatePath(`/torneo/${tournament.slug}`);
  redirect(`/dashboard/${tournamentId}/resultados`);
}

/**
 * Fase previa: eliminatoria a un partido entre los inscritos.
 * Rehacerla borra todo lo que venía después (grupos y fase final), porque
 * esos cruces se armaron con equipos que quizá ya no siguen en el torneo.
 */
export async function savePrelim(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  await requireTournament(tournamentId);

  let pairings: { homeTeamId: string; awayTeamId: string }[];
  try {
    pairings = JSON.parse(String(formData.get("pairings") ?? "[]"));
  } catch {
    throw new Error("Sorteo no válido");
  }
  if (!Array.isArray(pairings) || pairings.length === 0) {
    throw new Error("Hacen falta al menos dos equipos para la fase previa");
  }

  const ids = pairings.flatMap((pair) => [pair.homeTeamId, pair.awayTeamId]);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Hay equipos repetidos en el sorteo");
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId, id: { in: ids } },
    select: { id: true },
  });
  if (teams.length !== ids.length) {
    throw new Error("Algún equipo no pertenece al torneo");
  }

  await prisma.$transaction([
    prisma.match.deleteMany({ where: { tournamentId } }),
    prisma.team.updateMany({
      where: { tournamentId },
      data: { groupName: null },
    }),
    prisma.match.createMany({
      data: pairings.map((pair, index) => ({
        tournamentId,
        phase: "PRELIM" as const,
        label: `Previa ${index + 1}`,
        homeTeamId: pair.homeTeamId,
        awayTeamId: pair.awayTeamId,
      })),
    }),
    prisma.tournament.update({
      where: { id: tournamentId },
      data: { championTeamId: null, status: "ACTIVE", groupCount: 1 },
    }),
  ]);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { slug: true },
  });
  revalidatePath(`/dashboard/${tournamentId}`, "layout");
  if (tournament) revalidatePath(`/torneo/${tournament.slug}`);
  redirect(`/dashboard/${tournamentId}/proximos`);
}
