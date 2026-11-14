import { notFound } from "next/navigation";
import { DisciplineList, Empty } from "@/components/MatchList";
import { requireUser } from "@/lib/auth";
import { getTournamentById, tournamentDiscipline } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DisciplinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const tournament = await getTournamentById(id, user.organizationId);
  if (!tournament) notFound();

  const rows = tournamentDiscipline(tournament);
  if (rows.length === 0) {
    return <Empty>Todavía no hay tarjetas cargadas en las actas.</Empty>;
  }

  const sentOff = rows.filter((row) => row.sentOff > 0).length;

  return (
    <main className="space-y-3">
      <p className="text-sm text-neutral-400">
        {rows.length} {rows.length === 1 ? "jugador amonestado" : "jugadores amonestados"}
        {sentOff > 0
          ? ` · ${sentOff} ${sentOff === 1 ? "con expulsión" : "con expulsión"}`
          : ""}
        . Dos amarillas en un mismo partido cuentan como expulsión.
      </p>
      <DisciplineList rows={rows} />
    </main>
  );
}
