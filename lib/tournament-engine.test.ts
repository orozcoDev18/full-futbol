import assert from "node:assert/strict";
import {
  buildBracket,
  calculateStandings,
  generateRoundRobinFixture,
  getTopScorers,
  drawPrelim,
  getDisciplineRows,
  matchWinner,
  qualifiedFromPrelim,
  seedOrder,
  sentOffInMatch,
  type EngineEvent,
  type EngineMatch,
} from "./tournament-engine";

// --- Fixture ---
for (const n of [2, 3, 4, 5, 8, 11]) {
  const ids = Array.from({ length: n }, (_, i) => `t${i}`);
  const fixture = generateRoundRobinFixture(ids);
  assert.equal(fixture.length, (n * (n - 1)) / 2, `total de partidos con ${n}`);

  const pairs = new Set(
    fixture.map((m) => [m.homeTeamId, m.awayTeamId].sort().join("|")),
  );
  assert.equal(pairs.size, fixture.length, `sin cruces repetidos con ${n}`);

  const rounds = new Map<number, string[]>();
  for (const m of fixture) {
    const list = rounds.get(m.round) ?? [];
    list.push(m.homeTeamId, m.awayTeamId);
    rounds.set(m.round, list);
  }
  for (const [round, list] of rounds) {
    assert.equal(
      new Set(list).size,
      list.length,
      `jornada ${round} con ${n}: nadie juega dos veces`,
    );
  }
  assert.equal(rounds.size, n % 2 === 0 ? n - 1 : n, `numero de jornadas con ${n}`);
  assert.ok(fixture.every((m) => m.homeTeamId !== m.awayTeamId));
}
assert.deepEqual(generateRoundRobinFixture(["a"]), []);
assert.equal(generateRoundRobinFixture(["a", "a", "b"]).length, 1); // ignora duplicados

// --- Posiciones ---
const teams = [
  { id: "a", name: "Alfa" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
];
const matches: EngineMatch[] = [
  { phase: "GROUP", status: "PLAYED", homeTeamId: "a", awayTeamId: "b", homeGoals: 3, awayGoals: 0 },
  { phase: "GROUP", status: "PLAYED", homeTeamId: "b", awayTeamId: "c", homeGoals: 1, awayGoals: 1 },
  { phase: "GROUP", status: "PLAYED", homeTeamId: "c", awayTeamId: "a", homeGoals: 2, awayGoals: 1 },
  { phase: "GROUP", status: "SCHEDULED", homeTeamId: "a", awayTeamId: "c", homeGoals: 9, awayGoals: 0 },
  { phase: "FINAL", status: "PLAYED", homeTeamId: "a", awayTeamId: "c", homeGoals: 5, awayGoals: 0 },
];
const standings = calculateStandings(matches, teams);
assert.equal(standings.length, 3);
assert.deepEqual(
  standings.map((r) => [r.teamName, r.pj, r.pg, r.pe, r.pp, r.gf, r.gc, r.dg, r.pts]),
  [
    ["Gamma", 2, 1, 1, 0, 3, 2, 1, 4],
    ["Alfa", 2, 1, 0, 1, 4, 2, 2, 3],
    ["Beta", 2, 0, 1, 1, 1, 4, -3, 1],
  ],
  "ignora partidos no jugados y la fase final",
);
assert.deepEqual(standings.map((r) => r.position), [1, 2, 3]);

// Desempate por GF con mismos puntos y mismo DG.
const tie = calculateStandings(
  [
    { phase: "GROUP", status: "PLAYED", homeTeamId: "a", awayTeamId: "b", homeGoals: 2, awayGoals: 1 },
    { phase: "GROUP", status: "PLAYED", homeTeamId: "c", awayTeamId: "b", homeGoals: 1, awayGoals: 0 },
  ],
  teams,
);
assert.equal(tie[0].teamName, "Alfa", "mismo pts y DG, gana el de mas GF");

// Un partido con un equipo ajeno no rompe la tabla.
assert.ok(
  calculateStandings(
    [{ phase: "GROUP", status: "PLAYED", homeTeamId: "a", awayTeamId: "zz", homeGoals: 1, awayGoals: 0 }],
    teams,
  ).every((r) => r.pj === 0),
);

// --- Goleadores ---
const goal = (
  id: string,
  name: string,
  teamId: string,
  teamName: string,
): EngineEvent => ({
  type: "GOAL",
  playerId: id,
  teamId,
  player: { id, name, number: 9 },
  team: { id: teamId, name: teamName },
});
const scorers = getTopScorers([
  goal("p1", "Zoe", "a", "Alfa"),
  goal("p1", "Zoe", "a", "Alfa"),
  goal("p2", "Ana", "b", "Beta"),
  goal("p3", "Bea", "b", "Beta"),
  goal("p3", "Bea", "b", "Beta"),
  { ...goal("p9", "Nadie", "a", "Alfa"), type: "YELLOW_CARD" },
]);
assert.deepEqual(
  scorers.map((s) => [s.playerName, s.goals, s.position]),
  [
    ["Bea", 2, 1],
    ["Zoe", 2, 2],
    ["Ana", 1, 3],
  ],
  "ordena por goles, desempata por nombre e ignora tarjetas",
);
assert.equal(getTopScorers([], 5).length, 0);
assert.equal(getTopScorers([goal("p1", "Zoe", "a", "Alfa")], 0).length, 0);

// --- Llaves de eliminación directa ---
assert.deepEqual(seedOrder(2), [1, 2]);
assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);
assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6], "siembra clásica");

