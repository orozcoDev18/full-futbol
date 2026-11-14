import { requireUser } from "./auth";
import { prisma } from "./prisma";

/** Tenant del usuario con sesión iniciada. */
export async function getCurrentOrganization() {
  const user = await requireUser();
  return user.organization;
}

/** Lanza si el torneo no pertenece al tenant del usuario. */
export async function requireTournament(tournamentId: string) {
  const org = await getCurrentOrganization();
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: org.id },
  });
  if (!tournament) throw new Error("Torneo no encontrado");
  return tournament;
}
