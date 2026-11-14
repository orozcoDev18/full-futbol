/**
 * Motor del torneo: puro, sin Prisma ni I/O.
 * Acepta tipos estructurales, así que los objetos de Prisma encajan tal cual.
 */

export type MatchPhase = "PRELIM" | "GROUP" | "QUARTER" | "SEMI" | "FINAL";
export type MatchStatus = "SCHEDULED" | "PLAYED";
export type MatchEventType = "GOAL" | "YELLOW_CARD" | "RED_CARD";

export interface FixtureMatch {
  round: number;
  homeTeamId: string;
  awayTeamId: string;
}

export interface EngineTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface EngineMatch {
  phase: MatchPhase;
  status: MatchStatus;
  /** Null en una llave cuyo cruce todavía no tiene equipos. */
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number;
  awayGoals: number;
}

export interface EngineEvent {
  type: MatchEventType;
  playerId: string;
  teamId: string;
  player?: { id: string; name: string; number: number } | null;
  team?: { id: string; name: string } | null;
}

export interface StandingRow {
  teamId: string;
  teamName: string;
  logoUrl?: string | null;
  position: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export interface ScorerRow {
  position: number;
  playerId: string;
  playerName: string;
  number?: number;
  teamId: string;
  teamName: string;
  goals: number;
}

export const POINTS_WIN = 3;
export const POINTS_DRAW = 1;

/**
 * Round robin (todos contra todos, una vuelta) por el método del círculo.
 * Con número impar de equipos se añade un BYE y esa pareja se descarta,
 * así cada jornada deja a un equipo libre.
 */
export function generateRoundRobinFixture(teamIds: string[]): FixtureMatch[] {
  const ids = [...new Set(teamIds)];
  if (ids.length < 2) return [];

  const BYE = "__BYE__";
  const slots = ids.length % 2 === 0 ? [...ids] : [...ids, BYE];
  const n = slots.length;
  const rounds = n - 1;
  const half = n / 2;

  const fixture: FixtureMatch[] = [];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const a = slots[i];
      const b = slots[n - 1 - i];
      if (a === BYE || b === BYE) continue;
      // Alternamos localía para que no sea siempre local el mismo equipo.
      const swap = (round + i) % 2 === 1;
      fixture.push({
        round: round + 1,
        homeTeamId: swap ? b : a,
        awayTeamId: swap ? a : b,
      });
    }
    // Rotación: el primer slot queda fijo, el resto gira.
    const fixed = slots[0];
    const rest = slots.slice(1);
    rest.unshift(rest.pop() as string);
    slots.splice(0, n, fixed, ...rest);
  }

  return fixture;
}

/**
 * Tabla de posiciones de la fase de grupos.
 * Solo cuenta partidos GROUP ya jugados. Desempate: Pts, DG, GF, nombre.
 */
export function calculateStandings(
  matches: EngineMatch[],
  teams: EngineTeam[],
): StandingRow[] {
  const table = new Map<string, StandingRow>();

  for (const team of teams) {
    table.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      logoUrl: team.logoUrl ?? null,
      position: 0,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
    });
  }

  for (const match of matches) {
    if (match.phase !== "GROUP" || match.status !== "PLAYED") continue;
    const home = match.homeTeamId ? table.get(match.homeTeamId) : undefined;
    const away = match.awayTeamId ? table.get(match.awayTeamId) : undefined;
    if (!home || !away) continue; // equipo borrado o ajeno al torneo

    home.pj++;
    away.pj++;
    home.gf += match.homeGoals;
    home.gc += match.awayGoals;
    away.gf += match.awayGoals;
    away.gc += match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.pg++;
      away.pp++;
      home.pts += POINTS_WIN;
    } else if (match.homeGoals < match.awayGoals) {
      away.pg++;
      home.pp++;
      away.pts += POINTS_WIN;
    } else {
      home.pe++;
      away.pe++;
      home.pts += POINTS_DRAW;
      away.pts += POINTS_DRAW;
    }
  }

  const rows = [...table.values()];
  for (const row of rows) row.dg = row.gf - row.gc;

  rows.sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      a.teamName.localeCompare(b.teamName, "es"),
  );
  rows.forEach((row, i) => {
    row.position = i + 1;
  });

  return rows;
}

