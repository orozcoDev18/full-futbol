import Link from "next/link";
import type { DisciplineRow, ScorerRow } from "@/lib/tournament-engine";

export const PHASE_LABEL: Record<string, string> = {
  PRELIM: "Fase previa",
  GROUP: "Fase de grupos",
  QUARTER: "Cuartos de final",
  SEMI: "Semifinales",
  FINAL: "Final",
};

export interface ListMatch {
  id: string;
  phase: string;
  groupName: string | null;
  round: number | null;
  label: string | null;
  date: Date | null;
  status: string;
  homeGoals: number;
  awayGoals: number;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
}

export function MatchRow({
  match,
  highlight = false,
  actaHref,
  hideGroup = false,
}: {
  match: ListMatch;
  highlight?: boolean;
  actaHref?: string;
  /** El grupo ya se muestra en la cabecera de la sección. */
  hideGroup?: boolean;
}) {
  const played = match.status === "PLAYED";
  const homeWins = played && match.homeGoals > match.awayGoals;
  const awayWins = played && match.awayGoals > match.homeGoals;
  const pending = !match.homeTeam || !match.awayTeam;
  const caption = [
    match.label,
    match.groupName && !hideGroup ? `Grupo ${match.groupName}` : null,
    match.date
      ? new Intl.DateTimeFormat("es", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(match.date)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`rounded-2xl border px-3 py-3 ${
        highlight
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-neutral-800 bg-neutral-900/60"
      }`}
    >
      {caption && (
        <p className="mb-1 text-[11px] uppercase tracking-wide text-neutral-500">
          {caption}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`min-w-0 flex-1 truncate text-right ${
            homeWins ? "font-bold" : match.homeTeam ? "text-neutral-300" : "italic text-neutral-500"
          }`}
        >
          {match.homeTeam?.name ?? "Por definir"}
        </span>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-sm font-extrabold tabular-nums ${
            played ? "bg-neutral-800" : "bg-transparent text-neutral-500"
          }`}
        >
          {played ? `${match.homeGoals} - ${match.awayGoals}` : "vs"}
        </span>
        <span
          className={`min-w-0 flex-1 truncate ${
            awayWins ? "font-bold" : match.awayTeam ? "text-neutral-300" : "italic text-neutral-500"
          }`}
        >
          {match.awayTeam?.name ?? "Por definir"}
        </span>
        {actaHref && !pending && (
          <Link href={actaHref} className="shrink-0 text-sm text-pitch-light">
            Acta
          </Link>
        )}
      </div>
    </div>
  );
}

/** Partidos de grupos agrupados por jornada (y por grupo si hay más de uno). */
export function MatchesByRound({
  matches,
  actaHrefFor,
}: {
  matches: ListMatch[];
  actaHrefFor?: (match: ListMatch) => string;
}) {
  const keys = [
    ...new Set(
      matches.map((match) => `${match.groupName ?? ""}|${match.round ?? 0}`),
    ),
  ];

  return (
    <div className="space-y-6">
      {keys.map((key) => {
        const [groupName, round] = key.split("|");
        return (
          <section key={key}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
              {groupName ? `Grupo ${groupName} · ` : ""}Jornada {round}
            </h3>
            <ul className="space-y-2">
              {matches
                .filter(
                  (match) =>
                    `${match.groupName ?? ""}|${match.round ?? 0}` === key,
                )
                .map((match) => (
                  <li key={match.id}>
                    <MatchRow
                      match={match}
                      actaHref={actaHrefFor?.(match)}
                      hideGroup
                    />
                  </li>
                ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function ScorersList({ rows }: { rows: ScorerRow[] }) {
  return (
    <ol className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.playerId}
          className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-3 py-3"
        >
          <span
            className={`w-7 shrink-0 text-center font-bold ${
              row.position === 1 ? "text-amber-400" : "text-neutral-500"
            }`}
          >
            {row.position}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {row.playerName}
            </span>
            <span className="block truncate text-xs text-neutral-400">
              {row.teamName}
              {row.number ? ` · N° ${row.number}` : ""}
            </span>
          </span>
          <span className="shrink-0 text-lg font-extrabold tabular-nums text-pitch-light">
            {row.goals}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">
      {children}
    </p>
  );
}

export function DisciplineList({ rows }: { rows: DisciplineRow[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.playerId}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
            row.sentOff > 0
              ? "border-red-500/40 bg-red-500/5"
              : "border-neutral-800 bg-neutral-900/60"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {row.playerName}
              {row.sentOff > 0 && (
                <span className="ml-2 text-xs font-bold uppercase text-red-400">
                  {row.sentOff === 1
                    ? "expulsado"
                    : `${row.sentOff} expulsiones`}
                </span>
              )}
            </span>
            <span className="block truncate text-xs text-neutral-400">
              {row.teamName}
              {row.number ? ` · N° ${row.number}` : ""}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-sm tabular-nums">
            <span className="flex items-center gap-1" title="Amarillas">
              🟨 {row.yellow}
            </span>
            <span className="flex items-center gap-1" title="Rojas">
              🟥 {row.red}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
