import { notFound } from "next/navigation";
import { Empty, ScorersList } from "@/components/MatchList";
import { requireUser } from "@/lib/auth";
import { getTournamentById, tournamentScorers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GoleadoresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const tournament = await getTournamentById(id, user.organizationId);
  if (!tournament) notFound();

  const scorers = tournamentScorers(tournament);
  if (scorers.length === 0) {
    return <Empty>Todavía no hay goles cargados en las actas.</Empty>;
  }

  return (
    <main>
      <ScorersList rows={scorers} />
    </main>
  );
}
