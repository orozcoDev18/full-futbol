import { notFound } from "next/navigation";
import { TournamentNav } from "@/components/TournamentNav";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const tournament = await prisma.tournament.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!tournament) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-5">
      <header className="mb-5">
        <TournamentNav tournamentId={id} publicSlug={tournament.slug} />
        <h1 className="ff-wordmark mt-3 text-2xl leading-none sm:text-3xl">
          {tournament.name}
        </h1>
        <p className="text-xs text-neutral-500">
          {tournament.season ?? "Sin temporada"} ·{" "}
          {tournament.status === "FINISHED" ? "Finalizado" : "En juego"}
        </p>
      </header>

      {children}
    </div>
  );
}