/** Ranking de goleadores. Desempate: goles, nombre. */
export function getTopScorers(
  events: EngineEvent[],
  limit?: number,
): ScorerRow[] {
  const byPlayer = new Map<string, ScorerRow>();

  for (const event of events) {
    if (event.type !== "GOAL") continue;
    const current = byPlayer.get(event.playerId);
    if (current) {
      current.goals++;
      continue;
    }
    byPlayer.set(event.playerId, {
      position: 0,
      playerId: event.playerId,
      playerName: event.player?.name ?? "Jugador",
      number: event.player?.number,
      teamId: event.teamId,
      teamName: event.team?.name ?? "",
      goals: 1,
    });
  }

  const rows = [...byPlayer.values()].sort(
    (a, b) =>
      b.goals - a.goals || a.playerName.localeCompare(b.playerName, "es"),
  );
  rows.forEach((row, i) => {
    row.position = i + 1;
  });

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

// --- Fase final (llaves) ---

export type BracketSlot = "HOME" | "AWAY";

export interface BracketMatch {
  key: string;
  phase: MatchPhase;
  label: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextKey: string | null;
  nextSlot: BracketSlot | null;
}

export const BRACKET_SIZES = [2, 4, 8] as const;
export type BracketSize = (typeof BRACKET_SIZES)[number];

const PHASE_BY_ROUNDS_LEFT: MatchPhase[] = ["FINAL", "SEMI", "QUARTER"];
const LABEL_BY_PHASE: Record<string, string> = {
  QUARTER: "Cuartos",
  SEMI: "Semifinal",
  FINAL: "Final",
};

/**
 * Orden de siembra clásico: el 1 cruza con el último, y los favoritos
 * solo pueden encontrarse en la última ronda. seedOrder(8) = 1,8,4,5,2,7,3,6.
 */
export function seedOrder(size: number): number[] {
  if (size < 2) return [1];
  if (size === 2) return [1, 2];
  return seedOrder(size / 2).flatMap((seed) => [seed, size + 1 - seed]);
}

/**
 * Arma una llave de eliminación directa con los equipos ya ordenados por
 * clasificación (el primero es el mejor sembrado). Los partidos de rondas
 * posteriores nacen vacíos y enlazados al anterior.
 */
export function buildBracket(seededTeamIds: (string | null)[]): BracketMatch[] {
  const size = seededTeamIds.length;
  if (!BRACKET_SIZES.includes(size as BracketSize)) {
    throw new Error("La llave debe ser de 2, 4 u 8 equipos");
  }

  const order = seedOrder(size);
  const rounds = Math.log2(size);
  const matches: BracketMatch[] = [];

  // Primera ronda: pares consecutivos del orden de siembra.
  let previousKeys: string[] = [];
  for (let round = 0; round < rounds; round++) {
    const phase = PHASE_BY_ROUNDS_LEFT[rounds - 1 - round];
    const count = size / 2 ** (round + 1);
    const keys: string[] = [];

    for (let i = 0; i < count; i++) {
      const key = `${phase}-${i}`;
      keys.push(key);
      matches.push({
        key,
        phase,
        label: count === 1 ? "Final" : `${LABEL_BY_PHASE[phase]} ${i + 1}`,
        homeTeamId:
          round === 0 ? (seededTeamIds[order[i * 2] - 1] ?? null) : null,
        awayTeamId:
          round === 0 ? (seededTeamIds[order[i * 2 + 1] - 1] ?? null) : null,
        nextKey: null,
        nextSlot: null,
      });
    }

    // Enlaza la ronda anterior con esta: dos partidos alimentan uno.
    previousKeys.forEach((previousKey, index) => {
      const source = matches.find((match) => match.key === previousKey);
      if (!source) return;
      source.nextKey = keys[Math.floor(index / 2)];
      source.nextSlot = index % 2 === 0 ? "HOME" : "AWAY";
    });
    previousKeys = keys;
  }

  return matches;
}

/**
 * Ganador de un partido ya jugado: por marcador, o el que el organizador
 * marcó como clasificado si acabó empatado. null si todavía no hay ganador.
 */
export function matchWinner(match: {
  status: MatchStatus;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number;
  awayGoals: number;
  winnerTeamId?: string | null;
}): string | null {
  if (match.status !== "PLAYED") return null;
  if (match.homeGoals > match.awayGoals) return match.homeTeamId;
  if (match.awayGoals > match.homeGoals) return match.awayTeamId;
  return match.winnerTeamId ?? null;
}

// --- Fase previa (eliminatoria a un partido antes de los grupos) ---

export interface PrelimPairing {
  homeTeamId: string;
  awayTeamId: string;
}

export interface PrelimDraw {
  pairings: PrelimPairing[];
  /** Con número impar de equipos, uno pasa a los grupos sin jugar. */
  byeTeamId: string | null;
}

/** Empareja de dos en dos en el orden recibido (el bombo ya viene barajado). */
export function drawPrelim(teamIds: string[]): PrelimDraw {
  const ids = [...new Set(teamIds)];
  const pairings: PrelimPairing[] = [];
  for (let i = 0; i + 1 < ids.length; i += 2) {
    pairings.push({ homeTeamId: ids[i], awayTeamId: ids[i + 1] });
  }
  return {
    pairings,
    byeTeamId: ids.length % 2 === 1 ? ids[ids.length - 1] : null,
  };
}

export interface PrelimResult {
  /** Equipos con sitio en la fase de grupos. */
  qualified: string[];
  /** Equipos que perdieron su previa. */
  eliminated: string[];
  /** Cruces de la previa todavía sin resolver. */
  pending: number;
}

/**
 * Quién pasa de la fase previa a los grupos: el ganador de cada cruce más
 * los equipos que no jugaron previa (los que se quedaron sin pareja).
 * Sin fase previa creada, pasan todos.
 */
export function qualifiedFromPrelim(
  matches: EngineMatch[],
  teamIds: string[],
): PrelimResult {
  const prelims = matches.filter((match) => match.phase === "PRELIM");
  if (prelims.length === 0) {
    return { qualified: [...teamIds], eliminated: [], pending: 0 };
  }

  const played = new Set<string>();
  const qualified: string[] = [];
  const eliminated: string[] = [];
  let pending = 0;

  for (const match of prelims) {
    const { homeTeamId, awayTeamId } = match;
    if (homeTeamId) played.add(homeTeamId);
    if (awayTeamId) played.add(awayTeamId);

    const winner = matchWinner(match);
    if (!winner) {
      pending++;
      continue;
    }
    qualified.push(winner);
    const loser = winner === homeTeamId ? awayTeamId : homeTeamId;
    if (loser) eliminated.push(loser);
  }

  // Los que no entraron al sorteo de la previa pasan directos.
  for (const teamId of teamIds) {
    if (!played.has(teamId)) qualified.push(teamId);
  }

  return { qualified, eliminated, pending };
}

// --- Disciplina ---

export interface DisciplineRow {
  position: number;
  playerId: string;
  playerName: string;
  number?: number;
  teamId: string;
  teamName: string;
  yellow: number;
  red: number;
  /** Rojas directas más las dobles amarillas del mismo partido. */
  sentOff: number;
}

/**
 * Tarjetas por jugador. Dos amarillas en un mismo partido cuentan como
 * expulsión, igual que en la cancha.
 */
export function getDisciplineRows(
  events: (EngineEvent & { matchId?: string })[],
  limit?: number,
): DisciplineRow[] {
  const byPlayer = new Map<string, DisciplineRow>();
  const yellowsPerMatch = new Map<string, number>();

  for (const event of events) {
    if (event.type === "GOAL") continue;

    let row = byPlayer.get(event.playerId);
    if (!row) {
      row = {
        position: 0,
        playerId: event.playerId,
        playerName: event.player?.name ?? "Jugador",
        number: event.player?.number,
        teamId: event.teamId,
        teamName: event.team?.name ?? "",
        yellow: 0,
        red: 0,
        sentOff: 0,
      };
      byPlayer.set(event.playerId, row);
    }

    if (event.type === "RED_CARD") {
      row.red++;
      row.sentOff++;
      continue;
    }

    row.yellow++;
    const key = `${event.playerId}|${event.matchId ?? ""}`;
    const inMatch = (yellowsPerMatch.get(key) ?? 0) + 1;
    yellowsPerMatch.set(key, inMatch);
    // La segunda amarilla del mismo partido es expulsión.
    if (inMatch === 2) row.sentOff++;
  }

  const rows = [...byPlayer.values()].sort(
    (a, b) =>
      b.sentOff - a.sentOff ||
      b.red - a.red ||
      b.yellow - a.yellow ||
      a.playerName.localeCompare(b.playerName, "es"),
  );
  rows.forEach((row, i) => {
    row.position = i + 1;
  });

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

/** Jugadores expulsados en un partido concreto (roja o doble amarilla). */
export function sentOffInMatch(
  events: { type: MatchEventType; playerId: string }[],
): Set<string> {
  const yellows = new Map<string, number>();
  const out = new Set<string>();

  for (const event of events) {
    if (event.type === "RED_CARD") {
      out.add(event.playerId);
      continue;
    }
    if (event.type !== "YELLOW_CARD") continue;
    const count = (yellows.get(event.playerId) ?? 0) + 1;
    yellows.set(event.playerId, count);
    if (count >= 2) out.add(event.playerId);
  }

  return out;
}
