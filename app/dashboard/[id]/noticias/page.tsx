import { requireTournament } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { createPost, deletePost } from "./actions";

export const dynamic = "force-dynamic";

export default async function NoticiasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournament(id);

  const posts = await prisma.post.findMany({
    where: { tournamentId: id },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="space-y-5">
      <section className="card space-y-3">
        <h2 className="ff-wordmark text-xl">Publicar noticia</h2>
        <form action={createPost} className="space-y-3">
          <input type="hidden" name="tournamentId" value={id} />
          <input
            name="title"
            required
            maxLength={180}
            placeholder="Titular"
            className="w-full"
            aria-label="Titular"
          />
          <textarea
            name="body"
            required
            rows={5}
            placeholder="Cuerpo de la noticia…"
            className="w-full"
            aria-label="Cuerpo"
          />
          <input
            name="imageUrl"
            type="url"
            placeholder="URL de imagen (opcional)"
            className="w-full"
            aria-label="Imagen"
          />
          <button type="submit" className="btn-primary w-full">
            📰 Publicar
          </button>
          <p className="text-xs text-neutral-500">
            Se ve sin iniciar sesión, en la portada pública y en la pestaña
            Noticias del torneo.
          </p>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="ff-wordmark text-xl">Publicadas ({posts.length})</h2>
        {posts.map((post) => (
          <article key={post.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold">{post.title}</h3>
                <p className="text-xs text-neutral-500">
                  {new Intl.DateTimeFormat("es", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(post.publishedAt)}
                </p>
              </div>
              <form action={deletePost}>
                <input type="hidden" name="tournamentId" value={id} />
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  className="btn-ghost px-3 text-sm text-red-400"
                >
                  Borrar
                </button>
              </form>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
              {post.body}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
