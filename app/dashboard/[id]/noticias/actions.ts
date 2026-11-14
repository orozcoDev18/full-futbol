"use server";

import { revalidatePath } from "next/cache";
import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";

async function revalidate(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { slug: true },
  });
  revalidatePath(`/dashboard/${tournamentId}/noticias`);
  revalidatePath("/");
  if (tournament) revalidatePath(`/torneo/${tournament.slug}`);
}

export async function createPost(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  await requireTournament(tournamentId);

  if (!title) throw new Error("El titular es obligatorio");
  if (!body) throw new Error("La noticia necesita texto");
  if (title.length > 180) throw new Error("El titular es demasiado largo");

  await prisma.post.create({
    data: { tournamentId, title, body, imageUrl: imageUrl || null },
  });
  await revalidate(tournamentId);
}

export async function deletePost(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  await requireTournament(tournamentId);

  const post = await prisma.post.findFirst({
    where: { id: postId, tournamentId },
  });
  if (!post) throw new Error("Noticia no encontrada");

  await prisma.post.delete({ where: { id: postId } });
  await revalidate(tournamentId);
}
