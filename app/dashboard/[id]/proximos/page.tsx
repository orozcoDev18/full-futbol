import Link from "next/link";
import { Empty, PHASE_LABEL } from "@/components/MatchList";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatMatchDate, toLocalInputValue } from "@/lib/schedule";
import { setMatchSchedule, setRoundSchedule } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProximosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await requireTournament(id);

  const matches = await prisma.match.findMany({
    where: { tournamentId: id, status: "SCHEDULED" },
    orderBy: [
      { phase: "asc" },
      { groupName: "asc" },
      { round: "asc" },
      { createdAt: "asc" },
    ],
    include: { homeTeam: true, awayTeam: true },
  });

  if (matches.length === 0) {
    return <Empty>No quedan partidos pendientes.</Empty>;
  }

  const groupMatches = matches.filter((match) => match.phase === "GROUP");
  const knockout = matches.filter((match) => match.phase !== "GROUP");
  const rounds = [
    ...new Set(
      groupMatches.map((match) => `${match.groupName ?? ""}|${match.round ?? 0}`),
    ),
  ];

  return (
    <main className="space-y-7">
      <p className="text-sm text-neutral-400">
        Toca un partido para ponerle día, hora y cancha. Se ve en la web
        pública. Hora de Colombia.
        {tournament.venue
          ? ` La cancha del torneo (${tournament.venue}) viene puesta por defecto.`
          : ""}
      </p>

      {rounds.map((key) => {
        const [groupName, round] = key.split("|");
        const list = groupMatches.filter(
          (match) => `${match.groupName ?? ""}|${match.round ?? 0}` === key,
        );
        return (
          <section key={key}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
              {groupName ? `Grupo ${groupName} · ` : ""}Jornada {round}
            </h3>

            <details className="card mb-2">
              <summary className="cursor-pointer text-sm font-semibold text-pitch-light">
                Programar toda la jornada
              </summary>
              <form action={setRoundSchedule} className="mt-3 space-y-2">
                <input type="hidden" name="tournamentId" value={id} />
                <input type="hidden" name="round" value={round} />
                <input type="hidden" name="groupName" value={groupName} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="min-w-0 flex-1">
                    <span className="label">Primer partido</span>
                    <input
                      name="date"
                      type="datetime-local"
                      required
                      className="w-full"
                    />
                  </label>
                  <label className="sm:w-32">
                    <span className="label">Cada (min)</span>
                    <input
                      name="gap"
                      type="number"
                      min={0}
                      max={600}
                      defaultValue={90}
                      className="w-full"
                    />
                  </label>
                </div>
                <input
                  name="venue"
                  maxLength={60}
                  defaultValue={tournament.venue ?? ""}
                  placeholder="Cancha (opcional)"
                  className="w-full"
                  aria-label="Cancha"
                />
                <button type="submit" className="btn-primary w-full">
                  Programar {list.length}{" "}
                  {list.length === 1 ? "partido" : "partidos"}
                </button>
              </form>
            </details>

            <ul className="space-y-2">
              {list.map((match) => (
                <li key={match.id}>
                  <ScheduleCard
                    tournamentId={id}
                    match={match}
                    defaultVenue={tournament.venue}
                    actaHref={`/dashboard/${id}/actas/${match.id}`}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {knockout.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Eliminatorias
          </h3>
          <ul className="space-y-2">
            {knockout.map((match) => (
              <li key={match.id}>
                <ScheduleCard
                  tournamentId={id}
                  match={match}
                  defaultVenue={tournament.venue}
                  actaHref={
                    match.homeTeam && match.awayTeam
                      ? `/dashboard/${id}/actas/${match.id}`
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

interface ScheduleMatch {
  id: string;
  phase: string;
  label: string | null;
  date: Date | null;
  venue: string | null;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
}

function ScheduleCard({
  tournamentId,
  match,
  defaultVenue,
  actaHref,
}: {
  tournamentId: string;
  match: ScheduleMatch;
  defaultVenue: string | null;
  actaHref?: string;
}) {
  return (
    <details className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-3 py-2.5">
      <summary className="cursor-pointer">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-right text-sm text-neutral-300">
            {match.homeTeam?.name ?? "Por definir"}
          </span>
          <span className="shrink-0 text-sm font-bold text-neutral-500">vs</span>
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-300">
            {match.awayTeam?.name ?? "Por definir"}
          </span>
        </span>
        <span className="mt-1 block text-center text-xs">
          {match.date ? (
            <span className="text-pitch-light">
              {formatMatchDate(match.date)}
              {match.venue ? ` · ${match.venue}` : ""}
            </span>
          ) : (
            <span className="text-amber-400">Sin fecha</span>
          )}
          {match.phase !== "GROUP" && match.label ? (
            <span className="text-neutral-500">
              {" "}
              · {match.label ?? PHASE_LABEL[match.phase]}
            </span>
          ) : null}
        </span>
      </summary>

      <form action={setMatchSchedule} className="mt-3 space-y-2">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <input type="hidden" name="matchId" value={match.id} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="label">Día y hora</span>
            <input
              name="date"
              type="datetime-local"
              defaultValue={toLocalInputValue(match.date)}
              className="w-full"
            />
          </label>
          <label className="min-w-0 flex-1">
            <span className="label">Cancha</span>
            <input
              name="venue"
              maxLength={60}
              defaultValue={match.venue ?? defaultVenue ?? ""}
              placeholder="Cancha del barrio"
              className="w-full"
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" className="btn-primary flex-1">
            Guardar horario
          </button>
          {actaHref && (
            <Link href={actaHref} className="btn-ghost flex-1 text-center">
              Cargar acta
            </Link>
          )}
        </div>
      </form>
    </details>
  );
}
