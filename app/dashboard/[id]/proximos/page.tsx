import { Empty, MatchesByRound, MatchRow, PHASE_LABEL } from "@/components/MatchList";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProximosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournament(id);

  const matches = await prisma.match.findMany({
    where: { tournamentId: id, status: "SCHEDULED" },
    orderBy: [{ date: "asc" }, { phase: "asc" }, { groupName: "asc" }, { round: "asc" }],
    include: { homeTeam: true, awayTeam: true },
  });

  if (matches.length === 0) {
    return <Empty>No quedan partidos pendientes.</Empty>;
  }

  const group = matches.filter((match) => match.phase === "GROUP");
  const knockout = matches.filter((match) => match.phase !== "GROUP");

  return (
    <main className="space-y-6">
      <MatchesByRound
        matches={group}
        actaHrefFor={(match) => `/dashboard/${id}/actas/${match.id}`}
      />
      {knockout.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Fase final
          </h3>
          <ul className="space-y-2">
            {knockout.map((match) => (
              <li key={match.id}>
                <MatchRow
                  match={{
                    ...match,
                    label: match.label ?? PHASE_LABEL[match.phase],
                  }}
                  actaHref={`/dashboard/${id}/actas/${match.id}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
