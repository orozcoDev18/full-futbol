import Link from "next/link";
import { PHASE_LABEL, type ListMatch } from "@/components/MatchList";

const ORDER = ["QUARTER", "SEMI", "FINAL"];

/** Llave por rondas: en móvil una debajo de otra, en pantalla ancha en columnas. */
export function BracketTree({
  matches,
  actaHrefFor,
  onDelete,
}: {
  matches: ListMatch[];
  actaHrefFor?: (match: ListMatch) => string;
  onDelete?: (match: ListMatch) => React.ReactNode;
}) {
  const phases = ORDER.filter((phase) =>
    matches.some((match) => match.phase === phase),
  );

  return (
    <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
      {phases.map((phase) => (
        <section key={phase} className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            {PHASE_LABEL[phase]}
          </h3>
          <ul className="space-y-2 md:h-full md:justify-around md:gap-3">
            {matches
              .filter((match) => match.phase === phase)
              .map((match) => {
                const pending = !match.homeTeam || !match.awayTeam;
                const played = match.status === "PLAYED";
                const href = actaHrefFor?.(match);
                return (
                  <li
                    key={match.id}
                    className={`rounded-2xl border px-3 py-2.5 ${
                      phase === "FINAL"
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-neutral-800 bg-neutral-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] uppercase tracking-wide text-neutral-500">
                        {match.label ?? PHASE_LABEL[match.phase]}
                      </p>
                      {onDelete?.(match)}
                    </div>
                    <TeamLine
                      name={match.homeTeam?.name}
                      goals={match.homeGoals}
                      played={played}
                      winner={played && match.homeGoals > match.awayGoals}
                    />
                    <TeamLine
                      name={match.awayTeam?.name}
                      goals={match.awayGoals}
                      played={played}
                      winner={played && match.awayGoals > match.homeGoals}
                    />
                    {href && !pending && (
                      <Link
                        href={href}
                        className="mt-1 inline-block text-xs text-pitch-light"
                      >
                        {played ? "Editar acta" : "Cargar acta"}
                      </Link>
                    )}
                    {pending && (
                      <p className="mt-1 text-xs text-neutral-600">
                        Espera a los ganadores de la ronda anterior
                      </p>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TeamLine({
  name,
  goals,
  played,
  winner,
}: {
  name?: string;
  goals: number;
  played: boolean;
  winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span
        className={`min-w-0 truncate text-sm ${
          winner
            ? "font-bold text-white"
            : name
              ? "text-neutral-300"
              : "italic text-neutral-600"
        }`}
      >
        {name ?? "Por definir"}
      </span>
      <span className="shrink-0 text-sm font-bold tabular-nums text-neutral-400">
        {played ? goals : "–"}
      </span>
    </div>
  );
}
