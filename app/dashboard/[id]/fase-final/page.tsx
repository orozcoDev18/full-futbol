import { notFound } from "next/navigation";
import { Empty } from "@/components/MatchList";
import { knockoutMatches } from "@/lib/bracket";
import { requireUser } from "@/lib/auth";
import { getTournamentById } from "@/lib/queries";
import {
  createKnockoutMatch,
  deleteMatch,
  generateBracket,
  setChampion,
} from "./actions";
import { BracketTree } from "./BracketTree";

export const dynamic = "force-dynamic";

export default async function FaseFinalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const tournament = await getTournamentById(id, user.organizationId);
  if (!tournament) notFound();

  const teams = tournament.teams;
  const matches = await knockoutMatches(id);
  const sizes = [2, 4, 8].filter((size) => size <= teams.length);

  return (
    <main className="space-y-5">
      <section className="card space-y-3">
        <h2 className="ff-wordmark text-xl">Generar llave</h2>
        <p className="text-sm text-neutral-400">
          Arma cuartos, semis y final de una vez, sembrando con la tabla (los
          primeros de cada grupo primero). Después, cada acta que guardes manda
          al ganador a la ronda siguiente sola, y el que gane la final queda
          como campeón.
        </p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <form key={size} action={generateBracket}>
              <input type="hidden" name="tournamentId" value={id} />
              <input type="hidden" name="size" value={size} />
              <button type="submit" className="btn-primary">
                {size === 2 ? "Solo final" : `Llave de ${size}`}
              </button>
            </form>
          ))}
        </div>
        {matches.length > 0 && (
          <p className="text-xs text-amber-400">
            Generar de nuevo borra la fase final actual y sus resultados.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="ff-wordmark text-xl">Llave</h2>
        {matches.length === 0 ? (
          <Empty>Todavía no hay cruces de fase final.</Empty>
        ) : (
          <BracketTree
            matches={matches}
            actaHrefFor={(match) => `/dashboard/${id}/actas/${match.id}`}
            onDelete={(match) => (
              <form action={deleteMatch}>
                <input type="hidden" name="tournamentId" value={id} />
                <input type="hidden" name="matchId" value={match.id} />
                <button
                  type="submit"
                  className="px-1 text-neutral-600"
                  aria-label="Eliminar cruce"
                >
                  ✕
                </button>
              </form>
            )}
          />
        )}
      </section>

      <details className="card">
        <summary className="ff-wordmark cursor-pointer text-xl">
          Añadir un cruce suelto
        </summary>
        <form action={createKnockoutMatch} className="mt-3 space-y-3">
          <input type="hidden" name="tournamentId" value={id} />
          <div>
            <label className="label" htmlFor="phase">
              Fase
            </label>
            <select id="phase" name="phase" className="w-full" required>
              <option value="QUARTER">Cuartos de final</option>
              <option value="SEMI">Semifinal</option>
              <option value="FINAL">Final</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label className="label" htmlFor="homeTeamId">
                Local
              </label>
              <select id="homeTeamId" name="homeTeamId" className="w-full" required>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1">
              <label className="label" htmlFor="awayTeamId">
                Visitante
              </label>
              <select id="awayTeamId" name="awayTeamId" className="w-full" required>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label className="label" htmlFor="label">
                Etiqueta
              </label>
              <input
                id="label"
                name="label"
                maxLength={40}
                placeholder="Repechaje"
                className="w-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <label className="label" htmlFor="date">
                Fecha
              </label>
              <input id="date" name="date" type="datetime-local" className="w-full" />
            </div>
          </div>
          <button type="submit" className="btn-ghost w-full" disabled={teams.length < 2}>
            Crear cruce
          </button>
        </form>
      </details>

      <section className="card space-y-3">
        <h2 className="ff-wordmark text-xl">Campeón del torneo</h2>
        <form action={setChampion} className="space-y-3">
          <input type="hidden" name="tournamentId" value={id} />
          <select
            name="championTeamId"
            defaultValue={tournament.championTeamId ?? ""}
            className="w-full"
            aria-label="Equipo campeón"
          >
            <option value="">Sin campeón (torneo activo)</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-ghost w-full">
            🏆 Marcar campeón a mano
          </button>
          <p className="text-xs text-neutral-500">
            Si hay final en la llave, el campeón se actualiza solo al guardar su
            acta; esto es solo para torneos sin fase final.
          </p>
        </form>
      </section>
    </main>
  );
}
