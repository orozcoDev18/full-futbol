import { notFound } from "next/navigation";
import { Empty } from "@/components/MatchList";
import { requireUser } from "@/lib/auth";
import { getTournamentById } from "@/lib/queries";
import { qualifiedFromPrelim } from "@/lib/tournament-engine";
import DrawBoard from "./DrawBoard";

export const dynamic = "force-dynamic";

export default async function SorteoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const tournament = await getTournamentById(id, user.organizationId);
  if (!tournament) notFound();

  const teams = tournament.teams.map((team) => ({
    id: team.id,
    name: team.name,
  }));

  if (teams.length < 2) {
    return (
      <main>
        <Empty>
          Necesitas al menos 2 equipos inscritos para sortear el calendario.
        </Empty>
      </main>
    );
  }

  const prelim = qualifiedFromPrelim(
    tournament.matches,
    teams.map((team) => team.id),
  );

  return (
    <main>
      <DrawBoard
        tournamentId={id}
        teams={teams}
        qualifiedIds={prelim.qualified}
        eliminatedIds={prelim.eliminated}
        prelimPending={prelim.pending}
        hasPrelim={tournament.matches.some((match) => match.phase === "PRELIM")}
      />
    </main>
  );
}
