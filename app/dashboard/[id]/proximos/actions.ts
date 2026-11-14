"use server";

import { revalidatePath } from "next/cache";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { parseLocalDateTime } from "@/lib/schedule";

async function revalidate(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { slug: true },
  });
  revalidatePath(`/dashboard/${tournamentId}`, "layout");
  if (tournament) revalidatePath(`/torneo/${tournament.slug}`);
}

/** Fecha, hora y cancha de un partido. Vaciar la fecha lo deja sin programar. */
export async function setMatchSchedule(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  const dateValue = String(formData.get("date") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  await requireTournament(tournamentId);

  const match = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
  });
  if (!match) throw new Error("Partido no encontrado");

  const date = parseLocalDateTime(dateValue);
  if (dateValue && !date) throw new Error("Fecha no válida");

  await prisma.match.update({
    where: { id: matchId },
    data: { date, venue: venue || null },
  });
  await revalidate(tournamentId);
}

/**
 * Programa una jornada entera: el primer partido a la hora indicada y el
 * resto cada X minutos, en el mismo lugar.
 */
export async function setRoundSchedule(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const round = Number(formData.get("round"));
  const groupName = String(formData.get("groupName") ?? "").trim() || null;
  const dateValue = String(formData.get("date") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const gap = Number(formData.get("gap") || 90);
  await requireTournament(tournamentId);

  const start = parseLocalDateTime(dateValue);
  if (!start) throw new Error("Pon la fecha y hora del primer partido");
  if (!Number.isInteger(gap) || gap < 0 || gap > 600) {
    throw new Error("Los minutos entre partidos deben ir de 0 a 600");
  }

  const matches = await prisma.match.findMany({
    where: { tournamentId, phase: "GROUP", round, groupName },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (matches.length === 0) throw new Error("Esa jornada no tiene partidos");

  await prisma.$transaction(
    matches.map((match, index) =>
      prisma.match.update({
        where: { id: match.id },
        data: {
          date: new Date(start.getTime() + index * gap * 60_000),
          venue: venue || null,
        },
      }),
    ),
  );
  await revalidate(tournamentId);
}
