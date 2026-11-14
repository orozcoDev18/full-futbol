"use server";

import { revalidatePath } from "next/cache";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";

function revalidate(tournamentId: string) {
  revalidatePath(`/dashboard/${tournamentId}`, "layout");
}

export async function createTeam(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  await requireTournament(tournamentId);
  if (!name) throw new Error("El nombre del equipo es obligatorio");

  const existing = await prisma.team.findFirst({
    where: { tournamentId, name },
  });
  if (existing) throw new Error(`Ya hay un equipo llamado "${name}"`);

  await prisma.team.create({
    data: { tournamentId, name, logoUrl: logoUrl || null },
  });
  revalidate(tournamentId);
}

export async function createPlayer(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const document = String(formData.get("document") ?? "").trim();
  const number = Number(formData.get("number"));
  await requireTournament(tournamentId);

  if (!name) throw new Error("El nombre del jugador es obligatorio");
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    throw new Error("El dorsal debe ser un número entre 1 y 99");
  }

  const team = await prisma.team.findFirst({ where: { id: teamId, tournamentId } });
  if (!team) throw new Error("Equipo no encontrado");

  const taken = await prisma.player.findFirst({ where: { teamId, number } });
  if (taken) throw new Error(`El dorsal ${number} ya está usado en ${team.name}`);

  await prisma.player.create({ data: { teamId, name, number, document } });
  revalidate(tournamentId);
}

export async function deletePlayer(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const playerId = String(formData.get("playerId") ?? "");
  await requireTournament(tournamentId);

  const player = await prisma.player.findFirst({
    where: { id: playerId, team: { tournamentId } },
  });
  if (!player) throw new Error("Jugador no encontrado");

  await prisma.player.delete({ where: { id: playerId } });
  revalidate(tournamentId);
}

/** Borra el equipo con sus jugadores, partidos y eventos (cascada del schema). */
export async function deleteTeam(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  await requireTournament(tournamentId);

  const team = await prisma.team.findFirst({ where: { id: teamId, tournamentId } });
  if (!team) throw new Error("Equipo no encontrado");

  await prisma.$transaction([
    // Si era el campeón, hay que soltar la referencia antes de borrarlo.
    prisma.tournament.updateMany({
      where: { championTeamId: teamId },
      data: { championTeamId: null, status: "ACTIVE" },
    }),
    prisma.team.delete({ where: { id: teamId } }),
  ]);
  revalidate(tournamentId);
}

export async function updateTeam(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  await requireTournament(tournamentId);

  if (!name) throw new Error("El nombre del equipo es obligatorio");

  const team = await prisma.team.findFirst({ where: { id: teamId, tournamentId } });
  if (!team) throw new Error("Equipo no encontrado");

  const taken = await prisma.team.findFirst({
    where: { tournamentId, name, id: { not: teamId } },
  });
  if (taken) throw new Error(`Ya hay otro equipo llamado "${name}"`);

  await prisma.team.update({
    where: { id: teamId },
    data: { name, logoUrl: logoUrl || null },
  });
  revalidate(tournamentId);
}

export async function updatePlayer(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const playerId = String(formData.get("playerId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const document = String(formData.get("document") ?? "").trim();
  const number = Number(formData.get("number"));
  await requireTournament(tournamentId);

  if (!name) throw new Error("El nombre del jugador es obligatorio");
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    throw new Error("El dorsal debe ser un número entre 1 y 99");
  }

  const player = await prisma.player.findFirst({
    where: { id: playerId, team: { tournamentId } },
    include: { team: true },
  });
  if (!player) throw new Error("Jugador no encontrado");

  const taken = await prisma.player.findFirst({
    where: { teamId: player.teamId, number, id: { not: playerId } },
  });
  if (taken) {
    throw new Error(`El dorsal ${number} ya está usado en ${player.team.name}`);
  }

  await prisma.player.update({
    where: { id: playerId },
    data: { name, number, document },
  });
  revalidate(tournamentId);
}
