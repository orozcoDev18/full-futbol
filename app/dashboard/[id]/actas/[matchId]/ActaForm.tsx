"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { MatchEventType } from "@/lib/tournament-engine";
import { saveActa } from "../actions";

interface ActaPlayer {
  id: string;
  name: string;
  number: number;
}

interface ActaTeam {
  id: string;
  name: string;
  players: ActaPlayer[];
}

interface ActaEvent {
  uid: string;
  playerId: string;
  teamId: string;
  type: MatchEventType;
}

const EVENT_ICON: Record<MatchEventType, string> = {
  GOAL: "⚽",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Guardando…" : "Guardar acta"}
    </button>
  );
}

export default function ActaForm({
  tournamentId,
  matchId,
  home,
  away,
  initialHomeGoals,
  initialAwayGoals,
  initialEvents,
  isKnockout,
  initialWinnerTeamId,
}: {
  tournamentId: string;
  matchId: string;
  home: ActaTeam;
  away: ActaTeam;
  initialHomeGoals: number;
  initialAwayGoals: number;
  initialEvents: { playerId: string; teamId: string; type: MatchEventType }[];
  isKnockout: boolean;
  initialWinnerTeamId: string | null;
}) {
  const [events, setEvents] = useState<ActaEvent[]>(() =>
    initialEvents.map((event, i) => ({ ...event, uid: `i${i}` })),
  );
  const [homeGoals, setHomeGoals] = useState(initialHomeGoals);
  const [awayGoals, setAwayGoals] = useState(initialAwayGoals);
  const [winnerTeamId, setWinnerTeamId] = useState(initialWinnerTeamId ?? "");

  const playerName = useMemo(() => {
    const map = new Map<string, string>();
    for (const team of [home, away]) {
      for (const player of team.players) {
        map.set(player.id, `${player.number} ${player.name}`);
      }
    }
    return map;
  }, [home, away]);

  const assigned = (teamId: string) =>
    events.filter((event) => event.type === "GOAL" && event.teamId === teamId)
      .length;

  function addEvent(teamId: string, playerId: string, type: MatchEventType) {
    setEvents((prev) => [
      ...prev,
      { uid: `${Date.now()}-${Math.random()}`, playerId, teamId, type },
    ]);
    if (type !== "GOAL") return;
    if (teamId === home.id) setHomeGoals((goals) => goals + 1);
    else setAwayGoals((goals) => goals + 1);
  }

  function removeEvent(uid: string) {
    const target = events.find((event) => event.uid === uid);
    setEvents((prev) => prev.filter((event) => event.uid !== uid));
    if (!target || target.type !== "GOAL") return;
    if (target.teamId === home.id) {
      setHomeGoals((goals) => Math.max(0, goals - 1));
    } else {
      setAwayGoals((goals) => Math.max(0, goals - 1));
    }
  }

  const teamPanel = (team: ActaTeam) => (
    <section className="card" key={team.id}>
      <header className="mb-2 flex items-center justify-between">
        <h3 className="truncate font-semibold">{team.name}</h3>
        <span className="text-sm text-neutral-500">
          {assigned(team.id)}{" "}
          {assigned(team.id) === 1 ? "gol asignado" : "goles asignados"}
        </span>
      </header>
      {team.players.length === 0 && (
        <p className="text-sm text-amber-400">
          Este equipo no tiene jugadores inscritos.
        </p>
      )}
      <ul className="divide-y divide-neutral-800">
        {team.players.map((player) => {
          const goals = events.filter(
            (event) => event.playerId === player.id && event.type === "GOAL",
          ).length;
          return (
            <li key={player.id} className="flex items-center gap-2 py-2">
              <span className="w-7 shrink-0 text-center text-sm font-bold text-pitch-light">
                {player.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {player.name}
                {goals > 0 && (
                  <span className="ml-1 text-neutral-400">⚽×{goals}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => addEvent(team.id, player.id, "GOAL")}
                className="btn-ghost min-h-10 px-3"
                aria-label={`Gol de ${player.name}`}
              >
                ⚽
              </button>
              <button
                type="button"
                onClick={() => addEvent(team.id, player.id, "YELLOW_CARD")}
                className="btn-ghost min-h-10 px-3"
                aria-label={`Amarilla a ${player.name}`}
              >
                🟨
              </button>
              <button
                type="button"
                onClick={() => addEvent(team.id, player.id, "RED_CARD")}
                className="btn-ghost min-h-10 px-3"
                aria-label={`Roja a ${player.name}`}
              >
                🟥
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );

  return (
    <form action={saveActa} className="space-y-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="homeGoals" value={homeGoals} />
      <input type="hidden" name="awayGoals" value={awayGoals} />
      <input
        type="hidden"
        name="events"
        value={JSON.stringify(
          events.map(({ playerId, teamId, type }) => ({
            playerId,
            teamId,
            type,
          })),
        )}
      />

      <section className="card">
        <div className="flex items-center justify-center gap-3">
          <ScoreBox
            name={home.name}
            goals={homeGoals}
            min={assigned(home.id)}
            onChange={setHomeGoals}
          />
          <span className="text-2xl font-bold text-neutral-600">:</span>
          <ScoreBox
            name={away.name}
            goals={awayGoals}
            min={assigned(away.id)}
            onChange={setAwayGoals}
          />
        </div>
        <p className="mt-2 text-center text-xs text-neutral-500">
          Usa +/- solo para goles sin jugador (en contra o sin identificar).
        </p>
      </section>

      {teamPanel(home)}
      {teamPanel(away)}

      {events.length > 0 && (
        <section className="card">
          <h3 className="mb-2 font-semibold">Eventos del partido</h3>
          <ul className="divide-y divide-neutral-800">
            {events.map((event) => (
              <li
                key={event.uid}
                className="flex items-center gap-2 py-2 text-sm"
              >
                <span className="shrink-0">{EVENT_ICON[event.type]}</span>
                <span className="min-w-0 flex-1 truncate">
                  {playerName.get(event.playerId) ?? "Jugador"}
                </span>
                <button
                  type="button"
                  onClick={() => removeEvent(event.uid)}
                  className="px-2 text-neutral-500"
                  aria-label="Quitar evento"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isKnockout && homeGoals === awayGoals && (
        <section className="card space-y-2 border-amber-500/40">
          <h3 className="font-semibold text-amber-300">
            Empate: ¿quién pasa de ronda?
          </h3>
          <p className="text-xs text-neutral-400">
            En eliminación directa alguien tiene que avanzar (penales, moneda,
            lo que diga el reglamento).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {[home, away].map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setWinnerTeamId(team.id)}
                className={`btn min-w-0 flex-1 ${
                  winnerTeamId === team.id
                    ? "bg-amber-500 text-neutral-950"
                    : "border border-neutral-700 text-neutral-300"
                }`}
              >
                <span className="truncate">{team.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <input type="hidden" name="winnerTeamId" value={winnerTeamId} />

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="status"
            value="PLAYED"
            defaultChecked
            className="h-5 w-5"
          />
          Partido jugado (cuenta para la tabla)
        </label>
        <SubmitButton />
      </div>
    </form>
  );
}

function ScoreBox({
  name,
  goals,
  min,
  onChange,
}: {
  name: string;
  goals: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex-1 text-center">
      <p className="mb-1 truncate text-xs text-neutral-400">{name}</p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, goals - 1))}
          disabled={goals <= min}
          className="btn-ghost h-10 w-10 p-0 text-lg"
          aria-label={`Quitar gol a ${name}`}
        >
          −
        </button>
        <span className="w-10 text-3xl font-bold tabular-nums">{goals}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, goals + 1))}
          className="btn-ghost h-10 w-10 p-0 text-lg"
          aria-label={`Sumar gol a ${name}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