const eight = Array.from({ length: 8 }, (_, i) => `s${i + 1}`);
const bracket = buildBracket(eight);
assert.equal(bracket.length, 7, "8 equipos = 4 cuartos + 2 semis + 1 final");
assert.equal(bracket.filter((m) => m.phase === "QUARTER").length, 4);
assert.equal(bracket.filter((m) => m.phase === "SEMI").length, 2);
assert.equal(bracket.filter((m) => m.phase === "FINAL").length, 1);

const quarters = bracket.filter((m) => m.phase === "QUARTER");
assert.deepEqual(
  quarters.map((m) => [m.homeTeamId, m.awayTeamId]),
  [
    ["s1", "s8"],
    ["s4", "s5"],
    ["s2", "s7"],
    ["s3", "s6"],
  ],
  "el 1 cruza con el 8 y los favoritos no se ven antes de la final",
);

// Rondas posteriores vacías y enlazadas de dos en dos.
assert.ok(
  bracket
    .filter((m) => m.phase !== "QUARTER")
    .every((m) => m.homeTeamId === null && m.awayTeamId === null),
);
assert.deepEqual(
  quarters.map((m) => [m.nextKey, m.nextSlot]),
  [
    ["SEMI-0", "HOME"],
    ["SEMI-0", "AWAY"],
    ["SEMI-1", "HOME"],
    ["SEMI-1", "AWAY"],
  ],
);
const final = bracket.find((m) => m.phase === "FINAL");
assert.equal(final?.nextKey, null, "la final no alimenta a nadie");
assert.equal(
  bracket.filter((m) => m.nextKey === final?.key).length,
  2,
  "las dos semis llegan a la final",
);

// Un cuadro de 4 solo tiene semis y final; uno de 2, solo la final.
assert.deepEqual(
  buildBracket(["a", "b", "c", "d"])
    .filter((m) => m.phase === "SEMI")
    .map((m) => [m.homeTeamId, m.awayTeamId]),
  [
    ["a", "d"],
    ["b", "c"],
  ],
);
assert.equal(buildBracket(["a", "b"]).length, 1);
assert.throws(() => buildBracket(["a", "b", "c"]), /2, 4 u 8/);
// Con huecos sin cubrir la llave se arma igual.
assert.deepEqual(buildBracket(["a", null, "c", null])[0], {
  key: "SEMI-0",
  phase: "SEMI",
  label: "Semifinal 1",
  homeTeamId: "a",
  awayTeamId: null,
  nextKey: "FINAL-0",
  nextSlot: "HOME",
});

