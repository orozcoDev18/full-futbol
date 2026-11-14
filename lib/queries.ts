import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  calculateStandings,
  getTopScorers,
  type StandingRow,
} from "./tournament-engine";

const FULL_INCLUDE = {
  championTeam: true,
  teams: { orderBy: { name: "asc" } },
  matches: {
    orderBy: [
      { phase: "asc" },
      { groupName: "asc" },
      { round: "asc" },
      { date: "asc" },
    ],
    include: {
      homeTeam: true,
      awayTeam: true,
      events: {
        include: {
          player: { select: { id: true, name: true, number: true } },
          team: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.TournamentInclude;

export type FullTournament = NonNullable<
  Awaited<ReturnType<typeof getTournamentById>>
>;

export function getTournamentById(id: string, organizationId?: string) {
  return prisma.tournament.findFirst({
    where: { id, ...(organizationId ? { organizationId } : {}) },
    include: FULL_INCLUDE,
  });
}

export function getTournamentBySlug(slug: string) {
  return prisma.tournament.findUnique({
    where: { slug },
    include: FULL_INCLUDE,
  });
}

/**
 * Tablas de posiciones: una por grupo si el torneo tiene grupos,
 * o una sola con todos los equipos si no.
 */
export function standingsByGroup(
  tournament: FullTournament,
): { name: string | null; rows: StandingRow[] }[] {
  const groups = [
    ...new Set(tournament.teams.map((team) => team.groupName ?? null)),
  ].sort((a, b) => (a ?? "").localeCompare(b ?? "", "es"));

  if (groups.length <= 1) {
    return [
      {
        name: groups[0] ?? null,
        rows: calculateStandings(tournament.matches, tournament.teams),
      },
    ];
  }

  return groups.map((name) => ({
    name,
    rows: calculateStandings(
      tournament.matches.filter((match) => (match.groupName ?? null) === name),
      tournament.teams.filter((team) => (team.groupName ?? null) === name),
    ),
  }));
}

export function tournamentScorers(tournament: FullTournament, limit?: number) {
  return getTopScorers(
    tournament.matches.flatMap((match) => match.events),
    limit,
  );
}

/**
 * Equipos clasificados a la fase final, ordenados por siembra:
 * primero todos los líderes de grupo, luego todos los segundos, etc.
 * Devuelve huecos (null) si no hay equipos suficientes.
 */
export function seedFromStandings(
  tournament: FullTournament,
  size: number,
): (string | null)[] {
  const groups = standingsByGroup(tournament);
  const seeded: string[] = [];

  const deepest = Math.max(...groups.map((group) => group.rows.length), 0);
  for (let position = 0; position < deepest; position++) {
    for (const group of groups) {
      const row = group.rows[position];
      if (row) seeded.push(row.teamId);
    }
  }

  return Array.from({ length: size }, (_, i) => seeded[i] ?? null);
}
