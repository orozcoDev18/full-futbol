"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Dentro de una opción, lo primero que quieres es volver al menú del torneo;
 * solo desde el menú tiene sentido salir a la lista de torneos.
 */
export function TournamentNav({
  tournamentId,
  publicSlug,
}: {
  tournamentId: string;
  publicSlug: string;
}) {
  const pathname = usePathname();
  const hubHref = `/dashboard/${tournamentId}`;
  const inHub = pathname === hubHref;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={inHub ? "/dashboard" : hubHref}
          className="btn-ghost min-h-10 px-3 py-1.5 text-sm"
        >
          ← {inHub ? "Torneos" : "Menú"}
        </Link>
        {!inHub && (
          <Link
            href="/dashboard"
            className="shrink-0 text-sm text-neutral-500 hover:text-neutral-300"
          >
            Torneos
          </Link>
        )}
      </div>
      <Link
        href={`/torneo/${publicSlug}`}
        className="shrink-0 text-sm text-pitch-light underline"
      >
        Web pública
      </Link>
    </div>
  );
}
