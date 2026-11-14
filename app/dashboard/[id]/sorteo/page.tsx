import { Empty } from "@/components/MatchList";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import DrawBoard from "./DrawBoard";

export const dynamic = "force-dynamic";

export default async function SorteoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournament(id);

  const teams = await prisma.team.findMany({
    where: { tournamentId: id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (teams.length < 2) {
    return (
      <main>
        <Empty>
          Necesitas al menos 2 equipos inscritos para sortear el calendario.
        </Empty>
      </main>
    );
  }

  return (
    <main>
      <DrawBoard tournamentId={id} teams={teams} />
    </main>
  );
}
