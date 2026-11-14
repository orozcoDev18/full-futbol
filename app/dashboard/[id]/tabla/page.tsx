import { notFound } from "next/navigation";
import { Empty } from "@/components/MatchList";
import { StandingsTable } from "@/components/Standings";
import { requireUser } from "@/lib/auth";
import { getTournamentById, standingsByGroup } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TablaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const tournament = await getTournamentById(id, user.organizationId);
  if (!tournament) notFound();

  const groups = standingsByGroup(tournament);
  if (tournament.teams.length === 0) {
    return <Empty>Inscribe equipos para ver la tabla.</Empty>;
  }

  return (
    <main className="space-y-6">
      {groups.map((group) => (
        <StandingsTable
          key={group.name ?? "única"}
          rows={group.rows}
          title={group.name ? `Grupo ${group.name}` : undefined}
        />
      ))}
    </main>
  );
}
