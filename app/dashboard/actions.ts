"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrganization, requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { tournamentSlug } from "@/lib/slug";

export async function createTournament(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  if (!name) throw new Error("El nombre del torneo es obligatorio");

  const org = await getCurrentOrganization();
  const tournament = await prisma.tournament.create({
    data: {
      organizationId: org.id,
      name,
      season: season || null,
      venue: venue || null,
      slug: tournamentSlug(name),
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/${tournament.id}/equipos`);
}

/** Edita los datos del torneo: nombre, temporada y cancha habitual. */
export async function updateTournament(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  await requireTournament(tournamentId);

  if (!name) throw new Error("El nombre del torneo es obligatorio");

  const tournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: { name, season: season || null, venue: venue || null },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${tournamentId}`, "layout");
  revalidatePath(`/torneo/${tournament.slug}`);
  revalidatePath("/");
}
