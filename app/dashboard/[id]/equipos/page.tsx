import { prisma } from "@/lib/prisma";
import { requireTournament } from "@/lib/org";
import {
  createPlayer,
  createTeam,
  deletePlayer,
  deleteTeam,
  updatePlayer,
  updateTeam,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function EquiposPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournament(id);

  const teams = await prisma.team.findMany({
    where: { tournamentId: id },
    orderBy: { name: "asc" },
    include: { players: { orderBy: { number: "asc" } } },
  });

  return (
    <main className="space-y-6">
      <section className="card space-y-3">
        <h2 className="ff-wordmark text-xl">Inscribir equipo</h2>
        <form action={createTeam} className="space-y-3">
          <input type="hidden" name="tournamentId" value={id} />
          <div>
            <label className="label" htmlFor="team-name">
              Nombre del equipo
            </label>
            <input
              id="team-name"
              name="name"
              required
              maxLength={60}
              placeholder="Deportivo La Esquina"
              className="w-full"
            />
          </div>
          <div>
            <label className="label" htmlFor="team-logo">
              URL del escudo (opcional)
            </label>
            <input
              id="team-logo"
              name="logoUrl"
              type="url"
              placeholder="https://..."
              className="w-full"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Inscribir equipo
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="ff-wordmark text-xl">
          Equipos inscritos{" "}
          <span className="text-neutral-500">({teams.length})</span>
        </h2>

        {teams.length === 0 && (
          <p className="py-6 text-center text-neutral-500">
            Inscribe el primer equipo para empezar.
          </p>
        )}

        {teams.map((team) => (
          <article key={team.id} className="card">
            <header className="flex items-center gap-3">
              {team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.logoUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-sm font-bold">
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{team.name}</p>
                <p className="text-sm text-neutral-400">
                  {team.players.length} jugadores
                  {team.groupName ? ` · Grupo ${team.groupName}` : ""}
                </p>
              </div>
            </header>

            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-neutral-400">
                Editar equipo
              </summary>
              <form action={updateTeam} className="mt-2 space-y-2">
                <input type="hidden" name="tournamentId" value={id} />
                <input type="hidden" name="teamId" value={team.id} />
                <input
                  name="name"
                  required
                  maxLength={60}
                  defaultValue={team.name}
                  className="w-full"
                  aria-label="Nombre del equipo"
                />
                <input
                  name="logoUrl"
                  type="url"
                  defaultValue={team.logoUrl ?? ""}
                  placeholder="URL del escudo"
                  className="w-full"
                  aria-label="Escudo"
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">
                    Guardar cambios
                  </button>
                </div>
              </form>
              <form action={deleteTeam} className="mt-2">
                <input type="hidden" name="tournamentId" value={id} />
                <input type="hidden" name="teamId" value={team.id} />
                <button
                  type="submit"
                  className="btn-ghost w-full text-sm text-red-400"
                >
                  Eliminar {team.name} y sus partidos
                </button>
              </form>
            </details>

            <ul className="mt-3 divide-y divide-neutral-800">
              {team.players.map((player) => (
                <li key={player.id}>
                  <details>
                    <summary className="flex cursor-pointer items-center gap-3 py-2 text-sm">
                      <span className="w-8 shrink-0 text-center font-bold text-pitch-light">
                        {player.number}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {player.name}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-500">
                        {player.document}
                      </span>
                    </summary>
                    <form
                      action={updatePlayer}
                      className="space-y-2 pb-3 pl-8 pr-1"
                    >
                      <input type="hidden" name="tournamentId" value={id} />
                      <input type="hidden" name="playerId" value={player.id} />
                      <div className="flex gap-2">
                        <input
                          name="number"
                          type="number"
                          min={1}
                          max={99}
                          required
                          defaultValue={player.number}
                          className="w-20"
                          aria-label="Dorsal"
                        />
                        <input
                          name="name"
                          required
                          maxLength={60}
                          defaultValue={player.name}
                          className="min-w-0 flex-1"
                          aria-label="Nombre del jugador"
                        />
                      </div>
                      <input
                        name="document"
                        maxLength={30}
                        defaultValue={player.document}
                        placeholder="Documento"
                        className="w-full"
                        aria-label="Documento"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary flex-1">
                          Guardar
                        </button>
                      </div>
                    </form>
                    <form action={deletePlayer} className="pb-3 pl-8 pr-1">
                      <input type="hidden" name="tournamentId" value={id} />
                      <input type="hidden" name="playerId" value={player.id} />
                      <button
                        type="submit"
                        className="btn-ghost w-full text-sm text-red-400"
                      >
                        Eliminar jugador
                      </button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-pitch-light">
                + Agregar jugador
              </summary>
              <form action={createPlayer} className="mt-3 space-y-3">
                <input type="hidden" name="tournamentId" value={id} />
                <input type="hidden" name="teamId" value={team.id} />
                <div className="flex gap-2">
                  <input
                    name="number"
                    type="number"
                    min={1}
                    max={99}
                    required
                    placeholder="N°"
                    className="w-20"
                    aria-label="Dorsal"
                  />
                  <input
                    name="name"
                    required
                    maxLength={60}
                    placeholder="Nombre y apellido"
                    className="min-w-0 flex-1"
                    aria-label="Nombre del jugador"
                  />
                </div>
                <input
                  name="document"
                  maxLength={30}
                  placeholder="Documento"
                  className="w-full"
                  aria-label="Documento"
                />
                <button type="submit" className="btn-primary w-full">
                  Agregar a {team.name}
                </button>
              </form>
            </details>
          </article>
        ))}
      </section>
    </main>
  );
}
