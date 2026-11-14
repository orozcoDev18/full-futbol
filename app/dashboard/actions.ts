"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrganization } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { tournamentSlug } from "@/lib/slug";

export async function createTournament(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim();
  if (!name) throw new Error("El nombre del torneo es obligatorio");

  const org = await getCurrentOrganization();
  const tournament = await prisma.tournament.create({
    data: {
      organizationId: org.id,
      name,
      season: season || null,
      slug: tournamentSlug(name),
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/${tournament.id}/equipos`);
}
