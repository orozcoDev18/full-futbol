"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { generateRoundRobinFixture } from "@/lib/tournament-engine";

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