// --- Ganador ---
const ko = {
  status: "PLAYED" as const,
  homeTeamId: "a",
  awayTeamId: "b",
  homeGoals: 2,
  awayGoals: 1,
};
assert.equal(matchWinner(ko), "a");
assert.equal(matchWinner({ ...ko, homeGoals: 0, awayGoals: 3 }), "b");
assert.equal(
  matchWinner({ ...ko, homeGoals: 1, awayGoals: 1 }),
  null,
  "empate sin definir no da ganador",
);
assert.equal(
  matchWinner({ ...ko, homeGoals: 1, awayGoals: 1, winnerTeamId: "b" }),
  "b",
  "empate resuelto por el organizador",
);
assert.equal(
  matchWinner({ ...ko, status: "SCHEDULED" }),
  null,
  "un partido sin jugar no tiene ganador",
);

// --- Fase previa ---
assert.deepEqual(drawPrelim(["a", "b", "c", "d"]), {
  pairings: [
    { homeTeamId: "a", awayTeamId: "b" },
    { homeTeamId: "c", awayTeamId: "d" },
  ],
  byeTeamId: null,
});
assert.deepEqual(drawPrelim(["a", "b", "c"]).byeTeamId, "c", "el impar pasa directo");
assert.equal(drawPrelim(["a"]).pairings.length, 0);

const prelim = (
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number,
  status: "PLAYED" | "SCHEDULED" = "PLAYED",
  winnerTeamId?: string,
): EngineMatch & { winnerTeamId?: string } => ({
  phase: "PRELIM",
  status,
  homeTeamId: home,
  awayTeamId: away,
  homeGoals,
  awayGoals,
  winnerTeamId,
});

// Sin previa creada pasan todos.
assert.deepEqual(
  qualifiedFromPrelim([], ["a", "b", "c"]),
  { qualified: ["a", "b", "c"], eliminated: [], pending: 0 },
);

const prelimResult = qualifiedFromPrelim(
  [
    prelim("a", "b", 2, 0),
    prelim("c", "d", 1, 1, "PLAYED", "d"),
    prelim("e", "f", 0, 0, "SCHEDULED"),
  ],
  ["a", "b", "c", "d", "e", "f", "g"],
);
assert.deepEqual(
  prelimResult.qualified,
  ["a", "d", "g"],
  "ganadores más el que no jugó previa",
);
assert.deepEqual(prelimResult.eliminated, ["b", "c"]);
assert.equal(prelimResult.pending, 1, "el cruce sin jugar queda pendiente");

// --- Disciplina ---
const card = (
  type: "YELLOW_CARD" | "RED_CARD",
  id: string,
  name: string,
  matchId: string,
): EngineEvent & { matchId: string } => ({
  type,
  playerId: id,
  teamId: "a",
  matchId,
  player: { id, name, number: 5 },
  team: { id: "a", name: "Alfa" },
});

const discipline = getDisciplineRows([
  card("YELLOW_CARD", "p1", "Ana", "m1"),
  card("YELLOW_CARD", "p1", "Ana", "m1"), // doble amarilla: expulsada
  card("YELLOW_CARD", "p2", "Bea", "m1"),
  card("YELLOW_CARD", "p2", "Bea", "m2"), // amarillas en partidos distintos
  card("RED_CARD", "p3", "Cris", "m2"),
  goal("p9", "Zoe", "a", "Alfa"), // los goles no cuentan aquí
]);
assert.deepEqual(
  discipline.map((r) => [r.playerName, r.yellow, r.red, r.sentOff]),
  [
    ["Cris", 0, 1, 1],
    ["Ana", 2, 0, 1],
    ["Bea", 2, 0, 0],
  ],
  "expulsados primero (la roja directa antes que la doble amarilla)",
);
assert.deepEqual(discipline.map((r) => r.position), [1, 2, 3]);
assert.equal(getDisciplineRows([]).length, 0);
assert.equal(getDisciplineRows(discipline.length ? [] : [], 3).length, 0);

assert.deepEqual(
  [...sentOffInMatch([
    { type: "YELLOW_CARD", playerId: "p1" },
    { type: "YELLOW_CARD", playerId: "p1" },
    { type: "YELLOW_CARD", playerId: "p2" },
    { type: "RED_CARD", playerId: "p3" },
  ])].sort(),
  ["p1", "p3"],
  "una sola amarilla no expulsa",
);

console.log("tournament-engine: todo OK");
