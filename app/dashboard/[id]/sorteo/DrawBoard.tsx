"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { BallFlame } from "@/components/Logo";
import { generateRoundRobinFixture } from "@/lib/tournament-engine";
import { saveDraw } from "./actions";

interface DrawTeam {
  id: string;
  name: string;
}

const GROUP_NAMES = ["A", "B", "C", "D"];
const BALL_MS = 700;
const MATCH_MS = 260;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Guardando…" : "Guardar calendario"}
    </button>
  );
}

export default function DrawBoard({
  tournamentId,
  teams,
}: {
  tournamentId: string;
  teams: DrawTeam[];
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    teams.map((team) => team.id),
  );
  const [groupCount, setGroupCount] = useState(1);
  const [phase, setPhase] = useState<"setup" | "balls" | "fixture" | "done">(
    "setup",
  );
  const [order, setOrder] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [shownMatches, setShownMatches] = useState(0);

  const nameOf = useMemo(() => {
    const map = new Map(teams.map((team) => [team.id, team.name]));
    return (id: string) => map.get(id) ?? "Equipo";
  }, [teams]);

  const maxGroups = Math.max(1, Math.min(4, Math.floor(selected.length / 2)));
  const effectiveGroups = Math.min(groupCount, maxGroups);

  // Reparto serpenteante: el orden de salida decide el grupo.
  const groups = useMemo(() => {
    const buckets: { name: string; teamIds: string[] }[] = Array.from(
      { length: effectiveGroups },
      (_, i) => ({ name: GROUP_NAMES[i], teamIds: [] }),
    );
    order.slice(0, revealed).forEach((teamId, index) => {
      buckets[index % effectiveGroups].teamIds.push(teamId);
    });
    return buckets;
  }, [order, revealed, effectiveGroups]);

  const fixture = useMemo(() => {
    if (revealed < order.length) return [];
    return groups.flatMap((group) =>
      generateRoundRobinFixture(group.teamIds).map((match) => ({
        ...match,
        group: group.name,
      })),
    );
  }, [groups, revealed, order.length]);

  useEffect(() => {
    if (phase === "balls" && revealed < order.length) {
      const timer = setTimeout(() => setRevealed((n) => n + 1), BALL_MS);
      return () => clearTimeout(timer);
    }
    if (phase === "balls" && revealed === order.length) {
      const timer = setTimeout(() => setPhase("fixture"), 500);
      return () => clearTimeout(timer);
    }
    if (phase === "fixture" && shownMatches < fixture.length) {
      const timer = setTimeout(() => setShownMatches((n) => n + 1), MATCH_MS);
      return () => clearTimeout(timer);
    }
    if (phase === "fixture" && shownMatches === fixture.length) {
      setPhase("done");
    }
  }, [phase, revealed, order.length, shownMatches, fixture.length]);

  function start() {
    setOrder(shuffle(selected));
    setRevealed(0);
    setShownMatches(0);
    setPhase("balls");
  }

  function skip() {
    setRevealed(order.length);
    setShownMatches(Number.MAX_SAFE_INTEGER);
    setPhase("done");
  }

  function reset() {
    setPhase("setup");
    setOrder([]);
    setRevealed(0);
    setShownMatches(0);
  }

  const lastOut = revealed > 0 ? order[revealed - 1] : null;
  const drawing = phase === "balls" || phase === "fixture";

  if (phase === "setup") {
    return (
      <div className="space-y-4">
        <section className="card space-y-3">
          <h2 className="ff-wordmark text-xl">Equipos en el bombo</h2>
          <ul className="space-y-1">
            {teams.map((team) => (
              <li key={team.id}>
                <label className="flex min-h-11 items-center gap-3 rounded-xl px-2 active:bg-neutral-800">
                  <input
                    type="checkbox"
                    checked={selected.includes(team.id)}
                    onChange={(event) =>
                      setSelected((prev) =>
                        event.target.checked
                          ? [...prev, team.id]
                          : prev.filter((id) => id !== team.id),
                      )
                    }
                    className="h-5 w-5"
                  />
                  <span className="min-w-0 truncate">{team.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-3">
          <h2 className="ff-wordmark text-xl">Formato</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: maxGroups }, (_, i) => i + 1).map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setGroupCount(count)}
                className={`btn px-4 ${
                  count === effectiveGroups
                    ? "bg-pitch-light text-white"
                    : "border border-neutral-700 text-neutral-300"
                }`}
              >
                {count === 1 ? "Liga única" : `${count} grupos`}
              </button>
            ))}
          </div>
          <p className="text-sm text-neutral-400">
            {selected.length} equipos ·{" "}
            {effectiveGroups === 1
              ? "todos contra todos"
              : `reparto al azar en ${effectiveGroups} grupos`}
            . Al guardar se reemplaza la fase de grupos anterior y sus
            resultados.
          </p>
          <button
            type="button"
            onClick={start}
            disabled={selected.length < 2}
            className="btn-primary w-full text-lg"
          >
            🎲 Iniciar sorteo
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card flex flex-col items-center gap-3 py-6">
        <BallFlame
          className={`h-20 w-16 ${drawing ? "ff-spin" : ""}`}
          idSuffix="draw"
        />
        {lastOut && (
          <p
            key={lastOut}
            className="ff-drop ff-wordmark text-balance text-center text-2xl text-pitch-light"
          >
            {nameOf(lastOut)}
          </p>
        )}
        <p className="text-sm text-neutral-400">
          {phase === "balls"
            ? `Saliendo del bombo… ${revealed}/${order.length}`
            : phase === "fixture"
              ? "Armando el calendario…"
              : "Sorteo terminado"}
        </p>
        {drawing && (
          <button type="button" onClick={skip} className="btn-ghost px-4 text-sm">
            Saltar animación
          </button>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <section key={group.name} className="card">
            <h3 className="ff-wordmark mb-2 text-lg text-pitch-light">
              {effectiveGroups === 1 ? "Equipos" : `Grupo ${group.name}`}
            </h3>
            <ol className="space-y-1">
              {group.teamIds.map((teamId, index) => (
                <li
                  key={teamId}
                  className="ff-drop flex items-center gap-2 rounded-lg bg-neutral-900 px-2 py-1.5 text-sm"
                >
                  <span className="w-5 text-center text-xs text-neutral-500">
                    {index + 1}
                  </span>
                  <span className="min-w-0 truncate">{nameOf(teamId)}</span>
                </li>
              ))}
              {group.teamIds.length === 0 && (
                <li className="px-2 py-1.5 text-sm text-neutral-600">…</li>
              )}
            </ol>
          </section>
        ))}
      </div>

      {fixture.length > 0 && (
        <section className="card">
          <h3 className="ff-wordmark mb-2 text-lg">
            Partidos ({Math.min(shownMatches, fixture.length)}/{fixture.length})
          </h3>
          <ul className="space-y-1.5">
            {fixture.slice(0, shownMatches).map((match, index) => (
              <li
                key={`${match.group}-${index}`}
                className="ff-drop flex items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 text-sm"
              >
                <span className="shrink-0 text-[11px] uppercase text-neutral-500">
                  {effectiveGroups > 1 ? `${match.group}·` : ""}J{match.round}
                </span>
                <span className="min-w-0 flex-1 truncate text-right">
                  {nameOf(match.homeTeamId)}
                </span>
                <span className="shrink-0 font-bold text-neutral-500">vs</span>
                <span className="min-w-0 flex-1 truncate">
                  {nameOf(match.awayTeamId)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === "done" && (
        <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
          <form action={saveDraw}>
            <input type="hidden" name="tournamentId" value={tournamentId} />
            <input
              type="hidden"
              name="groups"
              value={JSON.stringify(groups)}
            />
            <SaveButton />
          </form>
          <button type="button" onClick={reset} className="btn-ghost w-full">
            Repetir sorteo
          </button>
        </div>
      )}
    </div>
  );
}
