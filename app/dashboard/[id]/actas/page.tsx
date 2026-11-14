import Link from "next/link";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PHASE_LABEL: Record<string, string> = {
  GROUP: "Grupos",
  QUARTER: "Cuartos",
  SEMI: "Semifinal",
  FINAL: "Final",
};

export default async function ActasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournament(id);

  const matches = await prisma.match.findMany({
    where: { tournamentId: id },
    orderBy: [{ status: "asc" }, { phase: "asc" }, { round: "asc" }],
    include: { homeTeam: true, awayTeam: true },
  });

  return (
    <main className="space-y-3">
      <h2 className="font-semibold">Actas de partido</h2>
      <p className="text-sm text-neutral-400">
        Elige un partido para cargar goles, tarjetas y resultado.
      </p>

      {matches.length === 0 && (
        <p className="py-6 text-center text-neutral-500">
          Genera el fixture primero.
        </p>
      )}

      <ul className="space-y-2">
        {matches.map((match) => (
          <li key={match.id}>
            <Link
              href={`/dashboard/${id}/actas/${match.id}`}
              className="card block active:bg-neutral-800"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span>
                  {PHASE_LABEL[match.phase]}
                  {match.round ? ` · Jornada ${match.round}` : ""}
                  {match.label ? ` · ${match.label}` : ""}
                </span>
                <span
                  className={
                    match.status === "PLAYED"
                      ? "text-pitch-light"
                      : "text-amber-400"
                  }
                >
                  {match.status === "PLAYED" ? "Cargado" : "Pendiente"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 font-semibold">
                <span className="min-w-0 flex-1 truncate text-right">
                  {match.homeTeam?.name ?? "Por definir"}
                </span>
                <span className="shrink-0 rounded-lg bg-neutral-800 px-2 py-0.5 tabular-nums">
                  {match.status === "PLAYED"
                    ? `${match.homeGoals} - ${match.awayGoals}`
                    : "vs"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {match.awayTeam?.name ?? "Por definir"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
